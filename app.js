import { db, collection, onSnapshot } from "./firebase.js";

const productsDiv = document.getElementById("products");

/* =========================
   CART STATE
========================= */
let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* =========================
   SAVE CART
========================= */
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

/* =========================
   UPDATE CART COUNT
========================= */
function updateCartCount() {

  const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);

  const el = document.getElementById("cartCount");
  if (el) el.innerText = totalQty;

  const floating = document.getElementById("floatingCartCount");
  if (floating) floating.innerText = totalQty;
}

/* =========================
   CART TOGGLE
========================= */
window.toggleCart = function () {
  const drawer = document.getElementById("cartDrawer");

  if (!drawer) return;

  drawer.classList.toggle("open");

  renderCart();
};

/* =========================
   ADD TO CART
========================= */
window.addToCart = function (id, name, price, image) {

  let existing = cart.find(item => item.id === id);

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

  saveCart();

  alert("Added to cart 🛒");
};

/* =========================
   REMOVE ITEM
========================= */
window.removeItem = function (index) {
  cart.splice(index, 1);
  saveCart();
};

/* =========================
   QTY +
========================= */
window.increaseQty = function (index) {
  cart[index].qty++;
  saveCart();
};

/* =========================
   QTY -
========================= */
window.decreaseQty = function (index) {

  cart[index].qty--;

  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }

  saveCart();
};

/* =========================
   CLEAR CART
========================= */
window.clearCart = function () {
  cart = [];
  saveCart();
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

    total += item.price * item.qty;

    cartItems.innerHTML += `
      <div class="card">

        <img src="${item.image}">

        <h4>${item.name}</h4>

        <p>Rs ${item.price}</p>

        <p>Qty: ${item.qty}</p>

        <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">

          <button onclick="increaseQty(${index})">+</button>

          <button onclick="decreaseQty(${index})">-</button>

          <button onclick="removeItem(${index})">
            Remove
          </button>

        </div>

      </div>
    `;
  });

  cartTotal.innerText = "Total: Rs " + total;
}

/* =========================
   WHATSAPP CHECKOUT
========================= */
window.checkout = function () {

  let msg = "🛒 Order Details:%0A%0A";

  let total = 0;

  cart.forEach(item => {

    msg += `${item.name} x${item.qty} = Rs ${item.price * item.qty}%0A`;

    total += item.price * item.qty;
  });

  msg += `%0A💰 Total: Rs ${total}`;

  window.open(
    "https://wa.me/94752425790?text=" + msg
  );
};

/* =========================
   PRODUCT POPUP MODAL
========================= */
window.openModal = function (id, name, price, image) {

  const modal = document.getElementById("productModal");

  if (!modal) return;

  modal.style.display = "block";

  document.getElementById("modalImage").src = image;
  document.getElementById("modalName").innerText = name;
  document.getElementById("modalPrice").innerText = "Rs " + price;

  document.getElementById("modalAddBtn").onclick = () => {
    addToCart(id, name, price, image);
  };
};

/* =========================
   CLOSE MODAL
========================= */
window.closeModal = function () {

  const modal = document.getElementById("productModal");

  if (!modal) return;

  modal.style.display = "none";
};

/* =========================
   SEARCH FILTER
========================= */
document.addEventListener("input", (e) => {

  if (e.target.id === "searchInput") {

    let value = e.target.value.toLowerCase();

    document.querySelectorAll(".card").forEach(card => {

      card.style.display =
        card.innerText.toLowerCase().includes(value)
          ? "flex"
          : "none";
    });
  }
});

/* =========================
   LOAD PRODUCTS
========================= */
onSnapshot(collection(db, "products"), (snap) => {

  productsDiv.innerHTML = "";

  if (snap.empty) {

    productsDiv.innerHTML = `
      <p class="empty">
        No products found
      </p>
    `;

    return;
  }

  snap.forEach((docItem) => {

    const p = docItem.data();

    productsDiv.innerHTML += `
      <div class="card">

        <img src="${p.image}">

        <h3>${p.name}</h3>

        <p>Rs ${p.price}</p>

        <button onclick="openModal(
          '${docItem.id}',
          '${p.name}',
          '${p.price}',
          '${p.image}'
        )">

          View Product

        </button>

        <button onclick="addToCart(
          '${docItem.id}',
          '${p.name}',
          '${p.price}',
          '${p.image}'
        )">

          Add to Cart

        </button>

      </div>
    `;
  });

  updateCartCount();
});

/* =========================
   INIT
========================= */
window.addEventListener("load", () => {

  updateCartCount();

  renderCart();
});
