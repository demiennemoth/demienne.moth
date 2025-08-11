// profile.js — FIXED: waits for auth, shows anon profile, simple lists
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
  collection, getDocs, query, orderBy, limit
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

export function mountProfile95(container){
  // render loading state
  container.innerHTML = `
    <div class="window95" style="max-width:720px; margin:24px auto;">
      <div class="titlebar95"><div class="icon"></div><div class="title">Profile</div></div>
      <div class="panel95"><p>Загрузка профиля…</p></div>
    </div>`;

  onAuthStateChanged(auth, async (u) => {
    if(!u){
      // Still no user — let anon sign-in happen and retry automatically by onAuthStateChanged
      container.innerHTML = `
        <div class="window95" style="max-width:720px; margin:24px auto;">
          <div class="titlebar95"><div class="icon"></div><div class="title">Profile</div></div>
          <div class="panel95"><p>Подключаю анонимный профиль… обнови страницу, если долго висит.</p></div>
        </div>`;
      return;
    }
    const anonId = u.uid;
    try{
      const [fav, later, marks] = await Promise.all([
        listDocs(`users/${anonId}/favorites`, "addedAt"),
        listDocs(`users/${anonId}/readlater`, "addedAt"),
        listDocs(`users/${anonId}/bookmarks`, "addedAt"),
      ]);

      container.innerHTML = `
        <div class="window95" style="max-width:960px; margin:24px auto 60px;">
          <div class="titlebar95"><div class="icon"></div><div class="title">Profile — ${escapeHtml(shortUid(anonId))}</div></div>
          <div class="panel95">
            <div class="group95">Аккаунт</div>
            <div class="row95"><label>UID</label><input class="input95" value="${escapeAttr(anonId)}" readonly /></div>

            <div class="group95" style="margin-top:8px;">Избранное (${fav.length})</div>
            <ul class="list95">
              ${fav.map(x => `<li><a href="thread.html?id=${encodeURIComponent(x.threadId)}">${escapeHtml(x.title||x.threadId||"(без названия)")}</a></li>`).join("") || "<li>пусто</li>"}
            </ul>

            <div class="group95" style="margin-top:8px;">Прочитать потом (${later.length})</div>
            <ul class="list95">
              ${later.map(x => `<li><a href="thread.html?id=${encodeURIComponent(x.threadId)}">${escapeHtml(x.title||x.threadId||"(без названия)")}</a></li>`).join("") || "<li>пусто</li>"}
            </ul>

            <div class="group95" style="margin-top:8px;">Закладки (${marks.length})</div>
            <ul class="list95">
              ${marks.map(x => `<li><a href="${escapeAttr(x.url||'#')}">${escapeHtml(x.desc||x.url||"(ссылка)")}</a></li>`).join("") || "<li>пусто</li>"}
            </ul>
          </div>
        </div>`;
    }catch(e){
      console.error(e);
      container.innerHTML = `
        <div class="window95" style="max-width:720px; margin:24px auto;">
          <div class="titlebar95"><div class="icon"></div><div class="title">Profile</div></div>
          <div class="panel95"><p>Не удалось загрузить профиль. Проверь права Firestore и консоль.</p></div>
        </div>`;
    }
  });
}

async function listDocs(path, orderField){
  const qref = query(collection(db, path), orderBy(orderField, "desc"), limit(50));
  const snap = await getDocs(qref);
  const arr = [];
  snap.forEach(d => arr.push(d.data()));
  return arr;
}

function escapeHtml(str=""){
  return String(str)
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function escapeAttr(str=""){
  return escapeHtml(str).replaceAll("\n"," ");
}
function shortUid(uid=""){
  return uid.slice(0,6) + "…" + uid.slice(-4);
}
