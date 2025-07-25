
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore, doc, getDoc, collection, addDoc, getDocs, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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

// Получаем ID треда из URL
const params = new URLSearchParams(window.location.search);
const threadId = params.get("id");

const threadContent = document.getElementById("thread-content");
const replyText = document.getElementById("reply-text");
const replyBtn = document.getElementById("reply-btn");

async function loadThread() {
  if (!threadId) {
    threadContent.innerHTML = "<p>Thread not found.</p>";
    return;
  }

  const docRef = doc(db, "threads", threadId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    threadContent.innerHTML = "<p>Thread not found.</p>";
    return;
  }

  const data = docSnap.data();
  const html = `
    <div class="thread">
      <h2>${data.title}</h2>
      <p>${data.body}</p>
      <small>${new Date(data.createdAt?.seconds * 1000).toLocaleString()}</small>
    </div>
    <hr>
    <div id="replies"><h3>Replies:</h3></div>
  `;
  threadContent.innerHTML = html;

  loadReplies();
}

async function loadReplies() {
  const repliesContainer = document.getElementById("replies");
  repliesContainer.innerHTML += "<div id='reply-list'></div>";
  const replyList = document.getElementById("reply-list");

  const q = query(collection(db, "replies"), where("threadId", "==", threadId));
  const snapshot = await getDocs(q);

  snapshot.forEach((docSnap) => {
    const reply = docSnap.data();
    const div = document.createElement("div");
    div.className = "reply";
    div.innerHTML = `
      <p>${reply.body}</p>
      <small>${new Date(reply.createdAt?.seconds * 1000).toLocaleString()}</small>
    `;
    replyList.appendChild(div);
  });
}

replyBtn.addEventListener("click", async () => {
  const body = replyText.value.trim();
  if (!body) return alert("Write something");

  await addDoc(collection(db, "replies"), {
    threadId,
    body,
    createdAt: serverTimestamp()
  });

  replyText.value = "";
  loadReplies();
});

loadThread();
