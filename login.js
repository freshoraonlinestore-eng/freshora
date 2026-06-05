import {
  auth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "./firebase.js";

/* =========================
   AUTO LOGIN CHECK
========================= */
onAuthStateChanged(auth, (user) => {

  if (user) {

    // already logged in
    window.location.href = "admin.html";
  }
});

/* =========================
   LOGIN FUNCTION
========================= */
window.login = async function () {

  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value.trim();

  const errorText =
    document.getElementById("errorText");

  /* CLEAR ERROR */
  errorText.innerText = "";

  /* VALIDATION */
  if (!email || !password) {

    errorText.innerText =
      "Please fill all fields";

    return;
  }

  try {

    /* LOGIN */
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    /* SUCCESS */
    errorText.style.color = "#00c853";
    errorText.innerText =
      "Login successful...";

    /* REDIRECT */
    setTimeout(() => {

      window.location.href =
        "admin.html";

    }, 1000);

  } catch (error) {

    console.log(error);

    /* ERROR MESSAGE */
    if (
      error.code ===
      "auth/invalid-credential"
    ) {

      errorText.innerText =
        "Invalid email or password";

    } else if (
      error.code ===
      "auth/invalid-email"
    ) {

      errorText.innerText =
        "Invalid email address";

    } else {

      errorText.innerText =
        "Login failed";
    }
  }
};

/* =========================
   ENTER KEY SUPPORT
========================= */
document.addEventListener(
  "keydown",
  (e) => {

    if (e.key === "Enter") {

      login();
    }
  }
);
