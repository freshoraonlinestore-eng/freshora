import { db, collection, onSnapshot, addDoc } from "./firebase.js";

/* =========================
🚀 DEBUG START
========================= */
console.log("🚀 APP STARTED");

/* =========================
STATE
========================= */
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allProducts = [];
let allReviews = [];
let selectedRating = 0;
let currentProductId = null;

/* =========================
UTILS
========================= */
function num(v) {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
}

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function showToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.innerHTML = `
        <i class="fa-solid fa-circle-check"></i> ${msg}
    `;

    toast.classList.add("show");

    clearTimeout(window.__toast);
    window.__toast = setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
}

/* =========================
INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
    console.log("📄 DOM READY");

    updateCartDisplay();

    document.getElementById("searchInput")?.addEventListener("input", filterProducts);
    document.getElementById("categoryFilter")?.addEventListener("change", filterProducts);

    setupStars();
    bindReview();

    document.getElementById("modalAddBtn")?.addEventListener("click", () => {
        if (!currentProductId) return;

        const p = allProducts.find(x => x.id === currentProductId);
        if (!p) return;

        addToCart(p.id, p.name, getPrice(p), p.image);
    });
});

/* =========================
PRICE
========================= */
function getPrice(p) {
    const price = num(p.price);
    const discount = num(p.discount);

    return discount > 0
        ? Math.round(price - price * discount / 100)
        : price;
}

/* =========================
PRODUCTS LOAD (FIXED)
========================= */
onSnapshot(collection(db, "products"), (snap) => {
    console.log("🔥 PRODUCTS LOADED:", snap.docs.length);

    allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    renderProducts(allProducts);

    document.getElementById("loadingScreen")?.remove();
});

/* =========================
REVIEWS LOAD
========================= */
onSnapshot(collection(db, "reviews"), (snap) => {
    allReviews = snap.docs.map(d => d.data());
    renderProducts(allProducts);
});

/* =========================
RENDER PRODUCTS
========================= */
window.renderProducts = (products) => {
    const grid = document.getElementById("products");
    if (!grid) return;

    if (!products.length) {
        grid.innerHTML = `<p style="text-align:center;width:100%">No products</p>`;
        return;
    }

    grid.innerHTML = products.map(p => {

        const price = num(p.price);
        const final = getPrice(p);

        const reviews = allReviews.filter(r => r.productId === p.id);
        const count = reviews.length;

        const avg = count
            ? (reviews.reduce((a, b) => a + num(b.rating), 0) / count).toFixed(1)
            : 0;

        return `
        <div class="card">
            <img src="${p.image || ''}">

            <div class="card-content">
                <h3>${p.name || ''}</h3>

                <div class="price-box">
                    <span class="new-price">Rs ${final}</span>
                </div>

                <div class="product-rating">
                    ⭐ ${avg} (${count})
                </div>

                <div class="card-buttons">
                    <button onclick="openModal('${p.id}')">View</button>
                    <button onclick="addToCart('${p.id}','${p.name}',${final},'${p.image}')">Add</button>
                </div>
            </div>
        </div>`;
    }).join("");
};

/* =========================
FILTER
========================= */
window.filterProducts = () => {
    const search = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const cat = document.getElementById("categoryFilter")?.value || "all";

    let filtered = [...allProducts];

    filtered = filtered.filter(p =>
        (p.name || "").toLowerCase().includes(search)
    );

    if (cat !== "all") {
        filtered = filtered.filter(p => p.category === cat);
    }

    renderProducts(filtered);
};

/* =========================
CART SYSTEM
========================= */
window.addToCart = (id, name, price, image) => {
    const item = cart.find(i => i.id === id);

    if (item) item.qty++;
    else cart.push({ id, name, price: num(price), image, qty: 1 });

    updateCartDisplay();
    showToast("Added 🛒");
};

window.changeQty = (i, c) => {
    if (!cart[i]) return;

    cart[i].qty += c;

    if (cart[i].qty <= 0) cart.splice(i, 1);

    updateCartDisplay();
};

window.removeFromCart = (i) => {
    cart.splice(i, 1);
    updateCartDisplay();
};

window.clearCart = () => {
    cart = [];
    updateCartDisplay();
    showToast("Cleared");
};

window.updateCartDisplay = () => {
    const el = document.getElementById("cartItems");
    const totalEl = document.getElementById("cartTotal");
    const countEl = document.getElementById("floatingCartCount");

    let total = 0;
    let qty = 0;

    if (!cart.length) {
        el.innerHTML = "Cart empty";
        if (totalEl) totalEl.innerText = "Total: Rs 0";
        if (countEl) countEl.innerText = "0";
        saveCart();
        return;
    }

    el.innerHTML = cart.map((i, index) => {
        total += i.price * i.qty;
        qty += i.qty;

        return `
        <div class="cart-item">
            <img src="${i.image}">
            <div>
                <h4>${i.name}</h4>
                <p>Rs ${i.price * i.qty}</p>

                <div class="qty-box">
                    <button onclick="changeQty(${index},-1)">-</button>
                    <span>${i.qty}</span>
                    <button onclick="changeQty(${index},1)">+</button>
                </div>
            </div>

            <button onclick="removeFromCart(${index})">✕</button>
        </div>`;
    }).join("");

    if (totalEl) totalEl.innerText = `Total: Rs ${total}`;
    if (countEl) countEl.innerText = qty;

    saveCart();
};

/* =========================
MODAL
========================= */
window.openModal = (id) => {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;

    currentProductId = id;

    document.getElementById("modalName").innerText = p.name;
    document.getElementById("modalPrice").innerText = "Rs " + getPrice(p);
    document.getElementById("modalDesc").innerText = p.description || "";

    document.getElementById("productModal")?.classList.add("show");

    selectedRating = 0;
};

/* =========================
STARS + REVIEWS
========================= */
function setupStars() {
    setTimeout(() => {
        document.querySelectorAll("#starRating i").forEach((s, i) => {
            s.onclick = () => {
                selectedRating = i + 1;
            };
        });
    }, 300);
}

function bindReview() {
    setTimeout(() => {
        const btn = document.getElementById("reviewSubmitBtn");

        btn.onclick = async () => {
            const text = document.getElementById("reviewText").value;

            if (!text || !selectedRating || !currentProductId) {
                showToast("Add rating + review");
                return;
            }

            await addDoc(collection(db, "reviews"), {
                productId: currentProductId,
                rating: selectedRating,
                text,
                createdAt: Date.now()
            });

            document.getElementById("reviewText").value = "";
            selectedRating = 0;

            showToast("Review added");
        };
    }, 300);
}

/* =========================
UI
========================= */
window.toggleCart = () => {
    document.getElementById("cartDrawer")?.classList.toggle("open");
};

window.toggleDarkMode = () => {
    document.body.classList.toggle("dark");
};

/* =========================
ERROR HANDLER (IMPORTANT FIX)
========================= */
window.addEventListener("error", (e) => {
    console.error("❌ JS ERROR:", e.message);
});

window.addEventListener("unhandledrejection", (e) => {
    console.error("❌ PROMISE ERROR:", e.reason);
});
