import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

/* =========================
FIRESTORE
========================= */
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================
AUTH (ADMIN LOGIN)
========================= */
import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* =========================
FIREBASE CONFIG
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyBLTQUBX-8S5HnNRJhN_mZ4UMlF6WYlQS0",
  authDomain: "freshora-store-38cef.firebaseapp.com",
  projectId: "freshora-store-38cef",
  storageBucket: "freshora-store-38cef.appspot.com",
  messagingSenderId: "836130122991",
  appId: "1:836130122991:web:31a2ea12dce7c5a44aff1a"
};

/* =========================
INIT APP
========================= */
const app = initializeApp(firebaseConfig);

/* =========================
SERVICES
========================= */
const db = getFirestore(app);
const auth = getAuth(app);

/* =========================
EXPORT
========================= */
export {
  app,
  db,
  auth,

  // firestore
  collection,
  onSnapshot,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  doc
};
