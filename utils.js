// utils.js — общие утилиты без изменения логики проекта
// НИЧЕГО НЕ ЛОМАЕМ: только выносим повторы и даём безопасные хелперы.

// Возвращает текущий anon-id из localStorage (или null, если его нет).
export function getAnonId() {
  try { return localStorage.getItem("anon-id"); } catch { return null; }
}

// Устанавливает новый anon-id.
export function setAnonId(id) {
  try { localStorage.setItem("anon-id", String(id)); } catch {}
}

// Служебные экранирующие функции для безопасной вставки HTML/атрибутов.
export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}
export function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;');
}
