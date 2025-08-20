// firebase.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import {
  getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence,
  signInAnonymously
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// !!! ЗАМЕНИ на свои ключи из консоли Firebase
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID'
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
