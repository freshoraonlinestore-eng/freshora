import { db, collection, onSnapshot, addDoc } from "./firebase.js";

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
    updateCartDisplay();

    document.getElementById("searchInput")?.addEventListener("input", filterProducts);
    document.getElementById("categoryFilter")?.addEventListener("change", filterProducts);
    document.getElementById("priceFilter")?.addEventListener("change", filterProducts);
    document.getElementById("discountFilter")?.addEventListener("change", filterProducts);

    bindReviewButton();
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

    if (floatingCount) floatingCount.innerText = cart.length;

    if (cart.length === 0) {
        cartItems.innerHTML = `<p style="text-align:center;padding:10px;">Cart is empty</p>`;
        if (cartTotal) cartTotal.innerText = "Total: Rs 0";
        return;
    }

    cartItems.innerHTML = cart.map((item, i) => {
        total += item.price * item.qty;

        return `
        <div class="cart-item">
            <img src="${item.image}" />
            <div>
                <h4>${item.name}</h4>
                <p>Rs ${item.price * item.qty}</p>

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
CART ACTIONS
========================= */
window.addToCart = (id, name, price, image) => {
    const item = cart.find(i => i.id === id);

    if (item) item.qty++;
    else cart.push({ id, name, price: Number(price), image, qty: 1 });

    updateCartDisplay();
    showToast("Added 🛒");

    // ✅ AUTO CLOSE MODAL (IMPORTANT UX FIX)
    document.getElementById("productModal")?.classList.remove("show");
    currentProductId = null;
    selectedRating = 0;
};

window.changeQty = (i, d) => {
    if (!cart[i]) return;

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
    showToast("Cart cleared");
};

/* =========================
SEARCH + FILTER
========================= */
window.filterProducts = () => {
    const searchTerm = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const category = document.getElementById("categoryFilter")?.value || "all";
    const priceFilter = document.getElementById("priceFilter")?.value || "all";
    const discountFilter = document.getElementById("discountFilter")?.value || "all";

    let filtered = [...allProducts];

    filtered = filtered.filter(p =>
        (p.name || "").toLowerCase().includes(searchTerm)
    );

    if (category !== "all") {
        filtered = filtered.filter(p => p.category === category);
    }

    if (priceFilter !== "all") {
        filtered = filtered.filter(p => {
            const price = Number(p.price || 0);
            if (priceFilter === "low") return price < 500;
            if (priceFilter === "mid") return price >= 500 && price <= 2000;
            if (priceFilter === "high") return price > 2000;
            return true;
        });
    }

    if (discountFilter !== "all") {
        filtered = filtered.filter(p => {
            const d = Number(p.discount || 0);
            if (discountFilter === "10") return d >= 10;
            if (discountFilter === "20") return d >= 20;
            return true;
        });
    }

    renderProducts(filtered);
};

/* =========================
PRODUCT RENDER
========================= */
window.renderProducts = (products) => {
    const grid = document.getElementById("products");
    if (!grid) return;

    if (!products.length) {
        grid.innerHTML = `<p style="text-align:center;width:100%;">No products found</p>`;
        return;
    }

    grid.innerHTML = products.map(p => {
        const discount = Number(p.discount || 0);
        const final = discount > 0
            ? Math.round(p.price - (p.price * discount / 100))
            : Number(p.price);

        return `
        <div class="card">
            <img src="${p.image}" />

            <div class="card-content">
                <h3>${p.name}</h3>

                <div class="price-box">
                    <span class="new-price">Rs ${final}</span>
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

    document.getElementById("modalName").innerText = p.name;
    document.getElementById("modalPrice").innerText = "Rs " + p.price;
    document.getElementById("modalDesc").innerText = p.description || "";

    document.getElementById("productModal").classList.add("show");

    selectedRating = 0;
    updateStars(0);
};

window.closeModal = () => {
    document.getElementById("productModal")?.classList.remove("show");
    currentProductId = null;
    selectedRating = 0;
};

/* =========================
STARS
========================= */
function setupStarRating() {
    document.querySelectorAll("#starRating i").forEach((star, i) => {
        star.onclick = () => {
            selectedRating = i + 1;
            updateStars(selectedRating);
        };
    });
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
REVIEW SYSTEM
========================= */
function bindReviewButton() {
    const btn = document.getElementById("reviewSubmitBtn");

    if (btn) {
        btn.addEventListener("click", async () => {
            const text = document.getElementById("reviewText")?.value;

            if (!text || selectedRating === 0) {
                showToast("Add rating + review");
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
        });
    }
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

    if (cart.length === 0) {
        showToast("Cart empty");
        return;
    }

    const order = {
        customer: { name, phone, address },
        items: cart,
        total: cart.reduce((t, i) => t + i.price * i.qty, 0),
        createdAt: new Date().toISOString()
    };

    await addDoc(collection(db, "orders"), order);

    cart = [];
    updateCartDisplay();

    showToast("Order placed ✅");
};

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

    icon.classList.toggle("fa-sun");
    icon.classList.toggle("fa-moon");
};

/* =========================
FIREBASE LOAD
========================= */
onSnapshot(collection(db, "products"), (snap) => {
    allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProducts(allProducts);

    document.getElementById("loadingScreen")?.remove();
});
