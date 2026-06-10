import {
  db,
  collection,
  onSnapshot,
  addDoc
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
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let reviews = JSON.parse(localStorage.getItem("reviews")) || {};
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

function saveWishlist() {
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  renderProducts(allProducts);
}

function saveReviews() {
  localStorage.setItem("reviews", JSON.stringify(reviews));
}

function hideLoading() {
  if (!loadingScreen) return;
  loadingScreen.style.opacity = "0";
  setTimeout(() => { loadingScreen.style.display = "none"; }, 300);
}

/* =========================
   DARK MODE
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
  btn.innerHTML = dark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
}

/* =========================
   CART COUNT & WISHLIST
========================= */

function updateCartCount() {
  const total = cart.reduce((sum, item) => sum + safeNumber(item.qty), 0);
  const el = document.getElementById("floatingCartCount");
  if (el) el.innerText = total;
}

window.toggleWishlist = function (id) {
  const exists = wishlist.includes(id);
  wishlist = exists ? wishlist.filter(i => i !== id) : [...wishlist, id];
  saveWishlist();
};

function isWishlisted(id) {
  return wishlist.includes(id);
}

/* =========================
   REVIEWS
========================= */

function getProductReviews(productId) { return reviews[productId] || []; }

function getAverageRating(productId) {
  const list = getProductReviews(productId);
  if (list.length === 0) return 5;
  const total = list.reduce((sum, r) => sum + safeNumber(r.rating), 0);
  return (total / list.length).toFixed(1);
}

window.submitReview = function (productId) {
  const input = document.getElementById("reviewText");
  const rating = document.getElementById("reviewRating");
  if (!input || !rating) return;
  const text = input.value.trim();
  if (text === "") { alert("Please write a review"); return; }

  if (!reviews[productId]) reviews[productId] = [];
  reviews[productId].push({ text, rating: safeNumber(rating.value), date: new Date().toLocaleDateString() });
  
  saveReviews();
  input.value = "";
  renderReviews(productId);
  renderProducts(allProducts);
};

function renderReviews(productId) {
  const reviewList = document.getElementById("reviewList");
  if (!reviewList) return;
  const list = getProductReviews(productId);
  if (list.length === 0) { reviewList.innerHTML = `<p class="empty-review">No reviews yet</p>`; return; }
  reviewList.innerHTML = list.slice().reverse().map(r => `
    <div class="review-item">
      <div class="review-stars">${"⭐".repeat(r.rating)}</div>
      <p>${r.text}</p>
      <small>${r.date}</small>
    </div>
  `).join("");
}

/* =========================
   CART LOGIC
========================= */

window.addToCart = function (id, name, price, image) {
  const existing = cart.find(i => i.id === id);
  if (existing) { existing.qty += 1; } 
  else { cart.push({ id, name, price: safeNumber(price), image, qty: 1 }); }
  saveCart();
};

window.removeItem = function (index) { cart.splice(index, 1); saveCart(); };
window.increaseQty = function (index) { cart[index].qty++; saveCart(); };
window.decreaseQty = function (index) {
  cart[index].qty--;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  saveCart();
};

window.clearCart = function () {
  if (!confirm("Clear cart?")) return;
  cart = []; saveCart();
};

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");
  if (!cartItems) return;

  if (cart.length === 0) {
    cartItems.innerHTML = `<p class="empty">Cart empty</p>`;
    cartTotal.innerText = "Total: Rs 0";
    return;
  }

  let total = 0;
  cartItems.innerHTML = cart.map((item, index) => {
    total += item.price * item.qty;
    return `
      <div class="cart-item">
        <img src="${item.image}" />
        <div class="cart-details">
          <h4>${item.name}</h4>
          <p>Rs ${item.price.toLocaleString()}</p>
          <div class="qty-box">
            <button onclick="decreaseQty(${index})">-</button>
            <span>${item.qty}</span>
            <button onclick="increaseQty(${index})">+</button>
          </div>
        </div>
        <button class="remove-btn" onclick="removeItem(${index})">✕</button>
      </div>`;
  }).join("");
  cartTotal.innerText = "Total: Rs " + total.toLocaleString();
}

window.toggleCart = function () {
  cartDrawer.classList.toggle("open");
  overlay.classList.toggle("show");
  document.body.style.overflow = cartDrawer.classList.contains("open") ? "hidden" : "auto";
};

/* =========================
   PRODUCT MODAL
========================= */

window.openModal = function (productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById("productModal");
  const finalPrice = product.discount > 0 ? Math.round(product.price - (product.price * product.discount) / 100) : product.price;

  document.getElementById("modalImage").src = product.image;
  document.getElementById("modalName").innerText = product.name;
  document.getElementById("modalPrice").innerText = "Rs " + finalPrice.toLocaleString();
  document.getElementById("modalRatingText").innerText = getAverageRating(product.id);
  
  document.getElementById("modalAddBtn").onclick = () => addToCart(product.id, product.name, finalPrice, product.image);
  document.getElementById("reviewSubmitBtn").onclick = () => submitReview(product.id);
  
  renderReviews(product.id);
  modal.classList.add("show");
};

window.closeModal = function () { document.getElementById("productModal").classList.remove("show"); };

/* =========================
   PRODUCTS RENDER
========================= */

function renderProducts(products) {
  if (!productsDiv) return;
  productsDiv.innerHTML = products.map(p => {
    const price = safeNumber(p.price);
    const finalPrice = p.discount > 0 ? Math.round(price - (price * p.discount) / 100) : price;
    return `
      <div class="card">
        ${p.discount > 0 ? `<div class="discount-badge">-${p.discount}%</div>` : ""}
        <button class="wishlist-btn" onclick="toggleWishlist('${p.id}')">
          <i class="${isWishlisted(p.id) ? "fa-solid" : "fa-regular"} fa-heart"></i>
        </button>
        <img src="${p.image}" />
        <div class="card-content">
          <h3>${p.name}</h3>
          <div class="rating-preview">⭐ ${getAverageRating(p.id)}</div>
          <div class="price-box">
            ${p.discount > 0 ? `<span class="old-price">Rs ${price.toLocaleString()}</span>` : ""}
            <span class="new-price">Rs ${finalPrice.toLocaleString()}</span>
          </div>
          <div class="card-buttons">
            <button class="view-btn" onclick="openModal('${p.id}')">View</button>
            <button class="add-cart-btn" onclick="addToCart('${p.id}', '${p.name}', ${finalPrice}, '${p.image}')">Add</button>
          </div>
        </div>
      </div>`;
  }).join("");
}

/* =========================
   INIT & FIREBASE
========================= */

try {
  onSnapshot(collection(db, "products"), (snapshot) => {
    allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderProducts(allProducts);
    hideLoading();
  });
} catch (e) {
  console.error(e);
  hideLoading();
}

window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "true") document.body.classList.add("dark");
  updateDarkIcon();
  updateCartCount();
});

/* =========================
   SELECT FILTERS (Elements)
========================= */
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const priceFilter = document.getElementById("priceFilter");
const discountFilter = document.getElementById("discountFilter");

/* =========================
   FILTER LOGIC
========================= */
function filterProducts() {
  const searchTerm = searchInput?.value.toLowerCase() || "";
  const category = categoryFilter?.value || "all";
  const priceRange = priceFilter?.value || "all";
  const minDiscount = discountFilter?.value || "all";

  let filtered = allProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm);
    const matchesCategory = category === "all" || p.category === category;
    
    // Price Logic
    const pPrice = safeNumber(p.price);
    const matchesPrice = priceRange === "all" || 
      (priceRange === "low" && pPrice < 1000) ||
      (priceRange === "mid" && pPrice >= 1000 && pPrice < 5000) ||
      (priceRange === "high" && pPrice >= 5000);

    // Discount Logic
    const matchesDiscount = minDiscount === "all" || safeNumber(p.discount) >= safeNumber(minDiscount);

    return matchesSearch && matchesCategory && matchesPrice && matchesDiscount;
  });

  renderProducts(filtered);
}

// Event Listeners
searchInput?.addEventListener("input", filterProducts);
categoryFilter?.addEventListener("change", filterProducts);
priceFilter?.addEventListener("change", filterProducts);
discountFilter?.addEventListener("change", filterProducts);
