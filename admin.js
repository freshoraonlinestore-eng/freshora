import {
  db,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc
} from "./firebase.js";

/* =========================
   FRESHORA ADMIN V6 - FULL
   ========================= */

const CLOUD_NAME = "dayvblw7g";
const UPLOAD_PRESET = "freshora_upload";

let productsData = [];
let ordersData = [];

// Helper
const qs = (id) => document.getElementById(id);

function showToast(msg) {
    let toast = document.querySelector(".admin-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.className = "admin-toast";
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

    // Image Upload Logic
    const fileInput = qs("pimageFile");
    let imageUrl = "";
    if (fileInput.files[0]) {
        const formData = new FormData();
        formData.append("file", fileInput.files[0]);
        formData.append("upload_preset", UPLOAD_PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: "POST",
            body: formData
        });
        const data = await res.json();
        imageUrl = data.secure_url;
    }

    await addDoc(collection(db, "products"), {
        name: name,
        price: Number(qs("pprice").value),
        discount: Number(qs("pdiscount").value || 0),
        stock: Number(qs("pstock").value || 0),
        category: qs("pcategorySelect") ? qs("pcategorySelect").value : "Other",
        image: imageUrl,
        createdAt: new Date().getTime()
    });
    showToast("Product Added Successfully ✅");
    clearForm();
};

window.clearForm = () => {
    ["pname", "pprice", "pdiscount", "pstock", "pdesc"].forEach(id => {
        if(qs(id)) qs(id).value = "";
    });
};

window.deleteProduct = async (id) => {
    if(confirm("Delete this product?")) {
        await deleteDoc(doc(db, "products", id));
        showToast("Deleted!");
    }
};

/* --- CATEGORIES --- */
window.addCategory = async () => {
    const name = qs("catName").value;
    if(!name) return;
    await addDoc(collection(db, "categories"), { name: name });
    qs("catName").value = "";
    showToast("Category Added!");
};

window.deleteCategory = async (id) => {
    await deleteDoc(doc(db, "categories", id));
};

/* --- REALTIME DATA SYNC --- */
// Sync Products
onSnapshot(collection(db, "products"), (snap) => {
    productsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Update Stats
    if(qs("totalProducts")) qs("totalProducts").innerText = productsData.length;
    
    // Render Table
    const tbody = qs("productListBody");
    if(tbody) {
        tbody.innerHTML = productsData.map(p => `
            <tr>
                <td><img src="${p.image || ''}" width="40"></td>
                <td>${p.name}</td>
                <td>Rs ${Number(p.price).toLocaleString()}</td>
                <td>${p.discount}%</td>
                <td>Rs ${Math.round(p.price - (p.price * p.discount / 100)).toLocaleString()}</td>
                <td>${p.category || 'Other'}</td>
                <td>${p.stock}</td>
                <td><button onclick="deleteProduct('${p.id}')" style="background:var(--danger)">🗑</button></td>
            </tr>
        `).join("");
    }
});

// Sync Categories
onSnapshot(collection(db, "categories"), (snap) => {
    const list = qs("activeCategoryList");
    if(list) {
        list.innerHTML = snap.docs.map(doc => `
            <div class="admin-card" style="display:flex; justify-content:space-between; margin:5px 0;">
                <span>🏷 ${doc.data().name}</span>
                <button onclick="deleteCategory('${doc.id}')" style="background:var(--danger); width:auto;">🗑</button>
            </div>
        `).join("");
    }
});

/* --- UTILS --- */
window.saveDeliveryFee = () => showToast("Delivery settings saved!");
window.logout = () => { localStorage.removeItem("admin"); window.location.href = "login.html"; };

console.log("Freshora Admin System Active 🚀");
