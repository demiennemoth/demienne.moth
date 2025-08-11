// firebase.js — auth revamp: admin via Email/Password; others stay anonymous
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// --- your project config (unchanged) ---
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

// === Admin identity ===
// Replace with your admin email:
export const ADMIN_EMAIL = "demienne.moth@gmail.com";

export function isAdminUser(u){
  return !!u && !!u.email && u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
export function isAdmin(){
  const u = auth.currentUser;
  return isAdminUser(u);
}
export async function adminSignIn(email, password){
  return signInWithEmailAndPassword(auth, email, password);
}
export async function adminSignOut(){
  return signOut(auth);
}

// === Default: anonymous for non-admin visitors ===
onAuthStateChanged(auth, async (u) => {
  try{
    if (!u) {
      // No user — go anonymous.
      await signInAnonymously(auth);
      return;
    }
    // keep anon id for UI convenience
    if (!localStorage.getItem("anon-id")) {
      localStorage.setItem("anon-id", u.uid);
    }
  }catch(e){
    console.warn("Auth flow warning:", e);
  }
});
