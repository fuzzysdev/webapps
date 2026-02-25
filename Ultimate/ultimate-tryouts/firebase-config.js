// firebase-config.js
// ─────────────────────────────────────────────────────────────
// Replace the values below with your own Firebase project config.
// Find these in: Firebase Console → Project Settings → Your Apps → SDK setup
// ─────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

// ADMIN_UID: Set this to the Firebase UID of the admin account.
// After your first login, open browser devtools → Console and you'll
// see your UID logged. Paste it here and redeploy.
export const ADMIN_UID = "YOUR_ADMIN_UID_HERE";
