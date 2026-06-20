import {
    db,
    collection,
    onSnapshot,
    addDoc
} from "./firebase.js";

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
const $ = (id) => document.getElementById(id);

function num(v) {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
}

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function toast(msg) {
    const t = $("toast");
    if (!t) return;

    t.innerHTML = `<i class="fa-solid fa-check"></i> ${msg}`;
    t.classList.add("show");

    setTimeout(() => t.classList.remove("show"), 2000);
}

/* =========================
INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {

    $("searchInput")?.addEventListener("input", filterProducts);
    $("categoryFilter")?.addEventListener("change", filterProducts);

    $("modalAddBtn")?.addEventListener("click", () => {
        if (!currentProductId) return;

        const p = allProducts.find(x => x.id === currentProductId);
        if (!p) return;

        addToCart(p.id, p.name, getFinalPrice(p), p.image);
    });

    bindReview();
    setupStars();

    updateCartUI();
});

/* =========================
PRICE
========================= */
function getFinalPrice(p) {
    const price = num(p.price);
    const discount = num(p.discount);

    return discount > 0
        ? Math.round(price - (price * discount / 100))
        : price;
}

/* =========================
CART
========================= */
window.addToCart = (id, name, price, image) => {

    const item = cart.find(i => i.id === id);

    if (item) item.qty += 1;
    else cart.push({ id, name, price, image, qty: 1 });

    saveCart();
    updateCartUI();
    toast("Added to cart");
};

window.changeQty = (i, v) => {
    if (!cart[i]) return;

    cart[i].qty += v;

    if (cart[i].qty <= 0) cart.splice(i, 1);

    saveCart();
    updateCartUI();
};

window.removeFromCart = (i) => {
    cart.splice(i, 1);
    saveCart();
    updateCartUI();
};

window.clearCart = () => {
    cart = [];
    saveCart();
    updateCartUI();
};

/* =========================
CART UI
========================= */
window.updateCartUI = () => {

    const box = $("cartItems");
    const totalBox = $("cartTotal");
    const badge = $("floatingCartCount");

    if (!box) return;

    if (cart.length === 0) {
        box.innerHTML = `<p style="text-align:center">Cart Empty</p>`;
        if (totalBox) totalBox.innerText = "Total: Rs 0";
        if (badge) badge.innerText = "0";
        return;
    }

    let total = 0;
    let qty = 0;

    box.innerHTML = cart.map((c, i) => {
        total += c.price * c.qty;
        qty += c.qty;

        return `
        <div class="cart-item">
            <img src="${c.image}">
            <div style="flex:1">
                <h4>${c.name}</h4>
                <p>Rs ${c.price * c.qty}</p>

                <div class="qty-box">
                    <button onclick="changeQty(${i},-1)">-</button>
                    <span>${c.qty}</span>
                    <button onclick="changeQty(${i},1)">+</button>
                </div>
            </div>

            <button class="remove-btn" onclick="removeFromCart(${i})">✕</button>
        </div>`;
    }).join("");

    if (totalBox) totalBox.innerText = `Total: Rs ${total}`;
    if (badge) badge.innerText = qty;
};

/* =========================
FILTER
========================= */
window.filterProducts = () => {

    const q = ($("searchInput")?.value || "").toLowerCase();
    const cat = $("categoryFilter")?.value || "all";

    let list = [...allProducts];

    if (q) {
        list = list.filter(p =>
            (p.name || "").toLowerCase().includes(q)
        );
    }

    if (cat !== "all") {
        list = list.filter(p => p.category === cat);
    }

    renderProducts(list);
};

/* =========================
PRODUCT RENDER
========================= */
window.renderProducts = (list) => {

    const grid = $("products");
    if (!grid) return;

    if (!list.length) {
        grid.innerHTML = `<p style="text-align:center;width:100%">No Products Found</p>`;
        return;
    }

    grid.innerHTML = list.map(p => {

        const final = getFinalPrice(p);

        const reviews = allReviews.filter(r => r.productId === p.id);
        const avg = reviews.length
            ? (reviews.reduce((a, b) => a + num(b.rating), 0) / reviews.length).toFixed(1)
            : 0;

        return `
        <div class="card">

            <img src="${p.image || ''}">

            <div class="card-content">

                <h3>${p.name}</h3>

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
MODAL
========================= */
window.openModal = (id) => {

    const p = allProducts.find(x => x.id === id);
    if (!p) return;

    currentProductId = id;

    $("productModal").classList.add("show");

    $("modalName").innerText = p.name;
    $("modalPrice").innerText = "Rs " + getFinalPrice(p);
    $("modalDesc").innerText = p.description || "";

    $("galleryContainer").innerHTML = `
        <img src="${p.image}" class="main-img">
    `;

    loadReviews();
};

/* =========================
REVIEWS
========================= */
function setupStars() {

    setTimeout(() => {
        document.querySelectorAll("#starRating i").forEach((s, i) => {
            s.onclick = () => {
                selectedRating = i + 1;

                document.querySelectorAll("#starRating i").forEach((x, j) => {
                    x.classList.toggle("fa-solid", j < selectedRating);
                    x.classList.toggle("fa-regular", j >= selectedRating);
                });
            };
        });
    }, 300);
}

function bindReview() {

    setTimeout(() => {

        $("reviewSubmitBtn")?.addEventListener("click", async () => {

            const text = $("reviewText")?.value;

            if (!currentProductId) return toast("Open product first");
            if (!text || selectedRating === 0) return toast("Add rating + review");

            await addDoc(collection(db, "reviews"), {
                productId: currentProductId,
                rating: selectedRating,
                text,
                createdAt: Date.now()
            });

            $("reviewText").value = "";
            selectedRating = 0;

            toast("Review added");
        });

    }, 300);
}

/* =========================
LOAD REVIEWS
========================= */
function loadReviews() {

    const box = $("reviewList");
    if (!box) return;

    const r = allReviews.filter(x => x.productId === currentProductId);

    box.innerHTML = r.map(x => `
        <div class="review-item">
            ⭐ ${x.rating} - ${x.text}
        </div>
    `).join("");
}

/* =========================
CHECKOUT
========================= */
window.checkout = async () => {

    const name = $("cusName")?.value;
    const phone = $("cusPhone")?.value;
    const address = $("cusAddress")?.value;

    if (!name || !phone || !address) return toast("Fill all fields");
    if (!cart.length) return toast("Cart empty");

    const order = {
        customerName: name,
        phone,
        address,
        items: cart,
        total: cart.reduce((a, b) => a + b.price * b.qty, 0),
        createdAt: Date.now()
    };

    window.open(
        `https://wa.me/94752425790?text=${encodeURIComponent(JSON.stringify(order))}`,
        "_blank"
    );

    await addDoc(collection(db, "orders"), order);

    cart = [];
    saveCart();
    updateCartUI();

    toast("Order sent");
};

/* =========================
UI
========================= */
window.toggleCart = () => {
    $("cartDrawer")?.classList.toggle("open");
};

window.toggleDarkMode = () => {
    document.body.classList.toggle("dark");
};

/* =========================
FIREBASE
========================= */
onSnapshot(collection(db, "products"), (snap) => {
    allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    renderProducts(allProducts);
    $("loadingScreen")?.remove();
});

onSnapshot(collection(db, "reviews"), (snap) => {
    allReviews = snap.docs.map(d => d.data());

    renderProducts(allProducts);

    if (currentProductId) loadReviews();
});
