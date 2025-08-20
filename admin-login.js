// admin-login.js
import { auth } from './firebase.js';
import {
  onAuthStateChanged, signInWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const emailEl = document.getElementById('email');
const passEl = document.getElementById('password');
const btn = document.getElementById('doLogin');
const statusEl = document.getElementById('authStatus');
const errEl = document.getElementById('loginError');

onAuthStateChanged(auth, (user) => {
  if (user && !user.isAnonymous) {
    statusEl.textContent = user.email || user.uid;
    // уже вошли — идём в админку
    window.location.href = 'admin.html';
  } else {
    statusEl.textContent = 'Гость';
  }
});

btn?.addEventListener('click', async () => {
  errEl.textContent = '';
  const email = (emailEl.value || '').trim();
  const pass = passEl.value || '';
  if (!email || !pass) {
    errEl.textContent = 'Нужны e-mail и пароль.';
    return;
  }
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    // редирект произойдёт в onAuthStateChanged
  } catch (e) {
    errEl.textContent = e.message || 'Ошибка входа.';
  }
});
