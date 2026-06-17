import { db, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from "./firebase.js";

/* =========================
   FRESHORA ADMIN V6 - FULL
   ========================= */

const CLOUD_NAME = "dayvblw7g";
const UPLOAD_PRESET = "freshora_upload";

let productsData = [];

const qs = (id) => document.getElementById(id);

function showToast(msg) {
    let toast = document.querySelector(".admin-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.className = "admin-toast";
        document.body.appendChild(toast);
    }
    toast.innerText = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
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
        category: qs("pcategorySelect") ? qs("pcategorySelect").value : "Other",
        image: imageUrl,
        createdAt: new Date().getTime()
    });
    showToast("Product Added ✅");
    ["pname", "pprice", "pdiscount", "pstock", "pdesc"].forEach(id => qs(id).value = "");
};

window.deleteProduct = async (id) => {
    if(confirm("Delete product?")) await deleteDoc(doc(db, "products", id));
};

/* --- SYNC DATA --- */
onSnapshot(collection(db, "products"), (snap) => {
    productsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if(qs("totalProducts")) qs("totalProducts").innerText = productsData.length;
    renderTable(productsData);
});

function renderTable(data) {
    const tbody = qs("productListBody");
    if(!tbody) return;
    tbody.innerHTML = data.map(p => `
        <tr>
            <td><img src="${p.image || ''}" width="40" height="40" style="border-radius:5px"></td>
            <td>${p.name}</td>
            <td>Rs ${Number(p.price).toLocaleString()}</td>
            <td>${p.discount}%</td>
            <td>Rs ${Math.round(p.price - (p.price * p.discount / 100)).toLocaleString()}</td>
            <td>${p.category || 'Other'}</td>
            <td>${p.stock}</td>
            <td><button onclick="deleteProduct('${p.id}')" style="background:var(--danger); color:white;">🗑</button></td>
        </tr>
    `).join("");
}

/* --- SEARCH FUNCTIONALITY --- */
window.addEventListener("DOMContentLoaded", () => {
    const searchInput = qs("adminSearch");
    if(searchInput) {
        searchInput.addEventListener("input", (e) => {
            const val = e.target.value.toLowerCase();
            const filtered = productsData.filter(p => p.name.toLowerCase().includes(val) || (p.category && p.category.toLowerCase().includes(val)));
            renderTable(filtered);
        });
    }
});

/* --- CATEGORIES --- */
window.addCategory = async () => {
    const name = qs("catName").value;
    if(!name) return;
    await addDoc(collection(db, "categories"), { name: name });
    qs("catName").value = "";
    showToast("Category Added!");
};

onSnapshot(collection(db, "categories"), (snap) => {
    const select = qs("pcategorySelect");
    const list = qs("activeCategoryList");
    const cats = snap.docs.map(d => d.data().name);
    
    if(select) select.innerHTML = '<option value="Other">Other</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join("");
    if(list) list.innerHTML = snap.docs.map(doc => `
        <div class="admin-card" style="display:flex; justify-content:space-between; margin:5px 0;">
            <span>🏷 ${doc.data().name}</span>
            <button onclick="deleteDoc(doc(db,'categories','${doc.id}'))" style="background:var(--danger); width:auto; color:white;">🗑</button>
        </div>
    `).join("");
});

window.logout = () => { localStorage.removeItem("admin"); window.location.href = "login.html"; };
