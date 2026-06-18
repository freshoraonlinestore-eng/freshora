import {
  db,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  getDocs
} from "./firebase.js";

/* =========================
FRESHORA ADMIN FINAL PRO
========================= */

const CLOUD_NAME = "dayvblw7g";
const UPLOAD_PRESET = "freshora_upload";

let products = [];
let orders = [];
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
IMAGE UPLOAD
========================= */
async function uploadImages(files) {
  let urls = [];

  if (!files) return urls;

  for (let i = 0; i < files.length && i < 3; i++) {
    let form = new FormData();
    form.append("file", files[i]);
    form.append("upload_preset", UPLOAD_PRESET);

    let res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: form }
    );

    let data = await res.json();
    if (data.secure_url) urls.push(data.secure_url);
  }

  return urls;
}

/* =========================
PRODUCT ADD
========================= */
window.uploadAndAddProduct = async () => {
  try {
    const name = $("pname")?.value;
    if (!name) return toast("Enter product name");

    const images = await uploadImages($("pimageFile")?.files);

    await addDoc(collection(db, "products"), {
      name,
      price: Number($("pprice").value || 0),
      discount: Number($("pdiscount").value || 0),
      stock: Number($("pstock").value || 0),
      desc: $("pdesc").value || "",
      category: $("pcategorySelect").value || "Other",
      images,
      createdAt: Date.now()
    });

    toast("Product Added ✅");
    clearForm();
  } catch (e) {
    console.error(e);
    toast("Error adding product");
  }
};

/* =========================
UPDATE PRODUCT
========================= */
window.updateSelected = async () => {
  if (!selectedId) return toast("Select product first");

  try {
    await updateDoc(doc(db, "products", selectedId), {
      name: $("pname").value,
      price: Number($("pprice").value || 0),
      discount: Number($("pdiscount").value || 0),
      stock: Number($("pstock").value || 0),
      desc: $("pdesc").value || "",
      category: $("pcategorySelect").value || "Other"
    });

    toast("Updated ✅");
    clearForm();
  } catch (e) {
    toast("Update failed");
  }
};

/* =========================
DELETE PRODUCT
========================= */
window.deleteProduct = async (id) => {
  if (!confirm("Delete product?")) return;

  await deleteDoc(doc(db, "products", id));
  toast("Deleted");
};

/* =========================
SELECT PRODUCT
========================= */
window.selectProduct = (id) => {
  const p = products.find(x => x.id === id);
  if (!p) return;

  selectedId = id;

  $("pname").value = p.name || "";
  $("pprice").value = p.price || 0;
  $("pdiscount").value = p.discount || 0;
  $("pstock").value = p.stock || 0;
  $("pdesc").value = p.desc || "";
  $("pcategorySelect").value = p.category || "Other";

  toast("Selected");
};

/* =========================
CLEAR FORM
========================= */
window.clearForm = () => {
  ["pname","pprice","pdiscount","pstock","pdesc"].forEach(id => {
    if ($(id)) $(id).value = "";
  });

  if ($("pimageFile")) $("pimageFile").value = "";

  selectedId = null;
};

/* =========================
RENDER PRODUCTS
========================= */
function renderTable(data) {
  const start = (currentPage - 1) * perPage;
  const paginated = data.slice(start, start + perPage);

  const body = $("productListBody");
  if (!body) return;

  body.innerHTML = paginated.map(p => {
    const final = p.price - (p.price * p.discount / 100);

    return `
      <tr onclick="selectProduct('${p.id}')">
        <td><img src="${p.images?.[0] || ''}" width="40"></td>
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
PRODUCTS LISTENER (SINGLE)
========================= */
onSnapshot(collection(db, "products"), snap => {
  products = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  const totalStock = products.reduce((a,b)=>a+(b.stock||0),0);
  const lowStock = products.filter(p => p.stock < 5).length;

  if ($("totalProducts")) $("totalProducts").innerText = products.length;
  if ($("totalStock")) $("totalStock").innerText = totalStock;
  if ($("lowStock")) $("lowStock").innerText = lowStock;

  renderTable(products);
});

/* =========================
SEARCH
========================= */
window.addEventListener("DOMContentLoaded", () => {
  const search = $("adminSearch");

  if (search) {
    search.addEventListener("input", e => {
      const v = e.target.value.toLowerCase();

      const filtered = products.filter(p =>
        (p.name || "").toLowerCase().includes(v) ||
        (p.category || "").toLowerCase().includes(v)
      );

      renderTable(filtered);
    });
  }
});

/* =========================
ORDERS (SINGLE LISTENER FIXED)
========================= */
onSnapshot(collection(db, "orders"), snap => {
  orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  let revenue = 0;
  const tbody = $("orderList");
  if (!tbody) return;

  tbody.innerHTML = orders.length ? orders.map(o => {
    revenue += Number(o.totalBill || 0);

    return `
      <tr>
        <td onclick="showCustomer('${o.id}')">${o.id.slice(-5)}</td>
        <td>${o.customerName || ""}</td>
        <td>${o.phone || ""}</td>
        <td>${o.district || ""}</td>
        <td>Rs ${o.totalBill || 0}</td>
        <td>${o.status || "Pending"}</td>
        <td>
          <button onclick="updateOrderStatus('${o.id}','Confirmed')">✔</button>
          <button onclick="updateOrderStatus('${o.id}','Shipped')">🚚</button>
          <button onclick="updateOrderStatus('${o.id}','Delivered')">📦</button>
        </td>
      </tr>
    `;
  }).join("") : `<tr><td colspan="7">No Orders</td></tr>`;

  if ($("totalRevenue")) $("totalRevenue").innerText = "Rs " + revenue;
});

/* =========================
ORDER STATUS + WHATSAPP SAFE
========================= */
window.updateOrderStatus = async (id, status) => {
  try {
    await updateDoc(doc(db, "orders", id), { status });

    const phone = "+94752425790";
    const msg = `Order ${id} updated to ${status}`;

    // safe whatsapp open
    setTimeout(() => {
      window.open(
        `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
        "_blank"
      );
    }, 300);

    toast("Updated + WhatsApp sent");
  } catch (e) {
    toast("Update failed");
  }
};

/* =========================
CUSTOMER POPUP (SAFE)
========================= */
window.showCustomer = async (id) => {
  try {
    const snap = await getDocs(collection(db, "orders"));
    const order = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .find(o => o.id === id);

    if (!order) return;

    alert(
`Customer: ${order.customerName}
Phone: ${order.phone}
Address: ${order.address}
District: ${order.district}
Total: Rs ${order.totalBill}
Status: ${order.status}`
    );
  } catch (e) {
    toast("Error loading customer");
  }
};

/* =========================
PLACEHOLDER FUNCTIONS SAFE
========================= */
window.addCategory = () => toast("Category UI pending connect");
window.saveDeliveryFee = () => toast("Delivery UI pending connect");
window.logout = () => {
  localStorage.removeItem("admin");
  location.href = "login.html";
};
