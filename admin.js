import {
  db,
  auth,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  signOut,
  onAuthStateChanged
} from "./firebase.js";

/* =========================
   AUTH PROTECTION
========================= */
onAuthStateChanged(auth, (user) => {

  if (!user) {
    window.location.href = "login.html";
  }
});

/* =========================
   ELEMENTS
========================= */
const list = document.getElementById("list");

const nameEl = document.getElementById("name");
const priceEl = document.getElementById("price");
const imageEl = document.getElementById("image");
const categoryEl = document.getElementById("category");
const discountEl = document.getElementById("discount");
const stockEl = document.getElementById("stock");
const descEl = document.getElementById("description");

const submitBtn = document.getElementById("submitBtn");

/* =========================
   EDIT STATE
========================= */
let editId = null;

/* =========================
   ADD / UPDATE PRODUCT
========================= */
window.addOrUpdateProduct = async function () {

  const product = {
    name: nameEl.value,
    price: Number(priceEl.value),
    image: imageEl.value,
    category: categoryEl.value || "General",
    discount: Number(discountEl.value || 0),
    stock: stockEl.value || "In Stock",
    description: descEl.value || ""
  };

  if (!product.name || !product.price || !product.image) {
    alert("Please fill required fields");
    return;
  }

  try {

    if (editId) {

      /* =========================
         UPDATE PRODUCT
      ========================= */
      await updateDoc(doc(db, "products", editId), product);

      submitBtn.innerText = "Add Product";
      editId = null;

    } else {

      /* =========================
         CREATE PRODUCT
      ========================= */
      await addDoc(collection(db, "products"), product);
    }

    clearForm();

  } catch (error) {
    console.log(error);
    alert("Error saving product");
  }
};

/* =========================
   CLEAR FORM
========================= */
function clearForm() {

  nameEl.value = "";
  priceEl.value = "";
  imageEl.value = "";
  categoryEl.value = "";
  discountEl.value = "";
  stockEl.value = "";
  descEl.value = "";
}

/* =========================
   DELETE PRODUCT
========================= */
window.deleteProduct = async function (id) {

  const confirmDelete = confirm("Are you sure you want to delete this product?");

  if (!confirmDelete) return;

  try {

    await deleteDoc(doc(db, "products", id));

  } catch (error) {

    console.log(error);
    alert("Delete failed");
  }
};

/* =========================
   LOAD PRODUCTS (REALTIME)
========================= */
onSnapshot(collection(db, "products"), (snap) => {

  list.innerHTML = "";

  snap.forEach((docItem) => {

    const data = docItem.data();
    const id = docItem.id;

    list.innerHTML += `
      <div class="card admin-card">

        <img src="${data.image}">

        <h3>${data.name}</h3>

        <p>Rs ${data.price}</p>

        <p>Category: ${data.category || "N/A"}</p>

        <p>Discount: ${data.discount || 0}%</p>

        <p>Stock: ${data.stock || "N/A"}</p>

        <div style="display:flex; gap:10px; justify-content:center;">

          <button onclick='editProduct("${id}", ${JSON.stringify(data)})'>
            Edit
          </button>

          <button onclick='deleteProduct("${id}")'>
            Delete
          </button>

        </div>

      </div>
    `;
  });
});

/* =========================
   EDIT PRODUCT
========================= */
window.editProduct = function (id, data) {

  editId = id;

  nameEl.value = data.name;
  priceEl.value = data.price;
  imageEl.value = data.image;
  categoryEl.value = data.category;
  discountEl.value = data.discount;
  stockEl.value = data.stock;
  descEl.value = data.description;

  submitBtn.innerText = "Update Product";
};

/* =========================
   LOGOUT
========================= */
window.logout = async function () {

  await signOut(auth);

  window.location.href = "login.html";
};
