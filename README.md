# SG QuickJoin (fork personnel)

Userscript Tampermonkey pour [SteamGifts.com](https://www.steamgifts.com) : bouton
« Join / Leave » sur chaque giveaway + **auto-join discret** entièrement configurable.

Fork fortement modifié de [HCLonely/SG-QuickJoin](https://github.com/HCLonely/SG-QuickJoin) (MIT).

[![Version](https://img.shields.io/github/v/release/Endymi0n74/SG-QuickJoin?label=version&style=flat-square)](https://github.com/Endymi0n74/SG-QuickJoin/releases/latest)
[![Installer](https://img.shields.io/badge/Install%20-%20Tampermonkey-4b8bbe?style=flat-square)](https://github.com/Endymi0n74/SG-QuickJoin/releases/latest/download/SG-QuickJoin.user.js)
[![Licence](https://img.shields.io/github/license/Endymi0n74/SG-QuickJoin?label=licence&style=flat-square)](https://github.com/Endymi0n74/SG-QuickJoin/blob/main/LICENSE)

## Installation

[![Installer avec Tampermonkey](https://img.shields.io/badge/🦎%20Installer%20avec%20Tampermonkey-4b8bbe?style=for-the-badge)](https://github.com/Endymi0n74/SG-QuickJoin/releases/latest/download/SG-QuickJoin.user.js)

1. Clique le bouton ci-dessus (ou télécharge `SG-QuickJoin.user.js`) — Tampermonkey
   affiche la page d'installation → **Installer → OK**.
2. Va sur steamgifts.com, ouvre le menu Tampermonkey → **SG QuickJoin**.

Alternative : ouvre **Tampermonkey → Tableau de bord** et glisse `SG-QuickJoin.user.js`
dans la fenêtre du navigateur (ou copie-colle le contenu dans un nouveau script et Ctrl+S).

## Mise à jour & auto-update

- `@updateURL` → `…/releases/latest/download/SG-QuickJoin.meta.js`
- `@downloadURL` → `…/releases/latest/download/SG-QuickJoin.user.js`

Chaque release publie les 2 assets ; Tampermonkey vérifie la `@version` via le `.meta.js`
et met à jour automatiquement.

⚠️ **Une seule réinstallation manuelle** : si ton script installé pointe encore vers
GreasyFork (anciennes URLs `update.greasyfork.org`), réinstalle-le une fois depuis
cette release pour brancher les nouvelles URLs — ensuite les mises à jour sont automatiques.

## Fonctionnalités principales

- **Auto-join stealth** : passages réguliers avec jitter aléatoire (13-17 min par défaut,
  configurable), délai 2-8 s entre requêtes, pas d'animation à l'écran.
- **Fenêtre 7h-22h** (heure de Paris) — l'auto-join reste muet hors de cette plage.
- **Page liste uniquement** : aucun auto-join sur les pages profil/discussions.
- **Limite journalière** (20/jour par défaut, réglable) : filet de sécurité avec reprise
  automatique le lendemain.
- **Filtres** : mots-clés à inclure/exclure + genres Steam (via l'API du store).
- **Option « uniquement ≤ 24h »** : ne joint que les giveaways qui se terminent bientôt.
- **Exclusion des jeux possédés / déjà gagnés** :
  - bibliothèque Steam réelle (clé API + SteamID64 — l'ID est détecté automatiquement),
  - historique des gains SteamGifts (`/giveaways/won`).
- **Panneau des exclus** (bas droite) : tous les giveaways écartés, groupés par raison,
  avec lien vers chaque giveaway.
- **Notification discrète** après chaque passage (rejoints / filtrés / déjà inscrits /
  total du jour), avec résumé des raisons si 0 rejoint.
- **Signal son + flash** (volume et type réglables) quand un giveaway est rejoint.
- **Compteur journalier + historique 7 jours** (graphique ASCII en console).
- **Mode simulation** (`Test : simuler un passage`) : diagnostic de la page + verdict
  par giveaway, sans envoyer la moindre requête.

## Configuration Steam (optionnelle mais recommandée)

1. Clé API gratuite : https://steamcommunity.com/dev/apikey
2. Menu → `Steam: configurer (clé API + ID)` — le SteamID64 est en général détecté
   automatiquement depuis la page.
3. Active `Exclure jeux possédés / gagnés` puis `Rafraîchir bibliothèque + gains (Steam)`
   pour charger les caches.

Sans clé API, l'auto-join fonctionne quand même : l'exclusion des jeux possédés est
simplement désactivée (un avertissement l'indique dans le toast).

## Tests

```bash
node SG-QuickJoin.test.js   # 121 tests fonctionnels (mocks DOM/GM_*/fetch)
```

## Avertissement

L'auto-join envoie de vraies requêtes à SteamGifts. Utilise-le avec modération
(délais + jitter + limite journalière sont là pour ça) — à tes risques et périls,
conformément aux règles du site.

## Licence

[MIT](LICENSE) — fork de [HCLonely/SG-QuickJoin](https://github.com/HCLonely/SG-QuickJoin)
(également MIT). Licence intégrale dans le fichier `LICENSE`.
