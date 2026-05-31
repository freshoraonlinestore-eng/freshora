
const firebaseConfig = {
  apiKey: "AIzaSyBLTQUBX-8S5HnNRJhN_mZ4UMlF6WYlQS0",
  authDomain: "freshora-store-38cef.firebaseapp.com",
  projectId: "freshora-store-38cef",
  databaseURL: "https://freshora-store-38cef-default-rtdb.asia-southeast1.firebasedatabase.app",
  storageBucket: "freshora-store-38cef.appspot.com",
  messagingSenderId: "836130122991",
  appId: "1:836130122991:web:1b1bfe299cf424e14aff1a"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
