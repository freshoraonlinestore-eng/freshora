import { db, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from "./firebase.js";

/* =========================
   FRESHORA ADMIN V6 - STABLE
   ========================= */

const CLOUD_NAME = "dayvblw7g";
const UPLOAD_PRESET = "freshora_upload";

let productsData = [];
let selectedProductId = null;

const qs = (id) => document.getElementById(id);
const val = (v) => (v === undefined || v === null ? "" : v);
const num = (n) => (isNaN(n) || n === undefined || n === null ? 0 : Number(n));

function showToast(msg) {
    let toast = document.querySelector(".admin-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.className = "admin-toast";
        toast.style = "position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#333; color:#fff; padding:10px 20px; border-radius:20px; display:block; z-index:9999;";
        document.body.appendChild(toast);
    }
    toast.innerText = msg;
    setTimeout(() => toast.remove(), 2500);
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
    ["pname", "pprice", "pdiscount", "pstock", "pdesc"].forEach(id => { if(qs(id)) qs(id).value = ""; });
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

/* --- SYNC & RENDERING --- */
onSnapshot(collection(db, "products"), (snap) => {
    productsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const totalStock = productsData.reduce((sum, p) => sum + num(p.stock), 0);
    const lowStock = productsData.filter(p => num(p.stock) < 5).length;
    const rev = productsData.reduce((sum, p) => sum + (num(p.price) * num(p.stock)), 0);

    if(qs("totalProducts")) qs("totalProducts").innerText = productsData.length;
    if(qs("totalStock")) qs("totalStock").innerText = totalStock;
    if(qs("lowStock")) qs("lowStock").innerText = lowStock;
    if(qs("totalRevenue")) qs("totalRevenue").innerText = "Rs " + rev.toLocaleString();

    const tbody = qs("productListBody");
    if(tbody) {
        tbody.innerHTML = productsData.map(p => `
            <tr onclick="selectProduct('${p.id}')" style="cursor:pointer;">
                <td><img src="${val(p.image)}" width="40" height="40" style="border-radius:5px"></td>
                <td>${val(p.name)}</td>
                <td>Rs ${num(p.price).toLocaleString()}</td>
                <td>${num(p.discount)}%</td>
                <td>Rs ${Math.round(num(p.price) - (num(p.price) * num(p.discount) / 100)).toLocaleString()}</td>
                <td>${val(p.category)}</td>
                <td>${num(p.stock)}</td>
                <td><button onclick="event.stopPropagation(); deleteProduct('${p.id}')" style="background:var(--danger); color:white;">🗑</button></td>
            </tr>
        `).join("");
    }
});

onSnapshot(collection(db, "orders"), (snap) => {
    const list = qs("orderList");
    if(list) {
        const orders = snap.docs.map(d => ({id: d.id, ...d.data()}));
        list.innerHTML = orders.length ? orders.map(o => `
            <tr>
                <td>${o.id.slice(-5)}</td>
                <td>${val(o.customerName)}</td>
                <td>${val(o.phone)}</td>
                <td>${val(o.district)}</td>
                <td>Rs ${num(o.totalBill).toLocaleString()}</td>
                <td>${val(o.status)}</td>
                <td>-</td>
            </tr>
        `).join("") : '<tr><td colspan="7" style="text-align:center;">No recent orders.</td></tr>';
    }
});

onSnapshot(collection(db, "deliveryFees"), (snap) => {
    const list = qs("deliveryList");
    if(list) list.innerHTML = snap.docs.map(d => `<div class="admin-card">${val(d.data().district)}: Rs ${num(d.data().cost)}</div>`).join("");
});

onSnapshot(collection(db, "categories"), (snap) => {
    const select = qs("pcategorySelect");
    const list = qs("activeCategoryList");
    const cats = snap.docs.map(d => d.data().name);
    if(select) select.innerHTML = '<option value="Other">Other</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join("");
    if(list) list.innerHTML = snap.docs.map(doc => `
        <div class="admin-card" style="display:flex; justify-content:space-between; margin:5px 0;">
            <span>🏷 ${val(doc.data().name)}</span>
            <button onclick="deleteDoc(doc(db,'categories','${doc.id}'))" style="background:var(--danger); width:auto; color:white;">🗑</button>
        </div>
    `).join("");
});

/* --- UTILS --- */
window.addCategory = async () => {
    const name = qs("catName").value;
    if(!name) return;
    await addDoc(collection(db, "categories"), { name: name });
    qs("catName").value = "";
    showToast("Category Added!");
};

window.saveDeliveryFee = async () => {
    const district = qs("districtSelect").value;
    const cost = qs("deliveryCost").value;
    if(!district || !cost) return showToast("Enter details!");
    await addDoc(collection(db, "deliveryFees"), { district, cost });
    showToast("Delivery Fee Saved!");
};

window.logout = () => { localStorage.removeItem("admin"); window.location.href = "login.html"; };
window.downloadInventory = () => showToast("Downloading...");
window.downloadSales = () => showToast("Downloading...");
window.downloadReviews = () => showToast("Downloading...");
window.updateCategory = () => showToast("Feature active.");
