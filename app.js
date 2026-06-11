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
    updateCartDisplay();
});

/* CART SYSTEM - UPDATED UI */
window.updateCartDisplay = () => {
    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");
    const floatingCount = document.getElementById("floatingCartCount");
    if (!cartItems) return;

    floatingCount.innerText = cart.length;
    let total = 0;
    cartItems.innerHTML = cart.length === 0 ? `<p style="text-align:center">Your cart is empty</p>` : cart.map((item, index) => {
        total += item.price * item.qty;
        return `
            <div class="cart-item">
                <img src="${item.image}" />
                <div class="cart-details">
                    <h4>${item.name}</h4>
                    <p>Rs ${item.price * item.qty}</p>
                    <div class="qty-box">
                        <button onclick="changeQty(${index},-1)">-</button>
                        <span>${item.qty}</span>
                        <button onclick="changeQty(${index},1)">+</button>
                    </div>
                </div>
                <button class="remove-btn" onclick="removeFromCart(${index})">✕</button>
            </div>`;
    }).join("");
    cartTotal.innerText = `Total: Rs ${total}`;
    localStorage.setItem("cart", JSON.stringify(cart));
};

/* PRODUCT RENDER - WITH DISCOUNT TAG */
window.renderProducts = (products) => {
    const grid = document.getElementById("products");
    grid.innerHTML = products.map(p => {
        const discount = Number(p.discount || 0);
        const final = discount > 0 ? Math.round(p.price - (p.price * discount / 100)) : p.price;
        return `
            <div class="card">
                ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ""}
                <img src="${p.image}" />
                <div class="card-content">
                    <h3>${p.name}</h3>
                    <div class="price-box">
                        ${discount > 0 ? `<span class="old-price">Rs ${p.price}</span>` : ""}
                        <span class="new-price">Rs ${final}</span>
                    </div>
                    <div class="card-buttons">
                        <button onclick="openModal('${p.id}')">View</button>
                        <button onclick="addToCart('${p.id}','${p.name}',${final},'${p.image}')">Add</button>
                    </div>
                </div>
            </div>`;
    }).join("");
};

/* MODAL FIX - OPEN ON VIEW CLICK */
window.openModal = (id) => {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    currentProductId = id;

    document.getElementById("modalName").innerText = p.name;
    document.getElementById("modalImage").src = p.image;
    document.getElementById("modalPrice").innerText = "Rs " + (p.price - (p.price * (p.discount || 0) / 100));
    
    // Add logic to Add Button
    document.getElementById("modalAddBtn").onclick = () => {
        addToCart(p.id, p.name, (p.price - (p.price * (p.discount || 0) / 100)), p.image);
        closeModal();
    };

    document.getElementById("productModal").classList.add("show");
};

window.closeModal = () => document.getElementById("productModal").classList.remove("show");

/* UI TOGGLES */
window.toggleCart = () => document.getElementById("cartDrawer").classList.toggle("open");
window.toggleDarkMode = () => document.body.classList.toggle("dark");

/* FIREBASE LOAD */
onSnapshot(collection(db, "products"), (snapshot) => {
    allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderProducts(allProducts);
    document.getElementById("loadingScreen")?.remove();
});
