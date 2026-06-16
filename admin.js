import {
  db,
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc
} from "./firebase.js";

/* =========================
SAFE START LOG
========================= */
console.log("🔥 APP JS V8 PRO LOADED");

/* =========================
STATE
========================= */
let products = [];
let orders = [];
let chartInstance = null;

/* =========================
SAFE GET ELEMENT
========================= */
function el(id) {
  return document.getElementById(id);
}

/* =========================
INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  loadOrders();
});

/* =========================
UPLOAD IMAGES (SAFE)
========================= */
async function uploadImages(files) {
  const urls = [];

  if (!files) return urls;

  for (let i = 0; i < Math.min(files.length, 3); i++) {
    try {
      const formData = new FormData();
      formData.append("file", files[i]);
      formData.append("upload_preset", "freshora_upload");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dayvblw7g/image/upload",
        { method: "POST", body: formData }
      );

      const data = await res.json();
      if (data.secure_url) urls.push(data.secure_url);

    } catch (err) {
      console.error("Image upload error:", err);
    }
  }

  return urls;
}

/* =========================
ADD / UPDATE PRODUCT
========================= */
window.uploadAndAddProduct = async () => {
  try {
    const name = el("pname")?.value;
    const price = Number(el("pprice")?.value || 0);
    const discount = Number(el("pdiscount")?.value || 0);
    const category = el("pcategory")?.value || "General";
    const stock = Number(el("pstock")?.value || 0);
    const desc = el("pdesc")?.value;

    const files = el("pimageFile")?.files;

    if (!name || price <= 0) {
      alert("Fill required fields");
      return;
    }

    const images = await uploadImages(files);

    await addDoc(collection(db, "products"), {
      name,
      price,
      discount,
      category,
      stock,
      description: desc,
      images,
      image: images[0] || "",
      createdAt: new Date().toISOString()
    });

    alert("Product Saved ✅");

  } catch (err) {
    console.error("ADD ERROR:", err);
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

    const list = el("productList");
    if (!list) return;

    if (products.length === 0) {
      list.innerHTML = "<p>No products</p>";
      return;
    }

    list.innerHTML = products.map(p => `
      <div class="admin-card">
        <img src="${p.image || ''}" width="60">

        <div>
          <h4>${p.name || ''}</h4>
          <p>Rs ${p.price || 0}</p>
          <p>Stock: ${p.stock || 0}</p>
          <p>Category: ${p.category || '-'}</p>
        </div>

        <button onclick="editProduct('${p.id}')">Edit</button>
        <button onclick="deleteProduct('${p.id}')">Delete</button>
        <button onclick="updateStock('${p.id}',1)">+</button>
        <button onclick="updateStock('${p.id}',-1)">-</button>
      </div>
    `).join("");

    loadAnalytics();
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
EDIT PRODUCT (AUTO FILL)
========================= */
window.editProduct = (id) => {
  const p = products.find(x => x.id === id);
  if (!p) return;

  if (el("pname")) el("pname").value = p.name;
  if (el("pprice")) el("pprice").value = p.price;
  if (el("pdiscount")) el("pdiscount").value = p.discount;
  if (el("pcategory")) el("pcategory").value = p.category;
  if (el("pstock")) el("pstock").value = p.stock;
};

/* =========================
STOCK UPDATE
========================= */
window.updateStock = async (id, val) => {
  const p = products.find(x => x.id === id);
  if (!p) return;

  try {
    await updateDoc(doc(db, "products", id), {
      stock: (p.stock || 0) + val
    });
  } catch (e) {
    console.error(e);
  }
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

    const list = el("orderList");
    if (!list) return;

    list.innerHTML = orders.map(o => `
      <div class="admin-card">
        <h4>${o.orderId || 'No ID'}</h4>
        <p>${o.customer?.name || ''}</p>
        <p>Rs ${o.total || 0}</p>
        <span>${o.status || "Pending"}</span>
      </div>
    `).join("");

    loadAnalytics();
  });
}

/* =========================
ANALYTICS SAFE FIX
========================= */
function loadAnalytics() {

  const totalProducts = products.length;
  const totalOrders = orders.length;

  let revenue = 0;
  orders.forEach(o => {
    revenue += Number(o.total || 0);
  });

  const p = el("totalProducts");
  const o = el("totalOrders");
  const r = el("totalRevenue");

  if (p) p.innerText = totalProducts;
  if (o) o.innerText = totalOrders;
  if (r) r.innerText = "Rs " + revenue;

  renderChart(totalProducts, totalOrders, revenue);
}

/* =========================
CHART (FIXED)
========================= */
function renderChart(p, o, r) {

  const ctx = el("analyticsChart");
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
LOGOUT
========================= */
window.logout = () => {
  localStorage.removeItem("admin");
  window.location.href = "login.html";
};
