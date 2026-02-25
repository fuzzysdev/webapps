# 🥏 Ultimate Tryouts

A Progressive Web App (PWA) for managing ultimate frisbee tryouts. Track players, rank them by gender, set a keep/cut line, add notes, and export your final roster.

## Features

- **Player management** — Add players with name, gender, and grade
- **Ranked lists** — Separate male/female columns, drag-to-reorder cards
- **Cut line** — Draggable divider to set your roster cutoff
- **Notes** — Per-player scouting notes
- **Privacy blur** — One-tap blur to hide info from onlookers
- **Export** — Copy or download CSV of your roster and full rankings
- **Offline support** — Works without internet once loaded
- **iPad-ready** — Installable as a home screen app via Safari

---

## Deploying to Vercel

### Option A: Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts. On first deploy it will ask you to link a project — just accept the defaults.

### Option B: GitHub + Vercel Dashboard

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repo
4. No build settings needed — Vercel will serve the static files automatically
5. Click **Deploy**

---

## Installing on iPad

1. Open your Vercel URL in **Safari**
2. Tap the **Share** button (box with arrow)
3. Tap **"Add to Home Screen"**
4. Tap **Add**

The app will appear on your home screen and run fullscreen like a native app. All data is saved locally on the device.

---

## Project Structure

```
ultimate-tryouts/
├── index.html        # Main app (single-file PWA)
├── manifest.json     # PWA manifest (icons, name, theme)
├── sw.js             # Service worker (offline caching)
├── vercel.json       # Vercel headers config
├── icons/
│   ├── icon-192.png  # App icon (home screen)
│   └── icon-512.png  # App icon (splash screen)
└── README.md
```

---

## Local Development

No build step needed. Just open `index.html` in a browser, or serve with any static file server:

```bash
npx serve .
# or
python3 -m http.server 8080
```

> **Note:** The service worker requires HTTPS or `localhost` to activate. On Vercel it works automatically.
