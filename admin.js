import { db, collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "./firebase.js";

/* =========================
CLOUDINARY
========================= */
const CLOUD_NAME = "dayvblw7g";
const UPLOAD_PRESET = "freshora_upload";

/* =========================
STATE
========================= */
let productsCache = [];
let editId = null;

/* =========================
UPLOAD IMAGE
========================= */
async function uploadImage(file) {

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", "freshora/products");

    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
            method: "POST",
            body: formData
        }
    );

    const data = await res.json();
    return data.secure_url;
}

/* =========================
ADD / UPDATE PRODUCT
========================= */
window.uploadOrUpdateProduct = async () => {

    const name = pname.value;
    const price = Number(pprice.value);
    const discount = Number(pdiscount.value || 0);
    const category = pcategory.value;
    const desc = pdesc.value;
    const file = pimageFile.files[0];

    if (!name || !price) {
        alert("Fill required fields");
        return;
    }

    let imageUrl = "";

    if (file) {
        imageUrl = await uploadImage(file);
    }

    const data = {
        name,
        price,
        discount,
        category,
        description: desc,
        updatedAt: new Date().toISOString()
    };

    if (imageUrl) data.image = imageUrl;

    if (editId) {
        await updateDoc(doc(db, "products", editId), data);
        editId = null;
        alert("Product Updated ✅");
    } else {
        await addDoc(collection(db, "products"), {
            ...data,
            createdAt: new Date().toISOString()
        });
        alert("Product Added ✅");
    }

    clearForm();
};

/* =========================
CLEAR FORM
========================= */
function clearForm() {
    pname.value = "";
    pprice.value = "";
    pdiscount.value = "";
    pcategory.value = "";
    pdesc.value = "";
    pimageFile.value = "";
}

/* =========================
EDIT PRODUCT
========================= */
window.editProduct = (p) => {

    editId = p.id;

    pname.value = p.name;
    pprice.value = p.price;
    pdiscount.value = p.discount;
    pcategory.value = p.category;
    pdesc.value = p.description;
};

/* =========================
DELETE
========================= */
window.deleteProduct = async (id) => {
    await deleteDoc(doc(db, "products", id));
};

/* =========================
SEARCH
========================= */
window.searchProducts = () => {

    const q = searchBox.value.toLowerCase();

    renderProducts(
        productsCache.filter(p =>
            (p.name || "").toLowerCase().includes(q)
        )
    );
};

/* =========================
RENDER PRODUCTS
========================= */
function renderProducts(list) {

    const el = document.getElementById("productList");

    el.innerHTML = list.map(p => `
        <div class="admin-card">

            <img src="${p.image}">

            <div style="flex:1">

                <b>${p.name}</b><br>
                Rs ${p.price}

                <div style="margin-top:5px">

                    <button onclick='editProduct(${JSON.stringify(p)})'>
                        Edit
                    </button>

                    <button onclick="deleteProduct('${p.id}')">
                        Delete
                    </button>

                </div>

            </div>

        </div>
    `).join("");
}

/* =========================
ORDERS + STATUS
========================= */
window.updateOrderStatus = async (id, status) => {

    await updateDoc(doc(db, "orders", id), {
        status
    });
};

onSnapshot(collection(db, "products"), (snap) => {

    productsCache = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
    }));

    renderProducts(productsCache);
});

onSnapshot(collection(db, "orders"), (snap) => {

    const el = document.getElementById("orderList");

    el.innerHTML = snap.docs.map(d => {

        const o = d.data();

        return `
        <div class="order-card">

            <b>Order:</b> ${o.orderId}<br>
            <b>Name:</b> ${o.customer?.name}<br>
            <b>Total:</b> Rs ${o.total}<br>
            <b>Status:</b> ${o.status || "Pending"}

            <br><br>

            <button onclick="updateOrderStatus('${d.id}','Pending')">Pending</button>
            <button onclick="updateOrderStatus('${d.id}','Delivered')">Delivered</button>

        </div>
        `;
    }).join("");
});

/* =========================
LOGOUT
========================= */
window.logout = () => {
    localStorage.removeItem("admin");
    window.location.href = "login.html";
};
