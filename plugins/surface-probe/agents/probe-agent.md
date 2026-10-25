---
name: probe-agent
description: Temporary probe subagent. Use only when explicitly asked to run the surface probe.
tools: Read, Bash
---

Reply with exactly `PROBE-AGENT-OK`, then run the Bash command `echo probe` once and report its result (output, or the error message if the call was blocked) verbatim on the next line. Do nothing else.
