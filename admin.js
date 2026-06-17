import { db, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from "./firebase.js";

/* =========================================
   FRESHORA ADMIN PRO - FINAL COMPLETE V8
   ========================================= */

const CLOUD_NAME = "dayvblw7g";
const UPLOAD_PRESET = "freshora_upload";

let productsData = [];
let selectedProductId = null;

const qs = (id) => document.getElementById(id);
const val = (v) => (v === undefined || v === null ? "" : v);
const num = (n) => (isNaN(n) || n === undefined || n === null ? 0 : Number(n));

function showToast(msg) {
    let toast = document.querySelector(".admin-toast") || document.createElement("div");
    toast.className = "admin-toast";
    toast.style = "position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#333; color:#fff; padding:10px 20px; border-radius:20px; z-index:9999;";
    if (!document.body.contains(toast)) document.body.appendChild(toast);
    toast.innerText = msg; toast.style.display = "block";
    setTimeout(() => toast.style.display = "none", 2500);
}

/* --- PRODUCT ACTIONS --- */
window.uploadAndAddProduct = async () => {
    const name = qs("pname").value;
    if (!name) return showToast("Enter product name!");
    
    // Image Upload Logic (Simplified for 3 images)
    const images = ["img1", "img2", "img3"];
    let imageUrls = [];
    
    for (let id of images) {
        const fileInput = qs(id);
        if (fileInput && fileInput.files[0]) {
            const formData = new FormData();
            formData.append("file", fileInput.files[0]);
            formData.append("upload_preset", UPLOAD_PRESET);
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
            const data = await res.json();
            imageUrls.push(data.secure_url);
        }
    }

    await addDoc(collection(db, "products"), {
        name,
        price: num(qs("pprice").value),
        discount: num(qs("pdiscount").value),
        stock: num(qs("pstock").value),
        category: qs("pcategorySelect").value,
        images: imageUrls,
        createdAt: new Date().getTime()
    });
    showToast("Product Added ✅");
    clearForm();
};

window.clearForm = () => {
    ["pname", "pprice", "pdiscount", "pstock"].forEach(id => { if(qs(id)) qs(id).value = ""; });
    selectedProductId = null;
};

/* --- DOWNLOAD & EXPORT --- */
window.downloadInventory = () => {
    let csv = "Name,Price,Stock\n" + productsData.map(p => `${p.name},${p.price},${p.stock}`).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "Inventory.csv"; a.click();
};

window.downloadSales = () => showToast("Exporting Sales Report...");

/* --- ORDER & BILLING --- */
window.notifyCustomer = (phone, name, orderId, status) => {
    const msg = `Hi ${name}, your order ${orderId.slice(-5)} status is: ${status}. Thank you for shopping with Freshora!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`);
};

window.viewBill = (order) => {
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>Bill ${order.id}</title></head><body>
        <h1>Freshora Receipt</h1>
        <p>Order ID: ${order.id}</p>
        <p>Customer: ${order.customerName}</p>
        <p>Total Bill: Rs ${order.totalBill}</p>
        <button onclick="window.print()">Print/Save as PDF</button>
    </body></html>`);
};

/* --- SYNC DATA --- */
onSnapshot(collection(db, "orders"), (snap) => {
    const list = qs("orderList");
    if(list) {
        const orders = snap.docs.map(d => ({id: d.id, ...d.data()}));
        list.innerHTML = orders.map(o => `
            <tr>
                <td>${o.id.slice(-5)}</td>
                <td>${val(o.customerName)}</td>
                <td>${val(o.phone)}</td>
                <td>Rs ${num(o.totalBill)}</td>
                <td>
                    <button onclick="notifyCustomer('${val(o.phone)}','${val(o.customerName)}','${o.id}','${val(o.status)}')"><i class="fab fa-whatsapp"></i></button>
                    <button onclick='viewBill(${JSON.stringify(o)})'><i class="fas fa-file-invoice"></i></button>
                </td>
            </tr>
        `).join("");
    }
});

onSnapshot(collection(db, "deliveryFees"), (snap) => {
    const list = qs("deliveryList");
    if(list) list.innerHTML = snap.docs.map(d => `
        <div class="admin-card">${d.data().district}: Rs ${d.data().cost} 
            <button onclick="deleteDoc(doc(db,'deliveryFees','${d.id}'))">🗑</button>
        </div>
    `).join("");
});

window.saveDeliveryFee = async () => {
    const district = qs("districtSelect").value;
    const cost = qs("deliveryCost").value;
    if(!district || !cost) return showToast("Enter details!");
    await addDoc(collection(db, "deliveryFees"), { district, cost: Number(cost) });
    showToast("Fee Saved!");
};

window.logout = () => { localStorage.removeItem("admin"); window.location.href = "login.html"; };
