// thread.js — полная отрисовка треда, формы и ответов внутри JS
import { db } from "./firebase.js";
import { doc, getDoc, collection, addDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

window.addEventListener("DOMContentLoaded", async () => {
  const threadContainer = document.getElementById("thread-container");
  const params = new URLSearchParams(window.location.search);
  const threadId = params.get("id");
  const anonId = localStorage.getItem("anon-id");

  if (!threadContainer || !threadId) {
    if (threadContainer) threadContainer.innerHTML = "<p>Тред не найден</p>";
    return;
  }

  try {
    const threadSnap = await getDoc(doc(db, "threads", threadId));
    if (!threadSnap.exists()) {
      threadContainer.innerHTML = "<p>Тред не найден</p>";
      return;
    }

    const thread = threadSnap.data();
    threadContainer.innerHTML = `
      <h2>${thread.title}</h2>
      <p>${thread.body}</p>
      <small>${thread.createdAt?.seconds ? new Date(thread.createdAt.seconds * 1000).toLocaleString() : ""}</small>

      <div class="form-box" id="reply-form" style="margin-top:20px; display:${anonId ? "block" : "none"};">
        <form>
          <textarea id="reply-input" placeholder=">напиши свой ответ..."></textarea>
          <button type="submit" id="reply-btn">Ответить</button>
        </form>
      </div>

      <div id="reply-list" style="margin-top:20px;"></div>
    `;
  } catch (err) {
    console.error("Ошибка загрузки треда:", err);
    threadContainer.innerHTML = "<p>Ошибка загрузки треда</p>";
    return;
  }

  const replyForm = document.querySelector("#reply-form form");
  const replyInput = document.querySelector("#reply-input");
  const replyList = document.querySelector("#reply-list");

  async function loadReplies() {
    if (!replyList) return;
    replyList.innerHTML = "";
    try {
      const snapshot = await getDocs(collection(db, "threads", threadId, "replies"));
      snapshot.forEach((docSnap) => {
        const reply = docSnap.data();
        const div = document.createElement("div");
        div.className = "reply-box";
        div.innerHTML = `
          <p>${reply.body}</p>
          <small>${reply.author || "анон"} — ${reply.createdAt?.seconds ? new Date(reply.createdAt.seconds * 1000).toLocaleString() : ""}</small>
        `;
        replyList.appendChild(div);
      });
    } catch (err) {
      console.error("Ошибка загрузки ответов:", err);
      replyList.innerHTML = "<p>Не удалось загрузить ответы</p>";
    }
  }

  loadReplies();

  replyForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = replyInput.value.trim();
    if (!body || !anonId) return;

    try {
      await addDoc(collection(db, "threads", threadId, "replies"), {
        body,
        author: anonId,
        createdAt: serverTimestamp()
      });
      replyInput.value = "";
      loadReplies();
    } catch (err) {
      console.error("Ошибка при добавлении ответа:", err);
      alert("Не удалось отправить ответ");
    }
  });
});