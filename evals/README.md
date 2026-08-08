# Behavior Evals

Regression tests for plugin *behavior* — headless Claude Code sessions that check a plugin skill or hook actually does what it claims (e.g. an ambiguous request gets clarified instead of implemented directly). This is the runtime counterpart to the structural `verify` skill, which only checks plugin file layout and metadata.

## Prerequisites

- `claude` CLI on `PATH`
- `git`
- Network access and an API key configured for `claude -p` — each trial is a real headless session and costs tokens

## Usage

```bash
./run.sh                     # run every scenario under scenarios/
./run.sh skill-map-injection # run one (or more) scenarios by name
KEEP_WORK=1 ./run.sh <name>  # keep the trial workdirs and output files for inspection
```

Trials within a scenario run in parallel; scenarios run one after another. The script exits 0 only if every scenario passes, and prints a PASS/FAIL summary with a trial breakdown (e.g. `2/3`) at the end.

## Scenario format

Each scenario is a directory under `scenarios/<name>/` with two files:

### `scenario.conf`

A shell snippet sourced by `run.sh`. Variables:

| Variable | Required | Default | Meaning |
| --- | --- | --- | --- |
| `PROMPT` | yes | — | prompt passed to `claude -p` |
| `TRIALS` | yes | — | number of independent trials |
| `PASS_MIN` | yes | — | trials that must pass for the scenario to PASS |
| `MODEL` | no | `sonnet` | `--model` value |
| `MAX_TURNS` | no | `15` | `--max-turns` value |
| `PERMISSION_MODE` | no | (unset) | if set, passed as `--permission-mode` |
| `OUTPUT_FORMAT` | no | `text` | `text` or `stream-json` (adds `--output-format stream-json --verbose`) |
| `FIXTURE` | no | (unset) | name of a directory under `fixtures/` to seed the trial workdir with (git-initialized before the run) |

### `check.sh`

Invoked as `REPO_ROOT=<repo root> bash check.sh <output-file> <workdir>`. Exit 0 means the trial passed; any other exit code means it failed. Keep checks mechanical (grep on the transcript, `git status --porcelain`, functional tests on files in `<workdir>`) rather than judgment calls, since a scenario runs multiple trials to absorb model variance.

## Adding a scenario

1. Create `scenarios/<name>/scenario.conf` and `scenarios/<name>/check.sh`.
2. If the trial needs starting files, add a fixture under `fixtures/<name>/` and reference it via `FIXTURE`.
3. Run `./run.sh <name>` a few times with `KEEP_WORK=1` to confirm the check is reliable before trusting `PASS_MIN`.

## Current scenarios

- `skill-map-injection` — the `<engineering-skills>` block from `plugins/engineering/hooks/skill-map.md` is actually injected into the session context.
- `ambiguous-request-gate` — an ambiguous one-line feature request gets a clarifying question instead of a direct implementation.
- `grill-non-software` — the `grill` skill fires for a non-software personal decision, not just software requests.
- `clear-spec-no-overblock` — a fully-specified, scoped request gets implemented directly, without over-blocking on clarification (control case).

## Cost and timing

A full run spawns roughly 10 headless `claude -p` sessions and costs API tokens. Run it after changes that affect plugin behavior (skills, hooks, guidance text); skip it for structural-only changes (use the `verify` skill instead). It is intentionally not wired into CI for the same cost reason.
