import {
  db,
  collection,
  onSnapshot
} from "./firebase.js";

/* =========================
   ELEMENTS
========================= */

const productsDiv =
document.getElementById("products");

const loadingScreen =
document.getElementById("loadingScreen");

/* =========================
   STATE
========================= */

let cart =
JSON.parse(localStorage.getItem("cart")) || [];

let allProducts = [];

/* =========================
   SAFE LOADING HIDE
========================= */

function hideLoading(){

  if(!loadingScreen) return;

  loadingScreen.style.opacity = "0";

  setTimeout(()=>{
    loadingScreen.style.display = "none";
  },300);
}

/* =========================
   DARK MODE
========================= */

window.toggleDarkMode = function(){

  document.body.classList.toggle("dark");

  const dark =
  document.body.classList.contains("dark");

  localStorage.setItem("darkMode", dark);

  const btn =
  document.getElementById("darkModeBtn");

  if(btn){
    btn.innerHTML =
    dark ? "☀️" : "🌙";
  }
};

window.addEventListener("DOMContentLoaded",()=>{

  const dark =
  localStorage.getItem("darkMode") === "true";

  if(dark){
    document.body.classList.add("dark");
  }

  const btn =
  document.getElementById("darkModeBtn");

  if(btn){
    btn.innerHTML =
    dark ? "☀️" : "🌙";
  }
});

/* =========================
   CART
========================= */

function saveCart(){

  localStorage.setItem(
    "cart",
    JSON.stringify(cart)
  );

  updateCartCount();
  renderCart();
}

function updateCartCount(){

  const total =
  cart.reduce(
    (sum,item)=>sum + item.qty,
    0
  );

  const count =
  document.getElementById(
    "floatingCartCount"
  );

  if(count){
    count.innerText = total;
  }
}

window.addToCart = function(
  id,
  name,
  price,
  image
){

  const existing =
  cart.find(i => i.id === id);

  if(existing){

    existing.qty++;

  } else {

    cart.push({
      id,
      name,
      price:Number(price),
      image,
      qty:1
    });
  }

  saveCart();

  alert("Added to Cart");
};

/* =========================
   REMOVE ITEM
========================= */

window.removeItem = function(index){

  cart.splice(index,1);

  saveCart();
};

window.increaseQty = function(index){

  if(cart[index]){

    cart[index].qty++;

    saveCart();
  }
};

window.decreaseQty = function(index){

  if(cart[index]){

    cart[index].qty--;

    if(cart[index].qty <= 0){
      cart.splice(index,1);
    }

    saveCart();
  }
};

/* =========================
   RENDER CART
========================= */

function renderCart(){

  const cartItems =
  document.getElementById("cartItems");

  const cartTotal =
  document.getElementById("cartTotal");

  if(!cartItems) return;

  cartItems.innerHTML = "";

  if(cart.length === 0){

    cartItems.innerHTML = `
      <p class="empty">
        Cart Empty
      </p>
    `;

    if(cartTotal){
      cartTotal.innerText =
      "Total: Rs 0";
    }

    return;
  }

  let total = 0;

  cart.forEach((item,index)=>{

    total += item.price * item.qty;

    cartItems.innerHTML += `

      <div class="cart-item">

        <img
          src="${item.image}"
          alt="${item.name}"
          onerror="this.src='placeholder.png'"
        >

        <div class="cart-details">

          <h4>${item.name}</h4>

          <p>
            Rs ${Number(item.price).toLocaleString()}
          </p>

          <div class="qty-box">

            <button
              onclick="decreaseQty(${index})"
            >
              -
            </button>

            <span>${item.qty}</span>

            <button
              onclick="increaseQty(${index})"
            >
              +
            </button>

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

  if(cartTotal){

    cartTotal.innerText =
    "Total: Rs " +
    total.toLocaleString();
  }
}

/* =========================
   FILTER PRODUCTS
========================= */

function filterProducts(){

  const search =
  document.getElementById("searchInput")
  ?.value
  .toLowerCase()
  .trim() || "";

  const category =
  document.getElementById("categoryFilter")
  ?.value || "all";

  const price =
  document.getElementById("priceFilter")
  ?.value || "all";

  const discount =
  document.getElementById("discountFilter")
  ?.value || "all";

  const filtered =
  allProducts.filter(product => {

    const name =
    (product.name || "")
    .toLowerCase();

    const productCategory =
    product.category || "";

    const productPrice =
    Number(product.price) || 0;

    const productDiscount =
    Number(product.discount) || 0;

    const matchSearch =
    name.includes(search);

    const matchCategory =
    category === "all" ||
    productCategory === category;

    const matchPrice =
    price === "all" ||
    productPrice <= Number(price);

    const matchDiscount =
    discount === "all" ||
    productDiscount >= Number(discount);

    return (
      matchSearch &&
      matchCategory &&
      matchPrice &&
      matchDiscount
    );
  });

  renderProducts(filtered);
}

/* =========================
   FILTER EVENTS
========================= */

document
.getElementById("searchInput")
?.addEventListener(
  "input",
  filterProducts
);

document
.getElementById("categoryFilter")
?.addEventListener(
  "change",
  filterProducts
);

document
.getElementById("priceFilter")
?.addEventListener(
  "change",
  filterProducts
);

document
.getElementById("discountFilter")
?.addEventListener(
  "change",
  filterProducts
);

/* =========================
   RENDER PRODUCTS
========================= */

function renderProducts(products){

  if(!productsDiv) return;

  productsDiv.innerHTML = "";

  if(products.length === 0){

    productsDiv.innerHTML = `
      <p style="
        text-align:center;
        width:100%;
        padding:40px;
      ">
        No Products Found
      </p>
    `;

    return;
  }

  products.forEach(p=>{

    const image =
    p.image || "placeholder.png";

    const name =
    p.name || "Unnamed Product";

    const price =
    Number(p.price) || 0;

    const discount =
    Number(p.discount) || 0;

    const finalPrice =
    discount > 0
    ? Math.round(
        price - (price * discount / 100)
      )
    : price;

    productsDiv.innerHTML += `

      <div class="card">

        ${
          discount > 0
          ? `
            <div class="discount-badge">
              ${discount}% OFF
            </div>
          `
          : ""
        }

        <img
          src="${image}"
          alt="${name}"
          onerror="this.src='placeholder.png'"
        >

        <div class="card-content">

          <h3>${name}</h3>

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
              onclick="openModal(
                '${p.id}',
                '${name}',
                '${finalPrice}',
                '${image}'
              )"
            >
              View
            </button>

            <button
              class="add-cart-btn"
              onclick="addToCart(
                '${p.id}',
                '${name}',
                '${finalPrice}',
                '${image}'
              )"
            >
              Add
            </button>

          </div>

        </div>

      </div>

    `;
  });
}

/* =========================
   MODAL
========================= */

window.openModal = function(
  id,
  name,
  price,
  image
){

  const modal =
  document.getElementById("productModal");

  if(!modal) return;

  modal.style.display = "block";

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
  ).onclick = ()=>{

    addToCart(
      id,
      name,
      price,
      image
    );
  };
};

window.closeModal = function(){

  const modal =
  document.getElementById("productModal");

  if(modal){
    modal.style.display = "none";
  }
};

window.onclick = function(e){

  const modal =
  document.getElementById("productModal");

  if(e.target === modal){
    closeModal();
  }
};

/* =========================
   CART DRAWER
========================= */

window.toggleCart = function(){

  document
    .getElementById("cartDrawer")
    ?.classList.toggle("open");

  document
    .getElementById("overlay")
    ?.classList.toggle("show");

  renderCart();
};

/* =========================
   FIREBASE PRODUCTS
========================= */

try{

  onSnapshot(
    collection(db,"products"),
    (snapshot)=>{

      allProducts = [];

      snapshot.forEach((doc)=>{

        allProducts.push({
          id:doc.id,
          ...doc.data()
        });

      });

      renderProducts(allProducts);

      hideLoading();
    },
    (error)=>{

      console.log(error);

      hideLoading();

      if(productsDiv){

        productsDiv.innerHTML = `
          <p style="
            text-align:center;
            padding:40px;
            width:100%;
            color:red;
          ">
            Failed To Load Products
          </p>
        `;
      }
    }
  );

}catch(error){

  console.log(error);

  hideLoading();

  if(productsDiv){

    productsDiv.innerHTML = `
      <p style="
        text-align:center;
        padding:40px;
        width:100%;
        color:red;
      ">
        Firebase Connection Error
      </p>
    `;
  }
}

/* =========================
   WINDOW LOAD
========================= */

window.addEventListener("load",()=>{

  updateCartCount();

  renderCart();

  setTimeout(()=>{
    hideLoading();
  },2500);

});
