import { db, collection, onSnapshot } from "./firebase.js";

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

/* =========================
STATE
========================= */
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allProducts = [];

/* =========================
UTILS
========================= */
const safeNumber = (v) => (isNaN(Number(v)) ? 0 : Number(v));

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

/* =========================
DARK MODE
========================= */
window.toggleDarkMode = function () {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
  const btn = safeEl("darkModeBtn");
  if (btn) {
    btn.innerHTML = document.body.classList.contains("dark")
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>';
  }
};

/* =========================
CART LOGIC
========================= */
function updateCartCount() {
  const count = safeEl("floatingCartCount");
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  if (count) count.innerText = totalQty;
}

window.addToCart = function (id, name, price, image) {
  const ex = cart.find((i) => i.id === id);
  if (ex) ex.qty++;
  else cart.push({ id, name, price: safeNumber(price), image, qty: 1 });
  saveCart();
};

window.removeItem = function (index) {
  cart.splice(index, 1);
  saveCart();
};

window.increaseQty = function (index) {
  cart[index].qty++;
  saveCart();
};

window.decreaseQty = function (index) {
  cart[index].qty--;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  saveCart();
};

window.toggleCart = function () {
  cartDrawer.classList.toggle("open");
  overlay.classList.toggle("show");
  document.body.style.overflow = cartDrawer.classList.contains("open") ? "hidden" : "auto";
};

/* =========================
RENDER FUNCTIONS
========================= */
function renderCart() {
  const cartItems = safeEl("cartItems");
  const cartTotal = safeEl("cartTotal");
  if (!cartItems) return;

  cartItems.innerHTML = cart.length === 0 ? `<p class="empty">Cart empty</p>` : "";
  let total = 0;

  cart.forEach((item, index) => {
    total += item.price * item.qty;
    cartItems.innerHTML += `
      <div class="cart-item" style="display:flex; justify-content:space-between; margin-bottom:10px;">
        <img src="${item.image}" width="50" />
        <div>
          <h4>${item.name}</h4>
          <p>Rs ${item.price} x ${item.qty}</p>
        </div>
        <button onclick="removeItem(${index})">✕</button>
      </div>`;
  });
  if (cartTotal) cartTotal.innerText = "Total: Rs " + total;
}

window.openModal = function (productStr) {
  const p = typeof productStr === 'string' ? JSON.parse(productStr) : productStr;
  modal.classList.add("open");
  overlay.classList.add("show");
  $("modalImage").src = p.image;
  $("modalName").innerText = p.name;
  $("modalPrice").innerText = "Rs " + p.finalPrice;
  $("modalAddBtn").onclick = () => addToCart(p.id, p.name, p.finalPrice, p.image);
};

window.closeModal = function () {
  modal.classList.remove("open");
  overlay.classList.remove("show");
};

function renderProducts(products) {
  if (!productsDiv) return;
  productsDiv.innerHTML = "";
  products.forEach((p) => {
    const finalPrice = p.discount ? Math.round(p.price - (p.price * p.discount) / 100) : p.price;
    const productData = JSON.stringify({ id: p.id, name: p.name, image: p.image, finalPrice });
    
    productsDiv.innerHTML += `
      <div class="card">
        <img src="${p.image}" />
        <h3>${p.name}</h3>
        <p>Rs ${finalPrice}</p>
        <button onclick='openModal(${JSON.stringify(productData)})'>View</button>
        <button onclick="addToCart('${p.id}','${p.name}',${finalPrice},'${p.image}')">Add</button>
      </div>`;
  });
}

/* =========================
INIT
========================= */
onSnapshot(collection(db, "products"), (snap) => {
  allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderProducts(allProducts);
  if (loadingScreen) loadingScreen.style.display = "none";
});

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "true") document.body.classList.add("dark");
  updateCartCount();
  renderCart();
  $("cartBtn").onclick = toggleCart;
  $("closeCart").onclick = toggleCart;
  $("closeModal").onclick = closeModal;
  overlay.onclick = () => { closeModal(); toggleCart(); };
});
