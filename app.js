import {
    db,
    collection,
    addDoc,
    onSnapshot
} from "./firebase.js";

/* =========================
   STATE
========================= */

let products = [];
let cart = [];
let wishlist = [];
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

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const priceFilter = document.getElementById("priceFilter");
const discountFilter = document.getElementById("discountFilter");

/* =========================
   INIT
========================= */

window.addEventListener("DOMContentLoaded", () => {
    loadLocal();
    loadProducts();
    setupEvents();
    initStars();
});

/* =========================
   LOCAL STORAGE
========================= */

function loadLocal() {
    cart = JSON.parse(localStorage.getItem("cart")) || [];
    wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
}

/* =========================
   EVENTS
========================= */

function setupEvents() {

    searchInput.addEventListener("input", renderProducts);

    categoryFilter.addEventListener("change", renderProducts);
    priceFilter.addEventListener("change", renderProducts);
    discountFilter.addEventListener("change", renderProducts);

    document.getElementById("floatingCartBtn")?.addEventListener("click", toggleCart);
    document.getElementById("closeCartBtn")?.addEventListener("click", toggleCart);

    document.getElementById("clearCartBtn")?.addEventListener("click", clearCart);
    document.getElementById("checkoutBtn")?.addEventListener("click", checkout);

    document.getElementById("darkModeBtn")?.addEventListener("click", toggleDarkMode);

    document.getElementById("modalAddBtn")?.addEventListener("click", () => {
        if (currentProduct) addToCart(currentProduct);
    });

    document.getElementById("reviewSubmitBtn")?.addEventListener("click", submitReview);

    document.getElementById("wishlistBtn")?.addEventListener("click", openWishlist);
}

/* =========================
   FIREBASE PRODUCTS
========================= */

function loadProducts() {

    showLoading();

    onSnapshot(collection(db, "products"), (snap) => {

        products = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        populateCategories();
        renderProducts();

        hideLoading();

    }, (err) => {
        console.error(err);
        hideLoading();
        showToast("Failed to load products");
    });
}

/* =========================
   CATEGORY POPULATE
========================= */

function populateCategories() {

    const cats = [...new Set(products.map(p => p.category || "General"))];

    categoryFilter.innerHTML = `<option value="all">All Categories</option>`;

    cats.forEach(c => {
        categoryFilter.innerHTML += `<option value="${c}">${c}</option>`;
    });
}

/* =========================
   FILTER + SEARCH ENGINE
========================= */

function filteredProducts() {

    let list = [...products];

    const search = searchInput.value.toLowerCase();

    const cat = categoryFilter.value;
    const price = priceFilter.value;
    const discount = discountFilter.value;

    // SEARCH
    if (search) {
        list = list.filter(p =>
            p.name.toLowerCase().includes(search)
        );
    }

    // CATEGORY
    if (cat !== "all") {
        list = list.filter(p => p.category === cat);
    }

    // PRICE
    if (price === "low") {
        list = list.filter(p => p.price < 1000);
    }
    if (price === "mid") {
        list = list.filter(p => p.price >= 1000 && p.price <= 5000);
    }
    if (price === "high") {
        list = list.filter(p => p.price > 5000);
    }

    // DISCOUNT
    if (discount !== "all") {
        list = list.filter(p => (p.discount || 0) >= Number(discount));
    }

    return list;
}

/* =========================
   RENDER PRODUCTS
========================= */

function renderProducts() {

    const list = filteredProducts();

    productsEl.innerHTML = "";

    list.forEach(p => {

        const isWish = wishlist.includes(p.id);

        const div = document.createElement("div");
        div.className = "product-card";

        div.innerHTML = `
            <img src="${p.image}" onclick="openProduct('${p.id}')" />

            <h3>${p.name}</h3>

            <p>Rs ${p.price}</p>

            <div class="card-actions">

                <button onclick="addToCartById('${p.id}')">Add</button>

                <button onclick="toggleWishlist('${p.id}')">
                    <i class="fa-${isWish ? 'solid' : 'regular'} fa-heart"></i>
                </button>

            </div>
        `;

        productsEl.appendChild(div);
    });
}

/* =========================
   PRODUCT OPEN
========================= */

window.openProduct = (id) => {

    currentProduct = products.find(p => p.id === id);
    if (!currentProduct) return;

    document.getElementById("modalName").innerText = currentProduct.name;
    document.getElementById("modalPrice").innerText = "Rs " + currentProduct.price;
    document.getElementById("modalDesc").innerText = currentProduct.desc || "";

    document.getElementById("modalCategory").innerText =
        "Category: " + (currentProduct.category || "General");

    document.getElementById("modalStock").innerText =
        "Stock: " + (currentProduct.stock || "Available");

    // WhatsApp link
    const msg =
        `Hello, I want to order:\n\n${currentProduct.name}\nPrice: Rs ${currentProduct.price}`;

    document.getElementById("whatsappOrderBtn").href =
        `https://wa.me/94752425790?text=${encodeURIComponent(msg)}`;

    document.getElementById("productModal").style.display = "block";

    loadReviews(id);
};

window.closeModal = () => {
    document.getElementById("productModal").style.display = "none";
};

/* =========================
   CART
========================= */

window.addToCartById = (id) => {
    const p = products.find(x => x.id === id);
    addToCart(p);
};

function addToCart(product) {

    const existing = cart.find(c => c.id === product.id);

    if (existing) existing.qty++;
    else cart.push({ ...product, qty: 1 });

    saveCart();
    updateCart();
    showToast("Added to cart");
}

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

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

    saveCart();
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
   WISHLIST
========================= */

window.toggleWishlist = (id) => {

    if (wishlist.includes(id)) {
        wishlist = wishlist.filter(x => x !== id);
    } else {
        wishlist.push(id);
    }

    localStorage.setItem("wishlist", JSON.stringify(wishlist));

    renderProducts();
    showToast("Wishlist updated");
};

window.openWishlist = () => {

    const items = products.filter(p => wishlist.includes(p.id));

    if (items.length === 0) {
        showToast("Wishlist empty");
        return;
    }

    productsEl.innerHTML = "";

    items.forEach(p => {

        const div = document.createElement("div");
        div.className = "product-card";

        div.innerHTML = `
            <img src="${p.image}" onclick="openProduct('${p.id}')" />
            <h3>${p.name}</h3>
            <p>Rs ${p.price}</p>
        `;

        productsEl.appendChild(div);
    });

    showToast("Wishlist opened");
};

/* =========================
   CHECKOUT
========================= */

window.checkout = async () => {

    if (cart.length === 0) return showToast("Cart empty");

    const name = document.getElementById("cusName").value;
    const phone = document.getElementById("cusPhone").value;
    const address = document.getElementById("cusAddress").value;

    if (!name || !phone || !address) return showToast("Fill details");

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

    showToast("Order placed!");
};

/* =========================
   REVIEWS
========================= */

function initStars() {

    document.querySelectorAll("#starRating i").forEach(star => {

        star.onclick = () => {

            selectedRating = Number(star.dataset.value);

            document.querySelectorAll("#starRating i")
                .forEach(s => s.classList.remove("fa-solid"));

            for (let i = 0; i < selectedRating; i++) {
                document.querySelectorAll("#starRating i")[i]
                    .classList.add("fa-solid");
            }
        };
    });
}

async function submitReview() {

    if (!currentProduct) return;

    const text = document.getElementById("reviewText").value;

    if (!text || selectedRating === 0) return showToast("Add rating");

    await addDoc(collection(db, "reviews"), {
        productId: currentProduct.id,
        text,
        rating: selectedRating,
        createdAt: Date.now()
    });

    showToast("Review added");
}

/* =========================
   DARK MODE
========================= */

window.toggleDarkMode = () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("dark", document.body.classList.contains("dark"));
};

/* =========================
   UTIL
========================= */

function showLoading() {
    loadingScreen.style.display = "flex";
}

function hideLoading() {
    loadingScreen.style.display = "none";
}

function showToast(msg) {
    toast.innerText = msg;
    toast.classList.add("show");

    setTimeout(() => toast.classList.remove("show"), 2500);
}
