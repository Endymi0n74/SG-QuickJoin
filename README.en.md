# SG Quick Join SE

Tampermonkey userscript for [SteamGifts.com](https://www.steamgifts.com):
discreet auto-join with a **permanent indicator** (top-right) to control everything.

Heavily modified fork of [HCLonely/SG-QuickJoin](https://github.com/HCLonely/SG-QuickJoin) (MIT).

[![Version](https://img.shields.io/github/v/release/Endymi0n74/SG-QuickJoin?label=v1.0.0&style=flat-square)](https://github.com/Endymi0n74/SG-QuickJoin/releases/latest)
[![Installer](https://img.shields.io/badge/Install%20-%20Tampermonkey-4b8bbe?style=flat-square)](https://github.com/Endymi0n74/SG-QuickJoin/releases/latest/download/SG-QuickJoin.user.js)
[![Licence](https://img.shields.io/github/license/Endymi0n74/SG-QuickJoin?label=MIT&style=flat-square)](https://github.com/Endymi0n74/SG-QuickJoin/blob/main/LICENSE)

[🇫🇷 Français](README.md) · **🇬🇧 English**

## Installation

[![Installer avec Tampermonkey](https://img.shields.io/badge/🦎%20Installer%20avec%20Tampermonkey-4b8bbe?style=for-the-badge)](https://github.com/Endymi0n74/SG-QuickJoin/releases/latest/download/SG-QuickJoin.user.js)

1. Click the button above → Tampermonkey displays the installation page → **Install**.
2. Go to [steamgifts.com](https://www.steamgifts.com): a **small green pill** appears in the top-right corner.

> **No Tampermonkey menu** — everything is controlled from the indicator.

## Interface: the permanent indicator

A small pill fixed in the top-right corner of every SteamGifts page:

| State | Meaning |
|------|---------------|
| 🟢 **ON** + ETA | Auto-join active, estimated next run |
| 🟠 **PAUSE** | Auto-join active but waiting (off the list page / outside hours) |
| ⚪ **OFF** | Auto-join disabled |
| 🔵 counter | Number of giveaways joined today |

**Click the pill** to open the mini-menu:

| Action | Description |
|--------|-------------|
| ⏻ Auto-join: ON/OFF | Enable/disable auto-join |
| ▶ Start a run now | Immediate run (bypasses list page + hours) |
| 🔍 Simulate a run | Dry-run: diagnostic without a single request |
| 🔄 Refresh library + wins | Clears the Steam caches (immediate reload) |
| ⏱ Run pace | Configure the delay between runs (1-120 min) |
| ⚙ Filters: configure | Include/exclude keywords + Steam genres + ≤ 24h |
| 🎮 Exclude owned / won games | Toggle ON/OFF |
| ⚙ Steam: configure | API key + SteamID64 |
| 🔔 Sound on each join | Toggle ON/OFF |
| 🔔 Sound: settings | Volume (0-100) + type (sine/triangle/square/off) |
| 👁 Hide joined giveaways | Hides giveaways already joined on the page |
| ⬛ Compact mode | Shows only the dot (no text) |

## Features

- **Stealth auto-join**: regular runs with random jitter (13-17 min, configurable),
  2-8 s delay between requests, no visual effect on the page.
- **List pages only**: auto-join only runs on `/`, `/giveaways*`.
- **7 AM – 10 PM window** (Paris time): auto-join stays silent outside this range.
- **Filters**: include/exclude keywords + Steam genres (store API, 7-day cache) + ≤ 24h option.
- **Owned / won game exclusion**:
  - real Steam library (API key + auto-detected SteamID64),
  - SteamGifts win history (`/giveaways/won`).
- **Excluded panel** (bottom right): giveaways set aside, grouped by reason.
- **Discreet notification**: per-run summary (joined / filtered / already entered / today).
- **Sound signal + flash** configurable (volume + type).
- **Daily counter** persistent + 7-day history.

## Steam configuration (optional)

1. Free API key: https://steamcommunity.com/dev/apikey
2. Indicator → ⚙ Steam: configure → enter your API key
3. Indicator → 🎮 Exclude owned games → ON
4. Indicator → 🔄 Refresh library + wins

The SteamID64 is **automatically detected** from the page.

## Tests

```bash
node SG-QuickJoin.test.js   # 135 tests fonctionnels (mocks DOM/GM_*/fetch)
```

## Auto-update

- `@updateURL` → `…/releases/latest/download/SG-QuickJoin.meta.js`
- `@downloadURL` → `…/releases/latest/download/SG-QuickJoin.user.js`

Each release publishes both assets; Tampermonkey checks the `@version` and updates
automatically.

## Warning

Auto-join sends real requests to SteamGifts. Use it in moderation
(delays + jitter + time window are there for that reason) — at your own risk.

## License

[MIT](LICENSE) — fork of [HCLonely/SG-QuickJoin](https://github.com/HCLonely/SG-QuickJoin)
(also MIT).
