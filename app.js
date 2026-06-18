/* =========================
   IMPORTS (MUST BE FIRST)
========================= */
import {
  db,
  collection,
  addDoc,
  onSnapshot
} from "./firebase.js";

/* =========================
   START LOG
========================= */
console.log("🚀 APP STARTED");

/* =========================
   GLOBAL STATE
========================= */
let productsData = [];
let cart = [];
let currentProduct = null;
let selectedRating = 0;

/* =========================
   SAFE HELPERS
========================= */
const qs = (id) => document.getElementById(id);

function toast(msg) {
    const t = qs("toast");
    if (!t) return;

    t.innerText = msg;
    t.style.display = "block";
    setTimeout(() => (t.style.display = "none"), 2000);
}

/* =========================
   SAFE DOM READY WRAPPER
========================= */
document.addEventListener("DOMContentLoaded", () => {

    initUI();

});

/* =========================
   INIT UI
========================= */
function initUI() {

    /* DARK MODE */
    window.toggleDarkMode = () => {
        document.body.classList.toggle("dark");
        const icon = document.querySelector("#darkModeBtn i");
        if (!icon) return;

        icon.classList.toggle("fa-moon");
        icon.classList.toggle("fa-sun");
    };

    /* CART */
    window.toggleCart = () => {
        qs("cartDrawer")?.classList.toggle("open");
    };

    window.clearCart = () => {
        cart = [];
        renderCart();
    };

    /* FILTERS */
    ["categoryFilter", "priceFilter", "discountFilter"].forEach(id => {
        qs(id)?.addEventListener("change", filterProducts);
    });

    /* SEARCH */
    qs("searchInput")?.addEventListener("input", (e) => {
        const val = e.target.value.toLowerCase();
        const filtered = productsData.filter(p =>
            (p.name || "").toLowerCase().includes(val) ||
            (p.category || "").toLowerCase().includes(val)
        );
        renderProducts(filtered);
    });

    /* REVIEWS */
    qs("reviewSubmitBtn")?.addEventListener("click", submitReview);

    document.querySelectorAll("#starRating i").forEach(star => {
        star.addEventListener("click", () => {
            selectedRating = star.dataset.value;
        });
    });
}

/* =========================
   PRODUCTS LOAD (SAFE)
========================= */
onSnapshot(collection(db, "products"), (snap) => {

    if (!snap) return;

    productsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    renderProducts(productsData);

});

/* =========================
   SAFE PRODUCT RENDER
========================= */
function renderProducts(list = []) {

    const box = qs("products");
    if (!box) return;

    box.innerHTML = list.map(p => {

        const img =
            (p.images && p.images.length)
                ? p.images[0]
                : p.image || "https://via.placeholder.com/200";

        return `
        <div class="product-card" onclick="openProduct('${p.id}')">

            <img src="${img}" />

            <h3>${p.name || ""}</h3>

            <p>Rs ${p.price || 0}</p>

            <button onclick="event.stopPropagation(); addToCart('${p.id}')">
                Add
            </button>

        </div>
        `;
    }).join("");
}

/* =========================
   OPEN PRODUCT
========================= */
window.openProduct = (id) => {

    const p = productsData.find(x => x.id === id);
    if (!p) return;

    currentProduct = p;

    qs("productModal").style.display = "block";

    qs("modalName").innerText = p.name || "";
    qs("modalPrice").innerText = "Rs " + (p.price || 0);
    qs("modalDesc").innerText = p.description || "";

    renderGallery(p.images || []);
    loadReviews(id);
};

/* =========================
   CART SAFE
========================= */
window.addToCart = (id) => {

    const p = productsData.find(x => x.id === id);
    if (!p) return;

    const existing = cart.find(x => x.id === id);

    if (existing) existing.qty++;
    else cart.push({ ...p, qty: 1 });

    renderCart();
    toast("Added to cart");
};

function renderCart() {

    const box = qs("cartItems");
    if (!box) return;

    box.innerHTML = cart.map(p => `
        <div class="cart-item">
            <span>${p.name}</span>
            <span>${p.qty} x Rs ${p.price}</span>
        </div>
    `).join("");

    const total = cart.reduce((a, b) => a + b.qty * b.price, 0);

    qs("cartTotal").innerText = "Total: Rs " + total;
    qs("floatingCartCount").innerText = cart.reduce((a, b) => a + b.qty, 0);
}

/* =========================
   CHECKOUT SAFE
========================= */
window.checkout = async () => {

    if (!cart.length) return toast("Cart empty");

    await addDoc(collection(db, "orders"), {
        customerName: qs("cusName")?.value || "",
        phone: qs("cusPhone")?.value || "",
        address: qs("cusAddress")?.value || "",
        items: cart,
        totalBill: cart.reduce((a, b) => a + b.qty * b.price, 0),
        status: "Pending",
        createdAt: Date.now()
    });

    cart = [];
    renderCart();
    toast("Order placed!");
};

/* =========================
   REVIEWS SAFE
========================= */
function loadReviews(productId) {

    const box = qs("reviewList");
    if (!box) return;

    onSnapshot(collection(db, "reviews"), (snap) => {

        const reviews = snap.docs
            .map(d => d.data())
            .filter(r => r.productId === productId);

        box.innerHTML = reviews.map(r => `
            <div class="review">⭐ ${r.text}</div>
        `).join("");
    });
}

async function submitReview() {

    if (!currentProduct) return;

    const text = qs("reviewText")?.value;
    if (!text) return;

    await addDoc(collection(db, "reviews"), {
        productId: currentProduct.id,
        text,
        rating: selectedRating,
        createdAt: Date.now()
    });

    qs("reviewText").value = "";
    toast("Review added");
}

/* =========================
   GALLERY SAFE
========================= */
function renderGallery(images = []) {

    const box = qs("galleryContainer");
    if (!box) return;

    box.innerHTML = images.length
        ? images.map(img => `<img src="${img}" style="width:100%;margin-bottom:5px;border-radius:10px;">`).join("")
        : `<img src="https://via.placeholder.com/300">`;
}
