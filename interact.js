import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD0cCiWsbsYidFXgzmPmPlQ1CbDZ0aWfqY",
  authDomain: "mothdemienne.firebaseapp.com",
  projectId: "mothdemienne",
  storageBucket: "mothdemienne.appspot.com",
  messagingSenderId: "199511653439",
  appId: "1:199511653439:web:e659bc721c660d9340cc8a"
};

// Init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

const nicknameContainer = document.getElementById("nickname-container");
const forumContainer = document.getElementById("forum-container");

const nicknameInput = document.getElementById("nickname-input");
const saveNicknameBtn = document.getElementById("save-nickname");
const threadTitleInput = document.getElementById("thread-title");
const threadBodyInput = document.getElementById("thread-body");
const postThreadBtn = document.getElementById("post-thread");
const threadList = document.getElementById("thread-list");

let currentUser = null;

// Авторизация
signInAnonymously(auth)
  .then(() => console.log("Signed in anonymously"))
  .catch((error) => console.error("Auth error:", error));

// Проверка статуса
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDocs(collection(db, "users"));
    const existingUser = userSnap.docs.find(doc => doc.id === currentUser.uid);

    if (!existingUser) {
      nicknameContainer.style.display = "block";
      forumContainer.style.display = "none";
    } else {
      nicknameContainer.style.display = "none";
      forumContainer.style.display = "block";
      loadThreads();
    }
  }
});

// Сохранение ника
saveNicknameBtn.addEventListener("click", async () => {
  const nickname = nicknameInput.value.trim();
  if (!nickname) return alert("Enter nickname");

  await setDoc(doc(db, "users", currentUser.uid), {
    nickname,
    createdAt: serverTimestamp()
  });

  nicknameContainer.style.display = "none";
  forumContainer.style.display = "block";
  loadThreads();
});

// Загрузка тредов
async function loadThreads() {
  threadList.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "threads"));
  querySnapshot.forEach((doc) => {
    const thread = doc.data();
    const div = document.createElement("div");
    div.className = "thread";
    div.innerHTML = `<h3>${thread.title}</h3><p>${thread.body}</p><small>${new Date(thread.createdAt?.seconds * 1000).toLocaleString()}</small>`;
    threadList.appendChild(div);
  });
}

// Создание треда
postThreadBtn.addEventListener("click", async () => {
  const title = threadTitleInput.value.trim();
  const body = threadBodyInput.value.trim();
  if (!title || !body) return alert("Fill in both fields");

  await addDoc(collection(db, "threads"), {
    title,
    body,
    createdAt: serverTimestamp(),
    userId: currentUser.uid
  });

  threadTitleInput.value = "";
  threadBodyInput.value = "";
  loadThreads();
});
