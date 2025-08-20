// broadcast.firebase.js — FIXED to match index.html (ids + realtime display)
// Collection: "broadcast" (kept as in your sender).
// Requires: firebase.js exports { db, auth }, filters.js exports startFiltersWatcher/getFiltersOnce/applyFiltersToText

import { collection, addDoc, serverTimestamp, Timestamp, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db, auth } from "./firebase.js";
import { startFiltersWatcher, getFiltersOnce, applyFiltersToText } from "./filters.js";

// References
const postsRef = collection(db, "broadcast");

// DOM elements (match index.html)
const sendBtn = document.getElementById("send");
const msgEl = document.getElementById("msg");
const nicknameEl = document.getElementById("nickname");
const ttlEl = document.getElementById("ttl");
const feed = document.getElementById("feed");
const left = document.getElementById("left");

// Start watching filters from Firestore
startFiltersWatcher();

// Helper: next 06:00 Europe/Amsterdam cutoff
function nextSixAMEuropeAmsterdam(now = new Date()) {
  const d = new Date(now);
  const next = new Date(d);
  next.setHours(6, 0, 0, 0);
  if (d >= next) next.setDate(next.getDate() + 1);
  return next;
}

function fmtMs(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(ss).padStart(2,"0")}`;
}

function updateLeft() {
  if (!left) return;
  const ms = nextSixAMEuropeAmsterdam().getTime() - Date.now();
  left.textContent = fmtMs(ms);
}
updateLeft();
setInterval(updateLeft, 1000);

// Render feed
function renderMessages(items) {
  if (!feed) return;
  const now = Date.now();
  let html = "";
  for (const it of items) {
    const createdAt = it.createdAt?.toDate ? it.createdAt.toDate() : (it.createdAt instanceof Date ? it.createdAt : null);
    const expiresAt = it.expiresAt?.toDate ? it.expiresAt.toDate() : (it.expiresAt instanceof Date ? it.expiresAt : null);
    if (expiresAt && expiresAt.getTime() <= now) continue; // hide expired
    const ageMin = createdAt ? Math.floor((now - createdAt.getTime()) / 60000) : 0;
    const dim = ageMin >= 10 ? " dim" : "";
    const when = createdAt ? createdAt.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}) : "--:--";
    const nick = (it.nick || "Guest").slice(0, 20);
    const txt = (it.text || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    html += `
      <div class="row95${dim}">
        <div class="meta">${when}<br><b>${nick}</b></div>
        <div class="post-text">${txt}</div>
        <div class="meta"></div>
      </div>`;
  }
  feed.innerHTML = html || "<div class='row95'><div class='meta'>—</div><div>Silence before the storm.</div><div class='meta'></div></div>";
  feed.scrollTop = feed.scrollHeight;
}

// Realtime subscription (latest 100)
const q = query(postsRef, orderBy("createdAt", "desc"), limit(100));
onSnapshot(q, (snap) => {
  const items = [];
  snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
  renderMessages(items.reverse()); // oldest → newest
}, (err) => {
  console.error("feed error", err);
});

// Send message
sendBtn?.addEventListener("click", async () => {
  let text = (msgEl?.value || "").trim();
  const nick = (nicknameEl?.value || "Guest").trim().slice(0, 20);
  if (!text) return;

  // Filters
  const filters = await getFiltersOnce();
  const check = applyFiltersToText(text, filters);
  if (!check.ok && filters.action !== "mask") {
    console.warn("blocked by filter:", check.reason);
    return;
  }
  text = check.ok ? check.text : text;

  // TTL & daily cutoff at 06:00
  const ttlMin = Number(ttlEl?.value || 30);
  const now = new Date();
  const candidate = new Date(now.getTime() + ttlMin * 60000);
  const cutoff = nextSixAMEuropeAmsterdam(now);
  const expires = candidate < cutoff ? candidate : cutoff;

  try {
    await addDoc(postsRef, {
      text,
      nick,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expires),
      by: auth?.currentUser ? (auth.currentUser.isAnonymous ? null : (auth.currentUser.uid || null)) : null
    });
    if (msgEl) msgEl.value = "";
  } catch (err) {
    console.error("send error", err);
  }
});

// Enter to send
msgEl?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendBtn?.click();
  }
});
