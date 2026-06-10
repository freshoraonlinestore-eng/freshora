import { db, collection, onSnapshot } from "./firebase.js";

const productsDiv = document.getElementById("products");
const loadingScreen = document.getElementById("loadingScreen");
const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const priceFilter = document.getElementById("priceFilter");
const discountFilter = document.getElementById("discountFilter");

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let allProducts = [];

function safeNumber(value) {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

// DARK MODE
window.toggleDarkMode = function () {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
  updateDarkIcon();
};

function updateDarkIcon() {
  const btn = document.getElementById("darkModeBtn");
  if (!btn) return;
  const isDark = document.body.classList.contains("dark");
  btn.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
}

// RENDER PRODUCTS (View button එක මෙතැන ඇත)
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
          <div class="card-buttons">
            <button class="view-btn" onclick="openModal('${p.id}')">View</button>
            <button class="add-cart-btn" onclick="addToCart('${p.id}', '${p.name}', ${finalPrice}, '${p.image}')">Add</button>
          </div>
        </div>
      </div>`;
  }).join("");
}

// FILTER LOGIC
function filterProducts() {
  const searchTerm = searchInput?.value.toLowerCase() || "";
  const category = categoryFilter?.value || "all";
  const priceLimit = priceFilter?.value || "all";
  const minDiscount = discountFilter?.value || "all";

  let filtered = allProducts.filter(p => {
    const pPrice = safeNumber(p.price);
    const finalPrice = p.discount > 0 ? Math.round(pPrice - (pPrice * p.discount) / 100) : pPrice;
    
    return (p.name.toLowerCase().includes(searchTerm)) &&
           (category === "all" || p.category === category) &&
           (priceLimit === "all" || finalPrice <= safeNumber(priceLimit)) &&
           (minDiscount === "all" || safeNumber(p.discount) >= safeNumber(minDiscount));
  });
  renderProducts(filtered);
}

// MODAL
window.openModal = function(id) {
  const p = allProducts.find(x => x.id === id);
  if(!p) return;
  document.getElementById("modalName").innerText = p.name;
  document.getElementById("modalImage").src = p.image;
  document.getElementById("productModal").classList.add("show");
}
window.closeModal = function() { document.getElementById("productModal").classList.remove("show"); }

// INIT
onSnapshot(collection(db, "products"), (snapshot) => {
  allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  filterProducts();
  hideLoading();
});

window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "true") document.body.classList.add("dark");
  updateDarkIcon();
});

searchInput?.addEventListener("input", filterProducts);
categoryFilter?.addEventListener("change", filterProducts);
priceFilter?.addEventListener("change", filterProducts);
discountFilter?.addEventListener("change", filterProducts);
