// forum.js с полной валидацией, логами, try/catch и улучшенным отображением категорий
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, serverTimestamp, doc, setDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD0cCiWsbsYidFXgzmPmPlQ1CbDZ0aWfqY",
  authDomain: "mothdemienne.firebaseapp.com",
  projectId: "mothdemienne",
  storageBucket: "mothdemienne.appspot.com",
  messagingSenderId: "199511653439",
  appId: "1:199511653439:web:e659bc721c660d9340cc8a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;

const nicknameContainer = document.getElementById("nickname-container");
const nicknameInput = document.getElementById("nickname-input");
const saveNicknameBtn = document.getElementById("save-nickname");
const forumContainer = document.getElementById("forum-container");
const threadTitleInput = document.getElementById("thread-title");
const threadBodyInput = document.getElementById("thread-body");
const categoryInput = document.getElementById("thread-category");
const postThreadBtn = document.getElementById("post-thread");
const threadList = document.getElementById("thread-list");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    console.log("Пользователь авторизован:", user.uid);
    const userSnap = await getDocs(collection(db, "users"));
    const exists = userSnap.docs.some(doc => doc.id === currentUser.uid);

    if (!exists) {
      nicknameContainer.style.display = "block";
      forumContainer.style.display = "none";
    } else {
      nicknameContainer.style.display = "none";
      forumContainer.style.display = "block";
      loadThreads();
    }
  } else {
    console.warn("Пользователь не авторизован, пробуем анонимную авторизацию...");
    // Анонимка отключена, юзер должен войти через окно Profile
  }
});

saveNicknameBtn.addEventListener("click", async () => {
  const nickname = nicknameInput.value.trim();
  if (!nickname) {
    alert("Введите ник");
    console.warn("Ник пустой");
    return;
  }

  try {
    await setDoc(doc(db, "users", currentUser.uid), {
      nickname,
      createdAt: serverTimestamp()
    });
    console.log("Ник сохранён:", nickname);
    nicknameContainer.style.display = "none";
    forumContainer.style.display = "block";
    loadThreads();
  } catch (err) {
    console.error("Ошибка при сохранении ника:", err);
    alert("Не удалось сохранить ник. Проверь соединение.");
  }
});

async function loadThreads() {
  threadList.innerHTML = "";
  let querySnapshot;
  try {
    querySnapshot = await getDocs(collection(db, "threads"));
  } catch (err) {
    console.error("Ошибка при загрузке тредов:", err);
    alert("Не удалось загрузить треды");
    return;
  }

  const threadsByCategory = {};

  querySnapshot.forEach((docSnap) => {
    const thread = docSnap.data();
    const threadId = docSnap.id;
    const category = thread.category || "Без категории";

    if (!threadsByCategory[category]) {
      threadsByCategory[category] = [];
    }

    threadsByCategory[category].push({ id: threadId, ...thread });
  });

  for (const category in threadsByCategory) {
    const catBlock = document.createElement("div");
    catBlock.className = "category-block";
    catBlock.innerHTML = `<h2 style="color: orange">${category.toUpperCase()}</h2>`;

    threadsByCategory[category].forEach(thread => {
      const div = document.createElement("div");
      div.className = "thread-box";
      div.innerHTML = `
        <div class="thread-title">
          <a href="thread.html?id=${thread.id}">${thread.title}</a>
        </div>
        <div class="thread-id">No.${thread.id.slice(0, 6)}</div>
        <small>${thread.createdAt?.seconds ? new Date(thread.createdAt.seconds * 1000).toLocaleString() : ""}</small>
      `;
      catBlock.appendChild(div);
    });

    threadList.appendChild(catBlock);
  }
}

postThreadBtn.addEventListener("click", async () => {
  const title = threadTitleInput.value.trim();
  const body = threadBodyInput.value.trim();
  const category = categoryInput.value;

  if (!title || !body || !category) {
    alert("Все поля обязательны");
    console.warn("Не заполнены поля:", { title, body, category });
    return;
  }

  console.log("Создание треда...", { title, body, category });

  try {
    const docRef = await addDoc(collection(db, "threads"), {
      title,
      body,
      category,
      createdAt: serverTimestamp(),
      userId: currentUser?.uid || ""
    });
    console.log("Тред успешно создан:", docRef.id);

    threadTitleInput.value = "";
    threadBodyInput.value = "";
    categoryInput.value = "";

    setTimeout(() => loadThreads(), 600);
  } catch (err) {
    console.error("Ошибка при добавлении треда:", err);
    alert("Ошибка при создании треда. Проверь консоль.");
  }
});
