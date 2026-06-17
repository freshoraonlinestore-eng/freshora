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
            ${p.discount ? `<div class="discount-badge">${p.discount}% OFF</div>` : ''}
            <img src="${p.image || 'https://via.placeholder.com/200'}" alt="${p.name}">
            <h3>${p.name}</h3>
            <p>${p.description || ''}</p>
            <div>
                <span class="old-price">${p.oldPrice ? 'Rs ' + p.oldPrice : ''}</span>
                <span class="new-price">Rs ${p.price}</span>
            </div>
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
    const category = document.getElementById("categoryFilter")?.value || "all";

    const filtered = allProducts.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm);
        const matchesCategory = (category === "all" || p.category === category);
        return matchesSearch && matchesCategory;
    });

    renderProducts(filtered);
}

/* =========================
   INIT
   ========================= */
window.addEventListener("DOMContentLoaded", () => {
    // Search listener
    document.getElementById("searchInput")?.addEventListener("input", filterProducts);
    
    // Category filter listener
    document.getElementById("categoryFilter")?.addEventListener("change", filterProducts);

    // Firebase listener
    onSnapshot(collection(db, "products"), (snap) => {
        allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Populate Categories
        const cats = [...new Set(allProducts.map(p => p.category))];
        const filter = document.getElementById("categoryFilter");
        if(filter) {
            filter.innerHTML = '<option value="all">All Categories</option>' + 
            cats.map(c => `<option value="${c}">${c}</option>`).join('');
        }

        renderProducts(allProducts);
        document.getElementById("loadingScreen")?.remove();
    });
});

/* =========================
   DARK MODE
   ========================= */
window.toggleDarkMode = () => {
    document.body.classList.toggle("dark");
};
