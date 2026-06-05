import {
  db,
  collection,
  onSnapshot
} from "./firebase.js";

const productsDiv =
document.getElementById("products");

let cart =
JSON.parse(localStorage.getItem("cart")) || [];

let allProducts = [];

/* DARK MODE */

window.toggleDarkMode = function(){

  document.body.classList.toggle("dark");

  const dark =
  document.body.classList.contains("dark");

  localStorage.setItem("darkMode", dark);

  document.getElementById("darkModeBtn").innerHTML =
  dark ? "☀️" : "🌙";
};

window.addEventListener("DOMContentLoaded",()=>{

  const dark =
  localStorage.getItem("darkMode") === "true";

  if(dark){
    document.body.classList.add("dark");
  }

  document.getElementById("darkModeBtn").innerHTML =
  dark ? "☀️" : "🌙";
});

/* CART */

function saveCart(){

  localStorage.setItem(
    "cart",
    JSON.stringify(cart)
  );

  updateCartCount();
}

function updateCartCount(){

  const total =
  cart.reduce((sum,item)=>sum+item.qty,0);

  document.getElementById(
    "floatingCartCount"
  ).innerText = total;
}

window.addToCart = function(id,name,price,image){

  const existing =
  cart.find(i=>i.id===id);

  if(existing){
    existing.qty++;
  }else{
    cart.push({
      id,
      name,
      price,
      image,
      qty:1
    });
  }

  saveCart();
};

/* PRODUCTS */

function renderProducts(products){

  productsDiv.innerHTML = "";

  if(products.length === 0){

    productsDiv.innerHTML =
    `<p>No Products Found</p>`;

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
    discount
    ? Math.round(
      price - (price * discount / 100)
    )
    : price;

    productsDiv.innerHTML += `
    
    <div class="card">

      ${
        discount
        ? `<div class="discount-badge">
            ${discount}% OFF
          </div>`
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
            discount
            ? `<span class="old-price">
                Rs ${price}
              </span>`
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

/* MODAL */

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

  document.getElementById(
    "productModal"
  ).style.display = "none";
};

/* CART DRAWER */

window.toggleCart = function(){

  document
  .getElementById("cartDrawer")
  .classList.toggle("open");

  document
  .getElementById("overlay")
  .classList.toggle("show");
};

/* LOAD */

window.addEventListener("load",()=>{

  document.getElementById(
    "loadingScreen"
  ).style.display = "none";

  updateCartCount();
});

/* FIREBASE */

onSnapshot(
  collection(db,"products"),
  (snap)=>{

    allProducts = [];

    snap.forEach((doc)=>{

      allProducts.push({
        id:doc.id,
        ...doc.data()
      });

    });

    renderProducts(allProducts);
  }
);
