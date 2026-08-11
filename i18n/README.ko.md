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

- 시드로 재현되는 136장 패원을 하나의 일반 미배분 뽑기 더미로 모델링하며, 네 자리, 합법 뽑기·버리기·울기와 론/쯔모 지원 형태 완성 기회를 다룹니다. 리치 마작의 왕패와 도라 메커니즘은 모델링하지 않습니다.
- 표준 4멘쯔 1쌍과 프로필별 칠대형을 지원합니다. Riichi와 이 Hong Kong 학습 프로필은 서로 다른 7종의 또이, MCR은 숨은 네 장을 또이 2단위로 셉니다. 지원 형태 대기·샨텐·보이지 않은 장수 우케이레·34종 지도는 선택 프로필을 따릅니다.
- 각 프로필은 교육용 지원 범위를 밝힙니다. 론/쯔모는 지원 패 형태만으로 교육국을 끝내며 점수·역/판·후리텐 성립을 확정하지 않습니다.
- 동률 계산 선두를 모두 미선택 상태로 표시합니다. 순위는 지원 형태 샨텐, 보이지 않은 우케이레, 유효패 종류 수 순입니다. 강제 뽑기는 정확하고 완성은 형태/합법성만 정확하며 패스는 작성 안내입니다.

## 저장소 지도

| 경로 | 용도 |
| --- | --- |
| [`src/domain/`](../src/domain/) | 결정론적 패, 규칙 프로필, 가능한 후보, 상태 전환, 정보 가림 및 손패 분석. |
| [`src/i18n/catalogs.ts`](../src/i18n/catalogs.ts) | 안정적인 키와 자리 표시자가 포함된 11개의 완전한 학습자용 카탈로그. |
| [`src/App.tsx`](../src/App.tsx) | 다국어 설정, 테이블, 의사 결정 랩, 기록 및 저장된 세션 인터페이스. |
| [`docs/framework-contract.md`](../docs/framework-contract.md) | 정확한 지원 규칙과 눈에 띄는 점수 차이. |
| [`docs/engine-lane.md`](../docs/engine-lane.md) | 기본 비활성화된 선택적 엔진 경로와 검토된 통합 경계. |
| [`docs/images/app.png`](../docs/images/app.png) | 참고 스크린샷. 이 소스 리비전의 브라우저 검증 후 갱신합니다. |

## 빠른 시작

Node.js 20.19 이상 및 npm가 필요합니다.

```bash
npm ci
npm run dev
```

<http://127.0.0.1:5182/>

개발 및 미리보기 서버는 `127.0.0.1:5182`에 고정되며, 다른 포트를 고르는 대신 실패합니다.

## 정확성, 개인정보 보호 및 근거

- 보는 사람용 공개 화면만 표시하며 다른 손패, 패산 순서, 시드, 비공개 평가, 울기 가능 여부와 숨은 패스 기록은 울기나 완성이 공개될 때까지 감춥니다.
- 추측할 수 없는 후보 ID는 전체 상태 토큰, 행동자, 정식 행동을 묶습니다. 좌표, 패 이름, 모델, 오래된 후보만으로 상태 변경을 허가할 수 없습니다.
- 미리보기는 가정일 뿐입니다. 가능한 뽑기를 명시적으로 확정하기 전에는 패산의 다음 패를 공개하지 않습니다.
- 정확·계산·작성 안내·엔진·모델·비유를 분리합니다. “보이지 않은 장수”는 4장에서 그 관전자에게 보이는 패를 뺀 값이지 미배분 뽑기 더미의 알려진 구성이나 뽑기 확률이 아닙니다. 미지원 점수는 추측하지 않습니다.

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
