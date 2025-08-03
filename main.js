// main.js — версия как модуль (с добавленными новостями)
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

  const target = document.getElementById(contentId);

  if (name === "forum") {
    mountForumUI(target);
  }

  if (name === "news") {
    import("./news.js").then(module => {
      module.mountNewsUI(target);
    });
  }
}

// Делаем функции доступными глобально для onclick в HTML
window.toggleStartMenu = toggleStartMenu;
window.openWindow = openWindow;
