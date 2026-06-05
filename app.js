import { db, collection, onSnapshot, addDoc } from "./firebase.js";

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let allProducts = [];

const productsDiv = document.getElementById("products");

/* CART SAVE */
function saveCart(){
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

/* COUNT */
function updateCartCount(){
  const count = document.getElementById("floatingCartCount");
  if(count) count.innerText = cart.reduce((a,b)=>a+b.qty,0);
}

/* ADD CART */
window.addToCart = function(id,name,price,image){

  let item = cart.find(i=>i.id===id);

  if(item) item.qty++;
  else cart.push({id,name,price:Number(price),image,qty:1});

  saveCart();
};

/* CART TOGGLE */
window.toggleCart = function(){
  document.getElementById("cartDrawer").classList.toggle("open");
  document.getElementById("overlay").classList.toggle("show");
  renderCart();
};

/* RENDER CART */
function renderCart(){

  const box = document.getElementById("cartItems");
  const totalBox = document.getElementById("cartTotal");

  if(!box) return;

  box.innerHTML = "";

  let total = 0;

  cart.forEach((i,index)=>{
    total += i.price * i.qty;

    box.innerHTML += `
      <div class="cart-item">
        <img src="${i.image}">
        <div>
          <h4>${i.name}</h4>
          <p>Rs ${i.price}</p>
          <div>
            <button onclick="decreaseQty(${index})">-</button>
            ${i.qty}
            <button onclick="increaseQty(${index})">+</button>
          </div>
        </div>
      </div>
    `;
  });

  totalBox.innerText = "Total: Rs " + total;
}

/* QTY */
window.increaseQty = i=>{cart[i].qty++;saveCart();}
window.decreaseQty = i=>{
  cart[i].qty--;
  if(cart[i].qty<=0) cart.splice(i,1);
  saveCart();
}

/* CLEAR */
window.clearCart = ()=>{
  cart=[];
  saveCart();
}

/* CHECKOUT */
window.checkout = async function(){

  if(cart.length===0) return alert("Empty");

  const name = cusName.value;
  const phone = cusPhone.value;
  const address = cusAddress.value;

  let total = cart.reduce((a,b)=>a+b.price*b.qty,0);

  await addDoc(collection(db,"orders"),{
    customer:{name,phone,address},
    items:cart,
    total,
    createdAt:Date.now()
  });

  cart=[];
  saveCart();
}

/* PRODUCTS */
onSnapshot(collection(db,"products"),snap=>{

  allProducts=[];

  snap.forEach(d=>{
    allProducts.push({id:d.id,...d.data()});
  });

  renderProducts(allProducts);
});

/* RENDER */
function renderProducts(list){

  productsDiv.innerHTML="";

  list.forEach(p=>{

    productsDiv.innerHTML += `
      <div class="card">

        <img src="${p.image}">

        <div class="card-content">

          <h3>${p.name}</h3>

          <p>Rs ${p.price}</p>

          <button onclick="addToCart('${p.id}','${p.name}','${p.price}','${p.image}')">
            Add
          </button>

        </div>

      </div>
    `;
  });
}

/* DARK */
window.toggleDarkMode = ()=>{
  document.body.classList.toggle("dark");
}

/* INIT */
window.addEventListener("load",()=>{
  document.getElementById("loadingScreen").classList.add("hide");
  updateCartCount();
});
