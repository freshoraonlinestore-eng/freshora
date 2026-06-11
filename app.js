import { db, collection, onSnapshot } from "./firebase.js";

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allProducts = [];
let selectedRating = 0;
let currentProductId = null;

function showToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.innerText = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
}

window.addEventListener("DOMContentLoaded", () => {
    updateCartDisplay();
    // Listeners
    document.getElementById("searchInput")?.addEventListener("input", filterProducts);
    document.getElementById("categoryFilter")?.addEventListener("change", filterProducts);
    document.getElementById("priceFilter")?.addEventListener("change", filterProducts);
    document.getElementById("discountFilter")?.addEventListener("change", filterProducts);
    setupStarRating();
});

/* CART SYSTEM */
window.updateCartDisplay = () => {
    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");
    const floatingCount = document.getElementById("floatingCartCount");
    if (!cartItems) return;

    floatingCount.innerText = cart.length;
    let total = 0;
    cartItems.innerHTML = cart.length === 0 ? `<p style="text-align:center">Your cart is empty</p>` : cart.map((item, index) => {
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
            </div>`;
    }).join("");
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

window.removeFromCart = (i) => { cart.splice(i, 1); updateCartDisplay(); };
window.clearCart = () => { cart = []; updateCartDisplay(); };

/* FILTERS */
window.filterProducts = () => {
    const searchTerm = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const category = document.getElementById("categoryFilter")?.value || "all";
    const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm) && (category === "all" || p.category === category)
    );
    renderProducts(filtered);
};

/* RENDER */
window.renderProducts = (products) => {
    const grid = document.getElementById("products");
    if (!grid) return;
    grid.innerHTML = products.map(p => {
        const discount = Number(p.discount || 0);
        const final = discount > 0 ? Math.round(p.price - (p.price * discount / 100)) : p.price;
        const rating = p.rating || 0; // Firebase හි rating දත්ත තිබේ නම්
        return `
            <div class="card">
                ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ""}
                <img src="${p.image}" />
                <div class="card-content">
                    <h3>${p.name}</h3>
                    <div style="color: #ffb400; font-size: 12px; margin-bottom: 5px;">
                        ${[1,2,3,4,5].map(i => i <= rating ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>').join('')}
                    </div>
                    <div class="price-box">
                        ${discount > 0 ? `<span class="old-price">Rs ${p.price}</span>` : ""}
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

/* MODAL & GALLERY */
window.openModal = (id) => {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    currentProductId = id;

    const discount = Number(p.discount || 0);
    const final = discount > 0 ? Math.round(p.price - (p.price * discount / 100)) : p.price;

    document.getElementById("modalName").innerText = p.name;
    document.getElementById("modalPrice").innerText = "Rs " + final;
    document.getElementById("modalDesc").innerText = p.description || "No description provided.";
    
    const images = (p.images && p.images.length > 0) ? p.images : [p.image];
    document.getElementById("galleryContainer").innerHTML = `
        <img src="${images[0]}" class="main-img" id="mainModalImg" />
        <div class="thumbnail-grid">
            ${images.map(img => `<img src="${img}" class="thumbnail" onclick="document.getElementById('mainModalImg').src='${img}'" />`).join('')}
        </div>`;

    selectedRating = 0;
    updateStars(0);

    document.getElementById("modalAddBtn").onclick = () => {
        window.addToCart(p.id, p.name, final, images[0]);
        closeModal();
    };

    document.getElementById("productModal").classList.add("show");
};

window.closeModal = () => document.getElementById("productModal").classList.remove("show");

/* STAR RATING LOGIC */
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
        if (index < rating) star.classList.replace("fa-regular", "fa-solid");
        else star.classList.replace("fa-solid", "fa-regular");
    });
}

/* UI TOGGLES */
window.toggleCart = () => document.getElementById("cartDrawer").classList.toggle("open");
window.toggleDarkMode = () => {
    document.body.classList.toggle("dark");
    const icon = document.querySelector("#darkModeBtn i");
    if (document.body.classList.contains("dark")) icon.classList.replace("fa-moon", "fa-sun");
    else icon.classList.replace("fa-sun", "fa-moon");
};

/* FIREBASE LOAD */
onSnapshot(collection(db, "products"), (snapshot) => {
    allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderProducts(allProducts);
    document.getElementById("loadingScreen")?.remove();
});
