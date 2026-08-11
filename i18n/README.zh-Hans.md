[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# LazyMahjong · Four Winds

*摸牌、比较、解释，再确认——同时保护其他玩家的暗手牌。*

[![Lazying Art](https://img.shields.io/badge/Lazying-Art-0EA5E9?style=flat-square)](https://lazying.art) [![App screenshot](https://img.shields.io/badge/App-screenshot-173F5F?style=flat-square)](../docs/images/app.png) [![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

LazyMahjong 是一款本地优先的麻将决策教学工具，支持日本立直、国标/MCR 和香港麻将学习规则。确定性 TypeScript 负责牌墙、合法动作、信息隐藏、和牌检查、历史与持久化。

## 支持开放教学工具

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## 应用预览

[![应用截图](../docs/images/app.png)](../docs/images/app.png)

当前牌桌会清楚区分学习者的暗手牌、合法选择、不改变状态的教学预览和标明来源的证据。

## 牌桌会教什么

- 由种子确定、可复现的 136 张牌源建模为一个通用未发摸牌堆，支持四个座位、合法摸牌／舍牌／鸣牌，以及荣和／自摸的受支持牌型完成机会。立直王牌与宝牌机制未建模。
- 支持标准四组一对及按规则体系定义的七对：立直和本课程香港规则要求七种不同对子；国标把暗手四张同牌计作两个对子单位。完成牌、向听、按未见张数计算的进张与 34 种牌图均遵循所选体系。
- 各规则会明确教学子集边界。荣和／自摸只按受支持牌型结束本局，不证明计分、役种／番数或振听资格。
- 所有并列首选都会显示但不预选。排名依次使用受支持牌型向听、未见进张、改良牌种数；强制摸牌为精确事实，完成只精确到牌型／合法性，“过”为编写建议。

## 仓库结构

| 路径 | 用途 |
| --- | --- |
| [`src/domain/`](../src/domain/) | 确定性的麻将牌、规则配置、合法候选、状态转换、信息隐藏和手牌分析。 |
| [`src/i18n/catalogs.ts`](../src/i18n/catalogs.ts) | 十一个完整的面向学习者的目录，具有稳定的键和占位符。 |
| [`src/App.tsx`](../src/App.tsx) | 多语言设置、牌桌、决策实验室、牌局记录和已保存会话的界面。 |
| [`docs/framework-contract.md`](../docs/framework-contract.md) | 精确支持的规则和明确标出的计分缺口。 |
| [`docs/engine-lane.md`](../docs/engine-lane.md) | 默认停用的可选引擎通道及经过审查的集成边界。 |
| [`docs/images/app.png`](../docs/images/app.png) | 参考截图；完成本源码版本的浏览器验证后更新。 |

## 快速启动

需要 Node.js 20.19 或更高版本以及 npm。

```bash
npm ci
npm run dev
```

<http://127.0.0.1:5182/>

开发与预览服务器固定使用 `127.0.0.1:5182`；端口被占用时会直接失败，不会改用其他端口。

## 权威、隐私和证据

- 界面只呈现查看者公共视图；其他手牌、牌墙顺序、种子、私人评估、可鸣牌资格与隐藏的“过”记录，都会保密到鸣牌或完成公开为止。
- 不透明的候选 ID 会绑定完整状态令牌、行动者和规范动作。坐标、牌名、模型或过期候选都不能授权状态变更。
- 预览只是假设。明确确认合法摸牌前，牌墙的下一张始终隐藏。
- 精确、计算、编写建议、引擎、模型和类比证据分开标注。“未见张数”是四减去该查看者可见牌数，不是未发摸牌堆的已知组成或摸牌概率；尚未支持的计分绝不猜测。

## 验证

```bash
npm run check
git diff --check
```

检查流程会运行严格 TypeScript、确定性领域与持久化测试、服务端渲染 UI 测试、11 种语言目录一致性测试、生产构建、依赖审计、shell 语法检查和可选引擎路径安全测试。

## 引用

如果您在教学或研究中使用 LazyMahjong，请引用存储库。 GitHub 读取 [CITATION.cff](../CITATION.cff) 并显示“引用此存储库”面板。

```bibtex
@software{chen_lazy_mahjong_2026,
  author  = {Chen, Lachlan},
  title   = {LazyMahjong: Four Winds Mahjong Decision Teacher},
  year    = {2026},
  version = {0.1.0},
  url     = {https://github.com/lachlanchen/LazyMahjong}
}
```

## 状态

此版本是范围诚实的教学子集：牌流、鸣牌、和牌完成、听牌与可见牌分析均由确定性代码负责；完整的立直、MCR 和香港麻将计分与支付规则仍是后续工作。可选引擎通道默认停用。
