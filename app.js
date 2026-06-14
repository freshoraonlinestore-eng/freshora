import { db, collection, onSnapshot } from "./firebase.js";

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

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
}

/* =========================
INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
    updateCartDisplay();

    const search = document.getElementById("searchInput");
    const cat = document.getElementById("categoryFilter");
    const price = document.getElementById("priceFilter");
    const discount = document.getElementById("discountFilter");

    search?.addEventListener("input", filterProducts);
    cat?.addEventListener("change", filterProducts);
    price?.addEventListener("change", filterProducts);
    discount?.addEventListener("change", filterProducts);

    setupStarRating();
});

/* =========================
CART SYSTEM
========================= */
window.updateCartDisplay = () => {
    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");
    const floatingCount = document.getElementById("floatingCartCount");

    if (!cartItems) return;

    let total = 0;

    floatingCount && (floatingCount.innerText = cart.length);

    if (cart.length === 0) {
        cartItems.innerHTML = `<p style="text-align:center; padding:10px;">Your cart is empty</p>`;
        if (cartTotal) cartTotal.innerText = "Total: Rs 0";
        return;
    }

    cartItems.innerHTML = cart.map((item, index) => {
        total += item.price * item.qty;

        return `
            <div class="cart-item">
                <img src="${item.image}" />
                <div class="cart-details">
                    <h4>${item.name}</h4>
                    <p>Rs ${item.price * item.qty}</p>
                    <div class="qty-box">
                        <button onclick="changeQty(${index}, -1)">-</button>
                        <span>${item.qty}</span>
                        <button onclick="changeQty(${index}, 1)">+</button>
                    </div>
                </div>
                <button class="remove-btn" onclick="removeFromCart(${index})">✕</button>
            </div>
        `;
    }).join("");

    if (cartTotal) cartTotal.innerText = `Total: Rs ${total}`;

    localStorage.setItem("cart", JSON.stringify(cart));
};

/* =========================
ADD TO CART (SAFE)
========================= */
window.addToCart = (id, name, price, image) => {
    const existing = cart.find(i => i.id === id);

    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({
            id,
            name,
            price: Number(price),
            image,
            qty: 1
        });
    }

    updateCartDisplay();
    showToast("Added to cart 🛒");
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
FILTERS (FIXED)
========================= */
window.filterProducts = () => {
    const searchTerm = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const category = document.getElementById("categoryFilter")?.value || "all";
    const priceFilter = document.getElementById("priceFilter")?.value || "all";
    const discountFilter = document.getElementById("discountFilter")?.value || "all";

    let filtered = [...allProducts];

    /* SEARCH */
    filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm)
    );

    /* CATEGORY */
    if (category !== "all") {
        filtered = filtered.filter(p => p.category === category);
    }

    /* PRICE FILTER (SAFE RANGE EXAMPLE) */
    if (priceFilter !== "all") {
        filtered = filtered.filter(p => {
            const price = Number(p.price);
            if (priceFilter === "low") return price < 500;
            if (priceFilter === "mid") return price >= 500 && price <= 2000;
            if (priceFilter === "high") return price > 2000;
            return true;
        });
    }

    /* DISCOUNT FILTER */
    if (discountFilter !== "all") {
        filtered = filtered.filter(p => {
            const d = Number(p.discount || 0);
            if (discountFilter === "0") return d === 0;
            if (discountFilter === "10") return d >= 10;
            if (discountFilter === "20") return d >= 20;
            return true;
        });
    }

    renderProducts(filtered);
};

/* =========================
RENDER PRODUCTS
========================= */
window.renderProducts = (products) => {
    const grid = document.getElementById("products");
    if (!grid) return;

    if (!products.length) {
        grid.innerHTML = `<p style="text-align:center; width:100%;">No products found</p>`;
        return;
    }

    grid.innerHTML = products.map(p => {
        const discount = Number(p.discount || 0);
        const final = discount > 0
            ? Math.round(p.price - (p.price * discount / 100))
            : Number(p.price);

        const rating = Number(p.rating || 0);

        return `
            <div class="card">
                ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ""}

                <img src="${p.image}" />

                <div class="card-content">
                    <h3>${p.name}</h3>

                    <div style="color:#ffb400; font-size:12px; margin-bottom:5px;">
                        ${[1,2,3,4,5].map(i =>
                            i <= rating
                                ? '<i class="fa-solid fa-star"></i>'
                                : '<i class="fa-regular fa-star"></i>'
                        ).join("")}
                    </div>

                    <div class="price-box">
                        ${discount > 0 ? `<span class="old-price">Rs ${p.price}</span>` : ""}
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
MODAL
========================= */
window.openModal = (id) => {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;

    currentProductId = id;

    const discount = Number(p.discount || 0);
    const final = discount > 0
        ? Math.round(p.price - (p.price * discount / 100))
        : Number(p.price);

    document.getElementById("modalName").innerText = p.name;
    document.getElementById("modalPrice").innerText = "Rs " + final;
    document.getElementById("modalDesc").innerText = p.description || "No description provided.";

    const images = (p.images && p.images.length) ? p.images : [p.image];

    document.getElementById("galleryContainer").innerHTML = `
        <img src="${images[0]}" class="main-img" id="mainModalImg" />
        <div class="thumbnail-grid">
            ${images.map(img => `
                <img src="${img}" class="thumbnail"
                    onclick="document.getElementById('mainModalImg').src='${img}'"
                />
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
    document.getElementById("productModal").classList.remove("show");
};

/* =========================
RATING SYSTEM
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
UI TOGGLES
========================= */
window.toggleCart = () => {
    document.getElementById("cartDrawer")?.classList.toggle("open");
};

window.toggleDarkMode = () => {
    document.body.classList.toggle("dark");

    const icon = document.querySelector("#darkModeBtn i");

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
