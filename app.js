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
      price,
      image,
      qty:1
    });
  }

  saveCart();

  alert("Added to Cart");
};

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
                  Rs ${price}
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

  setTimeout(()=>{
    hideLoading();
  },2500);

});
