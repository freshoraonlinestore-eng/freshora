import { db, collection, onSnapshot, addDoc } from "./firebase.js";

/* =========================
   STATE
   ========================= */
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allProducts = [];

/* =========================
   UTILS
   ========================= */
function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const count = document.getElementById("cartCount");
    if (count) count.innerText = cart.length;
}

function showToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.innerText = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2200);
}

/* =========================
   RENDER PRODUCTS
   ========================= */
function renderProducts(products) {
    const container = document.getElementById("products");
    if (!container) return;

    container.innerHTML = products.map(p => `
        <div class="card">
            <img src="${p.image || 'https://via.placeholder.com/200'}" alt="${p.name}">
            <h3>${p.name}</h3>
            <div class="price-row">Rs ${Number(p.price).toLocaleString()}</div>
            <button class="add-btn" onclick="addToCart('${p.id}')">Add to Cart</button>
        </div>
    `).join('');
}

/* =========================
   CART LOGIC
   ========================= */
window.addToCart = (id) => {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;
    cart.push(product);
    saveCart();
    showToast("Added to cart!");
};

window.toggleCart = () => {
    document.getElementById("cartDrawer")?.classList.toggle("open");
};

/* =========================
   SEARCH & FILTER
   ========================= */
function filterProducts() {
    const searchTerm = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm)
    );
    renderProducts(filtered);
}

/* =========================
   INIT
   ========================= */
window.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
    
    // Search listener
    document.getElementById("searchInput")?.addEventListener("input", filterProducts);

    // Firebase Data Fetch
    onSnapshot(collection(db, "products"), (snap) => {
        allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderProducts(allProducts);
    });
});
