import {
  db,
  collection,
  onSnapshot,
  addDoc
} from "./firebase.js";

/* =========================
STATE
========================= */

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allProducts = [];
let selectedRating = 0;
let currentProduct = null;

/* =========================
DOM
========================= */

const productsEl = document.getElementById("products");
const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const floatingCartCount = document.getElementById("floatingCartCount");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const priceFilter = document.getElementById("priceFilter");
const discountFilter = document.getElementById("discountFilter");

const modal = document.getElementById("productModal");
const modalName = document.getElementById("modalName");
const modalPrice = document.getElementById("modalPrice");
const modalDesc = document.getElementById("modalDesc");
const galleryContainer = document.getElementById("galleryContainer");

const reviewText = document.getElementById("reviewText");
const reviewList = document.getElementById("reviewList");
const submitReviewBtn = document.getElementById("submitReview");

const toast = document.getElementById("toast");
const loadingScreen = document.getElementById("loadingScreen");

/* =========================
INIT
========================= */

loadProducts();
renderCart();
setupEvents();

/* =========================
FIREBASE PRODUCTS
========================= */

function loadProducts() {
  const ref = collection(db, "products");

  onSnapshot(ref, (snapshot) => {
    allProducts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    renderProducts(allProducts);
    populateFilters(allProducts);
    hideLoading();
  });
}

/* =========================
RENDER PRODUCTS
========================= */

function renderProducts(list) {
  productsEl.innerHTML = "";

  list.forEach(p => {
    const div = document.createElement("div");
    div.className = "product-card";

    div.innerHTML = `
      <img src="${p.image || 'https://via.placeholder.com/200'}" onclick="openModal('${p.id}')">
      <h3>${p.name}</h3>
      <p>Rs ${p.price}</p>
      <button onclick="addToCart('${p.id}')">Add to Cart</button>
    `;

    productsEl.appendChild(div);
  });
}

/* =========================
FILTER + SEARCH
========================= */

function setupEvents() {
  searchInput.addEventListener("input", applyFilters);
  categoryFilter.addEventListener("change", applyFilters);
  priceFilter.addEventListener("change", applyFilters);
  discountFilter.addEventListener("change", applyFilters);
}

function applyFilters() {
  let list = [...allProducts];

  const search = searchInput.value.toLowerCase();
  const category = categoryFilter.value;
  const price = priceFilter.value;
  const discount = discountFilter.value;

  if (search) {
    list = list.filter(p =>
      p.name.toLowerCase().includes(search)
    );
  }

  if (category !== "all") {
    list = list.filter(p => p.category === category);
  }

  if (price !== "all") {
    list = list.filter(p => p.price <= parseInt(price));
  }

  if (discount !== "all") {
    list = list.filter(p => (p.discount || 0) >= parseInt(discount));
  }

  renderProducts(list);
}

/* =========================
FILTER OPTIONS
========================= */

function populateFilters(products) {
  const categories = [...new Set(products.map(p => p.category))];

  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  categories.forEach(c => {
    categoryFilter.innerHTML += `<option value="${c}">${c}</option>`;
  });

  priceFilter.innerHTML = `
    <option value="all">All Prices</option>
    <option value="500">Under 500</option>
    <option value="1000">Under 1000</option>
    <option value="5000">Under 5000</option>
  `;

  discountFilter.innerHTML = `
    <option value="all">All Discounts</option>
    <option value="10">10%+</option>
    <option value="20">20%+</option>
    <option value="50">50%+</option>
  `;
}

/* =========================
CART
========================= */

window.addToCart = function(id) {
  const product = allProducts.find(p => p.id === id);
  if (!product) return;

  cart.push(product);
  saveCart();
  renderCart();
  showToast("Added to cart");
};

function renderCart() {
  cartItemsEl.innerHTML = "";

  let total = 0;

  cart.forEach((item, index) => {
    total += item.price;

    const div = document.createElement("div");
    div.className = "cart-item";

    div.innerHTML = `
      <p>${item.name}</p>
      <span>Rs ${item.price}</span>
      <button onclick="removeItem(${index})">X</button>
    `;

    cartItemsEl.appendChild(div);
  });

  cartTotalEl.innerText = `Total: Rs ${total}`;
  floatingCartCount.innerText = cart.length;
}

window.removeItem = function(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
};

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

/* =========================
CART UI
========================= */

window.toggleCart = function() {
  document.getElementById("cartDrawer").classList.toggle("open");
};

window.clearCart = function() {
  cart = [];
  saveCart();
  renderCart();
};

window.checkout = function() {
  if (cart.length === 0) return alert("Cart is empty");

  const name = document.getElementById("cusName").value;
  const phone = document.getElementById("cusPhone").value;
  const address = document.getElementById("cusAddress").value;

  alert(`Order placed!\n${name}\n${phone}`);

  cart = [];
  saveCart();
  renderCart();
};

/* =========================
MODAL
========================= */

window.openModal = function(id) {
  currentProduct = allProducts.find(p => p.id === id);
  if (!currentProduct) return;

  modalName.innerText = currentProduct.name;
  modalPrice.innerText = "Rs " + currentProduct.price;
  modalDesc.innerText = currentProduct.description || "";

  galleryContainer.innerHTML = `
    <img src="${currentProduct.image}" style="width:100%">
  `;

  loadReviews(id);

  modal.style.display = "block";
};

window.closeModal = function() {
  modal.style.display = "none";
};

/* =========================
REVIEWS + RATING
========================= */

document.querySelectorAll(".stars-display i").forEach(star => {
  star.addEventListener("click", () => {
    selectedRating = star.dataset.value;
  });
});

submitReviewBtn.addEventListener("click", async () => {
  if (!currentProduct) return;

  await addDoc(collection(db, "reviews"), {
    productId: currentProduct.id,
    text: reviewText.value,
    rating: selectedRating,
    time: Date.now()
  });

  reviewText.value = "";
  selectedRating = 0;

  loadReviews(currentProduct.id);
  showToast("Review added");
});

function loadReviews(productId) {
  const ref = collection(db, "reviews");

  onSnapshot(ref, (snapshot) => {
    const reviews = snapshot.docs
      .map(doc => doc.data())
      .filter(r => r.productId === productId);

    reviewList.innerHTML = "";

    reviews.forEach(r => {
      const div = document.createElement("div");
      div.className = "review";

      div.innerHTML = `
        <p>⭐ ${r.rating}</p>
        <p>${r.text}</p>
      `;

      reviewList.appendChild(div);
    });
  });
}

/* =========================
DARK MODE
========================= */

window.toggleDarkMode = function() {
  document.body.classList.toggle("dark");

  const icon = document.querySelector("#darkModeBtn i");
  if (icon) {
    icon.classList.toggle("fa-moon");
    icon.classList.toggle("fa-sun");
  }
};

/* =========================
TOAST + LOADING
========================= */

function showToast(msg) {
  toast.innerText = msg;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

function hideLoading() {
  if (loadingScreen) loadingScreen.style.display = "none";
}
