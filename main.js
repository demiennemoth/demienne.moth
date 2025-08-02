
// main.js — версия как модуль
import { mountForumUI } from "./forum.js";

function toggleStartMenu() {
  const menu = document.getElementById("start-menu");
  menu.classList.toggle("hidden");
}

export function openWindow(name) {
  if (name === "profile") {
    window.location.href = "profile.html";
    return;
  }

  const container = document.getElementById("window-container");
  const win = document.createElement("div");
  win.className = "window";

  const contentId = `window-content-${name}`;
  win.innerHTML = `
    <div class="window-header">
      <span>${name.toUpperCase()}</span>
      <div><button onclick="this.closest('.window').remove()">×</button></div>
    </div>
    <div class="window-content" id="${contentId}">Loading...</div>
  `;
  container.appendChild(win);

  if (name === "forum") {
    const target = document.getElementById(contentId);
    mountForumUI(target);
  }
}

// Делаем функции доступными глобально для onclick в HTML
window.toggleStartMenu = toggleStartMenu;
window.openWindow = openWindow;
