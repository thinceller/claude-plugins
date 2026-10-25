#!/usr/bin/env bash
# Blocks Bash only for the probe subagent, to check that a plugin-level hook can scope itself by agent_type.
input=$(cat)
if grep -q '"agent_type" *: *"[^"]*probe-agent"' <<<"$input"; then
  echo "PROBE-HOOK-BLOCKED (agent_type matched)" >&2
  exit 2
fi
exit 0
