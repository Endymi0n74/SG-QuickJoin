// ==UserScript==
// @name            SG Quick Join SE
// @namespace       https://github.com/Endymi0n74/SG-QuickJoin
// @version         1.0.0
// @description     Auto-join stealth pour SteamGifts.com — indicateur permanent, filtres, exclusion jeux possédés.
// @description:en  Stealth auto-join for SteamGifts.com — permanent indicator, filters, owned-game exclusion.
// @author          HCLonely (fork Endymi0n74)
// @match           https://www.steamgifts.com/*
// @license         MIT
// @tag             games
// @homepage        https://github.com/Endymi0n74/SG-QuickJoin
// @supportURL      https://github.com/Endymi0n74/SG-QuickJoin/issues
// @icon            https://github.com/HCLonely/SG-QuickJoin/blob/main/icon.ico?raw=true
// @grant           GM_addStyle
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_xmlhttpRequest
// @connect         store.steampowered.com
// @connect         api.steampowered.com
// @downloadURL https://github.com/Endymi0n74/SG-QuickJoin/releases/latest/download/SG-QuickJoin.user.js
// @updateURL https://github.com/Endymi0n74/SG-QuickJoin/releases/latest/download/SG-QuickJoin.meta.js
// ==/UserScript==

"use strict";
(() => {
  // src/main.ts
  GM_addStyle(`
  /* === SG QuickJoin — Theme Tokens (dark default, light via prefers-color-scheme) === */
  :root {
    /* Core palette */
    --sgq-blue: #7ba4f7;
    --sgq-green: #5dd087;
    --sgq-amber: #e8a860;
    --sgq-coral: #ff8a65;
    --sgq-violet: #b08bd6;
    --sgq-red: #e07b7b;
    --sgq-gray-blue: #8fa3c8;

    /* Surfaces */
    --sgq-bg: rgba(34, 39, 48, 0.96);
    --sgq-bg-deep: rgba(28, 32, 40, 0.96);
    --sgq-bg-toggle: rgba(30, 34, 42, 0.94);
    --sgq-bg-hover: rgba(40, 45, 55, 0.97);

    /* Text */
    --sgq-text: #e3eaf4;
    --sgq-text-muted: #9fb2d3;
    --sgq-text-dim: #9aa5b8;
    --sgq-text-brand: #c8d4ec;

    /* Borders */
    --sgq-border: rgba(123, 164, 247, 0.4);
    --sgq-border-light: rgba(123, 164, 247, 0.35);
    --sgq-border-strong: rgba(123, 164, 247, 0.65);
    --sgq-border-subtle: rgba(255, 255, 255, 0.07);
    --sgq-border-chip: rgba(255, 255, 255, 0.08);
    --sgq-border-toggle: rgba(232, 168, 96, 0.45);
    --sgq-border-toggle-open: rgba(232, 168, 96, 0.85);

    /* Semantic: joined */
    --sgq-joined-dot: var(--sgq-green);
    --sgq-joined-glow: rgba(93, 208, 135, 0.6);
    --sgq-joined-text: #c9efd4;

    /* Semantic: filtered */
    --sgq-filtered-dot: var(--sgq-amber);
    --sgq-filtered-glow: rgba(232, 168, 96, 0.4);
    --sgq-filtered-text: #f3d3b1;

    /* Semantic: already */
    --sgq-already-dot: var(--sgq-gray-blue);
    --sgq-already-text: #b4c0d4;

    /* Semantic: today */
    --sgq-today-dot: var(--sgq-blue);
    --sgq-today-glow: rgba(123, 164, 247, 0.5);
    --sgq-today-text: #cfdcf7;
    --sgq-today-pill-bg: rgba(123, 164, 247, 0.15);
    --sgq-today-pill-border: rgba(123, 164, 247, 0.3);

    /* Semantic: warning */
    --sgq-warn-text: #f5d3a4;
    --sgq-warn-bg: rgba(232, 168, 96, 0.10);
    --sgq-warn-border: rgba(232, 168, 96, 0.32);

    /* Semantic: toggle (amber accent) */
    --sgq-toggle-text: #f0c891;
    --sgq-toggle-text-open: #ffd6a0;
    --sgq-toggle-glow: rgba(232, 168, 96, 0.25);
    --sgq-toggle-glow-strong: rgba(232, 168, 96, 0.9);
    --sgq-toggle-signal: rgba(232, 168, 96, 0.55);

    /* Semantic: section rails */
    --sgq-rail-owned: var(--sgq-blue);
    --sgq-rail-won: var(--sgq-amber);
    --sgq-rail-filters: var(--sgq-coral);
    --sgq-rail-ending: var(--sgq-violet);
    --sgq-rail-owned-bg: rgba(123, 164, 247, 0.18);
    --sgq-rail-won-bg: rgba(232, 168, 96, 0.18);
    --sgq-rail-filters-bg: rgba(255, 138, 101, 0.18);
    --sgq-rail-ending-bg: rgba(176, 139, 214, 0.18);
    --sgq-rail-owned-text: #cfdcf7;
    --sgq-rail-won-text: #f3d3b1;
    --sgq-rail-filters-text: #f5c4ae;
    --sgq-rail-ending-text: #d4c0e7;

    /* Misc */
    --sgq-shadow: rgba(0, 0, 0, 0.45);
    --sgq-shadow-soft: rgba(0, 0, 0, 0.4);
    --sgq-shadow-strong: rgba(0, 0, 0, 0.5);
    --sgq-indicator-dot-off: #6b7280;
    --sgq-white: #fff;
  }

  @media (prefers-color-scheme: light) {
    :root {
      --sgq-bg: rgba(245, 247, 250, 0.96);
      --sgq-bg-deep: rgba(237, 240, 244, 0.96);
      --sgq-bg-toggle: rgba(240, 243, 247, 0.94);
      --sgq-bg-hover: rgba(228, 232, 238, 0.97);

      --sgq-text: #1e2330;
      --sgq-text-muted: #5a6577;
      --sgq-text-dim: #808d9e;
      --sgq-text-brand: #3b5078;

      --sgq-border: rgba(59, 80, 120, 0.30);
      --sgq-border-light: rgba(59, 80, 120, 0.22);
      --sgq-border-strong: rgba(59, 80, 120, 0.55);
      --sgq-border-subtle: rgba(0, 0, 0, 0.08);
      --sgq-border-chip: rgba(0, 0, 0, 0.10);
      --sgq-border-toggle: rgba(180, 120, 40, 0.35);
      --sgq-border-toggle-open: rgba(180, 120, 40, 0.60);

      --sgq-joined-dot: #2d9e5c;
      --sgq-joined-glow: rgba(45, 158, 92, 0.4);
      --sgq-joined-text: #1a6e3a;

      --sgq-filtered-dot: #c07820;
      --sgq-filtered-glow: rgba(192, 120, 32, 0.3);
      --sgq-filtered-text: #8a5510;

      --sgq-already-dot: #607090;
      --sgq-already-text: #4a5870;

      --sgq-today-dot: #3070c0;
      --sgq-today-glow: rgba(48, 112, 192, 0.35);
      --sgq-today-text: #1a4a88;
      --sgq-today-pill-bg: rgba(48, 112, 192, 0.08);
      --sgq-today-pill-border: rgba(48, 112, 192, 0.25);

      --sgq-warn-text: #8a5510;
      --sgq-warn-bg: rgba(192, 120, 32, 0.08);
      --sgq-warn-border: rgba(192, 120, 32, 0.25);

      --sgq-toggle-text: #9a6a18;
      --sgq-toggle-text-open: #7a5210;
      --sgq-toggle-glow: rgba(154, 106, 24, 0.18);
      --sgq-toggle-glow-strong: rgba(154, 106, 24, 0.40);
      --sgq-toggle-signal: rgba(154, 106, 24, 0.35);

      --sgq-rail-owned-bg: rgba(48, 112, 192, 0.12);
      --sgq-rail-won-bg: rgba(192, 120, 32, 0.12);
      --sgq-rail-filters-bg: rgba(200, 80, 50, 0.12);
      --sgq-rail-ending-bg: rgba(140, 90, 180, 0.12);
      --sgq-rail-owned-text: #1a4a88;
      --sgq-rail-won-text: #8a5510;
      --sgq-rail-filters-text: #983820;
      --sgq-rail-ending-text: #6a3890;

      --sgq-shadow: rgba(0, 0, 0, 0.12);
      --sgq-shadow-soft: rgba(0, 0, 0, 0.10);
      --sgq-shadow-strong: rgba(0, 0, 0, 0.15);
      --sgq-indicator-dot-off: #9ca3af;
    }
  }

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
    background: var(--sgq-blue);
    color: var(--sgq-white);
    cursor: pointer;
    border: none;
  }

  .sg-quickjoin-btn[data-state="loading"] {
    background: #a0a7b3;
    color: var(--sgq-white);
    cursor: wait;
    border: none;
  }

  .sg-quickjoin-btn[data-state="joined"] {
    background: var(--sgq-amber);
    color: var(--sgq-white);
    cursor: pointer;
    border: none;
  }

  .sg-quickjoin-btn[data-state="error"] {
    background: var(--sgq-red);
    color: var(--sgq-white);
    cursor: pointer;
    border: none;
  }

  .sg-quickjoin-btn[data-state="insufficient"] {
    background: #c5cad2;
    color: var(--sgq-white);
    cursor: not-allowed;
    border: none;
  }

  .sg-quickjoin-btn[data-state="entered"] {
    background: var(--sgq-amber);
    color: var(--sgq-white);
    cursor: pointer;
    border: none;
  }

  .sg-quickjoin-btn[data-state="leaving"] {
    background: #a0a7b3;
    color: var(--sgq-white);
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
    background: linear-gradient(180deg, var(--sgq-bg), var(--sgq-bg-deep));
    color: var(--sgq-text);
    border: 1px solid var(--sgq-border);
    border-radius: 10px;
    padding: 10px 12px 11px;
    font-size: 12px;
    font-weight: 500;
    box-shadow: 0 6px 22px var(--sgq-shadow);
    pointer-events: auto;
    opacity: 0;
    animation: sg-quickjoin-toast-in 0.25s ease forwards;
    min-width: 280px;
    max-width: 520px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    backdrop-filter: blur(4px);
  }

  .sg-quickjoin-toast-head {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 11px;
  }

  .sg-quickjoin-toast-brand {
    font-weight: 700;
    color: var(--sgq-text-brand);
    letter-spacing: 0.4px;
    text-transform: uppercase;
    font-size: 10px;
  }

  .sg-quickjoin-toast-eta {
    flex: 1;
    text-align: right;
    font-style: italic;
    color: var(--sgq-text-muted);
    font-size: 11px;
  }

  .sg-quickjoin-toast-close {
    appearance: none;
    background: transparent;
    border: none;
    color: var(--sgq-text-muted);
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    padding: 1px 5px;
    border-radius: 4px;
    margin-left: 2px;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .sg-quickjoin-toast-close:hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--sgq-text);
  }

  .sg-quickjoin-toast-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: stretch;
  }

  .sg-quickjoin-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 9px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--sgq-border-chip);
    font-size: 12px;
    font-weight: 600;
    line-height: 1.1;
  }

  .sg-quickjoin-chip-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
  }

  .sg-quickjoin-chip-count {
    font-variant-numeric: tabular-nums;
  }

  .sg-quickjoin-chip-label {
    font-weight: 500;
    color: var(--sgq-text-brand);
  }

  .sg-quickjoin-chip-joined { color: var(--sgq-joined-text); }
  .sg-quickjoin-chip-joined .sg-quickjoin-chip-dot {
    background: var(--sgq-joined-dot);
    box-shadow: 0 0 8px var(--sgq-joined-glow);
  }
  .sg-quickjoin-chip-filtered { color: var(--sgq-filtered-text); }
  .sg-quickjoin-chip-filtered .sg-quickjoin-chip-dot {
    background: var(--sgq-filtered-dot);
    box-shadow: 0 0 6px var(--sgq-filtered-glow);
  }
  .sg-quickjoin-chip-already { color: var(--sgq-already-text); }
  .sg-quickjoin-chip-already .sg-quickjoin-chip-dot { background: var(--sgq-already-dot); }
  .sg-quickjoin-chip-today { color: var(--sgq-today-text); }
  .sg-quickjoin-chip-today .sg-quickjoin-chip-dot {
    background: var(--sgq-today-dot);
    box-shadow: 0 0 6px var(--sgq-today-glow);
  }

  .sg-quickjoin-toast-warning {
    font-size: 11.5px;
    color: var(--sgq-warn-text);
    background: var(--sgq-warn-bg);
    border: 1px solid var(--sgq-warn-border);
    border-radius: 6px;
    padding: 5px 9px;
    line-height: 1.35;
  }

  .sg-quickjoin-toast-msg {
    font-size: 12px;
    color: var(--sgq-text);
    line-height: 1.4;
  }

  @keyframes sg-quickjoin-toast-in {
    from { opacity: 0; transform: translate(-50%, -6px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }

  .sg-quickjoin-owned {
    position: fixed;
    bottom: 14px;
    right: 14px;
    z-index: 2000;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }

  /* Entrée du panneau : slide-in depuis la droite + léger pop */
  @keyframes sg-quickjoin-owned-in {
    from { opacity: 0; transform: translateX(22px) scale(0.96); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }
  .sg-quickjoin-owned-enter {
    animation: sg-quickjoin-owned-in 0.35s cubic-bezier(0.3, 0.7, 0.3, 1) forwards;
  }

  /* --- Bouton / toggle --- */
  .sg-quickjoin-owned-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--sgq-bg-toggle);
    color: var(--sgq-toggle-text);
    border: 1px solid var(--sgq-border-toggle);
    border-radius: 999px;
    padding: 7px 12px 7px 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 10px var(--sgq-shadow-soft);
    transition: background 0.15s ease, border-color 0.15s ease,
                transform 0.15s ease, box-shadow 0.15s ease, color 0.15s ease;
    font-family: inherit;
  }
  .sg-quickjoin-owned-toggle::after {
    content: "\u25B8"; /* ▸ */
    font-size: 10px;
    line-height: 1;
    transition: transform 0.2s ease;
    display: inline-block;
    color: rgba(240, 200, 145, 0.75);
  }
  .sg-quickjoin-owned-toggle:hover {
    background: var(--sgq-bg-hover);
    transform: translateY(-1px);
    box-shadow: 0 5px 16px var(--sgq-shadow);
  }
  .sg-quickjoin-owned-toggle:hover::after { transform: translateX(1px); }
  .sg-quickjoin-owned-toggle.is-open {
    border-color: var(--sgq-border-toggle-open);
    color: var(--sgq-toggle-text-open);
    background: var(--sgq-bg-hover);
    box-shadow: 0 3px 12px var(--sgq-toggle-glow);
  }
  .sg-quickjoin-owned-toggle.is-open::after {
    content: "\u25BE"; /* ▾ */
    color: var(--sgq-toggle-text-open);
  }

  /* --- Liste déroulante --- */  .sg-quickjoin-owned-list {
    display: none;
    background: linear-gradient(180deg, var(--sgq-bg), var(--sgq-bg-deep));
    color: var(--sgq-text);
    border: 1px solid var(--sgq-border);
    border-radius: 10px;
    max-height: 42vh;
    overflow-y: auto;
    overflow-x: hidden;
    min-width: 240px;
    max-width: 340px;
    box-shadow: 0 6px 22px var(--sgq-shadow);
    transform-origin: bottom right;
  }
  .sg-quickjoin-owned-list.is-open {
    display: block;
    animation: sg-quickjoin-owned-list-in 0.28s cubic-bezier(0.3, 0.7, 0.3, 1) forwards;
  }
  @keyframes sg-quickjoin-owned-list-in {
    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* --- Sections (groupes par raison) --- */
  .sg-quickjoin-owned-section {
    border-top: 1px solid var(--sgq-border-subtle);
    border-left: 3px solid transparent;
    padding-left: 6px;
    margin-left: -1px;
  }
  .sg-quickjoin-owned-section:first-child {
    border-top: none;
  }
  /* Couleurs par raison (rail gauche + cohérence chips toast) */
  .sg-quickjoin-owned-section[data-reason="owned"]   { border-left-color: var(--sgq-rail-owned); }
  .sg-quickjoin-owned-section[data-reason="won"]     { border-left-color: var(--sgq-rail-won); }
  .sg-quickjoin-owned-section[data-reason="filters"] { border-left-color: var(--sgq-rail-filters); }
  .sg-quickjoin-owned-section[data-reason="ending"]  { border-left-color: var(--sgq-rail-ending); }

  /* --- Titre de section (label + badge count) --- */
  .sg-quickjoin-owned-section-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 9px 12px 4px;
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: var(--sgq-text-brand);
  }
  .sg-quickjoin-owned-section-count {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 999px;
    padding: 1px 8px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0;
    font-variant-numeric: tabular-nums;
    min-width: 18px;
    text-align: center;
    color: var(--sgq-text);
  }
  .sg-quickjoin-owned-section[data-reason="owned"]   .sg-quickjoin-owned-section-count { background: var(--sgq-rail-owned-bg); color: var(--sgq-rail-owned-text); }
  .sg-quickjoin-owned-section[data-reason="won"]     .sg-quickjoin-owned-section-count { background: var(--sgq-rail-won-bg); color: var(--sgq-rail-won-text); }
  .sg-quickjoin-owned-section[data-reason="filters"] .sg-quickjoin-owned-section-count { background: var(--sgq-rail-filters-bg); color: var(--sgq-rail-filters-text); }
  .sg-quickjoin-owned-section[data-reason="ending"]  .sg-quickjoin-owned-section-count { background: var(--sgq-rail-ending-bg); color: var(--sgq-rail-ending-text); }

  /* --- Items (liens vers chaque giveaway) --- */
  .sg-quickjoin-owned-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px 6px 14px;
    color: var(--sgq-text);
    font-size: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    transition: background 0.15s ease, padding-left 0.15s ease, color 0.15s ease;
    position: relative;
  }
  .sg-quickjoin-owned-item:last-child { border-bottom: none; }
  .sg-quickjoin-owned-item::before {
    content: "";
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.25);
    flex-shrink: 0;
    transition: background 0.15s ease, transform 0.15s ease;
  }
  .sg-quickjoin-owned-section[data-reason="owned"]   .sg-quickjoin-owned-item::before { background: var(--sgq-rail-owned); opacity: 0.7; }
  .sg-quickjoin-owned-section[data-reason="won"]     .sg-quickjoin-owned-item::before { background: var(--sgq-rail-won); opacity: 0.8; }
  .sg-quickjoin-owned-section[data-reason="filters"] .sg-quickjoin-owned-item::before { background: var(--sgq-rail-filters); opacity: 0.85; }
  .sg-quickjoin-owned-section[data-reason="ending"]  .sg-quickjoin-owned-item::before { background: var(--sgq-rail-ending); opacity: 0.85; }
  .sg-quickjoin-owned-item:hover {
    background: rgba(123, 164, 247, 0.10);
    padding-left: 18px;
    color: var(--sgq-white);
  }
  .sg-quickjoin-owned-item:hover::before {
    transform: scale(1.4);
  }

  /* === Indicateur permanent (haut-droite) === */
  .sg-quickjoin-indicator {
    position: fixed;
    top: 56px;
    right: 12px;
    z-index: 2000;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    pointer-events: none;
    opacity: 0;
    animation: sg-quickjoin-indicator-in 0.4s cubic-bezier(0.3, 0.7, 0.3, 1) 0.3s forwards;
  }

  @keyframes sg-quickjoin-indicator-in {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .sg-quickjoin-indicator-bar {
    pointer-events: auto;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(180deg, var(--sgq-bg), var(--sgq-bg-deep));
    color: var(--sgq-text);
    border: 1px solid var(--sgq-border-light);
    border-radius: 999px;
    padding: 5px 10px 5px 9px;
    font-size: 11.5px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 10px var(--sgq-shadow-soft);
    transition: background 0.15s ease, border-color 0.15s ease,
                transform 0.15s ease, box-shadow 0.15s ease;
    font-family: inherit;
    user-select: none;
  }
  .sg-quickjoin-indicator-bar:hover {
    background: var(--sgq-bg-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 14px var(--sgq-shadow);
  }
  .sg-quickjoin-indicator-bar.is-open {
    border-color: var(--sgq-border-strong);
    background: var(--sgq-bg-hover);
    box-shadow: 0 3px 12px var(--sgq-toggle-glow);
  }

  .sg-quickjoin-indicator-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--sgq-indicator-dot-off);
    display: inline-block;
    flex-shrink: 0;
    transition: background 0.2s ease, box-shadow 0.2s ease;
  }
  .sg-quickjoin-indicator.is-on .sg-quickjoin-indicator-dot {
    background: var(--sgq-joined-dot);
    box-shadow: 0 0 7px var(--sgq-joined-glow);
  }
  .sg-quickjoin-indicator.is-paused .sg-quickjoin-indicator-dot {
    background: var(--sgq-filtered-dot);
    box-shadow: 0 0 6px var(--sgq-filtered-glow);
  }

  .sg-quickjoin-indicator-state {
    color: var(--sgq-text);
    font-weight: 700;
    font-size: 10.5px;
    letter-spacing: 0.3px;
  }
  .sg-quickjoin-indicator.is-off .sg-quickjoin-indicator-state { color: var(--sgq-text-dim); }
  .sg-quickjoin-indicator.is-paused .sg-quickjoin-indicator-state { color: var(--sgq-toggle-text); }

  .sg-quickjoin-indicator-eta {
    font-style: italic;
    color: var(--sgq-text-muted);
    font-size: 10.5px;
    font-variant-numeric: tabular-nums;
  }

  .sg-quickjoin-indicator-today {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    background: var(--sgq-today-pill-bg);
    border: 1px solid var(--sgq-today-pill-border);
    border-radius: 999px;
    padding: 1px 7px 1px 6px;
    color: var(--sgq-today-text);
    font-variant-numeric: tabular-nums;
    font-size: 10.5px;
  }

  .sg-quickjoin-indicator-menu {
    pointer-events: auto;
    display: none;
    flex-direction: column;
    gap: 1px;
    background: linear-gradient(180deg, var(--sgq-bg), var(--sgq-bg-deep));
    border: 1px solid var(--sgq-border);
    border-radius: 10px;
    padding: 4px;
    min-width: 230px;
    box-shadow: 0 6px 22px var(--sgq-shadow-strong);
    transform-origin: top right;
  }
  .sg-quickjoin-indicator-menu.is-open {
    display: flex;
    animation: sg-quickjoin-indicator-menu-in 0.25s cubic-bezier(0.3, 0.7, 0.3, 1) forwards;
  }

  @keyframes sg-quickjoin-indicator-menu-in {
    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .sg-quickjoin-indicator-item {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 6px 10px;
    background: transparent;
    border: none;
    color: var(--sgq-text);
    font-size: 12px;
    font-weight: 500;
    text-align: left;
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s ease, color 0.15s ease, padding-left 0.15s ease;
  }
  .sg-quickjoin-indicator-item:hover {
    background: rgba(123, 164, 247, 0.14);
    color: var(--sgq-white);
    padding-left: 13px;
  }
  .sg-quickjoin-indicator-item-icon {
    width: 18px;
    font-size: 13px;
    text-align: center;
    opacity: 0.85;
    flex-shrink: 0;
  }
  .sg-quickjoin-indicator-item[disabled] {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Mode compact : icône seule (dot), pas de texte */
  .sg-quickjoin-indicator.is-compact .sg-quickjoin-indicator-state,
  .sg-quickjoin-indicator.is-compact .sg-quickjoin-indicator-eta,
  .sg-quickjoin-indicator.is-compact .sg-quickjoin-indicator-today {
    display: none;
  }
  .sg-quickjoin-indicator.is-compact .sg-quickjoin-indicator-bar {
    padding: 6px;
    gap: 0;
    border-radius: 50%;
    min-width: unset;
  }
  .sg-quickjoin-indicator.is-compact .sg-quickjoin-indicator-dot {
    width: 10px;
    height: 10px;
  }

  .sg-quickjoin-toast.sg-quickjoin-toast-signal {
    border-color: var(--sgq-toggle-glow-strong);
    animation: sg-quickjoin-toast-in 0.25s ease forwards, sg-quickjoin-signal 0.6s ease 2;
  }

  @keyframes sg-quickjoin-signal {
    0%, 100% { box-shadow: 0 2px 10px var(--sgq-shadow-soft); }
    50% { box-shadow: 0 0 18px 3px var(--sgq-toggle-signal); }
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


  // === Auto-join stealth (toutes les 15 minutes) ===
  // Intervalle entre passages avec jitter aléatoire (13-17 min par défaut, réglable au menu)
  var AUTO_JOIN_INTERVAL_MIN_KEY = "sgIntervalMin";
  var AUTO_JOIN_INTERVAL_MAX_KEY = "sgIntervalMax";
  var AUTO_JOIN_INTERVAL_DEFAULT_MIN = 13;
  var AUTO_JOIN_INTERVAL_DEFAULT_MAX = 17;
  var AUTO_JOIN_INTERVAL_LIMIT_MIN = 1;
  var AUTO_JOIN_INTERVAL_LIMIT_MAX = 120;
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
  var isAutoJoinPassInProgress = false; // empêche deux passages simultanés (double join)

  // Auto-join limité à la page de liste des giveaways (pas de joins sur profil/discussions…)
  var AUTO_JOIN_LIST_ONLY_KEY = "sgAutoJoinListOnly";
  function isAutoJoinListOnlyEnabled() {
    return true;
  }
  function isGiveawaysListPage() {
    const path = (location.pathname || "").replace(/\/+$/, "") || "/";
    return path === "/" || path === "/giveaways" || path.startsWith("/giveaways/");
  }

  // Fenêtre horaire : auto-join uniquement entre 7h et 22h (heure de Paris)
  var ACTIVE_HOURS_START = 7;
  var ACTIVE_HOURS_END = 22;
  var ACTIVE_HOURS_KEY = "activeHoursEnabled";

  // Filtres de jeux
  var FILTER_ENABLED_KEY = "sgFilterEnabled";
  var FILTER_INCLUDE_KEY = "sgFilterInclude";
  var FILTER_EXCLUDE_KEY = "sgFilterExclude";
  var FILTER_GENRES_KEY = "sgFilterGenres";
  var GENRE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

  // Option : ne joindre que les giveaways qui se terminent dans les 24h
  var ENDING_SOON_KEY = "sgEndingSoonEnabled";
  var ENDING_SOON_WINDOW_MS = 24 * 60 * 60; // en secondes
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
    return true;
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
      excludedPanel.classList.add("sg-quickjoin-owned-enter");
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
        list.classList.toggle("is-open", !list.hidden);
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
      section.dataset.reason = group.reason;
      const title = document.createElement("div");
      title.className = "sg-quickjoin-owned-section-title";
      title.textContent = group.label;
      const countBadge = document.createElement("span");
      countBadge.className = "sg-quickjoin-owned-section-count";
      countBadge.textContent = " (" + items.length + ")";
      title.appendChild(countBadge);
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
  var TOAST_DURATION_MS = 5000;
  var activeToast = null;
  var nextAutoJoinAt = null; // timestamp (Date.now() base) du prochain passage programmé
  function formatNextPassEta() {
    if (nextAutoJoinAt == null) return "";
    const remainingMs = nextAutoJoinAt - Date.now();
    if (remainingMs < 30000) return ""; // < 30 s : pas d'ETA utile (passage imminent)
    const minutes = Math.max(1, Math.round(remainingMs / 60000));
    return "Prochain passage dans ~" + minutes + " min";
  }

  // === Indicateur permanent (haut-droite) : état + ETA + compteur du jour + menu d'actions ===
  var INDICATOR_COMPACT_KEY = "sgIndicatorCompact";
  function isIndicatorCompact() {
    return GM_getValue(INDICATOR_COMPACT_KEY, false);
  }
  var indicator = null;
  var indicatorMenuOpen = false;
  function isIndicatorPaused() {
    if (!isAutoJoinEnabled()) return false; // OFF est son propre état, pas un "pause"
    if (isAutoJoinListOnlyEnabled() && !isGiveawaysListPage()) return true;
    if (isActiveHoursEnabled() && !isWithinActiveHours()) return true;
    return false;
  }
  function toggleAutoJoinFromIndicator() {
    const next = !isAutoJoinEnabled();
    setAutoJoinEnabled(next);
    if (next) {
      runAutoJoin();
      startAutoJoinTimer();
    } else {
      stopAutoJoinTimer();
    }
    renderIndicator();
  }
  function toggleSignalFromIndicator() {
    GM_setValue(SIGNAL_ENABLED_KEY, !isSignalEnabled());
    renderIndicator();
  }
  function buildIndicator() {
    if (indicator) return;
    indicator = document.createElement("div");
    indicator.className = "sg-quickjoin-indicator";

    // --- Barre (cliquable) ---
    const bar = document.createElement("button");
    bar.type = "button";
    bar.className = "sg-quickjoin-indicator-bar";
    const dot = document.createElement("span");
    dot.className = "sg-quickjoin-indicator-dot";
    const state = document.createElement("span");
    state.className = "sg-quickjoin-indicator-state";
    const etaSpan = document.createElement("span");
    etaSpan.className = "sg-quickjoin-indicator-eta";
    const today = document.createElement("span");
    today.className = "sg-quickjoin-indicator-today";
    bar.appendChild(dot);
    bar.appendChild(state);
    bar.appendChild(etaSpan);
    bar.appendChild(today);
    bar.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleIndicatorMenu();
    });

    // --- Mini-menu d'actions rapides ---
    const menu = document.createElement("div");
    menu.className = "sg-quickjoin-indicator-menu";
    const items = [
      { id: "toggle", icon: "\u23FB", defaultLabel: "Auto-join", action: toggleAutoJoinFromIndicator },
      { id: "now",    icon: "\u25B6", defaultLabel: "Lancer un passage maintenant", action: () => runAutoJoin(true) },
      { id: "sim",    icon: "\uD83D\uDD0D", defaultLabel: "Simuler un passage (dry-run)", action: () => runAutoJoin(true, true) },
      { id: "refresh", icon: "\u21BB", defaultLabel: "Rafraîchir bibliothèque + gains", action: refreshSteamCaches },
      { id: "rhythm", icon: "\u23F1", defaultLabel: "Rythme des passages", action: configureRhythm },
      { id: "filters", icon: "\u2699", defaultLabel: "Filtres : configurer", action: configureFilters },
      { id: "owned",  icon: "\uD83C\uDFAE", defaultLabel: "Exclure jeux possédés / gagnés", action: () => {
        GM_setValue(OWNED_ENABLED_KEY, !isOwnedEnabled());
      }},
      { id: "steam",  icon: "\u2699", defaultLabel: "Steam : configurer", action: configureSteam },
      { id: "sound",  icon: "\uD83D\uDD14", defaultLabel: "Son à chaque join", action: toggleSignalFromIndicator },
      { id: "soundConfig", icon: "\u2699", defaultLabel: "Son : réglages", action: configureSound },
      { id: "hideJoined", icon: "\uD83D\uDC41", defaultLabel: "Masquer giveaways rejoints", action: toggleHideJoined },
      { id: "compact", icon: "\u25A0", defaultLabel: "Mode compact", action: () => {
        GM_setValue(INDICATOR_COMPACT_KEY, !isIndicatorCompact());
      }}
    ];
    const itemsById = {};
    for (const it of items) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sg-quickjoin-indicator-item";
      btn.dataset.id = it.id;
      const icon = document.createElement("span");
      icon.className = "sg-quickjoin-indicator-item-icon";
      icon.textContent = it.icon;
      const lbl = document.createElement("span");
      lbl.className = "sg-quickjoin-indicator-item-label";
      lbl.textContent = it.defaultLabel;
      btn.appendChild(icon);
      btn.appendChild(lbl);
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        it.action();
        closeIndicatorMenu();
        renderIndicator();
      });
      menu.appendChild(btn);
      itemsById[it.id] = { ...it, node: btn, labelNode: lbl };
    }
    menu._items = itemsById;

    indicator.appendChild(bar);
    indicator.appendChild(menu);
    document.body.appendChild(indicator);

    indicator._bar = bar;
    indicator._menu = menu;
    indicator._dot = dot;
    indicator._state = state;
    indicator._eta = etaSpan;
    indicator._today = today;

    // Click-outside (ferme le menu si on clique ailleurs)
    document.addEventListener("click", (e) => {
      if (indicatorMenuOpen && indicator && !indicator.contains(e.target)) {
        closeIndicatorMenu();
      }
    });
    // Repositionne si la fenêtre change de taille (header height)
    window.addEventListener("resize", positionIndicator);

    positionIndicator();
    renderIndicator();
  }
  function positionIndicator() {
    if (!indicator) return;
    const header = document.querySelector("header");
    const h = header && header.offsetHeight ? header.offsetHeight : 48;
    indicator.style.top = (h + 8) + "px";
    indicator.style.right = "12px";
  }
  function renderIndicator() {
    if (!indicator) return;
    const on = isAutoJoinEnabled();
    const paused = on && isIndicatorPaused();
    indicator.classList.toggle("is-on", on && !paused);
    indicator.classList.toggle("is-off", !on);
    indicator.classList.toggle("is-paused", on && paused);
    indicator.classList.toggle("is-compact", isIndicatorCompact());
    indicator._state.textContent = !on ? "OFF" : paused ? "PAUSE" : "ON";
    indicator._eta.textContent = formatNextPassEta() || "";
    indicator._today.textContent = "\uD83D\uDCC5 " + getDailyCount();
    const items = indicator._menu._items;
    if (items.toggle) {
      items.toggle.labelNode.textContent = "Auto-join : " + (on ? "ON" : "OFF") + " (cliquer pour " + (on ? "désactiver" : "activer") + ")";
    }
    if (items.sound) {
      items.sound.labelNode.textContent = "Son à chaque join : " + (isSignalEnabled() ? "ON" : "OFF");
    }
    if (items.owned) {
      items.owned.labelNode.textContent = "Exclure jeux possédés / gagnés : " + (isOwnedEnabled() ? "ON" : "OFF");
    }
    if (items.hideJoined) {
      items.hideJoined.labelNode.textContent = "Masquer giveaways rejoints : " + (GM_getValue(HIDE_JOINED_KEY, false) ? "ON" : "OFF");
    }
    if (items.compact) {
      items.compact.labelNode.textContent = "Mode compact : " + (isIndicatorCompact() ? "ON" : "OFF");
    }
  }
  function toggleIndicatorMenu() {
    indicatorMenuOpen ? closeIndicatorMenu() : openIndicatorMenu();
  }
  function openIndicatorMenu() {
    if (!indicator) return;
    indicator._menu.classList.add("is-open");
    indicator._bar.classList.add("is-open");
    indicatorMenuOpen = true;
  }
  function closeIndicatorMenu() {
    if (!indicator) return;
    indicator._menu.classList.remove("is-open");
    indicator._bar.classList.remove("is-open");
    indicatorMenuOpen = false;
  }
  function showAutoJoinToast(joinedCount, filteredCount, alreadyCount, customMessage, warningText) {
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
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");

    // --- En-tête (marque + ETA + bouton de fermeture) ---
    const head = document.createElement("div");
    head.className = "sg-quickjoin-toast-head";

    const brand = document.createElement("span");
    brand.className = "sg-quickjoin-toast-brand";
    brand.textContent = "SG QuickJoin";
    head.appendChild(brand);

    const etaText = formatNextPassEta();
    if (etaText) {
      const eta = document.createElement("span");
      eta.className = "sg-quickjoin-toast-eta";
      eta.textContent = etaText;
      head.appendChild(eta);
    }

    const close = document.createElement("button");
    close.className = "sg-quickjoin-toast-close";
    close.type = "button";
    close.setAttribute("aria-label", "Fermer la notification");
    close.textContent = "\u2715";
    close.addEventListener("click", () => {
      if (toast._timer) window.clearTimeout(toast._timer);
      toast.remove();
      if (activeToast === toast) activeToast = null;
    });
    head.appendChild(close);
    toast.appendChild(head);

    // --- Contenu : chips pour le bilan, ligne simple pour les messages d'info ---
    const plural = (n, s) => s + (n > 1 ? "s" : "");
    const isSummary = !customMessage;
    let readableText = "";
    if (isSummary) {
      const chips = document.createElement("div");
      chips.className = "sg-quickjoin-toast-chips";
      const items = [
        { cls: "sg-quickjoin-chip-joined",   n: joinedCount,        label: plural(joinedCount, "rejoint") },
        { cls: "sg-quickjoin-chip-filtered", n: filteredCount,      label: plural(filteredCount, "filtré") },
        { cls: "sg-quickjoin-chip-already",  n: alreadyCount,       label: plural(alreadyCount, "déjà inscrit") },
        { cls: "sg-quickjoin-chip-today",    n: getDailyCount(),    label: "aujourd'hui" }
      ];
      const summaryParts = [];
      for (const item of items) {
        const chip = document.createElement("span");
        chip.className = "sg-quickjoin-chip " + item.cls;
        const dot = document.createElement("span");
        dot.className = "sg-quickjoin-chip-dot";
        const count = document.createElement("span");
        count.className = "sg-quickjoin-chip-count";
        count.textContent = String(item.n);
        const lbl = document.createElement("span");
        lbl.className = "sg-quickjoin-chip-label";
        lbl.textContent = " " + item.label;
        chip.appendChild(dot);
        chip.appendChild(count);
        chip.appendChild(lbl);
        chips.appendChild(chip);
        summaryParts.push(item.n + " " + item.label);
      }
      toast.appendChild(chips);
      readableText = "SG QuickJoin — " + summaryParts.join(" • ");
    } else if (customMessage) {
      const msg = document.createElement("div");
      msg.className = "sg-quickjoin-toast-msg";
      msg.textContent = customMessage;
      toast.appendChild(msg);
      readableText = customMessage;
    }

    if (warningText) {
      const warning = document.createElement("div");
      warning.className = "sg-quickjoin-toast-warning";
      warning.textContent = "⚠ " + warningText;
      toast.appendChild(warning);
      readableText = readableText ? (readableText + " — " + warningText) : warningText;
    }

    // textContent sur la racine : sert de fallback lisible (lecteurs d'écran, tests existants)
    toast.textContent = readableText;

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
    return count;
  }


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
          zeroJoinReason
        ].filter(Boolean).join(" — ");
        showAutoJoinToast(joinedCount, filteredCount, alreadyCount, null, warnings);
      }
    } finally {
      isAutoJoinPassInProgress = false;
      renderIndicator();
    }
  }

  // Programme le prochain passage avec un délai aléatoire dans [min, max] configuré.
  function scheduleNextAutoJoinPass() {
    if (autoJoinTimer) return;
    const { minMs, maxMs } = getIntervalRangeMs();
    const jitterMs = minMs + Math.random() * (maxMs - minMs);
    nextAutoJoinAt = Date.now() + jitterMs;
    autoJoinTimer = window.setTimeout(() => {
      autoJoinTimer = null;
      nextAutoJoinAt = null;
      runAutoJoin(false).finally(() => {
        if (isAutoJoinEnabled()) {
          scheduleNextAutoJoinPass();
        }
      });
    }, jitterMs);
    renderIndicator();
  }
  function startAutoJoinTimer() {
    if (autoJoinTimer) return;
    // Hors page de liste : l'auto-join reste en veille sur cette page (le timer ne démarre pas)
    if (isAutoJoinListOnlyEnabled() && !isGiveawaysListPage()) {
      console.info("[SG-QuickJoin] Page hors liste giveaways : auto-join en veille (il reprendra sur une page de liste)");
      nextAutoJoinAt = null;
      renderIndicator();
      return;
    }
    nextAutoJoinAt = Date.now() + 5000; // premier passage rapide après chargement
    window.setTimeout(() => runAutoJoin(false), 5000); // premier passage rapide après chargement
    scheduleNextAutoJoinPass();
  }
  function stopAutoJoinTimer() {
    nextAutoJoinAt = null;
    if (!autoJoinTimer) return;
    window.clearTimeout(autoJoinTimer);
    autoJoinTimer = null;
    renderIndicator();
  }



  // === Rythme des passages (jitter configurable) ===




  function configureRhythm() {
    const r = getIntervalRangeMinutes();
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
    if (autoJoinTimer) {
      window.clearTimeout(autoJoinTimer);
      autoJoinTimer = null;
      scheduleNextAutoJoinPass();
    }
  }

  function configureFilters() {
    const cfg = getFilterConfig();
    const ending = isEndingSoonEnabled();
    const join = (label, vals) => label + ": " + vals.join(", ");
    const current = "filtres: " + (isFilterEnabled() ? "ON" : "OFF") + " | " + join("inclure", cfg.include) + " | " + join("exclure", cfg.exclude) + " | " + join("genres", cfg.genres) + " | ≤24h: " + (ending ? "ON" : "OFF");
    const input = prompt(
      "Filtres de jeux — format : filtres: ON/OFF | inclure: a, b | exclure: c | genres: Indie, Strategy | ≤24h: ON/OFF\n" +
      "  filtres : ON ou OFF (activé/désactivé)\n" +
      "  inclure : le titre doit contenir au moins un de ces mots\n" +
      "  exclure : un seul mot écarte le jeu\n" +
      "  genres  : genres Steam autorisés (le jeu doit en avoir au moins un)\n" +
      "  ≤24h   : ON = uniquement les giveaways finissant dans 24h\n" +
      "Laisser une partie vide pour la désactiver.",
      current
    );
    if (input === null) return;
    const parse = (label) => {
      const m = String(input).match(new RegExp("(?:^|\\|)\\s*" + label + "\\s*:\\s*([^|]*)", "i"));
      return m ? m[1].trim() : "";
    };
    const filterStr = parse("filtres").toUpperCase();
    if (filterStr === "ON" || filterStr === "OFF") {
      GM_setValue(FILTER_ENABLED_KEY, filterStr === "ON");
    }
    GM_setValue(FILTER_INCLUDE_KEY, parse("inclure"));
    GM_setValue(FILTER_EXCLUDE_KEY, parse("exclure"));
    GM_setValue(FILTER_GENRES_KEY, parse("genres"));
    const endingStr = parse("≤24h").toUpperCase();
    if (endingStr === "ON" || endingStr === "OFF") {
      GM_setValue(ENDING_SOON_KEY, endingStr === "ON");
    }
  }

  // Rafraîchit les deux caches (bibliothèque Steam + historique des gains) à la demande
  async function refreshSteamCaches() {
    GM_setValue(OWNED_FETCHED_KEY, 0);
    GM_setValue(WON_FETCHED_KEY, 0);
    const owned = await getOwnedGamesSet();
    const won = await getWonGamesSet();
    const parts = [];
    parts.push(owned ? "bibliothèque: " + owned.size + " jeux" : "bibliothèque: indisponible");
    parts.push(won ? "gagnés: " + won.size + " jeux" : "gagnés: indisponible");
    console.info("[SG-QuickJoin] Vérifications rafraîchies:", parts.join(" | "));
    showAutoJoinToast(0, 0, 0, "SG QuickJoin — vérifications : " + parts.join(" | "));
    renderIndicator();
  }


  // Une seule commande : clé API + SteamID + rechargement immédiat (moins de boutons)
  async function configureSteam() {
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
  }

  // Son : tout-en-un (ON/OFF + volume + type)
  var SOUND_TYPE_LABELS = { sine: "doux", triangle: "clair", square: "aigu", off: "flash seul" };
  function configureSound() {
    const enabled = isSignalEnabled();
    const label = SOUND_TYPE_LABELS[getSoundType()] || "doux";
    const current = (enabled ? "ON" : "OFF") + " | " + getSoundVolume() + " | " + getSoundType();
    const input = prompt(
      "Son à chaque join — format : ON/OFF | volume (0-100) | type\n" +
      "  ON/OFF : activer ou désactiver le son\n" +
      "  volume : 0 à 100\n" +
      "  type   : sine = doux, triangle = clair, square = aigu, off = flash seul\n" +
      "Ex: ON 40 sine — actuel: " + current + " :",
      current
    );
    if (input === null) return;
    const parts = String(input).trim().split(/\s+/);
    const onOff = parts[0] ? parts[0].toUpperCase() : "";
    if (onOff === "ON" || onOff === "OFF") {
      GM_setValue(SIGNAL_ENABLED_KEY, onOff === "ON");
    }
    const vol = Number(parts[1]);
    if (Number.isFinite(vol)) {
      GM_setValue(SOUND_VOLUME_KEY, Math.max(0, Math.min(100, Math.round(vol))));
    }
    const t = parts[2] ? parts[2].toLowerCase() : "";
    if (t === "off" || SOUND_PRESETS[t]) {
      GM_setValue(SOUND_TYPE_KEY, t);
    }
    renderIndicator();
  }

  function main() {
    fixHeader();
    showMore();
    buildIndicator(); // indicateur permanent (haut-droite) — visible avant même le rendu des giveaways
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
