// utils.js — tiny helpers used across the app
export function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
export function escapeAttr(str = "") {
  return escapeHtml(str).replaceAll("\n", " ");
}
