import {
  db,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc
} from "./firebase.js";

/* =========================
FRESHORA ADMIN V7 CORE
========================= */

const CLOUD_NAME = "dayvblw7g";
const UPLOAD_PRESET = "freshora_upload";

let products = [];
let selectedId = null;
let currentPage = 1;
const perPage = 10;

const $ = (id) => document.getElementById(id);

/* =========================
TOAST
========================= */
function toast(msg) {
  let t = document.querySelector(".admin-toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "admin-toast";
    document.body.appendChild(t);
  }
  t.innerText = msg;
  t.style.display = "block";
  setTimeout(() => (t.style.display = "none"), 2500);
}

/* =========================
IMAGE UPLOAD (1-3 IMAGES)
========================= */
async function uploadImages(files) {
  let urls = [];

  for (let i = 0; i < files.length && i < 3; i++) {
    let form = new FormData();
    form.append("file", files[i]);
    form.append("upload_preset", UPLOAD_PRESET);

    let res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: form }
    );

    let data = await res.json();
    urls.push(data.secure_url);
  }

  return urls;
}

/* =========================
ADD PRODUCT
========================= */
window.uploadAndAddProduct = async () => {
  try {
    const name = $("pname").value;
    if (!name) return toast("Name required");

    const files = $("pimageFile").files;
    const images = await uploadImages(files);

    await addDoc(collection(db, "products"), {
      name,
      price: Number($("pprice").value),
      discount: Number($("pdiscount").value || 0),
      stock: Number($("pstock").value || 0),
      desc: $("pdesc").value,
      category: $("pcategorySelect").value,
      images,
      createdAt: Date.now()
    });

    toast("Product Added ✅");
    clearForm();
  } catch (e) {
    toast("Error adding product");
  }
};

/* =========================
UPDATE PRODUCT
========================= */
window.updateSelected = async () => {
  if (!selectedId) return toast("Select product first");

  await updateDoc(doc(db, "products", selectedId), {
    name: $("pname").value,
    price: Number($("pprice").value),
    discount: Number($("pdiscount").value),
    stock: Number($("pstock").value),
    desc: $("pdesc").value,
    category: $("pcategorySelect").value
  });

  toast("Updated ✅");
  clearForm();
};

/* =========================
DELETE PRODUCT
========================= */
window.deleteProduct = async (id) => {
  if (confirm("Delete product?")) {
    await deleteDoc(doc(db, "products", id));
    toast("Deleted");
  }
};

/* =========================
SELECT PRODUCT
========================= */
window.selectProduct = (id) => {
  let p = products.find(x => x.id === id);
  if (!p) return;

  selectedId = id;

  $("pname").value = p.name;
  $("pprice").value = p.price;
  $("pdiscount").value = p.discount;
  $("pstock").value = p.stock;
  $("pdesc").value = p.desc || "";
  $("pcategorySelect").value = p.category || "Other";

  toast("Selected");
};

/* =========================
CLEAR FORM
========================= */
window.clearForm = () => {
  ["pname","pprice","pdiscount","pstock","pdesc"].forEach(i => $(i).value = "");
  $("pimageFile").value = "";
  selectedId = null;
};

/* =========================
RENDER PRODUCTS (SEARCH + PAGINATION)
========================= */
function renderTable(data) {
  let start = (currentPage - 1) * perPage;
  let paginated = data.slice(start, start + perPage);

  const body = $("productListBody");

  body.innerHTML = paginated.map(p => {
    let final = p.price - (p.price * p.discount / 100);

    return `
      <tr onclick="selectProduct('${p.id}')">
        <td>
          <img src="${p.images?.[0] || ''}" width="40">
        </td>
        <td>${p.name}</td>
        <td>Rs ${p.price}</td>
        <td>${p.discount}%</td>
        <td>Rs ${final}</td>
        <td>${p.category}</td>
        <td>${p.stock < 5 ? "⚠️ " + p.stock : p.stock}</td>
        <td>
          <button onclick="event.stopPropagation(); deleteProduct('${p.id}')">🗑</button>
        </td>
      </tr>
    `;
  }).join("");
}

/* =========================
LIVE FIREBASE PRODUCTS
========================= */
onSnapshot(collection(db, "products"), snap => {
  products = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  $("totalProducts").innerText = products.length;
  $("totalStock").innerText = products.reduce((a,b)=>a+(b.stock||0),0);
  $("lowStock").innerText = products.filter(p=>p.stock<5).length;

  renderTable(products);
});

/* =========================
SEARCH
========================= */
window.addEventListener("DOMContentLoaded", () => {
  $("adminSearch").addEventListener("input", e => {
    let v = e.target.value.toLowerCase();

    let filtered = products.filter(p =>
      p.name.toLowerCase().includes(v) ||
      (p.category || "").toLowerCase().includes(v)
    );

    renderTable(filtered);
  });
});

/* =========================
PLACEHOLDER (NEXT PART)
========================= */
window.addCategory = async () => toast("Next part");
window.saveDeliveryFee = async () => toast("Next part");
window.logout = () => {
  localStorage.removeItem("admin");
  location.href = "login.html";
};

/* =========================
ORDERS SYSTEM + WHATSAPP
========================= */

function getStatusColor(status) {
  switch (status) {
    case "Pending": return "orange";
    case "Confirmed": return "blue";
    case "Shipped": return "purple";
    case "Delivered": return "green";
    default: return "gray";
  }
}

/* =========================
LIVE ORDERS
========================= */
onSnapshot(collection(db, "orders"), (snap) => {
  const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  let totalRevenue = 0;

  const tbody = document.getElementById("orderList");

  tbody.innerHTML = orders.length ? orders.map(o => {
    totalRevenue += Number(o.totalBill || 0);

    return `
      <tr>
        <td onclick="showCustomer('${o.id}')">${o.id.slice(-5)}</td>
        <td>${o.customerName}</td>
        <td>${o.phone}</td>
        <td>${o.district}</td>
        <td>Rs ${o.totalBill}</td>
        <td style="color:${getStatusColor(o.status)}">
          ${o.status}
        </td>
        <td>
          <button onclick="updateOrderStatus('${o.id}','Confirmed')">✔</button>
          <button onclick="updateOrderStatus('${o.id}','Shipped')">🚚</button>
          <button onclick="updateOrderStatus('${o.id}','Delivered')">📦</button>
        </td>
      </tr>
    `;
  }).join("") : `<tr><td colspan="7">No Orders</td></tr>`;

  const revenueEl = document.getElementById("totalRevenue");
  if (revenueEl) revenueEl.innerText = "Rs " + totalRevenue;
});

/* =========================
ORDER STATUS UPDATE + WHATSAPP
========================= */
window.updateOrderStatus = async (id, status) => {
  try {
    const ref = doc(db, "orders", id);
    await updateDoc(ref, { status });

    // send whatsapp
    const phone = "+94752425790";
    const msg = `Order ${id} status updated to: ${status}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`);

    toast("Status Updated & WhatsApp Sent");
  } catch (e) {
    toast("Error updating order");
  }
};

/* =========================
CUSTOMER POPUP
========================= */
window.showCustomer = async (id) => {
  const snap = await getDocs(collection(db, "orders"));
  const order = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .find(o => o.id === id);

  if (!order) return;

  alert(`
Customer: ${order.customerName}
Phone: ${order.phone}
Address: ${order.address}
District: ${order.district}
Total: Rs ${order.totalBill}
Status: ${order.status}
  `);
};

let chart;

function loadChart(data) {
  const ctx = document.getElementById("analyticsChart");

  const labels = data.map(d => new Date(d.createdAt).toLocaleDateString());
  const values = data.map(d => d.totalBill || 0);

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Sales",
        data: values,
        borderColor: "green",
        fill: false
      }]
    }
  });
}

/* attach to orders */
onSnapshot(collection(db, "orders"), (snap) => {
  const orders = snap.docs.map(d => d.data());
  loadChart(orders);
});

window.addCoupon = async () => {
  const code = document.getElementById("couponCode").value;
  const discount = document.getElementById("couponDiscount").value;

  if (!code) return toast("Enter coupon");

  await addDoc(collection(db, "coupons"), {
    code,
    discount: Number(discount),
    createdAt: Date.now()
  });

  toast("Coupon Added");
};

window.uploadBanner = async () => {
  const file = document.getElementById("bannerUpload").files[0];
  if (!file) return toast("Select image");

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: form }
  );

  const data = await res.json();

  await addDoc(collection(db, "banners"), {
    image: data.secure_url,
    createdAt: Date.now()
  });

  toast("Banner Uploaded");
};

window.exportCSV = () => {
  let csv = "Name,Price,Discount,Stock\n";

  products.forEach(p => {
    csv += `${p.name},${p.price},${p.discount},${p.stock}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "products.csv";
  a.click();
};

window.bulkDelete = async (ids) => {
  if (!confirm("Delete selected products?")) return;

  for (let id of ids) {
    await deleteDoc(doc(db, "products", id));
  }

  toast("Bulk Deleted");
};

window.nextPage = () => {
  currentPage++;
  renderTable(products);
};

window.prevPage = () => {
  if (currentPage > 1) currentPage--;
  renderTable(products);
};

window.sendPush = async (title, body) => {
  await addDoc(collection(db, "notifications"), {
    title,
    body,
    createdAt: Date.now()
  });

  toast("Push Saved (FCM Ready)");
};

window.saveDeliveryFee = async () => {
  const district = document.getElementById("districtSelect").value;
  const cost = document.getElementById("deliveryCost").value;

  await addDoc(collection(db, "deliveryFees"), {
    district,
    cost: Number(cost)
  });

  toast("Delivery Saved");
};
