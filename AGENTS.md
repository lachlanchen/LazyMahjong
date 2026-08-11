# Mahjong repository guidance

This directory is an independently publishable Mahjong teaching product.

- Deterministic TypeScript owns tiles, wall order, legal actions, state changes,
  redaction, completion checks, and persistence.
- Candidate IDs bind the full state token, actor, and canonical action. Never
  accept a coordinate, tile, or model suggestion as mutation authority.
- Render only `publicView(...)`; do not expose another seat's hand, wall order,
  seed, or private evaluation.
- Keep exact, calculated, authored, engine, model, and analogy evidence visibly
  labeled. Unsupported profile scoring must stay conspicuous.
- Learner text belongs in stable `en`, `zh-Hans`, and `ja` message catalogs.
- Engines and weights live only under ignored `.local/` and must match reviewed
  pins before use.
- Run `npm run check`, `git diff --check`, and a separate authorized browser
  review before release. Do not create or control sibling repositories here.
