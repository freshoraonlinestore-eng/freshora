import {
  db,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc
} from "./firebase.js";

/* =========================
FRESHORA ADMIN V6 PRO MAX
FULL COMPLETE admin.js
========================= */

/* =========================
CLOUDINARY CONFIG
========================= */
const CLOUD_NAME = "dayvblw7g";
const UPLOAD_PRESET = "freshora_upload";

/* =========================
STATE
========================= */
let productsData = [];
let ordersData = [];
let analyticsChart = null;

/* =========================
UTILS
========================= */
function qs(id) {
  return document.getElementById(id);
}

function showToast(msg) {

  let toast = document.querySelector(".admin-toast");

  if (!toast) {

    toast = document.createElement("div");
    toast.className = "admin-toast";
    document.body.appendChild(toast);
  }

  toast.innerText = msg;
  toast.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function formatPrice(v) {
  return Number(v || 0).toLocaleString();
}

/* =========================
IMAGE UPLOAD
========================= */
async function uploadImage(file) {

  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "freshora/products");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData
    }
  );

  const data = await res.json();

  if (!data.secure_url) {
    throw new Error("Image upload failed");
  }

  return data.secure_url;
}

/* =========================
CLEAR FORM
========================= */
function clearForm() {

  qs("pname").value = "";
  qs("pprice").value = "";
  qs("pdiscount").value = "";
  qs("pcategory").value = "";
  qs("pdesc").value = "";
  qs("pimageFile").value = "";
}

/* =========================
ADD PRODUCT
========================= */
window.uploadAndAddProduct = async () => {

  try {

    const name = qs("pname").value.trim();
    const price = qs("pprice").value.trim();
    const discount = qs("pdiscount").value.trim();
    const category = qs("pcategory").value.trim();
    const desc = qs("pdesc").value.trim();
    const file = qs("pimageFile").files[0];

    if (!name || !price) {

      showToast("Fill required fields");
      return;
    }

    let imageUrl = "";

    if (file) {

      showToast("Uploading image...");

      imageUrl = await uploadImage(file);
    }

    await addDoc(collection(db, "products"), {

      name,
      price: Number(price),
      discount: Number(discount || 0),
      category,
      description: desc,
      image: imageUrl,

      stock: 100,
      active: true,

      createdAt: new Date().toISOString()

    });

    showToast("Product Added ✅");

    clearForm();

  } catch (err) {

    console.error(err);

    showToast("Add failed ❌");
  }
};

/* =========================
DELETE PRODUCT
========================= */
window.deleteProduct = async (id) => {

  const ok = confirm("Delete this product?");

  if (!ok) return;

  try {

    await deleteDoc(doc(db, "products", id));

    showToast("Product deleted");

  } catch (err) {

    console.error(err);

    showToast("Delete failed");
  }
};

/* =========================
EDIT PRODUCT
========================= */
window.editProduct = (id) => {

  const p = productsData.find(x => x.id === id);

  if (!p) return;

  qs("pname").value = p.name || "";
  qs("pprice").value = p.price || "";
  qs("pdiscount").value = p.discount || "";
  qs("pcategory").value = p.category || "";
  qs("pdesc").value = p.description || "";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  showToast("Edit mode loaded");
};

/* =========================
SEARCH PRODUCTS
========================= */
window.searchProducts = () => {

  const search =
    qs("adminSearch")
    ?.value
    .toLowerCase()
    .trim() || "";

  const filtered = productsData.filter(p => {

    return (
      (p.name || "")
      .toLowerCase()
      .includes(search)
    );

  });

  renderProducts(filtered);
};

/* =========================
RENDER PRODUCTS
========================= */
function renderProducts(data) {

  const list = qs("productList");

  if (!list) return;

  if (!data.length) {

    list.innerHTML = `
      <div class="empty-box">
        No products found
      </div>
    `;

    return;
  }

  list.innerHTML = data.map(p => {

    const finalPrice =
      p.discount > 0
      ? Math.round(
          p.price - (p.price * p.discount / 100)
        )
      : p.price;

    return `
    <div class="admin-card">

      <img
        src="${p.image || ""}"
        class="admin-product-img"
      >

      <div class="admin-card-content">

        <h4>${p.name || ""}</h4>

        <p>
          Rs ${formatPrice(finalPrice)}
        </p>

        <small>
          Category:
          ${p.category || "N/A"}
        </small>

        <div class="stock-row">

          ${
            p.stock <= 0
            ? `<span class="stock-badge out">
                Out Of Stock
               </span>`

            : p.stock <= 5
            ? `<span class="stock-badge low">
                Low Stock
               </span>`

            : `<span class="stock-badge in">
                In Stock
               </span>`
          }

        </div>

        <div class="admin-actions">

          <button
            class="edit-btn"
            onclick="editProduct('${p.id}')">

            <i class="fa-solid fa-pen"></i>
            Edit

          </button>

          <button
            class="delete-btn"
            onclick="deleteProduct('${p.id}')">

            <i class="fa-solid fa-trash"></i>
            Delete

          </button>

        </div>

      </div>

    </div>
    `;

  }).join("");
}

/* =========================
LOAD PRODUCTS
========================= */
onSnapshot(collection(db, "products"), (snap) => {

  productsData = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  renderProducts(productsData);

  if (qs("totalProducts")) {
    qs("totalProducts").innerText =
      productsData.length;
  }

  updateAnalytics();
});

/* =========================
RENDER ORDERS
========================= */
function renderOrders(data) {

  const list = qs("orderList");

  if (!list) return;

  if (!data.length) {

    list.innerHTML = `
      <div class="empty-box">
        No orders yet
      </div>
    `;

    return;
  }

  list.innerHTML = data.map(o => {

    return `
    <div class="order-card">

      <div class="order-top">

        <h4>${o.orderId || "ORDER"}</h4>

        <span class="order-status">
          Pending
        </span>

      </div>

      <p>
        👤 ${o.customer?.name || ""}
      </p>

      <p>
        📞 ${o.customer?.phone || ""}
      </p>

      <p>
        💰 Rs ${formatPrice(o.total || 0)}
      </p>

      <p>
        📍 ${o.customer?.address || ""}
      </p>

    </div>
    `;

  }).join("");
}

/* =========================
LOAD ORDERS
========================= */
onSnapshot(collection(db, "orders"), (snap) => {

  ordersData = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  renderOrders(ordersData);

  if (qs("totalOrders")) {
    qs("totalOrders").innerText =
      ordersData.length;
  }

  updateAnalytics();
});

/* =========================
ANALYTICS
========================= */
function updateAnalytics() {

  const totalRevenue =
    ordersData.reduce((sum, o) => {
      return sum + Number(o.total || 0);
    }, 0);

  if (qs("totalRevenue")) {

    qs("totalRevenue").innerText =
      "Rs " + formatPrice(totalRevenue);
  }

  const canvas =
    document.getElementById("analyticsChart");

  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  const ctx = canvas.getContext("2d");

  if (analyticsChart) {
    analyticsChart.destroy();
  }

  analyticsChart = new Chart(ctx, {

    type: "bar",

    data: {

      labels: [
        "Products",
        "Orders",
        "Revenue"
      ],

      datasets: [{

        label: "Freshora Analytics",

        data: [
          productsData.length,
          ordersData.length,
          totalRevenue
        ],

        borderWidth: 2,
        borderRadius: 10

      }]
    },

    options: {

      responsive: true,

      plugins: {

        legend: {
          display: false
        }
      }
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

/* =========================
AUTO INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {

  console.log("Freshora Admin V6 Loaded ✅");

  const searchInput =
    document.getElementById("adminSearch");

  if (searchInput) {

    searchInput.addEventListener(
      "input",
      searchProducts
    );
  }
});
