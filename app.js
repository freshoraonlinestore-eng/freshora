import {
  db,
  collection,
  onSnapshot,
  addDoc
} from "./firebase.js";

/* =========================
   ELEMENTS
========================= */

const productsDiv =
document.getElementById("products");

let cart =
JSON.parse(localStorage.getItem("cart")) || [];

let allProducts = [];

let currentCategory = "all";

/* =========================
   SAVE CART
========================= */

function saveCart(){

  localStorage.setItem(
    "cart",
    JSON.stringify(cart)
  );

  updateCartCount();

  renderCart();
}

/* =========================
   CART COUNT
========================= */

function updateCartCount(){

  const total =
  cart.reduce(
    (sum,item)=>sum + item.qty,
    0
  );

  const cartCount =
  document.getElementById("cartCount");

  const floatingCartCount =
  document.getElementById(
    "floatingCartCount"
  );

  if(cartCount){
    cartCount.innerText = total;
  }

  if(floatingCartCount){
    floatingCartCount.innerText = total;
  }
}

/* =========================
   TOGGLE CART
========================= */

window.toggleCart = function(){

  document
  .getElementById("cartDrawer")
  .classList.toggle("open");

  renderCart();
};

/* =========================
   ADD TO CART
========================= */

window.addToCart = function(
  id,
  name,
  price,
  image
){

  const existing =
  cart.find(item => item.id === id);

  if(existing){

    existing.qty++;

  }else{

    cart.push({
      id,
      name,
      price:Number(price),
      image,
      qty:1
    });
  }

  saveCart();

  showToast("Added to cart 🛒");
};

/* =========================
   REMOVE ITEM
========================= */

window.removeItem = function(index){

  cart.splice(index,1);

  saveCart();

  showToast("Item removed");
};

/* =========================
   QTY
========================= */

window.increaseQty = function(index){

  cart[index].qty++;

  saveCart();
};

window.decreaseQty = function(index){

  cart[index].qty--;

  if(cart[index].qty <= 0){

    cart.splice(index,1);
  }

  saveCart();
};

/* =========================
   CLEAR CART
========================= */

window.clearCart = function(){

  cart = [];

  saveCart();

  showToast("Cart cleared");
};

/* =========================
   RENDER CART
========================= */

function renderCart(){

  const cartItems =
  document.getElementById("cartItems");

  const cartTotal =
  document.getElementById("cartTotal");

  cartItems.innerHTML = "";

  let total = 0;

  if(cart.length === 0){

    cartItems.innerHTML = `
      <div class="empty">
        <h3>Cart is Empty</h3>
      </div>
    `;

    cartTotal.innerText =
    "Total: Rs 0";

    return;
  }

  cart.forEach((item,index)=>{

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

window.checkout = async function(){

  if(cart.length === 0){

    showToast("Cart Empty");

    return;
  }

  let total = 0;

  cart.forEach(item => {

    total += item.price * item.qty;
  });

  /* SAVE ORDER */

  await addDoc(
    collection(db,"orders"),
    {
      items:cart,
      total,
      createdAt:Date.now()
    }
  );

  let msg =
  "🛒 Freshora Order:%0A%0A";

  cart.forEach(item=>{

    msg +=
    `${item.name} x${item.qty}%0A`;
  });

  msg += `%0ATotal: Rs ${total}`;

  window.open(
    "https://wa.me/94752425790?text=" + msg
  );

  showToast("Order Sent ✅");
};

/* =========================
   MODAL
========================= */

window.openModal = function(
  id,
  name,
  price,
  image
){

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

window.closeModal = function(){

  document.getElementById(
    "productModal"
  ).style.display = "none";
};

/* =========================
   DARK MODE
========================= */

window.toggleDarkMode = function(){

  document.body.classList.toggle("dark");

  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark")
  );
};

if(
  localStorage.getItem("darkMode")
  === "true"
){
  document.body.classList.add("dark");
}

/* =========================
   CATEGORY FILTER
========================= */

window.filterCategory = function(category){

  currentCategory = category;

  renderProducts(allProducts);
};

/* =========================
   SEARCH
========================= */

document.addEventListener("input",(e)=>{

  if(e.target.id === "searchInput"){

    renderProducts(allProducts);
  }
});

/* =========================
   RENDER PRODUCTS
========================= */

function renderProducts(products){

  productsDiv.innerHTML = "";

  const search =
  document
  .getElementById("searchInput")
  .value
  .toLowerCase();

  const filtered =
  products.filter(product => {

    const matchSearch =
    product.name
    .toLowerCase()
    .includes(search);

    const matchCategory =
    currentCategory === "all"
    ||
    product.category === currentCategory;

    return matchSearch && matchCategory;
  });

  if(filtered.length === 0){

    productsDiv.innerHTML = `
      <div class="empty">

        <h3>
          No products found
        </h3>

      </div>
    `;

    return;
  }

  filtered.forEach((product) => {

    const discount =
    Number(product.discount || 0);

    const originalPrice =
    Number(product.price);

    const discountedPrice =
    discount > 0
    ? Math.round(
        originalPrice -
        (originalPrice * discount / 100)
      )
    : originalPrice;

    const stockText =
    product.stock || "In Stock";

    const stockClass =
    stockText.toLowerCase()
    .includes("out")
    ? "out-stock"
    : "in-stock";

    productsDiv.innerHTML += `

      <div class="card fade-in">

        ${
          discount > 0
          ? `
            <div class="discount-badge">
              ${discount}% OFF
            </div>
          `
          : ""
        }

        <div class="image-wrap">

          <img
            src="${product.image}"
            loading="lazy"
            alt="${product.name}"
          >

        </div>

        <div class="card-content">

          <div class="product-category">

            ${product.category || "General"}

          </div>

          <h3 class="product-title">

            ${product.name}

          </h3>

          <div class="rating-row">

            <div class="stars">
              ⭐⭐⭐⭐⭐
            </div>

            <span class="rating-count">
              (4.9)
            </span>

          </div>

          <div class="price-box">

            ${
              discount > 0
              ? `
                <span class="old-price">
                  Rs ${originalPrice}
                </span>
              `
              : ""
            }

            <span class="new-price">
              Rs ${discountedPrice}
            </span>

          </div>

          <div class="stock ${stockClass}">

            ${stockText}

          </div>

          <div class="card-buttons">

            <button
              class="view-btn"
              onclick="openModal(
                '${product.id}',
                '${product.name}',
                '${discountedPrice}',
                '${product.image}'
              )">

              View

            </button>

            <button
              class="add-cart-btn"
              onclick="addToCart(
                '${product.id}',
                '${product.name}',
                '${discountedPrice}',
                '${product.image}'
              )">

              Add to Cart

            </button>

          </div>

        </div>

      </div>
    `;
  });
}

/* =========================
   TOAST
========================= */

function showToast(text){

  const toast =
  document.createElement("div");

  toast.className = "toast";

  toast.innerText = text;

  document.body.appendChild(toast);

  setTimeout(()=>{
    toast.classList.add("show");
  },100);

  setTimeout(()=>{

    toast.classList.remove("show");

    setTimeout(()=>{
      toast.remove();
    },300);

  },2000);
}

/* =========================
   LOAD PRODUCTS
========================= */

onSnapshot(
  collection(db,"products"),
  (snap)=>{

    allProducts = [];

    snap.forEach(docItem=>{

      allProducts.push({
        id:docItem.id,
        ...docItem.data()
      });
    });

    renderProducts(allProducts);

    updateCartCount();
  }
);

/* =========================
   INIT
========================= */

window.addEventListener("load",()=>{

  updateCartCount();

  renderCart();
});
