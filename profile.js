// profile.js — FIXED: waits for auth, shows anon profile, simple lists
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
  collection, getDocs, query, orderBy, limit, doc, getDoc, setDoc, updateDoc, getCountFromServer
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
    // Apply listeners (only when owner)
    if(isSelf){
      const userRef = doc(db, 'users', uid);
      async function safeUpdate(data){
        try{
          const snap = await getDoc(userRef);
          if(snap.exists()) await updateDoc(userRef, data);
          else await setDoc(userRef, data, {merge:true});
        }catch(e){ console.error('save failed', e); alert('Не удалось сохранить. Проверь консоль.'); }
      }
      const nameInput = container.querySelector('#displayNameInput');
      const nameView = container.querySelector('#displayNameView');
      const saveNameBtn = container.querySelector('#saveNameBtn');
      saveNameBtn && saveNameBtn.addEventListener('click', async ()=>{
        const v = (nameInput?.value||'').trim();
        await safeUpdate({ displayName: v });
        if(nameView) nameView.innerHTML = escapeHtml(v) + ' <span style="color:#444; font-size:12px;">/ online</span>';
      });

      const statusInput = container.querySelector('#statusInput');
      const statusView = container.querySelector('#statusView');
      const saveStatusBtn = container.querySelector('#saveStatusBtn');
      saveStatusBtn && saveStatusBtn.addEventListener('click', async ()=>{
        const v = (statusInput?.value||'').trim();
        await safeUpdate({ status: v });
        if(statusView) statusView.textContent = v;
      });

      const aboutInput = container.querySelector('#aboutInput');
      const saveAboutBtn = container.querySelector('#saveAboutBtn');
      saveAboutBtn && saveAboutBtn.addEventListener('click', async ()=>{
        await safeUpdate({ about: (aboutInput?.value||'') });
        alert('Раздел "О себе" сохранён.');
      });

      const avatarInput = container.querySelector('#avatarInput');
      const saveAvatarBtn = container.querySelector('#saveAvatarBtn');
      saveAvatarBtn && saveAvatarBtn.addEventListener('click', async ()=>{
        const v = (avatarInput?.value||'').trim();
        await safeUpdate({ avatarUrl: v });
        const img = container.querySelector('img[alt="Аватар"]');
        if(img) img.src = v || img.src;
      });
    }

    // Replace breadcrumb with working link + correct label
    const crumbs = container.querySelector('.group95 + .row95 .subject95');
    if(crumbs){
      // already inserted correct markup with link
    }

    // Follow button only if viewing other user
    if(!isSelf){
      const followBtn = container.querySelector('#followBtn');
      followBtn && followBtn.addEventListener('click', async ()=>{
        // TODO: implement real follow. For now, just visual.
        const pressed = followBtn.getAttribute('aria-pressed') === 'true';
        followBtn.setAttribute('aria-pressed', String(!pressed));
        followBtn.textContent = pressed ? 'Подписаться' : 'Вы подписаны';
      });
    }


  onAuthStateChanged(auth, async (u) => {
    // determine whose profile to show
    const params = new URLSearchParams(location.search);
    const selfUid = u && u.uid;
    const viewedUid = params.get('uid') || selfUid;
    const isSelf = viewedUid === selfUid;
    if(!u){
      // Still no user — let anon sign-in happen and retry automatically by onAuthStateChanged
      container.innerHTML = `
        <div class="window95" style="max-width:720px; margin:24px auto;">
          <div class="titlebar95"><div class="icon"></div><div class="title">Profile</div></div>
          <div class="panel95"><p>Подключаю анонимный профиль… обнови страницу, если долго висит.</p></div>
        </div>`;
      return;
    }
    const anonId = selfUid; // backwards compat
    const uid = viewedUid;
    try{
      const [fav, later, marks] = await Promise.all([
        listDocs(`users/${uid}/favorites`, "addedAt"),
        listDocs(`users/${uid}/readlater`, "addedAt"),
        listDocs(`users/${uid}/bookmarks`, "addedAt"),
      ]);

      // Load profile document and followers count
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      const profile = userSnap.exists() ? userSnap.data() : {};
      const displayName = profile.displayName || ('User_' + shortUid(uid));
      const statusText = profile.status || '«Личные выключены. Для общения — тред знакомств.»';
      const aboutText = profile.about || '';
      const avatarUrl = profile.avatarUrl || 'https://picsum.photos/600?grayscale';

      // Followers count (real), uses aggregate count if available; falls back to getDocs length
      let followersCount = 0;
      try{
        const cnt = await getCountFromServer(collection(db, `users/${uid}/followers`));
        followersCount = cnt.data().count || 0;
      }catch(_){
        try{
          const s = await getDocs(collection(db, `users/${uid}/followers`));
          followersCount = s.size;
        }catch(__){ followersCount = 0; }
      }

      container.innerHTML = `
        <div class="window95" style="max-width:980px; margin:24px auto 60px;">
          <div class="titlebar95">
            <div class="icon"></div>
            <div class="title">Профиль — ${escapeHtml(shortUid(anonId))}</div>
          </div>
          <div class="panel95">
            <div class="group95">Навигация</div>
            <div class="row95"><label>Путь</label><div class="subject95">Форум › Пользователь · <a class="subject95" href="index.html">вернуться в форум</a></div></div>

            <div class="group95" style="margin-top:8px;">Профиль</div>
            <div class="row95" style="display:grid; grid-template-columns:260px 1fr; gap:8px;">
              <!-- Левая колонка -->
              <div>
                <div class="row95" style="display:block;">
                  <div class="subject95" style="margin-bottom:6px;">Аватар</div>
                  <div style="background:#fff; border:2px solid #fff; border-right-color:#808080; border-bottom-color:#808080; width:100%; aspect-ratio:1/1; overflow:hidden;">
                    <img src="${escapeAttr(avatarUrl)}" alt="Аватар" style="display:block; width:100%; height:100%; object-fit:cover; image-rendering:pixelated;">
                  </div>
                </div>

                <div class="row95"><label>Ник</label><div class="subject95" id="displayNameView">${escapeHtml(displayName)} <span style="color:#444; font-size:12px;">/ online</span></div></div>
                <div class="row95"><label>Статус</label><div class="subject95" id="statusView">${escapeHtml(statusText)}</div></div>

                ${isSelf ? '<div class="group95" style="margin-top:8px;">Настройки</div>' : ""}
                ${isSelf ? '<div class="row95">': "<div style=\"display:none\">"}
                  <label>Тред знакомств</label>
                  <label style="display:flex; align-items:center; gap:6px;">
                    <input id="introToggle" type="checkbox" ${getIntroEnabled(anonId) ? 'checked' : ''} />
                    <span id="introStateText">${getIntroEnabled(anonId) ? 'включен' : 'выключен'}</span>
                  </label>
                </div>
                ${isSelf ? '<div class="row95" id="introLinkRow' : '<div id="introLinkRow' style="${getIntroEnabled(anonId) ? '' : 'display:none'}">
                  <label>Ссылка</label>
                  <a class="subject95" href="thread.html?id=${encodeURIComponent('intro-' + uid)}">Перейти в тред знакомств</a>
                </div>

                <div class="group95" style="margin-top:8px;">Соц</div>
                <div class="row95"><label>Подписчики</label><div class="subject95" id="followersCount">${followersCount}</div></div>
                ${isSelf ? "" : '<div class="row95"><label>Действие</label><button class="btn95" id="followBtn">Подписаться</button></div>'}
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
                <div class="row95" id="aboutRows" style="display:none; display:grid; grid-template-columns:160px 1fr; gap:6px;">
                  <label>UID</label><input class="input95" value="${escapeAttr(uid)}" readonly />

                  <label>Имя</label>
                  <div>
                    <input class="input95" id="displayNameInput" value="${escapeAttr(displayName)}" ${isSelf ? '' : 'readonly'} />
                    ${isSelf ? '<button class="btn95" id="saveNameBtn" style="margin-left:6px;">Сохранить</button>' : ''}
                  </div>

                  <label>Статус</label>
                  <div>
                    <input class="input95" id="statusInput" value="${escapeAttr(statusText)}" ${isSelf ? '' : 'readonly'} />
                    ${isSelf ? '<button class="btn95" id="saveStatusBtn" style="margin-left:6px;">Сохранить</button>' : ''}
                  </div>

                  <label>О себе</label>
                  <div>
                    <textarea class="input95" id="aboutInput" rows="4" ${isSelf ? '' : 'readonly'}>${escapeHtml(aboutText)}</textarea>
                    ${isSelf ? '<button class="btn95" id="saveAboutBtn" style="margin-left:6px; margin-top:6px;">Сохранить</button>' : ''}
                  </div>

                  <label>Аватар (URL)</label>
                  <div>
                    <input class="input95" id="avatarInput" value="${escapeAttr(avatarUrl)}" ${isSelf ? '' : 'readonly'} />
                    ${isSelf ? '<button class="btn95" id="saveAvatarBtn" style="margin-left:6px;">Сохранить</button>' : ''}
                  </div>
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
