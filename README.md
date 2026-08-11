# Four Winds · Mahjong decision teacher

A self-contained React/Vite TypeScript teaching table for learning Mahjong one
decision at a time. It supports a deterministic beginner draw/discard loop and
clearly selectable Japanese Riichi, Chinese Official/MCR, and Hong Kong
profiles. Unsupported advanced scoring is visible before and during play.

## What is authoritative now

- seeded 136-tile wall with four unique copies of every tile type;
- four seats, active-seat authority, legal draws/discards, sequential call
  windows, chi/chow, pon/pung, kan/kong, ron and tsumo shape completion;
- standard and seven-pairs completion, exact waits, visible-copy ukeire, a
  comparative shape index, and visible river facts;
- opaque state-bound candidate IDs, non-mutating preview, explicit confirmation,
  stale-candidate rejection, revision compare-and-swap, same-origin browser
  write serialization, and exact request-payload idempotency;
- viewer-specific redaction of hands, wall order, seed, and opponent private
  draws;
- durable local sessions with a launch-key index that resumes instead of
  duplicating;
- English, Simplified Chinese, and Japanese message catalogs.

See [the exact contract and scoring gaps](docs/framework-contract.md). This
initial release intentionally does **not** claim full Riichi yaku/fu/han, MCR
fan/8-point minimum, Hong Kong house scoring, flowers, payments, or complete
replacement/dead-wall rules.

## Learning loop

1. Choose a profile and replay seed; the same pair resumes one saved table.
2. Tap, focus, or hover a legal candidate to inspect it without mutation.
3. Compare **Play → Because → Changes → Opponent → Then check → Principle**.
4. Read separately labeled exact, calculated, and authored evidence for shape,
   ukeire, safety, value, and tempo.
5. Click the separate confirmation control. Only that state-bound action can
   mutate the table.

Other seats use a deterministic, deliberately simple policy and never see the
learner's private analysis. This is a browser-local reference authority; a real
multiplayer deployment must put authoritative state and secrets on a server.

## Development

Requires Node.js `^20.19.0` or `>=22.12.0`.

```bash
npm ci
npm run dev
npm run check
git diff --check
```

`npm run check` runs strict TypeScript, deterministic Vitest coverage, a Vite
production build, high-severity dependency audit, shell syntax checks, and
offline symlink-redirection tests for optional engine/model paths.

The optional, disabled Mortal/mjai lane is documented in
[docs/engine-lane.md](docs/engine-lane.md). Its scripts were not run and no model
was downloaded for this release.

## Repository hygiene

`.local/`, models, source checkouts, browser profiles, databases, screenshots,
caches, credentials, and generated builds are ignored. This repository is MIT
licensed; optional upstream engines retain their own licenses.

## Citation

GitHub reads [`CITATION.cff`](CITATION.cff) to expose **Cite this repository**.

```bibtex
@software{chen_four_winds_2026,
  author  = {Chen, Lachlan},
  title   = {Four Winds: Mahjong Decision Teacher},
  year    = {2026},
  version = {0.1.0},
  url     = {https://github.com/lachlanchen/LazyMahjong}
}
```

## Support

Support continued open-source work through [GitHub Sponsors](https://github.com/sponsors/lachlanchen)
or visit [Lazying Art](https://lazying.art). Funding links are declared in
[`.github/FUNDING.yml`](.github/FUNDING.yml).
