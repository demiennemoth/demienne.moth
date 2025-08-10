// forum.js — Win95 UI + fixed creation + admin indicators
import { db, isAdmin } from "./firebase.js";
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

export function mountForumUI(container){
  mountForum95(container);
}

export function mountForum95(container){
  container.innerHTML = `
  <div class="window95" style="max-width: min(1400px, calc(100vw - 24px)); margin: 16px auto 40px; box-shadow: inset -1px -1px 0 var(--95-dark), inset 1px 1px 0 var(--95-white);">
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

    <div class="container95">
      <aside class="panel95 window95" style="max-height: calc(100vh - 200px); overflow:auto;">
        <div class="group95">Профиль</div>
        <div style="padding:6px;">
          <a href="profile.html" class="btn95" style="display:block; text-align:center;">Твой профиль</a>
        </div>

        <div class="group95" style="margin-top:10px;">Категории</div>
        <ul class="list95" id="cat-list"></ul>

        <div class="group95" style="margin-top:10px;">Статус</div>
        <ul class="list95" id="stat-list">
          <li id="stat-online">Пользователей онлайн: —</li>
          <li id="stat-guests">Гостей: —</li>
          <li>Самый активный: moth.exe</li>
        </ul>

        <div class="group95" style="margin-top:10px;">Режим</div>
        <ul class="list95">
          <li>Админ: <b id="admin-flag"></b></li>
          <li><a href="admin.html">Открыть админку</a></li>
        </ul>
      </aside>

      <main class="panel95 window95">
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

        <table class="threads95" aria-label="Список тем">
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

        <div class="status95">
          <span id="stats-count">Тем: — • Сообщений: —</span>
          <span id="pager">Страница 1</span>
        </div>
      </main>
    </div>
  </div>

  <!-- Modal -->
  <div class="modal95" id="modal95">
    <div class="window95" style="max-width: min(1400px, calc(100vw - 24px)); margin: 16px auto 40px; box-shadow: inset -1px -1px 0 var(--95-dark), inset 1px 1px 0 var(--95-white);">
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
            <input class="input95" id="thread-category" style="flex:1" type="text" placeholder="Например: Общий" required />
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

  const threadsBody = container.querySelector("#threads-body");
  const catList = container.querySelector("#cat-list");
  const adminFlag = container.querySelector("#admin-flag");

  adminFlag.textContent = isAdmin() ? "включён" : "нет";

  async function loadThreads(){
    threadsBody.innerHTML = "";
    catList.innerHTML = "";
    const q = query(collection(db, "threads"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const categories = new Map();
    let totalPosts = 0;
    let totalThreads = 0;

    snapshot.forEach(docSnap => {
      const t = docSnap.data();
      const id = docSnap.id;
      totalThreads++;
      const cat = (t.category || "Без категории").trim();
      categories.set(cat, (categories.get(cat) || 0) + 1);

      const adminButtons = isAdmin()
        ? `<a class="btn95" href="admin.html?edit=${id}">Редактировать</a>`
        : "";

      const tr = document.createElement("tr");
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

    for(const [cat, count] of categories.entries()){
      const li = document.createElement("li");
      li.textContent = `${cat} (${count})`;
      li.addEventListener("click", () => {
        [...threadsBody.querySelectorAll("tr")].forEach(tr => {
          const td = tr.children[2];
          tr.style.display = (td && td.textContent.startsWith(cat)) ? "" : "none";
        });
      });
      catList.appendChild(li);
    }

    const stat = container.querySelector("#stats-count");
    if(stat) stat.textContent = `Тем: ${totalThreads} • Сообщений: ${totalPosts}`;
  }

  loadThreads().catch(err => {
    console.error(err);
    alert("Ошибка загрузки тем. Проверь правила Firestore.");
  });

  const modal = container.parentElement.querySelector("#modal95");
  container.querySelector("#newThreadBtn").addEventListener("click", ()=> modal.style.display='flex');
  container.querySelector("#cancelNew").addEventListener("click", ()=> modal.style.display='none');

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
      // redirect to the new thread:
      location.href = "thread.html?id=" + ref.id;
    }catch(err){
      console.error("Не удалось создать тему", err);
      alert("Не удалось создать тему. Смотри консоль и правила Firestore.");
    }finally{
      btn.disabled = false;
    }
  });
}

// tiny local escape (so this file works standalone)
function escapeHtml(str=""){
  return String(str)
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
