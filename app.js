import { db, collection, onSnapshot, addDoc } from "./firebase.js";

/* =========================
STATE
========================= */
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allProducts = [];
let selectedRating = 0;
let currentProductId = null;

let allReviews = [];

/* PHASE 2 */
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let recentlyViewed = JSON.parse(localStorage.getItem("recentlyViewed")) || [];

/* PHASE 3 */
let viewCount = JSON.parse(localStorage.getItem("viewCount")) || {};

/* =========================
UTIL
========================= */
function num(v) {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
}

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function saveWishlist() {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
}

function saveRecentlyViewed() {
    localStorage.setItem("recentlyViewed", JSON.stringify(recentlyViewed));
}

function saveViews() {
    localStorage.setItem("viewCount", JSON.stringify(viewCount));
}

function showToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.innerHTML = `
        <i class="fa-solid fa-circle-check"></i>
        <span>${msg}</span>
    `;

    toast.classList.add("show");

    clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}

/* =========================
INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {

    updateCartDisplay();

    document.getElementById("searchInput")
        ?.addEventListener("input", filterProducts);

    document.getElementById("categoryFilter")
        ?.addEventListener("change", filterProducts);

    setupStarRating();
    bindReviewButton();

    document.getElementById("modalAddBtn")
        ?.addEventListener("click", () => {
            if (!currentProductId) return;

            const p = allProducts.find(x => x.id === currentProductId);
            if (!p) return;

            addToCart(p.id, p.name, getFinalPrice(p), p.image);
        });

    renderRecentlyViewed();
});

/* =========================
PRICE
========================= */
function getFinalPrice(product) {
    const price = num(product.price);
    const discount = num(product.discount);

    return discount > 0
        ? Math.round(price - (price * discount / 100))
        : price;
}

/* =========================
CART
========================= */
window.updateCartDisplay = () => {

    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");
    const floating = document.getElementById("floatingCartCount");

    if (!cartItems) return;

    let total = 0;
    let qtyTotal = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = `<p style="text-align:center;padding:20px;">Cart is empty</p>`;
        if (cartTotal) cartTotal.innerText = "Total: Rs 0";
        if (floating) floating.innerText = "0";
        saveCart();
        return;
    }

    cartItems.innerHTML = cart.map((item, i) => {

        const price = num(item.price);
        total += price * item.qty;
        qtyTotal += item.qty;

        return `
        <div class="cart-item">
            <img src="${item.image}">
            <div style="flex:1">
                <h4>${item.name}</h4>
                <p>Rs ${price * item.qty}</p>

                <div class="qty-box">
                    <button onclick="changeQty(${i},-1)">-</button>
                    <span>${item.qty}</span>
                    <button onclick="changeQty(${i},1)">+</button>
                </div>
            </div>

            <button class="remove-btn" onclick="removeFromCart(${i})">✕</button>
        </div>`;
    }).join("");

    if (cartTotal) cartTotal.innerText = `Total: Rs ${total}`;
    if (floating) floating.innerText = qtyTotal;

    saveCart();
};

window.addToCart = (id, name, price, image) => {

    const item = cart.find(i => i.id === id);

    if (item) item.qty += 1;
    else cart.push({ id, name, price: num(price), image, qty: 1 });

    updateCartDisplay();
    showToast("Added 🛒");
};

window.changeQty = (i, change) => {
    if (!cart[i]) return;

    cart[i].qty += change;
    if (cart[i].qty <= 0) cart.splice(i, 1);

    updateCartDisplay();
};

window.removeFromCart = (i) => {
    cart.splice(i, 1);
    updateCartDisplay();
    showToast("Removed");
};

window.clearCart = () => {
    cart = [];
    updateCartDisplay();
    showToast("Cart cleared");
};

/* =========================
WISHLIST
========================= */
window.toggleWishlist = (id) => {

    if (wishlist.includes(id)) {
        wishlist = wishlist.filter(w => w !== id);
        showToast("Removed ❤️");
    } else {
        wishlist.push(id);
        showToast("Added ❤️");
    }

    saveWishlist();
    renderProducts(allProducts);
};

/* =========================
RECENTLY VIEWED + TRACK
========================= */
function trackView(product) {

    viewCount[product.id] = (viewCount[product.id] || 0) + 1;
    saveViews();

    recentlyViewed = recentlyViewed.filter(p => p.id !== product.id);
    recentlyViewed.unshift(product);

    if (recentlyViewed.length > 8) recentlyViewed.pop();

    saveRecentlyViewed();
    renderRecentlyViewed();
}

window.renderRecentlyViewed = () => {

    const grid = document.getElementById("recentlyViewedGrid");
    if (!grid) return;

    if (!recentlyViewed.length) {
        grid.innerHTML = `<p style="color:var(--muted);text-align:center;">No recently viewed</p>`;
        return;
    }

    grid.innerHTML = recentlyViewed.map(p => `
        <div class="card">
            <img src="${p.image}">
            <div class="card-content">
                <h3>${p.name}</h3>
                <button onclick="openModal('${p.id}')">View</button>
            </div>
        </div>
    `).join("");
};

/* =========================
FILTER
========================= */
window.filterProducts = () => {

    const search = document.getElementById("searchInput")?.value.toLowerCase() || "";

    let filtered = allProducts.filter(p =>
        (p.name || "").toLowerCase().includes(search)
    );

    renderProducts(filtered);
};

/* =========================
RENDER PRODUCTS
========================= */
window.renderProducts = (products) => {

    const grid = document.getElementById("products");
    if (!grid) return;

    if (!products.length) {
        grid.innerHTML = `<p style="text-align:center;">No products</p>`;
        return;
    }

    grid.innerHTML = products.map(p => {

        const price = getFinalPrice(p);
        const wish = wishlist.includes(p.id);

        return `
        <div class="card">

            <img src="${p.image || ''}">

            <div class="card-content">

                <h3>${p.name}</h3>

                <div class="price-box">
                    <span class="new-price">Rs ${price}</span>
                </div>

                <div class="card-buttons">
                    <button onclick="openModal('${p.id}')">View</button>
                    <button onclick="addToCart('${p.id}','${p.name}',${price},'${p.image}')">Add</button>
                </div>

                <button onclick="toggleWishlist('${p.id}')"
                    style="margin-top:8px;width:100%;padding:8px;border:none;border-radius:8px;
                    background:${wish ? '#ff3b30' : '#eee'};
                    color:${wish ? '#fff' : '#111'}">
                    ${wish ? '❤️ Wishlisted' : '🤍 Wishlist'}
                </button>

            </div>
        </div>`;
    }).join("");
};

/* =========================
MODAL
========================= */
window.openModal = (id) => {

    const p = allProducts.find(x => x.id === id);
    if (!p) return;

    currentProductId = id;

    const images = p.images?.length ? p.images : [p.image];

    document.getElementById("modalName").innerText = p.name;
    document.getElementById("modalPrice").innerText = "Rs " + getFinalPrice(p);
    document.getElementById("modalDesc").innerText = p.description || "";

    document.getElementById("galleryContainer").innerHTML = `
        <img src="${images[0]}" class="main-img" id="mainModalImg">
    `;

    document.getElementById("productModal")?.classList.add("show");

    selectedRating = 0;
    updateStars(0);

    trackView(p);
};

window.closeModal = () => {
    document.getElementById("productModal")?.classList.remove("show");
    currentProductId = null;
};

/* =========================
RATING + REVIEWS
========================= */
function setupStarRating() {
    setTimeout(() => {
        document.querySelectorAll("#starRating i").forEach((star, i) => {
            star.onclick = () => {
                selectedRating = i + 1;
                updateStars(selectedRating);
            };
        });
    }, 300);
}

function updateStars(rating) {
    document.querySelectorAll("#starRating i").forEach((star, i) => {
        star.classList.toggle("fa-solid", i < rating);
        star.classList.toggle("fa-regular", i >= rating);
    });
}

function bindReviewButton() {

    setTimeout(() => {

        const btn = document.getElementById("reviewSubmitBtn");

        if (!btn) return;

        btn.onclick = async () => {

            const text = document.getElementById("reviewText")?.value;

            if (!text || selectedRating === 0) {
                showToast("Add rating + review");
                return;
            }

            await addDoc(collection(db, "reviews"), {
                productId: currentProductId,
                rating: selectedRating,
                text,
                createdAt: new Date().toISOString()
            });

            showToast("Review added");

            document.getElementById("reviewText").value = "";
            selectedRating = 0;
            updateStars(0);
        };

    }, 300);
}

/* =========================
FIREBASE
========================= */
onSnapshot(collection(db, "products"), (snap) => {
    allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProducts(allProducts);
    document.getElementById("loadingScreen")?.remove();
});

onSnapshot(collection(db, "reviews"), (snap) => {
    allReviews = snap.docs.map(d => d.data());
});
