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
