import {
    db,
    collection,
    addDoc,
    onSnapshot,
    deleteDoc,
    doc
} from "./firebase.js";

/* =========================
CLOUDINARY CONFIG
========================= */
const CLOUD_NAME = "dayvblw7g";
const UPLOAD_PRESET = "freshora_upload";

/* =========================
UPLOAD IMAGE (Cloudinary)
========================= */
async function uploadImage(file) {

    if (!file) return "";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", "freshora/products");

    try {
        const res = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: formData
            }
        );

        const data = await res.json();
        return data.secure_url || "";

    } catch (err) {
        console.error("Upload error:", err);
        return "";
    }
}

/* =========================
ADD PRODUCT
========================= */
window.uploadAndAddProduct = async () => {

    const name = document.getElementById("pname")?.value.trim();
    const price = document.getElementById("pprice")?.value;
    const discount = document.getElementById("pdiscount")?.value || 0;
    const category = document.getElementById("pcategory")?.value;
    const desc = document.getElementById("pdesc")?.value;

    const file = document.getElementById("pimageFile")?.files?.[0];

    if (!name || !price) {
        alert("Please fill required fields");
        return;
    }

    let imageUrl = "";

    if (file) {
        imageUrl = await uploadImage(file);
    } else {
        imageUrl = document.getElementById("pimage")?.value || "";
    }

    try {
        await addDoc(collection(db, "products"), {
            name,
            price: Number(price),
            discount: Number(discount),
            category,
            description: desc,
            image: imageUrl,
            createdAt: new Date().toISOString()
        });

        alert("Product Added ✅");

        // clear inputs
        document.getElementById("pname").value = "";
        document.getElementById("pprice").value = "";
        document.getElementById("pdiscount").value = "";
        document.getElementById("pcategory").value = "";
        document.getElementById("pdesc").value = "";
        if (document.getElementById("pimageFile")) {
            document.getElementById("pimageFile").value = "";
        }
        document.getElementById("pimage").value = "";

    } catch (err) {
        console.error(err);
        alert("Failed to add product");
    }
};

/* =========================
DELETE PRODUCT
========================= */
window.deleteProduct = async (id) => {

    if (!confirm("Delete this product?")) return;

    try {
        await deleteDoc(doc(db, "products", id));
        alert("Deleted ✅");
    } catch (err) {
        console.error(err);
        alert("Delete failed");
    }
};

/* =========================
LOAD PRODUCTS (LIVE)
========================= */
onSnapshot(collection(db, "products"), (snap) => {

    const list = document.getElementById("productList");

    if (!list) return;

    if (snap.empty) {
        list.innerHTML = "<p>No products found</p>";
        return;
    }

    list.innerHTML = snap.docs.map(d => {

        const p = d.data();

        return `
        <div class="admin-card">

            <img src="${p.image || ''}" alt="product">

            <h4>${p.name || 'No name'}</h4>

            <p>Rs ${p.price || 0}</p>

            <small>${p.category || ''}</small>

            <button class="delete-btn"
                onclick="deleteProduct('${d.id}')">
                Delete
            </button>

        </div>
        `;
    }).join("");
});

/* =========================
LOAD ORDERS (LIVE)
========================= */
onSnapshot(collection(db, "orders"), (snap) => {

    const list = document.getElementById("orderList");

    if (!list) return;

    if (snap.empty) {
        list.innerHTML = "<p>No orders yet</p>";
        return;
    }

    list.innerHTML = snap.docs.map(d => {

        const o = d.data();

        return `
        <div class="order-card">

            <h4>📦 ${o.orderId || 'Order'}</h4>

            <p>👤 ${o.customer?.name || 'No name'}</p>

            <p>📞 ${o.customer?.phone || ''}</p>

            <p>💰 ${o.total || 0} LKR</p>

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
