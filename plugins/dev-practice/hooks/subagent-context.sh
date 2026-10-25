#!/usr/bin/env bash
# SubagentStart hook: give every subagent the working discipline. SubagentStart
# ignores plain stdout, so the text goes out as hookSpecificOutput.additionalContext.
set -uo pipefail

file="${CLAUDE_PLUGIN_ROOT}/context/discipline.md"
[ -f "$file" ] || exit 0

if command -v jq >/dev/null 2>&1; then
  jq -Rs '{hookSpecificOutput: {hookEventName: "SubagentStart", additionalContext: .}}' "$file"
else
  python3 -c 'import json,sys; print(json.dumps({"hookSpecificOutput": {"hookEventName": "SubagentStart", "additionalContext": open(sys.argv[1]).read()}}))' "$file"
fi
