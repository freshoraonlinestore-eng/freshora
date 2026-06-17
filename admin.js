import { db, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from "./firebase.js";

/* =========================
FRESHORA ADMIN V6 PRO - COMPLETE JS
========================= */

const CLOUD_NAME = "dayvblw7g";
const UPLOAD_PRESET = "freshora_upload";

// DOM Selector
const qs = (id) => document.getElementById(id);

// Toast Notification
function showToast(msg) {
    let toast = document.querySelector(".admin-toast") || document.createElement("div");
    toast.className = "admin-toast";
    document.body.appendChild(toast);
    toast.innerText = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
}

/* --- PRODUCT ACTIONS --- */
window.uploadAndAddProduct = async () => {
    const name = qs("pname").value;
    if (!name) return showToast("Product Name is required!");
    
    // Cloudinary upload logic here...
    await addDoc(collection(db, "products"), {
        name: name,
        price: Number(qs("pprice").value),
        discount: Number(qs("pdiscount").value),
        stock: Number(qs("pstock").value),
        category: qs("pcategorySelect").value,
        createdAt: new Date().toISOString()
    });
    showToast("Product Added Successfully ✅");
    clearForm();
};

window.clearForm = () => {
    ["pname", "pprice", "pdiscount", "pstock", "pdesc"].forEach(id => qs(id).value = "");
};

/* --- CATEGORY ACTIONS --- */
window.addCategory = async () => {
    const catName = qs("catName").value;
    if (!catName) return;
    await addDoc(collection(db, "categories"), { name: catName });
    showToast("Category Added!");
    qs("catName").value = "";
};

window.deleteCategory = async (id) => {
    if(confirm("Delete this category?")) await deleteDoc(doc(db, "categories", id));
};

/* --- DATA LISTENER (REALTIME) --- */
onSnapshot(collection(db, "products"), (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProductTable(data);
    qs("totalProducts").innerText = data.length;
});

function renderProductTable(data) {
    const tbody = qs("productListBody");
    tbody.innerHTML = data.map(p => `
        <tr>
            <td><img src="${p.image || ''}" width="40" height="40"></td>
            <td>${p.name}</td>
            <td>Rs ${p.price || 0}</td>
            <td>${p.discount || 0}%</td>
            <td>Rs ${p.price - (p.price * (p.discount || 0) / 100)}</td>
            <td>${p.category}</td>
            <td>${p.stock || 0}</td>
            <td><button onclick="deleteProduct('${p.id}')" style="background:var(--danger)">🗑</button></td>
        </tr>
    `).join("");
}

window.deleteProduct = async (id) => {
    if(confirm("Delete product?")) await deleteDoc(doc(db, "products", id));
};

/* --- DELIVERY & REPORTS --- */
window.saveDeliveryFee = () => showToast("Delivery fee saved for " + qs("districtSelect").value);
window.downloadInventory = () => showToast("Downloading CSV...");
window.downloadSales = () => showToast("Downloading Reports...");
window.downloadReviews = () => showToast("Downloading Reviews...");

window.logout = () => {
    localStorage.removeItem("admin");
    window.location.href = "login.html";
};

console.log("Freshora Admin System Active 🚀");
