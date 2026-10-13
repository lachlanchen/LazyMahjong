[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner — apps and four buddies](https://github.com/lachlanchen/LazyingArtWebsite/raw/main/media/brand/lazyingart-intro.gif)](https://lazying.art)

# LazyMahjong · Four Winds

*ツモり、比較し、理由を理解してから確定する――他家の手牌は明かしません。*

[![Lazying Art](https://img.shields.io/badge/Lazying-Art-0EA5E9?style=flat-square)](https://lazying.art) [![App screenshot](https://img.shields.io/badge/App-screenshot-173F5F?style=flat-square)](../docs/images/app.png) [![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

LazyMahjong は、日本リーチ、中国公式/MCR、香港麻雀をローカルで学べる意思決定教材です。決定論的 TypeScript が牌山、合法手、情報の秘匿、和了形判定、履歴、永続化を担当します。

## オープンな教育ツールをサポート

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## アプリのプレビュー

[![アプリケーションのスクリーンショット](../docs/images/app.png)](../docs/images/app.png)

現在の卓では、学習者の伏せた手牌、合法な選択肢、状態を変えない教材プレビュー、出典を明示した根拠を分けて表示します。

## 卓で学べること

- シードで再現できる136枚の牌源を単一の未配牌ツモ山として扱い、4席、合法なツモ・打牌・鳴き、ロン／ツモによる対応形完成の機会を扱います。リーチ麻雀の王牌とドラの仕組みはモデル化しません。
- 標準の4面子1雀頭に加え、ルール別の七対形を扱います。Riichi と本教材の Hong Kong は7種類の対子、MCR は暗手の四枚組を対子2単位と数えます。対応形の待ち・シャンテン・未見枚数の受け入れ・34種マップは選択ルールに従います。
- 各ルールは教材対応範囲を表示します。ロン／ツモは対応牌形だけで教材局を終了し、得点・役／番・振聴の成立を証明しません。
- 同率の計算候補をすべて未選択で示します。順位は対応形シャンテン、未見の受け入れ、有効牌種数の順です。必須ツモは厳密、完成は牌形と合法性だけが厳密で、見送りは著者案です。

## リポジトリマップ

| パス | 目的 |
| --- | --- |
| [`src/domain/`](../src/domain/) | 決定論的な牌、ルールプロファイル、合法候補、状態遷移、情報の秘匿、手牌分析。 |
| [`src/i18n/catalogs.ts`](../src/i18n/catalogs.ts) | 安定したキーとプレースホルダーを備えた 11 個の完全な学習者向けカタログ。 |
| [`src/App.tsx`](../src/App.tsx) | 多言語設定、卓、判断ラボ、対局記録、保存セッションのインターフェイス。 |
| [`docs/framework-contract.md`](../docs/framework-contract.md) | 正確に対応するルールと、明示された得点計算の未対応範囲。 |
| [`docs/engine-lane.md`](../docs/engine-lane.md) | 既定で無効な任意エンジン経路と、レビュー済みの統合境界。 |
| [`docs/images/app.png`](../docs/images/app.png) | 参照スクリーンショット。このソース版のブラウザ検証後に更新します。 |

## クイックスタート

Node.js 20.19 以降と npm が必要です。

```bash
npm ci
npm run dev
```

<http://127.0.0.1:5182/>

開発サーバーとプレビューサーバーは `127.0.0.1:5182` に固定され、別のポートを選ばずに失敗します。

## 正確性、プライバシー、根拠

- 閲覧者向け公開画面だけを表示し、他家の手牌、牌山順、シード、非公開評価、鳴ける事実、非公開の見送り履歴は、鳴きや完成が公開されるまで隠します。
- 不透明な候補 ID は、完全な状態トークン、行動者、正規アクションを結び付けます。座標、牌の表示名、モデル、古い候補だけでは状態変更を許可できません。
- プレビューは仮定です。合法なツモを明示的に確定するまで、牌山の次の牌は隠されたままです。
- 厳密・計算・著者案・エンジン・モデル・比喩を分離します。「未見枚数」は4枚から閲覧者に見える牌を引いた数で、未配牌ツモ山の既知の内訳やツモ確率ではありません。未対応得点は推測しません。

## 検証

```bash
npm run check
git diff --check
```

チェックでは、厳密な TypeScript、決定論的なドメインと永続化のテスト、サーバーレンダリング UI、11言語カタログの同等性、運用ビルド、依存関係監査、シェル構文、任意エンジン経路の安全性を検証します。

## 引用

教育または研究で LazyMahjong を使用する場合は、リポジトリを引用してください。 GitHub は [CITATION.cff](../CITATION.cff) を読み取り、「このリポジトリを引用」パネルを表示します。

```bibtex
@software{chen_lazy_mahjong_2026,
  author  = {Chen, Lachlan},
  title   = {LazyMahjong: Four Winds Mahjong Decision Teacher},
  year    = {2026},
  version = {0.1.0},
  url     = {https://github.com/lachlanchen/LazyMahjong}
}
```

## 状態

このリリースは対応範囲を明示した教材です。牌の流れ、鳴き、和了形、待ち、見えている牌の分析は決定論的です。Riichi、MCR、Hong Kong の完全な得点計算と支払いは今後の課題です。任意のエンジン経路は既定で無効です。
