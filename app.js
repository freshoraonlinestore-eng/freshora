import {
  db,
  collection,
  onSnapshot,
  addDoc
} from "./firebase.js";

/* =========================
   ELEMENTS
========================= */

const productsDiv = document.getElementById("products");
const loadingScreen = document.getElementById("loadingScreen");
const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");

/* =========================
   STATE
========================= */

let cart = JSON.parse(localStorage.getItem("cart")) || [];

let wishlist =
  JSON.parse(localStorage.getItem("wishlist")) || [];

let reviews =
  JSON.parse(localStorage.getItem("reviews")) || {};

let allProducts = [];

/* =========================
   HELPERS
========================= */

function safeNumber(value) {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

function saveWishlist() {
  localStorage.setItem(
    "wishlist",
    JSON.stringify(wishlist)
  );

  renderProducts(allProducts);
}

function saveReviews() {
  localStorage.setItem(
    "reviews",
    JSON.stringify(reviews)
  );
}

function hideLoading() {
  if (!loadingScreen) return;

  loadingScreen.style.opacity = "0";

  setTimeout(() => {
    loadingScreen.style.display = "none";
  }, 300);
}

/* =========================
   DARK MODE
========================= */

window.toggleDarkMode = function () {
  document.body.classList.toggle("dark");

  const dark =
    document.body.classList.contains("dark");

  localStorage.setItem("darkMode", dark);

  updateDarkIcon();
};

function updateDarkIcon() {
  const btn =
    document.getElementById("darkModeBtn");

  if (!btn) return;

  const dark =
    document.body.classList.contains("dark");

  btn.innerHTML = dark
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
}

/* =========================
   CART COUNT
========================= */

function updateCartCount() {
  const total = cart.reduce(
    (sum, item) => sum + safeNumber(item.qty),
    0
  );

  const el =
    document.getElementById("floatingCartCount");

  if (el) el.innerText = total;
}

/* =========================
   WISHLIST
========================= */

window.toggleWishlist = function (id) {
  const exists = wishlist.includes(id);

  if (exists) {
    wishlist = wishlist.filter(i => i !== id);
  } else {
    wishlist.push(id);
  }

  saveWishlist();
};

function isWishlisted(id) {
  return wishlist.includes(id);
}

/* =========================
   REVIEWS
========================= */

function getProductReviews(productId) {
  return reviews[productId] || [];
}

function getAverageRating(productId) {
  const list = getProductReviews(productId);

  if (list.length === 0) return 5;

  const total = list.reduce(
    (sum, r) => sum + safeNumber(r.rating),
    0
  );

  return (total / list.length).toFixed(1);
}

window.submitReview = function (productId) {
  const input =
    document.getElementById("reviewText");

  const rating =
    document.getElementById("reviewRating");

  if (!input || !rating) return;

  const text = input.value.trim();

  if (text === "") {
    alert("Write a review");
    return;
  }

  if (!reviews[productId]) {
    reviews[productId] = [];
  }

  reviews[productId].push({
    text,
    rating: safeNumber(rating.value),
    date: new Date().toLocaleDateString()
  });

  saveReviews();

  input.value = "";

  renderReviews(productId);
  renderProducts(allProducts);
};

function renderReviews(productId) {
  const reviewList =
    document.getElementById("reviewList");

  if (!reviewList) return;

  const list = getProductReviews(productId);

  if (list.length === 0) {
    reviewList.innerHTML =
      `<p class="empty-review">No reviews yet</p>`;
    return;
  }

  reviewList.innerHTML = "";

  list.reverse().forEach(r => {
    reviewList.innerHTML += `
      <div class="review-item">
        <div class="review-stars">
          ${"⭐".repeat(r.rating)}
        </div>

        <p>${r.text}</p>

        <small>${r.date}</small>
      </div>
    `;
  });
}

/* =========================
   CART ACTIONS
========================= */

window.addToCart = function (
  id,
  name,
  price,
  image
) {
  const existing =
    cart.find(i => i.id === id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id,
      name,
      price: safeNumber(price),
      image,
      qty: 1
    });
  }

  saveCart();
};

window.removeItem = function (index) {
  cart.splice(index, 1);
  saveCart();
};

window.increaseQty = function (index) {
  if (cart[index]) {
    cart[index].qty++;
    saveCart();
  }
};

window.decreaseQty = function (index) {
  if (!cart[index]) return;

  cart[index].qty--;

  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }

  saveCart();
};

window.clearCart = function () {
  if (!confirm("Clear cart?")) return;

  cart = [];
  saveCart();
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

  if (cart.length === 0) {
    cartItems.innerHTML =
      `<p class="empty">Cart empty</p>`;

    cartTotal.innerText =
      "Total: Rs 0";

    return;
  }

  let total = 0;

  cart.forEach((item, index) => {
    const price =
      safeNumber(item.price);

    const qty =
      safeNumber(item.qty);

    total += price * qty;

    cartItems.innerHTML += `
      <div class="cart-item">

        <img src="${item.image}" />

        <div class="cart-details">
          <h4>${item.name}</h4>

          <p>
            Rs ${price.toLocaleString()}
          </p>

          <div class="qty-box">
            <button onclick="decreaseQty(${index})">-</button>

            <span>${qty}</span>

            <button onclick="increaseQty(${index})">+</button>
          </div>
        </div>

        <button
          class="remove-btn"
          onclick="removeItem(${index})"
        >
          ✕
        </button>

      </div>
    `;
  });

  cartTotal.innerText =
    "Total: Rs " + total.toLocaleString();
}

/* =========================
   CART TOGGLE
========================= */

window.toggleCart = function () {
  cartDrawer.classList.toggle("open");

  overlay.classList.toggle("show");

  document.body.style.overflow =
    cartDrawer.classList.contains("open")
      ? "hidden"
      : "auto";

  renderCart();
};

/* =========================
   WHATSAPP CHECKOUT
========================= */

window.checkout = function () {
  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  const name =
    document.getElementById("cusName")?.value ||
    "N/A";

  const phone =
    document.getElementById("cusPhone")?.value ||
    "N/A";

  const address =
    document.getElementById("cusAddress")?.value ||
    "N/A";

  const orderId =
    "FR-" + Date.now();

  const date =
    new Date().toLocaleString();

  let subtotal = 0;

  let message =
    `🟢 FRESHORA NEW ORDER 🟢\n\n`;

  message +=
    `📦 Order ID: ${orderId}\n`;

  message +=
    `📅 Date: ${date}\n\n`;

  message +=
    `👤 CUSTOMER DETAILS\n`;

  message +=
    `Name: ${name}\nPhone: ${phone}\nAddress: ${address}\n\n`;

  message += `🛒 ITEMS\n`;

  cart.forEach((item, i) => {
    const itemTotal =
      item.price * item.qty;

    subtotal += itemTotal;

    message +=
      `${i + 1}) ${item.name} x${item.qty} = LKR ${itemTotal.toLocaleString()}\n`;
  });

  const delivery = 375;

  const total =
    subtotal + delivery;

  message += `\n💰 BILL SUMMARY\n`;

  message +=
    `Subtotal: LKR ${subtotal.toLocaleString()}\n`;

  message +=
    `Delivery: LKR ${delivery}\n`;

  message +=
    `TOTAL: LKR ${total.toLocaleString()}\n\n`;

  message +=
    `🚚 Payment: Cash on Delivery\n`;

  message +=
    `📍 Freshora Online Store\n`;

  const url =
    "https://wa.me/94752425790?text=" +
    encodeURIComponent(message);

  window.open(url, "_blank");
};

/* =========================
   PRODUCT MODAL
========================= */

window.openModal = function (product) {
  const modal =
    document.getElementById("productModal");

  document.getElementById(
    "modalImage"
  ).src = product.image;

  document.getElementById(
    "modalName"
  ).innerText = product.name;

  document.getElementById(
    "modalPrice"
  ).innerText =
    "Rs " +
    safeNumber(product.finalPrice).toLocaleString();

  document.getElementById(
    "modalAddBtn"
  ).onclick = () => {
    addToCart(
      product.id,
      product.name,
      product.finalPrice,
      product.image
    );
  };

  document.getElementById(
    "modalRatingText"
  ).innerText =
    getAverageRating(product.id);

  renderReviews(product.id);

  document.getElementById(
    "reviewSubmitBtn"
  ).onclick = () => {
    submitReview(product.id);
  };

  modal.style.display = "flex";
};

window.closeModal = function () {
  document.getElementById(
    "productModal"
  ).style.display = "none";
};

/* =========================
   PRODUCTS
========================= */

function renderProducts(products) {
  if (!productsDiv) return;

  productsDiv.innerHTML = "";

  products.forEach(p => {
    const price =
      safeNumber(p.price);

    const discount =
      safeNumber(p.discount);

    const finalPrice =
      discount > 0
        ? Math.round(
            price -
            (price * discount) / 100
          )
        : price;

    const avgRating =
      getAverageRating(p.id);

    productsDiv.innerHTML += `
      <div class="card">

        ${
          discount > 0
            ? `
          <div class="discount-badge">
            -${discount}%
          </div>
        `
            : ""
        }

        <button
          class="wishlist-btn"
          onclick="toggleWishlist('${p.id}')"
        >
          <i class="${
            isWishlisted(p.id)
              ? "fa-solid"
              : "fa-regular"
          } fa-heart"></i>
        </button>

        <img src="${p.image}" />

        <div class="card-content">

          <h3>${p.name}</h3>

          <div class="rating-preview">
            ⭐ ${avgRating}
          </div>

          <div class="price-box">

            ${
              discount > 0
                ? `
              <span class="old-price">
                Rs ${price.toLocaleString()}
              </span>
            `
                : ""
            }

            <span class="new-price">
              Rs ${finalPrice.toLocaleString()}
            </span>

          </div>

          <div class="card-buttons">

            <button
              class="view-btn"
              onclick='openModal(${JSON.stringify({
                ...p,
                finalPrice
              })})'
            >
              View
            </button>

            <button
              class="add-cart-btn"
              onclick="addToCart(
                '${p.id}',
                '${p.name}',
                ${finalPrice},
                '${p.image}'
              )"
            >
              Add to Cart
            </button>

          </div>

        </div>

      </div>
    `;
  });
}

/* =========================
   FIREBASE
========================= */

onSnapshot(
  collection(db, "products"),
  snapshot => {
    allProducts = [];

    snapshot.forEach(doc => {
      allProducts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    renderProducts(allProducts);

    hideLoading();
  }
);

/* =========================
   INIT
========================= */

window.addEventListener(
  "DOMContentLoaded",
  () => {
    const dark =
      localStorage.getItem("darkMode") ===
      "true";

    if (dark) {
      document.body.classList.add("dark");
    }

    updateDarkIcon();
    updateCartCount();
    renderCart();
  }
);

window.addEventListener("load", () => {
  setTimeout(hideLoading, 1200);
});
