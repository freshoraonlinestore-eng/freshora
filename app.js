/* =========================
SERVICE WORKER
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
let currentProductId = null;

/* =========================
TOAST
========================= */
function showToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.innerText = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
}

/* =========================
INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
    const search = document.getElementById("searchInput");
    const cat = document.getElementById("categoryFilter");
    const price = document.getElementById("priceFilter");
    const discount = document.getElementById("discountFilter");

    if (search) search.addEventListener("input", filterProducts);
    if (cat) cat.addEventListener("change", filterProducts);
    if (price) price.addEventListener("change", filterProducts);
    if (discount) discount.addEventListener("change", filterProducts);

    updateCartDisplay();
});

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
        cartItems.innerHTML = `<div style="text-align:center; padding:20px; color:var(--muted)">Your cart is empty</div>`;
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
                    <button class="remove-btn" onclick="removeFromCart(${index})">✕</button>
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
FILTER SYSTEM
========================= */
window.filterProducts = () => {
    const searchQuery = (document.getElementById("searchInput")?.value || "").toLowerCase();
    const category = document.getElementById("categoryFilter")?.value || "all";
    const priceLimit = document.getElementById("priceFilter")?.value || "all";
    const discountLimit = document.getElementById("discountFilter")?.value || "all";

    const filtered = allProducts.filter(p => {
        const matchSearch = (p.name || "").toLowerCase().includes(searchQuery);
        const matchCategory = category === "all" || p.category === category;
        const matchPrice = priceLimit === "all" || Number(p.price) <= Number(priceLimit);
        const matchDiscount = discountLimit === "all" || Number(p.discount || 0) >= Number(discountLimit);
        return matchSearch && matchCategory && matchPrice && matchDiscount;
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
        const final = discount > 0 ? Math.round(original - (original * discount / 100)) : original;
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
MODAL SYSTEM
========================= */
window.openModal = (id) => {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    currentProductId = id;
    const finalPrice = Math.round(p.price - (p.price * (p.discount || 0) / 100));

    document.getElementById("modalName").innerText = p.name;
    document.getElementById("modalImage").src = p.image;
    document.getElementById("modalPrice").innerText = "Rs " + finalPrice;
    document.getElementById("reviewText").value = "";
    
    resetStars();
    loadReviews(id);
    setupStars();

    document.getElementById("modalAddBtn").onclick = () => {
        addToCart(p.id, p.name, finalPrice, p.image);
        closeModal();
    };

    document.getElementById("reviewSubmitBtn").onclick = () => submitReview(currentProductId);
    document.getElementById("productModal").classList.add("show");
};

window.closeModal = () => {
    document.getElementById("productModal")?.classList.remove("show");
    currentProductId = null;
};

/* =========================
STAR RATING SYSTEM
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
    document.querySelectorAll(".star-rating i").forEach((star, index) => {
        star.classList.toggle("active", index < r);
    });
}

function resetStars() {
    selectedRating = 0;
    document.querySelectorAll(".star-rating i").forEach(s => s.classList.remove("active"));
}

/* =========================
REVIEW SYSTEM
========================= */
window.submitReview = (productId) => {
    const text = document.getElementById("reviewText").value;
    if (selectedRating === 0) return showToast("Select rating ⭐");
    if (!text.trim()) return showToast("Write review");

    const key = "reviews_" + productId;
    const reviews = JSON.parse(localStorage.getItem(key)) || [];
    reviews.push({ rating: selectedRating, text, date: new Date().toLocaleDateString() });
    localStorage.setItem(key, JSON.stringify(reviews));

    document.getElementById("reviewText").value = "";
    resetStars();
    loadReviews(productId);
    showToast("Review added ⭐");
};

window.loadReviews = (productId) => {
    const list = document.getElementById("reviewList");
    if (!list) return;
    const reviews = JSON.parse(localStorage.getItem("reviews_" + productId)) || [];
    if (reviews.length === 0) { list.innerHTML = "<p>No reviews yet</p>"; return; }
    
    const avg = (reviews.reduce((a,b)=>a+b.rating,0)/reviews.length).toFixed(1);
    list.innerHTML = `<h4>⭐ ${avg} / 5 (${reviews.length})</h4>` + reviews.map(r => `
        <div class="review-item">
            <div>${"⭐".repeat(r.rating)}</div>
            <div style="font-size:13px">${r.text}</div>
        </div>`).join("");
};

/* =========================
UI TOGGLES
========================= */
window.toggleCart = () => document.getElementById("cartDrawer")?.classList.toggle("open");

window.toggleDarkMode = () => {
    document.body.classList.toggle("dark");
    const btn = document.querySelector("#darkModeBtn i");
    if (btn) {
        if (document.body.classList.contains("dark")) btn.classList.replace("fa-moon", "fa-sun");
        else btn.classList.replace("fa-sun", "fa-moon");
    }
};

/* =========================
CHECKOUT
========================= */
window.checkout = () => {
    const name = document.getElementById("cusName")?.value;
    const phone = document.getElementById("cusPhone")?.value;
    const address = document.getElementById("cusAddress")?.value;
    if (!name || !phone || !address) return showToast("Fill details!");

    let subtotal = 0;
    cart.forEach(i => subtotal += i.price * i.qty);
    const total = subtotal + 375;

    let msg = `🟢 ORDER%0AName:${name}%0A`;
    cart.forEach((i,k)=> msg += `${k+1}) ${i.name} x${i.qty}%0A`);
    msg += `Total: Rs ${total}`;
    window.open(`https://wa.me/94752425790?text=${msg}`, "_blank");
};

/* =========================
FIREBASE LOAD
========================= */
onSnapshot(collection(db, "products"), (snapshot) => {
    allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderProducts(allProducts);
    updateCartDisplay();
    document.getElementById("loadingScreen")?.remove();
});
