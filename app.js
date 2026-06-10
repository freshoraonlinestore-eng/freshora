import { db, collection, onSnapshot } from './firebase.js';

const productsDiv=document.getElementById('products');
const loadingScreen=document.getElementById('loadingScreen');
const cartDrawer=document.getElementById('cartDrawer');
const overlay=document.getElementById('overlay');

const searchInput=document.getElementById('searchInput');
const categoryFilter=document.getElementById('categoryFilter');
const priceFilter=document.getElementById('priceFilter');
const discountFilter=document.getElementById('discountFilter');

let cart=JSON.parse(localStorage.getItem('cart'))||[];
let wishlist=JSON.parse(localStorage.getItem('wishlist'))||[];
let reviews=JSON.parse(localStorage.getItem('reviews'))||{};
let allProducts=[];

const safe=n=>isNaN(Number(n))?0:Number(n);

function toast(msg){
const t=document.getElementById('toast');
t.innerText=msg;
t.classList.add('show');
setTimeout(()=>t.classList.remove('show'),2000);
}

function saveCart(){
localStorage.setItem('cart',JSON.stringify(cart));
updateCartCount();
renderCart();
}

function saveWishlist(){
localStorage.setItem('wishlist',JSON.stringify(wishlist));
}

window.toggleDarkMode=()=>{
document.body.classList.toggle('dark');
localStorage.setItem('darkMode',document.body.classList.contains('dark'));
};

function updateCartCount(){
document.getElementById('floatingCartCount').innerText=
cart.reduce((s,i)=>s+i.qty,0);
}

window.toggleWishlist=id=>{
wishlist=wishlist.includes(id)?wishlist.filter(w=>w!==id):[...wishlist,id];
saveWishlist();
renderProducts(allProducts);
toast('Wishlist updated');
};

window.addToCart=(id,name,price,image)=>{
const item=cart.find(i=>i.id===id);
if(item)item.qty++;
else cart.push({id,name,price:safe(price),image,qty:1});
saveCart();
toast('Added to cart');
};

window.removeItem=i=>{
cart.splice(i,1);
saveCart();
};

window.increaseQty=i=>{
cart[i].qty++;
saveCart();
};

window.decreaseQty=i=>{
cart[i].qty--;
if(cart[i].qty<=0)cart.splice(i,1);
saveCart();
};

window.clearCart=()=>{
cart=[];
saveCart();
toast('Cart cleared');
};

window.toggleCart=()=>{
cartDrawer.classList.toggle('open');
overlay.classList.toggle('show');
};

function renderCart(){
const box=document.getElementById('cartItems');
const totalEl=document.getElementById('cartTotal');

if(!cart.length){
box.innerHTML='<p class="empty">Cart empty</p>';
totalEl.innerText='Total: Rs 0';
return;
}

let total=0;
box.innerHTML='';

cart.forEach((c,i)=>{
total+=c.price*c.qty;
box.innerHTML+=`
<div class="cart-item">
<img src="${c.image || 'placeholder.png'}"/>
<div>
<h4>${c.name}</h4>
<p>Rs ${c.price}</p>
<div class="qty-box">
<button onclick="decreaseQty(${i})">-</button>
<span>${c.qty}</span>
<button onclick="increaseQty(${i})">+</button>
</div>
</div>
<button class="remove-btn" onclick="removeItem(${i})">✕</button>
</div>`;
});

totalEl.innerText='Total: Rs '+total.toLocaleString();
}

function avgRating(id){
const r=reviews[id]||[];
if(!r.length)return 5;
return (r.reduce((a,b)=>a+b.rating,0)/r.length).toFixed(1);
}

function renderReviews(id){
const box=document.getElementById('reviewList');
const list=reviews[id]||[];

if(!list.length){
box.innerHTML='<p>No reviews yet</p>';
return;
}

box.innerHTML='';

list.reverse().forEach(r=>{
box.innerHTML+=`
<div class="review-item">
<div>${'⭐'.repeat(r.rating)}</div>
<p>${r.text}</p>
</div>`;
});
}

window.submitReview=id=>{
const text=document.getElementById('reviewText').value.trim();
const rating=Number(document.getElementById('reviewRating').value);

if(!text)return;

if(!reviews[id])reviews[id]=[];
reviews[id].push({text,rating});

localStorage.setItem('reviews',JSON.stringify(reviews));

renderReviews(id);
renderProducts(allProducts);
toast('Review added');
};

window.openModalById=id=>{
const p=allProducts.find(x=>x.id===id);
if(!p)return;

const final=safe(p.discount)>0
?Math.round(p.price-(p.price*p.discount)/100)
:p.price;

document.getElementById('modalImage').src=p.image;
document.getElementById('modalName').innerText=p.name;
document.getElementById('modalPrice').innerText='Rs '+final;
document.getElementById('modalRatingText').innerText=avgRating(p.id);

document.getElementById('modalAddBtn').onclick=
()=>addToCart(p.id,p.name,final,p.image);

document.getElementById('reviewSubmitBtn').onclick=
()=>submitReview(p.id);

renderReviews(p.id);

document.getElementById('productModal').classList.add('show');
};

window.closeModal=()=>{
document.getElementById('productModal').classList.remove('show');
};

function renderProducts(list){
productsDiv.innerHTML='';

list.forEach(p=>{
const price=safe(p.price);
const disc=safe(p.discount);
const final=disc?Math.round(price-(price*disc)/100):price;

productsDiv.innerHTML+=`
<div class="card">

${disc?`<div class="discount-badge">-${disc}%</div>`:''}

<button class="wishlist-btn" onclick="toggleWishlist('${p.id}')">
<i class="${wishlist.includes(p.id)?'fa-solid':'fa-regular'} fa-heart"></i>
</button>

<img src="${p.image || 'placeholder.png'}"/>

<div class="card-content">
<h3>${p.name}</h3>

<div class="rating-preview">
⭐ ${avgRating(p.id)}
</div>

<div class="price-box">
${disc?`<span class="old-price">Rs ${price}</span>`:''}
<span class="new-price">Rs ${final}</span>
</div>

<div class="card-buttons">

<button class="view-btn"
onclick="openModalById('${p.id}')">
View
</button>

<button class="add-cart-btn"
onclick="addToCart('${p.id}','${p.name}',${final},'${p.image}')">
Add
</button>

</div>
</div>
</div>`;
});
}

function filterProducts(){
let f=[...allProducts];

const s=searchInput.value.toLowerCase();
if(s)f=f.filter(p=>p.name.toLowerCase().includes(s));

const c=categoryFilter.value;
if(c!=='all')f=f.filter(p=>p.category===c);

const pr=priceFilter.value;
if(pr!=='all')f=f.filter(p=>safe(p.price)<=safe(pr));

const d=discountFilter.value;
if(d!=='all')f=f.filter(p=>safe(p.discount)>=safe(d));

renderProducts(f);
}

searchInput.oninput=filterProducts;
categoryFilter.onchange=filterProducts;
priceFilter.onchange=filterProducts;
discountFilter.onchange=filterProducts;

window.checkout=()=>{
if(!cart.length)return;

let total=0;

let msg='🛒 Freshora Order\\n\\n';

cart.forEach(i=>{
total+=i.price*i.qty;
msg+=`${i.name} x${i.qty} - Rs ${i.price}\\n`;
});

msg+=`\\nTotal: Rs ${total}`;

window.open(`https://wa.me/94752425790?text=${encodeURIComponent(msg)}`);
};

onSnapshot(collection(db,'products'),snap=>{
allProducts=snap.docs.map(d=>({id:d.id,...d.data()}));
renderProducts(allProducts);

loadingScreen.style.display='none';
});

window.addEventListener('DOMContentLoaded',()=>{
if(localStorage.getItem('darkMode')==='true'){
document.body.classList.add('dark');
}
updateCartCount();
renderCart();
});
