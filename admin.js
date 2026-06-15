import { db, collection, onSnapshot, addDoc, deleteDoc, doc } from "./firebase.js";

/* =========================
UPLOAD IMAGE (simple fallback - URL only)
========================= */
async function getImageUrl(file) {
    if (!file) return "";

    // Simple base64 fallback (ANDROID SAFE)
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

/* =========================
ADD PRODUCT
========================= */
window.uploadAndAddProduct = async () => {

    try {

        const name = document.getElementById("pname").value;
        const price = document.getElementById("pprice").value;
        const discount = document.getElementById("pdiscount").value;
        const category = document.getElementById("pcategory").value;
        const desc = document.getElementById("pdesc").value;
        const file = document.getElementById("pimageFile").files[0];

        if (!name || !price) {
            alert("Name + Price required");
            return;
        }

        const imageUrl = await getImageUrl(file);

        await addDoc(collection(db, "products"), {
            name,
            price: Number(price),
            discount: Number(discount || 0),
            category,
            description: desc,
            image: imageUrl,
            createdAt: new Date().toISOString()
        });

        alert("Product Saved ✅");

    } catch (err) {
        console.error(err);
        alert("Error saving product");
    }
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
function loadProducts() {

    const list = document.getElementById("productList");

    if (!list) return;

    onSnapshot(collection(db, "products"), (snap) => {

        if (snap.empty) {
            list.innerHTML = "<p>No products</p>";
            return;
        }

        list.innerHTML = snap.docs.map(d => {

            const p = d.data();

            return `
            <div style="padding:10px;margin:10px;background:#fff;border-radius:10px">

                <img src="${p.image}" width="60" />

                <h4>${p.name}</h4>
                <p>Rs ${p.price}</p>

                <button onclick="deleteProduct('${d.id}')">
                    Delete
                </button>

            </div>
            `;
        }).join("");
    });
}

/* =========================
LOAD ORDERS (FIXED)
========================= */
function loadOrders() {

    const list = document.getElementById("orderList");

    onSnapshot(collection(db, "orders"), (snap) => {

        if (!list) return;

        list.innerHTML = snap.docs.map(d => {

            const o = d.data();

            return `
            <div style="padding:10px;margin:10px;background:#fff;border-radius:10px">

                <h4>${o.orderId}</h4>
                <p>${o.customer?.name || ""}</p>
                <p>Rs ${o.total || 0}</p>

            </div>
            `;
        }).join("");
    });
}

/* =========================
INIT (IMPORTANT FIX)
========================= */
window.addEventListener("DOMContentLoaded", () => {
    loadProducts();
    loadOrders();
});

/* =========================
LOGOUT
========================= */
window.logout = () => {
    localStorage.removeItem("admin");
    window.location.href = "login.html";
};
