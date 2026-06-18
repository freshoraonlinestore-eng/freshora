import {
  db,
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc
} from "./firebase.js";

/* =========================
   STATE
========================= */
let productsData = [];
let cart = [];
let currentProduct = null;
let selectedRating = 0;

/* =========================
   HELPERS
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
   DARK MODE
========================= */
window.toggleDarkMode = () => {
    document.body.classList.toggle("dark");

    const icon = document.querySelector("#darkModeBtn i");
    if (document.body.classList.contains("dark")) {
        icon.classList.replace("fa-moon", "fa-sun");
    } else {
        icon.classList.replace("fa-sun", "fa-moon");
    }
};

/* =========================
   CART
========================= */
window.toggleCart = () => {
    qs("cartDrawer").classList.toggle("open");
};

window.addToCart = (product) => {
    const existing = cart.find(p => p.id === product.id);

    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    renderCart();
    toast("Added to cart");
};

window.clearCart = () => {
    cart = [];
    renderCart();
};

/* =========================
   CART RENDER
========================= */
function renderCart() {
    const box = qs("cartItems");

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
   CHECKOUT
========================= */
window.checkout = async () => {
    if (!cart.length) return toast("Cart empty");

    const order = {
        customerName: qs("cusName").value,
        phone: qs("cusPhone").value,
        address: qs("cusAddress").value,
        items: cart,
        totalBill: cart.reduce((a, b) => a + b.qty * b.price, 0),
        status: "Pending",
        createdAt: Date.now()
    };

    await addDoc(collection(db, "orders"), order);

    cart = [];
    renderCart();

    toast("Order placed!");
};

/* =========================
   PRODUCTS LOAD
========================= */
onSnapshot(collection(db, "products"), (snap) => {
    productsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProducts(productsData);
});

/* =========================
   RENDER PRODUCTS
========================= */
function renderProducts(list) {
    const box = qs("products");

    box.innerHTML = list.map(p => {

        const img = (p.images && p.images.length)
            ? p.images[0]
            : (p.image || "https://via.placeholder.com/200");

        return `
        <div class="product-card" onclick='openProduct("${p.id}")'>

            <img src="${img}" />

            <h3>${p.name}</h3>

            <p>Rs ${p.price}</p>

            <button onclick='event.stopPropagation(); addToCart(${JSON.stringify(p)})'>
                Add
            </button>

        </div>
        `;
    }).join("");
}

/* =========================
   OPEN PRODUCT MODAL
========================= */
window.openProduct = (id) => {
    const p = productsData.find(x => x.id === id);
    if (!p) return;

    currentProduct = p;

    qs("productModal").style.display = "block";

    qs("modalName").innerText = p.name;
    qs("modalPrice").innerText = "Rs " + p.price;
    qs("modalDesc").innerText = p.description || "";

    renderGallery(p.images || []);

    loadReviews(id);
};

/* =========================
   CLOSE MODAL
========================= */
window.closeModal = () => {
    qs("productModal").style.display = "none";
};

/* =========================
   GALLERY
========================= */
function renderGallery(images = []) {
    const box = qs("galleryContainer");

    if (!images.length) {
        box.innerHTML = `<img src="https://via.placeholder.com/300" />`;
        return;
    }

    box.innerHTML = images.map(img => `
        <img src="${img}" style="width:100%;margin-bottom:5px;border-radius:10px;">
    `).join("");
}

/* =========================
   REVIEWS
========================= */
function loadReviews(productId) {
    const box = qs("reviewList");
    if (!box) return;

    onSnapshot(collection(db, "reviews"), (snap) => {
        const reviews = snap.docs
            .map(d => d.data())
            .filter(r => r.productId === productId);

        box.innerHTML = reviews.map(r => `
            <div class="review">
                ⭐ ${r.text}
            </div>
        `).join("");
    });
}

/* =========================
   SUBMIT REVIEW
========================= */
document.addEventListener("DOMContentLoaded", () => {
    qs("reviewSubmitBtn").addEventListener("click", async () => {
        if (!currentProduct) return;

        const text = qs("reviewText").value;
        if (!text) return;

        await addDoc(collection(db, "reviews"), {
            productId: currentProduct.id,
            text,
            rating: selectedRating,
            createdAt: Date.now()
        });

        qs("reviewText").value = "";
        toast("Review added");
    });
});

/* =========================
   STARS
========================= */
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("#starRating i").forEach(star => {
        star.addEventListener("click", () => {
            selectedRating = star.dataset.value;
        });
    });
});

/* =========================
   FILTERS
========================= */
document.addEventListener("DOMContentLoaded", () => {

    qs("categoryFilter").addEventListener("change", filterProducts);
    qs("priceFilter").addEventListener("change", filterProducts);
    qs("discountFilter").addEventListener("change", filterProducts);

});

function filterProducts() {
    let filtered = [...productsData];

    const cat = qs("categoryFilter").value;
    const price = qs("priceFilter").value;
    const disc = qs("discountFilter").value;

    if (cat !== "all") {
        filtered = filtered.filter(p => p.category === cat);
    }

    if (price === "low") filtered = filtered.filter(p => p.price < 1000);
    if (price === "mid") filtered = filtered.filter(p => p.price >= 1000 && p.price < 5000);
    if (price === "high") filtered = filtered.filter(p => p.price >= 5000);

    if (disc === "10") filtered = filtered.filter(p => p.discount >= 10);
    if (disc === "20") filtered = filtered.filter(p => p.discount >= 20);
    if (disc === "50") filtered = filtered.filter(p => p.discount >= 50);

    renderProducts(filtered);
}

/* =========================
   SEARCH
========================= */
document.addEventListener("DOMContentLoaded", () => {
    qs("searchInput").addEventListener("input", (e) => {
        const val = e.target.value.toLowerCase();

        const filtered = productsData.filter(p =>
            p.name.toLowerCase().includes(val) ||
            (p.category || "").toLowerCase().includes(val)
        );

        renderProducts(filtered);
    });
});
