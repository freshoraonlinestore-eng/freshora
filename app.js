import {
  db,
  collection,
  onSnapshot
} from "./firebase.js";

/* =========================
   ELEMENTS
========================= */

const productsDiv = document.getElementById("products");
const loadingScreen = document.getElementById("loadingScreen");
const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");

/* =========================
   STATE
========================= */

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allProducts = [];

/* =========================
   HELPERS
========================= */

function safeNumber(value) {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

function hideLoading() {
  if (!loadingScreen) return;

  loadingScreen.style.opacity = "0";
  setTimeout(() => {
    loadingScreen.style.display = "none";
  }, 300);
}

/* =========================
   DARK MODE (FIXED ICON)
========================= */

window.toggleDarkMode = function () {
  document.body.classList.toggle("dark");

  const dark = document.body.classList.contains("dark");
  localStorage.setItem("darkMode", dark);

  updateDarkIcon();
};

function updateDarkIcon() {
  const btn = document.getElementById("darkModeBtn");
  if (!btn) return;

  const dark = document.body.classList.contains("dark");

  btn.innerHTML = dark
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
}

/* =========================
   CART COUNT
========================= */

function updateCartCount() {
  const total = cart.reduce(
    (sum, item) => sum + safeNumber(item.qty),
    0
  );

  const el = document.getElementById("floatingCartCount");
  if (el) el.innerText = total;
}

/* =========================
   CART ACTIONS
========================= */

window.addToCart = function (id, name, price, image) {
  const existing = cart.find(i => i.id === id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id,
      name,
      price: safeNumber(price),
      image,
      qty: 1
    });
  }

  saveCart();
};

window.removeItem = function (index) {
  cart.splice(index, 1);
  saveCart();
};

window.increaseQty = function (index) {
  if (cart[index]) {
    cart[index].qty++;
    saveCart();
  }
};

window.decreaseQty = function (index) {
  if (!cart[index]) return;

  cart[index].qty--;

  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }

  saveCart();
};

window.clearCart = function () {
  if (!confirm("Clear cart?")) return;

  cart = [];
  saveCart();
};

/* =========================
   RENDER CART (SAFE + STABLE)
========================= */

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");

  if (!cartItems) return;

  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = `<p class="empty">Cart empty</p>`;
    if (cartTotal) cartTotal.innerText = "Total: Rs 0";
    return;
  }

  let total = 0;

  cart.forEach((item, index) => {
    const price = safeNumber(item.price);
    const qty = safeNumber(item.qty);

    total += price * qty;

    cartItems.innerHTML += `
      <div class="cart-item">

        <img src="${item.image}" />

        <div class="cart-details">
          <h4>${item.name}</h4>
          <p>Rs ${price.toLocaleString()}</p>

          <div class="qty-box">
            <button onclick="decreaseQty(${index})">-</button>
            <span>${qty}</span>
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
   CART TOGGLE (SMOOTH SAFE)
========================= */

window.toggleCart = function () {
  cartDrawer.classList.toggle("open");
  overlay.classList.toggle("show");

  document.body.style.overflow =
    cartDrawer.classList.contains("open") ? "hidden" : "auto";

  renderCart();
};

/* =========================
   WHATSAPP CHECKOUT (FULL IMPROVED FORMAT)
========================= */

window.checkout = function () {
  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  const name = document.getElementById("cusName")?.value?.trim() || "N/A";
  const phone = document.getElementById("cusPhone")?.value?.trim() || "N/A";
  const address = document.getElementById("cusAddress")?.value?.trim() || "N/A";

  const orderId = "FR-" + Date.now();
  const date = new Date().toLocaleString();

  let subtotal = 0;

  let message = `🟢 FRESHORA NEW ORDER 🟢\n\n`;
  message += `📦 Order ID: ${orderId}\n`;
  message += `📅 Date: ${date}\n\n`;

  message += `👤 CUSTOMER DETAILS\n`;
  message += `Name: ${name}\nPhone: ${phone}\nAddress: ${address}\n\n`;

  message += `🛒 ITEMS\n`;

  cart.forEach((item, i) => {
    const itemTotal = item.price * item.qty;
    subtotal += itemTotal;

    message += `${i + 1}) ${item.name} x${item.qty} = LKR ${itemTotal.toLocaleString()}\n`;
  });

  const delivery = 375;
  const total = subtotal + delivery;

  message += `\n💰 BILL SUMMARY\n`;
  message += `Subtotal: LKR ${subtotal.toLocaleString()}\n`;
  message += `Delivery: LKR ${delivery}\n`;
  message += `TOTAL: LKR ${total.toLocaleString()}\n\n`;

  message += `🚚 Payment: Cash on Delivery\n`;
  message += `📍 Freshora Online Store\n\n`;
  message += `🙏 Thank you for your order!`;

  const url = "https://wa.me/94752425790?text=" + encodeURIComponent(message);

  window.open(url, "_blank");
};

/* =========================
   PRODUCTS RENDER
========================= */

function renderProducts(products) {
  if (!productsDiv) return;

  productsDiv.innerHTML = "";

  products.forEach(p => {
    const price = safeNumber(p.price);
    const discount = safeNumber(p.discount);

    const finalPrice =
      discount > 0
        ? Math.round(price - (price * discount) / 100)
        : price;

    productsDiv.innerHTML += `
      <div class="card">

        <img src="${p.image}" />

        <div class="card-content">
          <h3>${p.name}</h3>

          <div class="price-box">
            <span class="new-price">
              Rs ${finalPrice.toLocaleString()}
            </span>
          </div>

          <div class="card-buttons">
            <button class="add-cart-btn"
              onclick="addToCart('${p.id}','${p.name}',${finalPrice},'${p.image}')">
              Add to Cart
            </button>
          </div>

        </div>

      </div>
    `;
  });
}

/* =========================
   FIREBASE
========================= */

onSnapshot(collection(db, "products"), snapshot => {
  allProducts = [];

  snapshot.forEach(doc => {
    allProducts.push({ id: doc.id, ...doc.data() });
  });

  renderProducts(allProducts);
  hideLoading();
});

/* =========================
   INIT
========================= */

window.addEventListener("DOMContentLoaded", () => {
  const dark = localStorage.getItem("darkMode") === "true";

  if (dark) document.body.classList.add("dark");

  updateDarkIcon();
  updateCartCount();
  renderCart();
});

window.addEventListener("load", () => {
  setTimeout(hideLoading, 1200);
});
