console.log("ADMIN JS LOADED");

document.body.insertAdjacentHTML(
  "beforeend",
  "<div style='position:fixed;bottom:40px;right:10px;background:green;color:white;padding:6px;z-index:9999'>JS OK</div>"
);

/* =========================
IMPORT FIREBASE
========================= */
import {
  db,
  collection,
  addDoc,
  onSnapshot
} from "./firebase.js";

/* =========================
STATE
========================= */
let products = [];
let orders = [];

/* =========================
UPLOAD IMAGE (SAFE OPTIONAL)
========================= */
async function uploadImage(file) {
  if (!file) return "";

  const CLOUD_NAME = "dayvblw7g";
  const UPLOAD_PRESET = "freshora_upload";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData
    }
  );

  const data = await res.json();
  return data.secure_url || "";
}

/* =========================
ADD PRODUCT
========================= */
window.uploadAndAddProduct = async () => {

  const name = document.getElementById("pname").value;
  const price = Number(document.getElementById("pprice").value || 0);
  const discount = Number(document.getElementById("pdiscount").value || 0);
  const category = document.getElementById("pcategory").value;
  const desc = document.getElementById("pdesc").value;
  const file = document.getElementById("pimageFile").files[0];

  if (!name || !price) {
    alert("Fill required fields");
    return;
  }

  let image = await uploadImage(file);

  await addDoc(collection(db, "products"), {
    name,
    price,
    discount,
    category,
    description: desc,
    image,
    createdAt: new Date().toISOString()
  });

  alert("Added ✔");
};

/* =========================
LOAD PRODUCTS
========================= */
onSnapshot(collection(db, "products"), (snap) => {

  products = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  document.getElementById("productList").innerHTML =
    products.map(p => `
      <div style="background:#fff;padding:10px;margin:10px;border-radius:10px">
        <img src="${p.image}" width="60">
        <h4>${p.name}</h4>
        <p>Rs ${p.price}</p>
      </div>
    `).join("");

  document.getElementById("totalProducts").innerText = products.length;

  drawChart();
});

/* =========================
LOAD ORDERS
========================= */
onSnapshot(collection(db, "orders"), (snap) => {

  orders = snap.docs.map(d => d.data());

  document.getElementById("orderList").innerHTML =
    orders.map(o => `
      <div style="background:#fff;padding:10px;margin:10px;border-radius:10px">
        <h4>${o.orderId}</h4>
        <p>${o.customer?.name}</p>
        <p>Rs ${o.total}</p>
      </div>
    `).join("");

  document.getElementById("totalOrders").innerText = orders.length;

  let revenue = orders.reduce((s, o) => s + (o.total || 0), 0);

  document.getElementById("totalRevenue").innerText = revenue;

  drawChart();
});

/* =========================
CHART
========================= */
function drawChart() {

  const ctx = document.getElementById("analyticsChart");

  if (!ctx) return;

  if (window.chart) window.chart.destroy();

  window.chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Products", "Orders", "Revenue"],
      datasets: [{
        data: [
          products.length,
          orders.length,
          orders.reduce((s, o) => s + (o.total || 0), 0)
        ],
        backgroundColor: ["green", "blue", "orange"]
      }]
    }
  });
}

/* =========================
LOGOUT
========================= */
window.logout = () => {
  localStorage.removeItem("admin");
  location.href = "login.html";
};
