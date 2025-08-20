// admin.js
import { db, auth } from './firebase.js';
import {
  collection, onSnapshot, query, orderBy, Timestamp, where, doc, deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const whoEl = document.getElementById('who');
const tbody = document.getElementById('tbody');
const refreshBtn = document.getElementById('refreshBtn');
const logoutBtn = document.getElementById('logoutBtn');
const showExpiredEl = document.getElementById('showExpired');

// Разрешённые админы — укажи свои email/uid
const ALLOWED_EMAILS = ['you@example.com']; // TODO: замени
const ALLOWED_UIDS = []; // например: ['abc123uid']

function isAdmin(user) {
  if (!user || user.isAnonymous) return false;
  if (user.email && ALLOWED_EMAILS.includes(user.email)) return true;
  if (ALLOWED_UIDS.includes(user.uid)) return true;
  return false;
}

let unsub = null;
function subscribe(showExpired) {
  if (unsub) unsub();
  const posts = collection(db, 'broadcast');
  const nowTs = Timestamp.now();
  const q = showExpired ?
    query(posts, orderBy('createdAt', 'desc')) :
    query(posts, where('expiresAt', '>', nowTs), orderBy('createdAt', 'desc'));
  unsub = onSnapshot(q, (snap) => {
    tbody.innerHTML = '';
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      const tr = document.createElement('tr');
      const created = d.createdAt?.toDate?.() || new Date();
      const expires = d.expiresAt?.toDate?.() || new Date(created.getTime()+30*60000);
      tr.innerHTML = `
        <td>${created.toLocaleString()}</td>
        <td>${expires.toLocaleString()}</td>
        <td>${(d.mask||'')}</td>
        <td style="max-width:520px; white-space:pre-wrap;">${(d.text||'').replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]))}</td>
        <td><button class="btn95" data-id="${docSnap.id}">Del</button></td>
      `;
      tr.querySelector('button').addEventListener('click', async () => {
        if (confirm('Удалить сообщение?')) {
          try { await deleteDoc(doc(db, 'broadcast', docSnap.id)); }
          catch (e) { alert('Не удалось удалить: ' + e.message); }
        }
      });
      tbody.appendChild(tr);
    });
  });
}

onAuthStateChanged(auth, (user) => {
  if (!isAdmin(user)) {
    // не админ — уходим на логин
    window.location.href = 'admin-login.html';
    return;
  }
  whoEl.textContent = user.email || user.uid;
  subscribe(!!showExpiredEl?.checked);
});

refreshBtn?.addEventListener('click', () => subscribe(!!showExpiredEl?.checked));
showExpiredEl?.addEventListener('change', () => subscribe(!!showExpiredEl?.checked));
logoutBtn?.addEventListener('click', () => signOut(auth));
