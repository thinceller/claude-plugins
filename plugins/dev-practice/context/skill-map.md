<dev-practice-skills>
dev-practice skills and agents are installed. The skills are loosely
coupled: enter at any point, skip any step, none is mandatory.

Skills:
- grill — one-question-at-a-time interview to sharpen a plan, decision, or idea (not limited to software)
- write-plan — turn agreed work into self-contained, subagent-ready tasks
- implement — orchestrate execution: fresh subagent per task, subagent review between tasks
- tdd — test-first at pre-agreed seams (default approach; opting out is fine)
- verify-before-done — run verification and read the output before claiming done

Agents:
- dev-practice:explorer — read-only investigation (Haiku)
- dev-practice:worker — executes an agreed spec faithfully (Opus)
- dev-practice:reviewer — fresh-context adversarial review of a finished diff (Opus, read-only)

Typical feature flow: grill → write-plan → implement → dev-practice:reviewer.
</dev-practice-skills>
