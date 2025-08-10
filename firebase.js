// firebase.js (updated)
// NOTE: Admin key approach is not secure for production, but OK for a quick client-only admin panel.
// For real security, use Firebase Auth + Security Rules + (optionally) custom claims.
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD0cCiWsbsYidFXgzmPmPlQ1CbDZ0aWfqY",
  authDomain: "mothdemienne.firebaseapp.com",
  projectId: "mothdemienne",
  storageBucket: "mothdemienne.firebasestorage.app",
  messagingSenderId: "199511653439",
  appId: "1:199511653439:web:e659bc721c660d9340cc8a"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- minimal anon sign-in (optional; helps you have a stable uid) ---
try {
  onAuthStateChanged(auth, (u) => {
    if (!u) signInAnonymously(auth).catch(()=>{});
    if (u && !localStorage.getItem("anon-id")) {
      // keep your existing anon-id logic if any
      localStorage.setItem("anon-id", u.uid);
    }
  });
} catch (e) { /* ignore */ }

// --- Admin gate (weak client-side) ---
// Set this to a phrase only you know. Then open /admin.html, enter the key, and you'll get admin tools.
export const ADMIN_KEY = "CHANGE_ME";
export function isAdmin() {
  try {
    return localStorage.getItem("admin-key") === ADMIN_KEY;
  } catch (e) {
    return false;
  }
}
export function requireAdminOrThrow() {
  if (!isAdmin()) throw new Error("Not authorized (admin key missing or incorrect).");
}
