import {
  db,
  collection,
  onSnapshot,
  addDoc
} from "./firebase.js";

/* =========================
STATE
========================= */

const productsDiv = document.getElementById("products");
const loadingScreen = document.getElementById("loadingScreen");
const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let reviews = JSON.parse(localStorage.getItem("reviews")) || {};
let allProducts = [];

/* =========================
OPTIMIZED HELPERS
========================= */

const safeNumber = (v) => (isNaN(Number(v)) ? 0 : Number(v));

/* =========================
CACHE (PERFORMANCE BOOST)
========================= */

let wishSet = new Set(wishlist);

function syncWishSet() {
  wishSet = new Set(wishlist);
}

/* =========================
SAVE SYSTEMS
========================= */

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

function saveWishlist() {
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  syncWishSet();
  renderProducts(allProducts);
}

function saveReviews() {
  localStorage.setItem("reviews", JSON.stringify(reviews));
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
CART SYSTEM
========================= */

function updateCartCount() {
  const total = cart.reduce((s, i) => s + safeNumber(i.qty), 0);
  const count = document.getElementById("floatingCartCount");
  if (count) count.innerText = total;
}

window.addToCart = function (id, name, price, image) {
  const ex = cart.find(i => i.id === id);

  if (ex) {
    ex.qty++;
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
  if (!cart[index]) return;
  cart[index].qty++;
  saveCart();
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

window.toggleCart = function () {
  cartDrawer.classList.toggle("open");
  overlay.classList.toggle("show");

  document.body.style.overflow =
    cartDrawer.classList.contains("open") ? "hidden" : "auto";

  renderCart();
};

/* =========================
CART RENDER
========================= */

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");

  if (!cartItems) return;

  if (cart.length === 0) {
    cartItems.innerHTML = `<p class="empty">Cart empty</p>`;
    if (cartTotal) cartTotal.innerText = "Total: Rs 0";
    return;
  }

  let total = 0;
  let html = "";

  cart.forEach((item, index) => {
    const itemTotal = safeNumber(item.price) * safeNumber(item.qty);
    total += itemTotal;

    html += `
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

  cartItems.innerHTML = html;

  if (cartTotal) {
    cartTotal.innerText = "Total: Rs " + total.toLocaleString();
  }
}

/* =========================
CHECKOUT
========================= */

window.checkout = function () {
  if (!cart.length) return alert("Cart is empty");

  const name = document.getElementById("cusName")?.value || "N/A";
  const phone = document.getElementById("cusPhone")?.value || "N/A";
  const address = document.getElementById("cusAddress")?.value || "N/A";

  const orderId = "FR-" + Date.now();
  const date = new Date().toLocaleString();

  let subtotal = 0;

  let msg = `🟢 FRESHORA ORDER 🟢\n\n`;
  msg += `📦 Order ID: ${orderId}\n📅 ${date}\n\n`;
  msg += `👤 ${name} | ${phone}\n📍 ${address}\n\n`;
  msg += `🛒 ITEMS\n`;

  cart.forEach((i, idx) => {
    const itemTotal = i.price * i.qty;
    subtotal += itemTotal;
    msg += `${idx + 1}) ${i.name} x${i.qty} = LKR ${itemTotal.toLocaleString()}\n`;
  });

  const delivery = 375;
  const total = subtotal + delivery;

  msg += `\n💰 Subtotal: ${subtotal.toLocaleString()}`;
  msg += `\n🚚 Delivery: ${delivery}`;
  msg += `\nTOTAL: ${total.toLocaleString()}`;

  window.open(
    "https://wa.me/94752425790?text=" + encodeURIComponent(msg),
    "_blank"
  );
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

const isWishlisted = (id) => wishSet.has(id);

/* =========================
REVIEWS
========================= */

function getReviews(id) {
  return reviews[id] || [];
}

function avgRating(id) {
  const r = getReviews(id);
  if (!r.length) return 5;

  return (
    r.reduce((s, i) => s + safeNumber(i.rating), 0) / r.length
  ).toFixed(1);
}

function renderReviews(pid) {
  const box = document.getElementById("reviewList");
  if (!box) return;

  const list = getReviews(pid);

  if (!list.length) {
    box.innerHTML = `<p class="empty-review">No reviews yet</p>`;
    return;
  }

  box.innerHTML = list
    .slice()
    .reverse()
    .map(r => `
      <div class="review-item">
        <div class="review-stars">${"⭐".repeat(r.rating)}</div>
        <p>${r.text}</p>
        <small>${r.date}</small>
      </div>
    `)
    .join("");
}

window.submitReview = function (pid) {
  const text = document.getElementById("reviewText")?.value.trim();
  const rating = document.getElementById("reviewRating")?.value;

  if (!text) return alert("Write review");

  if (!reviews[pid]) reviews[pid] = [];

  reviews[pid].push({
    text,
    rating: safeNumber(rating),
    date: new Date().toLocaleDateString()
  });

  saveReviews();

  document.getElementById("reviewText").value = "";
  renderReviews(pid);
  renderProducts(allProducts);
};

/* =========================
SWIPE GALLERY
========================= */

function enableSwipeGallery(mainImg, images) {
  let currentIndex = 0;
  let startX = 0;

  function showImage(index) {
    if (!images.length) return;

    currentIndex = (index + images.length) % images.length;
    mainImg.src = images[currentIndex];

    mainImg.style.transform = "scale(.97)";
    setTimeout(() => (mainImg.style.transform = "scale(1)"), 120);
  }

  mainImg.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
  });

  mainImg.addEventListener("touchend", e => {
    const diff = startX - e.changedTouches[0].clientX;

    if (diff > 50) showImage(currentIndex + 1);
    else if (diff < -50) showImage(currentIndex - 1);
  });

  return showImage;
}

/* =========================
MODAL (SAFE VERSION)
========================= */

window.openModal = function (p) {
  const modal = document.getElementById("productModal");
  const mainImg = document.getElementById("modalImage");

  document.getElementById("modalName").innerText = p.name;
  document.getElementById("modalPrice").innerText =
    "Rs " + safeNumber(p.finalPrice).toLocaleString();

  document.getElementById("modalRatingText").innerText = avgRating(p.id);

  const gallery = document.getElementById("imageGallery");
  gallery.innerHTML = "";

  const images = p.images?.length ? p.images : [p.image];

  const swipe = enableSwipeGallery(mainImg, images);

  images.forEach(img => {
    const el = document.createElement("img");
    el.src = img;

    el.onclick = () => {
      mainImg.src = img;
    };

    gallery.appendChild(el);
  });

  swipe(0);

  document.getElementById("modalAddBtn").onclick = () =>
    addToCart(p.id, p.name, p.finalPrice, p.image);

  renderReviews(p.id);

  document.getElementById("reviewSubmitBtn").onclick = () =>
    submitReview(p.id);

  modal.classList.add("show");
};

window.closeModal = function () {
  document.getElementById("productModal")?.classList.remove("show");
};

/* =========================
PRODUCTS RENDER (OPTIMIZED)
========================= */

function renderProducts(products) {
  if (!productsDiv) return;

  let html = "";

  products.forEach(p => {
    const price = safeNumber(p.price);
    const discount = safeNumber(p.discount);

    const finalPrice = discount
      ? Math.round(price - (price * discount) / 100)
      : price;

    html += `
      <div class="card">

        ${
          discount > 0
            ? `<div class="discount-badge">-${discount}%</div>`
            : ""
        }

        <button class="wishlist-btn" onclick="toggleWishlist('${p.id}')">
          <i class="${isWishlisted(p.id) ? "fa-solid" : "fa-regular"} fa-heart"></i>
        </button>

        <img src="${p.image}" />

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

            <button class="view-btn" onclick="openModalById(this)" data-id="${p.id}">
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

  productsDiv.innerHTML = html;
}

/* =========================
SAFE MODAL OPEN (FIX)
========================= */

window.openModalById = function (el) {
  const id = el.getAttribute("data-id");
  const product = allProducts.find(p => p.id === id);

  if (!product) return;

  const price = safeNumber(product.price);
  const discount = safeNumber(product.discount);

  const finalPrice = discount
    ? Math.round(price - (price * discount) / 100)
    : price;

  openModal({ ...product, finalPrice });
};

/* =========================
FILTERS
========================= */

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const priceFilter = document.getElementById("priceFilter");
const discountFilter = document.getElementById("discountFilter");

function filterProducts() {
  let filtered = [...allProducts];

  const search = searchInput?.value?.toLowerCase().trim();

  if (search) {
    filtered = filtered.filter(p =>
      p.name?.toLowerCase().includes(search)
    );
  }

  if (categoryFilter?.value !== "all") {
    filtered = filtered.filter(p => p.category === categoryFilter.value);
  }

  if (priceFilter?.value !== "all") {
    filtered = filtered.filter(
      p => safeNumber(p.price) <= safeNumber(priceFilter.value)
    );
  }

  if (discountFilter?.value !== "all") {
    filtered = filtered.filter(
      p => safeNumber(p.discount) >= safeNumber(discountFilter.value)
    );
  }

  renderProducts(filtered);
}

searchInput?.addEventListener("input", filterProducts);
categoryFilter?.addEventListener("change", filterProducts);
priceFilter?.addEventListener("change", filterProducts);
discountFilter?.addEventListener("change", filterProducts);

/* =========================
FIREBASE
========================= */

onSnapshot(collection(db, "products"), snap => {
  allProducts = [];

  snap.forEach(d => {
    if (!d.exists()) return;

    allProducts.push({
      id: d.id,
      ...d.data()
    });
  });

  syncWishSet();
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
  updateDarkIcon();
  renderCart();
});

/* =========================
GLOBAL CLEANUP
========================= */

window.addEventListener("click", e => {
  const modal = document.getElementById("productModal");
  if (e.target === modal) closeModal();
});

window.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeModal();

    if (cartDrawer.classList.contains("open")) {
      toggleCart();
    }
  }
});

/* =========================
IMAGE FALLBACK
========================= */

document.addEventListener("error", e => {
  if (e.target.tagName === "IMG") {
    e.target.src = "placeholder.png";
  }
}, true);
