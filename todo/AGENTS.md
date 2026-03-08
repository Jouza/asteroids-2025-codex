# AGENTS.md (todo/)

This file applies to `todo/` subtree.

## TODO Data Hygiene

- `todo/backlog/*`:
  - active and planned work only.
- `todo/done/hotove-veci.md`:
  - completed blocks and historical achievements.

## Move Rules

- If a whole block is fully complete, move it from backlog to done.
- Keep partial blocks in backlog, mark sub-items `[x]` / `[ ]` accurately.
- Do not keep duplicate completed blocks in both backlog and done.

## Update Rules

- Any gameplay/mechanic/documentation change should be reflected in TODO files in the same commit.
- Preserve concise, actionable phrasing.
- Keep ASCII text style consistent with current repository content.
