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

/* =========================
   STATE
========================= */

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let allProducts = [];

/* =========================
   TOAST
========================= */

function showToast(text){
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = text;

  document.body.appendChild(toast);

  setTimeout(()=>toast.classList.add("show"),100);

  setTimeout(()=>{
    toast.classList.remove("show");
    setTimeout(()=>toast.remove(),300);
  },2000);
}

/* =========================
   CART SYSTEM
========================= */

function saveCart(){
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

function updateCartCount(){
  const total = cart.reduce((s,i)=>s+i.qty,0);

  const el = document.getElementById("floatingCartCount");
  if(el) el.innerText = total;
}

/* =========================
   WISHLIST
========================= */

function saveWishlist(){
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
}

window.toggleWishlist = function(id){

  if(wishlist.includes(id)){
    wishlist = wishlist.filter(i=>i!==id);
    showToast("Removed ❤️");
  }else{
    wishlist.push(id);
    showToast("Added ❤️");
  }

  saveWishlist();
  renderProducts(allProducts);
};

/* =========================
   CART ACTIONS
========================= */

window.addToCart = function(id,name,price,image){

  const ex = cart.find(i=>i.id===id);

  if(ex) ex.qty++;
  else cart.push({id,name,price:Number(price),image,qty:1});

  saveCart();
  showToast("Added 🛒");
};

window.removeItem = function(index){
  cart.splice(index,1);
  saveCart();
};

window.increaseQty = function(i){
  cart[i].qty++;
  saveCart();
};

window.decreaseQty = function(i){
  cart[i].qty--;
  if(cart[i].qty<=0) cart.splice(i,1);
  saveCart();
};

window.clearCart = function(){
  cart = [];
  saveCart();
};

/* =========================
   CART DRAWER (FIX SAFE)
========================= */

window.toggleCart = function(){
  document.getElementById("cartDrawer").classList.toggle("open");
  renderCart();
};

function renderCart(){

  const box = document.getElementById("cartItems");
  const totalBox = document.getElementById("cartTotal");

  if(!box || !totalBox) return;

  box.innerHTML = "";

  if(cart.length === 0){
    box.innerHTML = `<p class="empty">Cart empty</p>`;
    totalBox.innerText = "Total: Rs 0";
    return;
  }

  let total = 0;

  cart.forEach((i,index)=>{
    total += i.price*i.qty;

    box.innerHTML += `
      <div class="cart-item">
        <img src="${i.image}">
        <div>
          <h4>${i.name}</h4>
          <p>Rs ${i.price}</p>

          <div class="qty-box">
            <button onclick="decreaseQty(${index})">-</button>
            <span>${i.qty}</span>
            <button onclick="increaseQty(${index})">+</button>
          </div>
        </div>

        <button class="remove-btn" onclick="removeItem(${index})">✕</button>
      </div>
    `;
  });

  totalBox.innerText = "Total: Rs " + total;
}

/* =========================
   RATING SYSTEM (FIXED)
========================= */

window.setRating = async function(productId,rating){

  try{
    await addDoc(collection(db,"ratings"),{
      productId,
      rating,
      createdAt:Date.now()
    });

    showToast("Thanks for rating ⭐");
  }catch(err){
    showToast("Rating failed");
  }
};

/* =========================
   STARS UI
========================= */

function renderStars(id){
  let html = "";
  for(let i=1;i<=5;i++){
    html += `<span class="star" onclick="setRating('${id}',${i})">⭐</span>`;
  }
  return html;
}

/* =========================
   FILTER SYSTEM
========================= */

function applyFilters(products){

  const price = document.getElementById("priceFilter")?.value || "all";
  const discount = document.getElementById("discountFilter")?.value || "all";
  const category = document.getElementById("categoryFilter")?.value || "all";

  return products.filter(p=>{

    const okCat = category==="all" || p.category===category;
    const okPrice = price==="all" || Number(p.price)<=Number(price);
    const okDis = discount==="all" || (p.discount||0)>=Number(discount);

    return okCat && okPrice && okDis;
  });
}

/* =========================
   PRODUCTS RENDER
========================= */

function renderProducts(products){

  productsDiv.innerHTML = "";

  const search = document.getElementById("searchInput")?.value.toLowerCase() || "";

  let filtered = products.filter(p =>
    p.name.toLowerCase().includes(search)
  );

  filtered = applyFilters(filtered);

  if(filtered.length===0){
    productsDiv.innerHTML = `<p class="empty">No products</p>`;
    return;
  }

  filtered.forEach(p=>{

    const discount = p.discount || 0;

    const newPrice = discount
      ? Math.round(p.price - (p.price*discount/100))
      : p.price;

    const heart = wishlist.includes(p.id) ? "❤️" : "🤍";

    productsDiv.innerHTML += `
      <div class="card fade-in">

        ${discount ? `<div class="discount-badge">${discount}% OFF</div>` : ""}

        <button class="wishlist-btn"
          onclick="toggleWishlist('${p.id}')">
          ${heart}
        </button>

        <img src="${p.image}">

        <div class="card-content">

          <h3>${p.name}</h3>

          <div class="price-box">
            ${discount ? `<span class="old-price">Rs ${p.price}</span>` : ""}
            <span class="new-price">Rs ${newPrice}</span>
          </div>

          <div class="rating">
            ${renderStars(p.id)}
          </div>

          <div class="stock">${p.stock || "In Stock"}</div>

          <div class="card-buttons">

            <button class="view-btn"
              onclick="openModal('${p.id}','${p.name}','${newPrice}','${p.image}')">
              View
            </button>

            <button class="add-cart-btn"
              onclick="addToCart('${p.id}','${p.name}','${newPrice}','${p.image}')">
              Add
            </button>

          </div>

        </div>
      </div>
    `;
  });
}

/* =========================
   LOAD FIREBASE
========================= */

onSnapshot(collection(db,"products"),(snap)=>{

  allProducts = [];

  snap.forEach(d=>{
    allProducts.push({id:d.id,...d.data()});
  });

  renderProducts(allProducts);
  updateCartCount();
});

/* =========================
   INIT
========================= */

window.addEventListener("load",()=>{
  updateCartCount();
  renderCart();
});
