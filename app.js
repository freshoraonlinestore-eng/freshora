let products = JSON.parse(localStorage.getItem("products")) || [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function renderProducts(data = products) {
  let html = "";
  data.forEach((p, i) => {
    html += `
      <div class="card">
        <img src="${p.img}">
        <h3>${p.name}</h3>
        <p>Rs ${p.price}</p>
        <button onclick="addToCart(${i})">Add to Cart</button>
      </div>
    `;
  });
  document.getElementById("products").innerHTML = html;
}

function addToCart(i) {
  cart.push(products[i]);
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
}

function renderCart() {
  let html = "";
  cart.forEach((c, i) => {
    html += `<p>${c.name} - Rs ${c.price}</p>`;
  });
  document.getElementById("cart").innerHTML = html;
}

function checkout() {
  let msg = "Hello, I want to order:%0A";
  cart.forEach(c => {
    msg += `- ${c.name} Rs ${c.price}%0A`;
  });

  window.open("https://wa.me/94752425790?text=" + msg);
}

document.getElementById("search").addEventListener("input", e => {
  let val = e.target.value.toLowerCase();
  let filtered = products.filter(p => p.name.toLowerCase().includes(val));
  renderProducts(filtered);
});

renderProducts();
renderCart();
