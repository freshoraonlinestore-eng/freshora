import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

/* =========================
   FIREBASE CONFIG (YOUR PROJECT)
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyBLTQUBX-8S5HnNRJhN_mZ4UMlF6WYlQS0",
  authDomain: "freshora-store-38cef.firebaseapp.com",
  databaseURL: "https://freshora-store-38cef-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "freshora-store-38cef",
  storageBucket: "freshora-store-38cef.firebasestorage.app",
  messagingSenderId: "836130122991",
  appId: "1:836130122991:web:31a2ea12dce7c5a44aff1a",
  measurementId: "G-JSZYZF9EW0"
};

/* =========================
   INIT
========================= */
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

/* =========================
   EXPORTS
========================= */
export {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  ref,
  uploadBytes,
  getDownloadURL
};
