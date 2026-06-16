import {
    db,
    collection,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc
} from "./firebase.js";

/* =========================
STATE
========================= */
let productsCache = [];
let ordersCache = [];
let chartInstance = null;
let currentEditId = null;

/* =========================
UTIL
========================= */
function formatMoney(v) {
    return "Rs " + Number(v || 0).toLocaleString();
}

function showToast(msg) {

    let toast = document.getElementById("adminToast");

    if (!toast) {

        toast = document.createElement("div");
        toast.id = "adminToast";

        toast.style.position = "fixed";
        toast.style.bottom = "20px";
        toast.style.right = "20px";
        toast.style.background = "#111";
        toast.style.color = "#fff";
        toast.style.padding = "12px 18px";
        toast.style.borderRadius = "12px";
        toast.style.zIndex = "99999";
        toast.style.fontSize = "14px";

        document.body.appendChild(toast);
    }

    toast.innerText = msg;

    toast.style.display = "block";

    clearTimeout(window.adminToastTimeout);

    window.adminToastTimeout = setTimeout(() => {
        toast.style.display = "none";
    }, 2500);
}

/* =========================
IMAGE
========================= */
async function getImageUrl(file) {

    if (!file) return "";

    return new Promise((resolve) => {

        const reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result);
        };

        reader.readAsDataURL(file);
    });
}

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

    currentEditId = null;
}

/* =========================
ADD / UPDATE PRODUCT
========================= */
window.uploadAndAddProduct = async () => {

    try {

        const name =
            document.getElementById("pname").value.trim();

        const price =
            document.getElementById("pprice").value;

        const discount =
            document.getElementById("pdiscount").value;

        const category =
            document.getElementById("pcategory").value.trim();

        const desc =
            document.getElementById("pdesc").value.trim();

        const file =
            document.getElementById("pimageFile").files[0];

        if (!name || !price) {

            showToast("Name & price required");
            return;
        }

        let imageUrl = "";

        if (file) {
            imageUrl = await getImageUrl(file);
        }

        const payload = {
            name,
            price: Number(price),
            discount: Number(discount || 0),
            category,
            description: desc,
            createdAt: new Date().toISOString()
        };

        if (imageUrl) {
            payload.image = imageUrl;
        }

        /* UPDATE */
        if (currentEditId) {

            await deleteDoc(
                doc(db, "products", currentEditId)
            );

            await addDoc(
                collection(db, "products"),
                payload
            );

            showToast("Product Updated ✅");

        } else {

            await addDoc(
                collection(db, "products"),
                payload
            );

            showToast("Product Added ✅");
        }

        clearForm();

    } catch (err) {

        console.error(err);

        showToast("Error saving product");
    }
};

/* =========================
DELETE PRODUCT
========================= */
window.deleteProduct = async (id) => {

    const ok = confirm(
        "Delete this product?"
    );

    if (!ok) return;

    try {

        await deleteDoc(
            doc(db, "products", id)
        );

        showToast("Deleted");

    } catch (err) {

        console.error(err);

        showToast("Delete failed");
    }
};

/* =========================
EDIT PRODUCT
========================= */
window.editProduct = (id) => {

    const p = productsCache.find(x => x.id === id);

    if (!p) return;

    currentEditId = id;

    document.getElementById("pname").value =
        p.name || "";

    document.getElementById("pprice").value =
        p.price || "";

    document.getElementById("pdiscount").value =
        p.discount || "";

    document.getElementById("pcategory").value =
        p.category || "";

    document.getElementById("pdesc").value =
        p.description || "";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    showToast("Editing Product ✏️");
};

/* =========================
ANALYTICS
========================= */
function updateAnalytics() {

    const totalProducts =
        productsCache.length;

    const totalOrders =
        ordersCache.length;

    let totalRevenue = 0;

    ordersCache.forEach(o => {
        totalRevenue += Number(o.total || 0);
    });

    document.getElementById(
        "totalProducts"
    ).innerText = totalProducts;

    document.getElementById(
        "totalOrders"
    ).innerText = totalOrders;

    document.getElementById(
        "totalRevenue"
    ).innerText = formatMoney(totalRevenue);

    renderChart(
        totalProducts,
        totalOrders,
        totalRevenue
    );
}

/* =========================
CHART
========================= */
function renderChart(products, orders, revenue) {

    const canvas =
        document.getElementById("analyticsChart");

    if (!canvas) return;

    if (typeof Chart === "undefined") return;

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(canvas, {

        type: "bar",

        data: {

            labels: [
                "Products",
                "Orders",
                "Revenue"
            ],

            datasets: [{

                label: "Analytics",

                data: [
                    products,
                    orders,
                    revenue
                ],

                backgroundColor: [
                    "#1f8f4d",
                    "#15803d",
                    "#25d366"
                ],

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
LOAD PRODUCTS
========================= */
function loadProducts() {

    const list =
        document.getElementById("productList");

    if (!list) return;

    onSnapshot(
        collection(db, "products"),
        (snap) => {

        productsCache = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

        updateAnalytics();

        if (!productsCache.length) {

            list.innerHTML =
                "<p>No products</p>";

            return;
        }

        list.innerHTML = productsCache.map(p => `

            <div class="product-card">

                <img
                    src="${p.image || ""}"
                    width="70"
                    height="70"
                    style="
                        object-fit:cover;
                        border-radius:10px;
                    "
                >

                <div style="flex:1">

                    <h4>${p.name || ""}</h4>

                    <p>
                        ${formatMoney(p.price)}
                    </p>

                    <small>
                        ${p.category || ""}
                    </small>

                </div>

                <div
                    style="
                        display:flex;
                        gap:8px;
                        flex-wrap:wrap;
                    "
                >

                    <button
                        onclick="editProduct('${p.id}')"
                    >
                        Edit
                    </button>

                    <button
                        onclick="deleteProduct('${p.id}')"
                    >
                        Delete
                    </button>

                </div>

            </div>

        `).join("");
    });
}

/* =========================
LOAD ORDERS
========================= */
function loadOrders() {

    const list =
        document.getElementById("orderList");

    if (!list) return;

    onSnapshot(
        collection(db, "orders"),
        (snap) => {

        ordersCache = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

        updateAnalytics();

        if (!ordersCache.length) {

            list.innerHTML =
                "<p>No orders</p>";

            return;
        }

        list.innerHTML = ordersCache.map(o => `

            <div class="product-card">

                <div style="flex:1">

                    <h4>
                        ${o.orderId || ""}
                    </h4>

                    <p>
                        ${o.customer?.name || ""}
                    </p>

                    <small>
                        ${formatMoney(o.total)}
                    </small>

                </div>

                <div>

                    <span
                        style="
                            background:#e8fff1;
                            color:#15803d;
                            padding:6px 10px;
                            border-radius:20px;
                            font-size:12px;
                            font-weight:700;
                        "
                    >
                        COD
                    </span>

                </div>

            </div>

        `).join("");
    });
}

/* =========================
SEARCH PRODUCTS
========================= */
window.searchProducts = () => {

    const keyword =
        document.getElementById("adminSearch")
        ?.value
        ?.toLowerCase() || "";

    const list =
        document.getElementById("productList");

    const filtered = productsCache.filter(p =>
        (p.name || "")
        .toLowerCase()
        .includes(keyword)
    );

    list.innerHTML = filtered.map(p => `

        <div class="product-card">

            <img
                src="${p.image || ""}"
                width="70"
                height="70"
                style="
                    object-fit:cover;
                    border-radius:10px;
                "
            >

            <div style="flex:1">

                <h4>${p.name || ""}</h4>

                <p>
                    ${formatMoney(p.price)}
                </p>

            </div>

            <div
                style="
                    display:flex;
                    gap:8px;
                "
            >

                <button
                    onclick="editProduct('${p.id}')"
                >
                    Edit
                </button>

                <button
                    onclick="deleteProduct('${p.id}')"
                >
                    Delete
                </button>

            </div>

        </div>

    `).join("");
};

/* =========================
EXPORT PRODUCTS
========================= */
window.exportProducts = () => {

    const data = JSON.stringify(
        productsCache,
        null,
        2
    );

    const blob = new Blob(
        [data],
        { type: "application/json" }
    );

    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);

    a.download = "freshora-products.json";

    a.click();

    showToast("Products Exported");
};

/* =========================
LOGOUT
========================= */
window.logout = () => {

    localStorage.removeItem("admin");

    window.location.href = "login.html";
};

/* =========================
INIT
========================= */
window.addEventListener(
    "DOMContentLoaded",
    () => {

    loadProducts();
    loadOrders();

    console.log(
        "Freshora Admin V5 Loaded"
    );
});
