
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

await setPersistence(auth, browserLocalPersistence);
// Гостям — анонимный вход (админ залогинится на своей странице)
if (!auth.currentUser) {
  try { await signInAnonymously(auth); } catch (e) { console.warn('anon auth failed', e); }
}

onAuthStateChanged(auth, (user) => {
  // можно логировать состояние
  // console.debug('auth:', user ? (user.isAnonymous ? 'anon' : (user.email||user.uid)) : 'none');
});
