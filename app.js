import { db, collection, onSnapshot } from "./firebase.js";

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allProducts = [];

// Cart UI Update function
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
            total += item.price;
            return `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-details">
                        <h4>${item.name}</h4>
                        <p>Rs ${item.price}</p>
                    </div>
                    <button class="remove-btn" onclick="removeFromCart(${index})">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>`;
        }).join("");
    }
    cartTotal.innerText = `Total: Rs ${total}`;
};

window.addToCart = (id, name, price, image) => {
    cart.push({ id, name, price, image });
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartDisplay();
    alert("Added to cart!");
};

window.removeFromCart = (index) => {
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartDisplay();
};

window.clearCart = () => {
    cart = [];
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartDisplay();
};

window.checkout = () => {
    const name = document.getElementById("cusName").value;
    const phone = document.getElementById("cusPhone").value;
    const address = document.getElementById("cusAddress").value;
    
    if (!name || !phone || !address) {
        alert("Please fill in your details!");
        return;
    }

    let msg = `New Order:%0A------------------%0AName: ${name}%0APhone: ${phone}%0AAddress: ${address}%0A%0AItems:%0A`;
    cart.forEach(item => { msg += `- ${item.name} (Rs ${item.price})%0A`; });
    msg += `------------------%0ATotal: ${document.getElementById("cartTotal").innerText}`;

    window.open(`https://wa.me/94752425790?text=${msg}`, "_blank");
};

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
    document.getElementById("modalPrice").innerText = "Rs " + (p.price - (p.price * (p.discount || 0) / 100));
    document.getElementById("modalAddBtn").onclick = () => addToCart(p.id, p.name, (p.price - (p.price * (p.discount || 0) / 100)), p.image);
    document.getElementById("productModal").classList.add("show");
};

window.closeModal = () => document.getElementById("productModal").classList.remove("show");
window.toggleCart = () => document.getElementById("cartDrawer").classList.toggle("open");
window.toggleDarkMode = () => document.body.classList.toggle("dark");

// Initial Load
onSnapshot(collection(db, "products"), (snapshot) => {
    allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderProducts(allProducts);
    updateCartDisplay();
    document.getElementById("loadingScreen").style.display = "none";
});
