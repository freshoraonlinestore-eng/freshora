/* =========================
FRESHORA APP.JS (FULL FIXED)
REPLACE ENTIRE FILE
========================= */

import { db } from "./firebase.js";
import { collection, onSnapshot } from "firebase/firestore";

/* =========================
STATE
========================= */
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allProducts = [];
let currentProduct = null;
let selectedRating = 0;

/* =========================
INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
    setupListeners();
    loadProducts();
    updateCartUI();
    hideLoading();
});

/* =========================
FIREBASE PRODUCTS LOAD
========================= */
function loadProducts() {
    const colRef = collection(db, "products");

    onSnapshot(colRef, (snapshot) => {
        allProducts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        renderProducts(allProducts);
        populateFilters(allProducts);
    });
}

/* =========================
RENDER PRODUCTS
========================= */
function renderProducts(products) {
    const container = document.getElementById("products");
    container.innerHTML = "";

    products.forEach(p => {
        const div = document.createElement("div");
        div.className = "product-card";

        div.innerHTML = `
            <img src="${p.image}" onclick="openModal('${p.id}')">
            <h3>${p.name}</h3>
            <p>Rs ${p.price}</p>
            <button onclick="addToCart('${p.id}')">Add to Cart</button>
        `;

        container.appendChild(div);
    });
}

/* =========================
FILTERS
========================= */
function populateFilters(products) {
    const categories = [...new Set(products.map(p => p.category || "Other"))];
    const catFilter = document.getElementById("categoryFilter");

    catFilter.innerHTML = `<option value="all">All Categories</option>`;
    categories.forEach(c => {
        catFilter.innerHTML += `<option value="${c}">${c}</option>`;
    });
}

/* =========================
SEARCH + FILTER EVENTS
========================= */
function setupListeners() {

    document.getElementById("searchInput").addEventListener("input", filterProducts);

    document.getElementById("categoryFilter").addEventListener("change", filterProducts);
    document.getElementById("priceFilter").addEventListener("change", filterProducts);
    document.getElementById("discountFilter").addEventListener("change", filterProducts);

    document.getElementById("submitReview").addEventListener("click", submitReview);

    document.querySelectorAll("#starRating i").forEach(star => {
        star.addEventListener("click", () => {
            selectedRating = star.dataset.value;
            highlightStars(selectedRating);
        });
    });
}

/* =========================
FILTER LOGIC
========================= */
function filterProducts() {
    let filtered = [...allProducts];

    const search = document.getElementById("searchInput").value.toLowerCase();
    const cat = document.getElementById("categoryFilter").value;

    if (search) {
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(search)
        );
    }

    if (cat !== "all") {
        filtered = filtered.filter(p => p.category === cat);
    }

    renderProducts(filtered);
}

/* =========================
CART SYSTEM
========================= */
window.addToCart = (id) => {
    const product = allProducts.find(p => p.id === id);
    cart.push(product);
    saveCart();
    updateCartUI();
    showToast("Added to cart");
};

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartUI() {
    document.getElementById("floatingCartCount").innerText = cart.length;

    const container = document.getElementById("cartItems");
    container.innerHTML = "";

    let total = 0;

    cart.forEach((item, index) => {
        total += Number(item.price);

        const div = document.createElement("div");
        div.innerHTML = `
            <p>${item.name} - Rs ${item.price}</p>
            <button onclick="removeItem(${index})">Remove</button>
        `;
        container.appendChild(div);
    });

    document.getElementById("cartTotal").innerText = `Total: Rs ${total}`;
}

window.removeItem = (index) => {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
};

window.clearCart = () => {
    cart = [];
    saveCart();
    updateCartUI();
};

/* =========================
CART TOGGLE
========================= */
window.toggleCart = () => {
    document.getElementById("cartDrawer").classList.toggle("open");
};

/* =========================
CHECKOUT
========================= */
window.checkout = () => {
    const name = document.getElementById("cusName").value;
    const phone = document.getElementById("cusPhone").value;
    const address = document.getElementById("cusAddress").value;

    if (!name || !phone || !address) {
        alert("Fill all fields");
        return;
    }

    alert("Order placed successfully!");
    clearCart();
};

/* =========================
MODAL SYSTEM
========================= */
window.openModal = (id) => {
    const product = allProducts.find(p => p.id === id);
    currentProduct = product;

    document.getElementById("modalName").innerText = product.name;
    document.getElementById("modalPrice").innerText = "Rs " + product.price;
    document.getElementById("modalDesc").innerText = product.description || "";

    document.getElementById("productModal").style.display = "block";
};

window.closeModal = () => {
    document.getElementById("productModal").style.display = "none";
};

/* =========================
ADD FROM MODAL
========================= */
document.getElementById("modalAddBtn").addEventListener("click", () => {
    if (currentProduct) {
        cart.push(currentProduct);
        saveCart();
        updateCartUI();
        showToast("Added from modal");
    }
});

/* =========================
RATING UI
========================= */
function highlightStars(value) {
    document.querySelectorAll("#starRating i").forEach(star => {
        star.classList.toggle("fa-solid", star.dataset.value <= value);
        star.classList.toggle("fa-regular", star.dataset.value > value);
    });
}

/* =========================
REVIEWS (LOCAL)
========================= */
function submitReview() {
    const text = document.getElementById("reviewText").value;

    if (!text || !selectedRating) return;

    const div = document.createElement("div");
    div.innerHTML = `<p>⭐ ${selectedRating} - ${text}</p>`;

    document.getElementById("reviewList").appendChild(div);

    document.getElementById("reviewText").value = "";
    selectedRating = 0;
    highlightStars(0);
}

/* =========================
DARK MODE
========================= */
window.toggleDarkMode = () => {
    document.body.classList.toggle("dark");

    const icon = document.querySelector(".icon-btn i");

    if (document.body.classList.contains("dark")) {
        icon.classList.replace("fa-moon", "fa-sun");
    } else {
        icon.classList.replace("fa-sun", "fa-moon");
    }
};

/* =========================
TOAST
========================= */
function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.innerText = msg;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
}

/* =========================
LOADING
========================= */
function hideLoading() {
    const loader = document.getElementById("loadingScreen");
    if (loader) loader.style.display = "none";
}
