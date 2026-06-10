import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBLTQUBX-8S5HnNRJhN_mZ4UMlF6WYlQS0",
  authDomain: "freshora-store-38cef.firebaseapp.com",
  projectId: "freshora-store-38cef",
  storageBucket: "freshora-store-38cef.appspot.com",
  messagingSenderId: "836130122991",
  appId: "1:836130122991:web:31a2ea12dce7c5a44aff1a"
};

// Initialize App
const app = initializeApp(firebaseConfig);

// Firestore DB
const db = getFirestore(app);

// Export everything needed
export {
  app,
  db,
  collection,
  onSnapshot,
  addDoc,
  getDocs,
  query,
  where,
  orderBy
};
