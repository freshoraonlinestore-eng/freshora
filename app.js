import { db, collection, onSnapshot } from "./firebase.js";

/* =========================
STATE
========================= */
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allProducts = [];
let currentProduct = null;
let selectedRating = 0;

/* =========================
UTILS
========================= */
function toast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;

    t.innerText = msg;
    t.classList.add("show");

    setTimeout(() => t.classList.remove("show"), 2000);
}

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

/* =========================
INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    updateCart();
});

/* =========================
EVENT BIND (SAFE FIX)
========================= */
function bindEvents() {
    document.getElementById("searchInput")?.addEventListener("input", filter);
    document.getElementById("categoryFilter")?.addEventListener("change", filter);
    document.getElementById("priceFilter")?.addEventListener("change", filter);
    document.getElementById("discountFilter")?.addEventListener("change", filter);

    setupStars();
}

/* =========================
CART TOGGLE
========================= */
window.toggleCart = () => {
    document.getElementById("cartDrawer")?.classList.toggle("open");
};

/* =========================
CART SYSTEM
========================= */
window.updateCart = () => {
    const list = document.getElementById("cartItems");
    const totalBox = document.getElementById("cartTotal");
    const count = document.getElementById("floatingCartCount");

    if (!list || !totalBox || !count) return;

    count.innerText = cart.length;

    let total = 0;

    if (cart.length === 0) {
        list.innerHTML = `<p style="text-align:center;padding:10px;">Cart is empty</p>`;
        totalBox.innerText = "Total: Rs 0";
        saveCart();
        return;
    }

    list.innerHTML = cart.map((c, i) => {
        total += c.price * c.qty;

        return `
            <div class="cart-item">
                <img src="${c.image || ''}" />
                <div class="cart-details">
                    <h4>${c.name}</h4>
                    <p>Rs ${c.price * c.qty}</p>

                    <div class="qty-box">
                        <button onclick="qty(${i},-1)">-</button>
                        <span>${c.qty}</span>
                        <button onclick="qty(${i},1)">+</button>
                    </div>
                </div>

                <button class="remove-btn" onclick="removeItem(${i})">✕</button>
            </div>
        `;
    }).join("");

    totalBox.innerText = `Total: Rs ${total}`;
    saveCart();
};

/* =========================
ADD TO CART (SAFE)
========================= */
window.addToCart = (id, name, price, image) => {
    if (!id) return;

    const p = Number(price) || 0;
    const img = image || "";

    const found = cart.find(x => x.id === id);

    if (found) found.qty++;
    else cart.push({ id, name, price: p, image: img, qty: 1 });

    updateCart();
    toast("Added to cart 🛒");
};

/* =========================
QTY
========================= */
window.qty = (i, d) => {
    if (!cart[i]) return;

    cart[i].qty += d;
    if (cart[i].qty <= 0) cart.splice(i, 1);

    updateCart();
};

/* =========================
REMOVE / CLEAR
========================= */
window.removeItem = (i) => {
    cart.splice(i, 1);
    updateCart();
};

window.clearCart = () => {
    cart = [];
    updateCart();
};

/* =========================
FILTER
========================= */
window.filter = () => {
    const s = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const cat = document.getElementById("categoryFilter")?.value || "all";

    let data = [...allProducts];

    if (s) data = data.filter(p => (p.name || "").toLowerCase().includes(s));
    if (cat !== "all") data = data.filter(p => p.category === cat);

    render(data);
};

/* =========================
RENDER PRODUCTS
========================= */
window.render = (items) => {
    const box = document.getElementById("products");
    if (!box) return;

    if (!items.length) {
        box.innerHTML = `<p style="text-align:center;width:100%">No products 😕</p>`;
        return;
    }

    box.innerHTML = items.map(p => {
        const d = Number(p.discount || 0);
        const price = Number(p.price || 0);

        const final = d ? Math.round(price - (price * d / 100)) : price;

        return `
            <div class="card">
                ${d ? `<div class="discount-badge">-${d}%</div>` : ""}

                <img src="${p.image || ''}" />

                <div class="card-content">
                    <h3>${p.name}</h3>

                    <div class="price-box">
                        ${d ? `<span class="old-price">Rs ${price}</span>` : ""}
                        <span class="new-price">Rs ${final}</span>
                    </div>

                    <div class="card-buttons">
                        <button onclick="open('${p.id}')">View</button>
                        <button onclick="addToCart('${p.id}','${p.name}',${final},'${p.image}')">Add</button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
};

/* =========================
MODAL (FIXED)
========================= */
window.open = (id) => {
    const p = allProducts.find(x => x.id === id);
    if (!p) return toast("Not found");

    currentProduct = p;

    const d = Number(p.discount || 0);
    const price = Number(p.price || 0);
    const final = d ? Math.round(price - (price * d / 100)) : price;

    document.getElementById("modalName").innerText = p.name;
    document.getElementById("modalPrice").innerText = "Rs " + final;
    document.getElementById("modalDesc").innerText = p.description || "";

    const imgs = (p.images && p.images.length) ? p.images : [p.image];

    document.getElementById("galleryContainer").innerHTML = `
        <img src="${imgs[0]}" id="mainModalImg" />
    `;

    document.getElementById("modalAddBtn").onclick = () => {
        addToCart(p.id, p.name, final, imgs[0]);
        close();
    };

    document.getElementById("productModal").classList.add("show");
};

window.close = () => {
    document.getElementById("productModal")?.classList.remove("show");
};

/* =========================
STARS (SAFE)
========================= */
function setupStars() {
    const stars = document.querySelectorAll("#starRating i");

    stars.forEach((s, i) => {
        s.onclick = () => {
            selectedRating = i + 1;

            stars.forEach((x, j) => {
                x.classList.toggle("fa-solid", j < selectedRating);
                x.classList.toggle("fa-regular", j >= selectedRating);
            });
        };
    });
}

/* =========================
DARK MODE
========================= */
window.toggleDarkMode = () => {
    document.body.classList.toggle("dark");

    const icon = document.querySelector(".icon-btn i");
    if (!icon) return;

    icon.classList.toggle("fa-moon");
    icon.classList.toggle("fa-sun");
};

/* =========================
FIREBASE LOAD
========================= */
onSnapshot(collection(db, "products"), (snap) => {
    allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    render(allProducts);

    document.getElementById("loadingScreen")?.remove();
});
