import {
  auth,
  onAuthStateChanged
} from "./firebase.js";

/* =========================
   PROTECTED ROUTE SYSTEM
========================= */

/*
  Usage:
  Add this script to ANY protected page:

  <script type="module" src="protected.js"></script>
*/

const PUBLIC_PAGES = [
  "login.html",
  "index.html",
  "",
  "/"
];

/* =========================
   CHECK AUTH STATE
========================= */
onAuthStateChanged(auth, (user) => {

  const currentPage =
    window.location.pathname.split("/").pop();

  const isPublic =
    PUBLIC_PAGES.includes(currentPage);

  /* =========================
     IF NOT LOGGED IN
  ========================= */
  if (!user) {

    if (!isPublic) {

      window.location.href = "login.html";
    }

    return;
  }

  /* =========================
     IF LOGGED IN
     → block login page access
  ========================= */
  if (user && currentPage === "login.html") {

    window.location.href = "admin.html";
  }
});
