import { db, collection, onSnapshot } from "./firebase.js";

const $ = (id) => document.getElementById(id);
const productsDiv = $("products");

function renderProducts(products) {
  productsDiv.innerHTML = "";
  products.forEach(p => {
    productsDiv.innerHTML += `
      <div class="card">
        <img src="${p.image}" />
        <h3>${p.name}</h3>
        <p>Rs ${p.price}</p>
        <button class="add-cart-btn" onclick='openModal(${JSON.stringify(p)})'>View Product</button>
      </div>`;
  });
}

window.openModal = function (p) {
  $("productModal").classList.add("open");
  $("modalImage").src = p.image;
  $("modalName").innerText = p.name;
  $("modalPrice").innerText = "Rs " + p.price;
};

$("closeModal").onclick = () => $("productModal").classList.remove("open");

onSnapshot(collection(db, "products"), (snap) => {
  let products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderProducts(products);
});
