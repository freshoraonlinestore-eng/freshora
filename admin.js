import { db, collection, addDoc, onSnapshot, deleteDoc, doc } from "./firebase.js";

/* =========================
CLOUDINARY CONFIG
========================= */
const CLOUD_NAME = "dayvblw7g";
const UPLOAD_PRESET = "freshora_upload";

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
        { method: "POST", body: formData }
    );

    const data = await res.json();
    return data.secure_url;
}

/* =========================
ADD PRODUCT
========================= */
window.uploadAndAddProduct = async () => {

    const name = pname.value;
    const price = pprice.value;
    const discount = pdiscount.value;
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

    await addDoc(collection(db, "products"), {
        name,
        price: Number(price),
        discount: Number(discount || 0),
        category,
        description: desc,
        image: imageUrl,
        createdAt: new Date().toISOString()
    });

    alert("Product Added ✅");

    // clear form
    pname.value = "";
    pprice.value = "";
    pdiscount.value = "";
    pcategory.value = "";
    pdesc.value = "";
    pimageFile.value = "";
};

/* =========================
DELETE PRODUCT
========================= */
window.deleteProduct = async (id) => {
    await deleteDoc(doc(db, "products", id));
};

/* =========================
LOAD PRODUCTS (FIXED SAFE)
========================= */
onSnapshot(collection(db, "products"), (snap) => {

    const list = document.getElementById("productList");

    if (!list) return;

    const products = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
    }));

    if (products.length === 0) {
        list.innerHTML = "<p>No products found</p>";
        return;
    }

    list.innerHTML = products.map(p => `
        <div style="padding:10px;background:#fff;margin:8px;border-radius:10px;display:flex;gap:10px;align-items:center">

            <img src="${p.image || ''}" width="60" height="60" style="object-fit:cover;border-radius:8px">

            <div style="flex:1">

                <h4>${p.name || ''}</h4>
                <p>Rs ${p.price || 0}</p>

            </div>

            <button onclick="deleteProduct('${p.id}')">
                Delete
            </button>

        </div>
    `).join("");
});

/* =========================
LOAD ORDERS (SAFE)
========================= */
onSnapshot(collection(db, "orders"), (snap) => {

    const list = document.getElementById("orderList");

    if (!list) return;

    const orders = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
    }));

    if (orders.length === 0) {
        list.innerHTML = "<p>No orders yet</p>";
        return;
    }

    list.innerHTML = orders.map(o => `
        <div style="padding:10px;background:#fff;margin:8px;border-radius:10px">

            <h4>${o.orderId}</h4>
            <p>${o.customer?.name || ''}</p>
            <p>Rs ${o.total || 0}</p>

        </div>
    `).join("");
});

/* =========================
LOGOUT
========================= */
window.logout = () => {
    localStorage.removeItem("admin");
    window.location.href = "login.html";
};
