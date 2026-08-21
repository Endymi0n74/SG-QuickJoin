# Mémo projet — SG Quick Join SE

> Mémo de travail consolidé (contexte, état, conventions, pièges).
> À mettre à jour après chaque changement structurel ou nouvelle version.

## 1. Vue d'ensemble

- **Userscript Tampermonkey** pour [SteamGifts.com](https://www.steamgifts.com) :
  bouton "Join / Leave" sur chaque giveaway + **auto-join stealth** (passages répétés
  avec jitter, fenêtre horaire, filtres, notifications discrètes).
- Fork du script de [HCLonely/SG-QuickJoin](https://github.com/HCLonely/SG-QuickJoin)
  (MIT), fortement modifié — renommé **SG Quick Join SE** depuis v1.0.0.
- Repo GitHub : `Endymi0n74/SG-QuickJoin` (public).
- Workspace : `D:\Codex\sg-quickjoin\` (repo git dédié).
- **Plus aucun fichier miroir** en dehors du repo (supprimés en v1.0.0).

## 2. Fichiers

| Chemin | Rôle |
|---|---|
| `sg-quickjoin/SG-QuickJoin.user.js` | Le script (source de vérité, version `@version`) |
| `sg-quickjoin/SG-QuickJoin.test.js` | Harnais de test Node (VM + mocks DOM/GM_*/fetch/DOMParser) |
| `sg-quickjoin/SG-QuickJoin.meta.js` | Header seul (update check Tampermonkey) — régénérer à chaque release |
| `sg-quickjoin/README.md` | Installation + doc indicator-based UI + auto-update |
| `sg-quickjoin/LICENSE` | Licence MIT complète (fork + crédit original HCLonely) |
| `sg-quickjoin/CHANGELOG.md` | Historique des versions (Keep a Changelog) — à mettre à jour à chaque release |
| `sg-quickjoin/MEMO.md` | Ce mémo |

## 3. Version courante : **1.0.0** (SG Quick Join SE)

- `node --check SG-QuickJoin.user.js` OK, **135 tests** au vert (`node SG-QuickJoin.test.js`).
- **Release GitHub** : tag `v1.0.0` + 2 assets (`SG-QuickJoin.user.js` + `SG-QuickJoin.meta.js`).
- **URLs d'update** :
  - `@updateURL` → `https://github.com/Endymi0n74/SG-QuickJoin/releases/latest/download/SG-QuickJoin.meta.js`
  - `@downloadURL` → `https://github.com/Endymi0n74/SG-QuickJoin/releases/latest/download/SG-QuickJoin.user.js`
- `@namespace` conservé `HCLonely` (continuité d'identité Tampermonkey) ; `@homepage`/
  `@supportURL` → repo Endymi0n74.
- **Anciennes releases supprimées** : v1.5.4, v1.5.7, v1.5.8, v1.5.9 (release + tags).
- **Zéro entrée Tampermonkey menu** — toute l'UI passe par l'indicateur permanent.

## 4. Fonctionnalités (état 1.0.0)

- **Indicateur permanent** (haut-droite) : pill ON/OFF avec dot lumineux, ETA du
  prochain passage, compteur journalier. **Mini-menu** cliquable avec 12 actions.
  **Mode compact** : dot seul (pas de texte), toggle dans le mini-menu.
  Animations slide-in, colorées avec le thème CSS.
- **Auto-join stealth** : passages répétés avec **jitter configurable** (défaut 13-17 min,
  réglable dans le mini-menu), délai aléatoire 2-8 s entre requêtes d'un même
  passage, premier passage 5 s après chargement.
- **Fenêtre horaire** 7h-22h heure de Paris (`Intl`, heure d'été gérée) — **toujours active**.
- **Page liste uniquement** — **toujours active** (jamais sur profil/discussions).
- **Filtres de jeux** : mots-clés inclure/exclure + genres Steam (API store, cache 7 j),
  configurés via un prompt unique `filtres: ON/OFF | inclure: x | exclure: y | genres: z | ≤24h: ON/OFF`.
- **Option ≤ 24h** : ne joindre que les giveaways finissant dans les 24 prochaines heures.
- **Exclusion jeux possédés / gagnés** (toggle) :
  - bibliothèque Steam via `IPlayerService/GetOwnedGames` (clé API + SteamID64,
    SteamID64 auto-détecté depuis le header, cache 24 h) ;
  - jeux déjà gagnés via l'historique SteamGifts `/giveaways/won?page=N` (layout
    table `.table__row-outer-wrap[data-game-id]`, cache 24 h, max 10 pages).
  - Si une source est indisponible → le passage continue quand même.
- **Panneau des exclus** (bas droite) : dropdown groupé avec rails colorés par section,
  badge pill de compteur, points colorés, slide-in/out. Anti-doublon par code.
- **Notification toast** : carte colorée à 4 chips (rejoint/filtré/déjà inscrit/aujourd'hui),
  en-tête avec ETA, bouton ✕, ligne d'avertissement.
- **Signal son + flash** configurable (volume/type `sine|triangle|square|off`).
- **Compteur journalier persistant** (reset à minuit) + historique 7 jours.
- **Mode simulation** : diagnostic complet sans aucune requête envoyée.
- **Rafraîchir bibliothèque + gains (Steam)** : purge les caches 24 h.
- **Masquer giveaways rejoints** : toggle `☐ 隐藏已加入的 Giveaway` (original).
- **Palette CSS** : ~45 custom properties `--sgq-*` dans `:root`, thème clair via
  `@media (prefers-color-scheme: light)`.

## 5. Interface utilisateur

### Indicateur permanent (haut-droite)
- **Pill** : dot + état ON/OFF + ETA + compteur jour + indicateur compact
- **Mini-menu** (12 items) :
  1. ⏻ Auto-join ON/OFF (toggle)
  2. ▶ Lancer un passage maintenant
  3. 🔍 Simuler un passage (dry-run)
  4. 🔄 Rafraîchir bibliothèque + gains
  5. ⏱ Rythme des passages (prompt)
  6. ⚙ Filtres : configurer (prompt)
  7. 🎮 Exclure jeux possédés / gagnés (toggle)
  8. ⚙ Steam : configurer (prompt)
  9. 🔔 Son à chaque join (toggle)
  10. 🔔 Son : réglages (prompt)
  11. 👁 Masquer giveaways rejoints (toggle)
  12. ⬛ Mode compact (toggle)

### Tampermonkey menu
- **Aucune entrée** — le menu TM est vide.

## 6. Clés de stockage (GM_setValue)

`autoJoinEnabled`, `sgAutoJoinListOnly` (toujours true), `activeHoursEnabled` (toujours true),
`sgIntervalMin/Max`, `sgDailyCount`, `sgDailyHistory`,
`sgFilterEnabled/Include/Exclude/Genres`, `sgEndingSoonEnabled`,
`sgOwnedEnabled`, `sgSteamApiKey`, `sgSteamId`, `sgOwnedGames`,
`sgOwnedFetchedAt`, `sgOwnedSteamId`, `sgWonGames`, `sgWonFetchedAt`,
`sgSignalEnabled`, `sgSoundVolume`, `sgSoundType`, `autoJoinedCodes` (anti-doublon, max 500),
`sgGenres_<appid>` (cache genres), `hideJoined`,
`sgIndicatorCompact` (mode compact indicator).

## 7. Pièges & conventions

- **Le site bloque les accès non-navigateur** (Cloudflare "Just a moment") : impossible
  de vérifier le DOM réel depuis Node — utiliser `Test : simuler un passage` côté
  navigateur connecté pour valider.
- **Page won en layout table** : `.table__row-outer-wrap[data-game-id]` — le sélecteur
  couvre les deux layouts.
- `@connect` requis : `store.steampowered.com`, `api.steampowered.com` ; `@grant
  GM_xmlhttpRequest` (API Steam). L'historique won passe par `fetch` same-origin
  + `DOMParser` — pas de `@connect` nécessaire.
- **Footer de commit obligatoire** : `🤖 Generated with Codebuff` + `Co-Authored-By: Codebuff`.
- Tests : le harnais mocke `GM_*`, `fetch`, `DOMParser`, `Intl`, `location`, `prompt`.
  Lancer : `node SG-QuickJoin.test.js` depuis `sg-quickjoin/`.
- **Plus aucun `GM_registerMenuCommand`** dans le script — tout est dans l'indicateur.

## 8. État actuel

- **v1.0.0** publiée (SG Quick Join SE) — tag `v1.0.0`, branche `main`.
- **Refonte complète en v1.0.0** : tous les menus TM supprimés, tout migré vers
  l'indicateur permanent avec mini-menu de 12 actions. Anciennes releases purgées.
- **Historique des visual refresh** :
  - v1.5.5 = lifting toast (cartes à chips, ETA, bouton ✕)
  - v1.5.6 = lifting panneau exclus (rails, badges, slide-in)
  - v1.5.7 = indicateur permanent + palette CSS custom properties
  - v1.5.8 = menu TM réduit (18→10), suppression limite journalière
  - v1.5.9 = mode compact indicator
  - **v1.0.0 = refonte UI complète, zéro menu TM, SG Quick Join SE**
- **Cycle d'update TM vérifié** avec le harnais `D:\Codex\tmtest\` (cf. §9).
- **Processus de release** : bump `@version` → régénérer `SG-QuickJoin.meta.js`
  (`awk '/^\/\/ ==UserScript==$/{p=1} p{print} /^\/\/ ==\/UserScript==$/{p=0}' SG-QuickJoin.user.js > SG-QuickJoin.meta.js`) → **mettre à jour `CHANGELOG.md`** + `README.md` → tests → commit (footer Codebuff) → `git tag vX.Y.Z` → `gh release create vX.Y.Z --title "vX.Y.Z" --notes … SG-QuickJoin.user.js SG-QuickJoin.meta.js` → push.

## 9. Cycle d'update Tampermonkey — vérifié avec le harnais tmtest

- **Harnais** : `D:\Codex\tmtest\` — Edge + TM 5.5.0 chargé unpacked (`tm-ext`,
  profil `profile`). Test complet : `sg-cycle-storage.js` (rétrograde la version
  installée, déclenche le check d'update, vérifie le retour à la version release).
  `sg-verify-install.js` vérifie l'installation + URLs. Playwright depuis
  `D:/Codex/koharu/node_modules/playwright`.
- **Cycle vérifié** : TM résout `@downloadURL` → télécharge l'asset release
  (redirect `/latest` → version taggée) → auto-install silencieux.
- **Piège n°1 — scripts « foisted »** : une extension TM chargée *unpacked*
  déclenche `evilness=12` qui écarte le check d'update. Fix : effacer `evilness`
  du record. Dans le navigateur réel, pas de problème.
- **Piège n°2 — cache SW d'Edge** : forcer `chrome.runtime.reload()` après
  modification de `tm-ext`.
- **Piège n°3 — transport du meta** : le fetch passe par un offscreen document XHR ;
  seuls le téléchargement du `.user.js` et l'état final du stockage sont observables.
