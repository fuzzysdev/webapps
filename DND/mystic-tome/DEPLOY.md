# 🧙 Mystic Tome — Deployment Guide

## What's in this folder

```
mystic-tome/
├── api/
│   └── chat.js          ← Secure serverless function (hides your API key)
├── public/
│   └── index.html       ← HTML entry point
├── src/
│   ├── index.js         ← React entry point
│   └── App.js           ← Main app (edit this to customize your campaign)
├── package.json
├── vercel.json          ← Tells Vercel how to route requests
└── DEPLOY.md            ← This file
```

---

## Step 1 — Customize the app

Open `src/App.js` and edit these at the top of the file:

- **`DM_PASSWORD`** — Change `"dungeon123"` to your own password
- **`DEFAULT_KNOWN`** — Replace with your actual campaign lore
- **`DEFAULT_HIDDEN`** — Replace with your actual secrets

---

## Step 2 — Get a free Anthropic API key

1. Go to **https://console.anthropic.com**
2. Sign up / log in
3. Click **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-...`) — you'll need it in Step 4

---

## Step 3 — Push to GitHub

1. Go to **https://github.com** and create a free account if needed
2. Click **New Repository** → name it `mystic-tome` → **Create**
3. On your computer, open a terminal in the `mystic-tome` folder and run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mystic-tome.git
git push -u origin main
```

---

## Step 4 — Deploy on Vercel

1. Go to **https://vercel.com** and sign up (use your GitHub account)
2. Click **Add New Project**
3. Import your `mystic-tome` GitHub repo
4. Under **Build & Output Settings**, Vercel should auto-detect it as a React app
5. Before clicking Deploy, click **Environment Variables** and add:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** your key from Step 2 (e.g. `sk-ant-...`)
6. Click **Deploy** 🚀

Vercel will give you a URL like `mystic-tome-abc123.vercel.app` — that's your live site!

---

## Step 5 — Share with your players

Send them the Vercel URL. That's it!

- Players see the **Consult the Tome** and **Player Lore** tabs
- Only you know the DM password to access the **DM Sanctum**

---

## Updating the campaign lore

Whenever you want to update the Known Lore (e.g. after a session):
- Go to your live site → DM Sanctum → Known Lore → edit → Save Changes
- **OR** edit `DEFAULT_KNOWN` in `src/App.js`, push to GitHub, and Vercel auto-redeploys

---

## Troubleshooting

**"API key not configured"** — Double-check the environment variable in Vercel dashboard → Settings → Environment Variables

**App won't build** — Make sure you ran `git add .` and committed all files

**Players can't see each other's entries** — This is expected! localStorage is per-browser. Each player's entries only live in their own browser. If you want shared entries across all players, let me know and I can add a database.
