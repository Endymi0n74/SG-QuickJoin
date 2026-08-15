// ==UserScript==
// @name            SG QuickJoin
// @namespace       https://github.com/HCLonely/SG-QuickJoin
// @version         1.5.4
// @description     一个基于 Tampermonkey的用户脚本，为 SteamGifts.com上的每个抽奖添加一键"Join / Leave"按钮。
// @description:en  Adds a 'one-click "Join / Leave"' button to each giveaway on SteamGifts
// @author          HCLonely
// @match           https://www.steamgifts.com/*
// @license         MIT
// @tag             games
// @homepage        https://github.com/HCLonely/SG-QuickJoin
// @supportURL      https://github.com/HCLonely/SG-QuickJoin/issues
// @icon            https://github.com/HCLonely/SG-QuickJoin/blob/main/icon.ico?raw=true
// @grant           GM_addStyle
// @grant           GM_registerMenuCommand
// @grant           GM_unregisterMenuCommand
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_xmlhttpRequest
// @connect         store.steampowered.com
// @connect         api.steampowered.com
// @downloadURL https://update.greasyfork.org/scripts/580410/SG%20QuickJoin.user.js
// @updateURL https://update.greasyfork.org/scripts/580410/SG%20QuickJoin.meta.js
// ==/UserScript==

"use strict";
(() => {
  // src/main.ts
  GM_addStyle(`
  .sg-quickjoin-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: stretch;
    flex-shrink: 0;
    white-space: nowrap;
    box-sizing: border-box;
    min-width: 180px;
    padding: 0 16px;
    border-radius: 0 4px 4px 0;
    font-size: 13px;
    font-weight: 500;
    transition: background 0.2s;
  }

  .sg-quickjoin-btn[data-state="idle"] {
    background: #7ba4f7;
    color: #fff;
    cursor: pointer;
    border: none;
  }

  .sg-quickjoin-btn[data-state="loading"] {
    background: #a0a7b3;
    color: #fff;
    cursor: wait;
    border: none;
  }

  .sg-quickjoin-btn[data-state="joined"] {
    background: #e8a860;
    color: #fff;
    cursor: pointer;
    border: none;
  }

  .sg-quickjoin-btn[data-state="error"] {
    background: #e07b7b;
    color: #fff;
    cursor: pointer;
    border: none;
  }

  .sg-quickjoin-btn[data-state="insufficient"] {
    background: #c5cad2;
    color: #fff;
    cursor: not-allowed;
    border: none;
  }

  .sg-quickjoin-btn[data-state="entered"] {
    background: #e8a860;
    color: #fff;
    cursor: pointer;
    border: none;
  }

  .sg-quickjoin-btn[data-state="leaving"] {
    background: #a0a7b3;
    color: #fff;
    cursor: wait;
    border: none;
  }

  .sg-quickjoin-header-fixed {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 1000;
  }

  .sg-hide-joined .giveaway__row-outer-wrap:has(.sg-quickjoin-btn[data-state="entered"],.sg-quickjoin-btn[data-state="joined"]) {
    display: none;
  }

  .sg-quickjoin-toast {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2000;
    background: rgba(30, 34, 42, 0.92);
    color: #dfe6f0;
    border: 1px solid rgba(123, 164, 247, 0.35);
    border-radius: 6px;
    padding: 8px 14px;
    font-size: 12px;
    font-weight: 500;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
    pointer-events: none;
    opacity: 0;
    animation: sg-quickjoin-toast-in 0.25s ease forwards;
  }

  @keyframes sg-quickjoin-toast-in {
    from { opacity: 0; transform: translate(-50%, -6px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }

  .sg-quickjoin-owned {
    position: fixed;
    bottom: 12px;
    right: 12px;
    z-index: 2000;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }

  .sg-quickjoin-owned-toggle {
    background: rgba(30, 34, 42, 0.92);
    color: #e8a860;
    border: 1px solid rgba(232, 168, 96, 0.4);
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
  }

  .sg-quickjoin-owned-toggle:hover {
    background: rgba(40, 45, 55, 0.95);
  }

  .sg-quickjoin-owned-list {
    background: rgba(30, 34, 42, 0.95);
    color: #dfe6f0;
    border: 1px solid rgba(123, 164, 247, 0.35);
    border-radius: 8px;
    max-height: 40vh;
    overflow-y: auto;
    min-width: 220px;
    max-width: 320px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
  }

  .sg-quickjoin-owned-list[hidden] {
    display: none;
  }

  .sg-quickjoin-owned-item {
    display: block;
    padding: 6px 12px;
    color: #dfe6f0;
    text-decoration: none;
    font-size: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .sg-quickjoin-owned-item:last-child {
    border-bottom: none;
  }

  .sg-quickjoin-owned-item:hover {
    background: rgba(123, 164, 247, 0.15);
  }

  .sg-quickjoin-owned-section {
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .sg-quickjoin-owned-section:first-child {
    border-top: none;
  }

  .sg-quickjoin-owned-section-title {
    padding: 6px 12px 2px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #8fa3c8;
  }

  .sg-quickjoin-toast.sg-quickjoin-toast-signal {
    border-color: rgba(232, 168, 96, 0.9);
    animation: sg-quickjoin-toast-in 0.25s ease forwards, sg-quickjoin-signal 0.6s ease 2;
  }

  @keyframes sg-quickjoin-signal {
    0%, 100% { box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35); }
    50% { box-shadow: 0 0 18px 3px rgba(232, 168, 96, 0.55); }
  }
`);
  function extractCode(href) {
    if (!href) return "";
    const parts = href.split("/");
    return parts[2] ?? "";
  }
  function extractRequiredPoints(text) {
    const match = text.match(/\((\d+)P\)/i);
    return match ? parseInt(match[1], 10) : 0;
  }
  function getXsrfToken() {
    const el = document.querySelector(
      'input[name="xsrf_token"]'
    );
    return el?.value ?? "";
  }
  function getCurrentPoints() {
    const el = document.querySelector("span.nav__points");
    const text = el?.innerText?.trim() ?? "0";
    return parseInt(text, 10) || 0;
  }
  function updatePointsDisplay(points) {
    const el = document.querySelector("span.nav__points");
    if (el) {
      el.innerText = String(points);
    }
  }
  var STATE_TEXT = {
    idle: "Join",
    loading: "Joining...",
    joined: "Leave",
    error: "⚠ Error",
    insufficient: "Need more P",
    entered: "Leave",
    leaving: "Leaving...",
    ended: "Ended"
  };
  var CLICKABLE_STATES = /* @__PURE__ */ new Set(["idle", "error", "entered", "joined"]);
  var BUTTON_STATE_BATCH_SIZE = 50;
  var BUTTON_STATE_IDLE_TIMEOUT_MS = 200;
  var MIN_IDLE_TIME_REMAINING_MS = 4;
  function setButtonState(btn, state, extraText) {
    const text = STATE_TEXT[state];
    btn.textContent = extraText ? `${text} ${extraText}` : text;
    btn.disabled = !CLICKABLE_STATES.has(state);
    btn.dataset.state = state;
  }
  var allGiveaways = [];
  var isRequestInProgress = false;
  var scheduledButtonStateUpdate = null;
  var nextButtonStateUpdateIndex = 0;
  async function handleJoin(info) {
    if (isRequestInProgress) return;
    const { code, requiredPoints, endTime, button } = info;
    if (endTime > 0 && Date.now() / 1e3 >= endTime) {
      setButtonState(button, "ended");
      return;
    }
    isRequestInProgress = true;
    setButtonState(button, "loading");
    for (const gi of allGiveaways) {
      if (gi.button !== button) {
        gi.button.disabled = true;
      }
    }
    const currentPoints = getCurrentPoints();
    if (currentPoints < requiredPoints) {
      setButtonState(
        button,
        "insufficient",
        `(${currentPoints}/${requiredPoints}P)`
      );
      isRequestInProgress = false;
      updateAllButtonStates();
      return;
    }
    const xsrfToken = getXsrfToken();
    if (!xsrfToken) {
      setButtonState(button, "error");
      console.error("[SG-QuickJoin] Missing xsrf_token");
      isRequestInProgress = false;
      updateAllButtonStates();
      return;
    }
    try {
      const body = new URLSearchParams({
        xsrf_token: xsrfToken,
        do: "entry_insert",
        code
      });
      const resp = await fetch("https://www.steamgifts.com/ajax.php", {
        method: "POST",
        headers: {
          accept: "application/json, text/javascript, */*; q=0.01",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "x-requested-with": "XMLHttpRequest"
        },
        body: body.toString(),
        credentials: "include"
      });
      if (!resp.ok) {
        setButtonState(button, "error");
        return;
      }
      const data = await resp.json();
      const newPoints = parseInt(data.points ?? "0", 10);
      updatePointsDisplay(newPoints);
      updateAllButtonStates();
      if (data.type === "success") {
        setButtonState(button, "joined");
      } else {
        console.info(data);
        const errMsg = data.msg;
        setButtonState(button, "error", errMsg);
      }
    } catch (err) {
      console.error("[SG-QuickJoin] Request failed:", err);
      setButtonState(button, "error");
    } finally {
      isRequestInProgress = false;
    }
  }
  async function handleLeave(info) {
    if (isRequestInProgress) return;
    const { code, button } = info;
    isRequestInProgress = true;
    setButtonState(button, "leaving");
    for (const gi of allGiveaways) {
      if (gi.button !== button) {
        gi.button.disabled = true;
      }
    }
    const xsrfToken = getXsrfToken();
    if (!xsrfToken) {
      setButtonState(button, "error");
      button.dataset.action = "leave";
      console.error("[SG-QuickJoin] Missing xsrf_token for leave");
      isRequestInProgress = false;
      updateAllButtonStates();
      return;
    }
    try {
      const body = new URLSearchParams({
        xsrf_token: xsrfToken,
        do: "entry_delete",
        code
      });
      const resp = await fetch("https://www.steamgifts.com/ajax.php", {
        method: "POST",
        headers: {
          accept: "application/json, text/javascript, */*; q=0.01",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "x-requested-with": "XMLHttpRequest"
        },
        body: body.toString(),
        credentials: "include"
      });
      if (!resp.ok) {
        setButtonState(button, "error");
        button.dataset.action = "leave";
        return;
      }
      const data = await resp.json();
      if (data.type === "success") {
        setButtonState(button, "idle");
        button.dataset.action = "join";
        const newPoints = parseInt(data.points ?? "0", 10);
        if (newPoints > 0) {
          updatePointsDisplay(newPoints);
        }
      } else {
        const errMsg = data.msg;
        setButtonState(button, "error", errMsg);
        button.dataset.action = "leave";
        const errPoints = parseInt(data.points ?? "0", 10);
        if (errPoints > 0) {
          updatePointsDisplay(errPoints);
        }
      }
    } catch (err) {
      console.error("[SG-QuickJoin] Leave request failed:", err);
      setButtonState(button, "error");
      button.dataset.action = "leave";
    } finally {
      isRequestInProgress = false;
      updateAllButtonStates();
    }
  }
  function handleButtonClick(info) {
    const state = info.button.dataset.state;
    if (state === "entered" || state === "joined") {
      handleLeave(info);
    } else if (state === "error" && info.button.dataset.action === "leave") {
      handleLeave(info);
    } else {
      handleJoin(info);
    }
  }
  function scheduleButtonStateWork() {
    if (scheduledButtonStateUpdate) return;
    const win = window;
    if (typeof win.requestIdleCallback === "function") {
      scheduledButtonStateUpdate = {
        handle: win.requestIdleCallback(processButtonStateBatch, {
          timeout: BUTTON_STATE_IDLE_TIMEOUT_MS
        }),
        viaIdleCallback: true
      };
      return;
    }
    scheduledButtonStateUpdate = {
      handle: window.setTimeout(() => {
        processButtonStateBatch({
          didTimeout: true,
          timeRemaining: () => 0
        });
      }, 0),
      viaIdleCallback: false
    };
  }
  function clearScheduledButtonStateWork() {
    if (!scheduledButtonStateUpdate) return;
    const { handle, viaIdleCallback } = scheduledButtonStateUpdate;
    scheduledButtonStateUpdate = null;
    if (viaIdleCallback) {
      const win = window;
      win.cancelIdleCallback?.(handle);
    } else {
      window.clearTimeout(handle);
    }
  }
  function applyButtonStateForPoints(info, currentPoints) {
    const btn = info.button;
    const state = btn.dataset.state;
    if (state === "entered" || state === "joined") {
      btn.disabled = false;
      return;
    }
    if (state === "idle" || state === "insufficient" || state === "error" && btn.dataset.action !== "leave") {
      if (currentPoints < info.requiredPoints) {
        setButtonState(
          btn,
          "insufficient",
          `(${currentPoints}/${info.requiredPoints}P)`
        );
      } else {
        setButtonState(btn, "idle");
      }
    }
  }
  function processButtonStateBatch(deadline) {
    scheduledButtonStateUpdate = null;
    const currentPoints = getCurrentPoints();
    let processed = 0;
    while (nextButtonStateUpdateIndex < allGiveaways.length) {
      applyButtonStateForPoints(
        allGiveaways[nextButtonStateUpdateIndex],
        currentPoints
      );
      nextButtonStateUpdateIndex++;
      processed++;
      if (processed >= BUTTON_STATE_BATCH_SIZE || !deadline.didTimeout && deadline.timeRemaining() < MIN_IDLE_TIME_REMAINING_MS) {
        break;
      }
    }
    if (nextButtonStateUpdateIndex < allGiveaways.length) {
      scheduleButtonStateWork();
    } else {
      nextButtonStateUpdateIndex = 0;
    }
  }
  function updateAllButtonStates() {
    clearScheduledButtonStateWork();
    nextButtonStateUpdateIndex = 0;
    scheduleButtonStateWork();
  }
  function createJoinButton() {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sg-quickjoin-btn";
    return btn;
  }
  function setupGiveawayRow(outWrap) {
    const headingName = outWrap.querySelector(
      "a.giveaway__heading__name"
    );
    if (!headingName) return;
    const code = extractCode(headingName.getAttribute("href") ?? "");
    if (!code) return;
    const thinSpans = outWrap.querySelectorAll(
      "span.giveaway__heading__thin"
    );
    const thinSpan = Array.from(thinSpans).find(
      (span) => /\(\d+P\)/i.test(span.innerText)
    );
    const requiredPoints = thinSpan ? extractRequiredPoints(thinSpan.innerText) : 0;
    const timestampEl = outWrap.querySelector("span[data-timestamp]");
    const endTime = timestampEl ? Number(timestampEl.getAttribute("data-timestamp")) || 0 : 0;
    const info = {
      outWrap,
      headingName,
      code,
      gameId: outWrap.getAttribute("data-game-id") || "",
      requiredPoints: requiredPoints || 0,
      endTime,
      button: null,
      syncHeight: null
    };
    const innerWrap = outWrap.querySelector(
      ".giveaway__row-inner-wrap"
    );
    const parent = innerWrap ?? outWrap;
    const alreadyEntered = innerWrap?.classList.contains("is-faded") ?? false;
    const btn = createJoinButton();
    info.button = btn;
    if (alreadyEntered) {
      setButtonState(btn, "entered");
    } else {
      const currentPoints = getCurrentPoints();
      if (currentPoints < requiredPoints) {
        setButtonState(
          btn,
          "insufficient",
          `(${currentPoints}/${requiredPoints}P)`
        );
      } else {
        setButtonState(btn, "idle");
      }
    }
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleButtonClick(info);
    });
    function syncButtonHeight() {
      const parentHeight = parent.getBoundingClientRect().height;
      if (parentHeight === 0) return;
      const cs = getComputedStyle(parent);
      const pt = parseFloat(cs.paddingTop) || 0;
      const pb = parseFloat(cs.paddingBottom) || 0;
      if (pt > 0 || pb > 0) {
        btn.style.marginTop = -pt + "px";
        btn.style.marginBottom = -pb + "px";
        btn.style.paddingTop = pt + "px";
        btn.style.paddingBottom = pb + "px";
      }
      btn.style.height = parentHeight + "px";
    }
    info.syncHeight = syncButtonHeight;
    parent.appendChild(btn);
    syncButtonHeight();
    window.addEventListener("resize", syncButtonHeight, { passive: true });
    allGiveaways.push(info);
  }
  function fixHeader() {
    const header = document.querySelector("header");
    if (!header) return;
    header.classList.add("sg-quickjoin-header-fixed");
    document.body.style.marginTop = header.offsetHeight + "px";
  }
  var HIDE_JOINED_KEY = "hideJoined";
  function applyHideJoinedSetting(shouldHide) {
    document.body.classList.toggle("sg-hide-joined", shouldHide);
    if (!shouldHide) {
      for (const info of allGiveaways) {
        info.syncHeight();
      }
    }
  }
  function toggleHideJoined() {
    const current = GM_getValue(HIDE_JOINED_KEY, false);
    const next = !current;
    GM_setValue(HIDE_JOINED_KEY, next);
    applyHideJoinedSetting(next);
  }
  function showMore() {
    const pinnedGiveaways = document.querySelector(".pinned-giveaways");
    if (!pinnedGiveaways) return;
    pinnedGiveaways.classList.add("pinned-giveaways-expanded");
    const pinnedGiveawaysText = document.querySelector(".pinned-giveaways-expand");
    if (!pinnedGiveawaysText) return;
    pinnedGiveawaysText.innerText = "Show Fewer";
  }
  var menuCommandId;
  function registerHideJoinedMenu() {
    if (menuCommandId) {
      GM_unregisterMenuCommand(menuCommandId);
    }
    const isHidden = GM_getValue(HIDE_JOINED_KEY, false);
    const caption = isHidden ? "☑ 显示已加入的 Giveaway" : "☐ 隐藏已加入的 Giveaway";
    menuCommandId = GM_registerMenuCommand(caption, () => {
      toggleHideJoined();
      registerHideJoinedMenu();
    });
  }
  registerHideJoinedMenu();

  // === Auto-join stealth (toutes les 15 minutes) ===
  // Intervalle entre passages avec jitter aléatoire (13-17 min par défaut, réglable au menu)
  var AUTO_JOIN_INTERVAL_MIN_KEY = "sgIntervalMin";
  var AUTO_JOIN_INTERVAL_MAX_KEY = "sgIntervalMax";
  var AUTO_JOIN_INTERVAL_DEFAULT_MIN = 13;
  var AUTO_JOIN_INTERVAL_DEFAULT_MAX = 17;
  var AUTO_JOIN_INTERVAL_LIMIT_MIN = 1;
  var AUTO_JOIN_INTERVAL_LIMIT_MAX = 120;
  var intervalMenuId = null;
  function getIntervalRangeMinutes() {
    const clamp = (v, d) => (Number.isFinite(v)
      ? Math.max(AUTO_JOIN_INTERVAL_LIMIT_MIN, Math.min(AUTO_JOIN_INTERVAL_LIMIT_MAX, Math.round(v)))
      : d);
    return {
      min: clamp(Number(GM_getValue(AUTO_JOIN_INTERVAL_MIN_KEY, AUTO_JOIN_INTERVAL_DEFAULT_MIN)), AUTO_JOIN_INTERVAL_DEFAULT_MIN),
      max: clamp(Number(GM_getValue(AUTO_JOIN_INTERVAL_MAX_KEY, AUTO_JOIN_INTERVAL_DEFAULT_MAX)), AUTO_JOIN_INTERVAL_DEFAULT_MAX)
    };
  }
  function getIntervalRangeMs() {
    const r = getIntervalRangeMinutes();
    return { minMs: r.min * 60 * 1000, maxMs: r.max * 60 * 1000 };
  }
  var AUTO_JOIN_DELAY_MIN_MS = 2000; // délai aléatoire entre deux auto-joins
  var AUTO_JOIN_DELAY_MAX_MS = 8000;
  var AUTO_JOIN_KEY = "autoJoinEnabled";
  var AUTO_JOINED_KEY = "autoJoinedCodes";
  var AUTO_JOINED_MAX = 500;
  var autoJoinTimer = null;
  var autoJoinMenuId = null;
  var isAutoJoinPassInProgress = false; // empêche deux passages simultanés (double join)

  // Auto-join limité à la page de liste des giveaways (pas de joins sur profil/discussions…)
  var AUTO_JOIN_LIST_ONLY_KEY = "sgAutoJoinListOnly";
  var autoJoinListOnlyMenuId = null;
  function isAutoJoinListOnlyEnabled() {
    return GM_getValue(AUTO_JOIN_LIST_ONLY_KEY, true);
  }
  function isGiveawaysListPage() {
    const path = (location.pathname || "").replace(/\/+$/, "") || "/";
    return path === "/" || path === "/giveaways" || path.startsWith("/giveaways/");
  }

  // Fenêtre horaire : auto-join uniquement entre 7h et 22h (heure de Paris)
  var ACTIVE_HOURS_START = 7;
  var ACTIVE_HOURS_END = 22;
  var ACTIVE_HOURS_KEY = "activeHoursEnabled";
  var activeHoursMenuId = null;

  // Filtres de jeux
  var FILTER_ENABLED_KEY = "sgFilterEnabled";
  var FILTER_INCLUDE_KEY = "sgFilterInclude";
  var FILTER_EXCLUDE_KEY = "sgFilterExclude";
  var FILTER_GENRES_KEY = "sgFilterGenres";
  var GENRE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
  var filterMenuId = null;

  // Option : ne joindre que les giveaways qui se terminent dans les 24h
  var ENDING_SOON_KEY = "sgEndingSoonEnabled";
  var ENDING_SOON_WINDOW_MS = 24 * 60 * 60; // en secondes
  var endingSoonMenuId = null;
  function isEndingSoonEnabled() {
    return GM_getValue(ENDING_SOON_KEY, false);
  }

  function isAutoJoinEnabled() {
    return GM_getValue(AUTO_JOIN_KEY, false);
  }
  function setAutoJoinEnabled(value) {
    GM_setValue(AUTO_JOIN_KEY, value);
  }
  function getAutoJoinedCodes() {
    const raw = GM_getValue(AUTO_JOINED_KEY, []);
    return new Set(Array.isArray(raw) ? raw : []);
  }
  function markAutoJoined(code) {
    const codes = Array.from(getAutoJoinedCodes());
    codes.push(code);
    GM_setValue(AUTO_JOINED_KEY, codes.length > AUTO_JOINED_MAX ? codes.slice(-AUTO_JOINED_MAX) : codes);
  }

  // === Heures actives (Europe/Paris) ===
  function isActiveHoursEnabled() {
    return GM_getValue(ACTIVE_HOURS_KEY, true);
  }
  function getParisTime() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Paris",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date());
    const get = (type) => Number(parts.find((p) => p.type === type)?.value ?? 0);
    return { hour: get("hour"), minute: get("minute") };
  }
  function isWithinActiveHours() {
    if (!isActiveHoursEnabled()) return true;
    const { hour } = getParisTime();
    return hour >= ACTIVE_HOURS_START && hour < ACTIVE_HOURS_END;
  }

  // === Filtres de jeux ===
  function isFilterEnabled() {
    return GM_getValue(FILTER_ENABLED_KEY, false);
  }
  function getFilterConfig() {
    return {
      include: GM_getValue(FILTER_INCLUDE_KEY, "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
      exclude: GM_getValue(FILTER_EXCLUDE_KEY, "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
      genres: GM_getValue(FILTER_GENRES_KEY, "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    };
  }
  function gmFetchText(url) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url,
        onload: (resp) => resolve(resp),
        onerror: (err) => reject(err)
      });
    });
  }
  async function getGameGenres(gameId) {
    if (!gameId) return null;
    const cacheKey = "sgGenres_" + gameId;
    const cached = GM_getValue(cacheKey, null);
    if (cached && Array.isArray(cached.genres) && Date.now() - (cached.fetchedAt || 0) < GENRE_CACHE_TTL_MS) {
      return cached.genres;
    }
    try {
      const resp = await gmFetchText(
        "https://store.steampowered.com/api/appdetails?appids=" + encodeURIComponent(gameId) + "&l=french&filters=genres"
      );
      if (resp.status !== 200) return null;
      const data = JSON.parse(resp.responseText);
      const app = data[gameId];
      const genres = app && app.success && app.data && Array.isArray(app.data.genres)
        ? app.data.genres.map((g) => g.description)
        : [];
      GM_setValue(cacheKey, { genres, fetchedAt: Date.now() });
      return genres;
    } catch (err) {
      console.error("[SG-QuickJoin] Récupération des genres échouée:", err);
      return null;
    }
  }
  // Retourne la raison du rejet (chaîne) ou null si le giveaway passe les filtres
  async function matchesFilters(info) {
    if (!isFilterEnabled()) return null;
    const cfg = getFilterConfig();
    const title = (info.headingName?.innerText ?? "").trim().toLowerCase();
    if (cfg.exclude.length && cfg.exclude.some((k) => title.includes(k))) {
      return "mots-clés exclus";
    }
    if (cfg.include.length && !cfg.include.some((k) => title.includes(k))) {
      return "hors mots-clés inclus";
    }
    if (cfg.genres.length) {
      const genres = await getGameGenres(info.gameId);
      if (!genres || !genres.some((g) => cfg.genres.includes(g.toLowerCase()))) {
        return "genre non autorisé";
      }
    }
    return null;
  }

  // === Vérification des jeux déjà gagnés (historique SteamGifts /giveaways/won) ===
  // URL vérifiée : https://www.steamgifts.com/giveaways/won?page=N — la page won affiche
  // les gains dans un layout TABLE (.table__row-outer-wrap), pas des lignes classiques.
  var WON_GAMES_KEY = "sgWonGames";
  var WON_FETCHED_KEY = "sgWonFetchedAt";
  var WON_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  var WON_MAX_PAGES = 10;
  function fetchWonPage(page) {
    return new Promise((resolve, reject) => {
      fetch("https://www.steamgifts.com/giveaways/won?page=" + page, {
        method: "GET",
        credentials: "include",
        headers: { accept: "text/html,application/xhtml+xml,*/*;q=0.8" }
      }).then(async (resp) => {
        if (!resp.ok) {
          resolve(null);
          return;
        }
        const html = await resp.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        // Lignes classiques ET lignes table (page won) — les deux portent data-game-id
        const rows = doc.querySelectorAll("div.giveaway__row-outer-wrap[data-game-id], .table__row-outer-wrap[data-game-id]");
        const appids = [];
        rows.forEach((r) => {
          const id = Number(r.getAttribute("data-game-id"));
          if (Number.isFinite(id) && id > 0) appids.push(id);
        });
        resolve(appids);
      }).catch(reject);
    });
  }
  // Retourne un Set d'appids déjà gagnés, ou null si l'historique est indisponible
  async function getWonGamesSet() {
    const cached = GM_getValue(WON_GAMES_KEY, null);
    const fetchedAt = GM_getValue(WON_FETCHED_KEY, 0);
    if (cached && Array.isArray(cached) && Date.now() - fetchedAt < WON_CACHE_TTL_MS) {
      return new Set(cached);
    }
    try {
      const all = [];
      for (let page = 1; page <= WON_MAX_PAGES; page++) {
        const appids = await fetchWonPage(page);
        if (appids === null) {
          if (page === 1) return null;
          break; // page ultérieure indisponible : on garde ce qu'on a déjà
        }
        all.push(...appids);
        if (appids.length === 0) break;
      }
      GM_setValue(WON_GAMES_KEY, all);
      GM_setValue(WON_FETCHED_KEY, Date.now());
      console.info("[SG-QuickJoin] Historique des gains SteamGifts chargé:", all.length, "jeux");
      return new Set(all);
    } catch (err) {
      console.error("[SG-QuickJoin] Chargement historique des gains échoué:", err);
      return null;
    }
  }

  // === Vérification réelle de la bibliothèque Steam (API key + SteamID) ===
  var OWNED_ENABLED_KEY = "sgOwnedEnabled";
  var OWNED_GAMES_KEY = "sgOwnedGames";
  var OWNED_FETCHED_KEY = "sgOwnedFetchedAt";
  var OWNED_STEAMID_KEY = "sgOwnedSteamId";
  var STEAM_API_KEY_KEY = "sgSteamApiKey";
  var STEAM_ID_KEY = "sgSteamId";
  var OWNED_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  var ownedMenuId = null;

  function isOwnedEnabled() {
    return GM_getValue(OWNED_ENABLED_KEY, false);
  }
  function getSteamConfig() {
    return {
      apiKey: GM_getValue(STEAM_API_KEY_KEY, "").trim(),
      steamId: GM_getValue(STEAM_ID_KEY, "").trim()
    };
  }
  // Détecte automatiquement le SteamID64 depuis les liens Steam du site (avatar du header),
  // pour ne pas avoir à le saisir à la main.
  function detectSteamIdFromPage() {
    const roots = [];
    const header = document.querySelector("header");
    if (header && typeof header.querySelectorAll === "function") roots.push(header);
    roots.push(document);
    for (const root of roots) {
      const anchors = root.querySelectorAll('a[href*="steamcommunity.com"]');
      for (const a of anchors) {
        const href = a.getAttribute("href") || "";
        const m = href.match(/steamcommunity\.com\/profiles\/(\d{15,17})/);
        if (m) return m[1];
      }
    }
    return "";
  }
  // Panneau déroulant : tous les giveaways exclus, groupés par raison
  var excludedGames = [];
  var excludedPanel = null;
  var EXCLUDED_GROUPS = [
    { reason: "owned", label: "🎮 Possédés" },
    { reason: "won", label: "🏆 Déjà gagnés" },
    { reason: "filters", label: "🔍 Filtres (mots-clés/genres)" },
    { reason: "ending", label: "⏳ Hors 24h" }
  ];
  function trackExcluded(code, title, reason) {
    if (excludedGames.some((g) => g.code === code)) return;
    excludedGames.push({ code, title, reason });
    renderExcludedPanel();
  }
  function renderExcludedPanel() {
    if (!excludedGames.length) {
      if (excludedPanel) {
        excludedPanel.remove();
        excludedPanel = null;
      }
      return;
    }
    if (!excludedPanel) {
      excludedPanel = document.createElement("div");
      excludedPanel.className = "sg-quickjoin-owned";
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "sg-quickjoin-owned-toggle";
      const list = document.createElement("div");
      list.className = "sg-quickjoin-owned-list";
      list.hidden = true;
      excludedPanel.appendChild(toggle);
      excludedPanel.appendChild(list);
      toggle.addEventListener("click", () => {
        list.hidden = !list.hidden;
        toggle.classList.toggle("is-open", !list.hidden);
      });
      document.body.appendChild(excludedPanel);
      excludedPanel._toggle = toggle;
      excludedPanel._list = list;
    }
    const count = excludedGames.length;
    excludedPanel._toggle.textContent = "🚫 " + count + " exclu" + (count > 1 ? "s" : "");
    excludedPanel._list.innerHTML = "";
    for (const group of EXCLUDED_GROUPS) {
      const items = excludedGames.filter((g) => g.reason === group.reason);
      if (!items.length) continue;
      const section = document.createElement("div");
      section.className = "sg-quickjoin-owned-section";
      const title = document.createElement("div");
      title.className = "sg-quickjoin-owned-section-title";
      title.textContent = group.label + " (" + items.length + ")";
      section.appendChild(title);
      for (const g of items) {
        const item = document.createElement("a");
        item.className = "sg-quickjoin-owned-item";
        item.href = "https://www.steamgifts.com/giveaway/" + g.code + "/";
        item.textContent = g.title;
        item.target = "_blank";
        section.appendChild(item);
      }
      excludedPanel._list.appendChild(section);
    }
  }

  // Retourne un Set d'appids possédés, ou null si indisponible (config absente, échec réseau…)
  async function getOwnedGamesSet() {
    const cfg = getSteamConfig();
    if (!cfg.apiKey || !cfg.steamId) return null;
    const cached = GM_getValue(OWNED_GAMES_KEY, null);
    const fetchedAt = GM_getValue(OWNED_FETCHED_KEY, 0);
    const cachedSteamId = GM_getValue(OWNED_STEAMID_KEY, "");
    if (cached && Array.isArray(cached) && cachedSteamId === cfg.steamId && Date.now() - fetchedAt < OWNED_CACHE_TTL_MS) {
      return new Set(cached);
    }
    try {
      const url = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=" +
        encodeURIComponent(cfg.apiKey) + "&steamid=" + encodeURIComponent(cfg.steamId) +
        "&include_appinfo=false&format=json";
      const resp = await gmFetchText(url);
      if (resp.status !== 200) return null;
      const data = JSON.parse(resp.responseText);
      const games = data.response && Array.isArray(data.response.games) ? data.response.games : null;
      if (!games) return null;
      const appids = games.map((g) => Number(g.appid)).filter((n) => Number.isFinite(n) && n > 0);
      GM_setValue(OWNED_GAMES_KEY, appids);
      GM_setValue(OWNED_FETCHED_KEY, Date.now());
      GM_setValue(OWNED_STEAMID_KEY, cfg.steamId);
      console.info("[SG-QuickJoin] Bibliothèque Steam chargée:", appids.length, "jeux");
      return new Set(appids);
    } catch (err) {
      console.error("[SG-QuickJoin] Chargement bibliothèque Steam échoué:", err);
      return null;
    }
  }

  // Version "stealth" : aucune animation, aucun bouton désactivé,
  // requête ajax directe sans perturber l'affichage.
  // Retourne { sent, joined, reason } — reason ("ended"/"insufficient"/"error")
  // explique pourquoi un giveaway n'a pas pu être rejoint.
  async function stealthJoin(info) {
    const { code, requiredPoints, endTime, button } = info;
    if (endTime > 0 && Date.now() / 1e3 >= endTime) return { sent: false, joined: false, reason: "ended" };
    if (getCurrentPoints() < requiredPoints) return { sent: false, joined: false, reason: "insufficient" };
    const xsrfToken = getXsrfToken();
    if (!xsrfToken) return { sent: false, joined: false, reason: "error" };
    let sent = false;
    let joined = false;
    let reason = null;
    try {
      const body = new URLSearchParams({
        xsrf_token: xsrfToken,
        do: "entry_insert",
        code
      });
      sent = true;
      const resp = await fetch("https://www.steamgifts.com/ajax.php", {
        method: "POST",
        headers: {
          accept: "application/json, text/javascript, */*; q=0.01",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "x-requested-with": "XMLHttpRequest"
        },
        body: body.toString(),
        credentials: "include"
      });
      if (!resp.ok) {
        reason = "error";
        return { sent, joined, reason };
      }
      const data = await resp.json();
      const newPoints = parseInt(data.points ?? "0", 10);
      if (newPoints > 0) {
        updatePointsDisplay(newPoints);
      }
      if (data.type === "success") {
        markAutoJoined(code);
        joined = true;
        incrementDailyCount();
        if (button) setButtonState(button, "joined");
        console.info("[SG-QuickJoin] Auto-join réussi:", code);
      } else {
        const msg = String(data.msg || "");
        // Déjà inscrit : on marque le code pour ne pas réessayer
        if (/already entered|already participated/i.test(msg)) {
          markAutoJoined(code);
          joined = true;
          if (button) setButtonState(button, "joined");
        } else {
          reason = "error";
          console.info("[SG-QuickJoin] Auto-join ignoré:", code, data.msg);
        }
      }
    } catch (err) {
      reason = "error";
      console.error("[SG-QuickJoin] Auto-join échoué:", err);
    }
    return { sent, joined, reason };
  }

  function randomDelay(minMs, maxMs) {
    const ms = minMs + Math.random() * (maxMs - minMs);
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  // === Notification discrète en haut de page ===
  var TOAST_DURATION_MS = 4000;
  var activeToast = null;
  function showAutoJoinToast(joinedCount, filteredCount, alreadyCount, customMessage, warningText) {
    const plural = (n, s) => s + (n > 1 ? "s" : "");
    const base = "SG QuickJoin — " + joinedCount + " " + plural(joinedCount, "rejoint") +
      " • " + filteredCount + " " + plural(filteredCount, "filtré") +
      " • " + alreadyCount + " " + plural(alreadyCount, "déjà inscrit") +
      " • " + getDailyCount() + " aujourd'hui";
    const message = customMessage || (warningText ? base + " — " + warningText : base);
    const header = document.querySelector("header");
    const top = header ? header.offsetHeight + 10 : 10;
    if (activeToast) {
      if (activeToast._timer) window.clearTimeout(activeToast._timer);
      activeToast.remove();
      activeToast = null;
    }
    const toast = document.createElement("div");
    toast.className = "sg-quickjoin-toast";
    toast.style.top = top + "px";
    toast.textContent = message;
    if (joinedCount > 0 && isSignalEnabled()) {
      toast.classList.add("sg-quickjoin-toast-signal");
      playJoinSound();
    }
    document.body.appendChild(toast);
    activeToast = toast;
    toast._timer = window.setTimeout(() => {
      toast.remove();
      if (activeToast === toast) activeToast = null;
    }, TOAST_DURATION_MS);
  }

  // === Signal (son + flash) à chaque join ===
  var SIGNAL_ENABLED_KEY = "sgSignalEnabled";
  var SOUND_VOLUME_KEY = "sgSoundVolume";
  var SOUND_TYPE_KEY = "sgSoundType";
  var SOUND_PRESETS = {
    sine: { freqs: [440, 880], type: "sine" },      // doux
    triangle: { freqs: [523, 784], type: "triangle" }, // clair
    square: { freqs: [660, 990], type: "square" }   // aigu
  };
  var signalMenuId = null;
  var soundSettingsMenuId = null;
  var audioCtx = null;
  function isSignalEnabled() {
    return GM_getValue(SIGNAL_ENABLED_KEY, true);
  }
  function getSoundVolume() {
    const v = Number(GM_getValue(SOUND_VOLUME_KEY, 40));
    return Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 40;
  }
  function getSoundType() {
    const t = GM_getValue(SOUND_TYPE_KEY, "sine");
    return t === "off" || SOUND_PRESETS[t] ? t : "sine";
  }
  function getAudioCtx() {
    if (!audioCtx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) audioCtx = new AC();
      } catch (err) {
        audioCtx = null;
      }
    }
    return audioCtx;
  }
  function resumeAudio() {
    const ctx = getAudioCtx();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  }
  // Les navigateurs bloquent l'audio tant qu'il n'y a pas eu d'interaction :
  // on débloque le contexte au premier clic / appui sur une touche.
  function enableAudioOnFirstInteraction() {
    const resume = () => resumeAudio();
    window.addEventListener("pointerdown", resume, { once: true, passive: true });
    window.addEventListener("keydown", resume, { once: true, passive: true });
  }
  enableAudioOnFirstInteraction();
  // Deux petites notes (sans fichier externe), volume et type configurables
  function playJoinSound() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    resumeAudio();
    if (ctx.state !== "running") return;
    const type = getSoundType();
    const volume = getSoundVolume();
    if (type === "off" || volume <= 0) return;
    const preset = SOUND_PRESETS[type];
    const gainTarget = 0.08 * (volume / 100);
    try {
      const now = ctx.currentTime;
      preset.freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = preset.type;
        osc.frequency.value = freq;
        const t = now + i * 0.12;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(Math.max(gainTarget, 0.001), t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.14);
      });
    } catch (err) {
      console.error("[SG-QuickJoin] Son impossible:", err);
    }
  }

  // === Compteur journalier persistant ===
  var DAILY_COUNT_KEY = "sgDailyCount";
  var DAILY_HISTORY_KEY = "sgDailyHistory";
  var DAILY_HISTORY_MAX = 14;
  var dailyCountMenuId = null;
  function getDailyHistory() {
    const raw = GM_getValue(DAILY_HISTORY_KEY, []);
    return Array.isArray(raw) ? raw : [];
  }
  function printDailyHistory() {
    const hist = getDailyHistory();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      const entry = hist.find((e) => e.date === key);
      days.push({ key, count: entry ? Number(entry.count) || 0 : 0 });
    }
    const max = Math.max(1, ...days.map((d) => d.count));
    const width = 20;
    const lines = ["[SG-QuickJoin] Historique des 7 derniers jours :"];
    for (const day of days) {
      const barLen = Math.round((day.count / max) * width);
      const bar = "█".repeat(barLen).padEnd(width, "░");
      lines.push(day.key.slice(5) + " | " + bar + " | " + day.count);
    }
    const total = days.reduce((sum, d) => sum + d.count, 0);
    lines.push("Total 7 jours : " + total + " giveaway" + (total > 1 ? "s" : "") + " rejoint" + (total > 1 ? "s" : ""));
    for (const line of lines) {
      console.info(line);
    }
  }
  function getTodayKey() {
    const now = new Date();
    return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  }
  function getDailyCount() {
    const stored = GM_getValue(DAILY_COUNT_KEY, null);
    if (!stored || stored.date !== getTodayKey()) return 0;
    return Number(stored.count) || 0;
  }
  function incrementDailyCount() {
    const key = getTodayKey();
    const stored = GM_getValue(DAILY_COUNT_KEY, null);
    const count = stored && stored.date === key ? (Number(stored.count) || 0) + 1 : 1;
    GM_setValue(DAILY_COUNT_KEY, { date: key, count });
    // Historique (garde les 14 derniers jours)
    const hist = getDailyHistory();
    const idx = hist.findIndex((e) => e.date === key);
    if (idx >= 0) hist[idx].count = count;
    else hist.push({ date: key, count });
    GM_setValue(DAILY_HISTORY_KEY, hist.length > DAILY_HISTORY_MAX ? hist.slice(-DAILY_HISTORY_MAX) : hist);
    registerDailyCountMenu();
    return count;
  }
  function registerDailyCountMenu() {
    if (dailyCountMenuId) {
      GM_unregisterMenuCommand(dailyCountMenuId);
    }
    const count = getDailyCount();
    const caption = "📅 " + count + " aujourd'hui — historique 7 jours";
    dailyCountMenuId = GM_registerMenuCommand(caption, () => {
      printDailyHistory();
      showAutoJoinToast(0, 0, 0, "SG QuickJoin — 📅 " + count + " giveaway" + (count > 1 ? "s" : "") + " rejoint" + (count > 1 ? "s" : "") + " aujourd'hui");
    });
  }
  registerDailyCountMenu();

  // === Limite journalière de joins (filet de sécurité) ===
  var DAILY_JOIN_LIMIT_KEY = "sgDailyJoinLimit";
  var DAILY_JOIN_LIMIT_DEFAULT = 20;
  var DAILY_JOIN_LIMIT_MAX = 200;
  var dailyJoinLimitMenuId = null;
  function getDailyJoinLimit() {
    const v = Number(GM_getValue(DAILY_JOIN_LIMIT_KEY, DAILY_JOIN_LIMIT_DEFAULT));
    return Number.isFinite(v) ? Math.max(0, Math.min(DAILY_JOIN_LIMIT_MAX, Math.round(v))) : DAILY_JOIN_LIMIT_DEFAULT;
  }
  function registerDailyJoinLimitMenu() {
    if (dailyJoinLimitMenuId) {
      GM_unregisterMenuCommand(dailyJoinLimitMenuId);
    }
    const limit = getDailyJoinLimit();
    const caption = limit > 0 ? "Limite journalière de joins (" + limit + "/jour)" : "Limite journalière de joins (aucune)";
    dailyJoinLimitMenuId = GM_registerMenuCommand(caption, () => {
      const current = String(limit);
      const input = prompt("Nombre max de joins par jour (0 = pas de limite, max " + DAILY_JOIN_LIMIT_MAX + ") :", current);
      if (input === null) return;
      const v = Number(String(input).trim());
      if (Number.isFinite(v)) {
        GM_setValue(DAILY_JOIN_LIMIT_KEY, Math.max(0, Math.min(DAILY_JOIN_LIMIT_MAX, Math.round(v))));
        registerDailyJoinLimitMenu();
      }
    });
  }
  registerDailyJoinLimitMenu();

  async function runAutoJoin(manual, dryRun) {
    if (isAutoJoinPassInProgress) return;
    if (isRequestInProgress) return;
    // Un passage automatique exige l'auto-join activé ; la commande manuelle fonctionne toujours
    if (!manual && !isAutoJoinEnabled()) return;
    if (!manual && isAutoJoinListOnlyEnabled() && !isGiveawaysListPage()) {
      console.info("[SG-QuickJoin] Page hors liste giveaways, passage ignoré");
      return;
    }
    if (!manual && !isWithinActiveHours()) {
      console.info("[SG-QuickJoin] Hors des heures actives (7h-22h), passage ignoré");
      return;
    }
    // Filet de sécurité : arrêt si la limite journalière de joins est atteinte
    if (!dryRun && getDailyJoinLimit() > 0 && getDailyCount() >= getDailyJoinLimit()) {
      console.info("[SG-QuickJoin] Limite journalière atteinte (" + getDailyCount() + "/" + getDailyJoinLimit() + "), passage ignoré");
      showAutoJoinToast(0, 0, 0, "⚠ SG QuickJoin — limite journalière atteinte (" + getDailyCount() + "/" + getDailyJoinLimit() + "), reprise automatique demain");
      return;
    }
    isAutoJoinPassInProgress = true;
    try {
      if (dryRun) {
        console.info("[SG-QuickJoin] 🔍 Diagnostic — giveaways détectés: " + allGiveaways.length +
          " | xsrf_token: " + (getXsrfToken() ? "ok" : "ABSENT") +
          " | points affichés: " + getCurrentPoints() +
          " | header: " + (document.querySelector("header") ? "ok" : "absent") +
          " | fenêtre 7h-22h: " + (isWithinActiveHours() ? "active" : "INACTIVE") +
          " | page liste: " + (isGiveawaysListPage() ? "oui" : "non"));
      }
      const joined = getAutoJoinedCodes();
      // Bibliothèque Steam + historique des gains : chargés une fois par passage (cache 24h).
      // Si l'une est indisponible, le passage continue sans ce filtre, avec un avertissement clair.
      let ownedGames = null;
      let wonGames = null;
      let ownedCheckWarning = null;
      let wonCheckWarning = null;
      if (isOwnedEnabled()) {
        ownedGames = await getOwnedGamesSet();
        if (!ownedGames) {
          const cfg = getSteamConfig();
          ownedCheckWarning = cfg.apiKey && cfg.steamId
            ? "⚠ bibliothèque Steam indisponible — joins sans filtre possédés"
            : "⚠ config Steam incomplète (clé API manquante) — joins sans filtre possédés (Steam: configurer)";
          console.warn("[SG-QuickJoin] " + ownedCheckWarning);
        } else {
          console.info("[SG-QuickJoin] Vérification bibliothèque activée (" + ownedGames.size + " jeux)");
        }
        wonGames = await getWonGamesSet();
        if (!wonGames) {
          wonCheckWarning = "⚠ historique des gains SteamGifts indisponible — joins sans ce filtre";
          console.warn("[SG-QuickJoin] " + wonCheckWarning);
        } else {
          console.info("[SG-QuickJoin] Vérification des gains activée (" + wonGames.size + " jeux)");
        }
      }
      if (dryRun) {
        const status = (loaded) => (loaded ? loaded.size + " jeux" : "indisponible");
        console.info("[SG-QuickJoin] 🔍 Vérifications — bibliothèque Steam: " + (isOwnedEnabled() ? status(ownedGames) : "désactivé") +
          " | déjà gagnés: " + (isOwnedEnabled() ? status(wonGames) : "désactivé"));
      }
      let requestsSent = 0;
      let joinedCount = 0;
      let filteredCount = 0;
      let alreadyCount = 0;
      let limitHitDuringPass = false;
      const reasonCounts = { ended: 0, insufficient: 0, error: 0 };
      const verdicts = [];
      const recordVerdict = (info, verdict) => {
        if (!dryRun) return;
        verdicts.push({ code: info.code, title: (info.headingName?.innerText ?? "").trim() || info.code, verdict });
      };
      for (const info of allGiveaways) {
        // Un passage automatique s'arrête dès qu'on sort de la fenêtre 7h-22h
        if (!manual && !isWithinActiveHours()) break;
        const state = info.button ? info.button.dataset.state : "";
        // Déjà inscrit (ou déjà auto-join lors d'un passage précédent)
        if (joined.has(info.code) || state === "entered" || state === "joined") {
          alreadyCount++;
          recordVerdict(info, "déjà inscrit");
          continue;
        }
        // État transitoire (un clic manuel en cours) : on laisse faire
        if (state === "loading" || state === "leaving") continue;
        // Jeux déjà possédés (vérification réelle via API Steam)
        if (ownedGames && ownedGames.has(Number(info.gameId))) {
          const ownedTitle = (info.headingName?.innerText ?? "").trim();
          console.info("[SG-QuickJoin] Jeu possédé, exclu:", ownedTitle);
          filteredCount++;
          recordVerdict(info, "possédé (bibliothèque Steam)");
          trackExcluded(info.code, ownedTitle, "owned");
          continue;
        }
        // Jeux déjà gagnés (historique SteamGifts)
        if (wonGames && wonGames.has(Number(info.gameId))) {
          const wonTitle = (info.headingName?.innerText ?? "").trim();
          console.info("[SG-QuickJoin] Jeu déjà gagné, exclu:", wonTitle);
          filteredCount++;
          recordVerdict(info, "déjà gagné (SteamGifts)");
          trackExcluded(info.code, wonTitle, "won");
          continue;
        }
        // Option : uniquement les giveaways qui se terminent dans les 24h
        if (isEndingSoonEnabled()) {
          const remaining = info.endTime > 0 ? info.endTime - Date.now() / 1e3 : -1;
          if (remaining < 0 || remaining > ENDING_SOON_WINDOW_MS) {
            const endingTitle = (info.headingName?.innerText ?? "").trim();
            console.info("[SG-QuickJoin] Hors fenêtre 24h, exclu:", endingTitle);
            filteredCount++;
            recordVerdict(info, "hors fenêtre 24h");
            trackExcluded(info.code, endingTitle, "ending");
            continue;
          }
        }
        // Filtres de jeux (mots-clés + genres Steam)
        const filterReason = await matchesFilters(info);
        if (filterReason) {
          const filterTitle = (info.headingName?.innerText ?? "").trim();
          console.info("[SG-QuickJoin] Filtré (" + filterReason + "):", filterTitle);
          filteredCount++;
          recordVerdict(info, "filtré (" + filterReason + ")");
          trackExcluded(info.code, filterTitle, "filters");
          continue;
        }
        // Filet de sécurité : arrêt dès que la limite journalière est atteinte
        if (!dryRun && getDailyJoinLimit() > 0 && getDailyCount() >= getDailyJoinLimit()) {
          limitHitDuringPass = true;
          break;
        }
        // Mode simulation : on évalue chaque giveaway sans envoyer la moindre requête
        if (dryRun) {
          if (info.endTime > 0 && Date.now() / 1e3 >= info.endTime) {
            reasonCounts.ended++;
            recordVerdict(info, "terminé");
          } else if (getCurrentPoints() < info.requiredPoints) {
            reasonCounts.insufficient++;
            recordVerdict(info, "points insuffisants");
          } else {
            joinedCount++;
            recordVerdict(info, "à joindre");
          }
          continue;
        }
        // Délai aléatoire entre chaque requête pour paraître plus naturel
        if (requestsSent > 0) {
          await randomDelay(AUTO_JOIN_DELAY_MIN_MS, AUTO_JOIN_DELAY_MAX_MS);
        }
        const result = await stealthJoin(info);
        if (result.sent) requestsSent++;
        if (result.joined) joinedCount++;
        else if (result.reason) reasonCounts[result.reason]++;
      }
      if (dryRun) {
        for (const v of verdicts) {
          console.info("[SG-QuickJoin] 🔍 Simulation — " + v.title + " → " + v.verdict);
        }
        showAutoJoinToast(0, 0, 0, "SG QuickJoin — 🔍 Simulation : " + joinedCount + " à joindre • " + filteredCount + " filtré" + (filteredCount > 1 ? "s" : "") + " • " + alreadyCount + " déjà inscrit" + (alreadyCount > 1 ? "s" : ""));
      } else {
        // Quand rien n'a été rejoint, la notification explique pourquoi
        let zeroJoinReason = null;
        if (joinedCount === 0) {
          const p = (n, s, pl) => n + " " + (n > 1 ? pl : s);
          const parts = [];
          if (reasonCounts.ended) parts.push(p(reasonCounts.ended, "terminé", "terminés"));
          if (reasonCounts.insufficient) parts.push(reasonCounts.insufficient + " giveaway" + (reasonCounts.insufficient > 1 ? "s" : "") + " à points insuffisants");
          if (reasonCounts.error) parts.push(p(reasonCounts.error, "échec de requête", "échecs de requête"));
          if (filteredCount) parts.push(p(filteredCount, "filtré", "filtrés"));
          if (alreadyCount) parts.push(p(alreadyCount, "déjà inscrit", "déjà inscrits"));
          if (allGiveaways.length === 0) parts.push("aucun giveaway sur la page");
          if (!parts.length) parts.push("rien d'éligible");
          zeroJoinReason = "Rien à joindre : " + parts.join(", ");
        }
        const warnings = [
          ownedCheckWarning,
          wonCheckWarning,
          limitHitDuringPass ? "⚠ limite journalière atteinte (" + getDailyCount() + "/" + getDailyJoinLimit() + ")" : null,
          zeroJoinReason
        ].filter(Boolean).join(" — ");
        showAutoJoinToast(joinedCount, filteredCount, alreadyCount, null, warnings);
      }
    } finally {
      isAutoJoinPassInProgress = false;
    }
  }

  // Programme le prochain passage avec un délai aléatoire dans [min, max] configuré.
  // Limite journalière atteinte : on ne spamme plus toutes les 15 min, on reprend après minuit.
  function scheduleNextAutoJoinPass() {
    if (autoJoinTimer) return;
    if (getDailyJoinLimit() > 0 && getDailyCount() >= getDailyJoinLimit()) {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5).getTime();
      autoJoinTimer = window.setTimeout(() => {
        autoJoinTimer = null;
        runAutoJoin(false).finally(() => {
          if (isAutoJoinEnabled()) {
            scheduleNextAutoJoinPass();
          }
        });
      }, Math.max(60000, midnight - Date.now()));
      return;
    }
    const { minMs, maxMs } = getIntervalRangeMs();
    const jitterMs = minMs + Math.random() * (maxMs - minMs);
    autoJoinTimer = window.setTimeout(() => {
      autoJoinTimer = null;
      runAutoJoin(false).finally(() => {
        if (isAutoJoinEnabled()) {
          scheduleNextAutoJoinPass();
        }
      });
    }, jitterMs);
  }
  function startAutoJoinTimer() {
    if (autoJoinTimer) return;
    // Hors page de liste : l'auto-join reste en veille sur cette page (le timer ne démarre pas)
    if (isAutoJoinListOnlyEnabled() && !isGiveawaysListPage()) {
      console.info("[SG-QuickJoin] Page hors liste giveaways : auto-join en veille (il reprendra sur une page de liste)");
      return;
    }
    window.setTimeout(() => runAutoJoin(false), 5000); // premier passage rapide après chargement
    scheduleNextAutoJoinPass();
  }
  function stopAutoJoinTimer() {
    if (!autoJoinTimer) return;
    window.clearTimeout(autoJoinTimer);
    autoJoinTimer = null;
  }

  function registerAutoJoinMenu() {
    if (autoJoinMenuId) {
      GM_unregisterMenuCommand(autoJoinMenuId);
    }
    const enabled = isAutoJoinEnabled();
    const caption = enabled ? "☑ Auto-join (15 min)" : "☐ Auto-join (15 min)";
    autoJoinMenuId = GM_registerMenuCommand(caption, () => {
      const next = !enabled;
      setAutoJoinEnabled(next);
      registerAutoJoinMenu();
      if (next) {
        runAutoJoin();
        startAutoJoinTimer();
      } else {
        stopAutoJoinTimer();
      }
    });
  }
  registerAutoJoinMenu();
  GM_registerMenuCommand("Auto-join maintenant", () => runAutoJoin(true));
  // Test : simulation complète, aucune requête envoyée — fonctionne même si l'auto-join est désactivé
  GM_registerMenuCommand("Test : simuler un passage (aucun join)", () => runAutoJoin(true, true));
  // Option : ne joindre que sur la page de liste des giveaways
  function registerListOnlyMenu() {
    if (autoJoinListOnlyMenuId) {
      GM_unregisterMenuCommand(autoJoinListOnlyMenuId);
    }
    const enabled = isAutoJoinListOnlyEnabled();
    const caption = enabled ? "☑ Auto-join : page liste uniquement" : "☐ Auto-join : page liste uniquement";
    autoJoinListOnlyMenuId = GM_registerMenuCommand(caption, () => {
      GM_setValue(AUTO_JOIN_LIST_ONLY_KEY, !enabled);
      registerListOnlyMenu();
    });
  }
  registerListOnlyMenu();

  // === Rythme des passages (jitter configurable) ===
  function registerIntervalMenu() {
    if (intervalMenuId) {
      GM_unregisterMenuCommand(intervalMenuId);
    }
    const r = getIntervalRangeMinutes();
    const caption = "Rythme des passages (" + r.min + "-" + r.max + " min)";
    intervalMenuId = GM_registerMenuCommand(caption, () => {
      const current = r.min + " " + r.max;
      const input = prompt(
        "Intervalle entre deux passages, en minutes (un délai aléatoire est tiré entre les deux à chaque fois).\nMin 1, max 120. Ex: 13 17 — actuel: " + current + " :",
        current
      );
      if (input === null) return;
      const parts = String(input).trim().split(/\s+/).map(Number);
      if (!Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) return;
      let lo = Math.min(parts[0], parts[1]);
      let hi = Math.max(parts[0], parts[1]);
      lo = Math.max(AUTO_JOIN_INTERVAL_LIMIT_MIN, Math.min(AUTO_JOIN_INTERVAL_LIMIT_MAX, Math.round(lo)));
      hi = Math.max(AUTO_JOIN_INTERVAL_LIMIT_MIN, Math.min(AUTO_JOIN_INTERVAL_LIMIT_MAX, Math.round(hi)));
      GM_setValue(AUTO_JOIN_INTERVAL_MIN_KEY, lo);
      GM_setValue(AUTO_JOIN_INTERVAL_MAX_KEY, hi);
      registerIntervalMenu();
      // Un passage est déjà planifié : on le reprogramme avec le nouveau rythme
      if (autoJoinTimer) {
        window.clearTimeout(autoJoinTimer);
        autoJoinTimer = null;
        scheduleNextAutoJoinPass();
      }
    });
  }
  registerIntervalMenu();

  // === Fenêtre horaire 7h-22h (heure FR) ===
  function registerActiveHoursMenu() {
    if (activeHoursMenuId) {
      GM_unregisterMenuCommand(activeHoursMenuId);
    }
    const enabled = isActiveHoursEnabled();
    const caption = enabled ? "☑ Auto-join 7h-22h (heure FR)" : "☐ Auto-join 7h-22h (heure FR)";
    activeHoursMenuId = GM_registerMenuCommand(caption, () => {
      GM_setValue(ACTIVE_HOURS_KEY, !enabled);
      registerActiveHoursMenu();
    });
  }
  registerActiveHoursMenu();

  // === Filtres de jeux ===
  function registerFilterMenu() {
    if (filterMenuId) {
      GM_unregisterMenuCommand(filterMenuId);
    }
    const enabled = isFilterEnabled();
    const caption = enabled ? "☑ Filtres de jeux" : "☐ Filtres de jeux";
    filterMenuId = GM_registerMenuCommand(caption, () => {
      GM_setValue(FILTER_ENABLED_KEY, !enabled);
      registerFilterMenu();
    });
  }
  registerFilterMenu();

  // === Option : uniquement les giveaways ≤ 24h ===
  function registerEndingSoonMenu() {
    if (endingSoonMenuId) {
      GM_unregisterMenuCommand(endingSoonMenuId);
    }
    const enabled = isEndingSoonEnabled();
    const caption = enabled ? "☑ Uniquement giveaways ≤ 24h" : "☐ Uniquement giveaways ≤ 24h";
    endingSoonMenuId = GM_registerMenuCommand(caption, () => {
      GM_setValue(ENDING_SOON_KEY, !enabled);
      registerEndingSoonMenu();
    });
  }
  registerEndingSoonMenu();

  // Une seule commande pour les trois filtres (moins de boutons)
  GM_registerMenuCommand("Filtres: configurer (mots-clés / genres)", () => {
    const cfg = getFilterConfig();
    const join = (label, vals) => label + ": " + vals.join(", ");
    const current = join("inclure", cfg.include) + " | " + join("exclure", cfg.exclude) + " | " + join("genres", cfg.genres);
    const input = prompt(
      "Filtres de jeux — format : inclure: a, b | exclure: c | genres: Indie, Strategy\n" +
      "  inclure : le titre doit contenir au moins un de ces mots\n" +
      "  exclure : un seul mot écarte le jeu\n" +
      "  genres  : genres Steam autorisés (le jeu doit en avoir au moins un)\n" +
      "Laisser une partie vide pour la désactiver.",
      current
    );
    if (input === null) return;
    const parse = (label) => {
      const m = String(input).match(new RegExp("(?:^|\\|)\\s*" + label + "\\s*:\\s*([^|]*)", "i"));
      return m ? m[1].trim() : "";
    };
    GM_setValue(FILTER_INCLUDE_KEY, parse("inclure"));
    GM_setValue(FILTER_EXCLUDE_KEY, parse("exclure"));
    GM_setValue(FILTER_GENRES_KEY, parse("genres"));
  });
  // === Exclure les jeux possédés (bibliothèque Steam) ===
  function registerOwnedMenu() {
    if (ownedMenuId) {
      GM_unregisterMenuCommand(ownedMenuId);
    }
    const enabled = isOwnedEnabled();
    const caption = enabled ? "☑ Exclure jeux possédés / gagnés" : "☐ Exclure jeux possédés / gagnés";
    ownedMenuId = GM_registerMenuCommand(caption, () => {
      GM_setValue(OWNED_ENABLED_KEY, !enabled);
      registerOwnedMenu();
    });
  }
  registerOwnedMenu();

  // Rafraîchit les deux caches (bibliothèque Steam + historique des gains) à la demande
  GM_registerMenuCommand("Rafraîchir bibliothèque + gains (Steam)", async () => {
    GM_setValue(OWNED_FETCHED_KEY, 0);
    GM_setValue(WON_FETCHED_KEY, 0);
    const owned = await getOwnedGamesSet();
    const won = await getWonGamesSet();
    const parts = [];
    parts.push(owned ? "bibliothèque: " + owned.size + " jeux" : "bibliothèque: indisponible");
    parts.push(won ? "gagnés: " + won.size + " jeux" : "gagnés: indisponible");
    console.info("[SG-QuickJoin] Vérifications rafraîchies:", parts.join(" | "));
    showAutoJoinToast(0, 0, 0, "SG QuickJoin — vérifications : " + parts.join(" | "));
  });

  // Une seule commande : clé API + SteamID + rechargement immédiat (moins de boutons)
  GM_registerMenuCommand("Steam: configurer (clé API + ID)", async () => {
    const cfg = getSteamConfig();
    const key = prompt("Clé API Steam (gratuite sur https://steamcommunity.com/dev/apikey) :", cfg.apiKey);
    if (key === null) return;
    GM_setValue(STEAM_API_KEY_KEY, key.trim());
    const id = prompt("Ton SteamID64 (ex: 76561198000000000) — laisse vide pour garder celui détecté automatiquement :", cfg.steamId);
    if (id === null) return;
    GM_setValue(STEAM_ID_KEY, id.trim());
    // Invalide le cache : la bibliothèque est rechargée tout de suite (plus besoin de commande "rafraîchir")
    GM_setValue(OWNED_FETCHED_KEY, 0);
    if (key.trim() && id.trim()) {
      const owned = await getOwnedGamesSet();
      if (owned) {
        console.info("[SG-QuickJoin] Bibliothèque Steam chargée:", owned.size, "jeux");
        showAutoJoinToast(0, 0, 0, "SG QuickJoin — bibliothèque Steam : " + owned.size + " jeux");
      } else {
        console.error("[SG-QuickJoin] Bibliothèque Steam indisponible (clé ou ID invalide ?)");
        showAutoJoinToast(0, 0, 0, "⚠ SG QuickJoin — bibliothèque Steam indisponible");
      }
    }
  });

  // === Signal sonore à chaque join ===
  function registerSignalMenu() {
    if (signalMenuId) {
      GM_unregisterMenuCommand(signalMenuId);
    }
    const enabled = isSignalEnabled();
    const caption = enabled ? "☑ Son à chaque join" : "☐ Son à chaque join";
    signalMenuId = GM_registerMenuCommand(caption, () => {
      GM_setValue(SIGNAL_ENABLED_KEY, !enabled);
      registerSignalMenu();
    });
  }
  registerSignalMenu();

  // Réglages du son (volume + type) en une seule commande, libellé mis à jour
  var SOUND_TYPE_LABELS = { sine: "doux", triangle: "clair", square: "aigu", off: "flash seul" };
  function registerSoundSettingsMenus() {
    if (soundSettingsMenuId) {
      GM_unregisterMenuCommand(soundSettingsMenuId);
    }
    const label = SOUND_TYPE_LABELS[getSoundType()] || "doux";
    soundSettingsMenuId = GM_registerMenuCommand("Son: réglages (volume " + getSoundVolume() + "% / " + label + ")", () => {
      const current = getSoundVolume() + " " + getSoundType();
      const input = prompt(
        "Volume (0-100) et type (sine = doux, triangle = clair, square = aigu, off = flash seul).\nEx: 40 sine — actuel: " + current + " :",
        current
      );
      if (input === null) return;
      const parts = String(input).trim().split(/\s+/);
      const vol = Number(parts[0]);
      if (Number.isFinite(vol)) {
        GM_setValue(SOUND_VOLUME_KEY, Math.max(0, Math.min(100, Math.round(vol))));
      }
      const t = parts[1] ? parts[1].toLowerCase() : "";
      if (t === "off" || SOUND_PRESETS[t]) {
        GM_setValue(SOUND_TYPE_KEY, t);
      }
      registerSoundSettingsMenus();
    });
  }
  registerSoundSettingsMenus();

  GM_registerMenuCommand("Afficher la config", () => {
    const cfg = getSteamConfig();
    const iv = getIntervalRangeMinutes();
    console.info("[SG-QuickJoin] Config:", {
      autoJoin: isAutoJoinEnabled(),
      listOnly: isAutoJoinListOnlyEnabled(),
      activeHours: isActiveHoursEnabled(),
      interval: iv.min + "-" + iv.max + " min",
      joinLimit: getDailyJoinLimit(),
      excludeOwnedWon: isOwnedEnabled(),
      signal: isSignalEnabled(),
      soundVolume: getSoundVolume(),
      soundType: getSoundType(),
      steamApiKey: cfg.apiKey ? cfg.apiKey.slice(0, 6) + "…" : "(vide)",
      steamId: cfg.steamId || "(vide)",
      today: getDailyCount(),
      include: GM_getValue(FILTER_INCLUDE_KEY, ""),
      exclude: GM_getValue(FILTER_EXCLUDE_KEY, ""),
      genres: GM_getValue(FILTER_GENRES_KEY, "")
    });
  });

  function main() {
    fixHeader();
    showMore();
    applyHideJoinedSetting(GM_getValue(HIDE_JOINED_KEY, false));
    // SteamID64 : détection automatique depuis la page (aucune saisie nécessaire)
    if (!getSteamConfig().steamId) {
      const detected = detectSteamIdFromPage();
      if (detected) {
        GM_setValue(STEAM_ID_KEY, detected);
        console.info("[SG-QuickJoin] SteamID64 détecté depuis la page:", detected);
      }
    }
    if (isAutoJoinEnabled()) {
      startAutoJoinTimer();
    }
    const outWraps = document.querySelectorAll(
      "div.giveaway__row-outer-wrap"
    );
    if (outWraps.length === 0) return;
    outWraps.forEach(setupGiveawayRow);
    updateAllButtonStates();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
  } else {
    main();
  }
})();
