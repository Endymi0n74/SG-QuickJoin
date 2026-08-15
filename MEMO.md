# Mémo projet — SG QuickJoin

> Mémo de travail consolidé (contexte, état, conventions, pièges).
> À mettre à jour après chaque changement structurel ou nouvelle version.

## 1. Vue d'ensemble

- **Userscript Tampermonkey** pour [SteamGifts.com](https://www.steamgifts.com) :
  bouton "Join / Leave" sur chaque giveaway + **auto-join stealth** (passages réguliers
  avec jitter, fenêtre horaire, filtres, notifications discrètes).
- Fork du script de [HCLonely/SG-QuickJoin](https://github.com/HCLonely/SG-QuickJoin)
  (MIT), fortement modifié — **le code n'a plus grand-chose à voir** avec l'original.
- Repo GitHub : `Endymi0n74/SG-QuickJoin` (public).
- Workspace : `D:\Codex\sg-quickjoin\` (repo git dédié) ; les fichiers de travail
  historiques sont aussi à `D:\Codex\SG-QuickJoin.user.js` + `SG-QuickJoin.test.js`
  (copies du dernier état).

## 2. Fichiers

| Chemin | Rôle |
|---|---|
| `sg-quickjoin/SG-QuickJoin.user.js` | Le script (source de vérité, version `@version`) |
| `sg-quickjoin/SG-QuickJoin.test.js` | Harnais de test Node (VM + mocks DOM/GM_*/fetch/DOMParser) |
| `sg-quickjoin/SG-QuickJoin.meta.js` | Header seul (update check Tampermonkey) — régénérer à chaque release |
| `sg-quickjoin/README.md` | Installation + commandes de menu + auto-update + badge licence |
| `sg-quickjoin/LICENSE` | Licence MIT complète (fork + crédit original HCLonely) |
| `sg-quickjoin/MEMO.md` | Ce mémo |

## 3. Version courante : **1.5.4**

- `node --check SG-QuickJoin.user.js` OK, **121 tests** au vert (`node SG-QuickJoin.test.js`).
- **Release GitHub** : tag `v1.5.4` + 2 assets (`SG-QuickJoin.user.js` + `SG-QuickJoin.meta.js`).
- **URLs d'update** (depuis v1.5.4) :
  - `@updateURL` → `https://github.com/Endymi0n74/SG-QuickJoin/releases/latest/download/SG-QuickJoin.meta.js`
  - `@downloadURL` → `https://github.com/Endymi0n74/SG-QuickJoin/releases/latest/download/SG-QuickJoin.user.js`
- Installations pointant encore vers GreasyFork : **réinstallation manuelle une fois**
  (note d'upgrade dans README) — ensuite auto-update TM via le `.meta.js`.
- `@namespace` conservé `HCLonely` (continuité d'identité Tampermonkey) ; `@homepage`/
  `@supportURL` → repo Endymi0n74.

## 4. Fonctionnalités (état 1.5.4)

- **Auto-join stealth** : passages répétés avec **jitter configurable** (défaut 13-17 min,
  réglable au menu `Rythme des passages`), délai aléatoire 2-8 s entre requêtes d'un même
  passage, premier passage 5 s après chargement, commande manuelle `Auto-join maintenant`.
- **Fenêtre horaire** 7h-22h heure de Paris (`Intl`, heure d'été gérée) — activable/désactivable.
- **Page liste uniquement** : l'auto-join ne tourne que sur `/`, `/giveaways*`
  (jamais sur profil/discussions) — option `Auto-join : page liste uniquement`.
- **Limite journalière** (défaut 20/jour, `0` = illimitée) : arrêt net à la limite,
  reprise automatique après minuit, appliquée aussi à la commande manuelle.
- **Filtres de jeux** : mots-clés inclure/exclure + genres Steam (API store, cache 7 j),
  configurés via une seule commande (`Filtres: configurer (mots-clés / genres)`).
- **Option ≤ 24h** : ne joindre que les giveaways finissant dans les 24 prochaines heures.
- **Exclusion jeux possédés / gagnés** (toggle fusionné `Exclure jeux possédés / gagnés`) :
  - bibliothèque Steam via `IPlayerService/GetOwnedGames` (clé API + SteamID64,
    **SteamID64 auto-détecté depuis le header** de la page, cache 24 h) ;
  - jeux déjà gagnés via l'historique SteamGifts `/giveaways/won?page=N` (layout
    **table** `.table__row-outer-wrap[data-game-id]`, cache 24 h, max 10 pages).
  - Si une source est indisponible → le passage **continue quand même** avec un
    avertissement clair dans le toast (ne bloque jamais l'auto-join).
- **Panneau des exclus** (bas droite) : dropdown groupé `🎮 Possédés / 🏆 Déjà gagnés /
  🔍 Filtres / ⏳ Hors 24h`, lien vers chaque giveaway, anti-doublon par code.
- **Notification toast** : bilan par passage (`X rejoints • Y filtrés • Z déjà inscrits
  • N aujourd'hui`), résumé des raisons quand 0 rejoint, avertissements (bibliothèque,
  gains, limite).
- **Signal son + flash** configurable (volume/type `sine|triangle|square|off`),
  uniquement quand un join a eu lieu.
- **Compteur journalier persistant** (reset à minuit) + **historique 7 jours**
  (mini-graphique ASCII console) — commande fusionnée `📅 N aujourd'hui — historique 7 jours`.
- **Mode simulation** : `Test : simuler un passage (aucun join)` — diagnostic de page
  (xsrf_token, points, header, fenêtre, page liste, bibliothèque, gains) + verdict
  par giveaway en console, 0 requête envoyée.
- **Rafraîchir bibliothèque + gains (Steam)** : invalide les deux caches 24 h et recharge.
- Commandes du script original conservées : bouton Join/Leave, header fixe,
  `☐ 隐藏已加入的 Giveaway` (masquer les déjà inscrits).

## 5. Commandes de menu (16)

1. `☐/☑ Auto-join (15 min)` — toggle
2. `Auto-join maintenant` — passage manuel (contourne heures + page liste)
3. `Test : simuler un passage (aucun join)` — simulation
4. `Rythme des passages (13-17 min)` — jitter configurable (1-120 min)
5. `Limite journalière de joins (20/jour)` — filet de sécurité (0 = illimitée)
6. `Rafraîchir bibliothèque + gains (Steam)` — purge + rechargement des caches
7. `☐/☑ Auto-join : page liste uniquement`
8. `☐/☑ Auto-join 7h-22h (heure FR)`
9. `☐/☑ Filtres de jeux`
10. `Filtres: configurer (mots-clés / genres)` — format `inclure: a,b | exclure: c | genres: Indie, Strategy`
11. `☐/☑ Uniquement giveaways ≤ 24h`
12. `☐/☑ Exclure jeux possédés / gagnés`
13. `Steam: configurer (clé API + ID)` — recharge la bibliothèque après validation
14. `☐/☑ Son à chaque join`
15. `Son: réglages (volume 40% / doux)` — format `40 sine`
16. `📅 N aujourd'hui — historique 7 jours`
17. `Afficher la config` — résumé console
18. `☐/☑ 隐藏已加入的 Giveaway` (original)

## 6. Clés de stockage (GM_setValue)

`autoJoinEnabled`, `sgAutoJoinListOnly`, `activeHoursEnabled`, `sgIntervalMin/Max`,
`sgDailyJoinLimit`, `sgDailyCount`, `sgDailyHistory`, `sgFilterEnabled/Include/Exclude/Genres`,
`sgEndingSoonEnabled`, `sgOwnedEnabled`, `sgSteamApiKey`, `sgSteamId`, `sgOwnedGames`,
`sgOwnedFetchedAt`, `sgOwnedSteamId`, `sgWonGames`, `sgWonFetchedAt`,
`sgSignalEnabled`, `sgSoundVolume`, `sgSoundType`, `autoJoinedCodes` (anti-doublon, max 500),
`sgGenres_<appid>` (cache genres), `hideJoined`.

## 7. Pièges & conventions

- **Le site bloque les accès non-navigateur** (Cloudflare "Just a moment") : impossible
  de vérifier le DOM réel depuis Node — utiliser `Test : simuler un passage` côté
  navigateur connecté pour valider (selecteurs, xsrf_token, etc.).
- **Page won en layout table** : `.table__row-outer-wrap[data-game-id]` (et pas les
  lignes classiques) — le sélecteur couvre les deux layouts.
- `@connect` requis : `store.steampowered.com`, `api.steampowered.com` ; `@grant
  GM_xmlhttpRequest` (API Steam). L'historique won passe par `fetch` same-origin
  (session SteamGifts) + `DOMParser` — pas de `@connect` nécessaire pour ça.
- **Footer de commit obligatoire** : `🤖 Generated with Codebuff` + `Co-Authored-By: Codebuff`.
- Tests : le harnais mocke `GM_*`, `fetch` (ajax.php + pages won), `DOMParser`,
  `Intl` (heure contrôlable), `location` (page liste vs profil), `prompt` (réponses
  scriptées). Lancer : `node SG-QuickJoin.test.js` depuis `sg-quickjoin/`.

## 8. État actuel

- v1.5.4 publiée sur GitHub (repo `Endymi0n74/SG-QuickJoin`, release tag `v1.5.4`,
  branche `main`).
- Fichier racine `D:\Codex\SG-QuickJoin.user.js` = copie du dernier état (l'utilisateur
  l'avait perdu une fois — **toujours sauvegarder / pousser après une session**).
- L'utilisateur installe via Tampermonkey (glisser-déposer dans le dashboard ou via la
  release). Une réinstallation manuelle finale est nécessaire pour brancher l'auto-update
  GitHub (l'install actuelle pointe vers GreasyFork).
- **Processus de release** : bump `@version` → régénérer `SG-QuickJoin.meta.js`
  (`awk '/^\/\/ ==UserScript==$/{p=1} p{print} /^\/\/ ==\/UserScript==$/{p=0}' SG-QuickJoin.user.js > SG-QuickJoin.meta.js`) → tests → commit (footer Codebuff) → `git tag vX.Y.Z` → `gh release create vX.Y.Z --title "vX.Y.Z" --notes … SG-QuickJoin.user.js SG-QuickJoin.meta.js` → push.

## 9. Cycle d'update Tampermonkey — vérifié avec le harnais tmtest

- **Harnais** : `D:\Codex\tmtest\` — Edge + TM 5.5.0 chargé unpacked (`tm-ext`,
  profil `profile`). Test complet : `sg-cycle-storage.js` (rétrograde la version
  installée, déclenche le check d'update, vérifie le retour à la version release).
  `sg-verify-install.js` vérifie l'installation + URLs. Playwright depuis
  `D:/Codex/koharu/node_modules/playwright`.
- **Cycle vérifié (v1.5.4)** : version installée 1.5.3 → Trigger Update (dashboard
  TM) → TM résout `@downloadURL` → télécharge l'asset release (redirect `/latest`
  → `v1.5.4`) → auto-install silencieux → version redevient **1.5.4**, source = la
  release complète (65542 o). Log TM : `Script Updated: SG QuickJoin`.
- **Piège n°1 — scripts « foisted »** : une extension TM chargée *unpacked*
  (`--load-extension`) déclenche `chrome.runtime.onInstalled` qui marque **tous les
  scripts existants** `evilness=12` (foisted, `G.SECURE=false` dans TM 5.5.0). Le
  check d'update les écarte **silencieusement** (« No update found » sans fetch).
  Fix dans le test : effacer `evilness` du record `!extdb.@meta#<uuid>`. Dans le
  navigateur réel de l'utilisateur (TM installé depuis le store, script installé
  après), les scripts ne sont pas foisted → l'update fonctionne sans ce fix.
- **Piège n°2 — cache SW d'Edge** : le service worker met en cache `background.js`
  (les edits du fichier ne sont pas relus). Après toute modification de `tm-ext`,
  forcer `chrome.runtime.reload()` depuis le SW (fait dans `sg-cycle-storage.js`).
- **Piège n°3 — transport du meta** : le fetch de la meta passe par un *offscreen
  document* XHR (invisible pour `context.on('request')`) ; seuls le téléchargement
  du `.user.js` et l'état final du stockage sont observables — c'est suffisant pour
  prouver le cycle (la source n'est téléchargée que si la meta est plus récente).
- L'état du profil après le test : version 1.5.4 installée, `logLevel` remis à 0.
