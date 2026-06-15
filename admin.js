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
        {
            method: "POST",
            body: formData
        }
    );

    const data = await res.json();
    return data.secure_url;
}

/* =========================
ADD PRODUCT
========================= */
window.uploadAndAddProduct = async () => {

    const name = document.getElementById("pname").value;
    const price = document.getElementById("pprice").value;
    const discount = document.getElementById("pdiscount").value;
    const category = document.getElementById("pcategory").value;
    const desc = document.getElementById("pdesc").value;
    const file = document.getElementById("pimageFile").files[0];

    if (!name || !price || !file) {
        alert("Fill required fields");
        return;
    }

    const imageUrl = await uploadImage(file);

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
};

/* =========================
DELETE PRODUCT
========================= */
window.deleteProduct = async (id) => {
    await deleteDoc(doc(db, "products", id));
};

/* =========================
LOAD PRODUCTS
========================= */
onSnapshot(collection(db, "products"), (snap) => {

    const list = document.getElementById("productList");

    list.innerHTML = snap.docs.map(d => {

        const p = d.data();

        return `
        <div style="padding:10px;background:#fff;margin:8px;border-radius:10px">

            <img src="${p.image}" width="60">

            <h4>${p.name}</h4>
            <p>Rs ${p.price}</p>

            <button onclick="deleteProduct('${d.id}')">
                Delete
            </button>

        </div>
        `;
    }).join("");
});

/* =========================
LOAD ORDERS
========================= */
onSnapshot(collection(db, "orders"), (snap) => {

    const list = document.getElementById("orderList");

    list.innerHTML = snap.docs.map(d => {

        const o = d.data();

        return `
        <div style="padding:10px;background:#fff;margin:8px;border-radius:10px">

            <h4>${o.orderId}</h4>
            <p>${o.customer?.name}</p>
            <p>${o.total} LKR</p>

        </div>
        `;
    }).join("");
});

/* =========================
LOGOUT (simple)
========================= */
window.logout = () => {
    localStorage.removeItem("admin");
    window.location.href = "login.html";
};
