# release-gate

Use this skill for repeatable pre-push hygiene in this project.

## When to Use

- Before push to `main`.
- After finishing a feature/fix that changes gameplay, UI, or docs.

## Steps

1. Run required gate:
   - `node tools/combat-harness.js`
2. If content/balance data changed (`js/content-data.js`, `js/balance-data.js`, `js/balance-presets.js`, `js/config.js` relevant sections), also run:
   - `node tools/validate-content-data.js`
3. Ensure TODO bookkeeping is updated:
   - active items in `todo/backlog/*`
   - completed blocks in `todo/done/hotove-veci.md`
4. Commit and push.

## Commit Notes

- Hooks update `js/version.js` and append build tag to commit message.
- Avoid manually forcing final build tag in commit message if hook handles it.

## Output Checklist

- Report:
  - test commands run
  - pass/fail result
  - touched TODO files
  - commit hash and push status
