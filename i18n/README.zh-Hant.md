[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# LazyMahjong · Four Winds

*摸牌、比較、解釋，再確認——同時保護其他玩家的暗手牌。*

[![Lazying Art](https://img.shields.io/badge/Lazying-Art-0EA5E9?style=flat-square)](https://lazying.art) [![App screenshot](https://img.shields.io/badge/App-screenshot-173F5F?style=flat-square)](../docs/images/app.png) [![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

LazyMahjong 是一款本地優先的麻將決策教學工具，支援日本立直、國標/MCR 和香港麻將學習規則。確定性 TypeScript 負責牌牆、合法動作、資訊隱藏、和牌檢查、歷史與持久化。

## 支援開放教學工具

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## 應用預覽

[![應用截圖](../docs/images/app.png)](../docs/images/app.png)

當前牌桌會清楚區分學習者的暗手牌、合法選擇、不改變狀態的教學預覽和標明來源的證據。

## 牌桌會教什麼

- 由種子決定、可重現的 136 張牌牆，四個座位，合法摸牌與捨牌，鳴牌視窗，吃、碰、槓、榮和與自摸牌型完成。
- 標準四組一對與七對子、精確聽牌、按可見剩餘張數計算的進張、比較型牌型指數和牌河事實。
- 立直、MCR 和香港麻將規則會在對局前及對局中明確計分邊界；尚未支援的役種、番數、支付、花牌和家規絕不會冒充權威結論。
- 學習迴圈保持一致：檢視與當前狀態繫結的合法候選動作，比較假設預覽，再明確確認。

## 倉庫結構

| 路徑 | 用途 |
| --- | --- |
| [`src/domain/`](../src/domain/) | 確定性的麻將牌、規則配置、合法候選、狀態轉換、資訊隱藏和手牌分析。 |
| [`src/i18n/catalogs.ts`](../src/i18n/catalogs.ts) | 十一個完整的面向學習者的目錄，具有穩定的鍵和佔位符。 |
| [`src/App.tsx`](../src/App.tsx) | 多語言設定、牌桌、決策實驗室、牌局記錄和已儲存會話的介面。 |
| [`docs/framework-contract.md`](../docs/framework-contract.md) | 精確支援的規則和明確標出的計分缺口。 |
| [`docs/engine-lane.md`](../docs/engine-lane.md) | 預設停用的可選引擎通道及經過審查的整合邊界。 |
| [`docs/images/app.png`](../docs/images/app.png) | 當前應用程式螢幕截圖。 |

## 快速啟動

需要 Node.js 20.19 或更高版本以及 npm。

```bash
npm ci
npm run dev
```

<http://127.0.0.1:5182/>

開發與預覽伺服器固定使用 `127.0.0.1:5182`；連接埠被占用時會直接失敗，不會改用其他連接埠。

## 權威、隱私和證據

- 介面只呈現按檢視者身份隱藏後的公共檢視；其他玩家手牌、牌牆順序、種子和私人評估始終保密。
- 不透明的候選 ID 會繫結完整狀態令牌、行動者和規範動作。座標、牌名、模型或過期候選都不能授權狀態變更。
- 預覽只是假設。明確確認合法摸牌前，牌牆的下一張始終隱藏。
- 精確事實、計算結果、編寫的原則、引擎估計、模型解釋和類比證據始終分開標註。規則配置尚未支援的計分會明確顯示，而不會靠猜測補全。

## 驗證

```bash
npm run check
git diff --check
```

檢查流程會執行嚴格 TypeScript、確定性領域與持久化測試、伺服器渲染 UI 測試、11 種語言目錄一致性測試、生產構建、依賴稽核、shell 語法檢查和可選引擎路徑安全測試。

## 引用

如果您在教學或研究中使用 LazyMahjong，請引用儲存庫。 GitHub 讀取 [CITATION.cff](../CITATION.cff) 並顯示“引用此儲存庫”面板。

```bibtex
@software{chen_lazy_mahjong_2026,
  author  = {Chen, Lachlan},
  title   = {LazyMahjong: Four Winds Mahjong Decision Teacher},
  year    = {2026},
  version = {0.1.0},
  url     = {https://github.com/lachlanchen/LazyMahjong}
}
```

## 狀態

此版本是範圍誠實的教學子集：牌流、鳴牌、和牌完成、聽牌與可見牌分析均由確定性程式碼負責；完整的立直、MCR 和香港麻將計分與支付規則仍是後續工作。可選引擎通道預設停用。
