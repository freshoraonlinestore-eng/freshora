import { db, collection, onSnapshot } from "./firebase.js";

/* =========================
ELEMENTS
========================= */
const $ = (id) => document.getElementById(id);
const productsDiv = $("products");
const loadingScreen = $("loadingScreen");
const cartDrawer = $("cartDrawer");
const overlay = $("overlay");
const modal = $("productModal");

/* =========================
STATE
========================= */
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allProducts = [];

/* =========================
CART LOGIC
========================= */
function updateCartCount() {
  const count = $("floatingCartCount");
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  if (count) count.innerText = totalQty;
}

window.addToCart = function (id, name, price, image) {
  const ex = cart.find((i) => i.id === id);
  if (ex) ex.qty++;
  else cart.push({ id, name, price: Number(price), image, qty: 1 });
  saveCart();
};

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

/* =========================
RENDER FUNCTIONS
========================= */
function renderCart() {
  const cartItems = $("cartItems");
  const cartTotal = $("cartTotal");
  if (!cartItems) return;

  cartItems.innerHTML = cart.length === 0 ? `<p style="text-align:center; padding:20px;">Cart empty</p>` : "";
  let total = 0;

  cart.forEach((item, index) => {
    total += item.price * item.qty;
    cartItems.innerHTML += `
      <div class="cart-item" style="display:flex; align-items:center; gap:10px; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
        <img src="${item.image}" width="60" style="border-radius:8px;" />
        <div style="flex-grow:1;">
          <h4 style="margin:0;">${item.name}</h4>
          <p style="margin:0;">Rs ${item.price} x ${item.qty}</p>
        </div>
        <button onclick="removeItem(${index})" style="border:none; background:none; cursor:pointer;">✕</button>
      </div>`;
  });
  if (cartTotal) cartTotal.innerText = "Total: Rs " + total;
}

window.removeItem = function (index) {
  cart.splice(index, 1);
  saveCart();
};

window.toggleCart = function () {
  cartDrawer.classList.toggle("open");
  overlay.classList.toggle("show");
};

/* =========================
MODAL LOGIC
========================= */
window.openModal = function (productStr) {
  const p = typeof productStr === 'string' ? JSON.parse(productStr) : productStr;
  modal.classList.add("open");
  overlay.classList.add("show");
  $("modalImage").src = p.image;
  $("modalName").innerText = p.name;
  $("modalPrice").innerText = "Rs " + p.finalPrice;
  $("modalAddBtn").onclick = () => {
    addToCart(p.id, p.name, p.finalPrice, p.image);
    closeModal();
  };
};

function closeModal() {
  modal.classList.remove("open");
  overlay.classList.remove("show");
}

/* =========================
PRODUCT RENDER
========================= */
function renderProducts(products) {
  if (!productsDiv) return;
  productsDiv.innerHTML = "";
  products.forEach((p) => {
    const finalPrice = p.discount ? Math.round(p.price - (p.price * p.discount) / 100) : p.price;
    const productData = { id: p.id, name: p.name, image: p.image, finalPrice };
    
    productsDiv.innerHTML += `
      <div class="card">
        <img src="${p.image}" />
        <h3>${p.name}</h3>
        <p><span class="price-text">Rs ${finalPrice}</span> ${p.discount ? `<span class="old-price">Rs ${p.price}</span>` : ''}</p>
        <button class="add-cart-btn" onclick='openModal(${JSON.stringify(productData)})'>View / Add</button>
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
  updateCartCount();
  renderCart();
  $("cartBtn").onclick = toggleCart;
  $("closeCart").onclick = toggleCart;
  $("closeModal").onclick = closeModal;
  overlay.onclick = () => { closeModal(); if(cartDrawer.classList.contains("open")) toggleCart(); };
});
