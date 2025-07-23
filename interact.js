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

