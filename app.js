import { db, collection, onSnapshot } from "./firebase.js";

const productsDiv = document.getElementById("products");

onSnapshot(collection(db, "products"), (snap) => {

  console.log("DATA LOADED:", snap.size);

  productsDiv.innerHTML = "";

  snap.forEach((docItem) => {
    const p = docItem.data();

    productsDiv.innerHTML += `
      <div class="card">
        <img src="${p.image}">
        <h3>${p.name}</h3>
        <p>Rs ${p.price}</p>

        <button onclick="order('${p.name}','${p.price}')">
          Order
        </button>
      </div>
    `;
  });
});

window.order = (name, price) => {
  const msg = `I want to order: ${name} - Rs ${price}`;
  window.open("https://wa.me/94752425790?text=" + msg);
};
