// profile.js — Win95 профиль с реальными данными из Firestore
import { db } from "./firebase.js";
import {
  collection, collectionGroup, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

export async function mountProfile95(container){
  const anonId = localStorage.getItem("anon-id");
  if(!anonId){
    container.innerHTML = `<div class="window95" style="max-width:680px;margin:24px auto;">
      <div class="titlebar95"><div class="icon"></div><div class="title">Profile</div></div>
      <div class="panel95"><p>Ты не авторизован. Зайди в меню <b>Accession</b> и сгенерируй анонимный ID.</p></div>
    </div>`;
    return;
  }

  // Локальные настройки профиля (ник/символ)
  const userNick = localStorage.getItem("nickname") || anonId;
  const userAvatar = localStorage.getItem("avatarSym") || "✶";

  container.innerHTML = `
  <div class="window95" style="max-width:1180px;margin:16px auto 56px auto;">
    <div class="titlebar95">
      <div class="icon" aria-hidden="true"></div>
      <div class="title">МОЛЬ — Профиль</div>
      <div class="controls95">
        <button class="btn95 tb95" title="Close" onclick="history.back()">×</button>
      </div>
    </div>

    <div class="menubar95">
      <div class="menu95">Файл</div>
      <div class="menu95">Правка</div>
      <div class="menu95">Вид</div>
      <div class="menu95">Справка</div>
    </div>

    <div class="container95">
      <aside class="panel95 window95">
        <div class="group95">Профиль</div>
        <div class="profile-card" style="display:grid; grid-template-columns:96px 1fr; gap:8px; align-items:start; padding:8px; background:#fff; color:#000; border:1px solid #808080;">
          <div id="avatar" class="avatar" style="width:96px; height:96px; display:grid; place-items:center; background:#f4f4f4; border:2px solid #808080; border-right-color:#fff; border-bottom-color:#fff; font-size:36px;">${userAvatar}</div>
          <div>
            <div class="nick" style="display:flex; flex-wrap:wrap; align-items:center; gap:6px;">
              <span id="nickname" style="font-weight:bold; font-size:14px;">${escapeHtml(userNick)}</span>
              <button class="btn95" id="editNickBtn">Редактировать ник</button>
              <button class="btn95" id="changePhotoBtn">Сменить фото</button>
            </div>
            <div class="status" style="display:inline-flex; align-items:center; gap:6px; font-size:12px; margin-top:2px;">
              <span class="dot" id="statusDot" style="width:10px;height:10px;background:#008000;border:1px solid #004400;"></span>
              <span id="statusText">В сети — активность ...</span>
            </div>
          </div>
        </div>

        <div class="group95" style="margin-top:10px;">Разделы</div>
        <ul class="list95" id="sections">
          <li data-tab="threads" class="active">Твои треды <span class="count" id="count-threads"></span></li>
          <li data-tab="favorites">Избранное <span class="count" id="count-favorites"></span></li>
          <li data-tab="drafts">Черновики <span class="count" id="count-drafts"></span></li>
          <li data-tab="replies">Ответы <span class="count" id="count-replies"></span></li>
          <li data-tab="readlater">Прочитать потом <span class="count" id="count-readlater"></span></li>
          <li data-tab="bookmarks">Закладки <span class="count" id="count-bookmarks"></span></li>
        </ul>
      </aside>

      <main class="panel95 window95">
        <div id="tab-threads" class="tab">
          <div class="group95">Твои треды</div>
          <table class="threads95">
            <thead><tr><th>Тема</th><th>Категория</th><th>Ответы</th><th>Последнее</th></tr></thead>
            <tbody id="threadsBody"></tbody>
          </table>
        </div>

        <div id="tab-favorites" class="tab" style="display:none">
          <div class="group95">Избранное</div>
          <table class="threads95">
            <thead><tr><th>Тема</th><th>Добавлено</th></tr></thead>
            <tbody id="favoritesBody"></tbody>
          </table>
        </div>

        <div id="tab-drafts" class="tab" style="display:none">
          <div class="group95">Черновики</div>
          <table class="threads95">
            <thead><tr><th>Заголовок</th><th>Изменён</th></tr></thead>
            <tbody id="draftsBody"></tbody>
          </table>
        </div>

        <div id="tab-replies" class="tab" style="display:none">
          <div class="group95">Ответы</div>
          <table class="threads95">
            <thead><tr><th>Тред</th><th>Фрагмент</th><th>Дата</th></tr></thead>
            <tbody id="repliesBody"></tbody>
          </table>
        </div>

        <div id="tab-readlater" class="tab" style="display:none">
          <div class="group95">Прочитать потом</div>
          <table class="threads95">
            <thead><tr><th>Тема</th><th>Сохранено</th></tr></thead>
            <tbody id="readlaterBody"></tbody>
          </table>
        </div>

        <div id="tab-bookmarks" class="tab" style="display:none">
          <div class="group95">Закладки</div>
          <table class="threads95">
            <thead><tr><th>Ссылка</th><th>Описание</th></tr></thead>
            <tbody id="bookmarksBody"></tbody>
          </table>
        </div>

        <div class="status95">
          <span id="stat-left">Загрузка…</span>
          <span id="stat-right">Последняя активность: —</span>
        </div>
      </main>
    </div>
  </div>

  <!-- Модалки -->
  <div id="modalNick" class="modal95">
    <div class="window95">
      <div class="titlebar95"><div class="icon"></div><div class="title">Редактировать ник</div>
        <div class="controls95"><button class="btn95 tb95" onclick="document.getElementById('modalNick').style.display='none'">×</button></div>
      </div>
      <div class="panel95">
        <div class="row95"><label>Новый ник</label><input id="nickInput" class="input95" type="text" value="${escapeHtml(userNick)}"/></div>
        <div style="display:flex; gap:8px; justify-content:flex-end">
          <button class="btn95" id="nickCancel">Отмена</button>
          <button class="btn95" id="nickSave">Сохранить</button>
        </div>
      </div>
    </div>
  </div>

  <div id="modalPhoto" class="modal95">
    <div class="window95">
      <div class="titlebar95"><div class="icon"></div><div class="title">Сменить фото</div>
        <div class="controls95"><button class="btn95 tb95" onclick="document.getElementById('modalPhoto').style.display='none'">×</button></div>
      </div>
      <div class="panel95">
        <div class="row95"><label>Символ/эмодзи</label><input id="avatarInput" class="input95" type="text" placeholder="Например: ✶"/></div>
        <div style="display:flex; gap:8px; justify-content:flex-end">
          <button class="btn95" id="photoCancel">Отмена</button>
          <button class="btn95" id="photoSave">Сохранить</button>
        </div>
      </div>
    </div>
  </div>
  `;

  // Статус активности: обновляем в базе
  const userDocRef = doc(collection(db, "users"), anonId);
  await setDoc(userDocRef, { nick: userNick, avatar: userAvatar, lastActive: serverTimestamp() }, { merge: true });
  updateLastActiveUI();

  // Ник / Фото
  container.querySelector("#editNickBtn").addEventListener("click", ()=> toggle("modalNick", true));
  container.querySelector("#changePhotoBtn").addEventListener("click", ()=> toggle("modalPhoto", true));
  container.querySelector("#nickCancel").addEventListener("click", ()=> toggle("modalNick", false));
  container.querySelector("#photoCancel").addEventListener("click", ()=> toggle("modalPhoto", false));
  container.querySelector("#nickSave").addEventListener("click", async ()=>{
    const val = (document.getElementById("nickInput").value || "").trim();
    if(!val) return;
    localStorage.setItem("nickname", val);
    container.querySelector("#nickname").textContent = val;
    await setDoc(userDocRef, { nick: val, updatedAt: serverTimestamp() }, { merge: true });
    toggle("modalNick", false);
  });
  container.querySelector("#photoSave").addEventListener("click", async ()=>{
    const sym = (document.getElementById("avatarInput").value || "✶").slice(0,2);
    localStorage.setItem("avatarSym", sym);
    container.querySelector("#avatar").textContent = sym || "✶";
    await setDoc(userDocRef, { avatar: sym, updatedAt: serverTimestamp() }, { merge: true });
    toggle("modalPhoto", false);
  });

  // Навигация по табам
  const sections = container.querySelector("#sections");
  sections.addEventListener("click", (e)=>{
    const li = e.target.closest("li");
    if(!li) return;
    sections.querySelectorAll("li").forEach(x=>x.classList.remove("active"));
    li.classList.add("active");
    const tab = li.dataset.tab;
    container.querySelectorAll(".tab").forEach(el=> el.style.display="none");
    container.querySelector("#tab-"+tab).style.display="block";
  });

  // Загрузка данных
  await Promise.all([loadThreads(), loadFavorites(), loadDrafts(), loadReplies(), loadReadLater(), loadBookmarks()])
    .catch(console.error);
  refreshCountsAndStats();

  // ===== helpers =====
  function toggle(id, on){ container.parentElement.querySelector("#"+id).style.display = on ? "flex" : "none"; }

  function updateLastActiveUI(){
    const el = container.querySelector("#statusText");
    const now = new Date();
    el.textContent = "В сети — активность " + now.getHours().toString().padStart(2,'0') + ":" + now.getMinutes().toString().padStart(2,'0');
  }

  async function loadThreads(){
    const body = container.querySelector("#threadsBody");
    body.innerHTML = `<tr><td colspan="4">Загрузка…</td></tr>`;
    try{
      const q = query(collection(db,"threads"), where("author","==",anonId), orderBy("createdAt","desc"), limit(50));
      const snap = await getDocs(q);
      body.innerHTML = "";
      if(snap.empty){ body.innerHTML = `<tr><td colspan="4">Пока пусто</td></tr>`; return; }
      snap.forEach(docSnap => {
        const t = docSnap.data();
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="subject95"><a href="thread.html?id=${docSnap.id}">${escapeHtml(t.title || "(без названия)")}</a></td>
          <td>${escapeHtml(t.category || "—")}</td>
          <td>${t.repliesCount || 0}</td>
          <td>${fmtTs(t.createdAt)}</td>`;
        body.appendChild(tr);
      });
    }catch(e){ body.innerHTML = `<tr><td colspan="4">Ошибка загрузки</td></tr>`; }
  }

  async function loadFavorites(){
    const body = container.querySelector("#favoritesBody");
    body.innerHTML = `<tr><td colspan="2">Загрузка…</td></tr>`;
    try{
      const snap = await getDocs(collection(db,"users",anonId,"favorites"));
      body.innerHTML = "";
      if(snap.empty){ body.innerHTML = `<tr><td colspan="2">Пусто</td></tr>`; return; }
      for (const docSnap of snap.docs){
        const fav = docSnap.data();
        const tr = document.createElement("tr");
        tr.innerHTML = `<td><a href="thread.html?id=${fav.threadId}">${escapeHtml(fav.title || fav.threadId)}</a></td>
                        <td>${fmtTs(fav.addedAt)}</td>`;
        body.appendChild(tr);
      }
    }catch(e){ body.innerHTML = `<tr><td colspan="2">Ошибка</td></tr>`; }
  }

  async function loadDrafts(){
    const body = container.querySelector("#draftsBody");
    body.innerHTML = `<tr><td colspan="2">Загрузка…</td></tr>`;
    try{
      const snap = await getDocs(collection(db,"users",anonId,"drafts"));
      body.innerHTML = "";
      if(snap.empty){ body.innerHTML = `<tr><td colspan="2">Нет черновиков</td></tr>`; return; }
      snap.forEach(d => {
        const dr = d.data();
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${escapeHtml(dr.title || "(без названия)")}</td><td>${fmtTs(dr.updatedAt || dr.createdAt)}</td>`;
        body.appendChild(tr);
      });
    }catch(e){ body.innerHTML = `<tr><td colspan="2">Ошибка</td></tr>`; }
  }

  async function loadReplies(){
    const body = container.querySelector("#repliesBody");
    body.innerHTML = `<tr><td colspan="3">Загрузка…</td></tr>`;
    try{
      const q = query(collectionGroup(db,"replies"), where("author","==",anonId), orderBy("createdAt","desc"), limit(50));
      const snap = await getDocs(q);
      body.innerHTML = "";
      if(snap.empty){ body.innerHTML = `<tr><td colspan="3">Пока нет ответов</td></tr>`; return; }
      snap.forEach(r => {
        const rv = r.data();
        const threadId = r.ref.parent.parent.id; // родительский тред
        const tr = document.createElement("tr");
        tr.innerHTML = `<td><a href="thread.html?id=${threadId}">${threadId}</a></td>
                        <td>${escapeHtml((rv.text || "").slice(0,80))}</td>
                        <td>${fmtTs(rv.createdAt)}</td>`;
        body.appendChild(tr);
      });
    }catch(e){ body.innerHTML = `<tr><td colspan="3">Ошибка (нужен индекс Firestore)</td></tr>`; }
  }

  async function loadReadLater(){
    const body = container.querySelector("#readlaterBody");
    body.innerHTML = `<tr><td colspan="2">Загрузка…</td></tr>`;
    try{
      const snap = await getDocs(collection(db,"users",anonId,"readlater"));
      body.innerHTML = "";
      if(snap.empty){ body.innerHTML = `<tr><td colspan="2">Пусто</td></tr>`; return; }
      snap.forEach(d => {
        const it = d.data();
        const tr = document.createElement("tr");
        tr.innerHTML = `<td><a href="thread.html?id=${it.threadId}">${escapeHtml(it.title || it.threadId)}</a></td>
                        <td>${fmtTs(it.addedAt)}</td>`;
        body.appendChild(tr);
      });
    }catch(e){ body.innerHTML = `<tr><td colspan="2">Ошибка</td></tr>`; }
  }

  async function loadBookmarks(){
    const body = container.querySelector("#bookmarksBody");
    body.innerHTML = `<tr><td colspan="2">Загрузка…</td></tr>`;
    try{
      const snap = await getDocs(collection(db,"users",anonId,"bookmarks"));
      body.innerHTML = "";
      if(snap.empty){ body.innerHTML = `<tr><td colspan="2">Пусто</td></tr>`; return; }
      snap.forEach(d => {
        const it = d.data();
        const tr = document.createElement("tr");
        tr.innerHTML = `<td><a href="${escapeAttr(it.url || '#')}">${escapeHtml(it.url || '(ссылка)')}</a></td>
                        <td>${escapeHtml(it.desc || '')}</td>`;
        body.appendChild(tr);
      });
    }catch(e){ body.innerHTML = `<tr><td colspan="2">Ошибка</td></tr>`; }
  }

  function refreshCountsAndStats(){
    const counts = {
      threads: container.querySelectorAll("#threadsBody tr").length,
      favorites: container.querySelectorAll("#favoritesBody tr").length,
      drafts: container.querySelectorAll("#draftsBody tr").length,
      replies: container.querySelectorAll("#repliesBody tr").length,
      readlater: container.querySelectorAll("#readlaterBody tr").length,
      bookmarks: container.querySelectorAll("#bookmarksBody tr").length,
    };
    for(const k in counts){
      const el = container.querySelector("#count-"+k);
      if(el) el.textContent = counts[k] ? `(${counts[k]})` : "(0)";
    }
    container.querySelector("#stat-left").textContent = `Тредов: ${counts.threads} • Ответов: ${counts.replies}`;
    const dt = new Date();
    container.querySelector("#stat-right").textContent = `Последняя активность: ${dt.toLocaleString()}`;
  }

  function fmtTs(ts){
    if(!ts) return "";
    const d = ts.seconds ? new Date(ts.seconds*1000) : (ts.toDate ? ts.toDate() : new Date(ts));
    return d.toLocaleString();
  }
}

// utils
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function escapeAttr(s){ return String(s).replace(/"/g, '&quot;'); }
