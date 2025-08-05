// main.js — версия с поддержкой анонимного ID и всех окон
import { mountForumUI } from "./forum.js";

function toggleStartMenu() {
  const menu = document.getElementById("start-menu");
  menu.classList.toggle("hidden");
}

function getAnonId() {
  let id = localStorage.getItem("anon-id");
  if (!id) {
    id = "anon" + Math.floor(Math.random() * 10000);
    localStorage.setItem("anon-id", id);
  }
  return id;
}

function generateAnon() {
  const id = "anon" + Math.floor(Math.random() * 10000);
  localStorage.setItem("anon-id", id);
  document.getElementById("anon-id").textContent = id;
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

  if (name === "readnews") {
    target.innerHTML = "<p>Здесь будет чтение новостей...</p>";
  }

  if (name === "accession") {
    const currentId = getAnonId();
    target.innerHTML = `
      <div id="anon-box">
        <p>Ваш ID: <span id="anon-id">${currentId}</span></p>
        <button onclick="generateAnon()">Сменить ID</button>
      </div>
    `;
  }
}

// Делаем функции доступными глобально для onclick в HTML
window.toggleStartMenu = toggleStartMenu;
window.openWindow = openWindow;
window.generateAnon = generateAnon;
