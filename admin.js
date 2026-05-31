import {
  db,
  collection,
  addDoc,
  onSnapshot
} from "./firebase.js";

const list = document.getElementById("list");

// ADD PRODUCT
window.addProduct = async () => {
  await addDoc(collection(db, "products"), {
    name: document.getElementById("name").value,
    price: document.getElementById("price").value,
    image: document.getElementById("image").value
  });

  // clear inputs
  name.value = "";
  price.value = "";
  image.value = "";
};

// REALTIME LOAD (IMPORTANT FIX)
onSnapshot(collection(db, "products"), (snap) => {
  list.innerHTML = "";

  snap.forEach((docItem) => {
    const p = docItem.data();

    list.innerHTML += `
      <div class="card">
        <h3>${p.name}</h3>
        <p>Rs ${p.price}</p>
      </div>
    `;
  });
});
