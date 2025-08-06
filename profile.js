import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

window.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("profile-root");
  if (!container) return;

  const anonId = localStorage.getItem("anon-id");

  if (!anonId) {
    container.innerHTML = "<p>Ты не авторизован</p>";
    return;
  }

  container.innerHTML = `
    <div class="profile-page">
      <div class="profile-left">
        <div class="avatar"></div>
        <button id="reset-id">Сменить ID</button>
      </div>
      <div class="profile-right">
        <h2>Твой ID: ${anonId}</h2>
        <div class="tabs">
          <a href="#" data-tab="threads">Мои треды</a>
          <a href="#" data-tab="bookmarks">Закладки</a>
          <a href="#" data-tab="diary">Дневник</a>
        </div>
        <div class="tab-content" id="tab-content">Выбери вкладку</div>
      </div>
    </div>
  `;

  const resetBtn = container.querySelector("#reset-id");
  const tabContent = container.querySelector("#tab-content");

  resetBtn.addEventListener("click", () => {
    const newId = "anon" + Math.floor(Math.random() * 10000);
    localStorage.setItem("anon-id", newId);
    location.reload();
  });

  container.querySelectorAll(".tabs a").forEach(tab => {
    tab.addEventListener("click", async (e) => {
      e.preventDefault();
      const type = tab.dataset.tab;

      if (type === "threads") {
        tabContent.innerHTML = "<p>Загрузка...</p>";
        try {
          const querySnapshot = await getDocs(collection(db, "threads"));
          const myThreads = [];
          querySnapshot.forEach(doc => {
            const t = doc.data();
            if (t.author === anonId) {
              myThreads.push({ id: doc.id, ...t });
            }
          });

          if (myThreads.length === 0) {
            tabContent.innerHTML = "<p>У тебя пока нет тредов</p>";
            return;
          }

          tabContent.innerHTML = myThreads.map(t => `
            <div>
              <a href="thread.html?id=${t.id}">${t.title}</a><br>
              <small>${new Date(t.createdAt?.seconds * 1000).toLocaleString()}</small>
            </div>
          `).join("<hr>");
        } catch (err) {
          console.error(err);
          tabContent.innerHTML = "<p>Ошибка при загрузке тредов</p>";
        }
      }

      if (type === "bookmarks") tabContent.textContent = "Здесь будут твои закладки...";
      if (type === "diary") tabContent.textContent = "Здесь будет твой дневник...";
    });
  });
});