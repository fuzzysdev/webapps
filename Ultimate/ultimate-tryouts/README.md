# 🥏 Ultimate Tryouts

A Progressive Web App (PWA) for managing ultimate frisbee tryouts. Coaches sign in, manage multiple tryout seasons, rank players with a drag-and-drop interface, set a keep/cut line, add scouting notes, and export the final roster. All data syncs to Firebase Firestore in real time.

---

## Features

- **Authentication** — Email/password + Google sign-in
- **Multi-session** — Each coach can have multiple named tryout seasons (e.g. "Fall 2025")
- **Player management** — Add players with name, gender, and grade
- **Ranked lists** — Separate male/female columns, drag-to-reorder
- **Cut line** — Draggable divider to set your roster cutoff
- **Scouting notes** — Per-player notes, synced to the cloud
- **Privacy blur** — One-tap to blur all content from onlookers
- **Cloud sync** — All data saved to Firebase Firestore; local cache for offline use
- **Admin view** — Admin account can see all coaches and their sessions
- **Export** — Copy or download CSV of the roster and full rankings
- **PWA / iPad** — Installable as a home screen app, works offline

---

## Setup

### 1. Fill in your Firebase config

Open `firebase-config.js` and replace the placeholder values with your project's config. Find these in:

> Firebase Console → Project Settings → Your Apps → Web App → SDK setup and configuration

```js
export const firebaseConfig = {
  apiKey:            "...",
  authDomain:        "your-project.firebaseapp.com",
  projectId:         "your-project",
  storageBucket:     "your-project.appspot.com",
  messagingSenderId: "...",
  appId:             "..."
};

export const ADMIN_UID = "YOUR_ADMIN_UID_HERE"; // set after first login (see step 4)
```

### 2. Enable Firebase Authentication

In the Firebase Console:
1. Go to **Authentication → Sign-in method**
2. Enable **Email/Password**
3. Enable **Google**

For Google sign-in to work on your deployed Vercel domain, also add it under:
> Authentication → Settings → Authorized domains → Add domain

### 3. Set up Firestore

1. Go to **Firestore Database → Create database**
2. Start in **Production mode**
3. Choose a region close to you

Then deploy the security rules. Either:

**Option A – Firebase CLI:**
```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # select your project, accept defaults
cp firestore.rules firestore.rules   # already done
firebase deploy --only firestore:rules
```

**Option B – Paste in Console:**
- Go to Firestore → Rules
- Paste the contents of `firestore.rules`
- Click Publish

### 4. Find your Admin UID

1. Deploy the app (see Vercel section below)
2. Sign in with your admin account
3. Open browser DevTools → Console
4. You'll see: `Your UID: abc123xyz...`
5. Copy that UID and paste it into:
   - `firebase-config.js` → `ADMIN_UID`
   - `firestore.rules` → `isAdmin()` function
6. Redeploy

---

## Deploying to Vercel

### Option A: GitHub + Vercel Dashboard (recommended)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repo
4. **No build settings needed** — it's a static site
5. Click **Deploy**

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel
```

---

## Installing on iPad

1. Open your Vercel URL in **Safari**
2. Tap the **Share** button (box with upward arrow)
3. Tap **"Add to Home Screen"**
4. Tap **Add**

The app runs fullscreen like a native app. Data is cached locally so it works even with a spotty connection.

---

## Data Structure (Firestore)

```
/coaches/{uid}
  name, email, lastSeen

/coaches/{uid}/sessions/{sessionId}
  name
  players:  [ { id, name, gender, grade } ]
  rankings: { M: [id, id, ...], F: [id, id, ...] }
  cutIndex: { M: 5, F: 4 }
  notes:    { playerId: "note text" }
  updatedAt: timestamp
```

---

## Project Structure

```
ultimate-tryouts/
├── index.html          ← Full app (single-file PWA)
├── firebase-config.js  ← ⚠ Fill in your Firebase credentials
├── firestore.rules     ← Firestore security rules
├── manifest.json       ← PWA manifest
├── sw.js               ← Service worker (offline support)
├── vercel.json         ← Vercel headers config
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── README.md
```

---

## Local Development

```bash
# Serve locally (service worker needs localhost or HTTPS)
npx serve .
# or
python3 -m http.server 8080
```

Then open http://localhost:8080 in your browser.

> **Note:** Google sign-in may not work on localhost — use email/password for local testing, or deploy to Vercel first.
