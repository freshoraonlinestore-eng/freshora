import { db, collection, onSnapshot, addDoc } from "./firebase.js";

/* =========================
STATE
========================= */
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let recentlyViewed = JSON.parse(localStorage.getItem("recentlyViewed")) || [];

let allProducts = [];
let allReviews = [];

let currentProductId = null;
let selectedRating = 0;

/* =========================
COUPON SYSTEM
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
const saveLocal = () => {
    localStorage.setItem("cart", JSON.stringify(cart));
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    localStorage.setItem("recentlyViewed", JSON.stringify(recentlyViewed));
};

const num = (v) => Number(v) || 0;

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

    document.getElementById("searchInput")?.addEventListener("input", searchProducts);
    document.getElementById("categoryFilter")?.addEventListener("change", filterProducts);

    setupReviews();
    setupCoupon();
});

/* =========================
SAFE PRICE CALC
========================= */
function finalPrice(p) {
    if (!p || !p.price) return 0;

    let price = num(p.price);

    if (p.discount) {
        price -= (price * num(p.discount)) / 100;
    }

    if (appliedCoupon) {
        price -= (price * appliedCoupon) / 100;
    }

    return Math.round(price);
}

/* =========================
SEARCH
========================= */
window.searchProducts = () => {

    const q = document.getElementById("searchInput")?.value.toLowerCase() || "";

    const filtered = allProducts.filter(p =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
    );

    renderProducts(filtered);
};

/* =========================
FILTER
========================= */
window.filterProducts = () => {

    const cat = document.getElementById("categoryFilter")?.value || "all";

    if (cat === "all") {
        renderProducts(allProducts);
        return;
    }

    const filtered = allProducts.filter(p => p.category === cat);
    renderProducts(filtered);
};

/* =========================
RENDER PRODUCTS (SAFE)
========================= */
window.renderProducts = (products = []) => {

    const grid = document.getElementById("products");
    if (!grid) return;

    if (!Array.isArray(products) || products.length === 0) {
        grid.innerHTML = `<p style="text-align:center;width:100%">No products found 😢</p>`;
        return;
    }

    grid.innerHTML = products.map(p => {

        const price = finalPrice(p);

        const reviews = (allReviews || []).filter(r => r.productId === p.id);

        const avg = reviews.length
            ? (reviews.reduce((a, b) => a + num(b.rating), 0) / reviews.length).toFixed(1)
            : 0;

        return `
        <div class="card">

            ${p.discount ? `<div class="discount-badge">-${p.discount}%</div>` : ""}

            <img src="${p.image || ''}">

            <div class="card-content">

                <h3>${p.name || 'No name'}</h3>

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
OPEN PRODUCT
========================= */
window.openProduct = (id) => {

    const p = allProducts.find(x => x.id === id);
    if (!p) return;

    currentProductId = id;

    recentlyViewed = [id, ...recentlyViewed.filter(x => x !== id)].slice(0, 10);
    saveLocal();

    document.getElementById("productModal")?.classList.add("show");

    document.getElementById("modalName").innerText = p.name || "";
    document.getElementById("modalPrice").innerText = "Rs " + finalPrice(p);
    document.getElementById("modalDesc").innerText = p.description || "";

    loadRelated(p.category, id);
};

/* =========================
RELATED PRODUCTS
========================= */
function loadRelated(category, id) {

    const related = allProducts
        .filter(p => p.category === category && p.id !== id)
        .slice(0, 4);

    let box = document.getElementById("relatedBox");

    if (!box) {
        box = document.createElement("div");
        box.id = "relatedBox";
        document.querySelector(".modal-content")?.appendChild(box);
    }

    box.innerHTML =
        `<h4>Related Products</h4>` +
        related.map(p => `<p onclick="openProduct('${p.id}')">➡ ${p.name}</p>`).join("");
}

/* =========================
CART
========================= */
window.addToCartById = (id) => {

    const p = allProducts.find(x => x.id === id);
    if (!p) return;

    const item = cart.find(x => x.id === id);

    if (item) item.qty += 1;
    else cart.push({ id, name: p.name, price: finalPrice(p), qty: 1 });

    saveLocal();
    updateCartUI();
    toast("Added 🛒");
};

window.updateCartUI = () => {

    const el = document.getElementById("cartItems");
    const count = document.getElementById("floatingCartCount");

    let totalQty = 0;

    if (!el) return;

    el.innerHTML = cart.map(i => {
        totalQty += i.qty;

        return `
        <div class="cart-item">
            <h4>${i.name}</h4>
            <p>Rs ${i.price * i.qty}</p>
        </div>`;
    }).join("");

    if (count) count.innerText = totalQty;
};

/* =========================
WISHLIST
========================= */
window.toggleWishlist = (id) => {

    if (wishlist.includes(id)) {
        wishlist = wishlist.filter(x => x !== id);
        toast("Removed ❤️");
    } else {
        wishlist.push(id);
        toast("Added ❤️");
    }

    saveLocal();
};

/* =========================
COUPON
========================= */
function setupCoupon() {

    const input = document.getElementById("couponInput");
    if (!input) return;

    input.addEventListener("change", () => {

        const code = input.value.trim().toUpperCase();

        if (coupons[code]) {
            appliedCoupon = coupons[code];
            toast("Coupon applied " + appliedCoupon + "%");
        } else {
            appliedCoupon = null;
            toast("Invalid coupon");
        }
    });
}

/* =========================
REVIEWS (SAFE)
========================= */
function setupReviews() {

    setTimeout(() => {

        document.getElementById("reviewSubmitBtn")?.addEventListener("click", async () => {

            const text = document.getElementById("reviewText")?.value;

            if (!text || !selectedRating) {
                toast("Add rating + review");
                return;
            }

            if (!currentProductId) return;

            await addDoc(collection(db, "reviews"), {
                productId: currentProductId,
                text,
                rating: selectedRating,
                createdAt: Date.now()
            });

            toast("Review added");
        });

    }, 500);
}

/* =========================
FIREBASE LIVE SAFE LOAD
========================= */
onSnapshot(collection(db, "products"), (snap) => {

    allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() })) || [];

    renderProducts(allProducts);
});

onSnapshot(collection(db, "reviews"), (snap) => {

    allReviews = snap.docs.map(d => d.data()) || [];

    renderProducts(allProducts);
});
