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

    t.innerHTML = `<i class="fa-solid fa-check"></i> ${msg}`;
    t.classList.add("show");

    setTimeout(() => t.classList.remove("show"), 2000);
}

/* =========================
INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {

    updateCartUI();

    document.getElementById("searchInput")?.addEventListener("input", filterProducts);
    document.getElementById("categoryFilter")?.addEventListener("change", filterProducts);

    setupStars();
    bindReview();

    document.getElementById("modalAddBtn")?.addEventListener("click", () => {
        const p = allProducts.find(x => x.id === currentProductId);
        if (p) addToCart(p);
    });

    renderWishlist();
});

/* =========================
PRICE
========================= */
function finalPrice(p) {
    return p.discount > 0
        ? Math.round(p.price - (p.price * p.discount / 100))
        : p.price;
}

/* =========================
PRODUCT FILTER + SEARCH
========================= */
window.filterProducts = () => {
    const q = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const cat = document.getElementById("categoryFilter")?.value || "all";

    let list = [...allProducts];

    list = list.filter(p => p.name.toLowerCase().includes(q));

    if (cat !== "all") {
        list = list.filter(p => p.category === cat);
    }

    if (!list.length) {
        document.getElementById("products").innerHTML =
            `<p style="text-align:center;width:100%">No products found 😢</p>`;
        return;
    }

    renderProducts(list);
};

/* =========================
PRODUCT RENDER
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

                <div class="card-buttons">
                    <button onclick="openProduct('${p.id}')">View</button>
                    <button onclick="addToCartById('${p.id}')">Add</button>
                </div>

                <button onclick="toggleWishlist('${p.id}')"
                        style="margin-top:8px;background:#eee;width:100%;">
                    ❤️ Wishlist
                </button>

            </div>
        </div>`;
    }).join("");
};

/* =========================
WISHLIST
========================= */
window.toggleWishlist = (id) => {
    if (wishlist.includes(id)) {
        wishlist = wishlist.filter(x => x !== id);
        toast("Removed from wishlist");
    } else {
        wishlist.push(id);
        toast("Added to wishlist ❤️");
    }
    save();
    renderWishlist();
};

function renderWishlist() {
    console.log("Wishlist:", wishlist);
}

/* =========================
RECENTLY VIEWED
========================= */
function addRecentlyViewed(id) {
    recentlyViewed = [id, ...recentlyViewed.filter(x => x !== id)].slice(0, 10);
    save();
}

/* =========================
OPEN PRODUCT
========================= */
window.openProduct = (id) => {

    const p = allProducts.find(x => x.id === id);
    if (!p) return;

    currentProductId = id;

    addRecentlyViewed(id);

    document.getElementById("modalName").innerText = p.name;
    document.getElementById("modalPrice").innerText = "Rs " + finalPrice(p);
    document.getElementById("modalDesc").innerText = p.description;

    document.getElementById("productModal").classList.add("show");

    loadRelated(p.category, id);
};

/* =========================
RELATED PRODUCTS
========================= */
function loadRelated(category, id) {
    const related = allProducts.filter(p => p.category === category && p.id !== id).slice(0, 4);

    if (!document.getElementById("relatedBox")) {
        const div = document.createElement("div");
        div.id = "relatedBox";
        div.innerHTML = "<h4>Related Products</h4><div id='relatedList'></div>";
        document.querySelector(".modal-content").appendChild(div);
    }

    document.getElementById("relatedList").innerHTML =
        related.map(p => `<p onclick="openProduct('${p.id}')">➡ ${p.name}</p>`).join("");
}

/* =========================
CART
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
    toast("Added to cart 🛒");
}

window.updateCartUI = () => {

    const el = document.getElementById("cartItems");
    const count = document.getElementById("floatingCartCount");

    let totalQty = 0;

    el.innerHTML = cart.map((i, idx) => {
        totalQty += i.qty;

        return `
        <div class="cart-item">
            <div>
                <h4>${i.name}</h4>
                <p>Rs ${i.price * i.qty}</p>

                <div class="qty-box">
                    <button onclick="changeQty(${idx},-1)">-</button>
                    <span>${i.qty}</span>
                    <button onclick="changeQty(${idx},1)">+</button>
                </div>
            </div>
        </div>`;
    }).join("");

    count.innerText = totalQty;
    save();
};

window.changeQty = (i, v) => {
    cart[i].qty += v;
    if (cart[i].qty <= 0) cart.splice(i, 1);
    updateCartUI();
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
    }, 300);
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

            if (!text || !selectedRating) return toast("Add review + rating");

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
FIREBASE LIVE DATA
========================= */
onSnapshot(collection(db, "products"), (snap) => {
    allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProducts(allProducts);
});

onSnapshot(collection(db, "reviews"), (snap) => {
    allReviews = snap.docs.map(d => d.data());
    renderProducts(allProducts);
});
