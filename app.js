let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart(){
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
  updateCount();
}

function updateCount(){
  document.getElementById("floatingCartCount").innerText =
  cart.reduce((a,b)=>a+b.qty,0);
}

window.addToCart = (id,name,price,image)=>{

  let item = cart.find(i=>i.id===id);

  if(item) item.qty++;
  else cart.push({id,name,price:+price,image,qty:1});

  saveCart();
};

window.clearCart = ()=>{
  if(confirm("Clear cart?")){
    cart = [];
    saveCart();
  }
};

/* CART DRAWER */
window.toggleCart = ()=>{
  document.getElementById("cartDrawer").classList.toggle("open");
  document.getElementById("overlay").classList.toggle("show");
};

/* RENDER */
function renderCart(){

  let box = document.getElementById("cartItems");
  let total = 0;

  box.innerHTML = "";

  cart.forEach((item,i)=>{

    total += item.price * item.qty;

    box.innerHTML += `
      <div class="cart-item">
        <img src="${item.image}">
        <div>
          <h4>${item.name}</h4>
          <p>Rs ${item.price}</p>
          <div>
            <button onclick="cart[${i}].qty--;saveCart()">-</button>
            ${item.qty}
            <button onclick="cart[${i}].qty++;saveCart()">+</button>
          </div>
        </div>
      </div>
    `;
  });

  document.getElementById("cartTotal").innerText =
  "Total: Rs " + total;
}

/* WHATSAPP CHECKOUT (FIXED FORMAT) */
window.checkoutWhatsApp = ()=>{

  if(cart.length===0) return alert("Cart empty");

  let name = document.getElementById("cusName").value;
  let phone = document.getElementById("cusPhone").value;
  let address = document.getElementById("cusAddress").value;

  let orderID = "FR-" + Date.now();

  let msg = `🟢 FRESHORA ORDER 🟢%0A`;
  msg += `Order ID: ${orderID}%0A%0A`;

  msg += `👤 ${name}%0A📞 ${phone}%0A📍 ${address}%0A%0A`;

  let total = 0;

  cart.forEach(i=>{
    msg += `• ${i.name} x${i.qty} = Rs ${i.price*i.qty}%0A`;
    total += i.price*i.qty;
  });

  msg += `%0A💰 Total: Rs ${total}`;

  window.open(
    `https://wa.me/94752425790?text=${msg}`,
    "_blank"
  );
};

/* INIT */
renderCart();
updateCount();
