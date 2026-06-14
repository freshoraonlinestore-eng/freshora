import { db, collection, onSnapshot, addDoc } from "./firebase.js";

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
function num(v) {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
}

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
    updateCartDisplay();
    bindFilters();
    setupStarRating();
    bindReviewButton();

    document.getElementById("modalAddBtn")?.addEventListener("click", addToCartFromModal);
});

/* =========================
FILTERS
========================= */
function bindFilters() {
    document.getElementById("searchInput")?.addEventListener("input", filterProducts);
    document.getElementById("categoryFilter")?.addEventListener("change", filterProducts);
}

/* =========================
CART DISPLAY
========================= */
window.updateCartDisplay = () => {
    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");
    const floating = document.getElementById("floatingCartCount");

    if (!cartItems) return;

    let total = 0;

    if (floating) floating.innerText = cart.length;

    if (cart.length === 0) {
        cartItems.innerHTML = `<p style="text-align:center;padding:10px;">Cart is empty</p>`;
        if (cartTotal) cartTotal.innerText = "Total: Rs 0";
        return;
    }

    cartItems.innerHTML = cart.map((item, i) => {
        const price = num(item.price);
        total += price * item.qty;

        return `
        <div class="cart-item">
            <img src="${item.image}" />
            <div>
                <h4>${item.name}</h4>
                <p>Rs ${price * item.qty}</p>

                <div class="qty-box">
                    <button onclick="changeQty(${i},-1)">-</button>
                    <span>${item.qty}</span>
                    <button onclick="changeQty(${i},1)">+</button>
                </div>
            </div>

            <button class="remove-btn" onclick="removeFromCart(${i})">✕</button>
        </div>`;
    }).join("");

    if (cartTotal) cartTotal.innerText = `Total: Rs ${total}`;

    localStorage.setItem("cart", JSON.stringify(cart));
};

/* =========================
ADD TO CART (GRID)
========================= */
window.addToCart = (id, name, price, image) => {
    const p = num(price);

    const item = cart.find(i => i.id === id);

    if (item) item.qty++;
    else cart.push({ id, name, price: p, image, qty: 1 });

    updateCartDisplay();
    showToast("Added 🛒");
};

/* =========================
ADD TO CART (MODAL FIX)
========================= */
window.addToCartFromModal = () => {
    const p = allProducts.find(x => x.id === currentProductId);
    if (!p) return;

    const finalPrice = num(
        p.discount > 0
            ? p.price - (p.price * p.discount / 100)
            : p.price
    );

    const item = cart.find(i => i.id === p.id);

    if (item) item.qty++;
    else cart.push({
        id: p.id,
        name: p.name,
        price: finalPrice,
        image: p.image,
        qty: 1
    });

    updateCartDisplay();
    showToast("Added 🛒");
    closeModal();
};

/* =========================
REMOVE ITEM
========================= */
window.removeFromCart = (index) => {
    cart.splice(index, 1);
    updateCartDisplay();
    showToast("Removed ❌");
};

/* =========================
QTY CHANGE
========================= */
window.changeQty = (index, value) => {
    if (!cart[index]) return;

    cart[index].qty += value;

    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }

    updateCartDisplay();
};

/* =========================
FILTER + SEARCH
========================= */
window.filterProducts = () => {
    const search = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const category = document.getElementById("categoryFilter")?.value || "all";

    let filtered = [...allProducts];

    filtered = filtered.filter(p =>
        (p.name || "").toLowerCase().includes(search)
    );

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

    grid.innerHTML = products.map(p => {
        const price = num(p.price);
        const discount = num(p.discount);

        const finalPrice = discount > 0
            ? Math.round(price - (price * discount / 100))
            : price;

        return `
        <div class="card">
            ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ""}

            <img src="${p.image || ''}" />

            <div class="card-content">
                <h3>${p.name || ''}</h3>

                <div class="price-box">
                    ${discount > 0 ? `<span class="old-price">Rs ${price}</span>` : ""}
                    <span class="new-price">Rs ${finalPrice}</span>
                </div>

                <div class="card-buttons">
                    <button onclick="openModal('${p.id}')">View</button>
                    <button onclick="addToCart('${p.id}','${p.name}',${finalPrice},'${p.image}')">Add</button>
                </div>
            </div>
        </div>`;
    }).join("");
};

/* =========================
MODAL OPEN
========================= */
window.openModal = (id) => {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;

    currentProductId = id;

    document.getElementById("modalName").innerText = p.name;
    document.getElementById("modalPrice").innerText =
        "Rs " + num(p.price);
    document.getElementById("modalDesc").innerText =
        p.description || "";

    const images = p.images?.length ? p.images : [p.image];

    document.getElementById("galleryContainer").innerHTML = `
        <img src="${images[0]}" class="main-img" id="mainModalImg">

        <div class="thumbnail-grid">
            ${images.map(img => `
                <img src="${img}"
                    class="thumbnail"
                    onclick="document.getElementById('mainModalImg').src='${img}'">
            `).join("")}
        </div>
    `;

    document.getElementById("productModal").classList.add("show");

    selectedRating = 0;
    updateStars(0);
};

/* =========================
MODAL CLOSE
========================= */
window.closeModal = () => {
    document.getElementById("productModal")?.classList.remove("show");
    currentProductId = null;
    selectedRating = 0;
};

/* =========================
STARS
========================= */
function setupStarRating() {
    setTimeout(() => {
        document.querySelectorAll("#starRating i").forEach((star, i) => {
            star.onclick = () => {
                selectedRating = i + 1;
                updateStars(selectedRating);
            };
        });
    }, 400);
}

function updateStars(rating) {
    document.querySelectorAll("#starRating i").forEach((star, i) => {
        if (i < rating) {
            star.classList.add("fa-solid");
            star.classList.remove("fa-regular");
        } else {
            star.classList.add("fa-regular");
            star.classList.remove("fa-solid");
        }
    });
}

/* =========================
REVIEWS FIX
========================= */
function bindReviewButton() {
    setTimeout(() => {
        const btn = document.getElementById("reviewSubmitBtn");

        if (!btn) return;

        btn.onclick = async () => {
            const text = document.getElementById("reviewText")?.value;

            if (!text || selectedRating === 0) {
                showToast("Add rating + review");
                return;
            }

            if (!currentProductId) {
                showToast("Open product first");
                return;
            }

            await addDoc(collection(db, "reviews"), {
                productId: currentProductId,
                rating: selectedRating,
                text,
                createdAt: new Date().toISOString()
            });

            document.getElementById("reviewText").value = "";
            selectedRating = 0;

            showToast("Review added ✅");
        };
    }, 500);
}

/* =========================
CHECKOUT
========================= */
window.checkout = async () => {
    const name = document.getElementById("cusName")?.value;
    const phone = document.getElementById("cusPhone")?.value;
    const address = document.getElementById("cusAddress")?.value;

    if (!name || !phone || !address) {
        showToast("Fill all details");
        return;
    }

    if (!cart.length) {
        showToast("Cart empty");
        return;
    }

    await addDoc(collection(db, "orders"), {
        customer: { name, phone, address },
        items: cart,
        total: cart.reduce((t, i) => t + num(i.price) * i.qty, 0),
        createdAt: new Date().toISOString()
    });

    cart = [];
    updateCartDisplay();
    showToast("Order placed ✅");
};

/* =========================
UI
========================= */
window.toggleCart = () => {
    document.getElementById("cartDrawer")?.classList.toggle("open");
};

window.toggleDarkMode = () => {
    document.body.classList.toggle("dark");

    const icon = document.querySelector("#darkModeBtn i");
    if (!icon) return;

    icon.classList.toggle("fa-sun");
    icon.classList.toggle("fa-moon");
};

/* =========================
FIREBASE
========================= */
onSnapshot(collection(db, "products"), (snap) => {
    allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProducts(allProducts);

    document.getElementById("loadingScreen")?.remove();
});
