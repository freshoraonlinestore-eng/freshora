let products = JSON.parse(localStorage.getItem("products")) || [];

function addProduct() {
  let name = document.getElementById("pname").value;
  let price = document.getElementById("pprice").value;
  let img = document.getElementById("pimg").value;

  products.push({ name, price, img });
  localStorage.setItem("products", JSON.stringify(products));

  render();
}

function render() {
  let html = "";
  products.forEach((p, i) => {
    html += `
      <div class="card">
        <img src="${p.img}">
        <h3>${p.name}</h3>
        <p>Rs ${p.price}</p>
        <button onclick="deleteProduct(${i})">Delete</button>
      </div>
    `;
  });

  document.getElementById("adminProducts").innerHTML = html;
}

function deleteProduct(i) {
  products.splice(i, 1);
  localStorage.setItem("products", JSON.stringify(products));
  render();
}

render();
