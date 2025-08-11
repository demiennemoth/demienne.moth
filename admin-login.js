// admin-login.js — email/password login for admin
import { auth, adminSignIn, isAdmin, ADMIN_EMAIL } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const root = document.getElementById("login-root");

function renderForm(msg=""){
  root.innerHTML = `
    <div class="window95" style="max-width:520px; margin:40px auto;">
      <div class="titlebar95"><div class="icon"></div><div class="title">Вход администратора</div></div>
      <div class="panel95">
        <p>Вход только для <b>${ADMIN_EMAIL}</b></p>
        ${msg ? `<div class="alert95" style="margin-bottom:8px;">${msg}</div>`: ""}
        <div class="row95"><label>Email</label><input class="input95" id="email" type="email" placeholder="email" value="${ADMIN_EMAIL}"/></div>
        <div class="row95"><label>Пароль</label><input class="input95" id="pass" type="password" placeholder="пароль"/></div>
        <div style="display:flex; justify-content:flex-end; gap:8px;">
          <a class="btn95" href="index.html">Назад</a>
          <button class="btn95" id="go">Войти</button>
        </div>
        <p style="font-size:12px; opacity:.8; margin-top:8px;">Совет: включи Email/Password в консоли Firebase и создай аккаунт на этот email.</p>
      </div>
    </div>`;
  root.querySelector("#go").addEventListener("click", async ()=>{
    const email = root.querySelector("#email").value.trim();
    const pass = root.querySelector("#pass").value;
    try{
      await adminSignIn(email, pass);
      // state listener below will redirect if admin
    }catch(e){
      renderForm("Ошибка входа: " + (e?.message || e));
    }
  });
}

onAuthStateChanged(auth, (u)=>{
  if (isAdmin()) {
    location.href = "admin.html";
  } else {
    renderForm();
  }
});
