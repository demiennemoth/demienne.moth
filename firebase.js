
// firebase.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import {
  getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence,
  signInAnonymously
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyD0cCiWsbsYidFXgzmPmPlQ1CbDZ0aWfqY",
  authDomain: "mothdemienne.firebaseapp.com",
  projectId: "mothdemienne",
  storageBucket: "mothdemienne.appspot.com",
  messagingSenderId: "199511653439",
  appId: "1:199511653439:web:e659bc721c660d9340cc8a"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Configure auth to persist across sessions.  The browserLocalPersistence
// storage backend uses localStorage under the hood.  If it fails (e.g.
// quotas exceeded or a private browsing mode that forbids it), catch the
// error so the rest of the app continues to run.  In that case the
// authentication state falls back to session memory.
try {
  await setPersistence(auth, browserLocalPersistence);
} catch (e) {
  console.warn('Failed to set auth persistence', e);
}

// Anonymous authentication for guests.  Administrators will log in through
// their dedicated interface, so we only sign in anonymously when there is
// no current user.  Errors during sign-in are logged instead of thrown.
if (!auth.currentUser) {
  try {
    await signInAnonymously(auth);
  } catch (e) {
    console.warn('Anonymous auth failed', e);
  }
}

onAuthStateChanged(auth, (user) => {
  // можно логировать состояние
  // console.debug('auth:', user ? (user.isAnonymous ? 'anon' : (user.email||user.uid)) : 'none');
});
