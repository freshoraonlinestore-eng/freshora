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

const cartDrawer =
document.getElementById("cartDrawer");

const overlay =
document.getElementById("overlay");

/* =========================
   STATE
========================= */

let cart =
JSON.parse(
  localStorage.getItem("cart")
) || [];

let allProducts = [];

/* =========================
   HELPERS
========================= */

function safeNumber(value){

  return isNaN(Number(value))
    ? 0
    : Number(value);
}

function saveCart(){

  localStorage.setItem(
    "cart",
    JSON.stringify(cart)
  );

  updateCartCount();
  renderCart();
}

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

  localStorage.setItem(
    "darkMode",
    dark
  );

  updateDarkIcon();
};

function updateDarkIcon(){

  const btn =
  document.getElementById("darkModeBtn");

  if(!btn) return;

  const dark =
  document.body.classList.contains("dark");

  btn.innerHTML =
  dark
  ? '<i class="fa-solid fa-sun"></i>'
  : '<i class="fa-solid fa-moon"></i>';
}

/* =========================
   CART
========================= */

function updateCartCount(){

  const total =
  cart.reduce(
    (sum,item)=>
    sum + safeNumber(item.qty),
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
  cart.find(item =>
    item.id === id
  );

  if(existing){

    existing.qty++;

  }else{

    cart.push({
      id,
      name,
      price:safeNumber(price),
      image,
      qty:1
    });
  }

  saveCart();
};

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

window.clearCart = function(){

  const confirmClear =
  confirm(
    "Clear all cart items?"
  );

  if(!confirmClear) return;

  cart = [];

  saveCart();
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
        Your cart is empty
      </p>
    `;

    cartTotal.innerText =
    "Total: Rs 0";

    return;
  }

  let total = 0;

  cart.forEach((item,index)=>{

    const price =
    safeNumber(item.price);

    const qty =
    safeNumber(item.qty);

    total += price * qty;

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
            Rs ${price.toLocaleString()}
          </p>

          <div class="qty-box">

            <button
              onclick="decreaseQty(${index})"
            >
              -
            </button>

            <span>${qty}</span>

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

  cartTotal.innerText =
  "Total: Rs " +
  total.toLocaleString();
}

/* =========================
   TOGGLE CART
========================= */

window.toggleCart = function(){

  cartDrawer.classList.toggle("open");

  overlay.classList.toggle("show");

  document.body.style.overflow =
  cartDrawer.classList.contains("open")
  ? "hidden"
  : "auto";

  renderCart();
};

/* =========================
   CHECKOUT
========================= */

window.checkout = function(){

  if(cart.length === 0){

    alert("Cart is empty");
    return;
  }

  const name =
  document.getElementById("cusName")
  ?.value
  ?.trim();

  const phone =
  document.getElementById("cusPhone")
  ?.value
  ?.trim();

  const address =
  document.getElementById("cusAddress")
  ?.value
  ?.trim();

  if(!name || !phone || !address){

    alert(
      "Please fill all checkout fields"
    );

    return;
  }

  let message =
  `🛒 *Freshora Order*%0A%0A`;

  cart.forEach(item=>{

    message +=
    `• ${item.name} x${item.qty}%0A`;
  });

  const total =
  cart.reduce(
    (sum,item)=>
    sum + item.price * item.qty,
    0
  );

  message +=
  `%0A💰 Total: Rs ${total.toLocaleString()}%0A`;

  message +=
  `%0A👤 Name: ${name}`;

  message +=
  `%0A📞 Phone: ${phone}`;

  message +=
  `%0A📍 Address: ${address}`;

  window.open(
    `https://wa.me/94752425790?text=${message}`,
    "_blank"
  );
};

/* =========================
   FILTER PRODUCTS
========================= */

function filterProducts(){

  const search =
  document
  .getElementById("searchInput")
  ?.value
  ?.toLowerCase()
  ?.trim() || "";

  const category =
  document
  .getElementById("categoryFilter")
  ?.value || "all";

  const price =
  document
  .getElementById("priceFilter")
  ?.value || "all";

  const discount =
  document
  .getElementById("discountFilter")
  ?.value || "all";

  const filtered =
  allProducts.filter(product=>{

    const name =
    (product.name || "")
    .toLowerCase();

    const productPrice =
    safeNumber(product.price);

    const productDiscount =
    safeNumber(product.discount);

    return (

      name.includes(search)

      &&

      (
        category === "all"
        ||
        product.category === category
      )

      &&

      (
        price === "all"
        ||
        productPrice <= safeNumber(price)
      )

      &&

      (
        discount === "all"
        ||
        productDiscount >= safeNumber(discount)
      )

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
      <p class="empty">
        No products found
      </p>
    `;

    return;
  }

  products.forEach(product=>{

    const id =
    product.id;

    const name =
    product.name ||
    "Unnamed Product";

    const image =
    product.image ||
    "placeholder.png";

    const price =
    safeNumber(product.price);

    const discount =
    safeNumber(product.discount);

    const finalPrice =
    discount > 0
    ? Math.round(
        price -
        (price * discount / 100)
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
                '${id}',
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
                '${id}',
                '${name}',
                '${finalPrice}',
                '${image}'
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
   MODAL
========================= */

window.openModal = function(
  id,
  name,
  price,
  image
){

  const modal =
  document.getElementById(
    "productModal"
  );

  if(!modal) return;

  modal.style.display = "flex";

  document.getElementById(
    "modalImage"
  ).src = image;

  document.getElementById(
    "modalName"
  ).innerText = name;

  document.getElementById(
    "modalPrice"
  ).innerText =
  "Rs " + price;

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
  document.getElementById(
    "productModal"
  );

  if(modal){

    modal.style.display = "none";
  }
};

window.onclick = function(e){

  const modal =
  document.getElementById(
    "productModal"
  );

  if(e.target === modal){

    closeModal();
  }
};

/* =========================
   FIREBASE
========================= */

try{

  onSnapshot(

    collection(db,"products"),

    (snapshot)=>{

      allProducts = [];

      snapshot.forEach(doc=>{

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

      productsDiv.innerHTML = `
        <p class="empty">
          Failed to load products
        </p>
      `;
    }
  );

}catch(error){

  console.log(error);

  hideLoading();
}

/* =========================
   INIT
========================= */

window.addEventListener(
  "DOMContentLoaded",
  ()=>{

    const dark =
    localStorage.getItem(
      "darkMode"
    ) === "true";

    if(dark){

      document.body.classList.add("dark");
    }

    updateDarkIcon();

    updateCartCount();

    renderCart();
  }
);

window.addEventListener(
  "load",
  ()=>{

    setTimeout(
      hideLoading,
      1200
    );
  }
);
