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

- 由种子确定、可复现的 136 张牌墙，四个座位，合法摸牌与舍牌，鸣牌窗口，吃、碰、杠、荣和与自摸牌型完成。
- 标准四组一对与七对子、精确听牌、按可见剩余张数计算的进张、比较型牌型指数和牌河事实。
- 立直、MCR 和香港麻将规则会在对局前及对局中明确计分边界；尚未支持的役种、番数、支付、花牌和家规绝不会冒充权威结论。
- 学习循环保持一致：查看与当前状态绑定的合法候选动作，比较假设预览，再明确确认。

## 仓库结构

| 路径 | 用途 |
| --- | --- |
| [`src/domain/`](../src/domain/) | 确定性的麻将牌、规则配置、合法候选、状态转换、信息隐藏和手牌分析。 |
| [`src/i18n/catalogs.ts`](../src/i18n/catalogs.ts) | 十一个完整的面向学习者的目录，具有稳定的键和占位符。 |
| [`src/App.tsx`](../src/App.tsx) | 多语言设置、牌桌、决策实验室、牌局记录和已保存会话的界面。 |
| [`docs/framework-contract.md`](../docs/framework-contract.md) | 精确支持的规则和明确标出的计分缺口。 |
| [`docs/engine-lane.md`](../docs/engine-lane.md) | 默认停用的可选引擎通道及经过审查的集成边界。 |
| [`docs/images/app.png`](../docs/images/app.png) | 当前应用程序屏幕截图。 |

## 快速启动

需要 Node.js 20.19 或更高版本以及 npm。

```bash
npm ci
npm run dev
```

<http://127.0.0.1:5182/>

开发与预览服务器固定使用 `127.0.0.1:5182`；端口被占用时会直接失败，不会改用其他端口。

## 权威、隐私和证据

- 界面只呈现按查看者身份隐藏后的公共视图；其他玩家手牌、牌墙顺序、种子和私人评估始终保密。
- 不透明的候选 ID 会绑定完整状态令牌、行动者和规范动作。坐标、牌名、模型或过期候选都不能授权状态变更。
- 预览只是假设。明确确认合法摸牌前，牌墙的下一张始终隐藏。
- 精确事实、计算结果、编写的原则、引擎估计、模型解释和类比证据始终分开标注。规则配置尚未支持的计分会明确显示，而不会靠猜测补全。

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
