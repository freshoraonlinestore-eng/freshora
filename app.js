import { db, collection, onSnapshot, addDoc } from "./firebase.js";

/* =========================
STATE
========================= */
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let recentlyViewed = JSON.parse(localStorage.getItem("recentlyViewed")) || [];

let allProducts = [];
let allReviews = [];

let selectedRating = 0;
let currentProductId = null;

/* =========================
COUPON SYSTEM (NEW)
========================= */
let appliedCoupon = null;

const coupons = {
    "FRESH10": 10,
    "SAVE20": 20,
    "WELCOME5": 5
};

/* =========================
UTIL
========================= */
const save = () => {
    localStorage.setItem("cart", JSON.stringify(cart));
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    localStorage.setItem("recentlyViewed", JSON.stringify(recentlyViewed));
};

const num = v => Number(v) || 0;

function toast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;

    t.innerHTML = msg;
    t.classList.add("show");

    setTimeout(() => t.classList.remove("show"), 2000);
}

/* =========================
INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {

    updateCartUI();

    document.getElementById("searchInput")?.addEventListener("input", smartSearch);
    document.getElementById("categoryFilter")?.addEventListener("change", filterProducts);

    setupStars();
    bindReview();

    setupCouponInput();

    document.getElementById("modalAddBtn")?.addEventListener("click", () => {
        const p = allProducts.find(x => x.id === currentProductId);
        if (p) addToCart(p);
    });
});

/* =========================
SMART SEARCH (AUTO SUGGEST)
========================= */
window.smartSearch = () => {
    const q = document.getElementById("searchInput").value.toLowerCase();

    if (!q) return renderProducts(allProducts);

    const results = allProducts.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );

    if (!results.length) {
        document.getElementById("products").innerHTML =
            `<p style="text-align:center;width:100%">
                No results 😢 Try different keywords
            </p>`;
        return;
    }

    renderProducts(results);
};

/* =========================
FILTER
========================= */
window.filterProducts = () => {
    const cat = document.getElementById("categoryFilter").value;

    let list = [...allProducts];

    if (cat !== "all") {
        list = list.filter(p => p.category === cat);
    }

    renderProducts(list);
};

/* =========================
TRENDING PRODUCTS (NEW)
========================= */
function getTrendingProducts() {
    return [...allProducts]
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 6);
}

/* =========================
FEATURED PRODUCTS (NEW)
========================= */
function getFeaturedProducts() {
    return allProducts.filter(p => p.discount >= 10).slice(0, 6);
}

/* =========================
PRODUCT RENDER (UPGRADED)
========================= */
window.renderProducts = (products) => {

    const grid = document.getElementById("products");

    grid.innerHTML = products.map(p => {

        const price = finalPrice(p);

        const reviews = allReviews.filter(r => r.productId === p.id);
        const avg = reviews.length
            ? (reviews.reduce((a, b) => a + num(b.rating), 0) / reviews.length).toFixed(1)
            : 0;

        return `
        <div class="card">

            ${p.discount ? `<div class="discount-badge">-${p.discount}%</div>` : ""}

            <img src="${p.image}">

            <div class="card-content">

                <h3>${p.name}</h3>

                <div class="price-box">
                    <span class="new-price">Rs ${price}</span>
                </div>

                <div class="product-rating">
                    ⭐ ${avg} (${reviews.length})
                </div>

                <button onclick="openProduct('${p.id}')">View</button>

                <button onclick="addToCartById('${p.id}')">Add</button>

                <button onclick="toggleWishlist('${p.id}')">
                    ❤️ Wishlist
                </button>

            </div>
        </div>`;
    }).join("");
};

/* =========================
PRODUCT OPEN + VIEW TRACKING
========================= */
window.openProduct = (id) => {

    const p = allProducts.find(x => x.id === id);
    if (!p) return;

    currentProductId = id;

    p.views = (p.views || 0) + 1; // trending boost

    recentlyViewed = [id, ...recentlyViewed.filter(x => x !== id)].slice(0, 10);

    save();

    document.getElementById("productModal").classList.add("show");

    document.getElementById("modalName").innerText = p.name;
    document.getElementById("modalPrice").innerText = "Rs " + finalPrice(p);
    document.getElementById("modalDesc").innerText = p.description;

    loadRelated(p.category, id);
};

/* =========================
RELATED PRODUCTS (SMART)
========================= */
function loadRelated(category, id) {

    const related = allProducts
        .filter(p => p.category === category && p.id !== id)
        .slice(0, 4);

    const box = document.getElementById("relatedBox") || createRelatedBox();

    box.innerHTML =
        `<h4>Related Products</h4>` +
        related.map(p =>
            `<p onclick="openProduct('${p.id}')">➡ ${p.name}</p>`
        ).join("");
}

function createRelatedBox() {
    const div = document.createElement("div");
    div.id = "relatedBox";
    document.querySelector(".modal-content").appendChild(div);
    return div;
}

/* =========================
COUPON SYSTEM (NEW)
========================= */
function setupCouponInput() {
    const el = document.getElementById("couponInput");
    if (!el) return;

    el.addEventListener("change", () => {
        const code = el.value.trim().toUpperCase();

        if (coupons[code]) {
            appliedCoupon = coupons[code];
            toast(`Coupon applied: ${appliedCoupon}% OFF`);
        } else {
            appliedCoupon = null;
            toast("Invalid coupon");
        }
    });
}

/* =========================
PRICE CALC (WITH COUPON)
========================= */
function finalPrice(p) {

    let price = p.price;

    if (p.discount) {
        price = price - (price * p.discount / 100);
    }

    if (appliedCoupon) {
        price = price - (price * appliedCoupon / 100);
    }

    return Math.round(price);
}

/* =========================
CART SYSTEM
========================= */
window.addToCartById = (id) => {
    const p = allProducts.find(x => x.id === id);
    if (p) addToCart(p);
};

function addToCart(p) {

    const item = cart.find(x => x.id === p.id);

    if (item) item.qty += 1;
    else cart.push({ id: p.id, name: p.name, price: finalPrice(p), qty: 1 });

    save();
    updateCartUI();
    toast("Added 🛒");
}

window.updateCartUI = () => {

    const el = document.getElementById("cartItems");
    const count = document.getElementById("floatingCartCount");

    let totalQty = 0;

    el.innerHTML = cart.map(i => {
        totalQty += i.qty;

        return `
        <div class="cart-item">
            <h4>${i.name}</h4>
            <p>Rs ${i.price * i.qty}</p>
        </div>`;
    }).join("");

    count.innerText = totalQty;
    save();
};

/* =========================
WISHLIST
========================= */
window.toggleWishlist = (id) => {
    wishlist.includes(id)
        ? wishlist = wishlist.filter(x => x !== id)
        : wishlist.push(id);

    save();
    toast("Wishlist updated ❤️");
};

/* =========================
REVIEWS
========================= */
function setupStars() {
    setTimeout(() => {
        document.querySelectorAll("#starRating i").forEach((s, i) => {
            s.onclick = () => {
                selectedRating = i + 1;
                updateStars();
            };
        });
    }, 400);
}

function updateStars() {
    document.querySelectorAll("#starRating i").forEach((s, i) => {
        s.className = i < selectedRating ? "fa-solid fa-star" : "fa-regular fa-star";
    });
}

function bindReview() {
    setTimeout(() => {
        document.getElementById("reviewSubmitBtn").onclick = async () => {

            const text = document.getElementById("reviewText").value;

            if (!text || !selectedRating) return toast("Add rating");

            await addDoc(collection(db, "reviews"), {
                productId: currentProductId,
                text,
                rating: selectedRating,
                createdAt: Date.now()
            });

            toast("Review added");
        };
    }, 500);
}

/* =========================
FIREBASE LIVE
========================= */
onSnapshot(collection(db, "products"), (snap) => {
    allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProducts(allProducts);
});

onSnapshot(collection(db, "reviews"), (snap) => {
    allReviews = snap.docs.map(d => d.data());
    renderProducts(allProducts);
});
