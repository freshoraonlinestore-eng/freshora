import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBLTQUBX-8S5HnNRJhN_mZ4UMlF6WYlQS0",
  authDomain: "freshora-store-38cef.firebaseapp.com",
  projectId: "freshora-store-38cef",
  storageBucket: "freshora-store-38cef.appspot.com",
  messagingSenderId: "836130122991",
  appId: "1:836130122991:web:1b1bfe299cf424e14aff1a1"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export {
  collection,
  onSnapshot,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
