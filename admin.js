import {
    db,
    collection,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc
} from "./firebase.js";

/* =========================
STATE CACHE (NEW - SAFE ADD)
========================= */
let productsCache = [];
let ordersCache = [];
let chartInstance = null;

/* =========================
IMAGE HANDLING (SAFE)
========================= */
async function getImageUrl(file) {
    if (!file) return "";

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

/* =========================
ADD PRODUCT (UNCHANGED LOGIC + SAFE FIX)
========================= */
window.uploadAndAddProduct = async () => {

    try {

        const name = document.getElementById("pname").value;
        const price = document.getElementById("pprice").value;
        const discount = document.getElementById("pdiscount").value;
        const category = document.getElementById("pcategory").value;
        const desc = document.getElementById("pdesc").value;
        const file = document.getElementById("pimageFile").files[0];

        if (!name || !price) {
            alert("Name & Price required");
            return;
        }

        const imageUrl = await getImageUrl(file);

        await addDoc(collection(db, "products"), {
            name,
            price: Number(price),
            discount: Number(discount || 0),
            category,
            description: desc,
            image: imageUrl,
            createdAt: new Date().toISOString()
        });

        alert("Product Saved ✅");

    } catch (err) {
        console.error(err);
        alert("Error saving product");
    }
};

/* =========================
DELETE PRODUCT
========================= */
window.deleteProduct = async (id) => {
    await deleteDoc(doc(db, "products", id));
};

/* =========================
ANALYTICS UPDATE (NEW FIX)
========================= */
function updateAnalytics() {

    const p = document.getElementById("totalProducts");
    const o = document.getElementById("totalOrders");
    const r = document.getElementById("totalRevenue");

    const productCount = productsCache.length;
    const orderCount = ordersCache.length;

    let revenue = 0;
    ordersCache.forEach(o => {
        revenue += Number(o.total || 0);
    });

    if (p) p.innerText = productCount;
    if (o) o.innerText = orderCount;
    if (r) r.innerText = "Rs " + revenue;

    renderChart(productCount, orderCount, revenue);
}

/* =========================
CHART (SAFE INIT)
========================= */
function renderChart(products, orders, revenue) {

    const ctx = document.getElementById("analyticsChart");

    if (!ctx || typeof Chart === "undefined") return;

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Products", "Orders", "Revenue"],
            datasets: [{
                label: "Analytics",
                data: [products, orders, revenue],
                backgroundColor: ["#1f8f4d", "#15803d", "#25d366"]
            }]
        }
    });
}

/* =========================
LOAD PRODUCTS (FIXED)
========================= */
function loadProducts() {

    const list = document.getElementById("productList");

    if (!list) return;

    onSnapshot(collection(db, "products"), (snap) => {

        productsCache = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

        updateAnalytics();

        list.innerHTML = productsCache.map(p => `
            <div style="padding:10px;margin:10px;background:#fff;border-radius:10px">

                <img src="${p.image}" width="60">

                <h4>${p.name}</h4>
                <p>Rs ${p.price}</p>

                <button onclick="deleteProduct('${p.id}')">
                    Delete
                </button>

            </div>
        `).join("");
    });
}

/* =========================
LOAD ORDERS (FIXED)
========================= */
function loadOrders() {

    const list = document.getElementById("orderList");

    if (!list) return;

    onSnapshot(collection(db, "orders"), (snap) => {

        ordersCache = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

        updateAnalytics();

        list.innerHTML = ordersCache.map(o => `
            <div style="padding:10px;margin:10px;background:#fff;border-radius:10px">

                <h4>${o.orderId}</h4>
                <p>${o.customer?.name || ""}</p>
                <p>Rs ${o.total || 0}</p>

            </div>
        `).join("");
    });
}

/* =========================
INIT (IMPORTANT)
========================= */
window.addEventListener("DOMContentLoaded", () => {
    loadProducts();
    loadOrders();
});

/* =========================
LOGOUT
========================= */
window.logout = () => {
    localStorage.removeItem("admin");
    window.location.href = "login.html";
};
