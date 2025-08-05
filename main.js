// main.js — версия с поддержкой авторизации
import { mountForumUI } from "./forum.js";
import { auth } from "./firebase.js";

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

  if (name === "accession") {
    target.innerHTML = `
      <form id="login-form">
        <label>Логин:<br><input type="text" id="login"></label><br><br>
        <label>Пароль:<br><input type="password" id="password"></label><br><br>
        <button type="submit">Войти</button>
      </form>
      <div id="login-message"></div>
    `;

    import("https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js").then(({ signInWithEmailAndPassword }) => {
      const form = document.getElementById("login-form");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login").value;
        const pass = document.getElementById("password").value;
        try {
          await signInWithEmailAndPassword(auth, email, pass);
          document.getElementById("login-message").textContent = "✅ Успешный вход";
        } catch (err) {
          document.getElementById("login-message").textContent = "❌ Ошибка: " + err.message;
        }
      });
    });
  }
}

// Делаем функции доступными глобально для onclick в HTML
window.toggleStartMenu = toggleStartMenu;
window.openWindow = openWindow;
