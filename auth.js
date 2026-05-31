import {
  auth, signInWithEmailAndPassword
} from "./firebase.js";

window.login = async () => {
  let email = document.getElementById("email").value;
  let pass = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    window.location.href = "admin.html";
  } catch (e) {
    alert("Login Failed");
  }
};
