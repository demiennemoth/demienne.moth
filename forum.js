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

const nicknameContainer = document.getElementById("nickname-container");
const nicknameInput = document.getElementById("nickname-input");
const saveNicknameBtn = document.getElementById("save-nickname");
const forumContainer = document.getElementById("forum-container");

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const userDoc = doc(db, "users", user.uid);
    const userSnap = await getDocs(collection(db, "users"));

    let nicknameExists = false;
    userSnap.forEach((docu) => {
      if (docu.id === user.uid) nicknameExists = true;
    });

    if (!nicknameExists) {
      nicknameContainer.style.display = "block";
    } else {
      nicknameContainer.style.display = "none";
      forumContainer.style.display = "block";
      loadThreads();
    }
  } else {
    signInAnonymously(auth);
  }
});

saveNicknameBtn.onclick = async () => {
  const nickname = nicknameInput.value.trim();
  if (!nickname) return;
  await setDoc(doc(db, "users", currentUser.uid), {
    name: nickname,
    createdAt: serverTimestamp(),
    uid: currentUser.uid,
  });
  nicknameContainer.style.display = "none";
  forumContainer.style.display = "block";
  loadThreads();
};

async function loadThreads() {
  const threadList = document.getElementById("thread-list");
  threadList.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "threads"));
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const div = document.createElement("div");
    div.classList.add("thread");
    div.innerHTML = `<h2>${data.title}</h2><p>${data.body}</p>`;
    threadList.appendChild(div);
  });
}

document.getElementById("post-thread").onclick = async () => {
  const title = document.getElementById("thread-title").value;
  const body = document.getElementById("thread-body").value;
  if (!title || !body) return;
  await addDoc(collection(db, "threads"), {
    title,
    body,
    createdAt: serverTimestamp(),
    authorId: currentUser.uid,
    category: "general"
  });
  document.getElementById("thread-title").value = "";
  document.getElementById("thread-body").value = "";
  loadThreads();
};
