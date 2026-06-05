import {
  db,
  collection,
  onSnapshot
} from "./firebase.js";

/* =========================
   STATE
========================= */
const productsDiv = document.getElementById("products");

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let allProducts = [];

/* =========================
   SAFE TEXT
========================= */
function escapeHTML(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================
   TOAST
========================= */
function showToast(text) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerText = text;
  document.body.appendChild(t);

  setTimeout(() => t.classList.add("show"), 100);
  setTimeout(() => t.remove(), 2000);
}

/* =========================
   CART COUNT
========================= */
function updateCartCount() {
  const el = document.getElementById("floatingCartCount");
  if (!el) return;

  el.innerText = cart.reduce((s, i) => s + i.qty, 0);
}

/* =========================
   SAVE CART
========================= */
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

/* =========================
   ADD TO CART
========================= */
window.addToCart = function (id, name, price, image) {

  let item = cart.find(i => i.id === id);

  if (item) {
    item.qty++;
  } else {
    cart.push({
      id,
      name,
      price: Number(price),
      image,
      qty: 1
    });
  }

  saveCart();
  showToast("Added to cart");
};

/* =========================
   REMOVE ITEM
========================= */
window.removeFromCart = function (id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
};

/* =========================
   CART DRAWER
========================= */
window.toggleCart = function () {
  document.getElementById("cartDrawer")?.classList.toggle("open");
  document.getElementById("overlay")?.classList.toggle("show");
  renderCart();
};

/* =========================
   CART RENDER
========================= */
function renderCart() {

  const box = document.getElementById("cartItems");
  const totalBox = document.getElementById("cartTotal");

  if (!box || !totalBox) return;

  box.innerHTML = "";

  let total = 0;

  cart.forEach((i) => {

    total += i.price * i.qty;

    box.innerHTML += `
      <div class="cart-item">
        <img src="${i.image}" />

        <div>
          <h4>${escapeHTML(i.name)}</h4>
          <p>Rs ${i.price} x ${i.qty}</p>

          <button onclick="addToCart('${i.id}','${escapeHTML(i.name)}',${i.price},'${i.image}')">
            +
          </button>

          <button onclick="removeFromCart('${i.id}')">
            Remove
          </button>
        </div>
      </div>
    `;
  });

  totalBox.innerText = "Total: Rs " + total;

  // auto save sync
  localStorage.setItem("cart", JSON.stringify(cart));
}

/* =========================
   PRODUCTS RENDER
========================= */
function renderProducts(products) {

  if (!productsDiv) return;

  productsDiv.innerHTML = "";

  if (!products || products.length === 0) {
    productsDiv.innerHTML = "<p style='padding:20px'>No products found</p>";
    return;
  }

  products.forEach(p => {

    productsDiv.innerHTML += `
      <div class="card">

        <img src="${p.image}" loading="lazy" />

        <div class="card-content">

          <h3>${escapeHTML(p.name)}</h3>

          <p>Rs ${p.price}</p>

          <button onclick="addToCart('${p.id}','${escapeHTML(p.name)}',${p.price},'${p.image}')">
            Add to Cart
          </button>

        </div>

      </div>
    `;
  });
}

/* =========================
   FIREBASE PRODUCTS STREAM
========================= */
onSnapshot(
  collection(db, "products"),
  (snap) => {

    allProducts = [];

    snap.forEach(doc => {
      allProducts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    renderProducts(allProducts);
    updateCartCount();

  },
  (err) => {
    console.log("Firestore error:", err);
    showToast("Firebase error");
  }
);

/* =========================
   INIT
========================= */
window.addEventListener("load", () => {
  updateCartCount();
});
