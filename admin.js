import { db, collection, addDoc, onSnapshot, deleteDoc, doc } from "./firebase.js";

import { auth } from "./firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* =========================
LOGOUT
========================= */
window.logout = async () => {
    await signOut(auth);
    window.location.href = "login.html";
};

/* =========================
ADD PRODUCT
========================= */
window.addProduct = async () => {
    const name = document.getElementById("pname").value;
    const price = document.getElementById("pprice").value;
    const discount = document.getElementById("pdiscount").value;
    const category = document.getElementById("pcategory").value;
    const description = document.getElementById("pdesc").value;
    const image = document.getElementById("pimage").value;

    if (!name || !price) return alert("Fill required fields");

    await addDoc(collection(db, "products"), {
        name,
        price: Number(price),
        discount: Number(discount || 0),
        category,
        description,
        image,
        createdAt: new Date().toISOString()
    });

    alert("Product Added");
};

/* =========================
LOAD PRODUCTS
========================= */
onSnapshot(collection(db, "products"), (snap) => {
    const list = document.getElementById("productList");
    list.innerHTML = "";

    snap.forEach(d => {
        const p = d.data();

        list.innerHTML += `
        <div style="padding:10px;border:1px solid #ddd;margin:5px">
            <b>${p.name}</b> - Rs ${p.price}
            <button onclick="deleteProduct('${d.id}')">Delete</button>
        </div>
        `;
    });
});

/* =========================
DELETE PRODUCT
========================= */
window.deleteProduct = async (id) => {
    await deleteDoc(doc(db, "products", id));
};

/* =========================
LOAD ORDERS
========================= */
onSnapshot(collection(db, "orders"), (snap) => {
    const list = document.getElementById("orderList");
    list.innerHTML = "";

    snap.forEach(d => {
        const o = d.data();

        list.innerHTML += `
        <div style="padding:10px;border:1px solid #ddd;margin:5px">
            <b>${o.orderId}</b><br>
            ${o.customer?.name} - ${o.total}
        </div>
        `;
    });
});
