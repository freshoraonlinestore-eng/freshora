import { db, collection, onSnapshot } from "./firebase.js";

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allProducts = [];
let selectedRating = 0;
let currentProductId = null;

function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.innerText = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
}

window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("searchInput")?.addEventListener("input", filterProducts);
    document.getElementById("categoryFilter")?.addEventListener("change", filterProducts);
    document.getElementById("priceFilter")?.addEventListener("change", filterProducts);
    document.getElementById("discountFilter")?.addEventListener("change", filterProducts);
    updateCartDisplay();
});

/* CART SYSTEM */
window.updateCartDisplay = () => {
    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");
    const floatingCount = document.getElementById("floatingCartCount");
    if (!cartItems) return;

    floatingCount.innerText = cart.length;
    let total = 0;
    cartItems.innerHTML = cart.length === 0 ? `<p style="text-align:center">Empty</p>` : cart.map((item, index) => {
        total += item.price * item.qty;
        return `
            <div class="cart-item">
                <img src="${item.image}" />
                <div style="flex:1"><h4>${item.name}</h4><p>Rs ${item.price * item.qty}</p></div>
                <div class="qty-box">
                    <button onclick="changeQty(${index},-1)">-</button><span>${item.qty}</span><button onclick="changeQty(${index},1)">+</button>
                </div>
                <button class="remove-btn" onclick="removeFromCart(${index})">✕</button>
            </div>`;
    }).join("");
    cartTotal.innerText = `Total: Rs ${total}`;
    localStorage.setItem("cart", JSON.stringify(cart));
};

window.addToCart = (id, name, price, image) => {
    const existing = cart.find(i => i.id === id);
    if (existing) existing.qty++;
    else cart.push({ id, name, price: Number(price), image, qty: 1 });
    updateCartDisplay();
    showToast("Added to cart 🛒");
};

window.changeQty = (i, d) => {
    cart[i].qty += d;
    if (cart[i].qty <= 0) cart.splice(i, 1);
    updateCartDisplay();
};

window.removeFromCart = (i) => { cart.splice(i, 1); updateCartDisplay(); };
window.clearCart = () => { cart = []; updateCartDisplay(); };

/* PRODUCT RENDER */
window.renderProducts = (products) => {
    const grid = document.getElementById("products");
    grid.innerHTML = products.map(p => {
        const final = p.discount > 0 ? Math.round(p.price - (p.price * p.discount / 100)) : p.price;
        return `
            <div class="card">
                <img src="${p.image}" />
                <div class="card-content">
                    <h3>${p.name}</h3>
                    <p class="new-price">Rs ${final}</p>
                    <div class="card-buttons">
                        <button onclick="openModal('${p.id}')">View</button>
                        <button onclick="addToCart('${p.id}','${p.name}',${final},'${p.image}')">Add</button>
                    </div>
                </div>
            </div>`;
    }).join("");
};

/* MODAL & GALLERY */
window.openModal = (id) => {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    currentProductId = id;

    document.getElementById("modalName").innerText = p.name;
    document.getElementById("modalPrice").innerText = "Rs " + (p.price - (p.price * (p.discount || 0) / 100));
    document.getElementById("modalDesc").innerText = p.description || "No description provided.";
    
    // Gallery
    const images = p.images || [p.image];
    document.getElementById("galleryContainer").innerHTML = `
        <img src="${images[0]}" class="main-img" id="mainModalImg" />
        <div class="thumbnail-grid">
            ${images.map(img => `<img src="${img}" class="thumbnail" onclick="document.getElementById('mainModalImg').src='${img}'" />`).join('')}
        </div>`;

    document.getElementById("productModal").classList.add("show");
};

window.closeModal = () => document.getElementById("productModal").classList.remove("show");

/* UI TOGGLES */
window.toggleDarkMode = () => {
    document.body.classList.toggle("dark");
    const btn = document.querySelector("#darkModeBtn i");
    btn.classList.toggle("fa-moon");
    btn.classList.toggle("fa-sun");
};
window.toggleCart = () => document.getElementById("cartDrawer").classList.toggle("open");

/* FIREBASE LOAD */
onSnapshot(collection(db, "products"), (snapshot) => {
    allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderProducts(allProducts);
    document.getElementById("loadingScreen")?.remove();
});
