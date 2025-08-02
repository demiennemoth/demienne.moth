// profile.js — регистрация и вход (ник + пароль через Firebase)
import { auth, db } from "./firebase.js";
import { 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { doc, setDoc, getDoc, serverTimestamp } 
  from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

export function mountProfileUI(container) {
  container.innerHTML = `
    <div id="auth-container" class="profile-form">
      <input type="text" id="nickname" placeholder="Ник">
      <input type="password" id="password" placeholder="Пароль">
      <button id="register-btn">Создать аккаунт</button>
      <button id="login-btn">Войти</button>
    </div>

    <div id="profile-container" style="display:none;">
      <h2 id="profile-nickname"></h2>
      <p id="profile-bio"></p>
      <button id="logout-btn">Выйти</button>
    </div>
  `;

  const regBtn = container.querySelector("#register-btn");
  const loginBtn = container.querySelector("#login-btn");
  const logoutBtn = container.querySelector("#logout-btn");

  regBtn.addEventListener("click", async () => {
    const nickname = container.querySelector("#nickname").value.trim();
    const password = container.querySelector("#password").value;
    if (!nickname || !password) return alert("Заполни оба поля!");

    const email = `${nickname}@anon.local`; // фейковый email
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", userCred.user.uid), {
        nickname,
        bio: "",
        createdAt: serverTimestamp(),
        diary: [],
        bookmarks: []
      });
      console.log("Аккаунт создан:", nickname);
    } catch (err) {
      console.error(err);
      alert("Ошибка при регистрации");
    }
  });

  loginBtn.addEventListener("click", async () => {
    const nickname = container.querySelector("#nickname").value.trim();
    const password = container.querySelector("#password").value;
    const email = `${nickname}@anon.local`;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Вход выполнен");
    } catch (err) {
      console.error(err);
      alert("Ошибка входа");
    }
  });

  logoutBtn.addEventListener("click", () => {
    signOut(auth);
  });

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      container.querySelector("#auth-container").style.display = "none";
      container.querySelector("#profile-container").style.display = "block";
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        container.querySelector("#profile-nickname").textContent = snap.data().nickname;
        container.querySelector("#profile-bio").textContent = snap.data().bio || "";
      }
    } else {
      container.querySelector("#auth-container").style.display = "block";
      container.querySelector("#profile-container").style.display = "none";
    }
  });
}
