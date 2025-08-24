// filters.js — PATCH: sanitize empty strings in arrays so filters work correctly
// Uses CDN ESM imports
import { doc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db } from "./firebase.js";

let FILTERS = {
  action: "reject",
  bannedWords: [],
  exceptions: [],
  blockedDomains: []
};

let unsub = null;

function cleanArray(arr) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  const seen = new Set();
  for (const v of arr) {
    const s = String(v || "").trim();
    if (!s) continue;                // drop empty strings
    if (seen.has(s)) continue;       // dedupe
    seen.add(s);
    out.push(s);
  }
  return out;
}

function normalizeFilters(raw = {}) {
  return {
    action: raw.action === "mask" ? "mask" : "reject",
    bannedWords: cleanArray(raw.bannedWords),
    exceptions: cleanArray(raw.exceptions),
    blockedDomains: cleanArray(raw.blockedDomains)
  };
}

export function startFiltersWatcher() {
  try {
    const ref = doc(db, "settings", "filters");
    unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) FILTERS = normalizeFilters(snap.data());
    }, (err) => console.warn("filters watcher error", err));
  } catch (e) {
    console.warn("startFiltersWatcher error", e);
  }
}

export function stopFiltersWatcher() { if (unsub) unsub(); }

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

// --- Text normalization and apply functions ---
export function normalizeText(s) {
  if (!s) return "";
  return String(s)
    .toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function extractDomains(original) {
  const urls = original.match(/\bhttps?:\/\/[^\s]+/gi) || [];
  return urls.map(u => {
    try {
      const host = new URL(u).hostname.toLowerCase();
      const parts = host.split(".");
      return parts.slice(-2).join(".");
    } catch { return null; }
  }).filter(Boolean);
}

export function applyFiltersToText(original, filters = FILTERS) {
  const norm = normalizeText(original);

  if (filters.exceptions.some(ex => norm.includes(normalizeText(ex)))) {
    return { ok: true, text: original, reason: null };
  }

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

  const hit = filters.bannedWords.find(w => {
    const nw = normalizeText(w);
    return nw && norm.includes(nw);
  });

  if (hit !== undefined) {
    if (filters.action === "mask") {
      const re = new RegExp(escapeRegExp(hit), "gi");
      return { ok: true, text: original.replace(re, "•".repeat(String(hit).length)), reason: "masked" };
    }
    return { ok: false, text: original, reason: "banned-word" };
  }

  return { ok: true, text: original, reason: null };
}
