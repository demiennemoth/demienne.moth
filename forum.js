// forum.js — layout v2: narrower main window, left grouped categories, center threads, right sidebar
import { db, isAdmin } from "./firebase.js";
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const CATEGORIES = [
  { group: "Общество", items: ["Знакомства","Личные отношения","Советы","Помощь","Общение","Всякое"] },
  { group: "Мысль и наука", items: ["Философия","Теории заговора","Психология","Наука и научпоп","Космос"] },
  { group: "Культура и медиа", items: ["Фильмы","Книги","Музыка","Аниме","Знаменитости","Блогеры","Слухи и сливы"] },
  { group: "Игры и техника", items: ["Видеоигры","Компьютеры","Автомобили"] },
  { group: "Природа", items: ["Животные"] },
  { group: "Быт", items: ["Кулинария"] },
];

export function mountForumLayoutV2(root){
  root.innerHTML = `
  <div class="window95 window-shell">
    <div class="titlebar95">
      <div class="icon"></div><div class="title">МОЛЬ — Форум</div>
      <div class="controls95">
        <button class="btn95 tb95" onclick="history.back()">×</button>
      </div>
    </div>
    <div class="menubar95">
      <div class="menu95">Файл</div>
      <div class="menu95">Правка</div>
      <div class="menu95">Вид</div>
      <div class="menu95">Справка</div>
    </div>

    <div class="grid3">
      <!-- Left: categories -->
      <aside class="leftcol window95" style="padding:8px;">
        <div class="group95 group95--primary">Категории</div>
        ${CATEGORIES.map(g => `
          <div class="cat-group">${g.group}</div>
          <div class="cat-grid">
            ${g.items.map(name => `<a href="#" class="cat-link" data-cat="${escapeAttr(name)}">${escapeHtml(name)}</a>`).join("")}
          </div>
        `).join("")}
      </aside>

      <!-- Center: threads -->
      <main class="window95" style="padding:8px;">
        <div class="toolbar95">
          <button class="btn95" id="newThreadBtn">Новая тема</button>
          <input class="input95" id="searchBox" type="text" placeholder="Поиск по темам…" />
          <button class="btn95" id="searchBtn">Поиск</button>
          <span class="right">Сортировка:
            <select class="input95" id="sortSelect">
              <option value="date">по дате</option>
              <option value="replies">по ответам</option>
              <option value="views">по просмотрам</option>
            </select>
          </span>
        </div>

        <table class="threads95" aria-label="Список тем">
          <thead>
            <tr>
              <th>Тема</th><th>Автор</th><th>Категория</th>
              <th>Ответы</th><th>Просмотры</th><th>Последнее</th><th></th>
            </tr>
          </thead>
          <tbody id="threads-body"></tbody>
        </table>

        <div class="status95">
          <span id="stats-count">Тем: — • Сообщений: —</span>
          <span id="pager">Страница 1</span>
        </div>
      </main>

      <!-- Right: profile/admin/online -->
      <aside class="rightcol window95" style="padding:8px;">
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
        <ul class="list95" id="stat-list">
          <li id="stat-online">Пользователей онлайн: —</li>
          <li id="stat-guests">Гостей: —</li>
          <li>Самый активный: moth.exe</li>
        </ul>
      </aside>
    </div>
  </div>

  <!-- Modal -->
  <div class="modal95" id="modal95">
    <div class="window95" style="max-width: 720px; margin: 16px auto 40px; box-shadow: inset -1px -1px 0 var(--95-dark), inset 1px 1px 0 var(--95-white);">
      <div class="titlebar95">
        <div class="icon"></div><div class="title">Новая тема</div>
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
            <input list="catlist" class="input95" id="thread-category" style="flex:1" type="text" placeholder="Выберите категорию" required />
            <datalist id="catlist">
              ${CATEGORIES.flatMap(g=>g.items).map(c=>`<option value="${escapeAttr(c)}"></option>`).join("")}
            </datalist>
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

  const threadsBody = root.querySelector("#threads-body");
  const adminFlag = root.querySelector("#admin-flag");
  adminFlag.textContent = isAdmin() ? "включён" : "нет";

  // filter by clicking category
  root.querySelectorAll(".cat-link").forEach(a => {
    a.addEventListener("click", (e)=>{
      e.preventDefault();
      const cat = a.dataset.cat;
      [...threadsBody.querySelectorAll("tr")].forEach(tr => {
        const td = tr.children[2];
        tr.style.display = (td && td.textContent.trim() === cat) ? "" : "none";
      });
    });
  });

  async function loadThreads(){
    threadsBody.innerHTML = "";
    const qy = query(collection(db, "threads"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(qy);
    let totalPosts = 0;
    let totalThreads = 0;
    snapshot.forEach(docSnap => {
      const t = docSnap.data();
      const id = docSnap.id;
      totalThreads++;
      const adminButtons = isAdmin()
        ? `<a class="btn95" href="admin.html?edit=${id}">Редактировать</a>`
        : "";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="subject95"><a href="thread.html?id=${id}">${t.title ? escapeHtml(t.title) : "(без названия)"}</a></td>
        <td>${t.author || "анон"}</td>
        <td>${escapeHtml(t.category || "—")}</td>
        <td>${t.repliesCount || 0}</td>
        <td>${t.views || 0}</td>
        <td>${t.createdAt?.seconds ? new Date(t.createdAt.seconds*1000).toLocaleString() : ""}</td>
        <td>${adminButtons}</td>
      `;
      threadsBody.appendChild(tr);
      totalPosts += (t.repliesCount || 0);
    });
    const stat = root.querySelector("#stats-count");
    if(stat) stat.textContent = `Тем: ${totalThreads} • Сообщений: ${totalPosts}`;
  }
  loadThreads().catch(err => {
    console.error(err);
    alert("Ошибка загрузки тем. Проверь правила Firestore.");
  });

  const modal = document.getElementById('modal95');
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

function escapeHtml(str=""){
  return String(str)
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function escapeAttr(str=""){
  return escapeHtml(str).replaceAll("\n"," ");
}
