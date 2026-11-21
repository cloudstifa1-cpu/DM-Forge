# DM Forge

A Progressive Web App (PWA) dungeon master toolkit for tabletop RPG. Built for mobile-first use on low-end Android phones. Works fully offline after first load.

## Features

Bottom bar: **Notebook · Fight · Monsters · Heroes · More** (on laptops/big tablets it becomes a left-side rail).

### Free tier
- **Linked Campaign Notebook** (opens first) — one page per session; names link themselves and each type gets its own color. Free holds 25 linked entries per quest.
- **Fight** — initiative tracker with rounds and turns.
- **Monsters** — SRD monster list, homemade monsters, encounter builder with difficulty.
- **Heroes** — bring-your-own character entry, rolled stats, shared roster across quests.
- **Backup & Restore** (More) — saves everything to one .json file; weekly reminder banner.

### DM Forge Pro — $2.99 one-time (payment not wired yet)
- Unlimited notebook entries and quests
- NPC Generator, Loot Generator, Spell Reference (under More)
- Portraits and pre-made heroes

## Tests

```bash
node --test tests/*.test.js
```

## Tech stack

- Vanilla HTML / CSS / JavaScript (no frameworks — runs on 2 GB RAM Android)
- PWA with service worker (full offline support, installable)
- `localStorage` for persistence across sessions
- Google Fonts: Cinzel + Inter (cached by service worker)

## Structure

```
dm-forge/
├── index.html          Main app shell + all tab panels
├── manifest.json       PWA manifest
├── service-worker.js   Offline caching strategy
├── css/
│   └── style.css       All styles (design tokens → components)
├── js/
│   ├── app.js          Tab routing, toasts, SW registration
│   ├── initiative.js   Initiative tracker logic + UI
│   └── encounter.js    Encounter builder logic + UI
└── README.md
```

## Running locally

Any static file server works:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Open http://localhost:8080 in Chrome/Firefox. For PWA install prompt, serve over HTTPS or use localhost.

## Design

Dark forge aesthetic. Color tokens:

| Token          | Value     | Use                     |
|----------------|-----------|-------------------------|
| `--forge-base` | `#1a1612` | Page background         |
| `--ember`      | `#c4622d` | Primary action / active |
| `--gold`       | `#b8952a` | Headers / numbers       |
| `--text-primary` | `#e8dcc8` | Body text              |

Typography: `Cinzel` (display/headers) + `Inter` (UI/body).

## Roadmap

- [ ] Payment integration (Stripe or PayPal) to unlock Pro tier
- [ ] NPC Generator with name, personality, and secret tables
- [ ] Loot generator by CR and biome
- [ ] Session notes with Markdown support
- [ ] Spell reference (SRD spells, filterable by class/level)
- [ ] Export combat log to text
- [ ] Dice roller widget
