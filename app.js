import { db, collection, onSnapshot, addDoc } from "./firebase.js";

/* =========================
🚀 INIT DEBUG
========================= */
console.log("🚀 APP LOADED");

/* =========================
STATE
========================= */
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allProducts = [];
let allReviews = [];
let currentProductId = null;
let selectedRating = 0;

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

    toast.innerHTML = msg;
    toast.classList.add("show");

    clearTimeout(window.__t);
    window.__t = setTimeout(() => {
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
});

/* =========================
PRICE
========================= */
function getFinalPrice(p) {
    const price = num(p.price);
    const discount = num(p.discount);

    return discount > 0
        ? Math.round(price - price * discount / 100)
        : price;
}

/* =========================
FIREBASE PRODUCTS
========================= */
onSnapshot(collection(db, "products"), (snap) => {
    console.log("🔥 PRODUCTS:", snap.docs.length);

    allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProducts(allProducts);

    document.getElementById("loadingScreen")?.remove();
});

/* =========================
FIREBASE REVIEWS
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

        const final = getFinalPrice(p);

        const reviews = allReviews.filter(r => r.productId === p.id);
        const avg = reviews.length
            ? (reviews.reduce((a, b) => a + num(b.rating), 0) / reviews.length).toFixed(1)
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
                    ⭐ ${avg} (${reviews.length})
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
    const s = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const c = document.getElementById("categoryFilter")?.value || "all";

    let filtered = [...allProducts];

    filtered = filtered.filter(p =>
        (p.name || "").toLowerCase().includes(s)
    );

    if (c !== "all") {
        filtered = filtered.filter(p => p.category === c);
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
    showToast("Cart cleared");
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
MODAL FIXED
========================= */
window.openModal = (id) => {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;

    currentProductId = id;

    document.getElementById("modalName").innerText = p.name;
    document.getElementById("modalPrice").innerText = "Rs " + getFinalPrice(p);
    document.getElementById("modalDesc").innerText = p.description || "";

    document.getElementById("productModal")?.classList.add("show");

    selectedRating = 0;
    updateStars(0);
};

window.closeModal = () => {
    document.getElementById("productModal")?.classList.remove("show");
};

/* =========================
STARS FIXED
========================= */
function setupStars() {
    setTimeout(() => {
        document.querySelectorAll("#starRating i").forEach((s, i) => {
            s.onclick = () => {
                selectedRating = i + 1;
                updateStars(selectedRating);
            };
        });
    }, 300);
}

function updateStars(rating) {
    document.querySelectorAll("#starRating i").forEach((s, i) => {
        if (i < rating) {
            s.classList.add("fa-solid");
            s.classList.remove("fa-regular");
        } else {
            s.classList.add("fa-regular");
            s.classList.remove("fa-solid");
        }
    });
}

/* =========================
REVIEWS FIXED
========================= */
function bindReview() {
    setTimeout(() => {
        const btn = document.getElementById("reviewSubmitBtn");

        btn.onclick = async () => {
            const text = document.getElementById("reviewText")?.value;

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
CHECKOUT FIXED (IMPORTANT)
========================= */
window.checkout = () => {
    const name = document.getElementById("cusName")?.value;
    const phone = document.getElementById("cusPhone")?.value;
    const address = document.getElementById("cusAddress")?.value;

    if (!name || !phone || !address) {
        showToast("Fill all details");
        return;
    }

    if (!cart.length) {
        showToast("Cart empty");
        return;
    }

    let subtotal = 0;

    const items = cart.map(i => {
        const t = i.price * i.qty;
        subtotal += t;
        return `${i.name} x${i.qty} = Rs ${t}`;
    }).join("\n");

    const delivery = subtotal > 5000 ? 0 : 375;
    const total = subtotal + delivery;

    const msg = `
🟢 ORDER

Name: ${name}
Phone: ${phone}
Address: ${address}

Items:
${items}

Total: Rs ${total}
`;

    window.open(`https://wa.me/94752425790?text=${encodeURIComponent(msg)}`);

    cart = [];
    updateCartDisplay();
};

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
ERROR HANDLER
========================= */
window.addEventListener("error", e => {
    console.error("❌ ERROR:", e.message);
});
