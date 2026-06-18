import {
  db,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc
} from "./firebase.js";

/* =========================
   CONFIG
========================= */
const CLOUD_NAME = "dayvblw7g";
const UPLOAD_PRESET = "freshora_upload";
const UPLOAD_FOLDER = "freshora/products";

let productsData = [];
let selectedProductId = null;

/* =========================
   HELPERS
========================= */
const qs = (id) => document.getElementById(id);

function showToast(msg) {
    let t = document.querySelector(".admin-toast");
    if (!t) {
        t = document.createElement("div");
        t.className = "admin-toast";
        t.style = "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#222;color:#fff;padding:10px 20px;border-radius:20px;z-index:9999;";
        document.body.appendChild(t);
    }
    t.innerText = msg;
    t.style.display = "block";
    setTimeout(() => t.style.display = "none", 2000);
}

/* =========================
   CLOUDINARY UPLOAD FIXED
========================= */
async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", UPLOAD_FOLDER);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData
    });

    const data = await res.json();

    if (!data.secure_url) {
        console.error(data);
        throw new Error("Upload failed");
    }

    return data.secure_url;
}

/* =========================
   PRODUCT ADD
========================= */
window.uploadAndAddProduct = async () => {
    const file = qs("pimageFile").files[0];

    let imageUrl = "";

    if (file) {
        imageUrl = await uploadToCloudinary(file);
    }

    await addDoc(collection(db, "products"), {
        name: qs("pname").value,
        price: Number(qs("pprice").value),
        discount: Number(qs("pdiscount").value || 0),
        stock: Number(qs("pstock").value || 0),
        category: qs("pcategorySelect").value,
        description: qs("pdesc").value,
        image: imageUrl,
        createdAt: Date.now()
    });

    showToast("Product Added");
    clearForm();
};

/* =========================
   UPDATE PRODUCT
========================= */
window.updateSelected = async () => {
    if (!selectedProductId) return showToast("Select product first");

    await updateDoc(doc(db, "products", selectedProductId), {
        name: qs("pname").value,
        price: Number(qs("pprice").value),
        discount: Number(qs("pdiscount").value),
        stock: Number(qs("pstock").value),
        category: qs("pcategorySelect").value,
        description: qs("pdesc").value
    });

    showToast("Updated");
    clearForm();
};

/* =========================
   DELETE PRODUCT
========================= */
window.deleteProduct = async (id) => {
    if (confirm("Delete?")) {
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
    qs("pcategorySelect").value = p.category;
    qs("pdesc").value = p.description;
};

/* =========================
   CLEAR FORM
========================= */
window.clearForm = () => {
    ["pname","pprice","pdiscount","pstock","pdesc"].forEach(id => {
        qs(id).value = "";
    });

    qs("pimageFile").value = "";
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

    qs("productListBody").innerHTML = productsData.map(p => `
        <tr onclick="selectProduct('${p.id}')">
            <td><img src="${p.image || ''}" width="40"></td>
            <td>${p.name}</td>
            <td>${p.price}</td>
            <td>${p.discount}%</td>
            <td>${Math.round(p.price - p.price*p.discount/100)}</td>
            <td>${p.category}</td>
            <td>${p.stock}</td>
            <td><button onclick="event.stopPropagation(); deleteProduct('${p.id}')">🗑</button></td>
        </tr>
    `).join("");
});

/* =========================
   DELIVERY FIXED (ADD / DELETE / UPDATE)
========================= */
window.saveDeliveryFee = async () => {
    const district = qs("districtSelect").value;
    const cost = qs("deliveryCost").value;

    if (!district || !cost) return showToast("Fill fields");

    await addDoc(collection(db, "deliveryFees"), {
        district,
        cost: Number(cost)
    });

    showToast("Saved");
};

window.deleteDelivery = async (id) => {
    await deleteDoc(doc(db, "deliveryFees", id));
    showToast("Deleted");
};

window.updateDelivery = async (id, cost) => {
    await updateDoc(doc(db, "deliveryFees", id), { cost: Number(cost) });
    showToast("Updated");
};

onSnapshot(collection(db, "deliveryFees"), (snap) => {
    qs("deliveryList").innerHTML = snap.docs.map(d => `
        <div class="admin-card" style="display:flex;justify-content:space-between;">
            <span>${d.data().district}</span>

            <input value="${d.data().cost}"
                   onchange="updateDelivery('${d.id}', this.value)"
                   style="width:80px;">

            <button onclick="deleteDelivery('${d.id}')">🗑</button>
        </div>
    `).join("");
});

/* =========================
   CATEGORY FIXED (ADD / UPDATE / DELETE)
========================= */
window.addCategory = async () => {
    const name = qs("catName").value;
    if (!name) return;

    await addDoc(collection(db, "categories"), { name });
    qs("catName").value = "";
};

window.updateCategory = async (id, name) => {
    await updateDoc(doc(db, "categories", id), { name });
    showToast("Updated");
};

window.deleteCategory = async (id) => {
    await deleteDoc(doc(db, "categories", id));
    showToast("Deleted");
};

onSnapshot(collection(db, "categories"), (snap) => {
    const list = qs("activeCategoryList");
    const select = qs("pcategorySelect");

    const cats = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    select.innerHTML = `<option value="Other">Other</option>` +
        cats.map(c => `<option value="${c.name}">${c.name}</option>`).join("");

    list.innerHTML = cats.map(c => `
        <div class="admin-card" style="display:flex;justify-content:space-between;">
            <input value="${c.name}"
                   onchange="updateCategory('${c.id}', this.value)">
            <button onclick="deleteCategory('${c.id}')">🗑</button>
        </div>
    `).join("");
});

/* =========================
   ORDERS + FULL BILL ITEMS FIXED
========================= */
window.viewBill = (order) => {

    qs("billModal").style.display = "block";

    const items = order.items || [];

    qs("billContent").innerHTML = `
        <p><b>Order ID:</b> ${order.id}</p>
        <p><b>Name:</b> ${order.customerName}</p>
        <p><b>Phone:</b> ${order.phone}</p>

        <hr>

        <h4>Items</h4>
        ${items.map(i => `
            <div>
                ${i.name} x ${i.qty} = Rs ${i.price * i.qty}
            </div>
        `).join("")}

        <hr>

        <p><b>Total:</b> Rs ${order.totalBill}</p>
        <p><b>Status:</b> ${order.status}</p>
    `;
};

window.downloadBill = (order) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("FRESHORA INVOICE", 20, 20);
    doc.text("Order: " + order.id, 20, 40);

    let y = 60;

    (order.items || []).forEach(i => {
        doc.text(`${i.name} x${i.qty} = Rs ${i.price * i.qty}`, 20, y);
        y += 10;
    });

    doc.text("TOTAL: Rs " + order.totalBill, 20, y + 10);

    doc.save("invoice_" + order.id + ".pdf");
};

/* =========================
   ORDERS LIST
========================= */
onSnapshot(collection(db, "orders"), (snap) => {
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    qs("orderList").innerHTML = orders.map(o => `
        <tr>
            <td>${o.id.slice(-5)}</td>
            <td>${o.customerName}</td>
            <td>${o.phone}</td>
            <td>${o.district}</td>
            <td>Rs ${o.totalBill}</td>

            <td>
                <select onchange="updateOrderStatus('${o.id}', this.value)">
                    <option ${o.status=="Pending"?"selected":""}>Pending</option>
                    <option ${o.status=="Processing"?"selected":""}>Processing</option>
                    <option ${o.status=="Delivered"?"selected":""}>Delivered</option>
                </select>
            </td>

            <td>
                <button onclick='viewBill(${JSON.stringify(o)})'>View</button>
            </td>
        </tr>
    `).join("");
});

/* =========================
   ORDER STATUS
========================= */
window.updateOrderStatus = async (id, status) => {
    await updateDoc(doc(db, "orders", id), { status });
    showToast("Status Updated");
};

/* =========================
   LOGOUT
========================= */
window.logout = () => {
    localStorage.removeItem("admin");
    location.href = "login.html";
};
