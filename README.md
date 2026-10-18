# DM Forge

A Progressive Web App (PWA) dungeon master toolkit for tabletop RPG. Built for mobile-first use on low-end Android phones. Works fully offline after first load.

## Features

### Free tier
- **Initiative Tracker** — Add combatants with name, initiative roll, HP, and type. Sorted automatically. Highlight active turn, round counter, next/prev navigation.
- **Encounter Builder** — Add monsters by name and CR, calculates XP and difficulty rating (trivial / easy / medium / hard / deadly) based on D&D 5e SRD thresholds against party size and level.

### DM Forge Pro — $2.99 (placeholder)
- NPC Generator
- Loot Generator
- Session Notes
- Spell Reference

Payment not yet integrated — unlock button is wired but shows a coming-soon toast.

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
