<engineering-skills>
Software-engineering skills are installed. They are loosely coupled:
enter at any point, skip any step, none is mandatory. Consider one when
the situation fits.

- grill — one-question-at-a-time interview to sharpen a plan, decision, or idea (not limited to software)
- write-spec — synthesize the conversation into a spec (no interview)
- write-plan — turn agreed work into self-contained, subagent-ready tasks
- implement — orchestrate execution: fresh subagent per task, subagent review between tasks
- diagnose-bug — feedback-loop-first debugging for hard bugs and regressions
- tdd — test-first at pre-agreed seams (default approach; opting out is fine)
- review-changes — two-axis review (spec + standards) via parallel subagents
- verify-before-done — run verification and read the output before claiming done
- prototype — throwaway code that answers a design question
- record-adr — record decisions that are costly to reverse
- setup-engineering — configure per-repo doc placement (user runs /setup-engineering)

Typical feature flow: grill → write-spec → write-plan → implement.
Typical bug flow: diagnose-bug → fix (implement for larger fixes).

An ambiguous one-line request ("X したい") is not yet an agreement.
Investigation settles facts; decisions and scope boundaries — including
docs and CI the change touches — belong to the user. Surface them before
entering implement: one grill question or a few summary lines is enough.
"My investigation settled everything" is the thought to catch.

If .claude/engineering.local.md exists, follow its doc-placement settings
for specs, plans, and ADRs.
</engineering-skills>
