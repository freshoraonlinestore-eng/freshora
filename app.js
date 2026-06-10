import { db, collection, onSnapshot } from "./firebase.js";

const productsDiv = document.getElementById("products");
const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let reviews = JSON.parse(localStorage.getItem("reviews")) || {};
let allProducts = [];

function safe(n){return isNaN(Number(n))?0:Number(n);}

/* CART */
window.addToCart = (id,name,price,image)=>{
  let item = cart.find(i=>i.id===id);
  if(item) item.qty++;
  else cart.push({id,name,price:safe(price),image,qty:1});
  saveCart();
};

function saveCart(){
  localStorage.setItem("cart",JSON.stringify(cart));
  renderCart();
}

/* WISHLIST */
window.toggleWishlist=(id)=>{
  wishlist = wishlist.includes(id)
    ? wishlist.filter(w=>w!==id)
    : [...wishlist,id];

  localStorage.setItem("wishlist",JSON.stringify(wishlist));
  renderProducts(allProducts);
};

/* CART DRAWER */
window.toggleCart=()=>{
  cartDrawer.classList.toggle("open");
  overlay.classList.toggle("show");
};

/* FILTER FIX */
function filter(){
  let f=[...allProducts];

  const s=searchInput.value.toLowerCase();
  if(s) f=f.filter(p=>p.name.toLowerCase().includes(s));

  const c=categoryFilter.value;
  if(c!=="all") f=f.filter(p=>p.category===c);

  const pr=priceFilter.value;
  if(pr!=="all") f=f.filter(p=>safe(p.price)<=safe(pr));

  const d=discountFilter.value;
  if(d!=="all") f=f.filter(p=>safe(p.discount)>=safe(d));

  renderProducts(f);
}

/* PRODUCTS */
function renderProducts(list){
  productsDiv.innerHTML="";

  list.forEach(p=>{
    const price=safe(p.price);
    const disc=safe(p.discount);
    const final=disc?price-price*disc/100:price;

    productsDiv.innerHTML+=`
      <div class="card">
        <img src="${p.image}">
        <h3>${p.name}</h3>

        <button onclick="addToCart('${p.id}','${p.name}',${final},'${p.image}')">
          Add
        </button>
      </div>
    `;
  });
}

/* FIREBASE */
onSnapshot(collection(db,"products"),snap=>{
  allProducts=snap.docs.map(d=>({id:d.id,...d.data()}));
  renderProducts(allProducts);
});

/* FILTER EVENTS */
searchInput.oninput=filter;
categoryFilter.onchange=filter;
priceFilter.onchange=filter;
discountFilter.onchange=filter;
