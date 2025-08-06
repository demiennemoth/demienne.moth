// forum.js — теперь с поддержкой anon-id
import { db } from "./firebase.js";
import { collection, addDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

export function mountForumUI(container) {
  container.innerHTML = `
    <div id="forum-container">
      <h2>Форум</h2>
      <form id="thread-form">
        <input type="text" id="thread-title" placeholder="Заголовок"><br>
        <textarea id="thread-body" placeholder="Текст"></textarea><br>
        <input type="text" id="thread-category" placeholder="Категория"><br>
        <button id="post-thread">Создать тред</button>
      </form>
      <div id="thread-list"></div>
    </div>
  `;

  const threadTitleInput = container.querySelector("#thread-title");
  const threadBodyInput = container.querySelector("#thread-body");
  const categoryInput = container.querySelector("#thread-category");
  const postThreadBtn = container.querySelector("#post-thread");
  const threadList = container.querySelector("#thread-list");

  async function loadThreads() {
    threadList.innerHTML = "";
    try {
      const querySnapshot = await getDocs(collection(db, "threads"));
      const threadsByCategory = {};

      querySnapshot.forEach((docSnap) => {
        const thread = docSnap.data();
        const threadId = docSnap.id;
        const category = thread.category || "Без категории";

        if (!threadsByCategory[category]) {
          threadsByCategory[category] = [];
        }
        threadsByCategory[category].push({ id: threadId, ...thread });
      });

      for (const category in threadsByCategory) {
        const catBlock = document.createElement("div");
        catBlock.className = "category-block";
        catBlock.innerHTML = `<h2 style="color: orange">${category.toUpperCase()}</h2>`;

        threadsByCategory[category].forEach(thread => {
          const div = document.createElement("div");
          div.className = "thread-box";
          div.innerHTML = `
            <div class="thread-title">
              <a href="thread.html?id=${thread.id}">${thread.title}</a>
            </div>
            <div class="thread-id">No.${thread.id.slice(0, 6)}</div>
            <small>${thread.createdAt?.seconds ? new Date(thread.createdAt.seconds * 1000).toLocaleString() : ""}</small>
          `;
          catBlock.appendChild(div);
        });

        threadList.appendChild(catBlock);
      }
    } catch (err) {
      console.error("Ошибка при загрузке тредов:", err);
      alert("Не удалось загрузить треды");
    }
  }

  postThreadBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const title = threadTitleInput.value.trim();
    const body = threadBodyInput.value.trim();
    const category = categoryInput.value.trim();
    const anonId = localStorage.getItem("anon-id");

    if (!title || !body || !category) {
      alert("Все поля обязательны");
      return;
    }

    if (!anonId) {
      alert("Сначала получи анонимный ID в окне Accession");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "threads"), {
        title,
        body,
        category,
        author: anonId,
        createdAt: serverTimestamp()
      });

      threadTitleInput.value = "";
      threadBodyInput.value = "";
      categoryInput.value = "";
      setTimeout(() => loadThreads(), 600);
    } catch (err) {
      console.error("Ошибка при добавлении треда:", err);
      alert("Не удалось создать тред");
    }
  });

  loadThreads();
}
