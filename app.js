import { db, collection, onSnapshot } from "./firebase.js";

const productsDiv = document.getElementById("products");

// CART (localStorage)
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// LOAD PRODUCTS REALTIME
onSnapshot(collection(db, "products"), (snap) => {

  console.log("DATA LOADED:", snap.size);

  productsDiv.innerHTML = "";

  if (snap.empty) {
    productsDiv.innerHTML = "<p style='padding:15px'>No products found</p>";
    return;
  }

  snap.forEach((docItem) => {

    const p = docItem.data();

    productsDiv.innerHTML += `
      <div class="card">

        <img src="${p.image}" alt="${p.name}">

        <h3>${p.name}</h3>

        <p>Rs ${p.price}</p>

        <button onclick="addToCart('${docItem.id}')">
          Add to Cart
        </button>

        <button onclick="order('${p.name}','${p.price}')">
          Buy Now
        </button>

      </div>
    `;
  });
});


// ADD TO CART
window.addToCart = (id) => {

  onSnapshot(collection(db, "products"), (snap) => {

    snap.forEach((docItem) => {

      if (docItem.id === id) {

        const p = docItem.data();

        cart.push({
          id: docItem.id,
          name: p.name,
          price: p.price,
          image: p.image,
          qty: 1
        });

        localStorage.setItem("cart", JSON.stringify(cart));

        alert("Added to cart 🛒");
      }
    });
  });
};


// WHATSAPP ORDER
window.order = (name, price) => {

  const msg = `I want to order: ${name} - Rs ${price}`;

  window.open(
    "https://wa.me/94752425790?text=" + encodeURIComponent(msg),
    "_blank"
  );
};
