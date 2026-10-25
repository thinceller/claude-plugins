#!/usr/bin/env bash
# PreToolUse guard for read-only subagents (explorer, reviewer): block non-read-only Bash commands.
# Receives the hook JSON on stdin. Exit 2 blocks the tool call (stderr is shown
# to the agent), exit 0 allows it. False positives are acceptable: this is a
# behavioral guard, not a security boundary (these agents have no Edit/Write tools).
set -uo pipefail

input=$(cat)

# A plugin hook runs for every Bash call in the session, including the main
# conversation and dev-practice:worker, so it has to scope itself.
agent=$(grep -oE '"agent_type" *: *"dev-practice:(explorer|reviewer)"' <<<"$input" | sed -E 's/.*"(dev-practice:[a-z]+)"$/\1/')
[ -z "$agent" ] && exit 0

deny() {
  echo "$agent is read-only: '$1' is not allowed. Use Read/Glob/Grep or a read-only command (rg, ls, find, cat, sed -n, git log/show/diff/status, ...)." >&2
  exit 2
}

# jq may be missing in cloud sessions.
if command -v jq >/dev/null 2>&1; then
  cmd=$(jq -r '.tool_input.command // empty' <<<"$input" 2>/dev/null || true)
elif command -v python3 >/dev/null 2>&1; then
  cmd=$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' <<<"$input" 2>/dev/null || true)
else
  deny "Bash (neither jq nor python3 is available to check the command)"
fi
[ -z "$cmd" ] && exit 0

# Command substitution runs arbitrary commands inside otherwise allowed ones,
# and the quote stripping below would hide it.
case "$cmd" in
  *'$('*|*'`'*) deny "command substitution" ;;
esac

# Strip quoted strings: they commonly contain '>' or separators (e.g. rg "->")
# that would confuse the naive checks below. The first word of a segment is
# never quoted, so the allowlist check is unaffected.
scrubbed=$(sed -E "s/'[^']*'//g"' ; s/"[^"]*"//g' <<<"$cmd")
# Scrub harmless stderr/null redirections (2>&1, 2>/dev/null, >/dev/null),
# which are common in read-only usage. Any remaining '>' writes a file.
scrubbed=$(sed -E 's@[0-9]*>&[0-9]+@@g; s@[0-9]*> */dev/null@@g' <<<"$scrubbed")
case "$scrubbed" in
  *'>'*) deny "output redirection" ;;
esac

# Note: no 'env' (env VAR=x cmd runs arbitrary commands); printenv covers reads.
allowed='cd rg grep egrep fgrep ls find fd cat head tail wc file stat tree du df which type printenv echo printf awk sed sort uniq cut tr column diff comm jq yq basename dirname realpath readlink date'
git_allowed='log show diff status blame branch remote ls-files grep rev-parse describe shortlog tag reflog'

# Flags that make an allowed command write or run something. Checked on the
# raw command because awk programs are usually quoted.
has_flag() { grep -qE -- "(^|[[:space:]])($1)([[:space:]=]|$)" <<<"$2"; }

# Check the first word of each pipeline/sequence segment. Splitting on |;& is
# naive (also splits inside quotes) but errs on the side of blocking.
while IFS= read -r segment; do
  segment="${segment#"${segment%%[![:space:]]*}"}"
  # Leading VAR=value assignments only set the environment of the command after them.
  while [[ "$segment" =~ ^[A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*[[:space:]]+(.*)$ ]]; do
    segment="${BASH_REMATCH[1]}"
  done
  [ -z "$segment" ] && continue
  [[ "$segment" =~ ^[A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*$ ]] && continue
  first=${segment%% *}
  first=${first##*/}
  case "$first" in
    find) has_flag '-delete|-exec|-execdir|-ok|-okdir|-fprint|-fprint0|-fprintf|-fls' "$segment" && deny "find with an action that writes or executes" ;;
    sort) has_flag '-o|--output' "$segment" && deny "sort -o" ;;
    sed) has_flag '-i[^[:space:]]*|--in-place' "$segment" && deny "sed -i" ;;
    awk) grep -qE 'system[[:space:]]*\(|\|[[:space:]]*getline|print[^;]*>' <<<"$cmd" && deny "awk running commands or writing files" ;;
  esac
  case " $allowed " in
    *" $first "*) continue ;;
  esac
  if [ "$first" = "git" ]; then
    # Skip global options so `git -C <repo> log` and `git --no-pager diff` read the subcommand.
    read -ra words <<<"$segment"
    i=1
    while [ "$i" -lt "${#words[@]}" ]; do
      case "${words[$i]}" in
        -C|-c) i=$((i + 2)) ;;
        -*) i=$((i + 1)) ;;
        *) break ;;
      esac
    done
    sub=${words[$i]:-}
    rest="${words[*]:$((i + 1))}"
    case " $git_allowed " in
      *" $sub "*) ;;
      *) deny "git $sub" ;;
    esac
    has_flag '--output|--output-directory' "$rest" && deny "git $sub --output"
    case "$sub" in
      branch|tag) has_flag '-d|-D|-m|-M|-c|-C|-f|--delete|--move|--copy|--force|--set-upstream-to|-u|--unset-upstream|--edit-description' "$rest" && deny "git $sub changing refs"
        # A bare name argument creates a branch or tag; only listing forms are allowed.
        [ -n "$rest" ] && ! has_flag '-l|--list|-a|--all|-r|--remotes|-v|-vv|--verbose|-n[0-9]*|--contains|--no-contains|--points-at|--merged|--no-merged|--sort|--show-current|--format' "$rest" && deny "git $sub creating a ref" ;;
      remote) case "${rest%% *}" in ''|-v|--verbose|show|get-url) ;; *) deny "git remote ${rest%% *}" ;; esac ;;
    esac
    continue
  fi
  deny "$first"
done < <(tr '|;&' '\n' <<<"$scrubbed")

exit 0
