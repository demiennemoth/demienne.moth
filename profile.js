// profile.js — unchanged logic, but import utils.js is now present in project
import { db } from "./firebase.js";
import { escapeHtml, escapeAttr } from "./utils.js";
import {
  collection, collectionGroup, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

export async function mountProfile95(container){
  const anonId = localStorage.getItem("anon-id");
  if(!anonId){
    container.innerHTML = `<div class="window95" style="max-width:680px;margin:24px auto;">
      <div class="titlebar95"><div class="icon"></div><div class="title">Profile</div></div>
      <div class="panel95"><p>Ты не авторизован. Зайди в меню <b>Accession</b> и сгенерируй анонимный ID.</p></div>
    </div>`;
    return;
  }

  // ... keep rest of your original code (omitted for brevity) ...
  // I didn't change the data logic here; only ensured utils.js exists so imports won't fail.
}
