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
STATE
========================= */
let products = [];
let orders = [];
let categories = [];
let chartInstance = null;

/* =========================
SAFE LOG
========================= */
console.log("ADMIN V8 LOADED");

/* =========================
INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  loadOrders();
  loadAnalytics();
});

/* =========================
UPLOAD IMAGE (MULTI SAFE)
========================= */
async function uploadImages(files) {
  const urls = [];

  if (!files) return urls;

  for (let i = 0; i < Math.min(files.length, 3); i++) {
    const formData = new FormData();
    formData.append("file", files[i]);
    formData.append("upload_preset", "freshora_upload");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dayvblw7g/image/upload",
      { method: "POST", body: formData }
    );

    const data = await res.json();
    if (data.secure_url) urls.push(data.secure_url);
  }

  return urls;
}

/* =========================
ADD PRODUCT
========================= */
window.uploadAndAddProduct = async () => {
  try {
    const name = document.getElementById("pname").value;
    const price = Number(document.getElementById("pprice").value);
    const discount = Number(document.getElementById("pdiscount").value || 0);
    const category = document.getElementById("pcategory").value;
    const stock = Number(document.getElementById("pstock").value || 0);
    const desc = document.getElementById("pdesc").value;
    const files = document.getElementById("pimageFile").files;

    if (!name || !price) {
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

    alert("Saved ✅");

  } catch (e) {
    console.error("ADD PRODUCT ERROR:", e);
  }
};

/* =========================
LOAD PRODUCTS
========================= */
function loadProducts() {
  onSnapshot(collection(db, "products"), (snap) => {
    products = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const list = document.getElementById("productList");
    if (!list) return;

    list.innerHTML = products.map(p => `
      <div class="admin-card">
        <img src="${p.image}" width="60">
        <div>
          <h4>${p.name}</h4>
          <p>Rs ${p.price}</p>
          <p>Stock: ${p.stock || 0}</p>
          <p>${p.category || ""}</p>
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
DELETE
========================= */
window.deleteProduct = async (id) => {
  await deleteDoc(doc(db, "products", id));
};

/* =========================
EDIT PRODUCT
========================= */
window.editProduct = (id) => {
  const p = products.find(x => x.id === id);
  if (!p) return;

  document.getElementById("pname").value = p.name;
  document.getElementById("pprice").value = p.price;
  document.getElementById("pdiscount").value = p.discount;
  document.getElementById("pcategory").value = p.category;
  document.getElementById("pstock").value = p.stock;

  window.currentEditId = id;
};

/* =========================
UPDATE STOCK
========================= */
window.updateStock = async (id, val) => {
  const p = products.find(x => x.id === id);
  if (!p) return;

  await updateDoc(doc(db, "products", id), {
    stock: (p.stock || 0) + val
  });
};

/* =========================
LOAD ORDERS
========================= */
function loadOrders() {
  onSnapshot(collection(db, "orders"), (snap) => {
    orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const list = document.getElementById("orderList");
    if (!list) return;

    list.innerHTML = orders.map(o => `
      <div class="admin-card">
        <h4>${o.orderId}</h4>
        <p>${o.customer?.name}</p>
        <p>Rs ${o.total}</p>

        <span>${o.status || "Pending"}</span>
      </div>
    `).join("");

    loadAnalytics();
  });
}

/* =========================
ANALYTICS FIX
========================= */
function loadAnalytics() {
  const totalProducts = products.length;
  const totalOrders = orders.length;

  let revenue = 0;
  orders.forEach(o => revenue += Number(o.total || 0));

  document.getElementById("totalProducts").innerText = totalProducts;
  document.getElementById("totalOrders").innerText = totalOrders;
  document.getElementById("totalRevenue").innerText = "Rs " + revenue;

  renderChart(totalProducts, totalOrders, revenue);
}

/* =========================
REAL CHART FIX
========================= */
function renderChart(p, o, r) {
  const ctx = document.getElementById("analyticsChart");
  if (!ctx) return;

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
