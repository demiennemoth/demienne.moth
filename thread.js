// thread.js — работа с отдельным тредом
import { db, auth } from "./firebase.js";
import { 
  doc, getDoc, collection, addDoc, getDocs, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

window.addEventListener("DOMContentLoaded", async () => {
  const threadContainer = document.getElementById("thread-container");
  const replyList = document.getElementById("reply-list");
  const replyForm = document.getElementById("reply-form");
  const replyInput = document.getElementById("reply-input");

  let currentUser = null;

  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      replyForm.style.display = "block";
    } else {
      currentUser = null;
      replyForm.style.display = "none";
    }
  });

  const params = new URLSearchParams(window.location.search);
  const threadId = params.get("id");

  if (!threadId) {
    threadContainer.innerHTML = "<p>Тред не найден</p>";
    return;
  }

  // Загружаем тред
  try {
    const threadSnap = await getDoc(doc(db, "threads", threadId));
    if (threadSnap.exists()) {
      const thread = threadSnap.data();
      threadContainer.innerHTML = `
        <h2>${thread.title}</h2>
        <p>${thread.body}</p>
        <small>${thread.createdAt?.seconds ? new Date(thread.createdAt.seconds * 1000).toLocaleString() : ""}</small>
      `;
    } else {
      threadContainer.innerHTML = "<p>Тред не найден</p>";
      return;
    }
  } catch (err) {
    console.error("Ошибка загрузки треда:", err);
    threadContainer.innerHTML = "<p>Ошибка загрузки треда</p>";
    return;
  }

  // Загружаем ответы
  async function loadReplies() {
    replyList.innerHTML = "";
    try {
      const snapshot = await getDocs(collection(db, "threads", threadId, "replies"));
      snapshot.forEach((docSnap) => {
        const reply = docSnap.data();
        const div = document.createElement("div");
        div.className = "reply-box";
        div.innerHTML = `
          <p>${reply.body}</p>
          <small>${reply.createdAt?.seconds ? new Date(reply.createdAt.seconds * 1000).toLocaleString() : ""}</small>
        `;
        replyList.appendChild(div);
      });
    } catch (err) {
      console.error("Ошибка загрузки ответов:", err);
      replyList.innerHTML = "<p>Не удалось загрузить ответы</p>";
    }
  }

  loadReplies();

  // Отправка ответа
  replyForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = replyInput.value.trim();
    if (!body) return;

    try {
      await addDoc(collection(db, "threads", threadId, "replies"), {
        body,
        createdAt: serverTimestamp(),
        userId: currentUser?.uid || ""
      });
      replyInput.value = "";
      loadReplies();
    } catch (err) {
      console.error("Ошибка при добавлении ответа:", err);
      alert("Не удалось отправить ответ");
    }
  });
});
