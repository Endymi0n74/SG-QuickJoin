# Changelog

Toutes les modifications notables de **SG QuickJoin** sont documentées ici.

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) ;
le versionnage suit le champ `@version` du header du script.

## [1.5.4] — 2026-08-15

**Première release GitHub** (repo `Endymi0n74/SG-QuickJoin`, tag `v1.5.4`).

### Corrigé
- **Filtre « déjà gagnés » inopérant** : la page `/giveaways/won` de SteamGifts
  affiche les gains dans un layout *table* (`.table__row-outer-wrap[data-game-id]`),
  pas les lignes classiques. Le sélecteur couvre désormais les deux layouts.
- URLs d'update basculées de GreasyFork vers les assets GitHub
  (`@updateURL` / `@downloadURL` → `releases/latest/download/…`) + `SG-QuickJoin.meta.js`.

## [1.5.3] — 2026

### Ajouté
- Commande de menu `Rafraîchir bibliothèque + gains (Steam)` : invalide les deux
  caches 24 h (bibliothèque Steam + historique des gains) et recharge immédiatement,
  avec toast récapitulatif.

## [1.5.2] — 2026

### Ajouté
- Diagnostic de simulation enrichi : 2ᵉ ligne console indiquant le nombre de jeux
  chargés (`bibliothèque Steam: N jeux | déjà gagnés: N jeux`, ou `indisponible` /
  `désactivé`).

## [1.5.1] — 2026

### Ajouté
- **Exclusion des jeux déjà gagnés** via l'historique SteamGifts (`/giveaways/won`,
  paginé, cache 24 h) — sans clé API. Toggle fusionné avec la bibliothèque Steam
  (`Exclure jeux possédés / gagnés`), section `🏆 Déjà gagnés (N)` dans le panneau
  des exclus.

## [1.5.0] — 2026

### Ajouté
- **Limite journalière de joins** (20/jour par défaut, 0 = illimité) : filet de
  sécurité avec arrêt propre en cours de passage, arrêt des passages 15 min, reprise
  automatique après minuit. S'applique aussi à la commande manuelle.

## [1.4.4] — 2026

### Ajouté
- **Rythme des passages configurable** (menu `Rythme des passages (13-17 min)`) :
  délai aléatoire entre deux bornes (1-120 min), reprogrammation immédiate du passage
  planifié, échange automatique si bornes inversées.

## [1.4.3] — 2026

### Ajouté
- **Mode simulation** (`Test : simuler un passage`) : diagnostic complet de la page
  (giveaways détectés, `xsrf_token`, points, fenêtre horaire, filtre page-liste) +
  verdict par giveaway avec la raison exacte, **sans envoyer aucune requête**.

## [1.4.2] — 2026

### Ajouté
- **Résumé des raisons de non-join** dans la notification quand 0 giveaway est
  rejoint (terminés / points insuffisants / échecs requête / filtrés / déjà inscrits /
  page vide).

## [1.4.1] — 2026

### Ajouté
- **Auto-join limité aux pages de liste** (`/`, `/giveaways`, `/giveaways/search…`) :
  pas de timer ni de passage sur les pages profil/discussions, option `page liste
  uniquement` (activée par défaut). La commande manuelle reste disponible partout.

## [1.4.0] — 2026

### Corrigé
- **Auto-join bloqué sans config Steam** : un passage n'est plus annulé quand la
  bibliothèque est indisponible — il continue avec un avertissement clair dans le toast.
- **SteamID64 détecté automatiquement** depuis le lien du profil Steam dans le header
  (plus besoin de le saisir).

### Changé
- **Menu allégé : 13 entrées au lieu de 19** (filtres, Steam et son fusionnés en une
  commande de configuration chacun ; compteur + historique fusionnés).

## [1.3.9] — 2026

### Ajouté
- **Panneau des exclus étendu** : tous les giveaways écartés, groupés par raison
  (`🎮 Possédés`, `🔍 Filtres`, `⏳ Hors 24h`), avec lien vers chaque giveaway.

## [1.3.8] — 2026

### Ajouté
- **Historique journalier 7 jours** : enregistrement persistant des joins par jour +
  mini-graphique ASCII en console (commande `Historique 7 jours`).

## [1.3.7] — 2026

### Ajouté
- **Son configurable** : volume (0-100 %) et type (`sine` doux / `triangle` clair /
  `square` aigu / `off`) via le menu, persistants.

## [1.3.6] — 2026

### Ajouté
- **Signal son + flash discret** quand au moins un giveaway est rejoint (2 notes Web
  Audio + lueur sur la notification) — aucune notification sonore sinon.

## [1.3.5] — 2026

### Ajouté
- Option **« Uniquement giveaways ≤ 24h »** : ne joint que les giveaways se terminant
  dans les prochaines 24 h (mode sûr : fin inconnue = exclu).

## [1.1.0 → 1.3.4] — 2026

### Ajouté (au fil du développement)
- **Auto-join stealth** : passages réguliers toutes les 15 min avec jitter aléatoire
  (13-17 min), délai aléatoire 2-8 s entre chaque requête.
- **Fenêtre 7h-22h** (heure de Paris) — l'auto-join reste muet hors plage.
- **Menu Tampermonkey complet** : auto-join on/off, auto-join maintenant, filtres de
  jeux (mots-clés à inclure/exclure, genres Steam autorisés).
- **Notification discrète** après chaque passage (rejoints / filtrés / déjà inscrits /
  total du jour).
- **Vérification bibliothèque Steam** (clé API + SteamID64) pour exclure les jeux
  déjà possédés.
- **Panneau déroulant des exclus** (jeux possédés) avec liens.
- **Compteur journalier persistant** affiché dans le menu et la notification.
- Anti-doublon : un giveaway déjà auto-joint n'est jamais rejoint deux fois.

## [1.0.8] — point de départ

- Fork du script [HCLonely/SG-QuickJoin](https://github.com/HCLonely/SG-QuickJoin)
  (MIT) : bouton « Join / Leave » sur chaque giveaway de SteamGifts.

[1.5.4]: https://github.com/Endymi0n74/SG-QuickJoin/releases/tag/v1.5.4
