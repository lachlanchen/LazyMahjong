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

- 由種子決定、可重現的 136 張牌源建模為一個通用未發摸牌堆，支援四個座位、合法摸牌／捨牌／鳴牌，以及榮和／自摸的受支援牌型完成機會。立直王牌與寶牌機制未建模。
- 支援標準四組一對及按規則體系定義的七對：立直和本課程香港規則要求七種不同對子；國標把暗手四張同牌計作兩個對子單位。完成牌、向聽、按未見張數計算的進張與 34 種牌圖均遵循所選體系。
- 各規則會明確教學子集邊界。榮和／自摸只按受支援牌型結束本局，不證明計分、役種／番數或振聽資格。
- 所有並列首選都會顯示但不預選。排名依次使用受支援牌型向聽、未見進張、改良牌種數；強制摸牌為精確事實，完成只精確到牌型／合法性，「過」為編寫建議。

## 倉庫結構

| 路徑 | 用途 |
| --- | --- |
| [`src/domain/`](../src/domain/) | 確定性的麻將牌、規則配置、合法候選、狀態轉換、資訊隱藏和手牌分析。 |
| [`src/i18n/catalogs.ts`](../src/i18n/catalogs.ts) | 十一個完整的面向學習者的目錄，具有穩定的鍵和佔位符。 |
| [`src/App.tsx`](../src/App.tsx) | 多語言設定、牌桌、決策實驗室、牌局記錄和已儲存會話的介面。 |
| [`docs/framework-contract.md`](../docs/framework-contract.md) | 精確支援的規則和明確標出的計分缺口。 |
| [`docs/engine-lane.md`](../docs/engine-lane.md) | 預設停用的可選引擎通道及經過審查的整合邊界。 |
| [`docs/images/app.png`](../docs/images/app.png) | 參考截圖；完成本原始碼版本的瀏覽器驗證後更新。 |

## 快速啟動

需要 Node.js 20.19 或更高版本以及 npm。

```bash
npm ci
npm run dev
```

<http://127.0.0.1:5182/>

開發與預覽伺服器固定使用 `127.0.0.1:5182`；連接埠被占用時會直接失敗，不會改用其他連接埠。

## 權威、隱私和證據

- 介面只呈現檢視者公共視圖；其他手牌、牌牆順序、種子、私人評估、可鳴牌資格與隱藏的「過」記錄，都會保密到鳴牌或完成公開為止。
- 不透明的候選 ID 會繫結完整狀態令牌、行動者和規範動作。座標、牌名、模型或過期候選都不能授權狀態變更。
- 預覽只是假設。明確確認合法摸牌前，牌牆的下一張始終隱藏。
- 精確、計算、編寫建議、引擎、模型和類比證據分開標註。「未見張數」是四減去該檢視者可見牌數，不是未發摸牌堆的已知組成或摸牌機率；尚未支援的計分絕不猜測。

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
