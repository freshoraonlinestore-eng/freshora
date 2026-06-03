import { db, collection, onSnapshot } from "./firebase.js";

const productsDiv = document.getElementById("products");

/* =========================
   STATE
========================= */
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let allProducts = [];

/* =========================
   SAVE CART
========================= */
function saveCart() {

  localStorage.setItem(
    "cart",
    JSON.stringify(cart)
  );

  updateCartCount();
  renderCart();
}

/* =========================
   UPDATE CART COUNT
========================= */
function updateCartCount() {

  const totalQty = cart.reduce(
    (sum, i) => sum + i.qty,
    0
  );

  const el =
    document.getElementById("cartCount");

  if (el) {
    el.innerText = totalQty;
  }

  const floating =
    document.getElementById("floatingCartCount");

  if (floating) {
    floating.innerText = totalQty;
  }
}

/* =========================
   TOGGLE CART
========================= */
window.toggleCart = function () {

  const drawer =
    document.getElementById("cartDrawer");

  drawer.classList.toggle("open");

  renderCart();
};

/* =========================
   TOAST
========================= */
function showToast(text) {

  const toast =
    document.createElement("div");

  toast.className = "toast";
  toast.innerText = text;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 100);

  setTimeout(() => {

    toast.classList.remove("show");

    setTimeout(() => {
      toast.remove();
    }, 300);

  }, 2000);
}

/* =========================
   ADD TO CART
========================= */
window.addToCart = function (
  id,
  name,
  price,
  image
) {

  let existing =
    cart.find(item => item.id === id);

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

  showToast("Added to cart 🛒");
};

/* =========================
   REMOVE ITEM
========================= */
window.removeItem = function (index) {

  cart.splice(index, 1);

  saveCart();

  showToast("Removed item ❌");
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

  showToast("Cart cleared");
};

/* =========================
   RENDER CART
========================= */
function renderCart() {

  const cartItems =
    document.getElementById("cartItems");

  const cartTotal =
    document.getElementById("cartTotal");

  if (!cartItems) return;

  cartItems.innerHTML = "";

  let total = 0;

  if (cart.length === 0) {

    cartItems.innerHTML = `
      <p class="empty">
        Cart is empty
      </p>
    `;

    cartTotal.innerText = "Total: Rs 0";

    return;
  }

  cart.forEach((item, index) => {

    total += item.price * item.qty;

    cartItems.innerHTML += `
      <div class="cart-item">

        <img src="${item.image}">

        <div class="cart-info">

          <h4>${item.name}</h4>

          <p>Rs ${item.price}</p>

          <div class="qty-box">

            <button onclick="decreaseQty(${index})">
              -
            </button>

            <span>${item.qty}</span>

            <button onclick="increaseQty(${index})">
              +
            </button>

          </div>

          <button
            class="remove-btn"
            onclick="removeItem(${index})">

            Remove

          </button>

        </div>

      </div>
    `;
  });

  cartTotal.innerText =
    "Total: Rs " + total;
}

/* =========================
   CHECKOUT
========================= */
window.checkout = function () {

  if (cart.length === 0) {

    showToast("Cart is empty");

    return;
  }

  let msg =
    "🛒 Freshora Order Details:%0A%0A";

  let total = 0;

  cart.forEach(item => {

    msg +=
      `${item.name} x${item.qty} = Rs ${item.price * item.qty}%0A`;

    total += item.price * item.qty;
  });

  msg += `%0A💰 Total: Rs ${total}`;

  window.open(
    "https://wa.me/94752425790?text=" + msg
  );
};

/* =========================
   MODAL
========================= */
window.openModal = function (
  id,
  name,
  price,
  image
) {

  document.getElementById(
    "productModal"
  ).style.display = "block";

  document.getElementById(
    "modalImage"
  ).src = image;

  document.getElementById(
    "modalName"
  ).innerText = name;

  document.getElementById(
    "modalPrice"
  ).innerText = "Rs " + price;

  document.getElementById(
    "modalAddBtn"
  ).onclick = () => {

    addToCart(
      id,
      name,
      price,
      image
    );
  };
};

window.closeModal = function () {

  document.getElementById(
    "productModal"
  ).style.display = "none";
};

/* =========================
   DARK MODE
========================= */
window.toggleDarkMode = function () {

  document.body.classList.toggle("dark");

  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark")
  );
};

if (
  localStorage.getItem("darkMode")
  === "true"
) {

  document.body.classList.add("dark");
}

/* =========================
   WISHLIST
========================= */
window.toggleWishlist = function (id) {

  if (wishlist.includes(id)) {

    wishlist =
      wishlist.filter(item => item !== id);

    showToast("Removed from wishlist");

  } else {

    wishlist.push(id);

    showToast("Added to wishlist ❤️");
  }

  localStorage.setItem(
    "wishlist",
    JSON.stringify(wishlist)
  );

  renderProducts(allProducts);
};

/* =========================
   SEARCH
========================= */
document.addEventListener("input", (e) => {

  if (e.target.id === "searchInput") {

    const value =
      e.target.value.toLowerCase();

    const filtered =
      allProducts.filter(item => {

        return item.name
          .toLowerCase()
          .includes(value);
      });

    renderProducts(filtered);
  }
});

/* =========================
   RENDER PRODUCTS
========================= */
function renderProducts(products) {

  productsDiv.innerHTML = "";

  if (products.length === 0) {

    productsDiv.innerHTML = `
      <p class="empty">
        No products found
      </p>
    `;

    return;
  }

  products.forEach((product) => {

    const heart =
      wishlist.includes(product.id)
      ? "❤️"
      : "🤍";

    productsDiv.innerHTML += `

      <div class="card fade-in">

        <img
          src="${product.image}"
          loading="lazy"
        >

        <div class="card-content">

          <h3>${product.name}</h3>

          <p>Rs ${product.price}</p>

          <div class="rating">
            ⭐⭐⭐⭐⭐
          </div>

          <div class="card-buttons">

            <button
              class="wishlist-btn"
              onclick="toggleWishlist('${product.id}')">

              ${heart}

            </button>

            <button onclick="openModal(
              '${product.id}',
              '${product.name}',
              '${product.price}',
              '${product.image}'
            )">

              View

            </button>

          </div>

          <button
            class="add-cart-btn"
            onclick="addToCart(
              '${product.id}',
              '${product.name}',
              '${product.price}',
              '${product.image}'
            )">

            Add to Cart

          </button>

        </div>

      </div>
    `;
  });
}

/* =========================
   LOAD PRODUCTS
========================= */
onSnapshot(
  collection(db, "products"),
  (snap) => {

    allProducts = [];

    snap.forEach((docItem) => {

      const p = docItem.data();

      allProducts.push({
        id: docItem.id,
        ...p
      });
    });

    renderProducts(allProducts);

    updateCartCount();
  }
);

/* =========================
   CLOSE MODAL OUTSIDE CLICK
========================= */
window.onclick = function (e) {

  const modal =
    document.getElementById("productModal");

  if (e.target === modal) {

    modal.style.display = "none";
  }
};

/* =========================
   INIT
========================= */
window.addEventListener("load", () => {

  updateCartCount();

  renderCart();
});
