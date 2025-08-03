// news.js — окно новостей
import { db, auth } from "./firebase.js";
import { 
  collection, addDoc, getDocs, serverTimestamp, orderBy, query 
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

export function mountNewsUI(container) {
  container.innerHTML = `
    <div id="news-container">
      <h2>Новости сайта</h2>
      <div id="news-list"></div>
      <div id="news-form" style="margin-top:20px; display:none;">
        <input type="text" id="news-title" placeholder="Заголовок"><br>
        <textarea id="news-body" placeholder="Текст"></textarea><br>
        <button id="post-news">Опубликовать</button>
      </div>
    </div>
  `;

  const newsList = container.querySelector("#news-list");
  const newsForm = container.querySelector("#news-form");
  const postNewsBtn = container.querySelector("#post-news");
  const titleInput = container.querySelector("#news-title");
  const bodyInput = container.querySelector("#news-body");

  let currentUser = null;

  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    // Допустим, только админ может публиковать новости
    if (user && user.email === "admin@mail.com") {
      newsForm.style.display = "block";
    }
    loadNews();
  });

  async function loadNews() {
    newsList.innerHTML = "";
    const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    snapshot.forEach(docSnap => {
      const news = docSnap.data();
      const div = document.createElement("div");
      div.className = "news-item";
      div.style.margin = "15px 0";
      div.style.padding = "10px";
      div.style.border = "1px solid #333";
      div.style.background = "#1c1e1b";
      div.innerHTML = `
        <h3>${news.title}</h3>
        <p>${news.body}</p>
        <small>${news.createdAt?.seconds ? new Date(news.createdAt.seconds * 1000).toLocaleString() : ""}</small>
      `;
      newsList.appendChild(div);
    });
  }

  postNewsBtn?.addEventListener("click", async () => {
    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();
    if (!title || !body) return alert("Заполни все поля");

    try {
      await addDoc(collection(db, "news"), {
        title,
        body,
        createdAt: serverTimestamp()
      });
      titleInput.value = "";
      bodyInput.value = "";
      loadNews();
    } catch (err) {
      console.error("Ошибка публикации новости:", err);
    }
  });
}
