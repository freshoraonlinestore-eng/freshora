import { db, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from "./firebase.js";

/* =========================
   FRESHORA ADMIN PRO - V7
   ========================= */

const CLOUD_NAME = "dayvblw7g";
const UPLOAD_PRESET = "freshora_upload";

let productsData = [];
let selectedProductId = null;
let deliveryData = [];

const qs = (id) => document.getElementById(id);
const val = (v) => (v === undefined || v === null ? "" : v);
const num = (n) => (isNaN(n) || n === undefined || n === null ? 0 : Number(n));

function showToast(msg) {
    let toast = document.querySelector(".admin-toast") || document.createElement("div");
    toast.className = "admin-toast";
    toast.style = "position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#333; color:#fff; padding:10px 20px; border-radius:20px; z-index:1000;";
    if (!document.body.contains(toast)) document.body.appendChild(toast);
    toast.innerText = msg; toast.style.display = "block";
    setTimeout(() => toast.style.display = "none", 2500);
}

/* --- PRODUCT ACTIONS --- */
window.uploadAndAddProduct = async () => {
    const name = qs("pname").value;
    if (!name) return showToast("Enter product name!");
    
    const fileInput = qs("pimageFile");
    let imageUrl = "";
    if (fileInput.files[0]) {
        const formData = new FormData();
        formData.append("file", fileInput.files[0]);
        formData.append("upload_preset", UPLOAD_PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
        const data = await res.json();
        imageUrl = data.secure_url;
    }

    await addDoc(collection(db, "products"), {
        name: name,
        price: num(qs("pprice").value),
        discount: num(qs("pdiscount").value),
        stock: num(qs("pstock").value),
        category: qs("pcategorySelect").value,
        image: imageUrl,
        createdAt: new Date().getTime()
    });
    showToast("Product Added ✅");
    clearForm();
};

window.updateSelected = async () => {
    if (!selectedProductId) return showToast("Select a product first!");
    await updateDoc(doc(db, "products", selectedProductId), {
        name: qs("pname").value,
        price: num(qs("pprice").value),
        discount: num(qs("pdiscount").value),
        stock: num(qs("pstock").value),
        category: qs("pcategorySelect").value
    });
    showToast("Product Updated!");
    clearForm();
};

window.clearForm = () => {
    ["pname", "pprice", "pdiscount", "pstock"].forEach(id => { if(qs(id)) qs(id).value = ""; });
    selectedProductId = null;
};

window.deleteProduct = async (id) => {
    if(confirm("Delete this product?")) await deleteDoc(doc(db, "products", id));
};

window.selectProduct = (id) => {
    const p = productsData.find(item => item.id === id);
    if(p) {
        selectedProductId = id;
        qs("pname").value = val(p.name);
        qs("pprice").value = num(p.price);
        qs("pdiscount").value = num(p.discount);
        qs("pstock").value = num(p.stock);
        qs("pcategorySelect").value = val(p.category) || "Other";
        showToast("Product Selected!");
    }
};

/* --- DOWNLOAD & EXPORT --- */
const exportToCSV = (data, filename) => {
    if (!data.length) return showToast("No data!");
    const csv = [Object.keys(data[0]).join(","), ...data.map(item => Object.values(item).join(","))].join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
};

window.downloadInventory = () => exportToCSV(productsData, "Inventory.csv");
window.downloadSales = () => showToast("Sales Report Exporting...");
window.downloadReviews = () => showToast("Reviews Exporting...");

/* --- DELIVERY & CATEGORY SYNC --- */
onSnapshot(collection(db, "deliveryFees"), (snap) => {
    deliveryData = snap.docs.map(d => ({id: d.id, ...d.data()}));
    const list = qs("deliveryList");
    if(list) list.innerHTML = deliveryData.map(d => `
        <div class="admin-card" style="display:flex; justify-content:space-between; margin:5px 0;">
            <span>${d.district}: Rs ${d.cost}</span>
            <button onclick="deleteDoc(doc(db,'deliveryFees','${d.id}'))" style="background:var(--danger, red); color:white;">🗑</button>
        </div>
    `).join("");
});

window.saveDeliveryFee = async () => {
    const district = qs("districtSelect").value;
    const cost = qs("deliveryCost").value;
    if(!district || !cost) return showToast("Select district and cost!");
    await addDoc(collection(db, "deliveryFees"), { district, cost: Number(cost) });
    showToast("Delivery Fee Saved!");
};

window.addCategory = async () => {
    const name = qs("catName").value;
    if(!name) return;
    await addDoc(collection(db, "categories"), { name: name });
    qs("catName").value = "";
    showToast("Category Added!");
};

/* --- DATA SYNC --- */
onSnapshot(collection(db, "products"), (snap) => {
    productsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const tbody = qs("productListBody");
    if(tbody) tbody.innerHTML = productsData.map(p => `
        <tr onclick="selectProduct('${p.id}')">
            <td><img src="${val(p.image)}" width="40"></td>
            <td>${val(p.name)}</td>
            <td>Rs ${num(p.price)}</td>
            <td>Rs ${Math.round(num(p.price) - (num(p.price) * num(p.discount) / 100))}</td>
            <td>${num(p.stock)}</td>
            <td><button onclick="event.stopPropagation(); deleteProduct('${p.id}')">🗑</button></td>
        </tr>
    `).join("");
});

window.logout = () => { localStorage.removeItem("admin"); window.location.href = "login.html"; };
