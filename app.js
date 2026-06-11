if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js")
        .then(() => console.log("SW Registered"))
        .catch(err => console.log("SW Error", err));
}

import { db, collection, onSnapshot } from "./firebase.js";

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allProducts = [];
let selectedRating = 5;

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
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-details">
                        <h4>${item.name}</h4>
                        <p>Rs ${item.price * item.qty}</p>

                        <div class="qty-box">
                            <button onclick="changeQty(${index}, -1)">-</button>
                            <span>${item.qty}</span>
                            <button onclick="changeQty(${index}, 1)">+</button>
                        </div>
                    </div>

                    <button class="remove-btn" onclick="removeFromCart(${index})">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            `;
        }).join("");
    }

    cartTotal.innerText = `Total: Rs ${total}`;
    localStorage.setItem("cart", JSON.stringify(cart));
};

window.changeQty = (index, delta) => {
    if (!cart[index]) return;

    cart[index].qty += delta;

    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }

    updateCartDisplay();
};

window.addToCart = (id, name, price, image) => {
    const existing = cart.find(item => item.id === id);

    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id, name, price: Number(price), image, qty: 1 });
    }

    updateCartDisplay();
    alert("Added to cart!");
};

window.removeFromCart = (index) => {
    cart.splice(index, 1);
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
    const searchQuery = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const category = document.getElementById("categoryFilter")?.value || "all";
    const priceLimit = document.getElementById("priceFilter")?.value || "all";
    const discountLimit = document.getElementById("discountFilter")?.value || "all";

    const filtered = allProducts.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery);
        const matchesCategory = category === "all" || p.category === category;
        const matchesPrice = priceLimit === "all" || Number(p.price) <= Number(priceLimit);
        const matchesDiscount = discountLimit === "all" || Number(p.discount || 0) >= Number(discountLimit);

        return matchesSearch && matchesCategory && matchesPrice && matchesDiscount;
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

                <img src="${p.image}" alt="${p.name}">

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
MODAL + DETAILS
========================= */

window.openModal = (id) => {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;

    const finalPrice = Math.round(p.price - (p.price * (p.discount || 0) / 100));

    document.getElementById("modalName").innerText = p.name;
    document.getElementById("modalImage").src = p.image;
    document.getElementById("modalPrice").innerText = "Rs " + finalPrice;

    loadReviews(p.id);

    document.getElementById("modalAddBtn").onclick = () => {
        addToCart(p.id, p.name, finalPrice, p.image);
        closeModal();
    };

    document.getElementById("productModal").classList.add("show");
};

window.closeModal = () => {
    document.getElementById("productModal")?.classList.remove("show");
};

window.toggleCart = () => {
    document.getElementById("cartDrawer")?.classList.toggle("open");
};

window.toggleDarkMode = () => {
    document.body.classList.toggle("dark");

    const icon = document.querySelector("#darkModeBtn i");
    if (!icon) return;

    icon.classList.toggle("fa-moon");
    icon.classList.toggle("fa-sun");
};

/* =========================
⭐ STAR RATING SYSTEM
========================= */

window.addEventListener("DOMContentLoaded", () => {
    const stars = document.querySelectorAll("#starRating i");
    const input = document.getElementById("reviewRating");

    if (!stars.length || !input) return;

    stars.forEach((star, index) => {
        star.addEventListener("click", () => {
            selectedRating = index + 1;
            input.value = selectedRating;

            stars.forEach((s, i) => {
                if (i <= index) {
                    s.classList.add("active");
                    s.classList.remove("fa-regular");
                    s.classList.add("fa-solid");
                } else {
                    s.classList.remove("active");
                    s.classList.add("fa-regular");
                    s.classList.remove("fa-solid");
                }
            });
        });
    });
});

/* =========================
REVIEWS SYSTEM
========================= */

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
                <div class="modal-rating-stars">
                    ${Array.from({ length: 5 }, (_, i) =>
                        `<i class="fa${i < r.rating ? 's' : 'r'} fa-star"></i>`
                    ).join("")}
                </div>
                <p>${r.text}</p>
            </div>
        `).join("")}
    `;
};

document.getElementById("reviewSubmitBtn")?.addEventListener("click", () => {
    const text = document.getElementById("reviewText")?.value;

    if (!text) return alert("Write review first!");

    const productName = document.getElementById("modalName")?.innerText;
    const product = allProducts.find(p => p.name === productName);

    if (!product) return;

    const key = "reviews_" + product.id;
    const reviews = JSON.parse(localStorage.getItem(key)) || [];

    reviews.push({
        rating: selectedRating,
        text
    });

    localStorage.setItem(key, JSON.stringify(reviews));

    document.getElementById("reviewText").value = "";
    loadReviews(product.id);
});

/* =========================
FIREBASE
========================= */

onSnapshot(collection(db, "products"), (snapshot) => {
    allProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    renderProducts(allProducts);
    updateCartDisplay();

    const loader = document.getElementById("loadingScreen");
    if (loader) loader.style.display = "none";
});
