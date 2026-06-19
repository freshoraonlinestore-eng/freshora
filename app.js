/* =========================
   FRESHORA APP.JS (FULL FIX)
   ZERO ERROR VERSION
========================= */

import {
    db,
    collection,
    addDoc,
    onSnapshot
} from "./firebase.js";

/* =========================
   GLOBAL STATE
========================= */

let products = [];
let cart = [];
let currentProduct = null;
let selectedRating = 0;

/* =========================
   ELEMENTS
========================= */

const productsEl = document.getElementById("products");
const cartDrawer = document.getElementById("cartDrawer");
const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const floatingCartCount = document.getElementById("floatingCartCount");

const loadingScreen = document.getElementById("loadingScreen");
const toast = document.getElementById("toast");

/* =========================
   SAFE INIT
========================= */

window.addEventListener("DOMContentLoaded", () => {
    initUI();
    loadProducts();
    setupEvents();
});

/* =========================
   UI INIT
========================= */

function initUI() {
    hideLoading();

    // Dark mode init
    if (localStorage.getItem("dark") === "1") {
        document.body.classList.add("dark");
        updateDarkIcon();
    }
}

/* =========================
   EVENTS
========================= */

function setupEvents() {

    document.getElementById("floatingCartBtn")
        .addEventListener("click", toggleCart);

    document.getElementById("closeCartBtn")
        .addEventListener("click", toggleCart);

    document.getElementById("clearCartBtn")
        .addEventListener("click", clearCart);

    document.getElementById("checkoutBtn")
        .addEventListener("click", checkout);

    document.getElementById("darkModeBtn")
        .addEventListener("click", toggleDarkMode);

    document.getElementById("closeModalBtn")
        .addEventListener("click", closeModal);

    document.getElementById("modalAddBtn")
        .addEventListener("click", () => {
            if (currentProduct) addToCart(currentProduct);
        });

    document.getElementById("reviewSubmitBtn")
        .addEventListener("click", submitReview);

    setupStars();
}

/* =========================
   PRODUCTS (FIREBASE)
========================= */

function loadProducts() {

    showLoading();

    const ref = collection(db, "products");

    onSnapshot(ref, (snapshot) => {

        products = [];

        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });

        renderProducts();
        hideLoading();

    }, (err) => {
        console.error("Firestore error:", err);
        hideLoading();
        showToast("Failed to load products");
    });
}

/* =========================
   RENDER PRODUCTS
========================= */

function renderProducts() {

    productsEl.innerHTML = "";

    products.forEach(p => {

        const div = document.createElement("div");
        div.className = "product-card";

        div.innerHTML = `
            <img src="${p.image || 'logo.png'}" alt="${p.name}" />
            <h3>${p.name}</h3>
            <p>Rs ${p.price}</p>
            <button onclick="openProduct('${p.id}')">View</button>
        `;

        productsEl.appendChild(div);
    });
}

/* =========================
   PRODUCT MODAL
========================= */

window.openProduct = (id) => {

    currentProduct = products.find(p => p.id === id);
    if (!currentProduct) return;

    document.getElementById("modalName").innerText = currentProduct.name;
    document.getElementById("modalPrice").innerText = "Rs " + currentProduct.price;
    document.getElementById("modalDesc").innerText = currentProduct.desc || "";

    document.getElementById("productModal").style.display = "block";

    loadReviews(id);
};

window.closeModal = () => {
    document.getElementById("productModal").style.display = "none";
};

/* =========================
   CART SYSTEM
========================= */

window.addToCart = (product) => {

    const existing = cart.find(c => c.id === product.id);

    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    updateCart();
    showToast("Added to cart");
};

function updateCart() {

    cartItemsEl.innerHTML = "";

    let total = 0;
    let count = 0;

    cart.forEach(item => {

        total += item.price * item.qty;
        count += item.qty;

        const div = document.createElement("div");
        div.className = "cart-item";

        div.innerHTML = `
            <h4>${item.name}</h4>
            <p>Rs ${item.price} x ${item.qty}</p>
            <button onclick="removeItem('${item.id}')">Remove</button>
        `;

        cartItemsEl.appendChild(div);
    });

    cartTotalEl.innerText = "Total: Rs " + total;
    floatingCartCount.innerText = count;
}

window.removeItem = (id) => {
    cart = cart.filter(c => c.id !== id);
    updateCart();
};

window.clearCart = () => {
    cart = [];
    updateCart();
    showToast("Cart cleared");
};

window.toggleCart = () => {
    cartDrawer.classList.toggle("open");
};

/* =========================
   CHECKOUT
========================= */

window.checkout = async () => {

    if (cart.length === 0) {
        showToast("Cart is empty");
        return;
    }

    const name = document.getElementById("cusName").value;
    const phone = document.getElementById("cusPhone").value;
    const address = document.getElementById("cusAddress").value;

    if (!name || !phone || !address) {
        showToast("Fill all fields");
        return;
    }

    try {
        await addDoc(collection(db, "orders"), {
            name,
            phone,
            address,
            cart,
            total: cart.reduce((a, b) => a + b.price * b.qty, 0),
            createdAt: Date.now()
        });

        cart = [];
        updateCart();

        showToast("Order placed successfully");

    } catch (e) {
        console.error(e);
        showToast("Order failed");
    }
};

/* =========================
   REVIEWS
========================= */

function setupStars() {

    document.querySelectorAll("#starRating i").forEach(star => {

        star.addEventListener("click", () => {
            selectedRating = Number(star.dataset.value);

            document.querySelectorAll("#starRating i")
                .forEach(s => s.classList.remove("fa-solid"));

            for (let i = 0; i < selectedRating; i++) {
                document.querySelectorAll("#starRating i")[i]
                    .classList.add("fa-solid");
            }
        });
    });
}

async function submitReview() {

    if (!currentProduct) return;

    const text = document.getElementById("reviewText").value;

    if (!text || selectedRating === 0) {
        showToast("Add rating & review");
        return;
    }

    try {
        await addDoc(collection(db, "reviews"), {
            productId: currentProduct.id,
            text,
            rating: selectedRating,
            createdAt: Date.now()
        });

        document.getElementById("reviewText").value = "";
        selectedRating = 0;

        showToast("Review submitted");

    } catch (e) {
        console.error(e);
        showToast("Review failed");
    }
}

/* =========================
   LOAD REVIEWS
========================= */

function loadReviews(productId) {

    const list = document.getElementById("reviewList");
    list.innerHTML = "";

    onSnapshot(collection(db, "reviews"), (snap) => {

        list.innerHTML = "";

        snap.forEach(doc => {

            const r = doc.data();

            if (r.productId !== productId) return;

            const div = document.createElement("div");
            div.className = "review-item";

            div.innerHTML = `
                <p>⭐ ${r.rating}/5</p>
                <p>${r.text}</p>
            `;

            list.appendChild(div);
        });

    });
}

/* =========================
   DARK MODE
========================= */

window.toggleDarkMode = () => {

    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
        localStorage.setItem("dark", "1");
    } else {
        localStorage.setItem("dark", "0");
    }

    updateDarkIcon();
};

function updateDarkIcon() {
    const icon = document.querySelector("#darkModeBtn i");
    if (!icon) return;

    icon.classList.toggle("fa-moon");
    icon.classList.toggle("fa-sun");
}

/* =========================
   LOADING + TOAST
========================= */

function showLoading() {
    if (loadingScreen) loadingScreen.style.display = "flex";
}

function hideLoading() {
    if (loadingScreen) loadingScreen.style.display = "none";
}

function showToast(msg) {

    toast.innerText = msg;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}
