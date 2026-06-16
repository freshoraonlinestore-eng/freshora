import {
  db,
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc
} from "./firebase.js";

/* =========================
STATE
========================= */
let products = [];
let orders = [];

/* =========================
SAFE ELEMENT GET
========================= */
const el = (id) => document.getElementById(id);

/* =========================
INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  loadOrders();
});

/* =========================
PRODUCTS LOAD
========================= */
function loadProducts() {
  onSnapshot(collection(db, "products"), (snap) => {
    products = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    renderProducts();
    updateAnalytics();
  }, (err) => {
    console.error("Products error:", err);
  });
}

/* =========================
ORDERS LOAD
========================= */
function loadOrders() {
  onSnapshot(collection(db, "orders"), (snap) => {
    orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    renderOrders();
    updateAnalytics();
  }, (err) => {
    console.error("Orders error:", err);
  });
}

/* =========================
RENDER PRODUCTS
========================= */
function renderProducts() {
  const box = el("productList");
  if (!box) return;

  if (!products.length) {
    box.innerHTML = "<p>No products</p>";
    return;
  }

  box.innerHTML = products.map(p => `
    <div class="item">
      <img src="${p.image || ''}" width="60">

      <div>
        <h4>${p.name || ''}</h4>
        <p>Rs ${p.price || 0}</p>
        <small>${p.category || ''}</small>
      </div>

      <button onclick="deleteProduct('${p.id}')">Delete</button>
    </div>
  `).join("");
}

/* =========================
RENDER ORDERS
========================= */
function renderOrders() {
  const box = el("orderList");
  if (!box) return;

  if (!orders.length) {
    box.innerHTML = "<p>No orders</p>";
    return;
  }

  box.innerHTML = orders.map(o => `
    <div class="item">
      <h4>${o.orderId || ''}</h4>
      <p>${o.customer?.name || ''}</p>
      <b>Rs ${o.total || 0}</b>
    </div>
  `).join("");
}

/* =========================
ANALYTICS FIX
========================= */
function updateAnalytics() {

  const totalProducts = products.length;
  const totalOrders = orders.length;

  let revenue = 0;
  orders.forEach(o => {
    revenue += Number(o.total || 0);
  });

  const pEl = el("totalProducts");
  const oEl = el("totalOrders");
  const rEl = el("totalRevenue");

  if (pEl) pEl.innerText = totalProducts;
  if (oEl) oEl.innerText = totalOrders;
  if (rEl) rEl.innerText = revenue;

  drawChart(totalProducts, totalOrders, revenue);
}

/* =========================
CHART
========================= */
let chartInstance = null;

function drawChart(p, o, r) {
  const ctx = el("analyticsChart");
  if (!ctx) return;

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Products", "Orders", "Revenue"],
      datasets: [{
        data: [p, o, r]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });
}

/* =========================
DELETE PRODUCT
========================= */
window.deleteProduct = async (id) => {
  try {
    await deleteDoc(doc(db, "products", id));
  } catch (e) {
    console.error(e);
  }
};

/* =========================
ADD PRODUCT (SAFE)
========================= */
window.uploadAndAddProduct = async () => {

  try {

    const name = el("pname")?.value;
    const price = el("pprice")?.value;
    const discount = el("pdiscount")?.value;
    const category = el("pcategory")?.value;
    const desc = el("pdesc")?.value;

    if (!name || !price) {
      alert("Fill required fields");
      return;
    }

    await addDoc(collection(db, "products"), {
      name,
      price: Number(price),
      discount: Number(discount || 0),
      category,
      description: desc,
      createdAt: new Date().toISOString()
    });

    alert("Saved ✅");

  } catch (err) {
    console.error("Add product error:", err);
    alert("Failed ❌");
  }
};

/* =========================
LOGOUT
========================= */
window.logout = () => {
  localStorage.removeItem("admin");
  location.href = "login.html";
};
