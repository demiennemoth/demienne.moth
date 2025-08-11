// forum.js — enlarged main window + categories table visible at once
import { db, isAdmin } from "./firebase.js";
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Flat list of categories (visible as a table)
const CATEGORIES = [
  "Философия","Жизнь после смерти","Личные отношения","Знакомства","Советы","Помощь",
  "Теории заговора","Психология","Наука и научпоп","Космос",
  "Фильмы","Книги","Музыка","Аниме","Знаменитости","Блогеры","Слухи и сливы",
  "Видеоигры","Компьютеры","Автомобили",
  "Животные","Кулинария",
  "Общение","Всякое"
];

export function mountForum95(container){
  container.innerHTML = `
  <div class="window95" style="max-width: min(1800px, calc(100vw - 24px)); margin: 16px auto 40px; box-shadow: inset -1px -1px 0 var(--95-dark), inset 1px 1px 0 var(--95-white);">
    <div class="titlebar95">
      <div class="icon" aria-hidden="true"></div>
      <div class="title">МОЛЬ — Форум</div>
      <div class="controls95">
        <button class="btn95 tb95" title="Minimize">_</button>
        <button class="btn95 tb95" title="Maximize">▢</button>
        <button class="btn95 tb95" title="Close" onclick="history.back()">×</button>
      </div>
    </div>

    <div class="menubar95">
      <div class="menu95">Файл</div>
      <div class="menu95">Правка</div>
      <div class="menu95">Вид</div>
      <div class="menu95">Справка</div>
    </div>

    <div class="container95" style="grid-template-columns: 420px 1fr;">
      <aside class="panel95 window95" style="max-height: calc(100vh - 220px); overflow:auto;">
        <div class="group95">Профиль</div>
        <div style="padding:6px;">
          <a href="profile.html" class="btn95" style="display:block; text-align:center;">Твой профиль</a>
        </div>

        <div class="group95" style="margin-top:10px;">Режим</div>
        <ul class="list95">
          <li>Админ: <b id="admin-flag"></b></li>
          <li><a href="admin.html">Открыть админку</a></li>
        </ul>
      </aside>

      <main class="panel95 window95">
        <style>
          /* inline tweaks so тебе не лезть в style.css прямо сейчас */
          .cats95 { width:100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 10px; }
          .cats95 td, .cats95 th { border: 1px solid #808080; padding: 6px 8px; vertical-align: top; }
          .cats95 a { display:block; text-decoration:none; }
          .cats95 a:hover { text-decoration: underline; }
          .threads95 { width:100%; border-collapse: collapse; table-layout: fixed; }
          .threads95 th, .threads95 td { border: 1px solid #808080; padding: 6px 8px; }
          .subject95 a { text-decoration:none; }
          .subject95 a:hover { text-decoration:underline; }
        </style>

        <div class="toolbar95">
          <button class="btn95" id="newThreadBtn">Новая тема</button>
          <input class="input95" id="searchBox" type="text" placeholder="Поиск по темам…" />
          <button class="btn95" id="searchBtn">Поиск</button>
          <span style="margin-left:auto">Сортировка:
            <select class="input95" id="sortSelect" style="padding:1px 2px;">
              <option value="date">по дате</option>
              <option value="replies">по ответам</option>
              <option value="views">по просмотрам</option>
            </select>
          </span>
        </div>

        <!-- Categories table (always visible) -->
        <table class="cats95" aria-label="Категории" id="cats-table">
          <thead>
            <tr><th colspan="6">Категории</th></tr>
          </thead>
          <tbody id="cats-body"></tbody>
        </table>

        <!-- Threads table -->
        <table class="threads95" aria-label="Список тем">
          <thead>
            <tr>
              <th style="width:44%;">Тема</th>
              <th style="width:12%;">Автор</th>
              <th style="width:18%;">Категория</th>
              <th style="width:8%;">Ответы</th>
              <th style="width:8%;">Просмотры</th>
              <th style="width:10%;">Последнее</th>
              <th style="width:10%;"></th>
            </tr>
          </thead>
          <tbody id="threads-body"></tbody>
        </table>

        <div class="status95">
          <span id="stats-count">Тем: — • Сообщений: —</span>
          <span id="pager">Страница 1</span>
        </div>
      </main>
    </div>
  </div>

  <!-- Modal -->
  <div class="modal95" id="modal95">
    <div class="window95" style="max-width: min(900px, calc(100vw - 24px)); margin: 16px auto 40px; box-shadow: inset -1px -1px 0 var(--95-dark), inset 1px 1px 0 var(--95-white);">
      <div class="titlebar95">
        <div class="icon"></div>
        <div class="title">Новая тема</div>
        <div class="controls95">
          <button class="btn95 tb95" title="Close" onclick="document.getElementById('modal95').style.display='none'">×</button>
        </div>
      </div>
      <div class="panel95">
        <form id="new-thread-form">
          <div class="row95">
            <label>Заголовок</label>
            <input class="input95" id="thread-title" style="flex:1" type="text" placeholder="Напишите кратко…" required />
          </div>
          <div class="row95">
            <label>Категория</label>
            <input class="input95" id="thread-category" list="cat-datalist" style="flex:1" type="text" placeholder="Выберите из списка" required />
            <datalist id="cat-datalist"></datalist>
          </div>
          <div class="row95" style="align-items:flex-start">
            <label>Текст</label>
            <textarea class="input95" id="thread-body" placeholder="Тут ваш тёмно-атмосферный пост…" required></textarea>
          </div>
          <div style="display:flex; gap:8px; justify-content:flex-end">
            <button type="button" class="btn95" id="cancelNew">Отмена</button>
            <button type="submit" class="btn95" id="createNew">Опубликовать</button>
          </div>
        </form>
      </div>
    </div>
  </div>
  `;

  const adminFlag = container.querySelector("#admin-flag");
  if (adminFlag) adminFlag.textContent = isAdmin() ? "включён" : "нет";

  // Render categories table 6 columns wide
  const catsBody = container.querySelector("#cats-body");
  const catDataList = container.querySelector("#cat-datalist");
  if (catsBody) {
    for (let i=0; i<CATEGORIES.length; i+=6) {
      const row = document.createElement("tr");
      for (let j=0; j<6; j++) {
        const idx = i+j;
        const td = document.createElement("td");
        if (idx < CATEGORIES.length) {
          const name = CATEGORIES[idx];
          td.innerHTML = `<a href="#" data-cat="${escapeAttr(name)}">${escapeHtml(name)}</a>`;
        } else {
          td.innerHTML = "&nbsp;";
        }
        row.appendChild(td);
      }
      catsBody.appendChild(row);
    }
  }
  if (catDataList) {
    CATEGORIES.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c;
      catDataList.appendChild(opt);
    });
  }

  // Data load
  const threadsBody = container.querySelector("#threads-body");

  async function loadThreads(){
    threadsBody.innerHTML = "";
    const q = query(collection(db, "threads"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    let totalPosts = 0;
    let totalThreads = 0;

    snapshot.forEach(docSnap => {
      const t = docSnap.data();
      const id = docSnap.id;
      totalThreads++;
      const cat = (t.category || "Без категории").trim();

      const adminButtons = isAdmin()
        ? `<a class="btn95" href="admin.html?edit=${id}">Редактировать</a>`
        : "";

      const tr = document.createElement("tr");
      tr.dataset.cat = cat.toLowerCase();
      tr.innerHTML = `
        <td class="subject95"><a href="thread.html?id=${id}">${t.title ? escapeHtml(t.title) : "(без названия)"}</a></td>
        <td>${t.author || "анон"}</td>
        <td>${escapeHtml(cat)}</td>
        <td>${t.repliesCount || 0}</td>
        <td>${t.views || 0}</td>
        <td>${t.createdAt?.seconds ? new Date(t.createdAt.seconds*1000).toLocaleString() : ""}</td>
        <td>${adminButtons}</td>
      `;
      threadsBody.appendChild(tr);
      totalPosts += (t.repliesCount || 0);
    });

    const stat = container.querySelector("#stats-count");
    if(stat) stat.textContent = `Тем: ${totalThreads} • Сообщений: ${totalPosts}`;
  }

  loadThreads().catch(err => {
    console.error(err);
    alert("Ошибка загрузки тем. Проверь правила Firestore.");
  });

  // Category click filter
  container.querySelectorAll("#cats-table a[data-cat]").forEach(a => {
    a.addEventListener("click", (e)=>{
      e.preventDefault();
      const cat = a.dataset.cat.toLowerCase();
      container.querySelectorAll("#threads-body tr").forEach(tr => {
        const match = (tr.dataset.cat || "").startsWith(cat);
        tr.style.display = match ? "" : "none";
      });
    });
  });

  // Modal handlers
  const modal = container.parentElement.querySelector("#modal95");
  container.querySelector("#newThreadBtn").addEventListener("click", ()=> modal.style.display='flex');
  container.querySelector("#cancelNew").addEventListener("click", ()=> modal.style.display='none');

  // Create
  const form = container.querySelector("#new-thread-form");
  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const btn = container.querySelector("#createNew");
    btn.disabled = true;
    try{
      const title = document.getElementById("thread-title").value.trim();
      const body = document.getElementById("thread-body").value.trim();
      const category = document.getElementById("thread-category").value.trim();
      const anonId = localStorage.getItem("anon-id");
      if(!title || !body || !category){ alert("Все поля обязательны"); btn.disabled=false; return; }
      if(!anonId){ alert("Сначала получи анонимный ID в окне Accession"); btn.disabled=false; return; }

      const ref = await addDoc(collection(db, "threads"), {
        title, body, category, author: anonId,
        createdAt: serverTimestamp(), repliesCount: 0, views: 0
      });
      modal.style.display='none';
      form.reset();
      location.href = "thread.html?id=" + ref.id;
    }catch(err){
      console.error("Не удалось создать тему", err);
      alert("Не удалось создать тему. Смотри консоль и правила Firestore.");
    }finally{
      btn.disabled = false;
    }
  });
}

// escape helpers
function escapeHtml(str=""){
  return String(str)
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function escapeAttr(str=""){
  return escapeHtml(str).replaceAll("\n"," ");
}
