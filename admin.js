console.log("ADMIN SYSTEM LOADING...");

import { db, collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, auth } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* =========================
SECURE LOGIN GUARD
========================= */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    console.log("ADMIN LOGGED IN:", user.email);
    loadProducts();
    loadOrders();
  }
});

/* =========================
STATE
========================= */
let products = [];
let orders = [];
let chartInstance = null;

/* =========================
ADD / UPDATE PRODUCT
========================= */
window.uploadAndAddProduct = async () => {
  try {
    const name = document.getElementById("pname").value;
    const price = Number(document.getElementById("pprice").value || 0);
    const discount = Number(document.getElementById("pdiscount").value || 0);
    const category = document.getElementById("pcategory").value;
    const stock = Number(document.getElementById("pstock").value || 0);
    const desc = document.getElementById("pdesc").value;

    const files = document.getElementById("pimageFile").files;

    if (!name || !price) {
      alert("Fill required fields");
      return;
    }

    let imageUrl = "";

    if (files && files[0]) {
      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("upload_preset", "freshora_upload");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dayvblw7g/image/upload",
        { method: "POST", body: formData }
      );

      const data = await res.json();
      imageUrl = data.secure_url || "";
    }

    await addDoc(collection(db, "products"), {
      name,
      price,
      discount,
      category,
      stock,
      description: desc,
      image: imageUrl,
      createdAt: new Date().toISOString()
    });

    alert("Product Saved ✅");

  } catch (e) {
    console.error("ADD ERROR:", e);
  }
};

/* =========================
LOAD PRODUCTS
========================= */
function loadProducts() {
  onSnapshot(collection(db, "products"), (snap) => {

    products = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    const list = document.getElementById("productList");
    if (!list) return;

    list.innerHTML = products.map(p => `
      <div class="admin-card">
        <img src="${p.image || ''}" width="60">

        <div>
          <h4>${p.name}</h4>
          <p>Rs ${p.price}</p>
          <p>Stock: ${p.stock || 0}</p>
          <p>Category: ${p.category || '-'}</p>
        </div>

        <button onclick="deleteProduct('${p.id}')">Delete</button>
      </div>
    `).join("");

    updateAnalytics();
  });
}

/* =========================
DELETE PRODUCT
========================= */
window.deleteProduct = async (id) => {
  await deleteDoc(doc(db, "products", id));
};

/* =========================
LOAD ORDERS
========================= */
function loadOrders() {
  onSnapshot(collection(db, "orders"), (snap) => {

    orders = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    const list = document.getElementById("orderList");
    if (!list) return;

    list.innerHTML = orders.map(o => `
      <div class="admin-card">
        <h4>${o.orderId}</h4>
        <p>${o.customer?.name || ""}</p>
        <p>Rs ${o.total || 0}</p>
        <p>Status: ${o.status || "Pending"}</p>
      </div>
    `).join("");

    updateAnalytics();
  });
}

/* =========================
ANALYTICS
========================= */
function updateAnalytics() {

  const totalProducts = products.length;
  const totalOrders = orders.length;

  let revenue = 0;
  orders.forEach(o => {
    revenue += Number(o.total || 0);
  });

  const p = document.getElementById("totalProducts");
  const o = document.getElementById("totalOrders");
  const r = document.getElementById("totalRevenue");

  if (p) p.innerText = totalProducts;
  if (o) o.innerText = totalOrders;
  if (r) r.innerText = "Rs " + revenue;

  renderChart(totalProducts, totalOrders, revenue);
}

/* =========================
CHART (SAFE FIX)
========================= */
function renderChart(p, o, r) {

  const ctx = document.getElementById("analyticsChart");
  if (!ctx || typeof Chart === "undefined") return;

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Products", "Orders", "Revenue"],
      datasets: [{
        data: [p, o, r],
        backgroundColor: ["#22c55e", "#3b82f6", "#f59e0b"]
      }]
    }
  });
}

/* =========================
LOGOUT (SECURE)
========================= */
window.logout = () => {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
};
