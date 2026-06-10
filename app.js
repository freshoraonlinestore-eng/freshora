import {
  db,
  collection,
  onSnapshot,
  addDoc
} from "./firebase.js";

/* =========================
STATE
========================= */

const productsDiv = document.getElementById("products");
const loadingScreen = document.getElementById("loadingScreen");
const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let reviews = JSON.parse(localStorage.getItem("reviews")) || {};
let allProducts = [];

/* =========================
UTILS
========================= */

const safeNumber = v => isNaN(Number(v)) ? 0 : Number(v);

function saveCart(){
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

function saveWishlist(){
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  renderProducts(allProducts);
}

function saveReviews(){
  localStorage.setItem("reviews", JSON.stringify(reviews));
}

/* =========================
DARK MODE
========================= */

window.toggleDarkMode = function(){
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
  updateDarkIcon();
};

function updateDarkIcon(){
  const btn = document.getElementById("darkModeBtn");
  if(!btn) return;

  btn.innerHTML = document.body.classList.contains("dark")
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
}

/* =========================
CART
========================= */

function updateCartCount(){
  const total = cart.reduce((s,i)=>s + safeNumber(i.qty),0);
  document.getElementById("floatingCartCount").innerText = total;
}

window.addToCart = function(id,name,price,image){
  const ex = cart.find(i=>i.id===id);
  if(ex) ex.qty++;
  else cart.push({id,name,price:safeNumber(price),image,qty:1});
  saveCart();
};

window.toggleCart = function(){
  cartDrawer.classList.toggle("open");
  overlay.classList.toggle("show");
  document.body.style.overflow = cartDrawer.classList.contains("open") ? "hidden":"auto";
  renderCart();
};

/* =========================
WISHLIST
========================= */

window.toggleWishlist = function(id){
  wishlist = wishlist.includes(id)
    ? wishlist.filter(i=>i!==id)
    : [...wishlist,id];

  saveWishlist();
};

const isWishlisted = id => wishlist.includes(id);

/* =========================
REVIEWS
========================= */

function getReviews(id){
  return reviews[id] || [];
}

function avgRating(id){
  const r = getReviews(id);
  if(!r.length) return 5;
  return (r.reduce((s,i)=>s+i.rating,0)/r.length).toFixed(1);
}

window.submitReview = function(pid){
  const text = document.getElementById("reviewText").value.trim();
  const rating = document.getElementById("reviewRating").value;

  if(!text) return alert("Write review");

  if(!reviews[pid]) reviews[pid]=[];

  reviews[pid].push({
    text,
    rating:safeNumber(rating),
    date:new Date().toLocaleDateString()
  });

  saveReviews();
  renderReviews(pid);
};

/* =========================
MODAL (WITH GALLERY)
========================= */

window.openModal = function(p){

  const modal = document.getElementById("productModal");

  document.getElementById("modalImage").src = p.image;
  document.getElementById("modalName").innerText = p.name;
  document.getElementById("modalPrice").innerText =
    "Rs " + safeNumber(p.finalPrice).toLocaleString();

  document.getElementById("modalRatingText").innerText = avgRating(p.id);

  /* gallery */
  const gallery = document.getElementById("imageGallery");
  gallery.innerHTML = "";

  (p.images || [p.image]).forEach(img=>{
    const el = document.createElement("img");
    el.src = img;
    el.onclick = ()=>document.getElementById("modalImage").src = img;
    gallery.appendChild(el);
  });

  document.getElementById("modalAddBtn").onclick = ()=>{
    addToCart(p.id,p.name,p.finalPrice,p.image);
  };

  document.getElementById("reviewSubmitBtn").onclick = ()=>{
    submitReview(p.id);
  };

  modal.classList.add("show");
};

window.closeModal = function(){
  document.getElementById("productModal").classList.remove("show");
};

/* =========================
PRODUCTS
========================= */

function renderProducts(products){
  productsDiv.innerHTML = "";

  products.forEach(p=>{

    const price = safeNumber(p.price);
    const discount = safeNumber(p.discount);

    const finalPrice = discount
      ? Math.round(price - price*discount/100)
      : price;

    productsDiv.innerHTML += `
      <div class="card">

        <button class="wishlist-btn" onclick="toggleWishlist('${p.id}')">
          <i class="${isWishlisted(p.id)?'fa-solid':'fa-regular'} fa-heart"></i>
        </button>

        <img src="${p.image}" />

        <div class="card-content">

          <h3>${p.name}</h3>

          <div class="rating-preview">⭐ ${avgRating(p.id)}</div>

          <div class="price-box">
            <span class="new-price">Rs ${finalPrice}</span>
          </div>

          <div class="card-buttons">

            <button class="view-btn"
              onclick='openModal(${JSON.stringify({...p,finalPrice})})'>
              View
            </button>

            <button class="add-cart-btn"
              onclick="addToCart('${p.id}','${p.name}',${finalPrice},'${p.image}')">
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

onSnapshot(collection(db,"products"),snap=>{
  allProducts = [];
  snap.forEach(d=>{
    allProducts.push({id:d.id,...d.data()});
  });

  renderProducts(allProducts);
  loadingScreen.style.display="none";
});

/* =========================
INIT
========================= */

window.addEventListener("DOMContentLoaded",()=>{
  if(localStorage.getItem("darkMode")==="true"){
    document.body.classList.add("dark");
  }

  updateCartCount();
  updateDarkIcon();
});
