import {
  db, collection, addDoc, getDocs, deleteDoc, doc
} from "./firebase.js";

const list = document.getElementById("list");

window.addProduct = async () => {
  await addDoc(collection(db, "products"), {
    name: name.value,
    price: price.value,
    image: image.value
  });

  load();
};

async function load() {
  const snap = await getDocs(collection(db, "products"));
  list.innerHTML = "";

  snap.forEach(d => {
    const p = d.data();

    list.innerHTML += `
      <div class="card">
        <h3>${p.name}</h3>
        <p>${p.price}</p>
      </div>
    `;
  });
}

load();
