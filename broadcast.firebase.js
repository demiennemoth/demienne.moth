// broadcast.firebase.js — feed shows only NON-EXPIRED posts
// - Query: where('expiresAt','>=', now) + orderBy('expiresAt','asc') (no composite index)
// - Render: same; placeholder: «Пока тут тихо.»
// - Cooldown/filters logic left intact

import {
  collection, addDoc, serverTimestamp, Timestamp,
  query, orderBy, limit, onSnapshot, where,
  writeBatch, doc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { db, auth } from './firebase.js';
import { startFiltersWatcher, getFiltersOnce, applyFiltersToText } from './filters.js';

// --- DOM ---
const feed = document.getElementById('feed');
const sendBtn = document.getElementById('send');
const msgEl = document.getElementById('msg');
const nicknameEl = document.getElementById('nickname');
const ttlEl = document.getElementById('ttl');

// --- Cooldown (5 seconds) ---
const COOLDOWN_MS = 5000;
let uid = 'anon';
function cooldownKey(){ return `nb_lastSend_${uid}`; }
function now(){ return Date.now(); }
function msLeft(){ const last = +(localStorage.getItem(cooldownKey())||0); return Math.max(0, COOLDOWN_MS - (now()-last)); }
function armCooldown(){
  localStorage.setItem(cooldownKey(), String(now()));
  disableSend(msLeft());
}
function disableSend(ms){
  if (!sendBtn) return;
  sendBtn.disabled = true;
  const orig = sendBtn.textContent || 'Send';
  const tick = () => {
    const left = msLeft();
    if (left <= 0) {
      sendBtn.disabled = false;
      sendBtn.textContent = orig;
      return;
    }
    const s = Math.ceil(left/1000);
    sendBtn.textContent = `Подожди ${s}с`;
    setTimeout(tick, 250);
  };
  tick();
}
setTimeout(()=>{ const left = msLeft(); if (left>0) disableSend(left); }, 0);

// --- Toasts ---
let toastTimer = null;
function toast(msg, type='info'){
  let el = document.getElementById('nb_toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'nb_toast';
    el.style.position = 'fixed';
    el.style.bottom = '16px';
    el.style.left = '50%';
    el.style.transform = 'translateX(-50%)';
    el.style.padding = '8px 12px';
    el.style.background = '#222';
    el.style.color = '#fff';
    el.style.border = '1px solid #555';
    el.style.font = '12px/1.3 monospace';
    el.style.zIndex = '9999';
    el.style.borderRadius = '6px';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.background = (type==='error') ? '#7a1b1b' : (type==='ok' ? '#0e4f0e' : '#222');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{ el.remove(); }, 2500);
}

// --- Firestore ---
const postsRef = collection(db, 'broadcast');
startFiltersWatcher();

function escapeHtml(s){ return String(s).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }

function renderMessages(items){
  if (!feed) return;
  let html = '';
  const nowMs = Date.now();
  for (const it of items) {
    const age = nowMs - (it.createdAt?.toMillis?.() || nowMs);
    const dim = age > 10*60*1000 ? ' dim' : '';
    const when = (it.createdAt?.toDate?.() || new Date()).toLocaleTimeString().slice(0,5);
    const nick = escapeHtml(it.nick || 'Guest');
    const txt = escapeHtml(it.text || '');
    html += `<div class="row95${dim}">
      <div class="meta">${when}<br><b>${nick}</b></div>
      <div class="post-text">${txt}</div>
      <div class="meta"></div>
    </div>`;
  }
  feed.innerHTML = html || "<div class='row95'><div class='meta'></div><div class='post-text'>Пока тут тихо.</div><div class='meta'></div></div>";
  feed.scrollTop = feed.scrollHeight;
}

// Realtime: ONLY non-expired posts
function subscribeFeed(){
  const nowTs = Timestamp.now();
  const q = query(
    postsRef,
    where('expiresAt','>=', nowTs),
    orderBy('expiresAt','asc'),
    limit(200)
  );
  return onSnapshot(q, (snap) => {
    const items = [];
    snap.forEach(d => items.push({ id:d.id, ...d.data() }));
    renderMessages(items);
  }, (err) => console.warn('feed error', err));
}
let unsub = subscribeFeed();
// resubscribe every minute to move the window
setInterval(()=>{ try{ unsub && unsub(); }catch{} unsub = subscribeFeed(); }, 60*1000);

// Track uid for cooldown key
import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js').then(({onAuthStateChanged}) => {
  onAuthStateChanged(auth, (user) => {
    uid = (user && !user.isAnonymous) ? (user.uid || 'anon') : 'anon';
    const left = msLeft();
    if (left>0) disableSend(left);
  });
});

// Send handler with cooldown
sendBtn?.addEventListener('click', async () => {
  if (msLeft() > 0) { toast('Не так быстро, дай 5 секунд отдышаться.', 'error'); return; }

  let text = (msgEl?.value || '').trim();
  const nick = (nicknameEl?.value || 'Guest').trim().slice(0, 20);
  if (!text) return;

  // Load filters and apply (client-side UX)
  const filters = await getFiltersOnce();
  const verdict = applyFiltersToText(text, filters);
  if (!verdict.ok) {
    toast('Сообщение заблокировано фильтром.', 'error');
    return;
  }
  if (verdict.text !== text) {
    text = verdict.text;
  }

  // TTL for message
  const minutes = Number(ttlEl?.value || 30);
  const expires = new Date(Date.now() + Math.max(1, Math.min(1440, minutes)) * 60 * 1000);

  // Write batch: add post + update users/{uid}.lastWrite
  try {
    const batch = writeBatch(db);
    const by = (auth.currentUser && !auth.currentUser.isAnonymous) ? (auth.currentUser.uid || null) : null;

    const post = {
      text,
      nick,
      by,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expires)
    };
    const tempDoc = doc(collection(db, 'broadcast')); // precreate id
    batch.set(tempDoc, post);

    if (by) {
      const uref = doc(db, 'users', by);
      batch.set(uref, { lastWrite: serverTimestamp() }, { merge: true });
    }

    await batch.commit();
    armCooldown();
    if (msgEl) msgEl.value = '';
    toast('Отправлено.', 'ok');
  } catch (e) {
    console.error('send error', e);
    toast('Не получилось отправить.', 'error');
  }
});

// Enter to send
msgEl?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendBtn?.click();
  }
});
