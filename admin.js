// admin.js — FIXED: no composite index required
// Query uses only `expiresAt` for both range and ordering, so Firestore's single-field index suffices.

import { db, auth } from './firebase.js';
import {
  collection, onSnapshot, query, orderBy, Timestamp, where, doc, deleteDoc, limit
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

const whoEl = document.getElementById('who');
const tbody = document.getElementById('tbody');
const refreshBtn = document.getElementById('refreshBtn');
const logoutBtn = document.getElementById('logoutBtn');
const showExpiredEl = document.getElementById('showExpired');

// Win95 status bar
let statusBar = document.querySelector('.statusbar95');
if (!statusBar) {
  statusBar = document.createElement('div');
  statusBar.className = 'status95 statusbar95';
  statusBar.style.marginTop = '10px';
  statusBar.style.borderTop = '1px solid #808080';
  statusBar.style.padding = '6px 8px';
  statusBar.style.background = '#e0e0e0';
  statusBar.style.color = '#000';
  statusBar.textContent = 'Ready.';
  document.querySelector('.panel95:last-of-type')?.appendChild(statusBar);
}

function setStatus(msg, type='info') {
  statusBar.textContent = msg;
  statusBar.style.color = (type === 'error') ? '#900' : (type === 'ok' ? '#0037da' : '#000');
}

// Admin allowlist
const ALLOWED_EMAILS = ["demienne.moth@gmail.com"];
const ALLOWED_UIDS = ["JQaPc2051CWnV3KEFMPSt3Gvbj92"];

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

  // IMPORTANT: orderBy the same field that we filter by -> no composite index needed
  // - Current items: expiresAt >= now, ordered by nearest expiry first (asc)
  // - Expired items:  expiresAt <  now, ordered by most recently expired first (desc)
  const q = showExpired
    ? query(posts, where('expiresAt', '<', nowTs), orderBy('expiresAt', 'desc'), limit(300))
    : query(posts, where('expiresAt', '>=', nowTs), orderBy('expiresAt', 'asc'), limit(300));

  unsub = onSnapshot(q, (snap) => {
    tbody.innerHTML = '';
    let count = 0;
    snap.forEach((docSnap) => {
      count++;
      const d = docSnap.data();
      const tr = document.createElement('tr');
      const created = d.createdAt?.toDate?.() || new Date();
      const expires = d.expiresAt?.toDate?.() || new Date(created.getTime()+30*60000);
      tr.innerHTML = `
        <td>${created.toLocaleString()}</td>
        <td>${expires.toLocaleString()}</td>
        <td>${(d.nick||'')}</td>
        <td style="max-width:520px; white-space:pre-wrap;">${(d.text||'').replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]))}</td>
        <td><button class="btn95" data-id="${docSnap.id}">Del</button></td>
      `;
      tr.querySelector('button').addEventListener('click', async () => {
        const ok = confirm('Delete this record?');
        if (!ok) return;
        try {
          await deleteDoc(doc(db, 'broadcast', docSnap.id));
          setStatus('Record removed.', 'ok');
        } catch (e) {
          console.error(e);
          setStatus('Operation failed.', 'error');
        }
      });
      tbody.appendChild(tr);
    });
    setStatus(count ? `Loaded ${count} records.` : 'No records.');
  }, (err) => {
    console.error(err);
    setStatus('Operation failed.', 'error');
  });
}

onAuthStateChanged(auth, (user) => {
  if (!isAdmin(user)) {
    setStatus('Access denied.', 'error');
    setTimeout(() => { window.location.href = 'admin-login.html'; }, 600);
    return;
  }
  whoEl.textContent = user.email || user.uid;
  setStatus('Signed in as ' + (user.email || user.uid) + '.');
  subscribe(!!showExpiredEl?.checked);
});

refreshBtn?.addEventListener('click', () => { setStatus('Refreshing…'); subscribe(!!showExpiredEl?.checked); });
showExpiredEl?.addEventListener('change', () => { setStatus('Updating…'); subscribe(!!showExpiredEl?.checked); });
logoutBtn?.addEventListener('click', async () => {
  try { await signOut(auth); setStatus('Signed out.'); } catch { setStatus('Operation failed.', 'error'); }
});
