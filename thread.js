// thread.js — форма вставляется только при наличии anon-id (никаких display: none)
import { db } from "./firebase.js";
import { doc, getDoc, collection, addDoc, getDocs, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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

    const formBlock = anonId ? `
      <div class="form-box" id="reply-form" style="margin-top:20px;">
        <form>
          <textarea id="reply-input" placeholder=">напиши свой ответ..."></textarea>
          <button type="submit" id="reply-btn">Ответить</button>
        </form>
      </div>
    ` : "";

    threadContainer.innerHTML = `
      <h2 id="thread-title">${thread.title}</h2>
      <p>${thread.body}</p>
      <small>${thread.createdAt?.seconds ? new Date(thread.createdAt.seconds * 1000).toLocaleString() : ""}</small>
      <!-- Action bar -->
      <div class="toolbar95" id="thread-actionbar" style="margin:8px 0;">
        <button class="btn95" id="btn-fav">В избранное</button>
        <button class="btn95" id="btn-readlater">Прочитать потом</button>
        <button class="btn95" id="btn-bookmark">Закладка</button>
      </div>
      ${formBlock}
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

  loadReplies(); try{ await bumpReplies(threadId);}catch(e){}

  replyForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = replyInput?.value.trim();
    if (!body || !anonId) return;

    try {
      await addDoc(collection(db, "threads", threadId, "replies"), {
        body,
        author: anonId,
        createdAt: serverTimestamp()
      });
      replyInput.value = "";
      loadReplies(); try{ await bumpReplies(threadId);}catch(e){}
    } catch (err) {
      console.error("Ошибка при добавлении ответа:", err);
      alert("Не удалось отправить ответ");
    }
  });
});


// After adding a reply, optionally bump repliesCount on parent thread (best-effort)
import { updateDoc, doc as docRef, increment } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
async function bumpReplies(threadId){
  try{
    await updateDoc(docRef(db, "threads", threadId), { repliesCount: increment(1)   // === Win95 action buttons wired to Firestore ===
  (function initThreadActions(){
    try{
      const bar = document.getElementById("thread-actionbar");
      if(!bar) return;
      const getTitle = () => {
        const el = document.getElementById("thread-title");
        return el ? el.textContent.trim() : (thread?.title || threadId || "(без названия)");
      };
      function needAnon(){
        if(!anonId){ alert("Сначала получи анонимный ID в окне Accession"); return true; }
        if(!threadId){ alert("Нет ID треда в URL"); return true; }
        return false;
      }
      document.getElementById("btn-fav")?.addEventListener("click", async ()=>{
        if(needAnon()) return;
        await setDoc(doc(db, "users", anonId, "favorites", threadId), {
          threadId, title: getTitle(), addedAt: serverTimestamp()
        }, { merge:true });
        alert("Добавлено в избранное");
      });
      document.getElementById("btn-readlater")?.addEventListener("click", async ()=>{
        if(needAnon()) return;
        await addDoc(collection(db, "users", anonId, "readlater"), {
          threadId, title: getTitle(), addedAt: serverTimestamp()
        });
        alert("Сохранено в «Прочитать потом»");
      });
      document.getElementById("btn-bookmark")?.addEventListener("click", async ()=>{
        if(needAnon()) return;
        await addDoc(collection(db, "users", anonId, "bookmarks"), {
          url: location.pathname + location.search, desc: getTitle(), addedAt: serverTimestamp()
        });
        alert("Закладка добавлена");
      });
    }catch(e){ console.warn("initThreadActions failed", e); }
  })();

});
  }catch(e){ /* ignore */ }
}
