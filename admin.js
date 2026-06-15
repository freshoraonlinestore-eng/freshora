import { db, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from "./firebase.js";

/* =========================
CLOUDINARY CONFIG
========================= */
const CLOUD_NAME = "dayvblw7g";
const UPLOAD_PRESET = "freshora_upload";

/* =========================
DEBUG (ANDROID SAFE)
========================= */
console.log("🔥 ADMIN JS LOADED");

document.body.insertAdjacentHTML(
    "beforeend",
    "<div style='position:fixed;bottom:10px;right:10px;background:#000;color:#fff;padding:6px 10px;z-index:99999;font-size:12px'>ADMIN JS OK</div>"
);

/* =========================
STATE
========================= */
let allProducts = [];
let allOrders = [];

/* =========================
UPLOAD IMAGE
========================= */
async function uploadImage(file) {

    if (!file) return "";

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
    return data.secure_url || "";
}

/* =========================
ADD / UPDATE PRODUCT
========================= */
window.uploadAndAddProduct = async () => {

    const id = document.getElementById("editId")?.value;

    const name = document.getElementById("pname").value;
    const price = Number(document.getElementById("pprice").value);
    const discount = Number(document.getElementById("pdiscount").value || 0);
    const category = document.getElementById("pcategory").value;
    const description = document.getElementById("pdesc").value;
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
        price,
        discount,
        category,
        description,
        createdAt: new Date().toISOString()
    };

    if (imageUrl) {
        productData.image = imageUrl;
    }

    /* UPDATE */
    if (id) {

        await updateDoc(doc(db, "products", id), productData);
        alert("Product Updated ✅");

    } 
    /* ADD */
    else {

        await addDoc(collection(db, "products"), productData);
        alert("Product Added ✅");
    }

    clearForm();
};

/* =========================
CLEAR FORM
========================= */
function clearForm() {
    document.getElementById("editId").value = "";
    document.getElementById("pname").value = "";
    document.getElementById("pprice").value = "";
    document.getElementById("pdiscount").value = "";
    document.getElementById("pcategory").value = "";
    document.getElementById("pdesc").value = "";
    document.getElementById("pimageFile").value = "";
}

/* =========================
DELETE PRODUCT
========================= */
window.deleteProduct = async (id) => {
    await deleteDoc(doc(db, "products", id));
    alert("Deleted ❌");
};

/* =========================
EDIT PRODUCT (FILL FORM)
========================= */
window.editProduct = (p) => {

    document.getElementById("editId").value = p.id;
    document.getElementById("pname").value = p.name;
    document.getElementById("pprice").value = p.price;
    document.getElementById("pdiscount").value = p.discount;
    document.getElementById("pcategory").value = p.category;
    document.getElementById("pdesc").value = p.description;

    window.scrollTo({ top: 0, behavior: "smooth" });
};

/* =========================
LOAD PRODUCTS (REAL TIME)
========================= */
onSnapshot(collection(db, "products"), (snap) => {

    allProducts = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
    }));

    const list = document.getElementById("productList");

    if (!list) return;

    list.innerHTML = allProducts.map(p => `
        <div style="
            background:#fff;
            padding:10px;
            margin:8px;
            border-radius:10px;
            box-shadow:0 5px 15px rgba(0,0,0,0.05)
        ">

            <img src="${p.image || ''}" width="60" style="border-radius:6px">

            <h4>${p.name}</h4>
            <p>Rs ${p.price}</p>
            <p>${p.category || ""}</p>

            <button onclick='editProduct(${JSON.stringify(p)})'>
                Edit
            </button>

            <button onclick="deleteProduct('${p.id}')">
                Delete
            </button>

        </div>
    `).join("");

    updateAnalytics();
});

/* =========================
LOAD ORDERS
========================= */
onSnapshot(collection(db, "orders"), (snap) => {

    allOrders = snap.docs.map(d => d.data());

    const list = document.getElementById("orderList");

    if (!list) return;

    list.innerHTML = allOrders.map(o => `
        <div style="
            background:#fff;
            padding:10px;
            margin:8px;
            border-radius:10px;
            box-shadow:0 5px 15px rgba(0,0,0,0.05)
        ">

            <h4>${o.orderId}</h4>
            <p>${o.customer?.name}</p>
            <p>Rs ${o.total}</p>

        </div>
    `).join("");

    updateAnalytics();
});

/* =========================
ANALYTICS
========================= */
function updateAnalytics() {

    document.getElementById("totalProducts").innerText =
        allProducts.length;

    document.getElementById("totalOrders").innerText =
        allOrders.length;

    const revenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    document.getElementById("totalRevenue").innerText =
        revenue;

    drawChart();
}

/* =========================
CHART
========================= */
function drawChart() {

    const ctx = document.getElementById("analyticsChart");

    if (!ctx) return;

    if (window.myChart) window.myChart.destroy();

    window.myChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Products", "Orders", "Revenue"],
            datasets: [{
                label: "Overview",
                data: [
                    allProducts.length,
                    allOrders.length,
                    allOrders.reduce((s, o) => s + (o.total || 0), 0)
                ],
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
