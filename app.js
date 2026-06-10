import { db, collection, onSnapshot } from "./firebase.js";

// DOM Elements
const productsDiv = document.getElementById("products");
const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const priceFilter = document.getElementById("priceFilter");
const discountFilter = document.getElementById("discountFilter");

// State
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allProducts = [];

// Helpers
function safeNumber(val) { return isNaN(Number(val)) ? 0 : Number(val); }

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const el = document.getElementById("floatingCartCount");
  if (el) el.innerText = count;
}

// Cart Logic
window.addToCart = function (id, name, price, image) {
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, price: safeNumber(price), image, qty: 1 });
  }
  saveCart();
  alert(name + " added to cart!"); // තහවුරු කිරීමක් සඳහා
};

window.toggleCart = function () {
  cartDrawer.classList.toggle("open");
  overlay.classList.toggle("show");
};

// Rendering
function renderProducts(products) {
  if (!productsDiv) return;
  productsDiv.innerHTML = products.map(p => {
    const price = safeNumber(p.price);
    const finalPrice = p.discount > 0 ? Math.round(price - (price * p.discount) / 100) : price;
    return `
      <div class="card">
        <img src="${p.image}" />
        <div class="card-content">
          <h3>${p.name}</h3>
          <p>Rs ${finalPrice.toLocaleString()}</p>
          <button class="view-btn" onclick="openModal('${p.id}')">View</button>
          <button class="add-cart-btn" onclick="addToCart('${p.id}', '${p.name}', ${finalPrice}, '${p.image}')">Add to Cart</button>
        </div>
      </div>`;
  }).join("");
}

// Modal Logic
window.openModal = function(id) {
  const p = allProducts.find(x => x.id === id);
  if(!p) return;
  document.getElementById("modalName").innerText = p.name;
  document.getElementById("modalImage").src = p.image;
  document.getElementById("productModal").classList.add("show");
}
window.closeModal = function() { document.getElementById("productModal").classList.remove("show"); }

// Init
onSnapshot(collection(db, "products"), (snapshot) => {
  allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderProducts(allProducts);
});

// Dark Mode
window.toggleDarkMode = function () {
  document.body.classList.toggle("dark");
};
