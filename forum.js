// forum.js — 3‑колоночный макет: слева категории (таблицей), центр — темы, справа — профиль/админ/онлайн
import { db, isAdmin } from "./firebase.js";
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const CATEGORIES = [
  "Философия","Теории заговора","Жизнь после смерти","Психология","Наука и научпоп","Космос",
  "Музыка","Аниме","Фильмы","Книги","Знаменитости","Блогеры","Слухи и сливы",
  "Видеоигры","Компьютеры","Автомобили","Животные","Кулинария","Знакомства","Личные отношения",
  "Советы","Помощь","Общение","Всякое"
];

export function mountForumLayout(root){
  root.innerHTML = `
  <div class="window95 forum-window" style="
      max-width: min(1900px, calc(100vw - 24px));
      min-height: min(88vh, 1200px);
      margin: 16px auto 40px;
      display: grid;
      grid-template-rows: auto 1fr;
      box-shadow: inset -1px -1px 0 var(--95-dark), inset 1px 1px 0 var(--95-white);
    ">
    <div class="titlebar95">
      <div class="icon" aria-hidden="true"></div>
      <div class="title">МОЛЬ — Форум</div>
      <div class="controls95">
        <button class="btn95 tb95" title="Minimize">_</button>
        <button class="btn95 tb95" title="Maximize">▢</button>
        <button class="btn95 tb95" title="Close" onclick="history.back()">×</button>
      </div>
    </div>

    <div class="panel95" style="display:grid; grid-template-columns: 380px 1fr 360px; gap:12px; align-items:start;">
      <!-- ЛЕВЫЙ СТОЛБЕЦ: КАТЕГОРИИ -->
      <aside class="window95" style="padding:6px; min-height: 70vh; overflow:auto;">
        <div class="group95">Категории</div>
        <div id="cat-grid" class="cat-grid"></div>
      </aside>

      <!-- ЦЕНТР: ТЕМЫ -->
      <main class="window95" style="padding:6px; min-height: 70vh; display:flex; flex-direction:column;">
        <div class="toolbar95" style="gap:8px; align-items:center;">
          <button class="btn95" id="newThreadBtn">Новая тема</button>
          <input class="input95" id="searchBox" type="text" placeholder="Поиск по темам…" style="flex:1"/>
          <button class="btn95" id="searchBtn">Поиск</button>
          <span style="margin-left:auto">Сортировка:
            <select class="input95" id="sortSelect" style="padding:1px 2px;">
              <option value="date">по дате</option>
            </select>
          </span>
        </div>

        <table class="threads95" aria-label="Список тем" style="margin-top:8px;">
          <thead>
            <tr>
              <th>Тема</th>
              <th>Автор</th>
              <th>Категория</th>
              <th>Ответы</th>
              <th>Просмотры</th>
              <th>Последнее</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="threads-body"></tbody>
        </table>

        <div class="status95" style="margin-top:auto;">
          <span id="stats-count">Тем: — • Сообщений: —</span>
          <span id="pager">Страница 1</span>
        </div>
      </main>

      <!-- ПРАВЫЙ СТОЛБЕЦ: ПРОФИЛЬ/АДМИН/ОНЛАЙН -->
      <aside class="window95" style="padding:6px; min-height: 70vh;">
        <div class="group95">Профиль</div>
        <div style="padding:6px;">
          <a href="profile.html" class="btn95" style="display:block; text-align:center;">Твой профиль</a>
        </div>

        <div class="group95" style="margin-top:10px;">Режим</div>
        <ul class="list95">
          <li>Админ: <b id="admin-flag"></b></li>
          <li><a href="admin.html">Открыть админку</a></li>
          <li><a href="admin-login.html">Войти как админ</a></li>
        </ul>

        <div class="group95" style="margin-top:10px;">Онлайн</div>
        <ul class="list95" id="online-list">
          <li>Пользователей онлайн: —</li>
          <li>Гостей: —</li>
          <li>Самый активный: moth.exe</li>
        </ul>
      </aside>
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
            <input class="input95" id="thread-category" style="flex:1" list="cats" placeholder="Выберите категорию" required />
            <datalist id="cats">${CATEGORIES.map(c=>`<option value="${escapeHtml(c)}">`).join("")}</datalist>
          </div>
          <div class="row95" style="align-items:flex-start">
            <label>Текст</label>
            <textarea class="input95" id="thread-body" placeholder="Тут ваш пост…" required></textarea>
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

  // render categories grid (таблица вида 6 колонок)
  const catGrid = root.querySelector("#cat-grid");
  catGrid.innerHTML = `
    <table class="threads95">
      <thead><tr><th colspan="6" style="text-align:left;">Категории</th></tr></thead>
      <tbody>
        ${chunk(CATEGORIES, 6).map(row => `
          <tr>
            ${row.map(c=> `<td><a href="#" data-cat="${escapeAttr(c)}">${escapeHtml(c)}</a></td>`).join("")}
            ${Array.from({length: 6 - row.length}).map(()=>"<td></td>").join("")}
          </tr>`).join("")}
      </tbody>
    </table>`;

  const threadsBody = root.querySelector("#threads-body");
  const adminFlag = root.querySelector("#admin-flag");
  adminFlag.textContent = isAdmin() ? "включён" : "нет";

  async function loadThreads(){
    threadsBody.innerHTML = "";
    const q = query(collection(db, "threads"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    let totalThreads = 0;
    let totalPosts = 0;
    snapshot.forEach(docSnap => {
      const t = docSnap.data();
      const id = docSnap.id;
      totalThreads++;
      const tr = document.createElement("tr");
      tr.dataset.cat = (t.category || "").toLowerCase();
      const adminButtons = isAdmin()
        ? `<a class="btn95" href="admin.html?edit=${id}">Редактировать</a>`
        : "";
      tr.innerHTML = `
        <td class="subject95"><a href="thread.html?id=${id}">${escapeHtml(t.title || "(без названия)")}</a></td>
        <td>${t.author || "анон"}</td>
        <td>${escapeHtml(t.category || "")}</td>
        <td>${t.repliesCount || 0}</td>
        <td>${t.views || 0}</td>
        <td>${t.createdAt?.seconds ? new Date(t.createdAt.seconds*1000).toLocaleString() : ""}</td>
        <td>${adminButtons}</td>`;
      threadsBody.appendChild(tr);
      totalPosts += (t.repliesCount || 0);
    });
    const stat = root.querySelector("#stats-count");
    if (stat) stat.textContent = `Тем: ${totalThreads} • Сообщений: ${totalPosts}`;
  }
  loadThreads().catch(e=>{console.error(e); alert("Ошибка загрузки тем");});

  // filtering by category
  catGrid.querySelectorAll('a[data-cat]').forEach(a=>{
    a.addEventListener('click', (ev)=>{
      ev.preventDefault();
      const cat = a.dataset.cat.toLowerCase();
      [...threadsBody.querySelectorAll("tr")].forEach(tr=>{
        tr.style.display = !cat || tr.dataset.cat === cat ? "" : "none";
      });
    });
  });

  // modal
  const modal = document.getElementById("modal95");
  root.querySelector("#newThreadBtn").addEventListener("click", ()=> modal.style.display='flex');
  root.querySelector("#cancelNew").addEventListener("click", ()=> modal.style.display='none');

  const form = root.querySelector("#new-thread-form");
  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const btn = root.querySelector("#createNew");
    btn.disabled = true;
    try{
      const title = document.getElementById("thread-title").value.trim();
      const body = document.getElementById("thread-body").value.trim();
      const category = document.getElementById("thread-category").value.trim();
      const anonId = localStorage.getItem("anon-id");
      if(!title || !body || !category){ alert("Все поля обязательны"); btn.disabled=false; return; }
      if(!anonId){ alert("Сначала получи анонимный ID"); btn.disabled=false; return; }

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

function chunk(arr, n){
  const out = [];
  for(let i=0;i<arr.length;i+=n) out.push(arr.slice(i,i+n));
  return out;
}
function escapeHtml(str=""){
  return String(str)
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function escapeAttr(str=""){
  return escapeHtml(str).replaceAll("\n"," ");
}
