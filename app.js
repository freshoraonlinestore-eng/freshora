import { db, collection, onSnapshot } from "./firebase.js";

const productsDiv = document.getElementById("products");
const loadingScreen = document.getElementById("loadingScreen");
const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function safeNumber(value) { const num = Number(value); return isNaN(num) ? 0 : num; }
function saveCart() { localStorage.setItem("cart", JSON.stringify(cart)); updateCartCount(); renderCart(); }

window.toggleDarkMode = function () {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
  updateDarkIcon();
};

function updateDarkIcon() {
  const btn = document.getElementById("darkModeBtn");
  if (!btn) return;
  btn.innerHTML = document.body.classList.contains("dark") ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
}

function updateCartCount() {
  const el = document.getElementById("floatingCartCount");
  if (el) el.innerText = cart.reduce((sum, item) => sum + safeNumber(item.qty), 0);
}

window.addToCart = function (id, name, price, image) {
  const existing = cart.find(i => i.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ id, name, price: safeNumber(price), image, qty: 1 });
  saveCart();
};

window.removeItem = function (index) { cart.splice(index, 1); saveCart(); };
window.increaseQty = function (index) { cart[index].qty++; saveCart(); };
window.decreaseQty = function (index) {
  cart[index].qty--;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  saveCart();
};
window.clearCart = function () { if(confirm("Clear cart?")) { cart = []; saveCart(); } };

window.openModal = function(id, name, price, image) {
    document.getElementById("modalName").innerText = name;
    document.getElementById("modalPrice").innerText = "Rs " + price;
    document.getElementById("modalImage").src = image;
    document.getElementById("productModal").style.display = "block";
    document.getElementById("modalAddBtn").onclick = () => { addToCart(id, name, price, image); closeModal(); };
};

window.closeModal = function() { document.getElementById("productModal").style.display = "none"; };

window.toggleCart = function () {
  cartDrawer.classList.toggle("open");
  overlay.classList.toggle("show");
  renderCart();
};

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");
  if (!cartItems) return;
  cartItems.innerHTML = cart.length === 0 ? `<p class="empty">Cart empty</p>` : "";
  let total = 0;
  cart.forEach((item, index) => {
    total += item.price * item.qty;
    cartItems.innerHTML += `<div class="cart-item"><img src="${item.image}" /><div class="cart-details"><h4>${item.name}</h4><p>Rs ${item.price}</p><div class="qty-box"><button onclick="decreaseQty(${index})">-</button><span>${item.qty}</span><button onclick="increaseQty(${index})">+</button></div></div><button class="remove-btn" onclick="removeItem(${index})">✕</button></div>`;
  });
  cartTotal.innerText = "Total: Rs " + total.toLocaleString();
}

window.checkout = function () {
  const name = document.getElementById("cusName").value;
  if (!name) { alert("Please enter your name"); return; }
  let message = `Order from ${name}\n`;
  cart.forEach(item => message += `${item.name} x${item.qty}\n`);
  window.open("https://wa.me/94752425790?text=" + encodeURIComponent(message), "_blank");
};

onSnapshot(collection(db, "products"), snapshot => {
  productsDiv.innerHTML = "";
  snapshot.forEach(doc => {
    const p = doc.data();
    productsDiv.innerHTML += `<div class="card"><img src="${p.image}" onclick="openModal('${doc.id}','${p.name}',${p.price},'${p.image}')" /><div class="card-content"><h3>${p.name}</h3><span class="new-price">Rs ${p.price}</span><button class="add-cart-btn" onclick="addToCart('${doc.id}','${p.name}',${p.price},'${p.image}')">Add</button></div></div>`;
  });
  loadingScreen.style.display = "none";
});

window.addEventListener("DOMContentLoaded", () => { updateDarkIcon(); updateCartCount(); });
