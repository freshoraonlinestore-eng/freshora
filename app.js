import { db, collection, onSnapshot } from "./firebase.js";

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
let allProducts = [];

/* =========================
   HELPERS
========================= */
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
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
};

/* =========================
   CART LOGIC
========================= */
window.toggleCart = function () {
  cartDrawer.classList.toggle("open");
  overlay.classList.toggle("show");
};

window.addToCart = function (id, name, price, image) {
  const existing = cart.find(i => i.id === id);
  if (existing) { existing.qty += 1; }
  else { cart.push({ id, name, price: safeNumber(price), image, qty: 1 }); }
  saveCart();
};

window.updateQty = function(index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  saveCart();
};

window.removeFromCart = function(index) {
  cart.splice(index, 1);
  saveCart();
};

window.clearCart = function () { if (confirm("Clear cart?")) { cart = []; saveCart(); } };

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");
  if (!cartItems) return;
  
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
            <button onclick="updateQty(${index}, -1)">-</button>
            <span>${item.qty}</span>
            <button onclick="updateQty(${index}, 1)">+</button>
          </div>
        </div>
        <button class="remove-btn" onclick="removeFromCart(${index})">×</button>
      </div>`;
  }).join("");
  if(cartTotal) cartTotal.innerText = `Total: Rs ${total.toLocaleString()}`;
}

/* =========================
   FILTER LOGIC
========================= */
function filterProducts() {
  const searchTerm = searchInput?.value.toLowerCase() || "";
  const cat = categoryFilter?.value || "all";
  const priceLim = priceFilter?.value || "all";
  const discLim = discountFilter?.value || "all";

  const filtered = allProducts.filter(p => {
    const price = safeNumber(p.price);
    const finalPrice = p.discount > 0 ? Math.round(price - (price * p.discount / 100)) : price;
    
    return p.name.toLowerCase().includes(searchTerm) &&
           (cat === "all" || p.category === cat) &&
           (priceLim === "all" || finalPrice <= safeNumber(priceLim)) &&
           (discLim === "all" || safeNumber(p.discount) >= safeNumber(discLim));
  });
  renderProducts(filtered);
}

/* =========================
   RENDER PRODUCTS (Price Logic Included)
========================= */
function renderProducts(products) {
  if (!productsDiv) return;
  productsDiv.innerHTML = products.map(p => {
    const originalPrice = safeNumber(p.price);
    const discount = safeNumber(p.discount);
    const finalPrice = discount > 0 ? Math.round(originalPrice - (originalPrice * discount / 100)) : originalPrice;
    const isOutOfStock = p.stock === 0 || p.status === "out-of-stock";

    return `
      <div class="card ${isOutOfStock ? 'out-of-stock' : ''}">
        ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ""}
        <img src="${p.image}" />
        <div class="card-content">
          <h3>${p.name}</h3>
          <div class="price-box">
            ${discount > 0 ? `<span class="old-price">Rs ${originalPrice.toLocaleString()}</span>` : ""}
            <span class="new-price">Rs ${finalPrice.toLocaleString()}</span>
          </div>
          <div class="card-buttons">
            <button class="view-btn" onclick="openModal('${p.id}')">View</button>
            ${isOutOfStock 
              ? `<button class="add-cart-btn" style="background:#ccc; cursor:not-allowed;">Sold Out</button>` 
              : `<button class="add-cart-btn" onclick="addToCart('${p.id}', '${p.name}', ${finalPrice}, '${p.image}')">Add</button>`
            }
          </div>
        </div>
      </div>`;
  }).join("");
}

window.openModal = function(id) {
  const p = allProducts.find(x => x.id === id);
  if(!p) return;
  document.getElementById("modalName").innerText = p.name;
  document.getElementById("modalImage").src = p.image;
  // Modal මිල පෙන්වීම සඳහා ID එකක් තිබිය යුතුය
  const modalPrice = document.getElementById("modalPriceDisplay");
  if(modalPrice) modalPrice.innerText = `Rs ${safeNumber(p.price).toLocaleString()}`;
  document.getElementById("productModal").classList.add("show");
};

window.closeModal = function() { document.getElementById("productModal").classList.remove("show"); };

onSnapshot(collection(db, "products"), (snapshot) => {
  allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  filterProducts();
  hideLoading();
});

// Event Listeners
searchInput?.addEventListener("input", filterProducts);
categoryFilter?.addEventListener("change", filterProducts);
priceFilter?.addEventListener("change", filterProducts);
discountFilter?.addEventListener("change", filterProducts);

window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "true") document.body.classList.add("dark");
  updateCartCount();
  renderCart();
});
