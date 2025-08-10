// thread.js — fixed syntax + replies + admin actions (edit/delete thread)
import { db, isAdmin } from "./firebase.js";
import {
  doc, getDoc, collection, addDoc, getDocs,
  serverTimestamp, updateDoc, increment, deleteDoc, setDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

window.addEventListener("DOMContentLoaded", async () => {
  const threadContainer = document.getElementById("thread-container");
  const params = new URLSearchParams(window.location.search);
  const threadId = params.get("id");
  const anonId = localStorage.getItem("anon-id");

  if (!threadContainer || !threadId) {
    if (threadContainer) threadContainer.innerHTML = "<p>Тред не найден</p>";
    return;
  }

  let thread;
  try {
    const threadSnap = await getDoc(doc(db, "threads", threadId));
    if (!threadSnap.exists()) {
      threadContainer.innerHTML = "<p>Тред не найден</p>";
      return;
    }
    thread = threadSnap.data();

    threadContainer.innerHTML = `
      <h2 id="thread-title">${escapeHtml(thread.title || "(без названия)")}</h2>
      <p>${formatBody(thread.body)}</p>
      <small>${thread.createdAt?.seconds ? new Date(thread.createdAt.seconds * 1000).toLocaleString() : ""}</small>
      <div class="toolbar95" id="thread-actionbar" style="margin:8px 0;">
        <button class="btn95" id="btn-fav">В избранное</button>
        <button class="btn95" id="btn-readlater">Прочитать потом</button>
        <button class="btn95" id="btn-bookmark">Закладка</button>
        ${isAdmin() ? `<button class="btn95" id="btn-edit-thread">Редактировать</button>
        <button class="btn95" id="btn-del-thread">Удалить</button>` : ""}
      </div>
      ${anonId ? `
      <div class="form-box" id="reply-form" style="margin-top:20px;">
        <form>
          <textarea class="input95" id="reply-input" placeholder=">напиши свой ответ..." required></textarea>
          <button type="submit" id="reply-btn">Ответить</button>
        </form>
      </div>` : `<div class="form-box">Чтобы ответить, получи анонимный ID (окно Accession).</div>`}
      <div id="reply-list" style="margin-top:20px;"></div>
    `;
  } catch (err) {
    console.error("Ошибка загрузки треда:", err);
    threadContainer.innerHTML = "<p>Ошибка загрузки треда</p>";
    return;
  }

  // Wire action bar (fav / read later / bookmark)
  initThreadActions({ threadId, thread });

  const replyForm = document.querySelector("#reply-form form");
  const replyInput = document.querySelector("#reply-input");
  const replyList = document.querySelector("#reply-list");

  async function loadReplies() {
    if (!replyList) return;
    replyList.innerHTML = "";
    try {
      const snapshot = await getDocs(collection(db, "threads", threadId, "replies"));
      let idx = 1;
      snapshot.forEach((docSnap) => {
        const reply = docSnap.data();
        const rId = docSnap.id;
        const div = document.createElement("div");
        div.className = "post";
        div.id = "post" + idx;
        div.innerHTML = `
          <div class="post-header">
            <span class="post-number" title="Ссылка на пост" onclick="navigator.clipboard.writeText(location.href+'#post${idx}')">№${idx}</span>
            <span>${escapeHtml(reply.author || "анон")}</span>
            <span>${reply.createdAt?.seconds ? new Date(reply.createdAt.seconds * 1000).toLocaleString() : ""}</span>
            ${isAdmin() ? `<button class="btn95" data-del="${rId}">Удалить</button>` : ""}
          </div>
          <div class="post-body">${formatBody(reply.body)}</div>
        `;
        replyList.appendChild(div);
        idx++;
      });

      if (isAdmin()) {
        replyList.querySelectorAll("button[data-del]").forEach(btn => {
          btn.addEventListener("click", async () => {
            if (!confirm("Удалить ответ?")) return;
            await deleteDoc(doc(db, "threads", threadId, "replies", btn.dataset.del));
            await loadReplies();
          });
        });
      }
    } catch (err) {
      console.error("Ошибка загрузки ответов:", err);
      replyList.innerHTML = "<p>Не удалось загрузить ответы</p>";
    }
  }

  loadReplies().then(()=>bumpRepliesCount(threadId, 0)).catch(()=>{});

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
      await loadReplies();
      await bumpRepliesCount(threadId, 1);
    } catch (err) {
      console.error("Ошибка при добавлении ответа:", err);
      alert("Не удалось отправить ответ");
    }
  });

  if (isAdmin()) {
    document.getElementById("btn-del-thread")?.addEventListener("click", async ()=>{
      if (!confirm("Удалить весь тред полностью?")) return;
      // naive: delete only thread doc (replies remain orphaned unless you add callable function); fine for quick admin.
      await deleteDoc(doc(db, "threads", threadId));
      alert("Тред удалён");
      location.href = "index.html";
    });
    document.getElementById("btn-edit-thread")?.addEventListener("click", async ()=>{
      const newTitle = prompt("Новый заголовок:", thread.title || "");
      if (newTitle == null) return;
      const newBody = prompt("Новый текст:", thread.body || "");
      if (newBody == null) return;
      await updateDoc(doc(db, "threads", threadId), { title: newTitle, body: newBody });
      alert("Сохранено");
      location.reload();
    });
  }
});

async function bumpRepliesCount(threadId, delta){
  try{
    if (!delta) return;
    await updateDoc(doc(db, "threads", threadId), { repliesCount: increment(delta) });
  }catch(e){ /* ignore */ }
}

// === Action buttons (favorites / read later / bookmark) ===
import { setDoc as setDoc2, addDoc as addDoc2 } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
function initThreadActions(ctx){
  const { threadId, thread } = ctx;
  const anonId = localStorage.getItem("anon-id");
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
    await setDoc2(doc(db, "users", anonId, "favorites", threadId), {
      threadId, title: getTitle(), addedAt: serverTimestamp()
    }, { merge:true });
    alert("Добавлено в избранное");
  });
  document.getElementById("btn-readlater")?.addEventListener("click", async ()=>{
    if(needAnon()) return;
    await addDoc2(collection(db, "users", anonId, "readlater"), {
      threadId, title: getTitle(), addedAt: serverTimestamp()
    });
    alert("Сохранено в «Прочитать потом»");
  });
  document.getElementById("btn-bookmark")?.addEventListener("click", async ()=>{
    if(needAnon()) return;
    await addDoc2(collection(db, "users", anonId, "bookmarks"), {
      url: location.pathname + location.search, desc: getTitle(), addedAt: serverTimestamp()
    });
    alert("Закладка добавлена");
  });
}

// helpers
function escapeHtml(str=""){
  return String(str)
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function formatBody(text=""){
  const safe = escapeHtml(text);
  return safe.replace(/\n/g,"<br>");
}
