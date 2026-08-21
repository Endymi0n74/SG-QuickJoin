"use strict";
// Test fonctionnel de SG-QuickJoin.user.js (v1.4.0)
// Exécute le script dans une VM avec des mocks et vérifie la logique clé.
const fs = require("fs");
const vm = require("vm");

const script = fs.readFileSync("SG-QuickJoin.user.js", "utf8");

// ---------- Utils ----------
let passCount = 0;
function fail(msg) {
  console.error("❌ FAIL: " + msg);
  process.exitCode = 1;
}
function ok(msg) {
  passCount++;
  console.log("✅ " + msg);
}
function assert(cond, msg) {
  if (cond) ok(msg);
  else fail(msg);
}
// Laisse les micro-tâches et les timeouts (0 ms) s'exécuter
const tick = () => new Promise((r) => setTimeout(r, 150));

// Élément DOM minimal (avec enfants, handlers et classList fonctionnels)
function el(map) {
  const node = {
    dataset: {},
    style: {},
    children: [],
    handlers: {},
    classList: {
      _set: new Set(),
      toggle(name, force) {
        const has = this._set.has(name);
        const want = force === undefined ? !has : !!force;
        if (want) this._set.add(name);
        else this._set.delete(name);
        return want;
      },
      contains(name) { return this._set.has(name); },
      add(...names) { names.forEach((n) => this._set.add(n)); },
      remove(...names) { names.forEach((n) => this._set.delete(n)); }
    },
    addEventListener(type, fn) { this.handlers[type] = fn; },
    appendChild(child) { this.children.push(child); },
    getBoundingClientRect() { return { height: 40 }; },
    getAttribute() { return null; },
    setAttribute() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    disabled: false,
    textContent: "",
    innerText: "",
    value: "",
    remove() {}
  };
  // innerHTML = "" vide les enfants (comme un vrai navigateur)
  Object.defineProperty(node, "innerHTML", {
    configurable: true,
    get() { return node._innerHTML || ""; },
    set(v) {
      node._innerHTML = v;
      if (!v) node.children.length = 0;
    }
  });
  return Object.assign(node, map);
}

// Ligne de giveaway SteamGifts fictive
function makeRow({ code, title, reqPoints, gameId, faded = false, endTime = 9999999999 }) {
  const heading = el({ innerText: title });
  heading.getAttribute = () => "/giveaway/" + code + "/x";
  const thin = el({ innerText: `(${reqPoints}P)` });
  const ts = el({});
  ts.getAttribute = () => String(endTime); // fin (secondes) ou très lointaine par défaut
  const innerWrap = el({ classList: { contains: () => !!faded } });
  const outWrap = el({});
  outWrap.getAttribute = (a) => (a === "data-game-id" ? gameId : null);
  outWrap.querySelector = (sel) => {
    if (sel === "a.giveaway__heading__name") return heading;
    if (sel === "span[data-timestamp]") return ts;
    if (sel === ".giveaway__row-inner-wrap") return innerWrap;
    return null;
  };
  outWrap.querySelectorAll = () => [thin];
  return outWrap;
}

const ROWS = [
  makeRow({ code: "aaaaaa", title: "Portal 2", reqPoints: 100, gameId: "620" }),
  makeRow({ code: "bbbbbb", title: "Dota 2", reqPoints: 0, gameId: "570" }),
  makeRow({ code: "cccccc", title: "Sid Meier's Civilization VI", reqPoints: 200, gameId: "289070" }),
  makeRow({ code: "dddddd", title: "Half-Life", reqPoints: 0, gameId: "70", faded: true }), // déjà inscrit
  makeRow({ code: "eeeeee", title: "Unknown Genre Game", reqPoints: 0, gameId: "999" }) // genre inconnu
];

const GENRE_DB = {
  "620": ["Puzzle"],
  "570": ["Action", "Free to Play"],
  "289070": ["Strategy"],
  "70": ["Action"],
  "999": []
};

// ---------- Sandbox ----------
function runSandbox(testHour, promptAnswers, rows = ROWS, steamAnchors = [], path = "/", wonAppids = []) {
  const store = {};
  const posts = [];
  const storeRequests = [];
  const menu = {};
  const timeouts = [];
  const intervals = [];
  const bodyAppends = []; // éléments ajoutés à <body> (toasts)
  const consoleLogs = []; // lignes console.info/error du script
  let ai = 0;
  const consoleMock = {
    info: (...a) => consoleLogs.push(a.join(" ")),
    error: (...a) => consoleLogs.push("ERR " + a.join(" ")),
    warn: () => {},
    log: (...a) => consoleLogs.push(a.join(" "))
  };

  const fakeIntl = {
    DateTimeFormat: class {
      constructor() {}
      formatToParts() {
        return [
          { type: "hour", value: String(testHour).padStart(2, "0") },
          { type: "minute", value: "00" }
        ];
      }
    }
  };

  const fakeWindow = {
    // setTimeout : enregistre tout ; n'exécute que les timeouts courts (< 60 s)
    // pour ne pas déclencher les intervalles 13-17 min en boucle.
    setTimeout(fn, ms) {
      timeouts.push({ fn, ms });
      if (ms <= 60000) return setTimeout(fn, 0);
      return timeouts.length;
    },
    setInterval(fn, ms) { intervals.push({ fn, ms }); return intervals.length; },
    clearInterval() {},
    clearTimeout() {},
    addEventListener() {}
  };

  const document = {
    readyState: "complete",
    body: el({ classList: { toggle() {}, contains() { return false; }, add() {}, remove() {} }, appendChild(n) { bodyAppends.push(n); } }),
    querySelector(sel) {
      if (sel === 'input[name="xsrf_token"]') return { value: "TOKEN" };
      if (sel === "span.nav__points") return { innerText: "1000" };
      return null;
    },      querySelectorAll(sel) {
        if (sel === "div.giveaway__row-outer-wrap") return rows;
        if (sel === 'a[href*="steamcommunity.com"]') return steamAnchors;
        return [];
      },
      createElement() { return el(); },
      addEventListener() {}
  };

  const sandbox = {
    window: fakeWindow,
    document,
    console: consoleMock,
    Date,
    Math,
    JSON,
    Promise,
    URLSearchParams,
    Intl: fakeIntl,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    prompt: (msg, current) => (ai < promptAnswers.length ? promptAnswers[ai++] : current),
    getComputedStyle: () => ({ paddingTop: "0px", paddingBottom: "0px" }),
    navigator: {},
    location: { href: "https://www.steamgifts.com" + path, pathname: path },
    fetch: async (url, opts) => {
      posts.push({ url, opts });
      // Historique des gains SteamGifts : page 1 = les jeux gagnés, pages suivantes vides
      if (url.includes("giveaways/won")) {
        const m = url.match(/page=(\d+)/);
        const page = m ? Number(m[1]) : 1;
        // La vraie page won affiche les gains dans un layout table
        const html = page === 1
          ? wonAppids.map((a) => '<div class="table__row-outer-wrap" data-game-id="' + a + '"></div>').join("")
          : "";
        return { ok: true, text: async () => html };
      }
      return { ok: true, json: async () => ({ type: "success", points: "990" }) };
    },
    DOMParser: class {
      parseFromString(html) {
        const rows = [];
        const re = /data-game-id="(\d+)"/g;
        let m;
        while ((m = re.exec(html))) {
          const id = m[1];
          rows.push({ getAttribute: (a) => (a === "data-game-id" ? id : null) });
        }
        return { querySelectorAll: () => rows };
      }
    },
    GM_addStyle() {},
    GM_registerMenuCommand(caption, fn) { menu[caption] = fn; return caption; },
    GM_unregisterMenuCommand(id) { delete menu[id]; },
    GM_getValue(k, d) { return k in store ? store[k] : d; },
    GM_setValue(k, v) { store[k] = v; },
    GM_xmlhttpRequest({ url, onload }) {
      storeRequests.push(url);
      // API Steam : bibliothèque (jeux possédés : Portal 2 + Half-Life)
      if (url.includes("api.steampowered.com")) {
        const owned = [620, 70];
        onload({ status: 200, responseText: JSON.stringify({ response: { game_count: owned.length, games: owned.map((a) => ({ appid: a })) } }) });
        return;
      }
      // Store Steam : genres
      const m = url.match(/appids=(\d+)/);
      const appid = m ? m[1] : null;
      const genres = (GENRE_DB[appid] || []).map((g) => ({ description: g }));
      onload({ status: 200, responseText: JSON.stringify({ [appid]: { success: true, data: { genres } } }) });
    }
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(script, sandbox, { filename: "SG-QuickJoin.user.js" });

  const firstRun = () => {
    const t = timeouts.find((x) => x.ms === 5000);
    if (!t) throw new Error("Timer 5s non trouvé");
    t.fn();
  };
  // Déclenche le passage auto suivant (délai 13-17 min, le dernier enregistré)
  const interval15 = () => {
    const entries = timeouts.filter((x) => x.ms >= 13 * 60 * 1000);
    if (!entries.length) throw new Error("Intervalle 13-17 min non trouvé");
    entries[entries.length - 1].fn();
  };
  const longIntervals = () => timeouts.filter((x) => x.ms >= 13 * 60 * 1000).map((x) => x.ms);
  const lastToast = () => [...bodyAppends].reverse().find((n) => n.className === "sg-quickjoin-toast");
  const firstToast = () => bodyAppends.find((n) => n.className === "sg-quickjoin-toast");
  return { menu, posts, storeRequests, store, timeouts, intervals, firstRun, interval15, longIntervals, bodyAppends, lastToast, firstToast, consoleLogs };
}

const joinedCodes = (s) => s.posts.filter((p) => p.opts && p.opts.body).map((p) => new URLSearchParams(p.opts.body).get("code")).sort();

// ---------- Tests ----------
(async () => {
  // 1. Commandes de menu enregistrées (menu allégé)
  {
    const s = runSandbox(10);
    const expected = [
      "☐ Auto-join (15 min)",
      "Auto-join maintenant",
      "Test : simuler un passage (aucun join)",
      "Rythme des passages (13-17 min)",
      "Limite journalière de joins (20/jour)",
      "Rafraîchir bibliothèque + gains (Steam)",
      "☑ Auto-join : page liste uniquement",
      "☑ Auto-join 7h-22h (heure FR)",
      "☐ Filtres de jeux",
      "Filtres: configurer (mots-clés / genres)",
      "☐ Exclure jeux possédés / gagnés",
      "Steam: configurer (clé API + ID)",
      "☐ Uniquement giveaways ≤ 24h",
      "☑ Son à chaque join",
      "Son: réglages (volume 40% / doux)",
      "📅 0 aujourd'hui — historique 7 jours",
      "Afficher la config"
    ];
    const missing = expected.filter((c) => !(c in s.menu));
    assert(missing.length === 0, "Commandes de menu enregistrées (" + (missing.join(", ") || "toutes présentes") + ")");
    assert(
      Object.keys(s.menu).length <= 18,
      "Menu : " + Object.keys(s.menu).length + " entrées (au lieu de 19)"
    );
  }

  // 2. À 10h : l'activation de l'auto-join joint tous les giveaways éligibles (4/5)
  {
    const s = runSandbox(10);
    s.menu["☐ Auto-join (15 min)"]();
    await tick();
    assert(
      JSON.stringify(joinedCodes(s)) === JSON.stringify(["aaaaaa", "bbbbbb", "cccccc", "eeeeee"]),
      "À 10h, passage auto join 4/5 (dddddd déjà inscrit ignoré) → " + joinedCodes(s).join(",")
    );
    assert((s.store["autoJoinedCodes"] || []).length === 4, "Les 4 codes sont mémorisés (anti-doublon)");

    // 3. Anti-doublon : timer 5s puis interval 15 min ne re-joignent rien
    s.firstRun();
    await tick();
    s.interval15();
    await tick();
    assert(s.posts.length === 4, "Passages suivants : aucun re-join (toujours 4 requêtes)");
    const toast = s.firstToast(); // notification du 1er passage
    assert(
      toast && /4 rejoints/.test(toast.textContent) && /0 filtré/.test(toast.textContent) && /1 déjà inscrit/.test(toast.textContent),
      "Notification : 4 rejoints • 0 filtré • 1 déjà inscrit → " + (toast ? toast.textContent : "aucune")
    );
    assert(toast && toast.style.top === "10px", "Notification placée en haut de page");
  }

  // 4. À 23h : aucun passage automatique ne joint (fenêtre 7h-22h)
  {
    const s = runSandbox(23);
    s.menu["☐ Auto-join (15 min)"](); // activation -> passage immédiat ignoré
    await tick();
    s.firstRun(); // timer 5s ignoré
    await tick();
    assert(s.posts.length === 0, "À 23h, aucun join automatique (0 requête)");
  }

  // 4ter. Page hors liste (profil, discussions…) : aucun passage automatique
  {
    const s = runSandbox(10, [], ROWS, [], "/user/endymion");
    s.menu["☐ Auto-join (15 min)"](); // activation -> passage immédiat ignoré (page non-liste)
    await tick();
    assert(s.posts.length === 0, "Page profil : aucun join automatique (0 requête)");
    assert(s.timeouts.filter((t) => t.ms >= 13 * 60 * 1000).length === 0, "Page profil : aucun timer 13-17 min démarré");
    // La commande manuelle, elle, fonctionne toujours (action délibérée)
    s.menu["Auto-join maintenant"]();
    await tick();
    assert(s.posts.length === 4, "Page profil : la commande manuelle join quand même (4 requêtes)");
  }

  // 4quater. Page de liste (/giveaways/search…) : l'auto-join fonctionne normalement
  {
    const s = runSandbox(10, [], ROWS, [], "/giveaways/search?q=portal");
    s.menu["☐ Auto-join (15 min)"]();
    await tick();
    assert(s.posts.length === 4, "Page /giveaways/search : 4 joins → " + joinedCodes(s).join(","));
  }

  // 4bis. Jitter : l'intervalle suivant est bien aléatoire entre 13 et 17 min
  {
    const s = runSandbox(10);
    s.menu["☐ Auto-join (15 min)"]();
    const delays = s.longIntervals();
    assert(delays.length >= 1, "Un passage 13-17 min est programmé après l'activation");
    assert(
      delays.every((d) => d >= 13 * 60 * 1000 && d <= 17 * 60 * 1000),
      "Délai programmé dans [13 min, 17 min] → " + delays.map((d) => Math.round(d / 1000) + "s").join(", ")
    );
    // Après un passage de la chaîne, un nouveau délai est reprogrammé
    s.interval15();
    await tick();
    const delays2 = s.longIntervals();
    assert(delays2.length >= 2, "Chaque passage reprogramme le suivant (2 délais enregistrés)");
    assert(delays2.every((d) => d >= 13 * 60 * 1000 && d <= 17 * 60 * 1000), "Les nouveaux délais restent dans [13 min, 17 min]");
  }

  // 5. Commande manuelle : contourne la fenêtre horaire
  {
    const s = runSandbox(23);
    s.menu["Auto-join maintenant"]();
    await tick();
    assert(s.posts.length === 4, "À 23h, commande manuelle join quand même (4 requêtes, actuel: " + s.posts.length + " → " + joinedCodes(s).join(",") + ")");
  }

  // 6. Annulation du prompt ne modifie rien
  {
    const s = runSandbox(10, [null]);
    s.menu["☐ Filtres de jeux"]();
    s.menu["Filtres: configurer (mots-clés / genres)"]();
    assert(!s.store["sgFilterInclude"], "Annulation du prompt ne modifie pas la config");
  }

  // 7. Filtre : inclure "portal" -> seul Portal 2
  {
    const s = runSandbox(10, ["inclure: portal"]);
    s.menu["☐ Filtres de jeux"]();
    s.menu["Filtres: configurer (mots-clés / genres)"]();
    s.menu["☐ Auto-join (15 min)"]();
    await tick();
    assert(JSON.stringify(joinedCodes(s)) === JSON.stringify(["aaaaaa"]), "Inclure 'portal' → seul Portal 2 → " + joinedCodes(s).join(","));
    const toast = s.firstToast(); // notification du 1er passage
    assert(
      toast && /1 rejoint/.test(toast.textContent) && /3 filtrés/.test(toast.textContent) && /1 déjà inscrit/.test(toast.textContent),
      "Notification : 1 rejoint • 3 filtrés • 1 déjà inscrit → " + (toast ? toast.textContent : "aucune")
    );
  }

  // 8. Filtre : exclure "dota" -> Dota 2 écarté
  {
    const s = runSandbox(10, ["exclure: dota"]);
    s.menu["☐ Filtres de jeux"]();
    s.menu["Filtres: configurer (mots-clés / genres)"]();
    s.menu["☐ Auto-join (15 min)"]();
    await tick();
    assert(
      JSON.stringify(joinedCodes(s)) === JSON.stringify(["aaaaaa", "cccccc", "eeeeee"]),
      "Exclure 'dota' → Dota 2 écarté → " + joinedCodes(s).join(",")
    );
  }

  // 9. Genres : "Puzzle" + inclure "portal" -> seul Portal 2
  {
    const s = runSandbox(10, ["inclure: portal", "genres: Puzzle"]);
    s.menu["☐ Filtres de jeux"]();
    s.menu["Filtres: configurer (mots-clés / genres)"]();
    s.menu["☐ Auto-join (15 min)"]();
    await tick();
    assert(JSON.stringify(joinedCodes(s)) === JSON.stringify(["aaaaaa"]), "Genres 'Puzzle' + inclure 'portal' → seul Portal 2 → " + joinedCodes(s).join(","));
  }

  // 10. Genres : "Strategy" -> seul Civilization VI (genre inconnu écarté par sécurité)
  {
    const s = runSandbox(10, ["genres: Strategy"]);
    s.menu["☐ Filtres de jeux"]();
    s.menu["Filtres: configurer (mots-clés / genres)"]();
    s.menu["☐ Auto-join (15 min)"]();
    await tick();
    assert(JSON.stringify(joinedCodes(s)) === JSON.stringify(["cccccc"]), "Genre 'Strategy' → seul Civilization VI (inconnu écarté) → " + joinedCodes(s).join(","));
  }

  // 11. Bibliothèque Steam : jeux possédés exclus (Portal 2 #620 possédé)
  {
    const s = runSandbox(10, ["MYAPIKEY", "76561198000000000"]);
    s.menu["☐ Exclure jeux possédés / gagnés"]();
    await s.menu["Steam: configurer (clé API + ID)"]();
    s.menu["☐ Auto-join (15 min)"]();
    await tick();
    assert(
      JSON.stringify(joinedCodes(s)) === JSON.stringify(["bbbbbb", "cccccc", "eeeeee"]),
      "Jeu possédé (Portal 2) exclu → " + joinedCodes(s).join(",")
    );
    const toast = s.lastToast();
    assert(
      toast && /3 rejoints/.test(toast.textContent) && /1 filtré/.test(toast.textContent) && /1 déjà inscrit/.test(toast.textContent),
      "Toast : 3 rejoints • 1 filtré • 1 déjà inscrit → " + (toast ? toast.textContent : "aucune")
    );

    // 12. Cache : un second passage ne refait pas l'appel API Steam
    const apiCalls = s.storeRequests.filter((u) => u.includes("api.steampowered.com")).length;
    s.firstRun();
    await tick();
    const apiCalls2 = s.storeRequests.filter((u) => u.includes("api.steampowered.com")).length;
    assert(apiCalls === 1 && apiCalls2 === 1, "Bibliothèque mise en cache (1 appel API, pas de re-fetch)");
    assert(s.posts.filter((p) => p.opts && p.opts.body).length === 3, "Aucun re-join des jeux non possédés au 2e passage");
  }

  // 13. Bibliothèque activée sans config : le passage continue, avec avertissement clair
  {
    const s = runSandbox(10);
    s.menu["☐ Exclure jeux possédés / gagnés"]();
    s.menu["☐ Auto-join (15 min)"]();
    await tick();
    assert(
      JSON.stringify(joinedCodes(s)) === JSON.stringify(["aaaaaa", "bbbbbb", "cccccc", "eeeeee"]),
      "Sans clé API/SteamID, les joins se font quand même (le passage n'est plus bloqué) → " + joinedCodes(s).join(",")
    );
    const toast = s.lastToast();
    assert(toast && /clé API manquante/.test(toast.textContent), "Toast d'avertissement (clé manquante) → " + (toast ? toast.textContent : "aucune"));
    assert(toast && /sans filtre possédés/.test(toast.textContent), "Toast : joins sans filtre possédés");
  }

  // 13bis. SteamID64 détecté automatiquement depuis la page (avatar du header)
  {
    const anchor = el({ getAttribute: () => "https://steamcommunity.com/profiles/76561198000000000/" });
    const s = runSandbox(10, [], ROWS, [anchor]);
    assert(s.store["sgSteamId"] === "76561198000000000", "SteamID64 détecté depuis la page → " + s.store["sgSteamId"]);
  }

  // 14. Panneau des exclus : dropdown groupant les giveaways possédés
  {
    const s = runSandbox(10, ["MYAPIKEY", "76561198000000000"]);
    s.menu["☐ Exclure jeux possédés / gagnés"]();
    await s.menu["Steam: configurer (clé API + ID)"]();
    s.menu["☐ Auto-join (15 min)"]();
    await tick();
    const panel = s.bodyAppends.find((n) => n.className === "sg-quickjoin-owned");
    assert(!!panel, "Panneau des exclus créé dans la page");
    assert(panel._toggle.textContent === "🚫 1 exclu", "Bouton du panneau : '🚫 1 exclu' → " + panel._toggle.textContent);
    const section = panel._list.children[0];
    assert(section && section.className === "sg-quickjoin-owned-section", "Une section est présente");
    assert(/🎮 Possédés/.test(section.children[0].textContent), "Section '🎮 Possédés (1)' → " + section.children[0].textContent);
    assert(section.children[1] && section.children[1].textContent === "Portal 2", "La section contient Portal 2");
    assert(section.children[1].href.includes("aaaaaa"), "Le lien pointe vers le giveaway (aaaaaa)");
    assert(panel._list.hidden === true, "Liste masquée au départ");
    panel._toggle.handlers.click();
    assert(panel._list.hidden === false, "Clic sur le bouton → liste visible");
    panel._toggle.handlers.click();
    assert(panel._list.hidden === true, "2e clic → liste masquée");
    // Pas de doublon au passage suivant
    s.firstRun();
    await tick();
    assert(panel._list.children[0].children.length === 2, "Aucun doublon au passage suivant (1 item dans la section)");
  }

  // 20. Panneau des exclus : filtres (mots-clés/genres) et option 24h, groupés
  {
    // Filtres : exclure "dota" → Dota 2 listé dans la section Filtres
    const s = runSandbox(10, ["exclure: dota"]);
    s.menu["☐ Filtres de jeux"]();
    s.menu["Filtres: configurer (mots-clés / genres)"]();
    s.menu["☐ Auto-join (15 min)"]();
    await tick();
    const panel = s.bodyAppends.find((n) => n.className === "sg-quickjoin-owned");
    assert(!!panel, "Panneau créé avec les filtres");
    assert(panel._toggle.textContent === "🚫 1 exclu", "Bouton filtres : '🚫 1 exclu' → " + panel._toggle.textContent);
    const section = panel._list.children[0];
    assert(/🔍 Filtres/.test(section.children[0].textContent), "Section filtres → " + section.children[0].textContent);
    assert(section.children[1] && section.children[1].textContent === "Dota 2", "Item : Dota 2");
  }
  {
    // Option 24h : les giveaways hors fenêtre listés dans leur propre section
    const nowSec = Math.floor(Date.now() / 1000);
    const rowsSoon = [
      makeRow({ code: "aaaaaa", title: "Portal 2", reqPoints: 100, gameId: "620", endTime: nowSec + 3600 }),
      makeRow({ code: "bbbbbb", title: "Dota 2", reqPoints: 0, gameId: "570", endTime: 9999999999 })
    ];
    const s = runSandbox(10, [], rowsSoon);
    s.menu["☐ Uniquement giveaways ≤ 24h"]();
    s.menu["☐ Auto-join (15 min)"]();
    await tick();
    const panel = s.bodyAppends.find((n) => n.className === "sg-quickjoin-owned");
    assert(!!panel, "Panneau créé avec l'option 24h");
    assert(panel._toggle.textContent === "🚫 1 exclu", "Bouton 24h : '🚫 1 exclu' → " + panel._toggle.textContent);
    const section = panel._list.children[0];
    assert(/⏳ Hors 24h/.test(section.children[0].textContent), "Section 24h → " + section.children[0].textContent);
    assert(section.children[1] && section.children[1].textContent === "Dota 2", "Item : Dota 2 (hors 24h)");
  }
  {
    // Mix : possédé + filtre dans le même panneau (2 sections)
    const s = runSandbox(10, ["MYAPIKEY", "76561198000000000", "exclure: dota"]);
    s.menu["☐ Exclure jeux possédés / gagnés"]();
    await s.menu["Steam: configurer (clé API + ID)"]();
    s.menu["☐ Filtres de jeux"]();
    s.menu["Filtres: configurer (mots-clés / genres)"]();
    s.menu["☐ Auto-join (15 min)"]();
    await tick();
    const panel = s.bodyAppends.find((n) => n.className === "sg-quickjoin-owned");
    assert(panel && panel._toggle.textContent === "🚫 2 exclus", "Bouton mixte : '🚫 2 exclus' → " + (panel ? panel._toggle.textContent : "aucun"));
    const titles = panel._list.children.map((sec) => sec.children[0].textContent).sort();
    assert(
      titles.length === 2 &&
      titles.some((t) => /🎮 Possédés/.test(t)) &&
      titles.some((t) => /🔍 Filtres/.test(t)),
      "2 sections : possédés + filtres → " + titles.join(" | ")
    );
  }

  // 15. Compteur journalier persistant (menu + notification)
  {
    const s = runSandbox(10);
    s.menu["☐ Auto-join (15 min)"]();
    await tick();
    const stored = s.store["sgDailyCount"];
    assert(stored && stored.count === 4, "Compteur journalier = 4 après le passage → " + JSON.stringify(stored));
    const now = new Date();
    const localKey = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
    assert(stored && stored.date === localKey, "Clé date du jour (" + (stored && stored.date) + ")");
    const toast = s.lastToast();
    assert(toast && /4 aujourd'hui/.test(toast.textContent), "Toast : '4 aujourd'hui' → " + (toast ? toast.textContent : "aucune"));
    assert(typeof s.menu["📅 4 aujourd'hui — historique 7 jours"] === "function", "Menu : '📅 4 aujourd'hui — historique 7 jours' après le passage");
    // 2e et 3e passages : aucun nouveau join, compteur inchangé
    s.firstRun();
    await tick();
    s.interval15();
    await tick();
    assert(s.store["sgDailyCount"].count === 4, "Compteur inchangé aux passages suivants (4)");
  }

  // 16. Option : uniquement les giveaways qui se terminent dans les 24h
  {
    const nowSec = Math.floor(Date.now() / 1000);
    const rowsSoon = [
      makeRow({ code: "aaaaaa", title: "Portal 2", reqPoints: 100, gameId: "620", endTime: nowSec + 3600 }), // fin dans 1h
      makeRow({ code: "bbbbbb", title: "Dota 2", reqPoints: 0, gameId: "570", endTime: 9999999999 }), // fin lointaine
      makeRow({ code: "cccccc", title: "Civ VI", reqPoints: 200, gameId: "289070", endTime: nowSec + 10800 }), // fin dans 3h
      makeRow({ code: "eeeeee", title: "Unknown End", reqPoints: 0, gameId: "999", endTime: 0 }) // fin inconnue
    ];
    // Avec l'option : seuls ceux ≤ 24h (et fin connue) sont joints
    const s = runSandbox(10, [], rowsSoon);
    s.menu["☐ Uniquement giveaways ≤ 24h"]();
    s.menu["☐ Auto-join (15 min)"]();
    await tick();
    assert(
      JSON.stringify(joinedCodes(s)) === JSON.stringify(["aaaaaa", "cccccc"]),
      "Seuls les giveaways ≤ 24h sont joints → " + joinedCodes(s).join(",")
    );
    const toast = s.lastToast();
    assert(toast && /2 rejoints/.test(toast.textContent) && /2 filtrés/.test(toast.textContent), "Toast : 2 rejoints • 2 filtrés → " + (toast ? toast.textContent : "aucune"));
    // Sans l'option : les 4 sont joints
    const s2 = runSandbox(10, [], rowsSoon);
    s2.menu["☐ Auto-join (15 min)"]();
    await tick();
    assert(s2.posts.length === 4, "Sans l'option, les 4 giveaways sont joints");
  }

  // 17. Signal (flash) uniquement quand un giveaway a été rejoint
  {
    const s = runSandbox(10);
    s.menu["☐ Auto-join (15 min)"]();
    await tick();
    const toast = s.lastToast();
    assert(toast && toast.classList.contains("sg-quickjoin-toast-signal"), "Passage avec joins → toast signalé (flash)");
    // Passage suivant : 0 join → pas de signal
    s.firstRun();
    await tick();
    const toast2 = s.lastToast();
    assert(
      toast2 && !toast2.classList.contains("sg-quickjoin-toast-signal"),
      "Passage sans join → pas de signal (toast2: " + (toast2 ? toast2.textContent : "aucun") + ")"
    );
    // Signal désactivé : plus de flash même avec des joins
    const s2 = runSandbox(10);
    s2.menu["☑ Son à chaque join"](); // désactive
    s2.menu["☐ Auto-join (15 min)"]();
    await tick();
    const toast3 = s2.lastToast();
    assert(toast3 && !toast3.classList.contains("sg-quickjoin-toast-signal"), "Signal désactivé → pas de flash malgré les joins");
    assert(typeof s2.menu["☐ Son à chaque join"] === "function", "Menu rebasculé : '☐ Son à chaque join'");
  }

  // 18. Réglages du son : volume et type configurables via une seule commande
  {
    const s = runSandbox(10, ["60 square"]);
    assert(typeof s.menu["Son: réglages (volume 40% / doux)"] === "function", "Menu par défaut : 'Son: réglages (volume 40% / doux)'");
    s.menu["Son: réglages (volume 40% / doux)"](); // prompt -> "60 square"
    assert(s.store["sgSoundVolume"] === 60, "Volume défini à 60 → " + s.store["sgSoundVolume"]);
    assert(s.store["sgSoundType"] === "square", "Type défini à 'square' → " + s.store["sgSoundType"]);
    assert(typeof s.menu["Son: réglages (volume 60% / aigu)"] === "function", "Menu re-régistré : 'Son: réglages (volume 60% / aigu)'");
    // Entrée invalide : inchangée
    const s2 = runSandbox(10, ["abc"]);
    s2.menu["Son: réglages (volume 40% / doux)"]();
    assert(!s2.store["sgSoundVolume"] || s2.store["sgSoundVolume"] === 40, "Volume invalide ('abc') ignoré");
    // Type 'off' : les joins fonctionnent toujours, flash seul
    const s3 = runSandbox(10, ["40 off"]);
    s3.menu["Son: réglages (volume 40% / doux)"]();
    s3.menu["☐ Auto-join (15 min)"]();
    await tick();
    assert(s3.posts.length === 4, "Type 'off' : les 4 joins fonctionnent normalement");
    const toast = s3.lastToast();
    assert(toast && toast.classList.contains("sg-quickjoin-toast-signal"), "Type 'off' : le flash reste actif");
    assert(typeof s3.menu["Son: réglages (volume 40% / flash seul)"] === "function", "Menu re-régistré : 'Son: réglages (volume 40% / flash seul)'");
  }

  // 19. Historique 7 jours : enregistrement + mini-graphique console
  {
    const s = runSandbox(10);
    s.menu["☐ Auto-join (15 min)"]();
    await tick();
    const hist = s.store["sgDailyHistory"];
    assert(hist && hist.length >= 1 && hist[hist.length - 1].count === 4, "Historique enregistré : 4 aujourd'hui → " + JSON.stringify(hist));
    assert(typeof s.menu["📅 4 aujourd'hui — historique 7 jours"] === "function", "Menu : '📅 4 aujourd'hui — historique 7 jours'");
    s.menu["📅 4 aujourd'hui — historique 7 jours"]();
    const chart = s.consoleLogs.filter((l) => l.includes(" | ") || l.includes("Historique des 7") || l.includes("Total 7 jours"));
    assert(chart.length >= 9, "Graphique console : 7 jours + en-tête + total (" + chart.length + " lignes)");
    assert(chart.some((l) => /\| 4$/.test(l)), "Le jour d'aujourd'hui affiche 4 → " + chart.filter((l) => l.includes(" | ")).join(" || "));
    // Un 2e passage ne change pas l'historique du jour (déjà inscrit)
    s.firstRun();
    await tick();
    assert(s.store["sgDailyHistory"][s.store["sgDailyHistory"].length - 1].count === 4, "Historique inchangé au 2e passage (4)");
  }

  // 22. Notification : résumé des raisons quand 0 giveaway est rejoint
  {
    // Tout déjà inscrit
    const rowsAllFaded = [
      makeRow({ code: "aaaaaa", title: "Portal 2", reqPoints: 100, gameId: "620", faded: true }),
      makeRow({ code: "bbbbbb", title: "Dota 2", reqPoints: 0, gameId: "570", faded: true })
    ];
    const s = runSandbox(10, [], rowsAllFaded);
    s.menu["☐ Auto-join (15 min)"]();
    await tick();
    const toast = s.lastToast();
    assert(
      toast && /Rien à joindre : 2 déjà inscrits/.test(toast.textContent),
      "0 rejoint : résumé '2 déjà inscrits' → " + (toast ? toast.textContent : "aucune")
    );

    // Simulation : 0 requête envoyée, verdicts détaillés en console
    const sSim = runSandbox(10, [], rowsAllFaded);
    sSim.menu["Test : simuler un passage (aucun join)"]();
    await tick();
    assert(sSim.posts.length === 0, "Simulation : aucune requête envoyée (0 post)");
    const simLines = sSim.consoleLogs.filter((l) => l.includes("🔍 Simulation"));
    assert(simLines.length === 2, "Simulation : 2 verdicts en console → " + simLines.length);
    assert(simLines.some((l) => l.includes("Portal 2") && l.includes("déjà inscrit")), "Verdict : Portal 2 → déjà inscrit → " + simLines.join(" || "));
    assert(simLines.some((l) => l.includes("Dota 2") && l.includes("déjà inscrit")), "Verdict : Dota 2 → déjà inscrit");
    const simToast = sSim.lastToast();
    assert(simToast && /🔍 Simulation : 0 à joindre/.test(simToast.textContent), "Toast simulation : 0 à joindre → " + (simToast ? simToast.textContent : "aucune"));
    assert(!sSim.store["sgDailyCount"], "Simulation : aucun compteur incrémenté");

    // Points insuffisants
    const rowsCostly = [
      makeRow({ code: "aaaaaa", title: "Portal 2", reqPoints: 5000, gameId: "620" }),
      makeRow({ code: "bbbbbb", title: "Dota 2", reqPoints: 5000, gameId: "570" })
    ];
    const s2 = runSandbox(10, [], rowsCostly);
    s2.menu["☐ Auto-join (15 min)"]();
    await tick();
    const toast2 = s2.lastToast();
    assert(
      toast2 && /2 giveaways à points insuffisants/.test(toast2.textContent),
      "0 rejoint : résumé '2 giveaways à points insuffisants' → " + (toast2 ? toast2.textContent : "aucune")
    );

    // Giveaways terminés
    const past = Math.floor(Date.now() / 1000) - 100;
    const rowsEnded = [
      makeRow({ code: "aaaaaa", title: "Portal 2", reqPoints: 0, gameId: "620", endTime: past }),
      makeRow({ code: "bbbbbb", title: "Dota 2", reqPoints: 0, gameId: "570", endTime: past })
    ];
    const s3 = runSandbox(10, [], rowsEnded);
    s3.menu["☐ Auto-join (15 min)"]();
    await tick();
    const toast3 = s3.lastToast();
    assert(toast3 && /2 terminés/.test(toast3.textContent), "0 rejoint : résumé '2 terminés' → " + (toast3 ? toast3.textContent : "aucune"));

    // Aucun giveaway sur la page
    const s4 = runSandbox(10, [], []);
    s4.menu["☐ Auto-join (15 min)"]();
    await tick();
    const toast4 = s4.lastToast();
    assert(
      toast4 && /aucun giveaway sur la page/.test(toast4.textContent),
      "0 rejoint : résumé 'aucun giveaway sur la page' → " + (toast4 ? toast4.textContent : "aucune")
    );
  }

  // 23. Mode simulation avec la bibliothèque Steam : verdicts "possédé"
  {
    const s = runSandbox(10, ["MYAPIKEY", "76561198000000000"]);
    s.menu["☐ Exclure jeux possédés / gagnés"]();
    await s.menu["Steam: configurer (clé API + ID)"]();
    s.menu["Test : simuler un passage (aucun join)"]();
    await tick();
    assert(s.posts.filter((p) => p.opts && p.opts.body).length === 0, "Simulation (possédés) : 0 requête de join envoyée");
    const sim = s.consoleLogs.filter((l) => l.includes("🔍 Simulation"));
    assert(sim.some((l) => l.includes("Portal 2") && l.includes("possédé")), "Verdict : Portal 2 → possédé → " + sim.join(" || "));
    assert(sim.some((l) => l.includes("Dota 2") && l.includes("à joindre")), "Verdict : Dota 2 → à joindre");
    const toast = s.lastToast();
    assert(toast && /3 à joindre • 1 filtré/.test(toast.textContent), "Toast simulation possédés : 3 à joindre • 1 filtré → " + (toast ? toast.textContent : "aucune"));
  }

  // 27. Exclure les jeux déjà gagnés (historique SteamGifts /giveaways/won)
  {
    const s = runSandbox(10, [], ROWS, [], "/", [570]); // Dota 2 (#570) déjà gagné
    s.menu["☐ Exclure jeux possédés / gagnés"]();
    s.menu["☐ Auto-join (15 min)"]();
    await tick();
    assert(
      JSON.stringify(joinedCodes(s)) === JSON.stringify(["aaaaaa", "cccccc", "eeeeee"]),
      "Jeu déjà gagné (Dota 2) exclu → " + joinedCodes(s).join(",")
    );
    const toast = s.lastToast();
    assert(toast && /3 rejoints/.test(toast.textContent) && /1 filtré/.test(toast.textContent), "Toast : 3 rejoints • 1 filtré → " + (toast ? toast.textContent : "aucune"));
    const panel = s.bodyAppends.find((n) => n.className === "sg-quickjoin-owned");
    assert(!!panel && panel._toggle.textContent === "🚫 1 exclu", "Panneau : '🚫 1 exclu' → " + (panel ? panel._toggle.textContent : "aucun"));
    const section = panel && panel._list.children[0];
    assert(section && /🏆 Déjà gagnés/.test(section.children[0].textContent), "Section '🏆 Déjà gagnés (1)' → " + (section ? section.children[0].textContent : "aucune"));
    assert(section && section.children[1] && section.children[1].textContent === "Dota 2", "Item : Dota 2");
    // Cache 24h : pas de re-fetch des pages won au passage suivant
    const wonFetches = s.posts.filter((p) => p.url.includes("giveaways/won")).length;
    s.firstRun();
    await tick();
    const wonFetches2 = s.posts.filter((p) => p.url.includes("giveaways/won")).length;
    assert(wonFetches === 2 && wonFetches2 === 2, "Historique des gains mis en cache (2 pages, pas de re-fetch)");
  }

  // 28. Diagnostic de simulation : compte des jeux déjà gagnés
  {
    const s = runSandbox(10, [], ROWS, [], "/", [570]);
    s.menu["☐ Exclure jeux possédés / gagnés"]();
    s.menu["Test : simuler un passage (aucun join)"]();
    await tick();
    const diag = s.consoleLogs.filter((l) => l.includes("🔍 Vérifications"));
    assert(diag.length === 1, "Diagnostic : ligne Vérifications présente → " + diag.length);
    assert(/bibliothèque Steam: indisponible/.test(diag[0]), "Diagnostic : bibliothèque indisponible (pas de clé API) → " + diag[0]);
    assert(/déjà gagnés: 1 jeu/.test(diag[0]), "Diagnostic : déjà gagnés: 1 jeu → " + diag[0]);
    // Toggle désactivé : les deux vérifications affichent 'désactivé'
    const s2 = runSandbox(10, [], ROWS, [], "/", [570]);
    s2.menu["Test : simuler un passage (aucun join)"]();
    await tick();
    const diag2 = s2.consoleLogs.filter((l) => l.includes("🔍 Vérifications"));
    assert(
      diag2.length === 1 && /bibliothèque Steam: désactivé \| déjà gagnés: désactivé/.test(diag2[0]),
      "Diagnostic (désactivé) → " + (diag2[0] || "aucune")
    );
  }

  // 29. Rafraîchir bibliothèque + gains à la demande
  {
    const s = runSandbox(10, ["MYAPIKEY", "76561198000000000"], ROWS, [], "/", [570]);
    s.menu["☐ Exclure jeux possédés / gagnés"]();
    await s.menu["Steam: configurer (clé API + ID)"](); // charge la bibliothèque (cache)
    const wonBefore = s.posts.filter((p) => p.url.includes("giveaways/won")).length;
    await s.menu["Rafraîchir bibliothèque + gains (Steam)"]();
    const wonAfter = s.posts.filter((p) => p.url.includes("giveaways/won")).length;
    assert(wonAfter === wonBefore + 2, "Rafraîchir recharge l'historique des gains (" + wonBefore + " → " + wonAfter + " fetchs)");
    const toast = s.lastToast();
    assert(
      toast && /bibliothèque: 2 jeux \| gagnés: 1 jeu/.test(toast.textContent),
      "Toast : 'bibliothèque: 2 jeux | gagnés: 1 jeu' → " + (toast ? toast.textContent : "aucune")
    );
  }

  // 26. Limite journalière de joins (filet de sécurité)
  {
    const s = runSandbox(10, ["2"]);
    assert(typeof s.menu["Limite journalière de joins (20/jour)"] === "function", "Menu par défaut : 'Limite journalière de joins (20/jour)'");
    s.menu["Limite journalière de joins (20/jour)"](); // prompt -> "2"
    assert(s.store["sgDailyJoinLimit"] === 2, "Limite réglée à 2 → " + s.store["sgDailyJoinLimit"]);
    assert(typeof s.menu["Limite journalière de joins (2/jour)"] === "function", "Menu re-régistré : 'Limite journalière de joins (2/jour)'");
    s.menu["☐ Auto-join (15 min)"]();
    await tick();
    assert(s.posts.length === 2, "Seuls 2 giveaways sont joints (limite) → " + joinedCodes(s).join(","));
    assert(s.store["sgDailyCount"] && s.store["sgDailyCount"].count === 2, "Compteur journalier = 2");
    const toast = s.lastToast();
    assert(toast && /limite journalière atteinte \(2\/2\)/.test(toast.textContent), "Toast : limite atteinte (2/2) → " + (toast ? toast.textContent : "aucune"));
    // Le passage suivant (timer 15 min) ne joint rien
    s.interval15();
    await tick();
    assert(s.posts.length === 2, "Passage suivant : aucun nouveau join (0 requête en plus)");

    // Limite 0 = désactivée : les 4 giveaways éligibles sont joints
    const s2 = runSandbox(10, ["0"]);
    s2.menu["Limite journalière de joins (20/jour)"]();
    s2.menu["☐ Auto-join (15 min)"]();
    await tick();
    assert(s2.posts.length === 4, "Limite 0 (désactivée) : les 4 giveaways éligibles sont joints → " + joinedCodes(s2).join(","));
    assert(typeof s2.menu["Limite journalière de joins (aucune)"] === "function", "Menu : 'Limite journalière de joins (aucune)'");

    // Entrée invalide : ignorée
    const s3 = runSandbox(10, ["abc"]);
    s3.menu["Limite journalière de joins (20/jour)"]();
    assert(!s3.store["sgDailyJoinLimit"], "Entrée invalide ('abc') ignorée");

    // Commande manuelle : la limite s'applique aussi (sécurité)
    const s4 = runSandbox(10, ["1"]);
    s4.menu["Limite journalière de joins (20/jour)"]();
    s4.menu["☐ Auto-join (15 min)"]();
    await tick();
    s4.menu["Auto-join maintenant"]();
    await tick();
    assert(s4.posts.length === 1, "Limite 1 : la commande manuelle ne dépasse pas la limite (1 post)");
  }

  // 25. Rythme des passages configurable depuis le menu
  {
    const s = runSandbox(10, ["5 10"]);
    assert(typeof s.menu["Rythme des passages (13-17 min)"] === "function", "Menu par défaut : 'Rythme des passages (13-17 min)'");
    s.menu["Rythme des passages (13-17 min)"](); // prompt -> "5 10"
    assert(s.store["sgIntervalMin"] === 5 && s.store["sgIntervalMax"] === 10, "Intervalle réglé à 5-10 min → " + s.store["sgIntervalMin"] + "-" + s.store["sgIntervalMax"]);
    assert(typeof s.menu["Rythme des passages (5-10 min)"] === "function", "Menu re-régistré : 'Rythme des passages (5-10 min)'");
    s.menu["☐ Auto-join (15 min)"]();
    const delays = s.timeouts.filter((x) => x.ms >= 5 * 60 * 1000).map((x) => x.ms);
    assert(
      delays.length >= 1 && delays.every((d) => d >= 5 * 60 * 1000 && d <= 10 * 60 * 1000),
      "Passages programmés dans [5 min, 10 min] → " + delays.map((d) => Math.round(d / 1000) + "s").join(", ")
    );
    // Max < min : les valeurs sont échangées
    const s2 = runSandbox(10, ["10 5"]);
    s2.menu["Rythme des passages (13-17 min)"]();
    assert(s2.store["sgIntervalMin"] === 5 && s2.store["sgIntervalMax"] === 10, "'10 5' → échangé en 5-10 min");
    // Entrée invalide : ignorée
    const s3 = runSandbox(10, ["abc"]);
    s3.menu["Rythme des passages (13-17 min)"]();
    assert(!s3.store["sgIntervalMin"], "Entrée invalide ('abc') ignorée");
    // Changement avec un passage déjà planifié : reprogrammé avec le nouveau rythme
    const s4 = runSandbox(10, ["5 10"]);
    s4.menu["☐ Auto-join (15 min)"](); // programme un délai 13-17 min
    const before = s4.timeouts.filter((x) => x.ms >= 5 * 60 * 1000).length;
    s4.menu["Rythme des passages (13-17 min)"](); // change à 5-10 → reprogramme
    const after = s4.timeouts.filter((x) => x.ms >= 5 * 60 * 1000).map((x) => x.ms);
    assert(after.length === before + 1, "Changement de rythme reprogramme le passage (" + before + " → " + after.length + " délais)");
    assert(
      after[after.length - 1] >= 5 * 60 * 1000 && after[after.length - 1] <= 10 * 60 * 1000,
      "Nouveau délai dans [5 min, 10 min] → " + Math.round(after[after.length - 1] / 1000) + "s"
    );
  }

  // === Tests indicateur permanent ===
  // L'indicateur est créé dans body et affiche l'état auto-join
  {
    const s = runSandbox(10);
    const ind = s.bodyAppends.find((n) => n.className === "sg-quickjoin-indicator");
    assert(!!ind, "Indicateur créé dans la page après chargement");
    // État par défaut : auto-join OFF
    assert(ind.classList.contains("is-off"), "État par défaut : is-off");
    assert(!ind.classList.contains("is-on"), "Pas de is-on par défaut");
    assert(ind._state.textContent === "OFF", "Texte état par défaut → OFF");
    // Aujourd'hui = 0 au chargement
    assert(ind._today.textContent.includes("0"), "Compteur journalier = 0 au chargement → " + ind._today.textContent);
  }

  // Activation auto-join : l'indicateur passe en ON
  {
    const s = runSandbox(10);
    s.menu["☐ Auto-join (15 min)"]();
    await tick();
    const ind = s.bodyAppends.find((n) => n.className === "sg-quickjoin-indicator");
    assert(ind.classList.contains("is-on"), "Après activation : is-on");
    assert(!ind.classList.contains("is-off"), "Plus de is-off après activation");
    assert(ind._state.textContent === "ON", "Texte état → ON");
    // L'ETA est affichée quand l'auto-join est planifié
    assert(ind._eta.textContent.length > 0, "ETA affichée après activation → " + ind._eta.textContent);
  }

  // Désactivation : retour OFF
  {
    const s = runSandbox(10);
    s.menu["☐ Auto-join (15 min)"](); // ON → menu re-registre avec ☑
    await tick();
    s.menu["☑ Auto-join (15 min)"](); // OFF → menu re-registre avec ☐
    const ind = s.bodyAppends.find((n) => n.className === "sg-quickjoin-indicator");
    assert(ind.classList.contains("is-off"), "Après désactivation : is-off");
    assert(!ind.classList.contains("is-on"), "Plus de is-on après désactivation");
    assert(ind._state.textContent === "OFF", "Texte état → OFF après désactivation");
    assert(ind._eta.textContent === "", "ETA vidée après désactivation");
  }

  // Ouverture / fermeture du mini-menu
  {
    const s = runSandbox(10);
    const ind = s.bodyAppends.find((n) => n.className === "sg-quickjoin-indicator");
    assert(!ind._menu.classList.contains("is-open"), "Menu masqué au départ");
    // Clic sur la barre → menu ouvert
    ind._bar.handlers.click({ stopPropagation() {} });
    assert(ind._menu.classList.contains("is-open"), "Menu ouvert après clic sur barre");
    assert(ind._bar.classList.contains("is-open"), "Barre en état is-open");
    // 2e clic → fermé
    ind._bar.handlers.click({ stopPropagation() {} });
    assert(!ind._menu.classList.contains("is-open"), "Menu fermé après 2e clic");
  }

  // Toggle auto-join depuis le mini-menu
  {
    const s = runSandbox(10);
    const ind = s.bodyAppends.find((n) => n.className === "sg-quickjoin-indicator");
    // Le bouton toggle du menu
    const toggleBtn = ind._menu._items.toggle.node;
    assert(toggleBtn, "Bouton toggle présent dans le menu");
    // Le label indique l'état actuel (OFF → clique pour activer)
    assert(ind._menu._items.toggle.labelNode.textContent.includes("OFF"), "Label toggle → OFF par défaut");
    // Clic sur toggle → active l'auto-join
    toggleBtn.handlers.click({ stopPropagation() {} });
    await tick();
    assert(s.store["autoJoinEnabled"] === true, "Toggle depuis indicateur → auto-join activé");
    assert(ind._state.textContent === "ON", "Indicateur passe à ON après toggle");
    assert(ind._menu._items.toggle.labelNode.textContent.includes("ON"), "Label toggle → ON après activation");
  }

  // Toggle son depuis le mini-menu
  {
    const s = runSandbox(10);
    const ind = s.bodyAppends.find((n) => n.className === "sg-quickjoin-indicator");
    // Son ON par défaut
    assert(s.store["sgSignalEnabled"] === undefined || s.store["sgSignalEnabled"] === true, "Son ON par défaut");
    assert(ind._menu._items.sound.labelNode.textContent.includes("ON"), "Label son → ON par défaut");
    // Clic sur sound → désactive
    const soundBtn = ind._menu._items.sound.node;
    soundBtn.handlers.click({ stopPropagation() {} });
    assert(s.store["sgSignalEnabled"] === false, "Toggle son depuis indicateur → son désactivé");
    assert(ind._menu._items.sound.labelNode.textContent.includes("OFF"), "Label son → OFF après toggle");
  }

  // Compteur journalier mis à jour après un passage
  {
    const s = runSandbox(10);
    s.menu["☐ Auto-join (15 min)"]();
    await tick();
    const ind = s.bodyAppends.find((n) => n.className === "sg-quickjoin-indicator");
    assert(ind._today.textContent.includes("4"), "Compteur = 4 après le passage → " + ind._today.textContent);
  }

  console.log("\n" + passCount + " tests passés");
  if (process.exitCode) {
    console.error("Des tests ont échoué.");
    process.exit(1);
  }
  console.log("Tous les tests passent ✅");
})().catch((e) => {
  console.error("ERREUR DE TEST:", e);
  process.exit(1);
});
