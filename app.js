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
  setTimeout(() => { loadingScreen.style.display = "none"; }, 300);
}

/* =========================
   CART & WISHLIST
========================= */
function updateCartCount() {
  const total = cart.reduce((sum, item) => sum + safeNumber(item.qty), 0);
  const el = document.getElementById("floatingCartCount");
  if (el) el.innerText = total;
}

window.toggleWishlist = function (id) {
  const exists = wishlist.includes(id);
  wishlist = exists ? wishlist.filter(i => i !== id) : [...wishlist, id];
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  filterProducts(); 
};

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

/* =========================
   FILTER LOGIC
========================= */
function filterProducts() {
  const searchTerm = searchInput?.value.toLowerCase() || "";
  const category = categoryFilter?.value || "all";
  const priceLimit = priceFilter?.value || "all";
  const minDiscount = discountFilter?.value || "all";

  let filtered = allProducts.filter(p => {
    const pPrice = safeNumber(p.price);
    const finalPrice = p.discount > 0 ? Math.round(pPrice - (pPrice * p.discount) / 100) : pPrice;
    
    const matchesSearch = p.name.toLowerCase().includes(searchTerm);
    const matchesCategory = category === "all" || p.category === category;
    const matchesPrice = priceLimit === "all" || finalPrice <= safeNumber(priceLimit);
    const matchesDiscount = minDiscount === "all" || safeNumber(p.discount) >= safeNumber(minDiscount);

    return matchesSearch && matchesCategory && matchesPrice && matchesDiscount;
  });

  renderProducts(filtered);
}

/* =========================
   RENDER
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
          <i class="${wishlist.includes(p.id) ? "fa-solid" : "fa-regular"} fa-heart"></i>
        </button>
        <img src="${p.image}" />
        <div class="card-content">
          <h3>${p.name}</h3>
          <div class="price-box">
            ${p.discount > 0 ? `<span class="old-price">Rs ${price.toLocaleString()}</span>` : ""}
            <span class="new-price">Rs ${finalPrice.toLocaleString()}</span>
          </div>
          <button class="add-cart-btn" onclick="addToCart('${p.id}', '${p.name}', ${finalPrice}, '${p.image}')">Add to Cart</button>
        </div>
      </div>`;
  }).join("");
}

/* =========================
   INIT
========================= */
onSnapshot(collection(db, "products"), (snapshot) => {
  allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  filterProducts();
  hideLoading();
});

searchInput?.addEventListener("input", filterProducts);
categoryFilter?.addEventListener("change", filterProducts);
priceFilter?.addEventListener("change", filterProducts);
discountFilter?.addEventListener("change", filterProducts);

window.toggleCart = function () {
  cartDrawer.classList.toggle("open");
  overlay.classList.toggle("show");
};
