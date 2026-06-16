import {
  db,
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc
} from "./firebase.js";

/* =========================
STATE
========================= */
let products = [];
let orders = [];
let categories = [];
let deliveryFee = 375;

/* =========================
INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  loadAnalytics();
});

/* =========================
UPLOAD MULTI IMAGE (MAX 3)
========================= */
async function uploadImages(files) {
  const urls = [];

  if (!files) return urls;

  const limit = Math.min(files.length, 3);

  for (let i = 0; i < limit; i++) {
    const formData = new FormData();
    formData.append("file", files[i]);
    formData.append("upload_preset", "freshora_upload");
    formData.append("folder", "freshora/products");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dayvblw7g/image/upload",
      {
        method: "POST",
        body: formData
      }
    );

    const data = await res.json();
    urls.push(data.secure_url);
  }

  return urls;
}

/* =========================
ADD / UPDATE PRODUCT
========================= */
window.uploadAndAddProduct = async () => {
  const name = document.getElementById("pname").value;
  const price = Number(document.getElementById("pprice").value || 0);
  const discount = Number(document.getElementById("pdiscount").value || 0);
  const category = document.getElementById("pcategory").value;
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
    description: desc,
    stock: 10,
    images,
    image: images[0] || "",
    createdAt: new Date().toISOString()
  });

  alert("Product saved ✅");
};

/* =========================
DELETE PRODUCT
========================= */
window.deleteProduct = async (id) => {
  await deleteDoc(doc(db, "products", id));
};

/* =========================
UPDATE PRODUCT
========================= */
window.updateProduct = async () => {
  const id = document.getElementById("editId").value;

  if (!id) return alert("Enter product ID");

  await updateDoc(doc(db, "products", id), {
    name: document.getElementById("editName").value,
    price: Number(document.getElementById("editPrice").value),
    discount: Number(document.getElementById("editDiscount").value)
  });

  alert("Updated ✅");
};

/* =========================
LOAD PRODUCTS
========================= */
onSnapshot(collection(db, "products"), (snap) => {
  const list = document.getElementById("productList");

  products = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

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

  loadAnalytics();
});

/* =========================
LOAD ORDERS
========================= */
onSnapshot(collection(db, "orders"), (snap) => {
  const list = document.getElementById("orderList");

  orders = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  if (!list) return;

  list.innerHTML = orders.map(o => `
    <div class="admin-card">
      <h4>${o.orderId}</h4>
      <p>${o.customer?.name}</p>
      <p>Rs ${o.total}</p>

      <select onchange="updateOrderStatus('${o.id}', this.value)">
        <option ${o.status === "Pending" ? "selected" : ""}>Pending</option>
        <option ${o.status === "Delivered" ? "selected" : ""}>Delivered</option>
      </select>
    </div>
  `).join("");

  loadAnalytics();
});

/* =========================
ORDER STATUS
========================= */
window.updateOrderStatus = async (id, status) => {
  await updateDoc(doc(db, "orders", id), { status });
};

/* =========================
CATEGORIES SYSTEM
========================= */
function loadCategories() {
  onSnapshot(collection(db, "categories"), (snap) => {
    categories = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const input = document.getElementById("pcategory");
    if (input) {
      input.innerHTML = "";
      categories.forEach(c => {
        input.innerHTML += `<option value="${c.name}">${c.name}</option>`;
      });
    }
  });
}

/* =========================
DELIVERY FEE CONTROL
========================= */
function getDeliveryFee(subtotal) {
  return subtotal > 5000 ? 0 : deliveryFee;
}

/* =========================
ANALYTICS
========================= */
function loadAnalytics() {
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
CHART
========================= */
function renderChart(p, o, r) {
  const ctx = document.getElementById("analyticsChart");

  if (!ctx || typeof Chart === "undefined") return;

  if (window.myChart) window.myChart.destroy();

  window.myChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Products", "Orders", "Revenue"],
      datasets: [{
        data: [p, o, r]
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
