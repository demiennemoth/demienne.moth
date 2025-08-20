// broadcast.firebase.js (patched) — with word filter hook
// Save as: broadcast.firebase.js
// If you prefer a .txt for transfer, this same content is in broadcast.firebase.js.txt

import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db, auth } from "./firebase.js";
import { startFiltersWatcher, getFiltersOnce, applyFiltersToText } from "./filters.js";

// References
const postsRef = collection(db, "broadcast");

// Expect these elements exist in your DOM
const sendBtn = document.getElementById("sendBtn");
const msgEl = document.getElementById("messageInput");
const nicknameEl = document.getElementById("nicknameInput");
const ttlEl = document.getElementById("ttlInput");

// Start watching filters from Firestore
startFiltersWatcher();

// Helper: next 06:00 Europe/Amsterdam cutoff
function nextSixAMEuropeAmsterdam(now = new Date()) {
  // We don't have luxon here; do a simple calc assuming client is in Europe/Amsterdam local time.
  // If your site runs in another tz, replace with a serverTimestamp-based cutoff on the backend later.
  const d = new Date(now);
  const six = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 6, 0, 0, 0);
  if (d >= six) {
    // today already past 06:00 -> tomorrow 06:00
    six.setDate(six.getDate() + 1);
  }
  return six;
}

sendBtn?.addEventListener("click", async () => {
  let text = (msgEl?.value || "").trim();
  const nick = (nicknameEl?.value || "Guest").trim().slice(0, 20);
  if (!text) return;
  if (text.length > 600) return;

  // --- WORD FILTER (client-side MVP) ---
  try {
    await getFiltersOnce();                 // ensure we have latest filters once
    const check = applyFiltersToText(text); // run text through filters
    if (!check.ok) {
      // Replace with your Win95 toast if you have one
      alert("Message blocked by filter");
      return;
    }
    text = check.text; // for action = 'mask' this is already masked
  } catch (e) {
    console.warn("Filter error:", e);
    // fail-open or fail-closed? Safer to fail-closed:
    alert("Message blocked (filter error)");
    return;
  }

  // --- TTL & daily cutoff at 06:00 ---
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
