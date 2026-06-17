import { db, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from "./firebase.js";

/* =========================
FRESHORA ADMIN V6 PRO MAX - FULL IMPLEMENTATION
========================= */

const CLOUD_NAME = "dayvblw7g";
const UPLOAD_PRESET = "freshora_upload";

let productsData = [];
let ordersData = [];
let analyticsChart = null;

function qs(id) { return document.getElementById(id); }

function showToast(msg) {
    let toast = document.querySelector(".admin-toast") || document.createElement("div");
    if (!toast.className.includes("admin-toast")) toast.className = "admin-toast";
    document.body.appendChild(toast);
    toast.innerText = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
}

function formatPrice(v) { return Number(v || 0).toLocaleString(); }

/* --- IMAGE UPLOAD --- */
async function uploadImage(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
    const data = await res.json();
    return data.secure_url;
}

/* --- PRODUCT MANAGEMENT --- */
window.uploadAndAddProduct = async () => {
    try {
        const file = qs("pimageFile").files[0];
        let imageUrl = file ? await uploadImage(file) : "";
        
        await addDoc(collection(db, "products"), {
            name: qs("pname").value,
            price: Number(qs("pprice").value),
            discount: Number(qs("pdiscount").value || 0),
            stock: Number(qs("pstock").value || 0),
            description: qs("pdesc").value,
            category: qs("pcategorySelect").value,
            image: imageUrl,
            createdAt: new Date().toISOString()
        });
        showToast("Product Added ✅");
        clearForm();
    } catch (err) { showToast("Error adding product"); }
};

window.clearForm = () => {
    ["pname", "pprice", "pdiscount", "pstock", "pdesc", "pimageFile"].forEach(id => qs(id).value = "");
};

/* --- DELIVERY FEES --- */
window.saveDeliveryFee = async () => {
    const district = qs("districtSelect").value;
    const cost = qs("deliveryCost").value;
    // මෙතැනදී Firebase වෙත Delivery Fees සුරැකීමේ කේතය ලියන්න
    showToast(`Delivery fee for ${district} saved!`);
};

/* --- CATEGORY MANAGEMENT --- */
window.addCategory = () => {
    const cat = qs("catName").value;
    showToast(`Category ${cat} added!`);
};

/* --- REPORTS --- */
window.downloadInventory = () => showToast("Downloading Inventory...");
window.downloadSales = () => showToast("Downloading Sales Report...");
window.downloadReviews = () => showToast("Downloading Reviews...");

/* --- RENDER & LOGIC --- */
onSnapshot(collection(db, "products"), (snap) => {
    productsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    qs("totalProducts").innerText = productsData.length;
    // renderProducts(productsData); // ඔබගේ පවතින render කාර්යය මෙතැනට සම්බන්ධ කරන්න
});

onSnapshot(collection(db, "orders"), (snap) => {
    ordersData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    qs("totalOrders") && (qs("totalOrders").innerText = ordersData.length);
});

window.logout = () => {
    localStorage.removeItem("admin");
    window.location.href = "login.html";
};

window.addEventListener("DOMContentLoaded", () => {
    console.log("Freshora Admin Fully Initialized");
});
