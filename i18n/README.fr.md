[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner — apps and four buddies](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# LazyMahjong · Four Winds

*Piochez, comparez, expliquez, puis confirmez, sans révéler la main d'un autre joueur.*

[![Lazying Art](https://img.shields.io/badge/Lazying-Art-0EA5E9?style=flat-square)](https://lazying.art) [![App screenshot](https://img.shields.io/badge/App-screenshot-173F5F?style=flat-square)](../docs/images/app.png) [![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/lachlanchen)

LazyMahjong est un professeur de décision Mahjong local pour le Riichi japonais, le Mahjong chinois officiel/MCR et les règles de Hong Kong. Le TypeScript déterministe gère le mur, les actions autorisées, le masquage des informations, les contrôles d'achèvement, l'historique et la persistance.

## Soutenir les outils pédagogiques ouverts

| Donate | PayPal | Stripe |
| --- | --- | --- |
| [![Donate](https://img.shields.io/badge/Donate-LazyingArt-0EA5E9?style=for-the-badge&logo=kofi&logoColor=white)](https://chat.lazying.art/donate) | [![PayPal](https://img.shields.io/badge/PayPal-RongzhouChen-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen) | [![Stripe](https://img.shields.io/badge/Stripe-Donate-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400) |

## Aperçu de l'application

[![Capture d'écran de l'application](../docs/images/app.png)](../docs/images/app.png)

La table sépare clairement la main cachée de l'apprenant, les choix autorisés, l'aperçu sans modification d'état et les preuves dont la provenance est indiquée.

## Ce que la table enseigne

- Une source de 136 tuiles définie par une graine et modélisée comme une pioche générique non distribuée, quatre joueurs, pioches, défausses et appels autorisés, et occasions Ron/Tsumo d’achever une forme prise en charge. Mur mort et dora Riichi ne sont pas modélisés.
- Forme standard en quatre groupes et une paire, plus sept paires selon le profil : sept sortes distinctes en Riichi et dans cette leçon Hong Kong ; MCR compte un carré caché comme deux unités de paire. Attentes, shanten, ukeire des copies non vues et carte des 34 sortes suivent le profil.
- Les profils affichent la limite du sous-ensemble pédagogique. Ron/Tsumo termine la main uniquement sur une forme prise en charge ; il n’établit ni admissibilité au score, ni yaku/fan, ni furiten.
- Toutes les pistes ex æquo sont visibles sans présélection. Le classement suit shanten, copies utiles non vues puis nombre de sortes ; la pioche imposée est exacte, l’achèvement seulement pour forme/légalité, et Passer est rédigé.

## Carte du référentiel

| Chemin | But |
| --- | --- |
| [`src/domain/`](../src/domain/) | Tuiles, profils de règles, candidats autorisés, transitions d'état, masquage des informations et analyse de main déterministes. |
| [`src/i18n/catalogs.ts`](../src/i18n/catalogs.ts) | Onze catalogues complets destinés aux apprenants avec des clés stables et des espaces réservés. |
| [`src/App.tsx`](../src/App.tsx) | La configuration multilingue, le tableau, le laboratoire de décision, la chronique et l'interface de session enregistrée. |
| [`docs/framework-contract.md`](../docs/framework-contract.md) | Les règles exactes prises en charge et les écarts de notation évidents. |
| [`docs/engine-lane.md`](../docs/engine-lane.md) | Le canal moteur facultatif, désactivé par défaut, et sa limite d'intégration révisée. |
| [`docs/images/app.png`](../docs/images/app.png) | Capture de référence ; à actualiser après validation navigateur de cette révision. |

## Démarrage rapide

Nécessite Node.js 20.19 ou version ultérieure et npm.

```bash
npm ci
npm run dev
```

<http://127.0.0.1:5182/>

Les serveurs de développement et d’aperçu sont fixés sur `127.0.0.1:5182` et échouent au lieu de choisir un autre port.

## Autorité, confidentialité et preuves

- L’interface ne restitue que la vue publique adaptée à l’observateur ; autres mains, ordre du mur, graine, évaluations, admissibilité d’un appel et passes cachées restent secrets jusqu’à un appel ou achèvement public.
- Les identifiants opaques de candidat lient le jeton d'état complet, le joueur et l'action canonique. Une coordonnée, un nom de tuile, un modèle ou un candidat périmé ne peut pas autoriser un changement d'état.
- L'aperçu est hypothétique. La prochaine tuile du mur reste cachée jusqu'à la confirmation explicite d'une pioche autorisée.
- Faits exacts, calculs, conseils rédigés, moteur, modèle et analogie restent séparés. « Copies non vues » signifie quatre moins les tuiles visibles par cet observateur, pas le contenu connu de la pioche non distribuée ni une probabilité ; aucun score non pris en charge n’est inventé.

## Vérification

```bash
npm run check
git diff --check
```

La vérification exécute TypeScript en mode strict, les tests déterministes du domaine et de la persistance, les tests de l'interface rendue côté serveur et de parité des 11 catalogues, le build de production, l'audit des dépendances, la syntaxe des scripts shell et les tests de sûreté de l'intégration moteur facultative.

## Citation

Si vous utilisez LazyMahjong dans l'enseignement ou la recherche, citez le référentiel. GitHub lit [CITATION.cff](../CITATION.cff) et affiche un panneau Citer ce référentiel.

```bibtex
@software{chen_lazy_mahjong_2026,
  author  = {Chen, Lachlan},
  title   = {LazyMahjong: Four Winds Mahjong Decision Teacher},
  year    = {2026},
  version = {0.1.0},
  url     = {https://github.com/lachlanchen/LazyMahjong}
}
```

## Statut

Cette version est un périmètre pédagogique aux limites explicites : le flux des tuiles, les déclarations, l'achèvement, les attentes et l'analyse des tuiles visibles sont déterministes ; le calcul complet des scores et paiements de Riichi, MCR et Hong Kong reste à venir. L'intégration moteur facultative est désactivée par défaut.
