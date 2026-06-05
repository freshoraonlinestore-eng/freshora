import {
  db,
  collection,
  onSnapshot,
  addDoc
} from "./firebase.js";

/* =========================
   ELEMENTS
========================= */

const productsDiv =
document.getElementById("products");

/* =========================
   STATE
========================= */

let cart =
JSON.parse(localStorage.getItem("cart")) || [];

let wishlist =
JSON.parse(localStorage.getItem("wishlist")) || [];

let allProducts = [];

/* =========================
   HELPERS (SAFE TEXT)
========================= */

function safeText(str){
  return (str || "").toString();
}

/* =========================
   TOAST
========================= */

function showToast(text){

  const toast =
  document.createElement("div");

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

  localStorage.setItem(
    "cart",
    JSON.stringify(cart)
  );

  updateCartCount();
  renderCart();
}

/* =========================
   CART COUNT
========================= */

function updateCartCount(){

  const total =
  cart.reduce((sum,item)=> sum + item.qty, 0);

  const count =
  document.getElementById("floatingCartCount");

  if(count){
    count.innerText = total;
  }
}

/* =========================
   WISHLIST
========================= */

function saveWishlist(){

  localStorage.setItem(
    "wishlist",
    JSON.stringify(wishlist)
  );
}

window.toggleWishlist = function(id){

  if(!id) return;

  if(wishlist.includes(id)){

    wishlist =
    wishlist.filter(i => i !== id);

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

  if(!id) return;

  const existing =
  cart.find(i => i.id === id);

  if(existing){
    existing.qty++;
  } else {
    cart.push({
      id,
      name:safeText(name),
      price:Number(price) || 0,
      image:safeText(image),
      qty:1
    });
  }

  saveCart();
  showToast("Added to cart 🛒");
};

/* =========================
   REMOVE / QTY
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

    if(cart[index].qty <= 0){
      cart.splice(index,1);
    }

    saveCart();
  }
};

/* =========================
   CLEAR CART
========================= */

window.clearCart = function(){

  cart = [];
  saveCart();
  showToast("Cart Cleared");
};

/* =========================
   CART DRAWER
========================= */

window.toggleCart = function(){

  const drawer =
  document.getElementById("cartDrawer");

  const overlay =
  document.getElementById("overlay");

  if(drawer){
    drawer.classList.toggle("open");
  }

  if(overlay){
    overlay.classList.toggle("show");
  }

  renderCart();
};

/* =========================
   RENDER CART
========================= */

function renderCart(){

  const box =
  document.getElementById("cartItems");

  const totalBox =
  document.getElementById("cartTotal");

  if(!box || !totalBox) return;

  box.innerHTML = "";

  if(cart.length === 0){

    box.innerHTML =
    `<p class="empty">Cart empty</p>`;

    totalBox.innerText = "Total: Rs 0";
    return;
  }

  let total = 0;

  cart.forEach((item,index)=>{

    total += (item.price || 0) * item.qty;

    box.innerHTML += `
      <div class="cart-item">

        <img src="${item.image}" alt="${item.name}">

        <div class="cart-details">

          <h4>${item.name}</h4>
          <p>Rs ${item.price}</p>

          <div class="qty-box">

            <button onclick="decreaseQty(${index})">-</button>
            <span>${item.qty}</span>
            <button onclick="increaseQty(${index})">+</button>

          </div>

        </div>

        <button class="remove-btn"
          onclick="removeItem(${index})">✕</button>

      </div>
    `;
  });

  totalBox.innerText =
  "Total: Rs " + total.toLocaleString();
}

/* =========================
   CHECKOUT
========================= */

window.checkout = async function(){

  if(cart.length === 0){
    showToast("Cart Empty");
    return;
  }

  const name =
  document.getElementById("cusName")?.value.trim();

  const phone =
  document.getElementById("cusPhone")?.value.trim();

  const address =
  document.getElementById("cusAddress")?.value.trim();

  if(!name || !phone || !address){
    showToast("Fill all fields");
    return;
  }

  let total = 0;

  cart.forEach(item=>{
    total += (item.price || 0) * item.qty;
  });

  try{

    await addDoc(
      collection(db,"orders"),
      {
        customer:{ name, phone, address },
        items:cart,
        total,
        createdAt:Date.now()
      }
    );

    let msg = `🛒 Freshora Order:%0A%0A`;
    msg += `👤 Name: ${name}%0A`;
    msg += `📞 Phone: ${phone}%0A`;
    msg += `📍 Address: ${address}%0A%0A`;

    cart.forEach(item=>{
      msg += `${item.name} x${item.qty}%0A`;
    });

    msg += `%0ATotal: Rs ${total}`;

    window.open(
      "https://wa.me/94752425790?text=" + msg,
      "_blank"
    );

    showToast("Order Sent ✅");

    cart = [];
    saveCart();

    document.getElementById("cartDrawer")?.classList.remove("open");
    document.getElementById("overlay")?.classList.remove("show");

  } catch(err){
    console.log(err);
    showToast("Checkout Failed");
  }
};

/* =========================
   RATING
========================= */

window.setRating = async function(productId,rating){

  try{

    await addDoc(
      collection(db,"ratings"),
      {
        productId,
        rating,
        createdAt:Date.now()
      }
    );

    showToast("Thanks for rating ⭐");

  } catch(err){
    showToast("Rating failed");
  }
};

/* =========================
   STARS
========================= */

function renderStars(id){

  let html = "";

  for(let i=1;i<=5;i++){

    html += `
      <span class="star"
        onclick="setRating('${id}',${i})">
        ⭐
      </span>
    `;
  }

  return html;
}

/* =========================
   FILTERS
========================= */

function applyFilters(products){

  const price =
  document.getElementById("priceFilter")?.value || "all";

  const discount =
  document.getElementById("discountFilter")?.value || "all";

  const category =
  document.getElementById("categoryFilter")?.value || "all";

  return products.filter(p=>{

    const okCategory =
    category === "all" || p.category === category;

    const okPrice =
    price === "all" || Number(p.price) <= Number(price);

    const okDiscount =
    discount === "all" || (p.discount || 0) >= Number(discount);

    return okCategory && okPrice && okDiscount;
  });
}

/* =========================
   RENDER PRODUCTS
========================= */

function renderProducts(products){

  if(!productsDiv) return;

  productsDiv.innerHTML = "";

  const search =
  document.getElementById("searchInput")?.value.toLowerCase() || "";

  let filtered =
  products.filter(p =>
    (p.name || "").toLowerCase().includes(search)
  );

  filtered = applyFilters(filtered);

  if(filtered.length === 0){
    productsDiv.innerHTML =
    `<p class="empty">No products</p>`;
    return;
  }

  filtered.forEach(p=>{

    const discount = p.discount || 0;

    const newPrice =
    discount
      ? Math.round(p.price - (p.price * discount / 100))
      : p.price;

    const heart =
    wishlist.includes(p.id) ? "❤️" : "🤍";

    productsDiv.innerHTML += `
      <div class="card fade-in">

        ${discount ? `<div class="discount-badge">${discount}% OFF</div>` : ""}

        <button class="wishlist-btn"
          onclick="toggleWishlist('${p.id}')">${heart}</button>

        <img src="${p.image}" alt="${p.name}">

        <div class="card-content">

          <h3>${p.name}</h3>

          <div class="price-box">

            ${discount ? `<span class="old-price">Rs ${p.price}</span>` : ""}

            <span class="new-price">Rs ${newPrice}</span>

          </div>

          <div class="rating">
            ${renderStars(p.id)}
          </div>

          <div class="stock">${p.stock || "In Stock"}</div>

          <div class="card-buttons">

            <button class="view-btn"
              onclick="openModal('${p.id}','${p.name}','${newPrice}','${p.image}')">
              View
            </button>

            <button class="add-cart-btn"
              onclick="addToCart('${p.id}','${p.name}','${newPrice}','${p.image}')">
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

window.onclick = function(e){

  const modal = document.getElementById("productModal");

  if(e.target === modal){
    closeModal();
  }
};

/* =========================
   DARK MODE
========================= */

window.toggleDarkMode = function(){

  document.body.classList.toggle("dark");

  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark")
  );
};

if(localStorage.getItem("darkMode") === "true"){
  document.body.classList.add("dark");
}

/* =========================
   EVENTS
========================= */

document.addEventListener("input",(e)=>{
  if(e.target.id === "searchInput"){
    renderProducts(allProducts);
  }
});

document.getElementById("priceFilter")?.addEventListener("change",()=>renderProducts(allProducts));
document.getElementById("discountFilter")?.addEventListener("change",()=>renderProducts(allProducts));
document.getElementById("categoryFilter")?.addEventListener("change",()=>renderProducts(allProducts));

document.addEventListener("keydown",(e)=>{

  if(e.key === "Escape"){

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
    loading.style.opacity = "0";
    setTimeout(()=>loading.style.display = "none",300);
  }

  updateCartCount();
  renderCart();
});

/* =========================
   FIREBASE PRODUCTS
========================= */

onSnapshot(collection(db,"products"),(snap)=>{

  try{

    allProducts = [];

    snap.forEach(d=>{
      allProducts.push({
        id:d.id,
        ...d.data()
      });
    });

    renderProducts(allProducts);
    updateCartCount();

  } catch(err){
    console.log(err);
    showToast("Failed to load products");
  }

});
