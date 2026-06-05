import {
  db,
  collection,
  onSnapshot,
  addDoc
} from "./firebase.js";

/* ========================= */

const productsDiv = document.getElementById("products");

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let allProducts = [];

/* =========================
   DARK MODE ICON FIX
========================= */

function updateDarkIcon(){
  const btn = document.getElementById("darkModeBtn");
  if(!btn) return;

  if(document.body.classList.contains("dark")){
    btn.innerText = "☀️";
  } else {
    btn.innerText = "🌙";
  }
}

/* =========================
   TOAST
========================= */

function showToast(text){
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = text;
  document.body.appendChild(toast);

  setTimeout(()=> toast.classList.add("show"),100);
  setTimeout(()=>{
    toast.classList.remove("show");
    setTimeout(()=>toast.remove(),300);
  },2000);
}

/* =========================
   CART SAVE
========================= */

function saveCart(){
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

/* ========================= */

function updateCartCount(){
  const total = cart.reduce((s,i)=>s+i.qty,0);
  const count = document.getElementById("floatingCartCount");
  if(count) count.innerText = total;
}

/* =========================
   WISHLIST
========================= */

window.toggleWishlist = function(id){

  if(wishlist.includes(id)){
    wishlist = wishlist.filter(i=>i!==id);
    showToast("Removed ❤️");
  } else {
    wishlist.push(id);
    showToast("Added ❤️");
  }

  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  renderProducts(allProducts);
};

/* ========================= */

window.addToCart = function(id,name,price,image){

  const item = cart.find(i=>i.id===id);

  if(item) item.qty++;
  else cart.push({id,name,price:Number(price),image,qty:1});

  saveCart();
  showToast("Added to cart 🛒");
};

/* ========================= */

window.toggleCart = function(){

  document.getElementById("cartDrawer")?.classList.toggle("open");
  document.getElementById("overlay")?.classList.toggle("show");

  renderCart();
};

/* ========================= */

function renderCart(){

  const box = document.getElementById("cartItems");
  const totalBox = document.getElementById("cartTotal");

  if(!box || !totalBox) return;

  box.innerHTML = "";

  let total = 0;

  cart.forEach((item,i)=>{

    total += item.price * item.qty;

    box.innerHTML += `
      <div class="cart-item">
        <img src="${item.image}">
        <div class="cart-details">
          <h4>${item.name}</h4>
          <p>Rs ${item.price}</p>

          <div class="qty-box">
            <button onclick="decreaseQty(${i})">-</button>
            <span>${item.qty}</span>
            <button onclick="increaseQty(${i})">+</button>
          </div>
        </div>

        <button class="remove-btn" onclick="removeItem(${i})">✕</button>
      </div>
    `;
  });

  totalBox.innerText = "Total: Rs " + total;
}

/* ========================= */

window.removeItem = i => { cart.splice(i,1); saveCart(); };
window.increaseQty = i => { cart[i].qty++; saveCart(); };
window.decreaseQty = i => { cart[i].qty--; if(cart[i].qty<=0) cart.splice(i,1); saveCart(); };
window.clearCart = () => { cart=[]; saveCart(); showToast("Cleared"); };

/* ========================= */

window.checkout = async function(){

  if(cart.length===0) return showToast("Cart Empty");

  const name = cusName.value;
  const phone = cusPhone.value;
  const address = cusAddress.value;

  if(!name||!phone||!address) return showToast("Fill all fields");

  let total = cart.reduce((s,i)=>s+i.price*i.qty,0);

  await addDoc(collection(db,"orders"),{
    customer:{name,phone,address},
    items:cart,
    total,
    createdAt:Date.now()
  });

  cart=[];
  saveCart();

  showToast("Order Sent ✅");
};

/* ========================= */

function renderProducts(products){

  productsDiv.innerHTML="";

  products.forEach(p=>{

    productsDiv.innerHTML += `
      <div class="card">

        <img src="${p.image}">
        <div class="card-content">

          <h3>${p.name}</h3>
          <span>Rs ${p.price}</span>

          <button onclick="addToCart('${p.id}','${p.name}','${p.price}','${p.image}')">
            Add
          </button>

        </div>

      </div>
    `;
  });
}

/* ========================= */

window.toggleDarkMode = function(){
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));

  updateDarkIcon();
};

if(localStorage.getItem("darkMode")==="true"){
  document.body.classList.add("dark");
}

window.addEventListener("load",updateDarkIcon);

/* ========================= */

onSnapshot(collection(db,"products"),snap=>{
  allProducts=[];
  snap.forEach(d=>allProducts.push({id:d.id,...d.data()}));
  renderProducts(allProducts);
});
