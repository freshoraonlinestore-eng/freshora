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
   STATE
========================= */
let editId = null;
let isSaving = false;

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
   IMAGE UPLOAD (SAFE)
========================= */
async function uploadImage(file) {
  if (!file) return null;

  const storageRef = ref(
    storage,
    "products/" + Date.now() + "_" + file.name
  );

  await uploadBytes(storageRef, file);

  return await getDownloadURL(storageRef);
}

/* =========================
   ADD / UPDATE PRODUCT
========================= */
window.addOrUpdateProduct = async function () {

  if (isSaving) return;

  const name = nameEl.value.trim();
  const price = Number(priceEl.value);
  const file = document.getElementById("imageFile")?.files[0];

  const imageFromInput = imageEl.value.trim();

  if (!name || !price) {
    toast("❌ Name & Price required");
    return;
  }

  isSaving = true;
  submitBtn.disabled = true;
  submitBtn.innerText = "Saving...";

  try {

    let imageURL = imageFromInput;

    // upload file if exists
    if (file) {
      imageURL = await uploadImage(file);
    }

    if (!imageURL) {
      toast("❌ Image required");
      throw new Error("No image");
    }

    const product = {
      name,
      price,
      image: imageURL,
      category: categoryEl.value || "General",
      discount: Math.min(Number(discountEl.value || 0), 90),
      stock: stockEl.value || "In Stock",
      description: descEl.value || "",
      createdAt: Date.now()
    };

    if (editId) {

      await updateDoc(doc(db, "products", editId), product);
      toast("✅ Product Updated");

      editId = null;
      submitBtn.innerText = "Add Product";

    } else {

      await addDoc(collection(db, "products"), product);
      toast("✅ Product Added");
    }

    clearForm();

  } catch (err) {
    console.log(err);
    toast("❌ Error saving product");
  }

  isSaving = false;
  submitBtn.disabled = false;
  submitBtn.innerText = "Add Product";
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

  const file = document.getElementById("imageFile");
  if (file) file.value = "";
}

/* =========================
   DELETE PRODUCT
========================= */
window.deleteProduct = async function (id) {

  if (!confirm("Delete this product?")) return;

  try {
    await deleteDoc(doc(db, "products", id));
    toast("🗑 Deleted");
  } catch (e) {
    toast("❌ Delete failed");
  }
};

/* =========================
   EDIT PRODUCT (SAFE)
========================= */
window.editProduct = function (id, data) {

  editId = id;

  nameEl.value = data.name || "";
  priceEl.value = data.price || "";
  imageEl.value = data.image || "";
  categoryEl.value = data.category || "";
  discountEl.value = data.discount || 0;
  stockEl.value = data.stock || "";
  descEl.value = data.description || "";

  submitBtn.innerText = "Update Product";

  window.scrollTo({ top: 0, behavior: "smooth" });

  toast("✏ Edit Mode");
};

/* =========================
   LOAD PRODUCTS + ANALYTICS
========================= */
onSnapshot(collection(db, "products"), (snap) => {

  list.innerHTML = "";

  let totalProducts = 0;

  snap.forEach((docItem) => {

    const data = docItem.data();
    const id = docItem.id;

    totalProducts++;

    const safeData = encodeURIComponent(JSON.stringify(data));

    list.innerHTML += `
      <div class="card admin-card">

        <img src="${data.image}" loading="lazy">

        <h3>${data.name}</h3>

        <p>Rs ${data.price}</p>

        <small>Category: ${data.category || "-"}</small><br>
        <small>Discount: ${data.discount || 0}%</small><br>
        <small>Stock: ${data.stock || "-"}</small>

        <div style="display:flex; gap:10px; justify-content:center; margin-top:10px;">

          <button onclick="editProduct('${id}', JSON.parse(decodeURIComponent('${safeData}')))">
            Edit
          </button>

          <button onclick="deleteProduct('${id}')">
            Delete
          </button>

        </div>

      </div>
    `;
  });

  const totalEl = document.getElementById("totalProducts");
  if (totalEl) totalEl.innerText = totalProducts;
});

/* =========================
   LOGOUT
========================= */
window.logout = async function () {

  await signOut(auth);

  window.location.href = "login.html";
};
