// profile.js — новый UI профиля
import { auth, db } from "./firebase.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

window.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("profile-root");
  if (!container) return;

  container.innerHTML = `
    <div class="profile-page">
      <div class="profile-left">
        <div class="avatar"></div>
        <button id="logout-btn">Выйти</button>
      </div>
      <div class="profile-right">
        <h2 id="profile-nickname">Загрузка...</h2>
        <div class="tabs">
          <a href="#" data-tab="threads">Мои треды</a>
          <a href="#" data-tab="bookmarks">Закладки</a>
          <a href="#" data-tab="diary">Дневник</a>
        </div>
        <div class="tab-content" id="tab-content">Выбери вкладку</div>
      </div>
    </div>
  `;

  const logoutBtn = container.querySelector("#logout-btn");
  const tabContent = container.querySelector("#tab-content");

  logoutBtn.addEventListener("click", () => signOut(auth));

  container.querySelectorAll(".tabs a").forEach(tab => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      const type = tab.dataset.tab;
      if (type === "threads") tabContent.textContent = "Здесь будут твои треды...";
      if (type === "bookmarks") tabContent.textContent = "Здесь будут твои закладки...";
      if (type === "diary") tabContent.textContent = "Здесь будет твой дневник...";
    });
  });

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        container.querySelector("#profile-nickname").textContent = snap.data().nickname;
      }
    } else {
      container.innerHTML = "<p>Ты не авторизован</p>";
    }
  });
});
