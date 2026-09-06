# writing

Writing skills. Currently one: `plain-japanese`.

## Skill catalog

| Skill | Purpose |
| --- | --- |
| `plain-japanese` | Writes and revises Japanese prose in plain, commonly understood words — no coined terms — so it reads easily. |

`plain-japanese` is a norm catalog, not a workflow. It states what to do and what not to do across six areas: word choice (the core — no invented compounds, no unexplained jargon), sentence construction, document structure, cutting redundancy, avoiding the phrasings LLMs mass-produce, and a final read-through checklist. `references/plain-words.md` holds the substitution tables and before/after examples.

It applies to Japanese prose of a few paragraphs or more — documents, READMEs, articles, reports, meeting notes, announcements, and text posted through external tools. Short conversational replies, code, and commit messages are out of scope.

## Design stance

The skill deliberately does not fix a register. 敬体 and 常体 both have their place depending on the document; the skill only requires consistency within one document. This is what makes it general-purpose rather than a technical-writing style guide.

There are no lint scripts. Word choice, comma placement, and modifier distance are judgment calls that a threshold cannot make, and a checker that fires on false positives trains you to ignore it. The final section is a read-through checklist for that reason, and it says outright that the items are material for judgment, not rules to apply mechanically — a uniform rewrite flattens the natural unevenness the original prose had.

There's no `SessionStart` hook. The skill surfaces itself through its description when Japanese prose is actually being written.
