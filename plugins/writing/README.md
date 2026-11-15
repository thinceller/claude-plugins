# writing

Writing skills and a term-rule hook. One skill, `plain-japanese`, plus hooks that inject Japanese technical-term rules into every session and subagent.

## Skill catalog

| Skill | Purpose |
| --- | --- |
| `plain-japanese` | Writes and revises Japanese prose in plain, commonly understood words — no coined terms, no translated-away technical terms — so it reads easily. |

`plain-japanese` is a norm catalog, not a workflow. It states what to do and what not to do across six areas: word choice (the core — no invented compounds, no unexplained jargon, established technical terms left untranslated), sentence construction, document structure, cutting redundancy, avoiding the phrasings LLMs mass-produce, and a final read-through checklist. `references/plain-words.md` holds the substitution tables and before/after examples.

It applies to Japanese prose of a few paragraphs or more — documents, READMEs, articles, reports, meeting notes, announcements, and text posted through external tools. Short conversational replies, code, and commit messages are out of scope.

## Design stance

The skill deliberately does not fix a register. 敬体 and 常体 both have their place depending on the document; the skill only requires consistency within one document. This is what makes it general-purpose rather than a technical-writing style guide.

There are no lint scripts. Word choice, comma placement, and modifier distance are judgment calls that a threshold cannot make, and a checker that fires on false positives trains you to ignore it. The final section is a read-through checklist for that reason, and it says outright that the items are material for judgment, not rules to apply mechanically — a uniform rewrite flattens the natural unevenness the original prose had.

## Term rules injected by hooks

Recent models write Japanese with translations a Japanese web engineer never uses: 版 for version, 表 for a database table, 列 for a column. The skill cannot stop this on its own. Its description excludes short conversational replies, so it never loads in conversation, and a skill is read only when it triggers. Term choice has to hold in every Japanese output, so it is carried by hooks instead.

- `SessionStart` (startup, resume, clear, compact, fork) prints `context/terms.md`.
- `SubagentStart` returns the same text as `additionalContext` through `hooks/subagent-context.sh`, because a subagent ignores a hook's plain stdout.

`context/terms.md` is about ten lines: who the reader is, the terms to leave untranslated with the translation to avoid, a guard against over-correcting (最新版, 一覧表, and the 表/列/行 of Markdown and spreadsheets stay), and a fallback to the English spelling. It is read every session, so it stays short. The skill keeps the fuller treatment: section 1 limits katakana reduction to business words, and `references/plain-words.md` repeats the term table.

The terms in `context/terms.md` and the "訳さない技術用語" table in `references/plain-words.md` are kept identical. Add a term to both.
