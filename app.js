import {
  db,
  collection,
  onSnapshot
} from "./firebase.js";

/* =========================
SAFE HELPERS
========================= */

const $ = (id) => document.getElementById(id);

const safeEl = (id) => {
  const el = $(id);
  if (!el) console.warn("Missing element:", id);
  return el;
};

/* =========================
ELEMENTS
========================= */

const productsDiv = safeEl("products");
const loadingScreen = safeEl("loadingScreen");
const cartDrawer = safeEl("cartDrawer");
const overlay = safeEl("overlay");

const modal = safeEl("productModal");
const modalImg = safeEl("modalImage");
const modalName = safeEl("modalName");
const modalPrice = safeEl("modalPrice");
const modalAddBtn = safeEl("modalAddBtn");

/* =========================
STATE
========================= */

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let allProducts = [];

/* =========================
UTILS
========================= */

const safeNumber = (v) => isNaN(Number(v)) ? 0 : Number(v);

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

function saveWishlist() {
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  renderProducts(allProducts);
}

/* =========================
OVERLAY CONTROL
========================= */

function closeAll() {
  cartDrawer?.classList.remove("open");
  modal?.classList.remove("open");
  overlay?.classList.remove("show");
  document.body.style.overflow = "auto";
}

/* overlay click */
if (overlay) {
  overlay.onclick = closeAll;
}

/* =========================
DARK MODE
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
CART
========================= */

function updateCartCount() {
  const count = safeEl("floatingCartCount");
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  if (count) count.innerText = totalQty;
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

  if (!cartDrawer) return;

  cartDrawer.classList.toggle("open");
  overlay?.classList.toggle("show");

  document.body.style.overflow =
    cartDrawer.classList.contains("open") ? "hidden" : "auto";

  renderCart();
};

/* =========================
CART RENDER
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

    const itemTotal = item.price * item.qty;
    total += itemTotal;

    cartItems.innerHTML += `
      <div class="cart-item">

        <img src="${item.image}" />

        <div class="cart-details">
          <h4>${item.name}</h4>
          <p>Rs ${item.price}</p>

          <div class="qty-box">
            <button onclick="decreaseQty(${index})">-</button>
            <span>${item.qty}</span>
            <button onclick="increaseQty(${index})">+</button>
          </div>
        </div>

        <button onclick="removeItem(${index})">✕</button>
      </div>
    `;
  });

  if (cartTotal) {
    cartTotal.innerText = "Total: Rs " + total;
  }
}

/* =========================
MODAL
========================= */

window.openModal = function (product) {

  if (!modal) return;

  modal.classList.add("open");
  overlay?.classList.add("show");

  modalImg.src = product.image;
  modalName.innerText = product.name;
  modalPrice.innerText = "Rs " + product.finalPrice;

  modalAddBtn.onclick = () => {
    addToCart(
      product.id,
      product.name,
      product.finalPrice,
      product.image
    );
  };

  document.body.style.overflow = "hidden";
};

window.closeModal = function () {
  modal?.classList.remove("open");
  overlay?.classList.remove("show");
  document.body.style.overflow = "auto";
};

/* =========================
WISHLIST
========================= */

window.toggleWishlist = function (id) {

  wishlist = wishlist.includes(id)
    ? wishlist.filter(i => i !== id)
    : [...wishlist, id];

  saveWishlist();
};

/* =========================
PRODUCT RENDER
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

        <button onclick="toggleWishlist('${p.id}')">
          ❤
        </button>

        <img src="${p.image}" />

        <h3>${p.name}</h3>

        <p>Rs ${finalPrice}</p>

        <button onclick='openModal(${JSON.stringify({
          id: p.id,
          name: p.name,
          image: p.image,
          finalPrice
        })})'>
          View
        </button>

        <button onclick="addToCart('${p.id}','${p.name}',${finalPrice},'${p.image}')">
          Add
        </button>

      </div>
    `;
  });
}

/* =========================
FIREBASE LOAD
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
INIT
========================= */

window.addEventListener("DOMContentLoaded", () => {

  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
  }

  updateCartCount();
  renderCart();
});
