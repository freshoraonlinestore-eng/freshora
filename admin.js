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
CLOUDINARY CONFIG
========================= */
const CLOUD_NAME = "dayvblw7g";
const UPLOAD_PRESET = "freshora_upload";

/* =========================
STATE
========================= */
let editId = null;
let productsCache = [];
let ordersCache = [];

/* =========================
UPLOAD IMAGE
========================= */
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
ADD / UPDATE PRODUCT
========================= */
window.uploadAndAddProduct = async () => {

    const name = document.getElementById("pname").value;
    const price = document.getElementById("pprice").value;
    const discount = document.getElementById("pdiscount").value;
    const category = document.getElementById("pcategory").value;
    const desc = document.getElementById("pdesc").value;
    const file = document.getElementById("pimageFile").files[0];

    if (!name || !price) {
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

    if (imageUrl) {
        productData.image = imageUrl;
    }

    /* ================= EDIT MODE ================= */
    if (editId) {
        await updateDoc(doc(db, "products", editId), productData);
        editId = null;
        alert("Product Updated ✅");
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
EDIT PRODUCT
========================= */
window.editProduct = (id) => {
    const p = productsCache.find(x => x.id === id);
    if (!p) return;

    editId = id;

    document.getElementById("pname").value = p.name || "";
    document.getElementById("pprice").value = p.price || "";
    document.getElementById("pdiscount").value = p.discount || "";
    document.getElementById("pcategory").value = p.category || "";
    document.getElementById("pdesc").value = p.description || "";

    alert("Edit mode enabled ✏️");
};

/* =========================
DELETE PRODUCT
========================= */
window.deleteProduct = async (id) => {
    await deleteDoc(doc(db, "products", id));
};

/* =========================
LOAD PRODUCTS
========================= */
onSnapshot(collection(db, "products"), (snap) => {

    const list = document.getElementById("productList");

    productsCache = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
    }));

    list.innerHTML = productsCache.map(p => `
        <div class="admin-card">

            <img src="${p.image || ''}" />

            <div>
                <h4>${p.name}</h4>
                <p>Rs ${p.price}</p>
                <p>${p.category || ''}</p>
            </div>

            <div class="admin-actions">

                <button onclick="editProduct('${p.id}')">Edit</button>

                <button onclick="deleteProduct('${p.id}')">Delete</button>

            </div>

        </div>
    `).join("");

    updateAnalytics();
});

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
CHART (Chart.js)
========================= */
function drawChart(products, orders) {

    const ctx = document.getElementById("analyticsChart");

    if (!ctx || typeof Chart === "undefined") return;

    if (window.adminChart) {
        window.adminChart.destroy();
    }

    window.adminChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Products", "Orders"],
            datasets: [{
                label: "Overview",
                data: [products, orders],
                backgroundColor: ["#22c55e", "#15803d"]
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
LOGOUT
========================= */
window.logout = () => {
    localStorage.removeItem("admin");
    window.location.href = "login.html";
};
