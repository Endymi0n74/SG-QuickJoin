# SG Quick Join SE

Userscript Tampermonkey pour [SteamGifts.com](https://www.steamgifts.com) :
auto-join discret avec **indicateur permanent** (haut-droite) pour tout contrôler.

Fork fortement modifié de [HCLonely/SG-QuickJoin](https://github.com/HCLonely/SG-QuickJoin) (MIT).

[![Version](https://img.shields.io/github/v/release/Endymi0n74/SG-QuickJoin?label=v1.0.0&style=flat-square)](https://github.com/Endymi0n74/SG-QuickJoin/releases/latest)
[![Installer](https://img.shields.io/badge/Install%20-%20Tampermonkey-4b8bbe?style=flat-square)](https://github.com/Endymi0n74/SG-QuickJoin/releases/latest/download/SG-QuickJoin.user.js)
[![Licence](https://img.shields.io/github/license/Endymi0n74/SG-QuickJoin?label=MIT&style=flat-square)](https://github.com/Endymi0n74/SG-QuickJoin/blob/main/LICENSE)

**🇫🇷 Français** · [🇬🇧 English](README.en.md)

## Installation

[![Installer avec Tampermonkey](https://img.shields.io/badge/🦎%20Installer%20avec%20Tampermonkey-4b8bbe?style=for-the-badge)](https://github.com/Endymi0n74/SG-QuickJoin/releases/latest/download/SG-QuickJoin.user.js)

1. Clique le bouton ci-dessus → Tampermonkey affiche la page d'installation → **Installer**.
2. Va sur [steamgifts.com](https://www.steamgifts.com) : un **petit pill vert** apparaît en haut à droite.

> **Pas de menu Tampermonkey** — tout se contrôle depuis l'indicateur.

## Interface : l'indicateur permanent

Un petit pill fixe en haut à droite de chaque page SteamGifts :

| État | Signification |
|------|---------------|
| 🟢 **ON** + ETA | Auto-join actif, prochaine passe estimée |
| 🟠 **PAUSE** | Auto-join actif mais en attente (hors page liste / hors heures) |
| ⚪ **OFF** | Auto-join désactivé |
| 🔵 compteur | Nombre de giveaways rejoints aujourd'hui |

**Clique le pill** pour ouvrir le mini-menu :

| Action | Description |
|--------|-------------|
| ⏻ Auto-join : ON/OFF | Active/désactive l'auto-join |
| ▶ Lancer un passage maintenant | Passe immédiate (contourne page liste + heures) |
| 🔍 Simuler un passage | Dry-run : diagnostic sans aucune requête |
| 🔄 Rafraîchir bibliothèque + gains | Vide les caches Steam (recharge immédiate) |
| ⏱ Rythme des passages | Configure le délai entre passes (1-120 min) |
| ⚙ Filtres : configurer | Mots-clés inclure/exclure + genres Steam + ≤ 24h |
| 🎮 Exclure jeux possédés / gagnés | Toggle ON/OFF |
| ⚙ Steam : configurer | Clé API + SteamID64 |
| 🔔 Son à chaque join | Toggle ON/OFF |
| 🔔 Son : réglages | Volume (0-100) + type (sine/triangle/square/off) |
| 👁 Masquer giveaways rejoints | Masque les giveaways déjà rejoints sur la page |
| ⬛ Mode compact | Affiche uniquement le dot (sans texte) |

## Fonctionnalités

- **Auto-join stealth** : passages réguliers avec jitter aléatoire (13-17 min, configurable),
  délai 2-8 s entre requêtes, aucun effet visuel sur la page.
- **Page liste uniquement** : l'auto-join ne tourne que sur `/`, `/giveaways*`.
- **Fenêtre 7h-22h** (heure de Paris) : l'auto-join reste muet hors de cette plage.
- **Filtres** : mots-clés à inclure/exclure + genres Steam (API store, cache 7 j) + option ≤ 24h.
- **Exclusion jeux possédés / gagnés** :
  - bibliothèque Steam réelle (clé API + SteamID64 auto-détecté),
  - historique des gains SteamGifts (`/giveaways/won`).
- **Panneau des exclus** (bas droite) : giveaways écartés, groupés par raison.
- **Notification discrète** : bilan par passage (rejoints / filtrés / déjà inscrits / aujourd'hui).
- **Signal son + flash** configurable (volume + type).
- **Compteur journalier** persistant + historique 7 jours.

## Configuration Steam (optionnelle)

1. Clé API gratuite : https://steamcommunity.com/dev/apikey
2. Indicateur → ⚙ Steam : configurer → entre ta clé API
3. Indicateur → 🎮 Exclure jeux possédés → ON
4. Indicateur → 🔄 Rafraîchir bibliothèque + gains

Le SteamID64 est **détecté automatiquement** depuis la page.

## Tests

```bash
node SG-QuickJoin.test.js   # 135 tests fonctionnels (mocks DOM/GM_*/fetch)
```

## Auto-update

- `@updateURL` → `…/releases/latest/download/SG-QuickJoin.meta.js`
- `@downloadURL` → `…/releases/latest/download/SG-QuickJoin.user.js`

Chaque release publie les 2 assets ; Tampermonkey vérifie la `@version` et met à jour
automatiquement.

## Avertissement

L'auto-join envoie de vraies requêtes à SteamGifts. Utilise-le avec modération
(délais + jitter + fenêtre horaire sont là pour ça) — à tes risques et périls.

## Licence

[MIT](LICENSE) — fork de [HCLonely/SG-QuickJoin](https://github.com/HCLonely/SG-QuickJoin)
(également MIT).
