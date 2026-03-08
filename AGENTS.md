# AGENTS.md

Project-level instructions for Codex agents working in this repository.

## Scope

- This file applies to the whole repository, unless a deeper `AGENTS.md` overrides parts of it.

## Build and Test Commands

- Required before push to `main`:
  - `node tools/combat-harness.js`
- Required when content/balance data changed:
  - `node tools/validate-content-data.js`

TODO:
- Canonical local run command is not explicitly documented in-repo (no `package.json` scripts found). Confirm preferred serve/run command with maintainers.

## Git and Commit Workflow

- Branch workflow in this project is direct-to-`main`.
- Always run the required test gate(s) before commit/push.
- Do not edit `js/version.js` manually unless explicitly requested.
  - `.githooks/pre-commit` regenerates `js/version.js` and stages it.
  - `.githooks/prepare-commit-msg` appends `[build:YYYYMM.DD.HHMM]` to commit messages.
- Commit messages:
  - Write a clear action summary.
  - Do not manually add final build tag if hook is active (to avoid duplicates).

## Constraints / "Do Not Touch"

- Keep architecture:
  - vanilla JS + Canvas + data-driven config/content model.
- Do not break core combat rule:
  - actions consume energy and shield pool; without shield cost action is blocked.
- Keep hangar UX primary mapping:
  - arrows + space + enter; legacy keys are fallback only.
- Keep TODO structure:
  - active items in `todo/backlog/*`
  - completed items in `todo/done/hotove-veci.md`

## Working on Larger Changes

- Use small, reviewable increments:
  1. Read relevant systems and TODO/backlog entries.
  2. Implement one priority slice at a time.
  3. Update help docs when mechanic behavior changes.
  4. Update TODO/backlog/done status in the same change set.
  5. Run required tests and summarize results.

- Prefer minimal-invasive changes:
  - avoid broad refactors unless explicitly requested.

## Handoff Summary (for long tasks)

When finishing a multi-step task, include:

1. What changed (feature/fix summary).
2. Files touched (grouped by system).
3. Test commands run and outcomes.
4. TODO/backlog/done updates.
5. Remaining risks / follow-up TODOs.

## Safe Commit Approval Rules (Proposal)

If command approvals are used, prefer narrow allow-rules:

- `["git", "add"]`
- `["git", "commit"]`
- `["git", "push", "origin", "main"]`

Avoid broad rules that enable unrelated operations.

## Unknowns to Confirm

TODO:
- Confirm canonical dev server command for local manual QA run.
- Confirm whether `tools/validate-content-data.js` should be mandatory for every commit or only content/balance edits (current docs say conditional).
