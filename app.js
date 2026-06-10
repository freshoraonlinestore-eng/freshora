import {
  db,
  collection,
  onSnapshot,
} from "./firebase.js";

/* =========================
   ELEMENTS
========================= */

const productsDiv = document.getElementById("products");
const loadingScreen = document.getElementById("loadingScreen");
const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");
const cartBtn = document.querySelector(".floating-cart");
const searchInput = document.getElementById("searchInput");

/* =========================
   STATE
========================= */

let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* =========================
   INIT
========================= */

window.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  renderCartCount();
  setupEvents();

  setTimeout(() => {
    if (loadingScreen) loadingScreen.style.display = "none";
  }, 800);
});

/* =========================
   FIREBASE
========================= */

function loadProducts() {
  const ref = collection(db, "products");

  onSnapshot(ref, (snapshot) => {
    products = [];
    snapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });

    renderProducts(products);
  });
}

/* =========================
   PRODUCTS (SAFE EVENT SYSTEM)
========================= */

function renderProducts(list) {
  productsDiv.innerHTML = "";

  list.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${p.image || 'https://via.placeholder.com/300'}">
      <h3>${p.name || "No Name"}</h3>
      <p>Rs. ${Number(p.price || 0)}</p>
      <button class="add-btn" data-id="${p.id}">Add to Cart</button>
    `;

    productsDiv.appendChild(card);
  });
}

/* EVENT DELEGATION (IMPORTANT FIX) */
productsDiv.addEventListener("click", (e) => {
  if (e.target.classList.contains("add-btn")) {
    addToCart(e.target.dataset.id);
  }
});

/* =========================
   CART LOGIC
========================= */

function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  const existing = cart.find(i => i.id === id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      ...product,
      qty: 1,
      price: Number(product.price || 0)
    });
  }

  saveCart();
  renderCart();
  renderCartCount();

  toast("Added to cart 🛒");
}

function increaseQty(id){
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty++;
  saveCart(); renderCart(); renderCartCount();
}

function decreaseQty(id){
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty--;
  if(item.qty<=0) cart = cart.filter(i=>i.id!==id);
  saveCart(); renderCart(); renderCartCount();
}

function removeFromCart(id){
  cart = cart.filter(i=>i.id!==id);
  saveCart(); renderCart(); renderCartCount();
}

function saveCart(){
  localStorage.setItem("cart", JSON.stringify(cart));
}

/* =========================
   CART UI
========================= */

function openCart(){
  cartDrawer.classList.add("open");
  overlay.classList.add("active");
  renderCart();
}

function closeCart(){
  cartDrawer.classList.remove("open");
  overlay.classList.remove("active");
}

function toggleCart(){
  cartDrawer.classList.contains("open") ? closeCart() : openCart();
}
window.toggleCart = toggleCart;

/* =========================
   CART RENDER
========================= */

function renderCart(){
  let total = 0;

  cartDrawer.innerHTML = `
    <h2>🛒 Your Cart</h2>
    <div id="cartItems"></div>
    <hr>
    <h3 class="cart-total"></h3>
    <button id="checkoutBtn" class="add-btn">Checkout WhatsApp</button>
  `;

  const container = document.getElementById("cartItems");

  if(cart.length===0){
    container.innerHTML = "<p style='padding:10px'>Cart is empty 😢</p>";
  }

  cart.forEach(item=>{
    const itemTotal = item.price * item.qty;
    total += itemTotal;

    const div = document.createElement("div");
    div.style.display="flex";
    div.style.justifyContent="space-between";
    div.style.alignItems="center";
    div.style.padding="10px 0";

    div.innerHTML=`
      <div>
        <strong>${item.name}</strong><br>
        <small>Rs.${item.price} x ${item.qty}</small>
      </div>
      <div>
        <button data-id="${item.id}" class="dec">-</button>
        <button data-id="${item.id}" class="inc">+</button>
        <button data-id="${item.id}" class="remove">X</button>
      </div>
    `;

    container.appendChild(div);
  });

  cartDrawer.querySelector(".cart-total").innerText = "Total: Rs. " + total;

  cartDrawer.querySelectorAll(".inc").forEach(b=>b.onclick=()=>increaseQty(b.dataset.id));
  cartDrawer.querySelectorAll(".dec").forEach(b=>b.onclick=()=>decreaseQty(b.dataset.id));
  cartDrawer.querySelectorAll(".remove").forEach(b=>b.onclick=()=>removeFromCart(b.dataset.id));

  document.getElementById("checkoutBtn").onclick = checkout;
}

/* =========================
   CHECKOUT
========================= */

function checkout(){
  if(cart.length===0){
    toast("Cart is empty!");
    return;
  }

  let msg="🛒 Order%0A";
  let total=0;

  cart.forEach(i=>{
    total+=i.price*i.qty;
    msg+=`${i.name} x${i.qty}%0A`;
  });

  msg+=`Total: Rs.${total}`;

  window.open(`https://wa.me/94752425790?text=${msg}`,"_blank");
  toast("Opening WhatsApp...");
}

/* =========================
   EVENTS
========================= */

function setupEvents(){
  cartBtn?.addEventListener("click",toggleCart);
  overlay?.addEventListener("click",closeCart);

  let t;
  searchInput?.addEventListener("input",(e)=>{
    clearTimeout(t);
    t=setTimeout(()=>{
      const v=e.target.value.toLowerCase();
      const f=products.filter(p=>(p.name||"").toLowerCase().includes(v));
      renderProducts(f);
    },300);
  });
}

/* =========================
   COUNT
========================= */

function renderCartCount(){
  const c=cart.reduce((s,i)=>s+i.qty,0);
  document.getElementById("floatingCartCount").innerText=c;
}

/* =========================
   TOAST
========================= */

function toast(msg){
  const t=document.createElement("div");
  t.innerText=msg;
  t.style.cssText=`
    position:fixed;
    bottom:90px;
    left:50%;
    transform:translateX(-50%);
    background:#111;
    color:#fff;
    padding:10px 14px;
    border-radius:10px;
    z-index:9999;
  `;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),1200);
}

/* GLOBAL */
window.openCart=openCart;
window.closeCart=closeCart;
