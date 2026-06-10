import {
  db,
  collection,
  onSnapshot
} from "./firebase.js";

/* =========================
   ELEMENTS
========================= */

const productsDiv = document.getElementById("products");
const loadingScreen = document.getElementById("loadingScreen");
const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const priceFilter = document.getElementById("priceFilter");
const discountFilter = document.getElementById("discountFilter");

/* =========================
   STATE
========================= */

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let reviews = JSON.parse(localStorage.getItem("reviews")) || {};
let allProducts = [];

/* =========================
   HELPERS
========================= */

function safe(n){
  return isNaN(Number(n)) ? 0 : Number(n);
}

function saveCart(){
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

function saveWishlist(){
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
}

function saveReviews(){
  localStorage.setItem("reviews", JSON.stringify(reviews));
}

/* =========================
   DARK MODE
========================= */

window.toggleDarkMode = () => {
  document.body.classList.toggle("dark");

  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark")
  );

  updateDarkIcon();
};

function updateDarkIcon(){
  const btn = document.getElementById("darkModeBtn");

  if(!btn) return;

  btn.innerHTML =
    document.body.classList.contains("dark")
      ? `<i class="fa-solid fa-sun"></i>`
      : `<i class="fa-solid fa-moon"></i>`;
}

/* =========================
   LOADING
========================= */

function hideLoading(){
  if(!loadingScreen) return;

  loadingScreen.style.opacity = "0";

  setTimeout(()=>{
    loadingScreen.style.display = "none";
  },300);
}

/* =========================
   CART COUNT
========================= */

function updateCartCount(){
  const el = document.getElementById("floatingCartCount");

  const total = cart.reduce((s,i)=>s+i.qty,0);

  if(el) el.innerText = total;
}

/* =========================
   WISHLIST
========================= */

window.toggleWishlist = (id) => {

  if(wishlist.includes(id)){
    wishlist = wishlist.filter(w=>w!==id);
  }else{
    wishlist.push(id);
  }

  saveWishlist();
  renderProducts(allProducts);
};

function isWishlisted(id){
  return wishlist.includes(id);
}

/* =========================
   CART
========================= */

window.addToCart = (id,name,price,image)=>{

  const item = cart.find(i=>i.id===id);

  if(item){
    item.qty++;
  }else{
    cart.push({
      id,
      name,
      price:safe(price),
      image:image || "placeholder.png",
      qty:1
    });
  }

  saveCart();
};

window.removeItem = (i)=>{
  cart.splice(i,1);
  saveCart();
};

window.increaseQty = (i)=>{
  if(cart[i]) cart[i].qty++;
  saveCart();
};

window.decreaseQty = (i)=>{
  if(!cart[i]) return;

  cart[i].qty--;

  if(cart[i].qty<=0){
    cart.splice(i,1);
  }

  saveCart();
};

window.clearCart = ()=>{
  if(!confirm("Clear cart?")) return;

  cart = [];
  saveCart();
};

/* =========================
   CART DRAWER
========================= */

window.toggleCart = ()=>{

  cartDrawer.classList.toggle("open");
  overlay.classList.toggle("show");

  document.body.style.overflow =
    cartDrawer.classList.contains("open")
      ? "hidden"
      : "auto";
};

/* =========================
   RENDER CART
========================= */

function renderCart(){

  const box = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");

  if(!box) return;

  box.innerHTML = "";

  if(cart.length===0){

    box.innerHTML = `
      <p class="empty">Cart is empty</p>
    `;

    totalEl.innerText = "Total: Rs 0";
    return;
  }

  let total = 0;

  cart.forEach((c,i)=>{

    total += c.price * c.qty;

    box.innerHTML += `
      <div class="cart-item">

        <img src="${c.image}"/>

        <div class="cart-details">

          <h4>${c.name}</h4>

          <p>Rs ${c.price.toLocaleString()}</p>

          <div class="qty-box">

            <button onclick="decreaseQty(${i})">-</button>

            <span>${c.qty}</span>

            <button onclick="increaseQty(${i})">+</button>

          </div>

        </div>

        <button class="remove-btn"
          onclick="removeItem(${i})">
          ✕
        </button>

      </div>
    `;
  });

  totalEl.innerText =
    "Total: Rs " + total.toLocaleString();
}

/* =========================
   REVIEWS
========================= */

function getReviews(id){
  return reviews[id] || [];
}

function avgRating(id){

  const list = getReviews(id);

  if(!list.length) return 5;

  const sum =
    list.reduce((a,b)=>a+safe(b.rating),0);

  return (sum/list.length).toFixed(1);
}

window.submitReview = (id)=>{

  const text =
    document.getElementById("reviewText")
    ?.value
    ?.trim();

  const rating =
    document.getElementById("reviewRating")
    ?.value;

  if(!text) return alert("Write review");

  if(!reviews[id]){
    reviews[id] = [];
  }

  reviews[id].push({
    text,
    rating:safe(rating),
    date:new Date().toLocaleDateString()
  });

  saveReviews();

  renderReviews(id);
  renderProducts(allProducts);

  document.getElementById("reviewText").value = "";
};

function renderReviews(id){

  const box = document.getElementById("reviewList");

  if(!box) return;

  const list = getReviews(id);

  if(!list.length){

    box.innerHTML =
      `<p class="empty-review">No reviews yet</p>`;

    return;
  }

  box.innerHTML = "";

  [...list].reverse().forEach(r=>{

    box.innerHTML += `
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
   MODAL
========================= */

window.openModalById = (id)=>{

  const p = allProducts.find(x=>x.id===id);

  if(!p) return;

  const price = safe(p.price);
  const discount = safe(p.discount);

  const final =
    discount > 0
      ? Math.round(price-(price*discount)/100)
      : price;

  document.getElementById("modalImage").src =
    p.image || "placeholder.png";

  document.getElementById("modalName").innerText =
    p.name;

  document.getElementById("modalPrice").innerText =
    "Rs " + final.toLocaleString();

  document.getElementById("modalRatingText").innerText =
    avgRating(p.id);

  document.getElementById("modalAddBtn").onclick =
    ()=>addToCart(
      p.id,
      p.name,
      final,
      p.image
    );

  document.getElementById("reviewSubmitBtn").onclick =
    ()=>submitReview(p.id);

  renderReviews(p.id);

  document
    .getElementById("productModal")
    .classList.add("show");
};

window.closeModal = ()=>{
  document
    .getElementById("productModal")
    .classList.remove("show");
};

/* =========================
   PRODUCTS
========================= */

function renderProducts(list){

  if(!productsDiv) return;

  productsDiv.innerHTML = "";

  list.forEach(p=>{

    const price = safe(p.price);
    const discount = safe(p.discount);

    const final =
      discount > 0
        ? Math.round(price-(price*discount)/100)
        : price;

    productsDiv.innerHTML += `
      <div class="card">

        ${
          discount > 0
            ? `<div class="discount-badge">
                -${discount}%
              </div>`
            : ""
        }

        <button class="wishlist-btn"
          onclick="toggleWishlist('${p.id}')">

          <i class="${
            isWishlisted(p.id)
              ? "fa-solid"
              : "fa-regular"
          } fa-heart"></i>

        </button>

        <img src="${p.image || 'placeholder.png'}"/>

        <div class="card-content">

          <h3>${p.name}</h3>

          <div class="rating-preview">
            ⭐ ${avgRating(p.id)}
          </div>

          <div class="price-box">

            ${
              discount > 0
                ? `<span class="old-price">
                    Rs ${price.toLocaleString()}
                  </span>`
                : ""
            }

            <span class="new-price">
              Rs ${final.toLocaleString()}
            </span>

          </div>

          <div class="card-buttons">

            <button class="view-btn"
              onclick="openModalById('${p.id}')">
              View
            </button>

            <button class="add-cart-btn"
              onclick="addToCart(
                '${p.id}',
                '${p.name}',
                ${final},
                '${p.image}'
              )">

              Add

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
  collection(db,"products"),
  (snap)=>{

    allProducts = snap.docs.map(d=>({
      id:d.id,
      ...d.data()
    }));

    renderProducts(allProducts);

    hideLoading();
  }
);

/* =========================
   FILTER
========================= */

function filterProducts(){

  let f = [...allProducts];

  const s =
    searchInput?.value?.toLowerCase();

  if(s){
    f = f.filter(p=>
      p.name?.toLowerCase().includes(s)
    );
  }

  const c = categoryFilter?.value;

  if(c && c!=="all"){
    f = f.filter(p=>
      (p.category || "")
      .toLowerCase() === c.toLowerCase()
    );
  }

  const pr = priceFilter?.value;

  if(pr && pr!=="all"){
    f = f.filter(p=>
      safe(p.price)<=safe(pr)
    );
  }

  const d = discountFilter?.value;

  if(d && d!=="all"){
    f = f.filter(p=>
      safe(p.discount)>=safe(d)
    );
  }

  renderProducts(f);
}

searchInput?.addEventListener(
  "input",
  filterProducts
);

categoryFilter?.addEventListener(
  "change",
  filterProducts
);

priceFilter?.addEventListener(
  "change",
  filterProducts
);

discountFilter?.addEventListener(
  "change",
  filterProducts
);

/* =========================
   CHECKOUT
========================= */

window.checkout = ()=>{

  if(cart.length===0){
    return alert("Cart is empty");
  }

  const name =
    document.getElementById("cusName").value;

  const phone =
    document.getElementById("cusPhone").value;

  const address =
    document.getElementById("cusAddress").value;

  let msg =
`🛒 Freshora Order

👤 Name: ${name}
📞 Phone: ${phone}
📍 Address: ${address}

------------------`;

  let total = 0;

  cart.forEach(i=>{

    total += i.price * i.qty;

    msg += `

${i.name}
Qty: ${i.qty}
Rs ${i.price.toLocaleString()}
`;
  });

  msg += `

------------------
Total: Rs ${total.toLocaleString()}
`;

  window.open(
    `https://wa.me/94752425790?text=${encodeURIComponent(msg)}`
  );
};

/* =========================
   INIT
========================= */

window.addEventListener(
  "DOMContentLoaded",
  ()=>{

    if(
      localStorage.getItem("darkMode")
      === "true"
    ){
      document.body.classList.add("dark");
    }

    updateDarkIcon();
    updateCartCount();
    renderCart();
  }
);

window.addEventListener(
  "load",
  ()=>setTimeout(hideLoading,1000)
);

/* =========================
   ESC CLOSE
========================= */

window.addEventListener(
  "keydown",
  (e)=>{

    if(e.key==="Escape"){

      closeModal();

      if(
        cartDrawer.classList.contains("open")
      ){
        toggleCart();
      }
    }
  }
);

/* =========================
   IMAGE FALLBACK
========================= */

document.addEventListener(
  "error",
  (e)=>{

    if(e.target.tagName==="IMG"){
      e.target.src = "placeholder.png";
    }
  },
  true
);
