import { db, collection, onSnapshot } from "./firebase.js";

/* =========================
STATE
========================= */
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allProducts = [];
let selectedRating = 0;
let currentProductId = null;

/* =========================
UTILS
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

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

/* =========================
INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
    updateCartDisplay();

    document.getElementById("searchInput")?.addEventListener("input", filterProducts);
    document.getElementById("categoryFilter")?.addEventListener("change", filterProducts);
    document.getElementById("priceFilter")?.addEventListener("change", filterProducts);
    document.getElementById("discountFilter")?.addEventListener("change", filterProducts);

    setupStarRating();
});

/* =========================
CART UI TOGGLE
========================= */
window.toggleCart = () => {
    const drawer = document.getElementById("cartDrawer");
    if (!drawer) return;
    drawer.classList.toggle("open");
};

/* =========================
CART SYSTEM (SAFE)
========================= */
window.updateCartDisplay = () => {
    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");
    const floatingCount = document.getElementById("floatingCartCount");

    if (!cartItems || !cartTotal || !floatingCount) return;

    floatingCount.innerText = cart.length;

    let total = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = `<p style="text-align:center;padding:15px;">Your cart is empty 🛒</p>`;
        cartTotal.innerText = `Total: Rs 0`;
        saveCart();
        return;
    }

    cartItems.innerHTML = cart.map((item, index) => {
        const itemTotal = (item.price || 0) * (item.qty || 1);
        total += itemTotal;

        return `
            <div class="cart-item">
                <img src="${item.image || ''}" />
                <div class="cart-details">
                    <h4>${item.name}</h4>
                    <p>Rs ${itemTotal}</p>

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

    cartTotal.innerText = `Total: Rs ${total}`;
    saveCart();
};

window.addToCart = (id, name, price, image) => {
    if (!id) return;

    const safePrice = Number(price) || 0;
    const safeImage = image || "";

    const existing = cart.find(i => i.id === id);

    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({
            id,
            name,
            price: safePrice,
            image: safeImage,
            qty: 1
        });
    }

    updateCartDisplay();
    showToast("Item added 🛒");
};

window.changeQty = (i, d) => {
    if (!cart[i]) return;

    cart[i].qty += d;

    if (cart[i].qty <= 0) {
        cart.splice(i, 1);
    }

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
FILTER SYSTEM (SAFE FIXED)
========================= */
window.filterProducts = () => {
    const search = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const category = document.getElementById("categoryFilter")?.value || "all";

    let filtered = [...allProducts];

    if (search) {
        filtered = filtered.filter(p =>
            (p.name || "").toLowerCase().includes(search)
        );
    }

    if (category !== "all") {
        filtered = filtered.filter(p => p.category === category);
    }

    renderProducts(filtered);
};

/* =========================
PRODUCT RENDER
========================= */
window.renderProducts = (products) => {
    const grid = document.getElementById("products");
    if (!grid) return;

    if (!products || products.length === 0) {
        grid.innerHTML = `<p style="text-align:center;width:100%;">No products found 😕</p>`;
        return;
    }

    grid.innerHTML = products.map(p => {
        const discount = Number(p.discount || 0);
        const price = Number(p.price || 0);

        const final = discount > 0
            ? Math.round(price - (price * discount / 100))
            : price;

        const rating = p.rating || 0;

        return `
            <div class="card">
                ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ""}

                <img src="${p.image || ''}" />

                <div class="card-content">
                    <h3>${p.name}</h3>

                    <div style="color:#ffb400;font-size:12px;margin:5px 0;">
                        ${[1,2,3,4,5].map(i =>
                            i <= rating
                                ? '<i class="fa-solid fa-star"></i>'
                                : '<i class="fa-regular fa-star"></i>'
                        ).join("")}
                    </div>

                    <div class="price-box">
                        ${discount > 0 ? `<span class="old-price">Rs ${price}</span>` : ""}
                        <span class="new-price">Rs ${final}</span>
                    </div>

                    <div class="card-buttons">
                        <button onclick="openModal('${p.id}')">View</button>
                        <button onclick="addToCart('${p.id}','${p.name}',${final},'${p.image}')">
                            Add
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
};

/* =========================
MODAL (SAFE FIXED)
========================= */
window.openModal = (id) => {
    const p = allProducts.find(x => x.id === id);
    if (!p) {
        showToast("Product not found");
        return;
    }

    currentProductId = id;

    const discount = Number(p.discount || 0);
    const price = Number(p.price || 0);

    const final = discount > 0
        ? Math.round(price - (price * discount / 100))
        : price;

    document.getElementById("modalName").innerText = p.name || "";
    document.getElementById("modalPrice").innerText = "Rs " + final;
    document.getElementById("modalDesc").innerText = p.description || "";

    const images = (p.images && p.images.length) ? p.images : [p.image];

    document.getElementById("galleryContainer").innerHTML = `
        <img src="${images[0] || ''}" id="mainModalImg" />

        <div class="thumbnail-grid">
            ${images.map(img => `
                <img src="${img}" class="thumbnail"
                onclick="document.getElementById('mainModalImg').src='${img}'" />
            `).join("")}
        </div>
    `;

    selectedRating = 0;
    updateStars(0);

    document.getElementById("modalAddBtn").onclick = () => {
        window.addToCart(p.id, p.name, final, images[0]);
        closeModal();
    };

    document.getElementById("productModal").classList.add("show");
};

window.closeModal = () => {
    document.getElementById("productModal")?.classList.remove("show");
};

/* =========================
STAR RATING
========================= */
function setupStarRating() {
    const stars = document.querySelectorAll("#starRating i");

    stars.forEach((star, index) => {
        star.onclick = () => {
            selectedRating = index + 1;
            updateStars(selectedRating);
        };
    });
}

function updateStars(rating) {
    const stars = document.querySelectorAll("#starRating i");

    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add("fa-solid");
            star.classList.remove("fa-regular");
        } else {
            star.classList.add("fa-regular");
            star.classList.remove("fa-solid");
        }
    });
}

/* =========================
DARK MODE (SAFE)
========================= */
window.toggleDarkMode = () => {
    document.body.classList.toggle("dark");

    const icon = document.querySelector(".icon-btn i");
    if (!icon) return;

    if (document.body.classList.contains("dark")) {
        icon.classList.replace("fa-moon", "fa-sun");
    } else {
        icon.classList.replace("fa-sun", "fa-moon");
    }
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

    document.getElementById("loadingScreen")?.remove();
});

window.addEventListener("load", () => {
    window.openModal = openModal;
    window.addToCart = addToCart;
    window.changeQty = changeQty;
    window.removeFromCart = removeFromCart;
    window.clearCart = clearCart;
    window.filterProducts = filterProducts;
    window.toggleDarkMode = toggleDarkMode;
    window.toggleCart = toggleCart;
    window.closeModal = closeModal;
});
