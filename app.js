import {
  db,
  collection,
  onSnapshot,
  addDoc
} from "./firebase.js";

const productsDiv = document.getElementById("products");

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let allProducts = [];

/* =========================
   SAFE TEXT
========================= */
function escapeHTML(str=""){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

/* =========================
   TOAST
========================= */
function showToast(text){
  const t = document.createElement("div");
  t.className = "toast";
  t.innerText = text;
  document.body.appendChild(t);

  setTimeout(()=>t.classList.add("show"),100);
  setTimeout(()=>t.remove(),2000);
}

/* =========================
   CART SAVE
========================= */
function saveCart(){
  localStorage.setItem("cart",JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

/* =========================
   CART COUNT
========================= */
function updateCartCount(){
  const el = document.getElementById("floatingCartCount");
  if(el){
    el.innerText = cart.reduce((s,i)=>s+i.qty,0);
  }
}

/* =========================
   ADD TO CART
========================= */
window.addToCart = function(id,name,price,image){

  const item = cart.find(i=>i.id===id);

  if(item){
    item.qty++;
  } else {
    cart.push({
      id,
      name: escapeHTML(name),
      price: Number(price)||0,
      image,
      qty:1
    });
  }

  saveCart();
  showToast("Added 🛒");
};

/* =========================
   CART ACTIONS
========================= */
window.removeItem = i=>{
  cart.splice(i,1);
  saveCart();
};

window.increase = i=>{
  cart[i].qty++;
  saveCart();
};

window.decrease = i=>{
  cart[i].qty--;
  if(cart[i].qty<=0) cart.splice(i,1);
  saveCart();
};

window.clearCart = ()=>{
  cart = [];
  saveCart();
  showToast("Cart cleared");
};

/* =========================
   CART DRAWER
========================= */
window.toggleCart = function(){
  document.getElementById("cartDrawer")?.classList.toggle("open");
  document.getElementById("overlay")?.classList.toggle("show");
  renderCart();
};

/* =========================
   RENDER CART
========================= */
function renderCart(){

  const box = document.getElementById("cartItems");
  const totalBox = document.getElementById("cartTotal");
  if(!box || !totalBox) return;

  box.innerHTML = "";

  if(cart.length===0){
    box.innerHTML = "<p class='empty'>Cart empty</p>";
    totalBox.innerText = "Total: Rs 0";
    return;
  }

  let total = 0;

  cart.forEach((i,idx)=>{
    total += i.price*i.qty;

    box.innerHTML += `
      <div class="cart-item">
        <img src="${i.image}">
        <div>
          <h4>${escapeHTML(i.name)}</h4>
          <p>Rs ${i.price}</p>

          <div class="qty-box">
            <button onclick="decrease(${idx})">-</button>
            <span>${i.qty}</span>
            <button onclick="increase(${idx})">+</button>
          </div>
        </div>

        <button class="remove-btn" onclick="removeItem(${idx})">✕</button>
      </div>
    `;
  });

  totalBox.innerText = "Total: Rs " + total.toLocaleString();
}

/* =========================
   PRODUCTS LOAD (SAFE)
========================= */
onSnapshot(collection(db,"products"),(snap)=>{

  allProducts = snap.docs.map(d=>({
    id:d.id,
    ...d.data()
  }));

  renderProducts(allProducts);
  updateCartCount();

},(err)=>{
  console.log(err);
  showToast("Firebase error");
});

/* =========================
   RENDER PRODUCTS
========================= */
function renderProducts(products){

  if(!productsDiv) return;

  productsDiv.innerHTML = "";

  products.forEach(p=>{

    productsDiv.innerHTML += `
      <div class="card">

        <img src="${p.image}">

        <div class="card-content">
          <h3>${escapeHTML(p.name)}</h3>

          <div class="price-box">
            <span class="new-price">Rs ${p.price}</span>
          </div>

          <div class="card-buttons">

            <button onclick="openModal('${p.id}','${escapeHTML(p.name)}','${p.price}','${p.image}')">
              View
            </button>

            <button onclick="addToCart('${p.id}','${escapeHTML(p.name)}','${p.price}','${p.image}')">
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
window.openModal = function(id,name,price,image){

  const m = document.getElementById("productModal");
  if(!m) return;

  m.style.display="block";

  document.getElementById("modalImage").src=image;
  document.getElementById("modalName").innerText=name;
  document.getElementById("modalPrice").innerText="Rs "+price;

  document.getElementById("modalAddBtn").onclick=()=>{
    addToCart(id,name,price,image);
  };
};

window.closeModal=function(){
  document.getElementById("productModal").style.display="none";
};

/* =========================
   DARK MODE
========================= */
window.toggleDarkMode=function(){
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode",document.body.classList.contains("dark"));
};

if(localStorage.getItem("darkMode")==="true"){
  document.body.classList.add("dark");
}

/* =========================
   INIT
========================= */
window.addEventListener("load",()=>{
  updateCartCount();
  renderCart();
});
