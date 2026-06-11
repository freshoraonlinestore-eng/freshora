/* =========================
SERVICE WORKER (CACHE FIX)
========================= */
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js")
        .then(() => console.log("SW Registered"))
        .catch(err => console.log("SW Error", err));
}

/* =========================
FIREBASE
========================= */
import { db, collection, onSnapshot } from "./firebase.js";

/* =========================
STATE
========================= */
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allProducts = [];
let selectedRating = 0;

/* =========================
TOAST SYSTEM
========================= */
function showToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.innerText = msg;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
}

/* =========================
CART SYSTEM
========================= */
window.updateCartDisplay = () => {
    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");
    const floatingCount = document.getElementById("floatingCartCount");

    if (!cartItems || !cartTotal || !floatingCount) return;

    floatingCount.innerText = cart.length;

    let total = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = `<div class="empty">Your cart is empty</div>`;
    } else {
        cartItems.innerHTML = cart.map((item, index) => {
            total += item.price * item.qty;

            return `
                <div class="cart-item">
                    <img src="${item.image}" />
                    <div class="cart-details">
                        <h4>${item.name}</h4>
                        <p>Rs ${item.price * item.qty}</p>

                        <div class="qty-box">
                            <button onclick="changeQty(${index},-1)">-</button>
                            <span>${item.qty}</span>
                            <button onclick="changeQty(${index},1)">+</button>
                        </div>
                    </div>

                    <button class="remove-btn" onclick="removeFromCart(${index})">
                        <i class="fa fa-xmark"></i>
                    </button>
                </div>
            `;
        }).join("");
    }

    cartTotal.innerText = `Total: Rs ${total}`;
    localStorage.setItem("cart", JSON.stringify(cart));
};

window.addToCart = (id, name, price, image) => {
    const existing = cart.find(i => i.id === id);

    if (existing) existing.qty++;
    else cart.push({ id, name, price: Number(price), image, qty: 1 });

    updateCartDisplay();
    showToast("Added to cart 🛒");
};

window.changeQty = (i, d) => {
    cart[i].qty += d;
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
};

/* =========================
FILTER
========================= */
window.filterProducts = () => {
    const search = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const category = document.getElementById("categoryFilter")?.value || "all";
    const price = document.getElementById("priceFilter")?.value || "all";
    const discount = document.getElementById("discountFilter")?.value || "all";

    const filtered = allProducts.filter(p => {
        return (
            p.name.toLowerCase().includes(search) &&
            (category === "all" || p.category === category) &&
            (price === "all" || Number(p.price) <= Number(price)) &&
            (discount === "all" || Number(p.discount || 0) >= Number(discount))
        );
    });

    renderProducts(filtered);
};

/* =========================
PRODUCT RENDER
========================= */
window.renderProducts = (products) => {
    const grid = document.getElementById("products");
    if (!grid) return;

    grid.innerHTML = products.map(p => {

        const original = Number(p.price);
        const discount = Number(p.discount || 0);
        const final = discount > 0
            ? Math.round(original - (original * discount / 100))
            : original;

        return `
            <div class="card">

                ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ""}

                <img src="${p.image}" />

                <div class="card-content">
                    <h3>${p.name}</h3>

                    <div class="price-box">
                        ${discount > 0 ? `<span class="old-price">Rs ${original}</span>` : ""}
                        <span class="new-price">Rs ${final}</span>
                    </div>

                    <div class="card-buttons">
                        <button onclick="openModal('${p.id}')">View</button>
                        <button onclick="addToCart('${p.id}','${p.name}',${final},'${p.image}')">Add</button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
};

/* =========================
MODAL
========================= */
window.openModal = (id) => {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;

    const finalPrice = Math.round(p.price - (p.price * (p.discount || 0) / 100));

    document.getElementById("modalName").innerText = p.name;
    document.getElementById("modalImage").src = p.image;
    document.getElementById("modalPrice").innerText = "Rs " + finalPrice;

    selectedRating = 0;
    resetStars();

    loadReviews(p.id);

    document.getElementById("modalAddBtn").onclick = () => {
        addToCart(p.id, p.name, finalPrice, p.image);
        closeModal();
    };

    setupStars();

    document.getElementById("reviewSubmitBtn").onclick = () => {
        submitReview(p.id);
    };

    document.getElementById("productModal").classList.add("show");
};

window.closeModal = () => {
    document.getElementById("productModal")?.classList.remove("show");
};

/* =========================
⭐ STAR RATING
========================= */
function setupStars() {
    document.querySelectorAll(".star-rating i").forEach(star => {
        star.onclick = () => {
            selectedRating = Number(star.dataset.value);
            highlightStars(selectedRating);
        };
    });
}

function highlightStars(r) {
    document.querySelectorAll(".star-rating i").forEach(star => {
        star.classList.toggle("active", Number(star.dataset.value) <= r);
    });
}

function resetStars() {
    selectedRating = 0;
    document.querySelectorAll(".star-rating i").forEach(s => s.classList.remove("active"));
}

/* =========================
REVIEWS SYSTEM (PRO)
========================= */
function submitReview(productId) {
    const text = document.getElementById("reviewText").value;

    if (!selectedRating) return showToast("Select rating ⭐");
    if (!text) return showToast("Write review");

    const key = "reviews_" + productId;
    const reviews = JSON.parse(localStorage.getItem(key)) || [];

    reviews.push({
        rating: selectedRating,
        text,
        date: new Date().toLocaleString()
    });

    localStorage.setItem(key, JSON.stringify(reviews));

    document.getElementById("reviewText").value = "";
    resetStars();

    loadReviews(productId);

    showToast("Review added ⭐");
}

window.loadReviews = (productId) => {
    const list = document.getElementById("reviewList");
    if (!list) return;

    const reviews = JSON.parse(localStorage.getItem("reviews_" + productId)) || [];

    if (reviews.length === 0) {
        list.innerHTML = "<p>No reviews yet</p>";
        return;
    }

    const avg = (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1);

    list.innerHTML = `
        <h4>⭐ ${avg} / 5 (${reviews.length})</h4>
        ${reviews.map(r => `
            <div class="review-item">
                <div class="review-header">
                    <span class="review-user">${"⭐".repeat(r.rating)}</span>
                    <small>${r.date}</small>
                </div>
                <div class="review-text">${r.text}</div>
            </div>
        `).join("")}
    `;
};

/* =========================
CART TOGGLE
========================= */
window.toggleCart = () => {
    document.getElementById("cartDrawer")?.classList.toggle("open");
};

window.toggleDarkMode = () => {
    document.body.classList.toggle("dark");
};

/* =========================
CHECKOUT
========================= */
window.checkout = () => {
    const name = document.getElementById("cusName")?.value;
    const phone = document.getElementById("cusPhone")?.value;
    const address = document.getElementById("cusAddress")?.value;

    if (!name || !phone || !address) {
        showToast("Fill details!");
        return;
    }

    let subtotal = 0;
    cart.forEach(i => subtotal += i.price * i.qty);

    const delivery = 375;
    const total = subtotal + delivery;

    let msg = `🟢 ORDER%0A`;
    msg += `Name: ${name}%0APhone: ${phone}%0A`;

    cart.forEach((i, k) => {
        msg += `${k + 1}) ${i.name} x${i.qty}%0A`;
    });

    msg += `Total: Rs ${total}`;

    window.open(`https://wa.me/94752425790?text=${msg}`, "_blank");
};

/* =========================
FIREBASE LOAD
========================= */
onSnapshot(collection(db, "products"), (snapshot) => {
    allProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    renderProducts(allProducts);
    updateCartDisplay();

    document.getElementById("loadingScreen")?.remove();
});
