// admin-menu.js
import { auth } from './firebase.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const btn = document.getElementById('menu-admin');
let isAuthed = false;

onAuthStateChanged(auth, (user) => {
  isAuthed = !!user && !user.isAnonymous;
  // Глобальный флаг для показа кнопок удаления
  window.__ADMIN__ = isAuthed;
  if (btn) btn.textContent = isAuthed ? 'Admin (online) ▾' : 'Admin ▾';
});

if (btn) {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!isAuthed) {
      window.location.href = 'admin-login.html';
    } else {
      window.location.href = 'admin.html';
    }
  });
  // Alt+клик — быстрый выход
  btn.addEventListener('auxclick', (e) => {
    if (e.altKey && isAuthed) signOut(auth);
  });
}
