import { db, collection, onSnapshot } from "./firebase.js";

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allProducts = [];

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
PRODUCT MODAL + DETAILS + REVIEWS
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
    const modal = document.getElementById("productModal");
    if (modal) modal.classList.remove("show");
};

window.toggleCart = () => {
    const drawer = document.getElementById("cartDrawer");
    if (drawer) drawer.classList.toggle("open");
};

window.toggleDarkMode = () => {
    document.body.classList.toggle("dark");
    const icon = document.querySelector("#darkModeBtn i");

    if (icon) {
        icon.classList.toggle("fa-moon");
        icon.classList.toggle("fa-sun");
    }
};

/* =========================
CHECKOUT
========================= */

window.checkout = () => {
    const name = document.getElementById("cusName")?.value;
    const phone = document.getElementById("cusPhone")?.value;
    const address = document.getElementById("cusAddress")?.value;

    if (!name || !phone || !address) {
        alert("Please fill in your details!");
        return;
    }

    const orderId = "FR-" + Date.now();
    const date = new Date().toLocaleString();

    let subtotal = 0;
    cart.forEach(item => subtotal += item.price * item.qty);

    const delivery = 375;
    const total = subtotal + delivery;

    let msg = `🟢 FRESHORA ORDER%0A%0A`;
    msg += `Order ID: ${orderId}%0A`;
    msg += `Date: ${date}%0A%0A`;
    msg += `Name: ${name}%0APhone: ${phone}%0AAddress: ${address}%0A%0A`;

    cart.forEach((item, i) => {
        msg += `${i + 1}) ${item.name} x${item.qty} = Rs ${item.price * item.qty}%0A`;
    });

    msg += `%0ASubtotal: Rs ${subtotal}%0ADelivery: Rs ${delivery}%0ATotal: Rs ${total}`;

    window.open(`https://wa.me/94752425790?text=${msg}`, "_blank");
};

/* =========================
REVIEWS SYSTEM (LOCAL STORAGE)
========================= */

window.loadReviews = (productId) => {
    const list = document.getElementById("reviewList");
    if (!list) return;

    const reviews = JSON.parse(localStorage.getItem("reviews_" + productId)) || [];

    if (reviews.length === 0) {
        list.innerHTML = "<p>No reviews yet</p>";
        return;
    }

    const avg = (
        reviews.reduce((a, b) => a + b.rating, 0) / reviews.length
    ).toFixed(1);

    list.innerHTML = `
        <h4>⭐ ${avg} / 5 (${reviews.length})</h4>
        ${reviews.map(r => `
            <div class="review-item">
                <b>${"⭐".repeat(r.rating)}</b>
                <p>${r.text}</p>
            </div>
        `).join("")}
    `;
};

document.getElementById("reviewSubmitBtn")?.addEventListener("click", () => {
    const rating = Number(document.getElementById("reviewRating")?.value);
    const text = document.getElementById("reviewText")?.value;

    if (!text) return alert("Write review first!");

    const productName = document.getElementById("modalName")?.innerText;
    const product = allProducts.find(p => p.name === productName);

    if (!product) return;

    const key = "reviews_" + product.id;
    const reviews = JSON.parse(localStorage.getItem(key)) || [];

    reviews.push({ rating, text });

    localStorage.setItem(key, JSON.stringify(reviews));

    document.getElementById("reviewText").value = "";

    loadReviews(product.id);
});

/* =========================
FIREBASE INIT
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
