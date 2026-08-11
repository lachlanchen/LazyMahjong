[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://github.com/lachlanchen/lachlanchen/blob/main/figs/banner.png)

# LazyMahjong · Four Winds

*패를 뽑고, 비교하고, 이유를 이해한 뒤 확정하세요. 다른 자리의 손패는 공개하지 않습니다.*

[![Lazying Art](https://img.shields.io/badge/Lazying-Art-0EA5E9?style=flat-square)](https://lazying.art) [![App screenshot](https://img.shields.io/badge/App-screenshot-173F5F?style=flat-square)](../docs/images/app.png) [![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

LazyMahjong는 일본 리치, 중국 공식/MCR, 홍콩 마작 학습 규칙을 위한 로컬 우선 결정 교사입니다. 결정론적 TypeScript가 패산, 가능한 행동, 정보 가림, 완성 판정, 기록과 영속성을 담당합니다.

## 개방형 교육 도구 지원

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## 앱 미리보기

[![애플리케이션 스크린샷](../docs/images/app.png)](../docs/images/app.png)

현재 테이블은 학습자의 비공개 손패, 가능한 선택, 상태를 바꾸지 않는 수업 미리보기, 출처가 표시된 근거를 구분합니다.

## 테이블이 가르치는 것

- 시드가 있는 136장 패산, 네 자리, 가능한 뽑기와 버리기, 울기 창, 치/차우, 퐁/풍, 깡/콩, 론과 쯔모 형태 완성.
- 표준 4멘쯔 1쌍과 칠대자 완성, 정확한 대기패, 보이는 남은 장수에 따른 우케이레, 비교용 형태 지수, 버림패에서 확인되는 사실.
- Riichi, MCR, Hong Kong 프로필은 플레이 전과 도중에 점수 경계를 밝힙니다. 지원하지 않는 역, 판(fan), 정산, 화패, 하우스룰을 권위 있는 결론처럼 제시하지 않습니다.
- 학습 순서는 일관됩니다. 현재 상태에 묶인 가능한 후보를 살펴보고, 가상 미리보기를 비교한 뒤 명시적으로 확정합니다.

## 저장소 지도

| 경로 | 용도 |
| --- | --- |
| [`src/domain/`](../src/domain/) | 결정론적 패, 규칙 프로필, 가능한 후보, 상태 전환, 정보 가림 및 손패 분석. |
| [`src/i18n/catalogs.ts`](../src/i18n/catalogs.ts) | 안정적인 키와 자리 표시자가 포함된 11개의 완전한 학습자용 카탈로그. |
| [`src/App.tsx`](../src/App.tsx) | 다국어 설정, 테이블, 의사 결정 랩, 기록 및 저장된 세션 인터페이스. |
| [`docs/framework-contract.md`](../docs/framework-contract.md) | 정확한 지원 규칙과 눈에 띄는 점수 차이. |
| [`docs/engine-lane.md`](../docs/engine-lane.md) | 기본 비활성화된 선택적 엔진 경로와 검토된 통합 경계. |
| [`docs/images/app.png`](../docs/images/app.png) | 현재 애플리케이션 스크린샷. |

## 빠른 시작

Node.js 20.19 이상 및 npm가 필요합니다.

```bash
npm ci
npm run dev
```

<http://127.0.0.1:5182/>

개발 및 미리보기 서버는 `127.0.0.1:5182`에 고정되며, 다른 포트를 고르는 대신 실패합니다.

## 정확성, 개인정보 보호 및 근거

- 인터페이스는 보는 사람에 맞춰 비공개 정보를 가린 공개 화면만 표시합니다. 다른 사람의 손패, 패산 순서, 시드, 비공개 평가는 숨겨집니다.
- 추측할 수 없는 후보 ID는 전체 상태 토큰, 행동자, 정식 행동을 묶습니다. 좌표, 패 이름, 모델, 오래된 후보만으로 상태 변경을 허가할 수 없습니다.
- 미리보기는 가정일 뿐입니다. 가능한 뽑기를 명시적으로 확정하기 전에는 패산의 다음 패를 공개하지 않습니다.
- 정확한 사실, 계산값, 작성 원칙, 엔진 추정, 모델 설명, 비유는 따로 표시합니다. 지원하지 않는 규칙별 점수는 추측하지 않고 미지원으로 남깁니다.

## 검증

```bash
npm run check
git diff --check
```

체크 게이트는 엄격한 TypeScript, 결정적 도메인 및 지속성 테스트, 서버 렌더링 UI 및 11개 언어 카탈로그 패리티 테스트, 프로덕션 빌드, 종속성 감사, 셸 구문 확인 및 선택적 엔진 경로 안전성 테스트를 실행합니다.

## 인용

교육이나 연구에 LazyMahjong를 사용하는 경우 저장소를 인용하세요. GitHub는 [CITATION.cff](../CITATION.cff)를 읽고 이 저장소 인용 패널을 표시합니다.

```bibtex
@software{chen_lazy_mahjong_2026,
  author  = {Chen, Lachlan},
  title   = {LazyMahjong: Four Winds Mahjong Decision Teacher},
  year    = {2026},
  version = {0.1.0},
  url     = {https://github.com/lachlanchen/LazyMahjong}
}
```

## 상태

이 릴리스는 범위를 명확히 밝힌 교육용 구현입니다. 패의 흐름, 울기, 화료 형태, 대기패, 공개 패 분석은 결정론적입니다. Riichi, MCR, Hong Kong의 완전한 점수 계산과 정산은 향후 작업입니다. 선택적 엔진 경로는 기본으로 꺼져 있습니다.
