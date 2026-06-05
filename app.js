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
   SAFE TEXT (XSS FIX)
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

/* =========================
   CART COUNT
========================= */

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
   CHECKOUT (SAFE)
========================= */

window.checkout = async function(){

  if(cart.length===0){
    showToast("Cart Empty");
    return;
  }

  const name = document.getElementById("cusName")?.value.trim();
  const phone = document.getElementById("cusPhone")?.value.trim();
  const address = document.getElementById("cusAddress")?.value.trim();

  if(!name || !phone || !address){
    showToast("Fill all fields");
    return;
  }

  const total = cart.reduce((s,i)=>s+(i.price*i.qty),0);

  try{

    await addDoc(collection(db,"orders"),{
      customer:{name,phone,address},
      items:cart,
      total,
      createdAt:Date.now()
    });

    let msg = `🛒 Freshora Order:%0A%0A`;
    msg += `👤 Name: ${name}%0A`;
    msg += `📞 Phone: ${phone}%0A`;
    msg += `📍 Address: ${address}%0A%0A`;

    cart.forEach(i=>{
      msg += `${i.name} x${i.qty}%0A`;
    });

    msg += `%0ATotal: Rs ${total}`;

    window.open(
      "https://wa.me/94752425790?text="+msg,
      "_blank"
    );

    cart = [];
    saveCart();

    document.getElementById("cartDrawer")?.classList.remove("open");
    document.getElementById("overlay")?.classList.remove("show");

    showToast("Order Sent ✅");

  } catch(err){
    console.log(err);
    showToast("Checkout Failed");
  }
};

/* =========================
   MODAL (FIXED SAFE)
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

/* SAFE EVENT (FIXED - no override) */
document.addEventListener("click",(e)=>{
  const modal = document.getElementById("productModal");

  if(e.target === modal){
    closeModal();
  }
});

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
   FILTER EVENTS
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
   LOADING
========================= */

window.addEventListener("load",()=>{
  const loading = document.getElementById("loadingScreen");

  if(loading){
    loading.classList.add("hide");
    setTimeout(()=>loading.remove(),400);
  }

  updateCartCount();
  renderCart();
});

/* =========================
   FIREBASE PRODUCTS
========================= */

onSnapshot(collection(db,"products"),(snap)=>{

  allProducts = snap.docs.map(d=>({
    id:d.id,
    ...d.data()
  }));

  renderProducts(allProducts);
  updateCartCount();
});
