// profile.js — FIXED: waits for auth, shows anon profile, simple lists
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
  collection, getDocs, query, orderBy, limit
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

export function mountProfile95(container){

function getIntroEnabled(uid){
  try{
    const v = localStorage.getItem('introThreadEnabled:'+uid);
    if(v === null) return true; // по умолчанию включено
    return v === '1';
  }catch(_){ return true; }
}
function setIntroEnabled(uid, on){
  try{ localStorage.setItem('introThreadEnabled:'+uid, on ? '1' : '0'); }catch(_){}
}

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
        <div class="window95" style="max-width:980px; margin:24px auto 60px;">
          <div class="titlebar95">
            <div class="icon"></div>
            <div class="title">Профиль — ${escapeHtml(shortUid(anonId))}</div>
          </div>
          <div class="panel95">
            <div class="group95">Навигация</div>
            <div class="row95"><label>Путь</label><div class="subject95">Форум › Пользователи › ${escapeHtml(shortUid(anonId))}</div></div>

            <div class="group95" style="margin-top:8px;">Профиль</div>
            <div class="row95" style="display:grid; grid-template-columns:260px 1fr; gap:8px;">
              <!-- Левая колонка -->
              <div>
                <div class="row95" style="display:block;">
                  <div class="subject95" style="margin-bottom:6px;">Аватар</div>
                  <div style="background:#fff; border:2px solid #fff; border-right-color:#808080; border-bottom-color:#808080; width:100%; aspect-ratio:1/1; overflow:hidden;">
                    <img src="https://picsum.photos/600?grayscale" alt="Аватар" style="display:block; width:100%; height:100%; object-fit:cover; image-rendering:pixelated;">
                  </div>
                </div>

                <div class="row95"><label>Ник</label><div class="subject95">User_${escapeHtml(shortUid(anonId))} <span style="color:#444; font-size:12px;">/ online</span></div></div>
                <div class="row95"><label>Статус</label><div class="subject95">«Личные выключены. Для общения — тред знакомств.»</div></div>

                <div class="group95" style="margin-top:8px;">Настройки</div>
                <div class="row95">
                  <label>Тред знакомств</label>
                  <label style="display:flex; align-items:center; gap:6px;">
                    <input id="introToggle" type="checkbox" ${getIntroEnabled(anonId) ? 'checked' : ''} />
                    <span id="introStateText">${getIntroEnabled(anonId) ? 'включен' : 'выключен'}</span>
                  </label>
                </div>
                <div class="row95" id="introLinkRow" style="${getIntroEnabled(anonId) ? '' : 'display:none'}">
                  <label>Ссылка</label>
                  <a class="subject95" href="thread.html?id=${encodeURIComponent('intro-' + anonId)}">Перейти в тред знакомств</a>
                </div>

                <div class="group95" style="margin-top:8px;">Соц</div>
                <div class="row95"><label>Подписчики</label><div class="subject95">${(314+fav.length+later.length+marks.length)}</div></div>
                <div class="row95"><label>Действие</label><button class="btn95" id="followBtn">Подписаться</button></div>
              </div>

              <!-- Правая колонка -->
              <div>
                <div class="group95">Вкладки</div>
                <div class="row95" role="tablist" aria-label="Вкладки профиля">
                  <button class="btn95 tab95" data-tab="threads" aria-selected="true">Треды</button>
                  <button class="btn95 tab95" data-tab="activity" aria-selected="false">Активность</button>
                  <button class="btn95 tab95" data-tab="about" aria-selected="false">О профиле</button>
                </div>

                <div class="group95" id="tab-threads">Стена — треды пользователя (${fav.length || 0})</div>
                <ul class="list95" id="threadsList">
                  ${fav.map(x => `<li><a href="thread.html?id=${encodeURIComponent(x.threadId)}">${escapeHtml(x.title||x.threadId||"(без названия)")}</a></li>`).join("") || "<li>Пусто</li>"}
                </ul>

                <div class="group95" id="tab-activity" style="display:none">Лента активности (${later.length || 0})</div>
                <ul class="list95" id="activityList" style="display:none">
                  ${later.map(x => `<li><a href="thread.html?id=${encodeURIComponent(x.threadId)}">Ответ в: ${escapeHtml(x.title||x.threadId||"(без названия)")}</a></li>`).join("") || "<li>Пока тишина</li>"}
                </ul>

                <div class="group95" id="tab-about" style="display:none">О профиле</div>
                <div class="row95" id="aboutRows" style="display:none">
                  <label>UID</label><input class="input95" value="${escapeAttr(anonId)}" readonly />
                </div>
              </div>
            </div>
          </div>
        </div></div>`;
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
