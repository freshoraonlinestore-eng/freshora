import { db, collection, onSnapshot } from "./firebase.js";

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allProducts = [];

// =====================
// CART UPDATE SYSTEM
// =====================

const saveCart = () => {
    localStorage.setItem("cart", JSON.stringify(cart));
};

window.updateCartDisplay = () => {
    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");
    const floatingCount = document.getElementById("floatingCartCount");

    if (!cartItems || !cartTotal || !floatingCount) return;

    floatingCount.innerText = cart.reduce((sum, i) => sum + i.qty, 0);

    let total = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = `<div class="empty">Your cart is empty</div>`;
    } else {
        cartItems.innerHTML = cart.map((item, index) => {
            const itemTotal = item.price * item.qty;
            total += itemTotal;

            return `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}">

                    <div class="cart-details">
                        <h4>${item.name}</h4>
                        <p>Rs ${itemTotal}</p>

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
    saveCart();
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
        cart.push({
            id,
            name,
            price: Number(price),
            image,
            qty: 1
        });
    }

    updateCartDisplay();
};

window.removeFromCart = (index) => {
    cart.splice(index, 1);
    updateCartDisplay();
};

window.clearCart = () => {
    cart = [];
    updateCartDisplay();
};

// =====================
// FILTER SYSTEM
// =====================

window.filterProducts = () => {
    const searchInput = document.getElementById("searchInput");
    const categoryEl = document.getElementById("categoryFilter");
    const priceEl = document.getElementById("priceFilter");
    const discountEl = document.getElementById("discountFilter");

    if (!searchInput || !categoryEl || !priceEl || !discountEl) return;

    const searchQuery = searchInput.value.toLowerCase();
    const category = categoryEl.value;
    const priceLimit = priceEl.value;
    const discountLimit = discountEl.value;

    const filtered = allProducts.filter(p => {
        const name = (p.name || "").toLowerCase();

        const matchesSearch = name.includes(searchQuery);
        const matchesCategory = category === "all" || p.category === category;
        const matchesPrice = priceLimit === "all" || Number(p.price) <= Number(priceLimit);
        const matchesDiscount = discountLimit === "all" || Number(p.discount || 0) >= Number(discountLimit);

        return matchesSearch && matchesCategory && matchesPrice && matchesDiscount;
    });

    renderProducts(filtered);
};

// =====================
// PRODUCT RENDER
// =====================

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
                        <button onclick="addToCart('${p.id}', '${p.name}', ${final}, '${p.image}')">Add</button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
};

// =====================
// MODAL SYSTEM
// =====================

window.openModal = (id) => {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;

    const discount = Number(p.discount || 0);
    const finalPrice = Math.round(p.price - (p.price * discount / 100));

    document.getElementById("modalName").innerText = p.name;
    document.getElementById("modalImage").src = p.image;
    document.getElementById("modalPrice").innerText = "Rs " + finalPrice;

    document.getElementById("modalAddBtn").onclick = () => {
        addToCart(p.id, p.name, finalPrice, p.image);
        closeModal();
    };

    document.getElementById("productModal").classList.add("show");
};

window.closeModal = () => {
    document.getElementById("productModal").classList.remove("show");
};

// =====================
// UI TOGGLES
// =====================

window.toggleCart = () => {
    const drawer = document.getElementById("cartDrawer");
    if (!drawer) return;

    drawer.classList.toggle("open");
};

window.toggleDarkMode = () => {
    document.body.classList.toggle("dark");

    const icon = document.querySelector("#darkModeBtn i");
    if (!icon) return;

    icon.classList.toggle("fa-moon");
    icon.classList.toggle("fa-sun");
};

// =====================
// EVENTS
// =====================

document.getElementById("searchInput")?.addEventListener("input", filterProducts);
document.getElementById("categoryFilter")?.addEventListener("change", filterProducts);
document.getElementById("priceFilter")?.addEventListener("change", filterProducts);
document.getElementById("discountFilter")?.addEventListener("change", filterProducts);

// =====================
// CHECKOUT (SAFE + CLEAN)
// =====================

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

    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
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

// =====================
// FIREBASE LIVE DATA
// =====================

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
