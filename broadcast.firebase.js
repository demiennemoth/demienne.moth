// broadcast.firebase.js
import { db, auth } from './firebase.js';
import {
  collection, addDoc, serverTimestamp, onSnapshot,
  query, orderBy, where, Timestamp, doc, deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const feedEl = document.getElementById('feed');
const nicknameEl = document.getElementById('nickname');
const ttlEl = document.getElementById('ttl');
const msgEl = document.getElementById('msg');
const sendBtn = document.getElementById('send');
const leftEl = document.getElementById('left');
const sessionLabelEl = document.getElementById('sessionLabel');

const postsRef = collection(db, 'broadcast');

function nextSixAMEuropeAmsterdam(fromDate = new Date()) {
  const tz = 'Europe/Amsterdam';
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  const parts = Object.fromEntries(fmt.formatToParts(fromDate).map(p => [p.type, p.value]));
  const y = Number(parts.year), m = Number(parts.month) - 1, d = Number(parts.day);
  const h = Number(parts.hour), min = Number(parts.minute), s = Number(parts.second);
  const local = new Date(Date.UTC(y, m, d, h, min, s));
  const six = new Date(Date.UTC(y, m, d, 6, 0, 0));
  const target = local >= six ? new Date(Date.UTC(y, m, d + 1, 6, 0, 0)) : six;
  return target;
}

function msToHMM(ms) {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return (h > 0 ? h + 'ч ' : '') + m + 'м';
}

function escapeHtml(s = '') {
  return s.replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#039;');
}

function renderRow(docSnap) {
  const d = docSnap.data();
  const row = document.createElement('div');
  row.className = 'row95';
  const created = d.createdAt?.toDate?.() || new Date();
  const expires = d.expiresAt?.toDate?.() || new Date(created.getTime() + 30*60000);
  const now = new Date();
  const ageMin = (now - created)/60000;
  if (ageMin >= 10 && ageMin < 30) row.classList.add('dim');

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.innerHTML = `<div><b>${escapeHtml(d.nick || 'Гость')}</b></div>
    <div class="muted">создано: ${created.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
    <div class="muted">исчезнет: ${expires.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>`;

  const text = document.createElement('div');
  text.className = 'post-text';
  text.innerHTML = escapeHtml(d.text || '');

  const actions = document.createElement('div');
  if (window.__ADMIN__) {
    const del = document.createElement('button');
    del.className = 'btn95 delbtn';
    del.textContent = 'Del';
    del.addEventListener('click', async () => {
      if (confirm('Удалить сообщение?')) {
        try {
          await deleteDoc(doc(db, 'broadcast', docSnap.id));
        } catch (e) {
          alert('Не удалось удалить: ' + e.message);
        }
      }
    });
    actions.appendChild(del);
  }

  row.append(meta, text, actions);
  return row;
}

let unsub = null;
function subscribeFeed() {
  if (unsub) unsub();
  const nowTs = Timestamp.now();
  const q = query(
    postsRef,
    where('expiresAt', '>', nowTs),
    orderBy('expiresAt', 'asc')
  );
  unsub = onSnapshot(q, (snap) => {
    feedEl.innerHTML = '';
    snap.forEach((doc) => feedEl.appendChild(renderRow(doc)));
    if (!snap.size) {
      const empty = document.createElement('div');
      empty.style.padding = '8px';
      empty.style.color = '#000';
      empty.textContent = 'Пусто. Ночь ждёт первый шёпот.';
      feedEl.appendChild(empty);
    }
  });
}

sendBtn?.addEventListener('click', async () => {
  const text = (msgEl.value || '').trim();
  const nick = (nicknameEl?.value || 'Гость').trim().slice(0,20);
  if (!text) return;
  if (text.length > 600) {
    alert('Слишком длинно (макс 600).');
    return;
  }
  const ttlMin = Number(ttlEl?.value || 30);
  const now = new Date();
  const candidate = new Date(now.getTime() + ttlMin*60000);
  const cutoff = nextSixAMEuropeAmsterdam(now);
  const expires = candidate < cutoff ? candidate : cutoff;

  try {
    await addDoc(postsRef, {
      text,
      nick,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expires),
      by: auth.currentUser ? (auth.currentUser.isAnonymous ? null : (auth.currentUser.uid || null)) : null
    });
    msgEl.value = '';
  } catch (e) {
    alert('Ошибка отправки: ' + e.message);
  }
});

function tick() {
  const now = new Date();
  const cutoff = nextSixAMEuropeAmsterdam(now);
  const left = cutoff - now;
  if (leftEl) leftEl.textContent = msToHMM(left);
  if (sessionLabelEl) {
    const s = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Amsterdam', hour:'2-digit', minute:'2-digit' }).format(now);
    sessionLabelEl.textContent = s;
  }
  if (left <= 0) subscribeFeed();
}
setInterval(tick, 1000);
tick();
subscribeFeed();

export async function deletePostById(id) {
  await deleteDoc(doc(db, 'broadcast', id));
}
window.BroadcastAPI = { deletePostById };
