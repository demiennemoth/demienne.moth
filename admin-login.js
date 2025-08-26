
// admin-login.js (Win95 status bar style) — hardened
import { auth } from './firebase.js';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// DOM
const emailEl = document.getElementById('email');
const passEl = document.getElementById('password');
const btn = document.getElementById('doLogin');
const statusSpan = document.getElementById('authStatus');
const errorEl = document.getElementById('loginError');

// Create status bar (Win95) with a11y
let statusBar = document.querySelector('.statusbar95');
if (!statusBar) {
  statusBar = document.createElement('div');
  statusBar.className = 'status95 statusbar95';
  statusBar.style.marginTop = '10px';
  statusBar.style.borderTop = '1px solid #808080';
  statusBar.style.padding = '6px 8px';
  statusBar.style.background = '#e0e0e0';
  statusBar.style.color = '#000';
  statusBar.setAttribute('role','status');
  statusBar.setAttribute('aria-live','polite');
  statusBar.textContent = 'Ready.';
  document.querySelector('.panel95')?.appendChild(statusBar);
}

function setStatus(msg, type='info') {
  statusBar.textContent = msg;
  statusBar.style.color = (type === 'error') ? '#900' : (type === 'ok' ? '#0037da' : '#000');
  if (errorEl) errorEl.textContent = (type === 'error') ? msg : '';
}

onAuthStateChanged(auth, (user) => {
  if (user && !user.isAnonymous) {
    statusSpan.textContent = user.email || user.uid;
    setStatus('Signed in. Redirecting…', 'ok');
    setTimeout(() => { window.location.href = 'admin.html'; }, 400);
  } else {
    statusSpan.textContent = 'Guest';
    setStatus('Awaiting credentials.');
  }
});

btn?.addEventListener('click', async () => {
  const email = (emailEl?.value || '').trim();
  const pass = passEl?.value || '';
  if (!email || !pass) { setStatus('Missing credentials.', 'error'); return; }
  try {
    setStatus('Processing…');
    btn.disabled = true;
    await signInWithEmailAndPassword(auth, email, pass);
    // redirect happens in onAuthStateChanged
  } catch (e) {
    setStatus('Login error. Try again.', 'error');
  } finally {
    btn.disabled = false;
  }
});

// Submit with Enter
[emailEl, passEl].forEach(el => el?.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter') { ev.preventDefault(); btn?.click(); }
}));
