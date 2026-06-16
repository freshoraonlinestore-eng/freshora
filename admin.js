import {
  db,
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc
} from "./firebase.js";

/* =========================
STATE
========================= */
let editingId = null;

/* =========================
DEBUG
========================= */
console.log("ADMIN JS LOADED");

/* =========================
UPLOAD MULTI IMAGE (simple fallback URLs)
========================= */
function getImages() {
    const files = document.getElementById("pimageFile").files;

    let images = [];

    for (let i = 0; i < files.length; i++) {
        images.push(URL.createObjectURL(files[i]));
    }

    return images;
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

    if (!name || !price) {
        alert("Fill required fields");
        return;
    }

    const images = getImages();

    await addDoc(collection(db, "products"), {
        name,
        price: Number(price),
        discount: Number(discount || 0),
        category,
        description: desc,
        images,
        image: images[0] || "",
        createdAt: new Date().toISOString()
    });

    alert("Saved ✅");
};

/* =========================
DELETE PRODUCT
========================= */
window.deleteProduct = async (id) => {
    await deleteDoc(doc(db, "products", id));
};

/* =========================
LOAD PRODUCTS (FIXED)
========================= */
onSnapshot(collection(db, "products"), (snap) => {

    const list = document.getElementById("productList");

    if (!list) return;

    document.getElementById("totalProducts").innerText = snap.docs.length;

    list.innerHTML = snap.docs.map(d => {

        const p = d.data();

        return `
        <div>
            <img src="${p.image || ''}">
            <h4>${p.name || ''}</h4>
            <p>Rs ${p.price || 0}</p>
            <p>${p.category || ''}</p>

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

    if (!list) return;

    document.getElementById("totalOrders").innerText = snap.docs.length;

    let total = 0;

    list.innerHTML = snap.docs.map(d => {

        const o = d.data();
        total += o.total || 0;

        return `
        <div>
            <h4>${o.orderId}</h4>
            <p>${o.customer?.name || ''}</p>
            <p>Rs ${o.total || 0}</p>
        </div>
        `;
    }).join("");

    document.getElementById("totalRevenue").innerText = total;
});

/* =========================
LOGOUT
========================= */
window.logout = () => {
    localStorage.removeItem("admin");
    window.location.href = "login.html";
};
