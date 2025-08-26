// admin.js — secure admin panel logic (ESM)
import { db, auth } from './firebase.js';
import {
  collection, query, orderBy, limit, onSnapshot, deleteDoc, doc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// ---- DOM ----
const tbody = document.getElementById('recordsTbody');
const userLabel = document.getElementById('adminUser');
const countLabel = document.getElementById('countLabel');
const reloadBtn = document.getElementById('reloadBtn');

// Status bar (Win95 vibe) with a11y
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
  document.querySelector('.panel95:last-of-type')?.appendChild(statusBar);
}

function setStatus(msg, type='info') {
  statusBar.textContent = msg;
  statusBar.style.color = (type === 'error') ? '#900' : (type === 'ok' ? '#0037da' : '#000');
}

// ---- Auth gate ----
let unsub = null;
onAuthStateChanged(auth, (user) => {
  if (!user) {
    setStatus('Auth required. Redirecting…', 'error');
    setTimeout(()=>location.href='admin-login.html', 300);
    return;
  }
  userLabel.textContent = user.email || user.uid;
  setStatus('Signed in.', 'ok');
  startFeed();
});

// ---- Feed ----
let q = null;
function startFeed(){
  if (unsub) { unsub(); unsub = null; }
  q = query(collection(db, 'broadcast'), orderBy('createdAt','desc'), limit(200));
  setStatus('Loading…');
  unsub = onSnapshot(q, (snap) => {
    tbody.innerHTML = '';
    let count = 0;
    snap.forEach((docSnap) => {
      count++;
      const d = docSnap.data();
      const tr = document.createElement('tr');

      const tdCreated = document.createElement('td');
      tdCreated.textContent = formatTS(d.createdAt);
      tr.appendChild(tdCreated);

      const tdExpires = document.createElement('td');
      tdExpires.textContent = formatTS(d.expiresAt);
      tr.appendChild(tdExpires);

      const tdNick = document.createElement('td');
      tdNick.textContent = d.nick || '';
      tr.appendChild(tdNick);

      const tdText = document.createElement('td');
      tdText.style.maxWidth = '520px';
      tdText.style.whiteSpace = 'pre-wrap';
      tdText.textContent = d.text || '';
      tr.appendChild(tdText);

      const tdActions = document.createElement('td');
      const delBtn = document.createElement('button');
      delBtn.className = 'btn95';
      delBtn.textContent = 'Del';
      delBtn.title = 'Delete message';
      delBtn.addEventListener('click', async () => {
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
      tdActions.appendChild(delBtn);
      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    });
    countLabel.textContent = String(count);
    setStatus(count ? `Loaded ${count} records.` : 'No records.');
  }, (err) => {
    console.error(err);
    setStatus('Realtime error.', 'error');
  });
}

reloadBtn?.addEventListener('click', () => startFeed());

function formatTS(ts){
  try {
    if (!ts) return '—';
    if (typeof ts.toDate === 'function') return ts.toDate().toLocaleString();
    if (typeof ts === 'number') return new Date(ts).toLocaleString();
    return String(ts);
  } catch {
    return '—';
  }
}

// Optional: expose signOut for menu
window.__nbSignOut = () => signOut(auth);
