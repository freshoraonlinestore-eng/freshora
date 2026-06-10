import {
  db,
  collection,
  onSnapshot,
} from "./firebase.js";

/* =========================
   ELEMENTS
========================= */

const productsDiv = document.getElementById("products");
const loadingScreen = document.getElementById("loadingScreen");
const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");
const cartBtn = document.querySelector(".floating-cart");
const searchInput = document.querySelector(".search-box input");

/* =========================
   STATE
========================= */

let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* =========================
   INIT
========================= */

window.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  renderCartCount();
  setupEvents();

  setTimeout(() => {
    if (loadingScreen) loadingScreen.style.display = "none";
  }, 800);
});

/* =========================
   FIREBASE
========================= */

function loadProducts() {
  const ref = collection(db, "products");

  onSnapshot(ref, (snapshot) => {
    products = [];
    snapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });

    renderProducts(products);
  });
}

/* =========================
   PRODUCTS
========================= */

function renderProducts(list) {
  productsDiv.innerHTML = "";

  list.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${p.image || 'https://via.placeholder.com/300'}">
      <h3>${p.name}</h3>
      <p>Rs. ${Number(p.price || 0)}</p>
      <button class="add-btn" data-id="${p.id}">Add to Cart</button>
    `;

    productsDiv.appendChild(card);
  });

  document.querySelectorAll(".add-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      addToCart(e.target.dataset.id);
    });
  });
}

/* =========================
   CART LOGIC
========================= */

function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  const existing = cart.find(i => i.id === id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      ...product,
      qty: 1,
      price: Number(product.price || 0)
    });
  }

  saveCart();
  renderCart();
  renderCartCount();
}

function increaseQty(id) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty++;
  saveCart();
  renderCart();
  renderCartCount();
}

function decreaseQty(id) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty--;

  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }

  saveCart();
  renderCart();
  renderCartCount();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
  renderCartCount();
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

/* =========================
   CART UI
========================= */

function openCart() {
  cartDrawer.classList.add("open");
  overlay.classList.add("active");
  renderCart();
}

function closeCart() {
  cartDrawer.classList.remove("open");
  overlay.classList.remove("active");
}

function toggleCart() {
  if (cartDrawer.classList.contains("open")) {
    closeCart();
  } else {
    openCart();
  }
}
window.toggleCart = toggleCart;

/* =========================
   RENDER CART
========================= */

function renderCart() {
  if (!cartDrawer) return;

  let total = 0;

  cartDrawer.innerHTML = `
    <h2>🛒 Your Cart</h2>
    <div id="cartItems"></div>
    <hr>
    <h3 class="cart-total"></h3>
    <button id="checkoutBtn" class="add-btn">Checkout WhatsApp</button>
  `;

  const container = document.getElementById("cartItems");

  if (cart.length === 0) {
    container.innerHTML = "<p style='padding:10px'>Cart is empty 😢</p>";
  }

  cart.forEach(item => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;

    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.justifyContent = "space-between";
    div.style.alignItems = "center";
    div.style.padding = "10px 0";

    div.innerHTML = `
      <div>
        <strong>${item.name}</strong><br>
        <small>Rs.${item.price} x ${item.qty} = Rs.${itemTotal}</small>
      </div>

      <div>
        <button data-id="${item.id}" class="dec">-</button>
        <button data-id="${item.id}" class="inc">+</button>
        <button data-id="${item.id}" class="remove">X</button>
      </div>
    `;

    container.appendChild(div);
  });

  const totalEl = cartDrawer.querySelector(".cart-total");
  if (totalEl) totalEl.innerText = "Total: Rs. " + total;

  cartDrawer.querySelectorAll(".inc").forEach(b =>
    b.onclick = () => increaseQty(b.dataset.id)
  );

  cartDrawer.querySelectorAll(".dec").forEach(b =>
    b.onclick = () => decreaseQty(b.dataset.id)
  );

  cartDrawer.querySelectorAll(".remove").forEach(b =>
    b.onclick = () => removeFromCart(b.dataset.id)
  );

  const btn = document.getElementById("checkoutBtn");
  if (btn) btn.onclick = checkout;
}

/* =========================
   CHECKOUT
========================= */

function checkout() {
  if (cart.length === 0) return alert("Cart is empty!");

  let message = "🛒 *Order Details*%0A%0A";
  let total = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;

    message += `• ${item.name} x${item.qty} = Rs.${itemTotal}%0A`;
  });

  message += `%0A💰 *Total: Rs.${total}*`;

  const phone = "94752425790";
  window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
}

/* =========================
   EVENTS
========================= */

function setupEvents() {
  cartBtn?.addEventListener("click", toggleCart);
  overlay?.addEventListener("click", closeCart);

  let timeout;

  searchInput?.addEventListener("input", (e) => {
    clearTimeout(timeout);

    timeout = setTimeout(() => {
      const value = e.target.value.toLowerCase();

      const filtered = products.filter(p =>
        (p.name || "").toLowerCase().includes(value)
      );

      renderProducts(filtered);
    }, 300);
  });
}

/* =========================
   CART COUNT (FIXED)
========================= */

function renderCartCount() {
  const count = cart.reduce((sum, i) => sum + i.qty, 0);

  const countEl = document.getElementById("floatingCartCount");
  if (countEl) countEl.innerText = count;
}

/* =========================
   GLOBAL EXPORT
========================= */

window.openCart = openCart;
window.closeCart = closeCart;
