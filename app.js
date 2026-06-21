import { db, collection, onSnapshot, addDoc, doc, getDoc, updateDoc } from "./firebase.js";

/* ========================= STATE ========================= */
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allProducts = [];
let allReviews = [];
let selectedRating = 0;
let currentProductId = null;
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let recentlyViewed = JSON.parse(localStorage.getItem("recentlyViewed")) || [];
let appliedCoupon = null;
let coupons = [];

/* ========================= UTIL ========================= */
function num(v) { const n=Number(v); return isNaN(n)?0:n; }
function saveCart() { localStorage.setItem("cart", JSON.stringify(cart)); }
function saveWishlist() { localStorage.setItem("wishlist", JSON.stringify(wishlist)); updateWishlistUI(); }
function saveRecentlyViewed() { localStorage.setItem("recentlyViewed", JSON.stringify(recentlyViewed)); }

function showToast(msg) {
  const toast=document.getElementById("toast");
  if(!toast)return;
  toast.innerHTML=`<i class="fa-solid fa-circle-check"></i><span>${msg}</span>`;
  toast.classList.add("show");
  clearTimeout(window.toastTimeout);
  window.toastTimeout=setTimeout(()=>toast.classList.remove("show"),2200);
}

/* ========================= INIT ========================= */
document.addEventListener("DOMContentLoaded",()=>{
  updateCartDisplay();
  updateWishlistUI();
  renderRecentlyViewed();
  document.getElementById("searchInput")?.addEventListener("input", filterProducts);
  document.getElementById("categoryFilter")?.addEventListener("change", filterProducts);
  document.getElementById("priceFilter")?.addEventListener("change", filterProducts);
  document.getElementById("discountFilter")?.addEventListener("change", filterProducts);
  document.querySelectorAll(".filter-chip").forEach(chip=>{
    chip.addEventListener("click",()=>{
      document.querySelectorAll(".filter-chip").forEach(c=>c.classList.remove("active"));
      chip.classList.add("active");
      filterProducts();
    });
  });
  setupStarRating();
  bindReviewButton();
  document.getElementById("modalAddBtn")?.addEventListener("click",()=>{
    if(!currentProductId)return;
    const p=allProducts.find(x=>x.id===currentProductId);
    if(!p)return;
    addToCart(p.id,p.name,getFinalPrice(p),p.image);
  });
  document.getElementById("modalWishlistBtn")?.addEventListener("click",()=>{
    if(!currentProductId)return;
    toggleWishlistItem(currentProductId);
  });
  // Load coupons
  onSnapshot(collection(db,"coupons"), snap=>{
    coupons=snap.docs.map(d=>({id:d.id,...d.data()}));
  });
});

/* ========================= PRICE ========================= */
function getFinalPrice(p) {
  const price=num(p.price), disc=num(p.discount);
  return disc>0?Math.round(price-(price*disc/100)):price;
}

/* ========================= CART ========================= */
window.updateCartDisplay=()=>{
  const items=document.getElementById("cartItems"), total=document.getElementById("cartTotal"), floating=document.getElementById("floatingCartCount");
  if(!items)return;
  let sum=0, qty=0;
  if(!cart.length){ items.innerHTML=`<p style="text-align:center;padding:20px;">Cart is empty</p>`; if(total)total.innerText="Total: Rs 0"; if(floating)floating.innerText="0"; saveCart(); return; }
  items.innerHTML=cart.map((item,i)=>{
    const price=num(item.price), q=num(item.qty);
    sum+=price*q; qty+=q;
    return `<div class="cart-item"><img src="${item.image}"><div style="flex:1"><h4>${item.name}</h4><p>Rs ${price*q}</p><div class="qty-box"><button onclick="changeQty(${i},-1)">-</button><span>${q}</span><button onclick="changeQty(${i},1)">+</button></div></div><button class="remove-btn" onclick="removeFromCart(${i})">✕</button></div>`;
  }).join("");
  if(total)total.innerText=`Total: Rs ${sum}`;
  if(floating)floating.innerText=qty;
  saveCart();
};

window.addToCart=(id,name,price,image)=>{
  const item=cart.find(i=>i.id===id);
  if(item)item.qty+=1;
  else cart.push({id,name,price:num(price),image,qty:1});
  updateCartDisplay();
  showToast("Added 🛒");
};
window.changeQty=(idx,delta)=>{ if(!cart[idx])return; cart[idx].qty+=delta; if(cart[idx].qty<=0)cart.splice(idx,1); updateCartDisplay(); };
window.removeFromCart=(idx)=>{ cart.splice(idx,1); updateCartDisplay(); showToast("Removed"); };
window.clearCart=()=>{ cart=[]; updateCartDisplay(); showToast("Cart cleared"); };

/* ========================= WISHLIST ========================= */
function toggleWishlistItem(productId) {
  const idx=wishlist.indexOf(productId);
  if(idx>-1) wishlist.splice(idx,1);
  else wishlist.push(productId);
  saveWishlist();
  showToast(idx>-1?"Removed from wishlist":"Added to wishlist ❤️");
}
window.toggleWishlist=()=>{
  // show wishlist items in a simple way (could open modal)
  if(wishlist.length===0){ showToast("Wishlist is empty"); return; }
  const names=wishlist.map(id=>{
    const p=allProducts.find(x=>x.id===id);
    return p?p.name:"";
  }).filter(Boolean).join(", ");
  showToast("❤️ Wishlist: "+names);
};
function updateWishlistUI(){
  const count=document.getElementById("wishlistCount");
  if(count)count.innerText=wishlist.length;
  const icon=document.getElementById("wishlistIcon");
  if(icon)icon.className=wishlist.length?"fa-solid fa-heart":"fa-regular fa-heart";
}
/* ========================= RECENTLY VIEWED ========================= */
function addRecentlyViewed(productId) {
  recentlyViewed=recentlyViewed.filter(id=>id!==productId);
  recentlyViewed.unshift(productId);
  if(recentlyViewed.length>10) recentlyViewed.pop();
  saveRecentlyViewed();
  renderRecentlyViewed();
}
function renderRecentlyViewed() {
  const container=document.getElementById("recentlyViewed");
  if(!container)return;
  const items=recentlyViewed.map(id=>allProducts.find(p=>p.id===id)).filter(Boolean);
  if(!items.length){ container.innerHTML=""; return; }
  container.innerHTML=items.map(p=>`
    <div class="card" onclick="openModal('${p.id}')">
      <img src="${p.image||''}" style="height:100px;object-fit:cover;">
      <div class="card-content"><h3 style="font-size:13px;">${p.name}</h3><p style="font-size:12px;color:var(--primary);">Rs ${getFinalPrice(p)}</p></div>
    </div>
  `).join("");
}

/* ========================= FILTER ========================= */
window.filterProducts=()=>{
  const search=document.getElementById("searchInput")?.value.toLowerCase()||"";
  const category=document.getElementById("categoryFilter")?.value||"all";
  const priceFilter=document.getElementById("priceFilter")?.value||"all";
  const discountFilter=document.getElementById("discountFilter")?.value||"all";
  const activeChip=document.querySelector(".filter-chip.active");
  const filterType=activeChip?.dataset?.filter||"all";

  let filtered=[...allProducts];
  if(search) filtered=filtered.filter(p=>(p.name||"").toLowerCase().includes(search));
  if(category!=="all") filtered=filtered.filter(p=>p.category===category);
  if(priceFilter!=="all"){
    const [min,max]=priceFilter.split("-").map(Number);
    filtered=filtered.filter(p=>{ const price=getFinalPrice(p); if(max) return price>=min && price<=max; return price>=min; });
  }
  if(discountFilter!=="all"){
    filtered=filtered.filter(p=>{ const d=num(p.discount); if(discountFilter==="10+")return d>=10; if(discountFilter==="20+")return d>=20; if(discountFilter==="50+")return d>=50; return true; });
  }
  // Special filters
  if(filterType==="featured") filtered=filtered.filter(p=>p.featured===true);
  else if(filterType==="bestseller") filtered=filtered.filter(p=>p.bestSeller===true);
  else if(filterType==="newarrival") filtered=filtered.filter(p=>p.newArrival===true);

  renderProducts(filtered);
};

/* ========================= RENDER PRODUCTS ========================= */
window.renderProducts=(products)=>{
  const grid=document.getElementById("products");
  if(!grid)return;
  if(!products.length){ grid.innerHTML=`<p style="text-align:center;width:100%">No products</p>`; return; }
  grid.innerHTML=products.map(p=>{
    const price=num(p.price), disc=num(p.discount), final=getFinalPrice(p);
    const reviews=allReviews.filter(r=>r.productId===p.id);
    const count=reviews.length;
    const avg=count?(reviews.reduce((t,r)=>t+num(r.rating),0)/count).toFixed(1):0;
    const lowStock=(p.stock||0)<5;
    return `
    <div class="card">
      ${disc>0?`<div class="discount-badge">-${disc}%</div>`:""}
      ${lowStock?`<div class="low-stock-badge">Low Stock</div>`:""}
      <img src="${p.image||''}" onclick="openModal('${p.id}')" style="cursor:pointer;">
      <div class="card-content">
        <h3>${p.name||''}</h3>
        <div class="price-box">${disc>0?`<span class="old-price">Rs ${price}</span>`:""}<span class="new-price">Rs ${final}</span></div>
        <div class="product-rating"><i class="fa-solid fa-star"></i>${avg}<span>(${count})</span></div>
        <div class="card-buttons">
          <button onclick="openModal('${p.id}')">View</button>
          <button onclick="addToCart('${p.id}','${p.name}',${final},'${p.image}')">Add</button>
        </div>
      </div>
    </div>`;
  }).join("");
};

/* ========================= MODAL ========================= */
window.openModal=(id)=>{
  const p=allProducts.find(x=>x.id===id);
  if(!p)return;
  currentProductId=id;
  addRecentlyViewed(id);
  const images=p.images?.length?p.images:[p.image];
  document.getElementById("modalName").innerText=p.name||"";
  document.getElementById("modalPrice").innerText="Rs "+getFinalPrice(p);
  document.getElementById("modalDesc").innerText=p.description||"";
  document.getElementById("galleryContainer").innerHTML=`
    <img src="${images[0]}" class="main-img" id="mainModalImg" onclick="zoomImage(this.src)">
    <div class="thumbnail-grid">${images.map(img=>`<img src="${img}" class="thumbnail" onclick="document.getElementById('mainModalImg').src='${img}'">`).join("")}</div>
  `;
  document.getElementById("modalLowStock").innerText=(p.stock||0)<5?"⚠️ Low Stock - Only "+p.stock+" left":"";
  document.getElementById("productModal").classList.add("show");
  selectedRating=0; updateStars(0);
  renderReviews(id);
  // Update wishlist button
  const wishBtn=document.getElementById("modalWishlistBtn");
  if(wishBtn){
    const inWish=wishlist.includes(id);
    wishBtn.innerHTML=`<i class="${inWish?'fa-solid':'fa-regular'} fa-heart"></i> ${inWish?'Remove from':'Add to'} Wishlist`;
  }
};

window.closeModal=()=>{
  document.getElementById("productModal").classList.remove("show");
  currentProductId=null;
};

/* ========================= ZOOM IMAGE ========================= */
window.zoomImage=(src)=>{
  const modal=document.createElement("div");
  modal.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;";
  modal.innerHTML=`<img src="${src}" style="max-width:90%;max-height:90%;object-fit:contain;">`;
  modal.onclick=()=>modal.remove();
  document.body.appendChild(modal);
};

/* ========================= SHARE PRODUCT ========================= */
window.shareProduct=()=>{
  if(!currentProductId)return;
  const p=allProducts.find(x=>x.id===currentProductId);
  if(!p)return;
  if(navigator.share){
    navigator.share({title:p.name,text:"Check out "+p.name+" on Freshora!",url:window.location.href});
  }else{
    navigator.clipboard.writeText(window.location.href+"?product="+p.id);
    showToast("Link copied to clipboard!");
  }
};

/* ========================= REVIEWS ========================= */
function renderReviews(productId){
  const container=document.getElementById("reviewList");
  if(!container)return;
  const reviews=allReviews.filter(r=>r.productId===productId);
  if(!reviews.length){ container.innerHTML=`<p style="color:var(--muted);font-size:13px;">No reviews yet</p>`; return; }
  container.innerHTML=reviews.map(r=>`
    <div class="review-item">
      <div style="display:flex;align-items:center;gap:6px;"><span style="color:#ffb400;">${'★'.repeat(Math.min(r.rating,5))}${'☆'.repeat(Math.max(0,5-Math.min(r.rating,5)))}</span><span style="font-size:12px;color:var(--muted);">${r.createdAt?new Date(r.createdAt).toLocaleDateString():''}</span></div>
      <p style="margin-top:4px;">${r.text||''}</p>
    </div>
  `).join("");
}

function setupStarRating(){
  document.querySelectorAll("#starRating i").forEach((star,i)=>{
    star.onclick=()=>{ selectedRating=i+1; updateStars(selectedRating); };
  });
}
function updateStars(rating){
  document.querySelectorAll("#starRating i").forEach((star,i)=>{
    star.classList.toggle("fa-solid",i<rating);
    star.classList.toggle("fa-regular",i>=rating);
  });
}
function bindReviewButton(){
  const btn=document.getElementById("reviewSubmitBtn");
  if(!btn)return;
  btn.onclick=async()=>{
    const text=document.getElementById("reviewText")?.value;
    if(!text||selectedRating===0){ showToast("Add rating + review"); return; }
    if(!currentProductId){ showToast("Open product first"); return; }
    await addDoc(collection(db,"reviews"),{productId:currentProductId,rating:selectedRating,text,createdAt:new Date().toISOString()});
    selectedRating=0; updateStars(0);
    document.getElementById("reviewText").value="";
    showToast("Review added");
  };
}

/* ========================= COUPON ========================= */
window.applyCoupon=()=>{
  const code=document.getElementById("couponInput").value.trim().toUpperCase();
  if(!code){ showToast("Enter a coupon code"); return; }
  const coupon=coupons.find(c=>c.code===code && c.active!==false);
  if(!coupon){ document.getElementById("couponMessage").innerText="Invalid coupon"; return; }
  appliedCoupon=coupon;
  document.getElementById("couponMessage").innerText=`Coupon applied! ${coupon.discount}% off`;
  showToast("Coupon applied!");
};

/* ========================= CHECKOUT ========================= */
window.checkout=async()=>{
  const name=document.getElementById("cusName")?.value.trim();
  const phone=document.getElementById("cusPhone")?.value.trim();
  const address=document.getElementById("cusAddress")?.value.trim();
  if(!name||!phone||!address){ showToast("Fill all details"); return; }
  if(!cart.length){ showToast("Cart empty"); return; }

  const orderId="FR-"+Date.now();
  const date=new Date().toLocaleString();
  let subtotal=0;
  const itemsText=cart.map((item,i)=>{
    const total=num(item.price)*item.qty;
    subtotal+=total;
    return `${i+1}) ${item.name} x${item.qty} = LKR ${total}`;
  }).join("\n");

  let delivery=subtotal>5000?0:375;
  let discountAmount=0;
  if(appliedCoupon){
    discountAmount=Math.round(subtotal*(appliedCoupon.discount/100));
    subtotal-=discountAmount;
  }
  const total=subtotal+delivery;

  // WhatsApp message
  const message=`🟢 FRESHORA NEW ORDER 🟢\n\n📦 Order ID: ${orderId}\n📅 Date: ${date}\n\n👤 CUSTOMER DETAILS\nName: ${name}\nPhone: ${phone}\nAddress: ${address}\n\n🛒 ITEMS\n${itemsText}\n\n💰 BILL SUMMARY\nSubtotal: LKR ${subtotal+discountAmount}\nDiscount: LKR ${discountAmount}\nDelivery: LKR ${delivery}\nTOTAL: LKR ${total}`;
  window.open(`https://wa.me/94752425790?text=${encodeURIComponent(message)}`,"_blank");

  await addDoc(collection(db,"orders"),{
    orderId,customer:{name,phone,address},customerName:name,phone,address,
    items:cart,subtotal:subtotal+discountAmount,discount:discountAmount,delivery,total,status:"Pending",
    createdAt:new Date().toISOString()
  });

  // Show success page
  document.getElementById("orderSuccessId").innerText="Order #"+orderId;
  document.getElementById("orderSuccessPage").style.display="block";

  cart=[]; appliedCoupon=null;
  document.getElementById("couponInput").value="";
  document.getElementById("couponMessage").innerText="";
  updateCartDisplay();
  showToast("Order sent 🚀");
};

/* ========================= UI TOGGLES ========================= */
window.toggleCart=()=>document.getElementById("cartDrawer")?.classList.toggle("open");
window.toggleDarkMode=()=>{
  document.body.classList.toggle("dark");
  const icon=document.querySelector("#darkModeBtn i");
  if(icon){ icon.classList.toggle("fa-sun"); icon.classList.toggle("fa-moon"); }
};

/* ========================= FIREBASE SNAPSHOTS ========================= */
onSnapshot(collection(db,"products"),(snap)=>{
  allProducts=snap.docs.map(d=>({id:d.id,...d.data()}));
  renderProducts(allProducts);
  renderRecentlyViewed();
  document.getElementById("loadingScreen")?.remove();
});

onSnapshot(collection(db,"categories"),(snap)=>{
  const cats=snap.docs.map(d=>d.data().name);
  const select=document.getElementById("categoryFilter");
  if(!select)return;
  select.innerHTML=`<option value="all">All Categories</option>`;
  cats.forEach(c=>{ const opt=document.createElement("option"); opt.value=c; opt.textContent=c; select.appendChild(opt); });
  // Category icons
  const iconContainer=document.getElementById("categoryIcons");
  if(iconContainer){
    iconContainer.innerHTML=cats.map(c=>`<div class="category-icon" onclick="document.getElementById('categoryFilter').value='${c}';filterProducts();"><i class="fa-solid fa-${getCategoryIcon(c)}"></i><span>${c}</span></div>`).join("");
  }
});

function getCategoryIcon(name){
  const map={Vegetables:"carrot",Fruits:"apple",Dairy:"cheese",Meat:"drumstick",Bakery:"bread",Beverages:"mug-saucer",Other:"tag"};
  return map[name]||"tag";
}

onSnapshot(collection(db,"reviews"),(snap)=>{
  allReviews=snap.docs.map(d=>d.data());
  renderProducts(allProducts);
  if(currentProductId)renderReviews(currentProductId);
});
