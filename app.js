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
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const priceFilter = document.getElementById("priceFilter");
const discountFilter = document.getElementById("discountFilter");

/* =========================
   STATE
========================= */

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let reviews = JSON.parse(localStorage.getItem("reviews")) || {};
let allProducts = [];

/* =========================
   HELPERS
========================= */

function safeNumber(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

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

function hideLoading() {
  if (!loadingScreen) return;
  loadingScreen.classList.add("hide");
  setTimeout(() => {
    loadingScreen.style.display = "none";
  }, 300);
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
  updateDarkIcon();
};

function updateDarkIcon() {
  const btn = document.getElementById("darkModeBtn");
  if (!btn) return;

  btn.innerHTML = document.body.classList.contains("dark")
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
}

/* =========================
   CART COUNT
========================= */

function updateCartCount() {
  const el = document.getElementById("floatingCartCount");
  const total = cart.reduce((s, i) => s + safeNumber(i.qty), 0);
  if (el) el.innerText = total;
}

/* =========================
   WISHLIST
========================= */

window.toggleWishlist = function (id) {
  if (wishlist.includes(id)) {
    wishlist = wishlist.filter(w => w !== id);
  } else {
    wishlist.push(id);
  }
  saveWishlist();
};

function isWishlisted(id) {
  return wishlist.includes(id);
}

/* =========================
   CART ACTIONS
========================= */

window.addToCart = function (id, name, price, image) {
  const item = cart.find(i => i.id === id);

  if (item) {
    item.qty += 1;
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

window.removeItem = function (i) {
  cart.splice(i, 1);
  saveCart();
};

window.increaseQty = function (i) {
  if (cart[i]) cart[i].qty++;
  saveCart();
};

window.decreaseQty = function (i) {
  if (!cart[i]) return;
  cart[i].qty--;
  if (cart[i].qty <= 0) cart.splice(i, 1);
  saveCart();
};

window.clearCart = function () {
  if (!confirm("Clear cart?")) return;
  cart = [];
  saveCart();
};

/* =========================
   CART TOGGLE
========================= */

window.toggleCart = function () {
  const open = cartDrawer.classList.toggle("open");
  overlay.classList.toggle("show");
  document.body.style.overflow = open ? "hidden" : "auto";
  renderCart();
};

/* =========================
   CART RENDER
========================= */

function renderCart() {
  const box = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");

  if (!box) return;

  box.innerHTML = "";

  if (cart.length === 0) {
    box.innerHTML = `<p class="empty">Cart empty</p>`;
    if (totalEl) totalEl.innerText = "Total: Rs 0";
    return;
  }

  let total = 0;

  cart.forEach((c, i) => {
    total += c.price * c.qty;

    box.innerHTML += `
      <div class="cart-item">
        <img src="${c.image || 'placeholder.png'}"/>
        <div class="cart-details">
          <h4>${c.name}</h4>
          <p>Rs ${c.price.toLocaleString()}</p>

          <div class="qty-box">
            <button onclick="decreaseQty(${i})">-</button>
            <span>${c.qty}</span>
            <button onclick="increaseQty(${i})">+</button>
          </div>
        </div>

        <button class="remove-btn" onclick="removeItem(${i})">✕</button>
      </div>
    `;
  });

  if (totalEl)
    totalEl.innerText = "Total: Rs " + total.toLocaleString();
}

/* =========================
   REVIEWS
========================= */

function getReviews(id) {
  return reviews[id] || [];
}

function avgRating(id) {
  const list = getReviews(id);
  if (!list.length) return 5;

  const sum = list.reduce((a, b) => a + safeNumber(b.rating), 0);
  return (sum / list.length).toFixed(1);
}

window.submitReview = function (id) {
  const text = document.getElementById("reviewText")?.value?.trim();
  const rating = document.getElementById("reviewRating")?.value;

  if (!text) return alert("Write review");

  if (!reviews[id]) reviews[id] = [];

  reviews[id].push({
    text,
    rating: safeNumber(rating),
    date: new Date().toLocaleDateString()
  });

  saveReviews();
  renderReviews(id);
  renderProducts(allProducts);
};

function renderReviews(id) {
  const box = document.getElementById("reviewList");
  if (!box) return;

  const list = getReviews(id);

  if (!list.length) {
    box.innerHTML = `<p class="empty-review">No reviews yet</p>`;
    return;
  }

  box.innerHTML = "";

  [...list].reverse().forEach(r => {
    box.innerHTML += `
      <div class="review-item">
        <div class="review-stars">${"⭐".repeat(r.rating)}</div>
        <p>${r.text}</p>
        <small>${r.date}</small>
      </div>
    `;
  });
}

/* =========================
   MODAL
========================= */

window.openModal = function (p) {
  const modal = document.getElementById("productModal");

  document.getElementById("modalImage").src = p.image;
  document.getElementById("modalName").innerText = p.name;
  document.getElementById("modalPrice").innerText =
    "Rs " + safeNumber(p.finalPrice).toLocaleString();

  document.getElementById("modalRatingText").innerText =
    avgRating(p.id);

  document.getElementById("modalAddBtn").onclick = () =>
    addToCart(p.id, p.name, p.finalPrice, p.image);

  document.getElementById("reviewSubmitBtn").onclick = () =>
    submitReview(p.id);

  renderReviews(p.id);

  modal.classList.add("show");
};

window.closeModal = function () {
  document.getElementById("productModal").classList.remove("show");
};

/* =========================
   PRODUCTS
========================= */

function renderProducts(list) {
  if (!productsDiv) return;

  productsDiv.innerHTML = "";

  list.forEach(p => {
    const price = safeNumber(p.price);
    const discount = safeNumber(p.discount);

    const finalPrice =
      discount > 0
        ? Math.round(price - (price * discount) / 100)
        : price;

    productsDiv.innerHTML += `
      <div class="card">

        ${
          discount > 0
            ? `<div class="discount-badge">-${discount}%</div>`
            : ""
        }

        <button class="wishlist-btn" onclick="toggleWishlist('${p.id}')">
          <i class="${
            isWishlisted(p.id) ? "fa-solid" : "fa-regular"
          } fa-heart"></i>
        </button>

        <img src="${p.image || 'placeholder.png'}"/>

        <div class="card-content">
          <h3>${p.name}</h3>

          <div class="rating-preview">⭐ ${avgRating(p.id)}</div>

          <div class="price-box">
            ${
              discount > 0
                ? `<span class="old-price">Rs ${price.toLocaleString()}</span>`
                : ""
            }
            <span class="new-price">Rs ${finalPrice.toLocaleString()}</span>
          </div>

          <div class="card-buttons">

            <button class="view-btn" onclick="openModalById('${p.id}')">
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
   MODAL BY ID (FIX)
========================= */

window.openModalById = function (id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;

  const price = safeNumber(p.price);
  const discount = safeNumber(p.discount);

  const finalPrice =
    discount > 0
      ? Math.round(price - (price * discount) / 100)
      : price;

  openModal({ ...p, finalPrice });
};

/* =========================
   FIREBASE
========================= */

onSnapshot(collection(db, "products"), snap => {
  allProducts = [];

  snap.forEach(d => {
    allProducts.push({ id: d.id, ...d.data() });
  });

  renderProducts(allProducts);
  hideLoading();
});

/* =========================
   FILTERS
========================= */

function filterProducts() {
  let f = [...allProducts];

  const s = searchInput?.value?.toLowerCase();
  if (s) f = f.filter(p => p.name?.toLowerCase().includes(s));

  const c = categoryFilter?.value;
  if (c && c !== "all")
    f = f.filter(p => (p.category || "").toLowerCase() === c.toLowerCase());

  const pr = safeNumber(priceFilter?.value);
  if (pr) f = f.filter(p => safeNumber(p.price) <= pr);

  const d = safeNumber(discountFilter?.value);
  if (d) f = f.filter(p => safeNumber(p.discount) >= d);

  renderProducts(f);
}

searchInput?.addEventListener("input", filterProducts);
categoryFilter?.addEventListener("change", filterProducts);
priceFilter?.addEventListener("change", filterProducts);
discountFilter?.addEventListener("change", filterProducts);

/* =========================
   INIT
========================= */

window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
  }

  updateDarkIcon();
  updateCartCount();
  renderCart();
});

window.addEventListener("load", () => setTimeout(hideLoading, 1000));

/* =========================
   ESC CLOSE
========================= */

window.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeModal();
    if (cartDrawer.classList.contains("open")) toggleCart();
  }
});

/* =========================
   IMAGE FALLBACK
========================= */

document.addEventListener(
  "error",
  e => {
    if (e.target.tagName === "IMG") {
      e.target.src = "placeholder.png";
    }
  },
  true
);
