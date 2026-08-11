[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# LazyMahjong · Four Winds

*اسحب، وقارن، واشرح، ثم أكّد، من دون كشف يد لاعب آخر.*

[![Lazying Art](https://img.shields.io/badge/Lazying-Art-0EA5E9?style=flat-square)](https://lazying.art) [![App screenshot](https://img.shields.io/badge/App-screenshot-173F5F?style=flat-square)](../docs/images/app.png) [![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

LazyMahjong أداة تعليم قرارات ماجونغ تعمل محليًا لقواعد Riichi اليابانية وMCR الصينية وماجونغ Hong Kong. تتولى TypeScript الحتمية الجدار والإجراءات المسموح بها وإخفاء المعلومات وفحص الإكمال والتاريخ والحفظ.

## دعم أدوات التدريس المفتوحة

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## معاينة التطبيق

[![لقطة شاشة للتطبيق](../docs/images/app.png)](../docs/images/app.png)

تفصل الطاولة بوضوح بين يد المتعلم المخفية والخيارات المسموح بها ومعاينة الدرس التي لا تغيّر الحالة والأدلة المبيّن مصدرها.

## ما تعلّمه الطاولة

- جدار حتمي من 136 قطعة، وأربعة مقاعد، وسحب ورمي مسموح بهما، ونوافذ نداء، وchi/chow وpon/pung وkan/kong وron وإكمال اليد بـtsumo.
- إكمال قياسي من أربع مجموعات وزوج أو سبعة أزواج، وانتظارات دقيقة، وukeire حسب النسخ الظاهرة، ومؤشر شكل مقارن، وحقائق ظاهرة في منطقة الرمي.
- تعرض أنظمة Riichi وMCR وHong Kong حدود التسجيل قبل اللعب وأثناءه؛ ولا تُعرض yaku أو fan أو المدفوعات أو الزهور أو قواعد المنزل غير المدعومة بوصفها أحكامًا موثوقة.
- دورة التعلم واحدة: افحص مرشحًا مسموحًا به مرتبطًا بالحالة، وقارن المعاينة الافتراضية، ثم أكّد صراحة.

## خريطة المستودع

| المسار | الغرض |
| --- | --- |
| [`src/domain/`](../src/domain/) | قطع الماجونغ وأنظمة القواعد والمرشحون المسموح بهم وانتقالات الحالة وإخفاء المعلومات وتحليل اليد، وكلها حتمية. |
| [`src/i18n/catalogs.ts`](../src/i18n/catalogs.ts) | أحد عشر كتالوجًا كاملاً موجهًا للمتعلم مزودًا بمفاتيح ثابتة وعناصر نائبة. |
| [`src/App.tsx`](../src/App.tsx) | الإعداد متعدد اللغات، وطاولة اللعب، ومختبر القرار، والسجل، وواجهة الجلسة المحفوظة. |
| [`docs/framework-contract.md`](../docs/framework-contract.md) | القواعد المدعومة الدقيقة وفجوات التهديف الواضحة. |
| [`docs/engine-lane.md`](../docs/engine-lane.md) | ممر المحرك المعطل الاختياري وحدود التكامل التي تمت مراجعتها. |
| [`docs/images/app.png`](../docs/images/app.png) | لقطة شاشة للتطبيق الحالي. |

## بداية سريعة

يتطلب Node.js 20.19 أو أحدث وnpm.

```bash
npm ci
npm run dev
```

<http://127.0.0.1:5182/>

خادما التطوير والمعاينة مثبتان على `127.0.0.1:5182`، ويفشلان بدل اختيار منفذ آخر.

## السلطة والخصوصية والأدلة

- لا تعرض الواجهة إلا المشهد العام المناسب للاعب؛ وتبقى أيدي الآخرين وترتيب الجدار والبذرة والتقييمات الخاصة مخفية.
- تربط معرفات المرشح المبهمة رمز الحالة الكامل واللاعب والإجراء القياسي. ولا يمكن لإحداثي أو اسم قطعة أو نموذج أو مرشح قديم أن يجيز تغيير الحالة.
- المعاينة افتراضية. تبقى القطعة التالية في الجدار مخفية حتى يُؤكَّد سحب مسموح به صراحةً.
- تبقى الأدلة الدقيقة والمحسوبة والمكتوبة وتقديرات المحرك وشرح النموذج والتشبيه مصنفة كلٌّ على حدة. وتُعرض حدود التسجيل غير المدعوم بوضوح بدل تخمينه.

## تَحَقّق

```bash
npm run check
git diff --check
```

تشغّل بوابة الفحص TypeScript الصارم، واختبارات المجال الحتمي والحفظ، واختبارات واجهة المستخدم المعروضة من الخادم، وتكافؤ كتالوجات اللغات الإحدى عشرة، وبناء الإنتاج، وتدقيق التبعيات، وفحص صياغة shell، واختبارات أمان مسار المحرك الاختياري.

## الاقتباس

إذا كنت تستخدم LazyMahjong في التدريس أو البحث، فاستشهد بالمستودع. يقرأ GitHub [CITATION.cff](../CITATION.cff) ويعرض لوحة Cite this repository.

```bibtex
@software{chen_lazy_mahjong_2026,
  author  = {Chen, Lachlan},
  title   = {LazyMahjong: Four Winds Mahjong Decision Teacher},
  year    = {2026},
  version = {0.1.0},
  url     = {https://github.com/lachlanchen/LazyMahjong}
}
```

## حالة

هذا الإصدار نطاق تعليمي واضح الحدود: تدفق القطع والنداءات واكتمال اليد والانتظارات وتحليل القطع الظاهرة كلها حتمية؛ أما التسجيل والمدفوعات الكاملة لـ Riichi وMCR وHong Kong فهي عمل مستقبلي. مسار المحرك الاختياري معطّل افتراضيًا.
