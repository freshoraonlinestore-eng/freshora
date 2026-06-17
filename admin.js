import { db, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from "./firebase.js";

/* =========================
   FRESHORA ADMIN V6 - FINAL
   ========================= */

const CLOUD_NAME = "dayvblw7g";
const UPLOAD_PRESET = "freshora_upload";

let productsData = [];
let selectedProductId = null;

const qs = (id) => document.getElementById(id);

function showToast(msg) {
    let toast = document.querySelector(".admin-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.className = "admin-toast";
        toast.style = "position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#333; color:#fff; padding:10px 20px; border-radius:20px; display:none;";
        document.body.appendChild(toast);
    }
    toast.innerText = msg;
    toast.style.display = "block";
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
        price: Number(qs("pprice").value),
        discount: Number(qs("pdiscount").value || 0),
        stock: Number(qs("pstock").value || 0),
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
        price: Number(qs("pprice").value),
        discount: Number(qs("pdiscount").value),
        stock: Number(qs("pstock").value),
        category: qs("pcategorySelect").value
    });
    showToast("Product Updated!");
    clearForm();
};

window.clearForm = () => {
    ["pname", "pprice", "pdiscount", "pstock", "pdesc"].forEach(id => qs(id).value = "");
    selectedProductId = null;
};

window.deleteProduct = async (id) => {
    if(confirm("Delete this product?")) await deleteDoc(doc(db, "products", id));
};

window.selectProduct = (id) => {
    const p = productsData.find(item => item.id === id);
    if(p) {
        selectedProductId = id;
        qs("pname").value = p.name;
        qs("pprice").value = p.price;
        qs("pdiscount").value = p.discount;
        qs("pstock").value = p.stock;
        qs("pcategorySelect").value = p.category || "Other";
        showToast("Product Selected for Update!");
    }
};

/* --- SYNC & DATA RENDERING --- */
onSnapshot(collection(db, "products"), (snap) => {
    productsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Stats Update
    const totalStock = productsData.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
    const lowStock = productsData.filter(p => p.stock < 5).length;
    
    if(qs("totalProducts")) qs("totalProducts").innerText = productsData.length;
    if(qs("totalStock")) qs("totalStock").innerText = totalStock;
    if(qs("lowStock")) qs("lowStock").innerText = lowStock;

    // Table Render
    const tbody = qs("productListBody");
    if(tbody) {
        tbody.innerHTML = productsData.map(p => `
            <tr onclick="selectProduct('${p.id}')" style="cursor:pointer;">
                <td><img src="${p.image || ''}" width="40" height="40" style="border-radius:5px"></td>
                <td>${p.name}</td>
                <td>Rs ${Number(p.price).toLocaleString()}</td>
                <td>${p.discount}%</td>
                <td>Rs ${Math.round(p.price - (p.price * p.discount / 100)).toLocaleString()}</td>
                <td>${p.category || 'Other'}</td>
                <td>${p.stock}</td>
                <td><button onclick="event.stopPropagation(); deleteProduct('${p.id}')" style="background:var(--danger); color:white;">🗑</button></td>
            </tr>
        `).join("");
    }
});

/* --- ORDERS & FEES --- */
onSnapshot(collection(db, "orders"), (snap) => {
    const list = qs("orderList");
    if(list) {
        const orders = snap.docs.map(d => ({id: d.id, ...d.data()}));
        list.innerHTML = orders.length ? orders.map(o => `
            <tr><td>${o.id.slice(-5)}</td><td>${o.customerName}</td><td>${o.phone}</td><td>${o.district}</td><td>Rs ${o.totalBill}</td><td>${o.status}</td><td>-</td></tr>
        `).join("") : '<tr><td colspan="7" style="text-align:center;">No recent orders.</td></tr>';
    }
});

onSnapshot(collection(db, "deliveryFees"), (snap) => {
    const list = qs("deliveryList");
    if(list) list.innerHTML = snap.docs.map(d => `<div class="admin-card">${d.data().district}: Rs ${d.data().cost}</div>`).join("");
});

/* --- UTILITIES --- */
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
