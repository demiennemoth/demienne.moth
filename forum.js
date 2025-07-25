// Firebase init
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, serverTimestamp, doc, setDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// Firebase config
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

// UI Elements
const nicknameContainer = document.getElementById("nickname-container");
const nicknameInput = document.getElementById("nickname-input");
const saveNicknameBtn = document.getElementById("save-nickname");
const forumContainer = document.getElementById("forum-container");
const threadTitleInput = document.getElementById("thread-title");
const threadBodyInput = document.getElementById("thread-body");
const postThreadBtn = document.getElementById("post-thread");
const threadList = document.getElementById("thread-list");

let currentUser = null;

// Auth
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
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
    signInAnonymously(auth);
  }
});

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
