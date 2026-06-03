import {
  db,
  auth,
  storage,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  signOut,
  onAuthStateChanged,
  ref,
  uploadBytes,
  getDownloadURL
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
   TOAST
========================= */
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerText = msg;

  document.body.appendChild(t);

  setTimeout(() => t.classList.add("show"), 100);

  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 300);
  }, 2000);
}

/* =========================
   IMAGE UPLOAD (FIREBASE STORAGE)
========================= */
async function uploadImage(file) {
  const storageRef = ref(storage, "products/" + Date.now() + "_" + file.name);

  await uploadBytes(storageRef, file);

  return await getDownloadURL(storageRef);
}

/* =========================
   ADD / UPDATE PRODUCT
========================= */
window.addOrUpdateProduct = async function () {

  const file = document.getElementById("imageFile")?.files[0];

  let imageURL = imageEl.value;

  try {

    /* upload image if file selected */
    if (file) {
      imageURL = await uploadImage(file);
    }

    const product = {
      name: nameEl.value.trim(),
      price: Number(priceEl.value),
      image: imageURL,
      category: categoryEl.value || "General",
      discount: Number(discountEl.value || 0),
      stock: stockEl.value || "In Stock",
      description: descEl.value || "",
      createdAt: Date.now()
    };

    if (!product.name || !product.price || !product.image) {
      toast("❌ Fill required fields");
      return;
    }

    if (editId) {

      await updateDoc(doc(db, "products", editId), product);

      toast("✅ Product Updated");

      submitBtn.innerText = "Add Product";
      editId = null;

    } else {

      await addDoc(collection(db, "products"), product);

      toast("✅ Product Added");
    }

    clearForm();

  } catch (err) {
    console.log(err);
    toast("❌ Error saving product");
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

  const fileInput = document.getElementById("imageFile");
  if (fileInput) fileInput.value = "";
}

/* =========================
   DELETE PRODUCT
========================= */
window.deleteProduct = async function (id) {

  if (!confirm("Delete this product?")) return;

  await deleteDoc(doc(db, "products", id));

  toast("🗑 Deleted");
};

/* =========================
   LOAD PRODUCTS
========================= */
onSnapshot(collection(db, "products"), (snap) => {

  list.innerHTML = "";

  snap.forEach((docItem) => {

    const data = docItem.data();
    const id = docItem.id;

    list.innerHTML += `
      <div class="card admin-card">

        <img src="${data.image}" loading="lazy">

        <h3>${data.name}</h3>

        <p>Rs ${data.price}</p>

        <small>Category: ${data.category || "-"}</small><br>
        <small>Discount: ${data.discount || 0}%</small><br>
        <small>Stock: ${data.stock || "-"}</small>

        <div class="admin-actions">

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

  window.scrollTo({ top: 0, behavior: "smooth" });

  toast("✏ Editing mode");
};

/* =========================
   LOGOUT
========================= */
window.logout = async function () {

  await signOut(auth);

  window.location.href = "login.html";
};
