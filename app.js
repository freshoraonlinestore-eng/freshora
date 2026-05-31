import { db, collection, onSnapshot } from "./firebase.js";

const productsDiv = document.getElementById("products");

let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* =========================
   CART COUNT UPDATE
========================= */
function updateCartCount() {
  const el = document.getElementById("cartCount");
  if (el) {
    el.innerText = cart.length;
  }
}

/* =========================
   CART DRAWER TOGGLE (IMPORTANT FIX)
========================= */
window.toggleCart = function () {
  const drawer = document.getElementById("cartDrawer");

  if (!drawer) {
    console.error("cartDrawer not found");
    return;
  }

  drawer.classList.toggle("open");
  renderCart();
};

/* =========================
   ADD TO CART
========================= */
window.addToCart = function (id, name, price, image) {

  cart.push({
    id,
    name,
    price,
    image,
    qty: 1
  });

  localStorage.setItem("cart", JSON.stringify(cart));

  updateCartCount();
  renderCart();

  alert("Added to cart 🛒");
};

/* =========================
   REMOVE ITEM
========================= */
window.removeItem = function (index) {
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));

  updateCartCount();
  renderCart();
};

/* =========================
   CLEAR CART
========================= */
window.clearCart = function () {
  cart = [];
  localStorage.setItem("cart", JSON.stringify(cart));

  updateCartCount();
  renderCart();
};

/* =========================
   RENDER CART
========================= */
function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");

  if (!cartItems) return;

  cartItems.innerHTML = "";

  let total = 0;

  cart.forEach((item, index) => {
    total += Number(item.price);

    cartItems.innerHTML += `
      <div class="card">
        <img src="${item.image}">
        <h4>${item.name}</h4>
        <p>Rs ${item.price}</p>

        <button onclick="removeItem(${index})">Remove</button>
      </div>
    `;
  });

  if (cartTotal) {
    cartTotal.innerText = "Total: Rs " + total;
  }
}

/* =========================
   LOAD PRODUCTS (FIREBASE)
========================= */
onSnapshot(collection(db, "products"), (snap) => {

  productsDiv.innerHTML = "";

  if (snap.empty) {
    productsDiv.innerHTML = "<p class='empty'>No products found</p>";
    return;
  }

  snap.forEach((docItem) => {
    const p = docItem.data();

    productsDiv.innerHTML += `
      <div class="card">

        <img src="${p.image}">

        <h3>${p.name}</h3>

        <p>Rs ${p.price}</p>

        <button onclick="addToCart('${docItem.id}','${p.name}','${p.price}','${p.image}')">
          Add to Cart
        </button>

        <button onclick="order('${p.name}','${p.price}')">
          Buy Now
        </button>

      </div>
    `;
  });
});

/* =========================
   WHATSAPP ORDER
========================= */
window.order = function (name, price) {
  const msg = `I want to order: ${name} - Rs ${price}`;
  window.open("https://wa.me/94752425790?text=" + encodeURIComponent(msg));
};

/* =========================
   SEARCH FILTER
========================= */
document.addEventListener("input", (e) => {
  if (e.target.id === "searchInput") {
    let value = e.target.value.toLowerCase();

    document.querySelectorAll(".card").forEach(card => {
      card.style.display =
        card.innerText.toLowerCase().includes(value) ? "block" : "none";
    });
  }
});

/* =========================
   INIT
========================= */
window.addEventListener("load", () => {
  updateCartCount();
  renderCart();
});
