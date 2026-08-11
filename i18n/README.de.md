[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# LazyMahjong · Four Winds

*Ziehen, vergleichen, erklären und dann bestätigen – ohne die Hand eines anderen Platzes offenzulegen.*

[![Lazying Art](https://img.shields.io/badge/Lazying-Art-0EA5E9?style=flat-square)](https://lazying.art) [![App screenshot](https://img.shields.io/badge/App-screenshot-173F5F?style=flat-square)](../docs/images/app.png) [![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

LazyMahjong ist ein lokal arbeitender Mahjong-Entscheidungstrainer für japanisches Riichi, chinesisches offizielles Mahjong/MCR und Hongkong-Regeln. Deterministisches TypeScript verwaltet Mauer, zulässige Aktionen, Informationsausblendung, Abschlussprüfungen, Verlauf und Persistenz.

## Unterstützen Sie offene Lehrmittel

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## App-Vorschau

[![Screenshot der Anwendung](../docs/images/app.png)](../docs/images/app.png)

Der Tisch zeigt die verdeckte Hand des Lernenden, zulässige Aktionen, die Vorschau ohne Zustandsänderung und Belege mit Herkunftsangabe klar getrennt.

## Was der Spieltisch lehrt

- Eine durch Seed bestimmte Mauer mit 136 Steinen, vier Plätze, zulässige Ziehungen und Abwürfe, Meldungsfenster sowie Abschluss durch Chi/Chow, Pon/Pung, Kan/Kong, Ron und Tsumo.
- Standardabschluss mit vier Gruppen und einem Paar oder sieben Paaren, genaue Wartesteine, Ukeire anhand sichtbarer Exemplare, ein vergleichender Formindex und sichtbare Daten aus den Ablagereihen.
- Die Profile Riichi, MCR und Hong Kong legen ihre Punktegrenzen vor und während des Spiels offen. Nicht unterstützte Yaku-, Fan-, Zahlungs-, Blumen- und Hausregeln werden niemals als maßgeblich dargestellt.
- Die Lernschleife ist einheitlich: einen an den Zustand gebundenen zulässigen Kandidaten prüfen, eine hypothetische Vorschau vergleichen und dann ausdrücklich bestätigen.

## Repository-Karte

| Pfad | Zweck |
| --- | --- |
| [`src/domain/`](../src/domain/) | Deterministische Steine, Regelprofile, zulässige Kandidaten, Zustandsübergänge, Informationsausblendung und Handanalyse. |
| [`src/i18n/catalogs.ts`](../src/i18n/catalogs.ts) | Elf vollständige Kataloge für Lernende mit stabilen Schlüsseln und Platzhaltern. |
| [`src/App.tsx`](../src/App.tsx) | Die mehrsprachige Benutzeroberfläche für Setup, Spieltisch, Entscheidungslabor, Chronik und gespeicherte Sitzungen. |
| [`docs/framework-contract.md`](../docs/framework-contract.md) | Die genauen unterstützten Regeln und auffälligen Punktelücken. |
| [`docs/engine-lane.md`](../docs/engine-lane.md) | Der standardmäßig deaktivierte optionale Engine-Kanal und die überprüfte Integrationsgrenze. |
| [`docs/images/app.png`](../docs/images/app.png) | Aktueller Anwendungs-Screenshot. |

## Schnellstart

Erfordert Node.js 20.19 oder neuer und npm.

```bash
npm ci
npm run dev
```

<http://127.0.0.1:5182/>

Entwicklungs- und Vorschauserver sind fest auf `127.0.0.1:5182` eingestellt und brechen ab, statt einen anderen Port zu wählen.

## Autorität, Privatsphäre und Beweise

- Die Oberfläche zeigt nur die für den Betrachter bereinigte öffentliche Ansicht; andere Hände, Mauerreihenfolge, Seed und private Bewertungen bleiben verborgen.
- Undurchsichtige Kandidaten-IDs binden das vollständige Zustands-Token, den Akteur und die kanonische Aktion. Koordinaten, Steinbezeichnungen, Modelle oder veraltete Kandidaten können keine Zustandsänderung autorisieren.
- Die Vorschau ist hypothetisch. Der nächste Stein der Mauer bleibt verborgen, bis ein zulässiges Ziehen ausdrücklich bestätigt wird.
- Exakte, berechnete, verfasste, Engine-, Modell- und Analogiebeweise bleiben separat gekennzeichnet. Nicht unterstützte Profilbewertungen bleiben sichtbar und werden nicht erraten.

## Überprüfung

```bash
npm run check
git diff --check
```

Das Check Gate führt strenge TypeScript-, deterministische Domänen- und Persistenztests, servergerenderte UI- und 11-Sprachen-Katalogparitätstests, einen Produktions-Build, Abhängigkeitsprüfungen, Shell-Syntaxprüfungen und Pfadsicherheitstests für optionale Engines aus.

## Zitat

Wenn Sie LazyMahjong in Lehre oder Forschung verwenden, zitieren Sie das Repository. GitHub liest [CITATION.cff](../CITATION.cff) und zeigt den Bereich „Dieses Repository zitieren“ an.

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

Diese Version ist ein klar begrenzter Lehrumfang: Steinfluss, Meldungen, Abschluss, Wartesteine und die Analyse sichtbarer Steine sind deterministisch; vollständige Wertungs- und Zahlungsregeln für Riichi, MCR und Hongkong bleiben künftige Arbeit. Der optionale Engine-Kanal ist standardmäßig deaktiviert.
