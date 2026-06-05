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

/* SAFE */
function escapeHTML(str=""){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

/* TOAST */
function showToast(text){
  const t = document.createElement("div");
  t.className = "toast";
  t.innerText = text;
  document.body.appendChild(t);
  setTimeout(()=>t.classList.add("show"),100);
  setTimeout(()=>t.remove(),2000);
}

/* CART */
function saveCart(){
  localStorage.setItem("cart",JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

function updateCartCount(){
  const el = document.getElementById("floatingCartCount");
  if(el) el.innerText = cart.reduce((s,i)=>s+i.qty,0);
}

window.addToCart = function(id,name,price,image){

  const item = cart.find(i=>i.id===id);

  if(item) item.qty++;
  else cart.push({id,name,price:Number(price)||0,image,qty:1});

  saveCart();
  showToast("Added 🛒");
};

window.toggleCart = function(){
  document.getElementById("cartDrawer")?.classList.toggle("open");
  document.getElementById("overlay")?.classList.toggle("show");
  renderCart();
};

/* CART RENDER SAFE */
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
          <button onclick="increase(${idx})">+</button>
          <button onclick="decrease(${idx})">-</button>
        </div>
      </div>
    `;
  });

  totalBox.innerText = "Total: Rs " + total;
}

window.increase = i=>{
  cart[i].qty++;
  saveCart();
};

window.decrease = i=>{
  cart[i].qty--;
  if(cart[i].qty<=0) cart.splice(i,1);
  saveCart();
};

/* PRODUCTS SAFE LOAD (MAIN FIX) */
onSnapshot(collection(db,"products"),(snap)=>{

  try{
    allProducts = snap.docs.map(d=>({
      id:d.id,
      ...d.data()
    }));

    if(!productsDiv){
      console.log("products div missing");
      return;
    }

    productsDiv.innerHTML = "";

    allProducts.forEach(p=>{
      productsDiv.innerHTML += `
        <div class="card">

          <img src="${p.image}">

          <h3>${escapeHTML(p.name)}</h3>
          <p>Rs ${p.price}</p>

          <button onclick="addToCart('${p.id}','${escapeHTML(p.name)}','${p.price}','${p.image}')">
            Add
          </button>

        </div>
      `;
    });

    updateCartCount();

  } catch(e){
    console.log("ERROR:",e);
    showToast("Load failed");
  }

},(err)=>{
  console.log("Firestore error:",err);
  showToast("Firebase blocked / rules issue");
});

/* INIT SAFE */
window.addEventListener("load",()=>{
  updateCartCount();
  renderCart();
});
