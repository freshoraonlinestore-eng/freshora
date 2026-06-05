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

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let allProducts = [];

/* =========================
   SAFE TEXT
========================= */

function escapeHTML(str = ""){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

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
   CART STATE FIX (IMPORTANT)
========================= */

let renderLock = false;

/* =========================
   CART SAVE (FIXED)
========================= */

function saveCart(){

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();

  // FIX: prevent double render conflict
  if(renderLock) return;

  renderLock = true;
  requestAnimationFrame(()=>{
    renderCart();
    renderLock = false;
  });
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
   WISHLIST
========================= */

function saveWishlist(){
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
}

window.toggleWishlist = function(id){

  if(!id) return;

  if(wishlist.includes(id)){
    wishlist = wishlist.filter(i=>i!==id);
    showToast("Removed ❤️");
  } else {
    wishlist.push(id);
    showToast("Added ❤️");
  }

  saveWishlist();
  renderProducts(allProducts);
};

/* =========================
   ADD TO CART
========================= */

window.addToCart = function(id,name,price,image){

  const existing = cart.find(i=>i.id===id);

  if(existing){
    existing.qty++;
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
  showToast("Added to cart 🛒");
};

/* =========================
   CART ACTIONS
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
    if(cart[index].qty<=0) cart.splice(index,1);
    saveCart();
  }
};

window.clearCart = function(){
  cart = [];
  saveCart();
  showToast("Cart Cleared");
};

/* =========================
   CART DRAWER (FIXED SYNC)
========================= */

window.toggleCart = function(){

  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("overlay");

  if(!drawer || !overlay) return;

  drawer.classList.toggle("open");
  overlay.classList.toggle("show");

  // FIX: no duplicate render conflict
  requestAnimationFrame(renderCart);
};

/* =========================
   RENDER CART (STABLE)
========================= */

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

  cart.forEach((item,index)=>{
    total += item.price * item.qty;

    box.insertAdjacentHTML("beforeend",`
      <div class="cart-item">

        <img src="${item.image}" alt="${escapeHTML(item.name)}">

        <div class="cart-details">
          <h4>${escapeHTML(item.name)}</h4>
          <p>Rs ${item.price}</p>

          <div class="qty-box">
            <button onclick="decreaseQty(${index})">-</button>
            <span>${item.qty}</span>
            <button onclick="increaseQty(${index})">+</button>
          </div>
        </div>

        <button class="remove-btn" onclick="removeItem(${index})">✕</button>

      </div>
    `);
  });

  totalBox.innerText = "Total: Rs " + total.toLocaleString();
}

/* =========================
   PRODUCTS RENDER (SAFE)
========================= */

function renderProducts(products){

  if(!productsDiv) return;

  productsDiv.innerHTML = "";

  if(!products || products.length===0){
    productsDiv.innerHTML = `<p class="empty">No products found</p>`;
    return;
  }

  products.forEach(p=>{

    const html = `
      <div class="card">

        <img src="${p.image}" alt="${escapeHTML(p.name)}">

        <div class="card-content">

          <h3>${escapeHTML(p.name)}</h3>

          <div class="price-box">
            <span class="new-price">Rs ${p.price}</span>
          </div>

          <div class="card-buttons">

            <button class="view-btn"
              onclick="openModal('${p.id}','${escapeHTML(p.name)}','${p.price}','${p.image}')">
              View
            </button>

            <button class="add-cart-btn"
              onclick="addToCart('${p.id}','${escapeHTML(p.name)}','${p.price}','${p.image}')">
              Add
            </button>

          </div>

        </div>

      </div>
    `;

    productsDiv.insertAdjacentHTML("beforeend", html);
  });
}

/* =========================
   FIREBASE FIX (DATA LOAD STABLE)
========================= */

onSnapshot(
  collection(db,"products"),
  (snapshot)=>{

    try{

      allProducts = snapshot.docs.map(d=>({
        id:d.id,
        ...d.data()
      }));

      renderProducts(allProducts);
      updateCartCount();

    } catch(err){
      console.log("Firebase Error:",err);
      showToast("Data load error");
    }
  },
  (error)=>{
    console.log("Snapshot Error:",error);
    showToast("Connection failed");
  }
);

/* =========================
   MODAL
========================= */

window.openModal = function(id,name,price,image){

  const modal = document.getElementById("productModal");
  if(!modal) return;

  modal.style.display = "block";

  document.getElementById("modalImage").src = image;
  document.getElementById("modalName").innerText = name;
  document.getElementById("modalPrice").innerText = "Rs " + price;

  document.getElementById("modalAddBtn").onclick = ()=>{
    addToCart(id,name,price,image);
  };
};

window.closeModal = function(){
  document.getElementById("productModal").style.display = "none";
};

/* =========================
   DARK MODE
========================= */

window.toggleDarkMode = function(){
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode",document.body.classList.contains("dark"));
};

if(localStorage.getItem("darkMode")==="true"){
  document.body.classList.add("dark");
}

/* =========================
   EVENTS
========================= */

document.addEventListener("input",(e)=>{
  if(e.target.id==="searchInput"){
    renderProducts(allProducts);
  }
});

["priceFilter","discountFilter","categoryFilter"].forEach(id=>{
  document.getElementById(id)?.addEventListener("change",()=>renderProducts(allProducts));
});

/* =========================
   ESC KEY
========================= */

document.addEventListener("keydown",(e)=>{
  if(e.key==="Escape"){
    document.getElementById("cartDrawer")?.classList.remove("open");
    document.getElementById("overlay")?.classList.remove("show");
    closeModal();
  }
});

/* =========================
   INIT
========================= */

window.addEventListener("load",()=>{
  updateCartCount();
  renderCart();
});
