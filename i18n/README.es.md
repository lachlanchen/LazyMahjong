[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner](https://github.com/lachlanchen/lachlanchen/raw/main/figs/banner.png)](https://lazying.art)

# LazyMahjong · Four Winds

*Roba, compara, explica y después confirma, sin revelar la mano de otro jugador.*

[![Lazying Art](https://img.shields.io/badge/Lazying-Art-0EA5E9?style=flat-square)](https://lazying.art) [![App screenshot](https://img.shields.io/badge/App-screenshot-173F5F?style=flat-square)](../docs/images/app.png) [![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

LazyMahjong es un profesor de decisiones de Mahjong local para Riichi japonés, Mahjong chino oficial/MCR y reglas de Hong Kong. TypeScript determinista controla el muro, las acciones válidas, la ocultación de información, las comprobaciones de finalización, el historial y la persistencia.

## Apoyar herramientas de enseñanza abiertas

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## Vista previa de la aplicación

[![Captura de pantalla de la aplicación](../docs/images/app.png)](../docs/images/app.png)

La mesa separa claramente la mano oculta del alumno, las opciones válidas, la vista previa sin cambio de estado y las pruebas con procedencia indicada.

## Lo que enseña la mesa

- Una fuente de 136 fichas definida por semilla y modelada como una pila genérica de fichas sin repartir, cuatro jugadores, robos, descartes y llamadas válidos, y oportunidades Ron/Tsumo de completar una forma admitida. No se modelan el muro muerto ni dora de Riichi.
- Forma estándar de cuatro grupos y un par, más siete pares según el perfil: siete tipos distintos en Riichi y esta lección de Hong Kong; MCR cuenta un cuarteto oculto como dos unidades de pareja. Esperas, shanten, ukeire de copias no vistas y el mapa de 34 tipos respetan el perfil.
- Los perfiles muestran el límite del subconjunto didáctico. Ron/Tsumo termina la mano solo por forma de fichas admitida; no establece validez de puntuación, yaku/fan ni furiten.
- Se muestran todas las opciones líderes empatadas sin preselección. El orden usa shanten, copias útiles no vistas y cantidad de tipos; el robo forzado es exacto, la finalización solo lo es para forma/legalidad y Pasar es guía redactada.

## Mapa del repositorio

| Ruta | Propósito |
| --- | --- |
| [`src/domain/`](../src/domain/) | Fichas, perfiles de reglas, candidatos válidos, transiciones de estado, ocultación de información y análisis de mano deterministas. |
| [`src/i18n/catalogs.ts`](../src/i18n/catalogs.ts) | Once catálogos completos para estudiantes con claves estables y marcadores de posición. |
| [`src/App.tsx`](../src/App.tsx) | La configuración multilingüe, la tabla, el laboratorio de decisiones, la crónica y la interfaz de sesión guardada. |
| [`docs/framework-contract.md`](../docs/framework-contract.md) | Las reglas exactas apoyadas y las brechas de puntuación notorias. |
| [`docs/engine-lane.md`](../docs/engine-lane.md) | La integración opcional del motor, desactivada por defecto, y su límite revisado. |
| [`docs/images/app.png`](../docs/images/app.png) | Captura de referencia; se actualiza tras validar esta revisión en el navegador. |

## Inicio rápido

Requiere Node.js 20.19 o posterior y npm.

```bash
npm ci
npm run dev
```

<http://127.0.0.1:5182/>

Los servidores de desarrollo y vista previa están fijados en `127.0.0.1:5182` y fallan en vez de elegir otro puerto.

## Autoridad, privacidad y evidencia

- La interfaz muestra solo la vista pública del espectador; otras manos, orden del muro, semilla, evaluación privada, posibilidad de reclamar y pases ocultos siguen secretos hasta que una llamada o finalización sea pública.
- Los ID de candidato opacos vinculan el token de estado completo, el actor y la acción canónica. Una coordenada, una etiqueta de ficha, un modelo o un candidato obsoleto no pueden autorizar un cambio de estado.
- La vista previa es hipotética. La siguiente ficha del muro permanece oculta hasta que se confirma explícitamente un robo válido.
- Hechos exactos, cálculos, guía redactada, motor, modelo y analogía se etiquetan por separado. «Copias no vistas» es cuatro menos lo visible para ese espectador, no contenido conocido de la pila sin repartir ni probabilidad; la puntuación no admitida nunca se adivina.

## Verificación

```bash
npm run check
git diff --check
```

La verificación ejecuta TypeScript estricto, pruebas deterministas de dominio y persistencia, pruebas de la interfaz renderizada en servidor y de paridad de los 11 catálogos, la compilación de producción, la auditoría de dependencias, comprobaciones de sintaxis de shell y pruebas de seguridad de la integración opcional del motor.

## Citación

Si utiliza LazyMahjong en docencia o investigación, cite el repositorio. GitHub lee [CITATION.cff](../CITATION.cff) y muestra un panel Citar este repositorio.

```bibtex
@software{chen_lazy_mahjong_2026,
  author  = {Chen, Lachlan},
  title   = {LazyMahjong: Four Winds Mahjong Decision Teacher},
  year    = {2026},
  version = {0.1.0},
  url     = {https://github.com/lachlanchen/LazyMahjong}
}
```

## Estado

Esta versión es un subconjunto didáctico con límites explícitos: el flujo de fichas, las declaraciones, la finalización, las esperas y el análisis de fichas visibles son deterministas; la puntuación y los pagos completos de Riichi, MCR y Hong Kong quedan para trabajo futuro. La integración opcional del motor está desactivada por defecto.
