import {
  db,
  collection,
  onSnapshot
} from "./firebase.js";

/* =========================
SAFE HELPERS (NEW FIX)
========================= */

const $ = (id) => document.getElementById(id);

const safeEl = (id) => {
  const el = $(id);
  if (!el) console.warn("Missing element:", id);
  return el;
};

const productsDiv = safeEl("products");
const loadingScreen = safeEl("loadingScreen");
const cartDrawer = safeEl("cartDrawer");
const overlay = safeEl("overlay");

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let reviews = JSON.parse(localStorage.getItem("reviews")) || {};
let allProducts = [];

/* =========================
SAFE NUMBER
========================= */

const safeNumber = v => isNaN(Number(v)) ? 0 : Number(v);

/* =========================
SAVE FUNCTIONS
========================= */

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

function saveWishlist() {
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  renderProducts(allProducts);
}

function saveReviews() {
  localStorage.setItem("reviews", JSON.stringify(reviews));
}

/* =========================
DARK MODE (SAFE)
========================= */

window.toggleDarkMode = function () {
  document.body.classList.toggle("dark");

  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark")
  );

  const btn = safeEl("darkModeBtn");

  if (btn) {
    btn.innerHTML = document.body.classList.contains("dark")
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>';
  }
};

/* =========================
CART FIX
========================= */

function updateCartCount() {
  const total = cart.reduce((s, i) => s + safeNumber(i.qty), 0);
  const count = safeEl("floatingCartCount");

  if (count) count.innerText = total;
}

window.addToCart = function (id, name, price, image) {

  const ex = cart.find(i => i.id === id);

  if (ex) ex.qty++;
  else cart.push({ id, name, price: safeNumber(price), image, qty: 1 });

  saveCart();
};

window.removeItem = function (index) {
  cart.splice(index, 1);
  saveCart();
};

window.increaseQty = function (index) {
  if (!cart[index]) return;
  cart[index].qty++;
  saveCart();
};

window.decreaseQty = function (index) {
  if (!cart[index]) return;

  cart[index].qty--;
  if (cart[index].qty <= 0) cart.splice(index, 1);

  saveCart();
};

window.clearCart = function () {
  if (!confirm("Clear cart?")) return;
  cart = [];
  saveCart();
};

window.toggleCart = function () {

  if (!cartDrawer || !overlay) return;

  cartDrawer.classList.toggle("open");
  overlay.classList.toggle("show");

  document.body.style.overflow =
    cartDrawer.classList.contains("open")
      ? "hidden"
      : "auto";

  renderCart();
};

/* =========================
RENDER CART (SAFE)
========================= */

function renderCart() {

  const cartItems = safeEl("cartItems");
  const cartTotal = safeEl("cartTotal");

  if (!cartItems) return;

  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = `<p class="empty">Cart empty</p>`;
    if (cartTotal) cartTotal.innerText = "Total: Rs 0";
    return;
  }

  let total = 0;

  cart.forEach((item, index) => {

    const itemTotal = safeNumber(item.price) * safeNumber(item.qty);
    total += itemTotal;

    cartItems.innerHTML += `
      <div class="cart-item">

        <img src="${item.image}" />

        <div class="cart-details">
          <h4>${item.name}</h4>
          <p>Rs ${safeNumber(item.price).toLocaleString()}</p>

          <div class="qty-box">
            <button onclick="decreaseQty(${index})">-</button>
            <span>${item.qty}</span>
            <button onclick="increaseQty(${index})">+</button>
          </div>
        </div>

        <button class="remove-btn" onclick="removeItem(${index})">✕</button>
      </div>
    `;
  });

  if (cartTotal) {
    cartTotal.innerText = "Total: Rs " + total.toLocaleString();
  }
}

/* =========================
CHECKOUT SAFE
========================= */

window.checkout = function () {

  if (!cart.length) return alert("Cart is empty");

  const name = safeEl("cusName")?.value || "N/A";
  const phone = safeEl("cusPhone")?.value || "N/A";
  const address = safeEl("cusAddress")?.value || "N/A";

  let message = `🟢 ORDER\n\n`;

  cart.forEach((i, index) => {
    message += `${index + 1}) ${i.name} x${i.qty}\n`;
  });

  const url =
    "https://wa.me/94752425790?text=" +
    encodeURIComponent(message);

  window.open(url, "_blank");
};

/* =========================
WISHLIST FIX
========================= */

window.toggleWishlist = function (id) {

  wishlist = wishlist.includes(id)
    ? wishlist.filter(i => i !== id)
    : [...wishlist, id];

  saveWishlist();
};

/* =========================
PRODUCT RENDER SAFE
========================= */

function renderProducts(products) {

  if (!productsDiv) return;

  productsDiv.innerHTML = "";

  products.forEach(p => {

    const price = safeNumber(p.price);
    const discount = safeNumber(p.discount);

    const finalPrice = discount
      ? Math.round(price - (price * discount / 100))
      : price;

    productsDiv.innerHTML += `
      <div class="card">

        <button class="wishlist-btn"
          onclick="toggleWishlist('${p.id}')">
          <i class="fa-solid fa-heart"></i>
        </button>

        <img src="${p.image}" />

        <div class="card-content">

          <h3>${p.name}</h3>

          <div class="price-box">
            <span class="new-price">Rs ${finalPrice}</span>
          </div>

          <div class="card-buttons">

            <button class="view-btn"
              onclick="openModal(${JSON.stringify({ ...p, finalPrice })})">
              View
            </button>

            <button class="add-cart-btn"
              onclick="addToCart('${p.id}','${p.name}',${finalPrice},'${p.image}')">
              Add
            </button>

          </div>

        </div>
      </div>
    `;
  });
}

/* =========================
FIREBASE SAFE
========================= */

onSnapshot(collection(db, "products"), snap => {

  allProducts = [];

  snap.forEach(d => {
    allProducts.push({ id: d.id, ...d.data() });
  });

  renderProducts(allProducts);

  if (loadingScreen) loadingScreen.style.display = "none";
});

/* =========================
INIT FIX
========================= */

window.addEventListener("DOMContentLoaded", () => {

  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
  }

  updateCartCount();
  renderCart();
});
