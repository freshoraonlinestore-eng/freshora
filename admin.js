import {
  db,
  auth,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  updateDoc,
  doc,
  signOut,
  onAuthStateChanged
} from "./firebase.js";

/* =========================
   PROTECT ADMIN PAGE
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
   ADD OR UPDATE PRODUCT
========================= */
window.addOrUpdateProduct = async function () {

  const productData = {
    name: nameEl.value,
    price: Number(priceEl.value),
    image: imageEl.value,
    category: categoryEl.value || "General",
    discount: Number(discountEl.value || 0),
    stock: stockEl.value || "In Stock",
    description: descEl.value || ""
  };

  if (!productData.name || !productData.price || !productData.image) {
    alert("Please fill required fields");
    return;
  }

  try {

    if (editId) {

      /* =========================
         UPDATE PRODUCT
      ========================= */
      await updateDoc(doc(db, "products", editId), productData);

      submitBtn.innerText = "Add Product";
      editId = null;

    } else {

      /* =========================
         ADD PRODUCT
      ========================= */
      await addDoc(collection(db, "products"), productData);
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

  if (!confirm("Delete this product?")) return;

  await deleteDoc(doc(db, "products", id));
};

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

/* =========================
   LOAD PRODUCTS
========================= */
onSnapshot(collection(db, "products"), (snap) => {

  list.innerHTML = "";

  snap.forEach((docItem) => {

    const p = docItem.data();
    const id = docItem.id;

    list.innerHTML += `
      <div class="card admin-card">

        <img src="${p.image}">

        <h3>${p.name}</h3>

        <p>Rs ${p.price}</p>

        <p>${p.category || ""}</p>

        <p>Discount: ${p.discount || 0}%</p>

        <p>${p.stock || ""}</p>

        <div style="display:flex; gap:8px; justify-content:center;">

          <button onclick='editProduct("${id}", ${JSON.stringify(p)})'>
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
