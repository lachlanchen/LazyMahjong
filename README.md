[English](README.md) · [العربية](i18n/README.ar.md) · [Español](i18n/README.es.md) · [Français](i18n/README.fr.md) · [日本語](i18n/README.ja.md) · [한국어](i18n/README.ko.md) · [Tiếng Việt](i18n/README.vi.md) · [中文 (简体)](i18n/README.zh-Hans.md) · [中文（繁體）](i18n/README.zh-Hant.md) · [Deutsch](i18n/README.de.md) · [Русский](i18n/README.ru.md)

[![LazyingArt banner — apps and four buddies](https://github.com/lachlanchen/LazyingArtWebsite/raw/main/media/brand/lazyingart-intro.gif)](https://lazying.art)

# LazyMahjong · Four Winds

*Draw, compare, explain, then commit—without revealing another seat’s hand.*

[![Lazying Art](https://img.shields.io/badge/Lazying-Art-0EA5E9?style=flat-square)](https://lazying.art) [![App screenshot](https://img.shields.io/badge/App-screenshot-173F5F?style=flat-square)](docs/images/app.png) [![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

LazyMahjong is a local-first Mahjong decision teacher for Japanese Riichi, Chinese Official/MCR, and Hong Kong learning profiles. Deterministic TypeScript owns the wall, legal actions, redaction, completion checks, history, and persistence.

## Support open teaching tools

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## App preview

[![Application screenshot](docs/images/app.png)](docs/images/app.png)

The current table separates the learner’s concealed hand, legal choices, non-mutating lesson preview, and provenance-labeled evidence.

## What the table teaches

- A seeded 136-tile source modeled as one generic undealt draw pile, four seats, legal draws and discards, call windows, chi/chow, pon/pung, kan/kong, and Ron/Tsumo supported-shape completion opportunities. Riichi dead-wall and dora mechanics are not modeled.
- Standard four-groups-and-a-pair completion plus profile-aware seven pairs: seven distinct pair kinds in Riichi and this Hong Kong lesson, while MCR counts a concealed four-of-a-kind as two pair units. Supported-shape waits, shanten, unseen-copy ukeire, visible role legends, and the 34-tile map all use the selected profile.
- Riichi, MCR, and Hong Kong profiles expose their teaching-subset boundaries before and during play. Ron or Tsumo ends the subset hand on supported tile shape only; it does not establish scoring, yaku/fan, or furiten eligibility.
- A fresh hand highlights every tied calculated lead without selecting it. Ranking uses supported-shape shanten, unseen-copy ukeire, then improving-kind count; forced draws are exact, completion leads are exact only for supported shape/action legality, and Pass is authored. Only Confirm mutates the table.

## Repository map

| Path | Purpose |
| --- | --- |
| [`src/domain/`](src/domain/) | Deterministic tiles, profiles, legal candidates, state transitions, redaction, and hand analysis. |
| [`src/i18n/catalogs.ts`](src/i18n/catalogs.ts) | Eleven complete learner-facing catalogs with stable keys and placeholders. |
| [`src/App.tsx`](src/App.tsx) | The multilingual setup, table, decision lab, chronicle, and saved-session interface. |
| [`docs/framework-contract.md`](docs/framework-contract.md) | The exact supported rules and conspicuous scoring gaps. |
| [`docs/engine-lane.md`](docs/engine-lane.md) | The optional disabled engine lane and reviewed integration boundary. |
| [`docs/images/app.png`](docs/images/app.png) | Reference screenshot; refresh it after browser validation of this source revision. |

## Quick start

Requires Node.js 20.19 or newer and npm.

```bash
npm ci
npm run dev
```

<http://127.0.0.1:5182/>

The development and preview servers are pinned to `127.0.0.1:5182` and fail rather than selecting another port.

## Authority, privacy, and evidence

- The interface renders only a viewer-redacted public view; other hands, wall order, seed, private evaluation, claim eligibility, and hidden Pass events remain concealed until a call or completion becomes public.
- Opaque candidate IDs bind the complete state token, actor, and canonical action. A coordinate, tile label, model, or stale candidate cannot authorize mutation.
- Preview is hypothetical. The next tile in the generic draw pile stays hidden until a legal Draw is explicitly confirmed, so post-Draw calculated shape analysis is unavailable beforehand.
- Exact, calculated, authored, engine, model, and analogy evidence remain separately labeled. “Unseen copies” means four minus tiles visible to that viewer—not known undealt draw-pile contents or draw probability—and unsupported profile scoring is never guessed.

## Verification

```bash
npm run check
git diff --check
```

The check gate runs strict TypeScript, deterministic domain and persistence tests, server-rendered UI and 11-language catalog parity tests, a production build, dependency audit, shell syntax checks, and optional-engine path-safety tests.

## Citation

If you use LazyMahjong in teaching or research, cite the repository. GitHub reads [CITATION.cff](CITATION.cff) and displays a **Cite this repository** panel.

```bibtex
@software{chen_lazy_mahjong_2026,
  author  = {Chen, Lachlan},
  title   = {LazyMahjong: Four Winds Mahjong Decision Teacher},
  year    = {2026},
  version = {0.1.0},
  url     = {https://github.com/lachlanchen/LazyMahjong}
}
```

## Status

This release is an honest teaching subset: tile flow, calls, completion, waits, and visible-tile analysis are deterministic; full Riichi, MCR, and Hong Kong scoring and payment authorities remain future work. The optional engine lane is disabled by default.
