// filters.js — Firestore-driven word filter (client-side MVP)
// Save as: filters.js
// If you prefer a .txt for transfer, this same content is in filters.js.txt

import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "./firebase.js";

let FILTERS = {
  action: "reject",            // 'reject' | 'mask' | 'shadow' (shadow is noop on client MVP)
  bannedWords: [],             // array of strings
  exceptions: [],              // array of strings (whitelist)
  blockedDomains: []           // array of strings (domains)
};

let unsubFilters = null;

// Start realtime watcher so changes apply without reload
export function startFiltersWatcher() {
  try {
    const ref = doc(db, "settings", "filters");
    unsubFilters = onSnapshot(ref, (snap) => {
      if (snap.exists()) FILTERS = normalizeFilters(snap.data());
    }, (err) => console.warn("filters watcher error", err));
  } catch (e) {
    console.warn("startFiltersWatcher error", e);
  }
}

export function stopFiltersWatcher() {
  if (unsubFilters) unsubFilters();
}

// One-off fetch (useful before first send)
export async function getFiltersOnce() {
  try {
    const snap = await getDoc(doc(db, "settings", "filters"));
    if (snap.exists()) FILTERS = normalizeFilters(snap.data());
    return FILTERS;
  } catch (e) {
    console.warn("getFiltersOnce error", e);
    return FILTERS;
  }
}

function normalizeFilters(raw = {}) {
  return {
    action: raw.action || "reject",
    bannedWords: Array.isArray(raw.bannedWords) ? raw.bannedWords : [],
    exceptions: Array.isArray(raw.exceptions) ? raw.exceptions : [],
    blockedDomains: Array.isArray(raw.blockedDomains) ? raw.blockedDomains : []
  };
}

// --- Text normalization (lightweight) ---
export function normalizeText(s) {
  if (!s) return "";
  return String(s)
    .toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[\u200B-\u200D\uFEFF]/g, "")             // zero-width
    .replace(/\s+/g, " ")                               // collapse spaces
    .trim();
}

// --- Extract bare domains from URLs in original text
function extractDomains(original) {
  const urls = original.match(/\bhttps?:\/\/[^\s]+/gi) || [];
  return urls.map(u => {
    try {
      const host = new URL(u).hostname.toLowerCase();
      const parts = host.split(".");
      return parts.slice(-2).join(".");
    } catch {
      return null;
    }
  }).filter(Boolean);
}

// Escape for RegExp from plain string
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// --- Main check ---
// Returns { ok: boolean, text: string, reason: string|null }
export function applyFiltersToText(original, filters = FILTERS) {
  const norm = normalizeText(original);

  // 1) Exceptions (whitelist) — if any present, allow
  if (filters.exceptions.some(ex => norm.includes(normalizeText(ex)))) {
    return { ok: true, text: original, reason: null };
  }

  // 2) Blocked domains
  const domains = extractDomains(original);
  if (domains.some(d => filters.blockedDomains.includes(d))) {
    if (filters.action === "mask") {
      let masked = original;
      for (const d of filters.blockedDomains) {
        const re = new RegExp(escapeRegExp(d), "gi");
        masked = masked.replace(re, "■".repeat(d.length));
      }
      return { ok: true, text: masked, reason: "blocked-domain-masked" };
    }
    return { ok: false, text: original, reason: "blocked-domain" };
  }

  // 3) Banned words (substring match on normalized text)
  const hit = filters.bannedWords.find(w => norm.includes(normalizeText(w)));
  if (hit) {
    if (filters.action === "mask") {
      // Mask only the first hit to keep it simple; can expand as needed
      const re = new RegExp(escapeRegExp(hit), "gi");
      const masked = original.replace(re, "•".repeat(hit.length));
      return { ok: true, text: masked, reason: "masked" };
    }
    return { ok: false, text: original, reason: "banned-word" };
  }

  // OK
  return { ok: true, text: original, reason: null };
}
