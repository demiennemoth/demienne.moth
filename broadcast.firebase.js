// broadcast.firebase.js — feed shows only NON-EXPIRED posts
// + Light anti-spam: cooldown, daily cap, honeypot, min page age, duplicate guard

import {
  collection, addDoc, serverTimestamp, Timestamp,
  query, orderBy, limit, onSnapshot, where
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { db, auth } from './firebase.js';
import { startFiltersWatcher, getFiltersOnce, applyFiltersToText } from './filters.js';

// --- DOM ---
const feed = document.getElementById('feed');
const sendBtn = document.getElementById('send');
const msgEl = document.getElementById('msg');
const nicknameEl = document.getElementById('nickname');
const ttlEl = document.getElementById('ttl');
const honeyEl = document.getElementById('website'); // honeypot (hidden)

// --- Anti-spam config ---
const COOLDOWN_MS = 5000;                // 5s between sends
const FIRST_MIN_PAGE_AGE_MS = 3000;      // first send allowed after 3s on page
const DAILY_CAP = 60;                     // per-device cap per day
const DUP_WINDOW_MS = 60 * 1000;          // don't allow identical text within 60s

// helpers
let uid = 'anon';
function now(){ return Date.now(); }
function todayKey(){
  const d = new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function lsGet(k, def){ try{ const v = localStorage.getItem(k); return v==null?def:JSON.parse(v);}catch{ return def; } }
function lsSet(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} }
function cdKey(){ return `nb_lastSend_${uid}`; }
function dupKey(){ return `nb_lastText_${uid}`; }
function cntKey(){ return `nb_cnt_${todayKey()}_${uid}`; }
function msLeft(){ const last = +(localStorage.getItem(cdKey())||0); return Math.max(0, COOLDOWN_MS - (now()-last)); }
function armCooldown(){ localStorage.setItem(cdKey(), String(now())); disableSend(msLeft()); }
function disableSend(ms){
  if (!sendBtn) return;
  sendBtn.disabled = true;
  const orig = sendBtn.textContent || 'Send';
  const tick = () => {
    const left = msLeft();
    if (left <= 0) { sendBtn.disabled = false; sendBtn.textContent = orig; return; }
    const s = Math.ceil(left/1000);
    sendBtn.textContent = `Wait ${s}s`;
    setTimeout(tick, 250);
  };
  tick();
}
// active cooldown on load
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

function escapeHtml(s){ return String(s).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m])); }

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
    html += `<div class="row95${dim}"><div class="meta">${when}<br><b>${nick}</b></div><div class="post-text">${txt}</div><div class="meta"></div></div>`;
  }
  feed.innerHTML = html || "<div class='row95'><div class='meta'></div><div class='post-text'>It’s quiet here.</div><div class='meta'></div></div>";
  feed.scrollTop = feed.scrollHeight;
}

// Realtime: ONLY non-expired posts
function subscribeFeed(){
  const nowTs = Timestamp.now();
  const q = query(postsRef, where('expiresAt','>=', nowTs), orderBy('expiresAt','asc'), limit(200));
  return onSnapshot(q, (snap) => {
    const items = []; snap.forEach(d => items.push({ id:d.id, ...d.data() }));
    renderMessages(items);
  }, (err) => console.warn('feed error', err));
}
let unsub = subscribeFeed();
setInterval(()=>{ try{ unsub && unsub(); }catch{} unsub = subscribeFeed(); }, 60*1000);

// Track uid for cooldown key
import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js').then(({onAuthStateChanged}) => {
  onAuthStateChanged(auth, (user) => {
    uid = (user && !user.isAnonymous) ? (user.uid || 'anon') : 'anon';
    const left = msLeft(); if (left>0) disableSend(left);
  });
});

// Daily counter helpers
function incDailyCount(){
  const c = Number(localStorage.getItem(cntKey()) || '0') + 1;
  localStorage.setItem(cntKey(), String(c));
  return c;
}
function getDailyCount(){
  return Number(localStorage.getItem(cntKey()) || '0');
}

// Send handler with anti-spam
sendBtn?.addEventListener('click', async () => {
  // honeypot: if filled — block
  if (honeyEl && honeyEl.value && honeyEl.value.trim() !== '') { toast('Blocked (bot detected).', 'error'); return; }

  // cool-down
  if (msLeft() > 0) { toast('Not so fast — wait a few seconds.', 'error'); return; }

  // first message must be after a tiny dwell time
  const firstGateKey = `nb_first_ok_${uid}`;
  if (!localStorage.getItem(firstGateKey)) {
    const born = Number(document.body.getAttribute('data-page-born') || Date.now());
    if (now() - born < FIRST_MIN_PAGE_AGE_MS) {
      toast('One sec…', 'error'); return;
    }
    localStorage.setItem(firstGateKey, '1');
  }

  // daily per-device cap
  if (getDailyCount() >= DAILY_CAP) { toast('Daily limit reached. Try tomorrow.', 'error'); return; }

  // text sanitization
  let text = (msgEl?.value || '').trim().slice(0, 600);
  const nick = (nicknameEl?.value || 'Guest').trim().slice(0, 20);
  if (!text) return;

  // duplicate guard within 60s
  const lastPack = lsGet(dupKey(), { t:0, v:'' });
  if (lastPack && (now() - (lastPack.t||0) < DUP_WINDOW_MS) && (lastPack.v||'') === text) {
    toast('Duplicate too soon.', 'error'); return;
  }

  // Load filters and apply (client-side UX)
  const filters = await getFiltersOnce();
  const verdict = applyFiltersToText(text, filters);
  if (!verdict.ok) { toast('Message blocked by filter.', 'error'); return; }
  if (verdict.text !== text) text = verdict.text;

  // TTL for message
  const minutes = Number(ttlEl?.value || 30);
  const expires = new Date(Date.now() + Math.max(1, Math.min(1440, minutes)) * 60 * 1000);

  try {
    const by = (auth.currentUser && !auth.currentUser.isAnonymous) ? (auth.currentUser.uid || null) : null;

    await addDoc(postsRef, {
      text, nick, by,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expires)
    });

    // commit anti-spam bookkeeping
    armCooldown();
    localStorage.setItem(dupKey(), JSON.stringify({ t: now(), v: text }));
    const c = incDailyCount();

    if (msgEl) msgEl.value = '';
    toast(`Sent. (${c}/${DAILY_CAP} today)`, 'ok');
  } catch (e) {
    console.error('send error', e);
    toast('Failed to send.', 'error');
  }
});

// Enter to send
msgEl?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendBtn?.click(); }
});
