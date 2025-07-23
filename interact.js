// === FIREBASE INIT ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD0cCiWsbsYidFXgzmPmPlQ1CbDZ0aWfqY",
  authDomain: "mothdemienne.firebaseapp.com",
  projectId: "mothdemienne",
  storageBucket: "mothdemienne.firebasestorage.app",
  messagingSenderId: "199511653439",
  appId: "1:199511653439:web:e659bc721c660d9340cc8a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Firebase initialized");

// === CARD LOGIC ===
const cards = [
  {
    name: "THE FOOL",
    image: "images/char_jester.png",
    desc: "You’ve opened it again... <strong>Why?</strong><br>This is your confession. Your inner garbage. Shameful, but without it — hollow."
  },
  {
    name: "BROKEN VESSEL",
    image: "images/char_brokenboy.png",
    desc: "Fragments of thought you always return to, like old infections. Trying to understand the world — breaking yourself instead."
  },
  {
    name: "LAUGHING PAIN",
    image: "images/char_smiletear.png",
    desc: "Why are you laughing? Oh right — hobbies. Broken joys you grip onto just to avoid falling apart."
  },
  {
    name: "SIMULATED CONSCIOUSNESS",
    image: "images/char_brain.png",
    desc: "What seems like theory may just be a bug. Nonsense hiding structure. Or structure hiding nonsense."
  },
  {
    name: "THE CONFINED",
    image: "images/char_confined.png",
    desc: "They think you're trapped. But you write — that means you exist. This is where blood on keys becomes chapters."
  },
  {
    name: "UNKNOWN ENTITY",
    image: "images/char_stitchedgirl.png",
    desc: "This isn't information. It's a virus. Lies that sound more convincing than truth. You clicked — now it's in you."
  }
];

let currentIndex = 0;

function updateCard() {
  const data = cards[currentIndex];
  document.getElementById('card-display').innerHTML = `
    <div class="card">
      <img src="${data.image}" alt="${data.name}">
      <p>${data.name}</p>
      <p>${data.desc}</p>
    </div>`;
  document.getElementById('char-name').textContent = data.name;
  document.getElementById('portrait').src = data.image;
  document.getElementById('char-desc').innerHTML = data.desc;
}

function nextCard() {
  currentIndex = (currentIndex + 1) % cards.length;
  updateCard();
}

function prevCard() {
  currentIndex = (currentIndex - 1 + cards.length) % cards.length;
  updateCard();
}

document.addEventListener('DOMContentLoaded', updateCard);




import {
  getAuth, signInAnonymously, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
  doc, setDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const auth = getAuth(app);
let currentUser = null;

const nicknameContainer = document.getElementById("nickname-container");
const nicknameInput = document.getElementById("nickname-input");
const saveNicknameBtn = document.getElementById("save-nickname");
const forumContainer = document.getElementById("forum-container");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const userDoc = doc(db, "users", user.uid);
    const snapshot = await getDocs(collection(db, "users"));
    let nicknameExists = false;
    snapshot.forEach((docu) => {
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
