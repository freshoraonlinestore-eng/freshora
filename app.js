import { db, collection, onSnapshot } from "./firebase.js";

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allProducts = [];

// කාර්ට් එක යාවත්කාලීන කිරීම සහ දත්ත දර්ශනය කිරීම
window.updateCartDisplay = () => {
    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");
    const floatingCount = document.getElementById("floatingCartCount");
    
    floatingCount.innerText = cart.length;
    let total = 0;
    
    cartItems.innerHTML = cart.map((item, index) => {
        total += item.price;
        return `
            <div class="cart-item">
                <img src="${item.image}">
                <div class="cart-details">
                    <h4>${item.name}</h4>
                    <p>Rs ${item.price}</p>
                </div>
            </div>`;
    }).join("");
    cartTotal.innerText = `Total: Rs ${total}`;
};

// Search සහ Filter ක්‍රියාත්මක කිරීම
window.filterProducts = () => {
    const search = document.getElementById("searchInput").value.toLowerCase();
    const cat = document.getElementById("categoryFilter").value;
    
    const filtered = allProducts.filter(p => {
        return (p.name.toLowerCase().includes(search)) && (cat === "all" || p.category === cat);
    });
    renderProducts(filtered);
};

// Add to Cart
window.addToCart = (id, name, price, image) => {
    cart.push({ id, name, price, image });
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartDisplay();
    alert("Added to cart!");
};

// Checkout (WhatsApp)
window.checkout = () => {
    const name = document.getElementById("cusName").value;
    const phone = document.getElementById("cusPhone").value;
    const address = document.getElementById("cusAddress").value;
    let msg = `Order: ${name}, ${phone}, ${address}`;
    window.open(`https://wa.me/94752425790?text=${msg}`, "_blank");
};

// Dark Mode Toggle (Icon Change)
window.toggleDarkMode = () => {
    document.body.classList.toggle("dark");
    const icon = document.querySelector("#darkModeBtn i");
    icon.classList.toggle("fa-moon");
    icon.classList.toggle("fa-sun");
};

// Modal Functions
window.openModal = (id) => {
    const p = allProducts.find(x => x.id === id);
    document.getElementById("modalName").innerText = p.name;
    document.getElementById("modalImage").src = p.image;
    document.getElementById("modalPrice").innerText = "Rs " + p.price;
    document.getElementById("modalAddBtn").onclick = () => addToCart(p.id, p.name, p.price, p.image);
    document.getElementById("productModal").classList.add("show");
};
window.closeModal = () => document.getElementById("productModal").classList.remove("show");
window.toggleCart = () => document.getElementById("cartDrawer").classList.toggle("open");
window.clearCart = () => { cart = []; localStorage.setItem("cart", "[]"); updateCartDisplay(); };

// Initialization
document.getElementById("searchInput").addEventListener("input", filterProducts);
document.getElementById("categoryFilter").addEventListener("change", filterProducts);

onSnapshot(collection(db, "products"), (snapshot) => {
    allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderProducts(allProducts);
});
