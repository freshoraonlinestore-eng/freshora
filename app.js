import { db, collection, onSnapshot } from "./firebase.js";

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allProducts = [];

// --- UTILITIES & CART LOGIC ---

window.updateCartDisplay = () => {
    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");
    const floatingCount = document.getElementById("floatingCartCount");
    
    floatingCount.innerText = cart.length;
    let total = 0;
    
    if (cart.length === 0) {
        cartItems.innerHTML = `<div class="empty">Your cart is empty</div>`;
    } else {
        cartItems.innerHTML = cart.map((item, index) => {
            total += (Number(item.price) * item.qty);
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
                </div>`;
        }).join("");
    }
    cartTotal.innerText = `Total: Rs ${total}`;
    localStorage.setItem("cart", JSON.stringify(cart));
};

window.changeQty = (index, delta) => {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) cart.splice(index, 1);
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

// --- FILTERS & SEARCH ---

window.filterProducts = () => {
    const searchQuery = document.getElementById("searchInput").value.toLowerCase();
    const category = document.getElementById("categoryFilter").value;
    const priceLimit = document.getElementById("priceFilter").value;
    const discountLimit = document.getElementById("discountFilter").value;

    const filtered = allProducts.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery);
        const matchesCategory = category === "all" || p.category === category;
        const matchesPrice = priceLimit === "all" || Number(p.price) <= Number(priceLimit);
        const matchesDiscount = discountLimit === "all" || Number(p.discount || 0) >= Number(discountLimit);
        return matchesSearch && matchesCategory && matchesPrice && matchesDiscount;
    });
    renderProducts(filtered);
};

// --- RENDER & MODAL ---

window.renderProducts = (products) => {
    const grid = document.getElementById("products");
    grid.innerHTML = products.map(p => {
        const original = Number(p.price);
        const discount = Number(p.discount || 0);
        const final = discount > 0 ? Math.round(original - (original * discount / 100)) : original;
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
                        <button class="view-btn" onclick="openModal('${p.id}')">View</button>
                        <button class="add-cart-btn" onclick="addToCart('${p.id}', '${p.name}', ${final}, '${p.image}')">Add</button>
                    </div>
                </div>
            </div>`;
    }).join("");
};

window.openModal = (id) => {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    document.getElementById("modalName").innerText = p.name;
    document.getElementById("modalImage").src = p.image;
    const finalPrice = Math.round(p.price - (p.price * (p.discount || 0) / 100));
    document.getElementById("modalPrice").innerText = "Rs " + finalPrice;
    document.getElementById("modalAddBtn").onclick = () => {
        addToCart(p.id, p.name, finalPrice, p.image);
        closeModal();
    };
    document.getElementById("productModal").classList.add("show");
};

window.closeModal = () => document.getElementById("productModal").classList.remove("show");
window.toggleCart = () => document.getElementById("cartDrawer").classList.toggle("open");
window.toggleDarkMode = () => {
    document.body.classList.toggle("dark");
    const icon = document.querySelector("#darkModeBtn i");
    icon.classList.toggle("fa-moon");
    icon.classList.toggle("fa-sun");
};

// --- INITIALIZATION ---

document.getElementById("searchInput").addEventListener("input", filterProducts);
document.getElementById("categoryFilter").addEventListener("change", filterProducts);
document.getElementById("priceFilter").addEventListener("change", filterProducts);
document.getElementById("discountFilter").addEventListener("change", filterProducts);

window.checkout = () => {
    const name = document.getElementById("cusName").value;
    const phone = document.getElementById("cusPhone").value;
    const address = document.getElementById("cusAddress").value;
    
    if (!name || !phone || !address) return alert("Please fill in your details!");

    // Order ID සහ Date නිර්මාණය
    const orderId = "FR-" + Date.now();
    const date = new Date().toLocaleString();
    
    // බිල්පත් ගණනය කිරීම
    let subtotal = 0;
    cart.forEach(item => { subtotal += (item.price * item.qty); });
    const delivery = 375; // අවශ්‍ය නම් මෙය වෙනස් කළ හැක
    const total = subtotal + delivery;

    // පණිවිඩය සකස් කිරීම
    let msg = `🟢 FRESHORA NEW ORDER 🟢%0A%0A`;
    msg += `📦 Order ID: ${orderId}%0A`;
    msg += `📅 Date: ${date}%0A%0A`;
    msg += `👤 CUSTOMER DETAILS%0AName: ${name}%0APhone: ${phone}%0AAddress: ${address}%0A%0A`;
    msg += `🛒 ITEMS%0A`;
    cart.forEach((item, index) => { 
        msg += `${index + 1}) ${item.name} x${item.qty} = LKR ${item.price * item.qty}%0A`; 
    });
    msg += `%0A💰 BILL SUMMARY%0ASubtotal: LKR ${subtotal}%0ADelivery: LKR ${delivery}%0ATOTAL: LKR ${total}%0A%0A`;
    msg += `🚚 Payment: Cash on Delivery%0A📍 Freshora Online Store`;

    window.open(`https://wa.me/94752425790?text=${msg}`, "_blank");
};


onSnapshot(collection(db, "products"), (snapshot) => {
    allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderProducts(allProducts);
    updateCartDisplay();
    document.getElementById("loadingScreen").style.display = "none";
});
