import {
  db,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  storage,
  ref,
  uploadBytesResumable,
  getDownloadURL
} from "./firebase.js";

/* =========================
   FRESHORA ADMIN V7 (FIXED)
========================= */

let productsData = [];
let selectedProductId = null;

const qs = (id) => document.getElementById(id);

/* =========================
   UI HELPERS
========================= */
function showToast(msg) {
    let toast = document.querySelector(".admin-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.className = "admin-toast";
        toast.style = `
            position:fixed;
            bottom:20px;
            left:50%;
            transform:translateX(-50%);
            background:#222;
            color:#fff;
            padding:10px 20px;
            border-radius:20px;
            z-index:9999;
        `;
        document.body.appendChild(toast);
    }
    toast.innerText = msg;
    toast.style.display = "block";
    setTimeout(() => toast.style.display = "none", 2500);
}

/* =========================
   IMAGE PREVIEW (3 IMAGES)
========================= */
const fileInput = qs("pimageFile");
const previewContainer = qs("previewContainer");
const progressBar = qs("uploadProgress");
const statusText = qs("uploadStatus");

fileInput.addEventListener("change", () => {
    previewContainer.innerHTML = "";

    Array.from(fileInput.files).slice(0, 3).forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
            const img = document.createElement("img");
            img.src = e.target.result;
            img.style = "width:70px;height:70px;object-fit:cover;border-radius:8px;";
            previewContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
});

/* =========================
   UPLOAD MULTIPLE IMAGES
========================= */
async function uploadImages(files) {
    let urls = [];

    for (let i = 0; i < files.length && i < 3; i++) {
        const file = files[i];

        const storageRef = ref(storage, "products/" + Date.now() + "_" + file.name);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise((resolve, reject) => {
            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    let percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    progressBar.style.width = percent + "%";
                    statusText.innerText = `Uploading ${Math.round(percent)}%`;
                },
                reject,
                async () => {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    urls.push(url);
                    resolve();
                }
            );
        });
    }

    return urls;
}

/* =========================
   ADD PRODUCT
========================= */
window.uploadAndAddProduct = async () => {
    const name = qs("pname").value;
    if (!name) return showToast("Enter product name!");

    const files = fileInput.files;

    let imageUrls = [];
    if (files.length > 0) {
        imageUrls = await uploadImages(files);
    }

    await addDoc(collection(db, "products"), {
        name,
        price: Number(qs("pprice").value),
        discount: Number(qs("pdiscount").value || 0),
        stock: Number(qs("pstock").value || 0),
        category: qs("pcategorySelect").value,
        images: imageUrls,
        createdAt: Date.now()
    });

    showToast("Product Added ✅");
    clearForm();
};

/* =========================
   UPDATE PRODUCT
========================= */
window.updateSelected = async () => {
    if (!selectedProductId) return showToast("Select product first!");

    await updateDoc(doc(db, "products", selectedProductId), {
        name: qs("pname").value,
        price: Number(qs("pprice").value),
        discount: Number(qs("pdiscount").value),
        stock: Number(qs("pstock").value),
        category: qs("pcategorySelect").value
    });

    showToast("Updated!");
    clearForm();
};

/* =========================
   DELETE PRODUCT
========================= */
window.deleteProduct = async (id) => {
    if (confirm("Delete product?")) {
        await deleteDoc(doc(db, "products", id));
        showToast("Deleted");
    }
};

/* =========================
   SELECT PRODUCT
========================= */
window.selectProduct = (id) => {
    const p = productsData.find(x => x.id === id);
    if (!p) return;

    selectedProductId = id;

    qs("pname").value = p.name;
    qs("pprice").value = p.price;
    qs("pdiscount").value = p.discount;
    qs("pstock").value = p.stock;
    qs("pcategorySelect").value = p.category || "Other";

    showToast("Selected for update");
};

/* =========================
   CLEAR FORM
========================= */
window.clearForm = () => {
    ["pname","pprice","pdiscount","pstock","pdesc"].forEach(id => qs(id).value = "");
    fileInput.value = "";
    previewContainer.innerHTML = "";
    progressBar.style.width = "0%";
    statusText.innerText = "";
    selectedProductId = null;
};

/* =========================
   PRODUCTS LIST
========================= */
onSnapshot(collection(db, "products"), (snap) => {
    productsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    qs("totalProducts").innerText = productsData.length;
    qs("totalStock").innerText = productsData.reduce((a,b)=>a+(b.stock||0),0);
    qs("lowStock").innerText = productsData.filter(p => p.stock < 5).length;

    const tbody = qs("productListBody");

    tbody.innerHTML = productsData.map(p => `
        <tr onclick="selectProduct('${p.id}')">
            <td>
                ${p.images?.[0] ? `<img src="${p.images[0]}" width="40">` : ""}
            </td>
            <td>${p.name}</td>
            <td>Rs ${p.price}</td>
            <td>${p.discount}%</td>
            <td>Rs ${Math.round(p.price - (p.price*p.discount/100))}</td>
            <td>${p.category}</td>
            <td>${p.stock}</td>
            <td>
                <button onclick="event.stopPropagation(); deleteProduct('${p.id}')">🗑</button>
            </td>
        </tr>
    `).join("");
});

/* =========================
   CATEGORIES FIXED DELETE
========================= */
onSnapshot(collection(db, "categories"), (snap) => {
    const select = qs("pcategorySelect");
    const list = qs("activeCategoryList");

    const cats = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    select.innerHTML =
        `<option value="Other">Other</option>` +
        cats.map(c => `<option value="${c.name}">${c.name}</option>`).join("");

    list.innerHTML = cats.map(c => `
        <div class="admin-card">
            ${c.name}
            <button onclick="deleteCategory('${c.id}')">🗑</button>
        </div>
    `).join("");
});

window.deleteCategory = async (id) => {
    await deleteDoc(doc(db, "categories", id));
    showToast("Deleted category");
};

/* =========================
   CATEGORY ADD
========================= */
window.addCategory = async () => {
    const name = qs("catName").value;
    if (!name) return;

    await addDoc(collection(db, "categories"), { name });
    qs("catName").value = "";
    showToast("Category Added");
};

/* =========================
   DELIVERY
========================= */
window.saveDeliveryFee = async () => {
    const district = qs("districtSelect").value;
    const cost = qs("deliveryCost").value;

    if (!district || !cost) return showToast("Fill fields");

    await addDoc(collection(db, "deliveryFees"), { district, cost });
    showToast("Saved");
};

/* =========================
   ORDERS
========================= */
onSnapshot(collection(db, "orders"), (snap) => {
    const list = qs("orderList");

    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    list.innerHTML = orders.length ? orders.map(o => `
        <tr>
            <td>${o.id.slice(-5)}</td>
            <td>${o.customerName}</td>
            <td>${o.phone}</td>
            <td>${o.district}</td>
            <td>Rs ${o.totalBill}</td>
            <td>${o.status}</td>
            <td>-</td>
        </tr>
    `).join("") : `<tr><td colspan="7">No orders</td></tr>`;
});

/* =========================
   SEARCH FIX
========================= */
window.addEventListener("DOMContentLoaded", () => {
    const search = qs("adminSearch");

    search.addEventListener("input", (e) => {
        const val = e.target.value.toLowerCase();

        const filtered = productsData.filter(p =>
            p.name.toLowerCase().includes(val) ||
            (p.category || "").toLowerCase().includes(val)
        );

        qs("productListBody").innerHTML = filtered.map(p => `
            <tr onclick="selectProduct('${p.id}')">
                <td><img src="${p.images?.[0]||''}" width="40"></td>
                <td>${p.name}</td>
                <td>${p.price}</td>
                <td>${p.discount}</td>
                <td>${Math.round(p.price - (p.price*p.discount/100))}</td>
                <td>${p.category}</td>
                <td>${p.stock}</td>
                <td>
                    <button onclick="event.stopPropagation(); deleteProduct('${p.id}')">🗑</button>
                </td>
            </tr>
        `).join("");
    });
});

/* =========================
   LOGOUT
========================= */
window.logout = () => {
    localStorage.removeItem("admin");
    location.href = "login.html";
};
