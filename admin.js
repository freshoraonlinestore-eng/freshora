import {
  db,
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc
} from "./firebase.js";

/* =========================
STATE
========================= */
let editId = null;

/* =========================
SETTINGS (Delivery Fee)
========================= */
window.saveSettings = async () => {

    const fee = Number(document.getElementById("deliveryFee").value);

    await addDoc(collection(db, "settings"), {
        deliveryFee: fee
    });

    alert("Settings saved");
};

/* =========================
CATEGORY
========================= */
window.addCategory = async () => {

    const name = document.getElementById("catName").value;

    if (!name) return;

    await addDoc(collection(db, "categories"), {
        name
    });
};

/* LOAD CATEGORY */
onSnapshot(collection(db, "categories"), (snap) => {

    const list = document.getElementById("categoryList");
    const select = document.getElementById("pcategory");

    list.innerHTML = "";
    select.innerHTML = "";

    snap.docs.forEach(d => {

        const c = d.data();

        list.innerHTML += `
            <div>
                ${c.name}
                <button onclick="deleteCategory('${d.id}')">Delete</button>
            </div>
        `;

        select.innerHTML += `<option>${c.name}</option>`;
    });
});

/* DELETE CATEGORY */
window.deleteCategory = async (id) => {
    await deleteDoc(doc(db, "categories", id));
};

/* =========================
PRODUCT SAVE (ADD/UPDATE)
========================= */
window.saveProduct = async () => {

    const name = pname.value;
    const price = Number(pprice.value);
    const discount = Number(pdiscount.value);
    const category = pcategory.value;
    const stock = Number(pstock.value);
    const desc = pdesc.value;

    let images = [];

    const files = document.getElementById("pimageFile").files;

    for (let i = 0; i < files.length; i++) {
        images.push(URL.createObjectURL(files[i]));
    }

    const data = {
        name,
        price,
        discount,
        category,
        stock,
        description: desc,
        image: images[0] || "",
        images
    };

    if (editId) {
        await updateDoc(doc(db, "products", editId), data);
        editId = null;
        alert("Updated");
    } else {
        await addDoc(collection(db, "products"), data);
        alert("Added");
    }
};

/* =========================
LOAD PRODUCTS
========================= */
onSnapshot(collection(db, "products"), (snap) => {

    const list = document.getElementById("productList");

    document.getElementById("totalProducts").innerText = snap.docs.length;

    list.innerHTML = snap.docs.map(d => {

        const p = d.data();

        return `
        <div>
            <img src="${p.image}" width="50">
            <h4>${p.name}</h4>
            <p>Rs ${p.price}</p>
            <p>Stock: ${p.stock}</p>

            <button onclick="deleteProduct('${d.id}')">Delete</button>
            <button onclick="editProduct('${d.id}', '${p.name}', ${p.price}, ${p.discount})">Edit</button>
        </div>
        `;
    }).join("");
});

/* DELETE PRODUCT */
window.deleteProduct = async (id) => {
    await deleteDoc(doc(db, "products", id));
};

/* EDIT PRODUCT */
window.editProduct = (id, name, price, discount) => {

    pname.value = name;
    pprice.value = price;
    pdiscount.value = discount;

    editId = id;
};

/* =========================
ORDERS + ANALYTICS
========================= */
onSnapshot(collection(db, "orders"), (snap) => {

    const list = document.getElementById("orderList");

    let revenue = 0;

    document.getElementById("totalOrders").innerText = snap.docs.length;

    list.innerHTML = snap.docs.map(d => {

        const o = d.data();
        revenue += o.total || 0;

        return `
        <div>
            <h4>${o.orderId}</h4>
            <p>${o.customer?.name}</p>
            <p>${o.total} LKR</p>
        </div>
        `;
    }).join("");

    document.getElementById("totalRevenue").innerText = revenue;
});

/* =========================
LOGOUT
========================= */
window.logout = () => {
    localStorage.removeItem("admin");
    window.location.href = "login.html";
};
