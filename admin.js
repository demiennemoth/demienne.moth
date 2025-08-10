// admin.js — simple client-side admin panel (guarded by ADMIN_KEY)
import { db, ADMIN_KEY, isAdmin } from "./firebase.js";
import {
  collection, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const root = document.getElementById("admin-root");

function renderGate(){
  root.innerHTML = `
    <div class="window95" style="max-width:900px; margin:24px auto;">
      <div class="titlebar95"><div class="icon"></div><div class="title">Админ-доступ</div></div>
      <div class="panel95">
        <p>Введи админ-ключ (настроен в <code>firebase.js</code>):</p>
        <input class="input95" id="key" type="password" placeholder="Ключ" />
        <button class="btn95" id="go">Войти</button>
        <p style="margin-top:8px; font-size:12px;">Текущий статус: <b>${isAdmin() ? "админ" : "гость"}</b></p>
      </div>
    </div>`;
  root.querySelector("#go").addEventListener("click", ()=>{
    const key = root.querySelector("#key").value;
    if (key && key === ADMIN_KEY) {
      localStorage.setItem("admin-key", key);
      loadDashboard();
    } else {
      alert("Неверный ключ");
    }
  });
}

async function loadDashboard(){
  if (!isAdmin()) { renderGate(); return; }
  const url = new URL(location.href);
  const editId = url.searchParams.get("edit") || "";

  root.innerHTML = `
  <div class="window95" style="max-width:1200px; margin:16px auto 60px;">
    <div class="titlebar95"><div class="icon"></div><div class="title">Админка — Форум</div></div>
    <div class="panel95">
      <div class="toolbar95" style="gap:8px;">
        <a class="btn95" href="index.html">На форум</a>
        <button class="btn95" id="logout">Выйти из админа</button>
      </div>
      <div id="flex" style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top:8px;">
        <div class="window95" style="padding:6px;">
          <div class="group95">Темы</div>
          <div id="threads"></div>
        </div>
        <div class="window95" style="padding:6px;">
          <div class="group95">Редактор</div>
          <div id="editor">Выбери тему для редактирования</div>
        </div>
      </div>
    </div>
  </div>`;

  root.querySelector("#logout").addEventListener("click", ()=>{
    localStorage.removeItem("admin-key");
    renderGate();
  });

  const listEl = root.querySelector("#threads");
  const editor = root.querySelector("#editor");

  async function refreshList(){
    listEl.innerHTML = "Загрузка...";
    const q = query(collection(db, "threads"), orderBy("createdAt","desc"));
    const snap = await getDocs(q);
    const ul = document.createElement("ul");
    ul.className = "list95";
    snap.forEach(d => {
      const t = d.data();
      const li = document.createElement("li");
      li.innerHTML = `<a href="?edit=${d.id}">${escapeHtml(t.title || d.id)}</a>`;
      ul.appendChild(li);
    });
    listEl.innerHTML = "";
    listEl.appendChild(ul);
  }

  async function loadEditor(id){
    if (!id) { editor.textContent = "Выбери тему"; return; }
    const ds = await getDoc(doc(db,"threads",id));
    if(!ds.exists()){ editor.textContent = "Тема не найдена"; return; }
    const t = ds.data();
    editor.innerHTML = `
      <div class="row95"><label>ID</label><input class="input95" value="${id}" readonly/></div>
      <div class="row95"><label>Заголовок</label><input class="input95" id="etitle" value="${escapeAttr(t.title || "")}"/></div>
      <div class="row95" style="align-items:flex-start"><label>Текст</label><textarea class="input95" id="ebody">${escapeHtml(t.body || "")}</textarea></div>
      <div class="row95"><label>Категория</label><input class="input95" id="ecat" value="${escapeAttr(t.category || "")}"/></div>
      <div style="display:flex; gap:8px; justify-content:flex-end">
        <button class="btn95" id="save">Сохранить</button>
        <button class="btn95" id="del">Удалить</button>
      </div>`;
    editor.querySelector("#save").addEventListener("click", async ()=>{
      const etitle = editor.querySelector("#etitle").value.trim();
      const ebody = editor.querySelector("#ebody").value.trim();
      const ecat = editor.querySelector("#ecat").value.trim();
      await updateDoc(doc(db,"threads",id), { title: etitle, body: ebody, category: ecat });
      alert("Сохранено");
      await refreshList();
    });
    editor.querySelector("#del").addEventListener("click", async ()=>{
      if(!confirm("Удалить тему?")) return;
      await deleteDoc(doc(db,"threads",id));
      alert("Удалено");
      location.href = "admin.html";
    });
  }

  await refreshList();
  await loadEditor(editId);
}

function escapeHtml(str=""){
  return String(str)
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function escapeAttr(str=""){
  return escapeHtml(str).replaceAll("\n"," ");
}

loadDashboard();
