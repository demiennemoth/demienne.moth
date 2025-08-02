// forum.js — управление форумом (только работа с тредами)
import { db, auth } from "./firebase.js";
import { 
  collection, addDoc, getDocs, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

window.addEventListener("DOMContentLoaded", () => {
  const forumContainer = document.getElementById("forum-container");
  const threadTitleInput = document.getElementById("thread-title");
  const threadBodyInput = document.getElementById("thread-body");
  const categoryInput = document.getElementById("thread-category");
  const postThreadBtn = document.getElementById("post-thread");
  const threadList = document.getElementById("thread-list");

  let currentUser = null;

  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      console.log("Пользователь авторизован:", user.uid);
      forumContainer.style.display = "block";
      loadThreads();
    } else {
      console.warn("Не авторизован — войди через окно Profile.");
      forumContainer.style.display = "none";
    }
  });

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
    const category = categoryInput.value;

    if (!title || !body || !category) {
      alert("Все поля обязательны");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "threads"), {
        title,
        body,
        category,
        createdAt: serverTimestamp(),
        userId: currentUser?.uid || ""
      });
      console.log("Тред успешно создан:", docRef.id);

      threadTitleInput.value = "";
      threadBodyInput.value = "";
      categoryInput.value = "";

      setTimeout(() => loadThreads(), 600);
    } catch (err) {
      console.error("Ошибка при добавлении треда:", err);
      alert("Не удалось создать тред");
    }
  });
});
