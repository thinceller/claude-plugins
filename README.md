# thinceller-claude-plugins

A collection of Claude Code marketplace plugins.

## Installation

Add this marketplace in Claude Code:

```
/plugin marketplace add thinceller/claude-plugins
```

Then install a plugin:

```
/plugin install git-toolkit@thinceller-claude-plugins
/plugin install engineering@thinceller-claude-plugins
/plugin install ddd@thinceller-claude-plugins
/plugin install writing@thinceller-claude-plugins
```

## Plugins

| Plugin | Skills | Purpose |
| --- | --- | --- |
| [git-toolkit](./plugins/git-toolkit) | `commit-staged-changes`, `auto-group-commit`, `create-pr`, `resolve-merge-conflicts` | Streamlines the git workflow: commits staged changes with an auto-generated message, splits a working tree into semantic commits at hunk granularity, opens GitHub pull requests, and resolves merge and rebase conflicts. |
| [engineering](./plugins/engineering) | `grill`, `write-spec`, `write-plan`, `implement`, `diagnose-bug`, `tdd`, `review-changes`, `verify-before-done`, `prototype`, `record-adr`, `setup-engineering` | Loosely-coupled software engineering skills — interview-driven design, spec and plan writing, subagent implementation loops, debugging, TDD, and review disciplines. Enter at any point; none is mandatory. |
| [ddd](./plugins/ddd) | `event-storming`, `derive-types` | Discovers a domain through an Event Storming interview, then derives value types, state unions, workflow signatures, and error types from the agreed model. |
| [writing](./plugins/writing) | `plain-japanese` | Writes and revises Japanese prose in plain, commonly understood words — no coined terms — so it reads easily. |

Each plugin's README covers its skills and design stance in detail.

## License

[MIT](./LICENSE)
