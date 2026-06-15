document.body.insertAdjacentHTML(
  "beforeend",
  "<div style='position:fixed;bottom:50px;right:10px;background:blue;color:white;padding:8px;z-index:9999'>JS OK</div>"
);

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
STATE
========================= */
let editId = null;
let productsCache = [];
let ordersCache = [];

/* =========================
UPLOAD IMAGE (Cloudinary)
========================= */
const CLOUD_NAME = "dayvblw7g";
const UPLOAD_PRESET = "freshora_upload";

async function uploadImage(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", "freshora/products");

    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
    );

    const data = await res.json();
    return data.secure_url;
}

/* =========================
ADD / UPDATE PRODUCT (FIXED)
========================= */
window.uploadAndAddProduct = async () => {

    const name = document.getElementById("pname").value;
    const price = document.getElementById("pprice").value;
    const discount = document.getElementById("pdiscount").value;
    const category = document.getElementById("pcategory").value;
    const desc = document.getElementById("pdesc").value;
    const file = document.getElementById("pimageFile").files[0];

    if (!name || !price || !category) {
        alert("Fill required fields");
        return;
    }

    let imageUrl = "";

    if (file) {
        imageUrl = await uploadImage(file);
    }

    const productData = {
        name,
        price: Number(price),
        discount: Number(discount || 0),
        category,
        description: desc,
        createdAt: new Date().toISOString()
    };

    if (imageUrl) productData.image = imageUrl;

    /* UPDATE MODE */
    if (editId) {

        await updateDoc(doc(db, "products", editId), productData);

        alert("Product Updated ✅");
        editId = null;

    } else {

        await addDoc(collection(db, "products"), productData);

        alert("Product Added ✅");
    }

    clearForm();
};

/* =========================
CLEAR FORM
========================= */
function clearForm() {
    document.getElementById("pname").value = "";
    document.getElementById("pprice").value = "";
    document.getElementById("pdiscount").value = "";
    document.getElementById("pcategory").value = "";
    document.getElementById("pdesc").value = "";
    document.getElementById("pimageFile").value = "";
}

/* =========================
EDIT PRODUCT (ONE CLICK)
========================= */
window.editProduct = (id) => {

    const p = productsCache.find(x => x.id === id);
    if (!p) return;

    editId = id;

    document.getElementById("pname").value = p.name;
    document.getElementById("pprice").value = p.price;
    document.getElementById("pdiscount").value = p.discount;
    document.getElementById("pcategory").value = p.category;
    document.getElementById("pdesc").value = p.description;

    alert("Edit mode ON ✏️ Update then click Save");
};

/* =========================
DELETE PRODUCT
========================= */
window.deleteProduct = async (id) => {
    await deleteDoc(doc(db, "products", id));
};

/* =========================
LOAD PRODUCTS (FIXED UI + CATEGORY)
========================= */
onSnapshot(collection(db, "products"), (snap) => {

    const list = document.getElementById("productList");

    productsCache = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
    }));

    /* CATEGORY UNIQUE LIST (AUTO) */
    const categories = [...new Set(productsCache.map(p => p.category))];

    let html = `
        <div class="category-bar">
            <button onclick="filterCategory('all')">All</button>
            ${categories.map(c =>
                `<button onclick="filterCategory('${c}')">${c}</button>`
            ).join("")}
        </div>
    `;

    html += productsCache.map(p => `
        <div class="admin-card">

            <img src="${p.image || ''}">

            <div>
                <h4>${p.name}</h4>
                <p>Rs ${p.price}</p>
                <small>${p.category}</small>
            </div>

            <div class="admin-actions">
                <button onclick="editProduct('${p.id}')">Edit</button>
                <button onclick="deleteProduct('${p.id}')">Delete</button>
            </div>

        </div>
    `).join("");

    list.innerHTML = html;

    updateAnalytics();
});

/* =========================
CATEGORY FILTER (NEW)
========================= */
window.filterCategory = (cat) => {

    const list = document.getElementById("productList");

    let filtered = productsCache;

    if (cat !== "all") {
        filtered = productsCache.filter(p => p.category === cat);
    }

    list.innerHTML = filtered.map(p => `
        <div class="admin-card">

            <img src="${p.image || ''}">

            <div>
                <h4>${p.name}</h4>
                <p>Rs ${p.price}</p>
                <small>${p.category}</small>
            </div>

            <div class="admin-actions">
                <button onclick="editProduct('${p.id}')">Edit</button>
                <button onclick="deleteProduct('${p.id}')">Delete</button>
            </div>

        </div>
    `).join("");
};

/* =========================
LOAD ORDERS
========================= */
onSnapshot(collection(db, "orders"), (snap) => {

    const list = document.getElementById("orderList");

    ordersCache = snap.docs.map(d => d.data());

    list.innerHTML = ordersCache.map(o => `
        <div class="admin-order">

            <h4>${o.orderId}</h4>
            <p>${o.customer?.name}</p>
            <p>${o.total} LKR</p>

        </div>
    `).join("");

    updateAnalytics();
});

/* =========================
ANALYTICS
========================= */
function updateAnalytics() {

    const totalProducts = productsCache.length;
    const totalOrders = ordersCache.length;

    let revenue = 0;

    ordersCache.forEach(o => {
        revenue += o.total || 0;
    });

    document.getElementById("totalProducts").innerText = totalProducts;
    document.getElementById("totalOrders").innerText = totalOrders;
    document.getElementById("totalRevenue").innerText = "Rs " + revenue;

    drawChart(totalProducts, totalOrders);
}

/* =========================
CHART
========================= */
function drawChart(products, orders) {

    const ctx = document.getElementById("analyticsChart");
    if (!ctx || typeof Chart === "undefined") return;

    if (window.adminChart) window.adminChart.destroy();

    window.adminChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Products", "Orders"],
            datasets: [{
                data: [products, orders],
                backgroundColor: ["#22c55e", "#15803d"]
            }]
        },
        options: {
            plugins: { legend: { display: false } }
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
