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
| `sg-quickjoin/README.md` | Installation + liste des commandes de menu |
| `sg-quickjoin/MEMO.md` | Ce mémo |

## 3. Version courante : **1.5.4**

- `node --check SG-QuickJoin.user.js` OK, **121 tests** au vert (`node SG-QuickJoin.test.js`).

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

- v1.5.4 publiée sur GitHub (repo `Endymi0n74/SG-QuickJoin`).
- Fichier racine `D:\Codex\SG-QuickJoin.user.js` = copie du dernier état (l'utilisateur
  l'avait perdu une fois — **toujours sauvegarder / pousser après une session**).
- L'utilisateur installe via Tampermonkey (glisser-déposer dans le dashboard).
