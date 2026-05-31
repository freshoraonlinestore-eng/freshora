import {
  db,
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot
} from "./firebase.js";

const list = document.getElementById("list");

window.addProduct = async () => {

  try {

    const name =
      document.getElementById("name").value.trim();

    const price =
      document.getElementById("price").value.trim();

    const file =
      document.getElementById("imageFile").files[0];

    if (!name || !price || !file) {
      alert("Fill all fields");
      return;
    }

    const formData = new FormData();

    formData.append("file", file);

    formData.append(
      "upload_preset",
      "freshora_upload"
    );

    const cloudinaryResponse =
      await fetch(
        "https://api.cloudinary.com/v1_1/dayvblw7g/image/upload",
        {
          method: "POST",
          body: formData
        }
      );

    const cloudinaryData =
      await cloudinaryResponse.json();

    const imageUrl =
      cloudinaryData.secure_url;

    await addDoc(
      collection(db, "products"),
      {
        name,
        price,
        image: imageUrl,
        createdAt: Date.now()
      }
    );

    document.getElementById("name").value = "";
    document.getElementById("price").value = "";
    document.getElementById("imageFile").value = "";

    alert("Product Added");

  } catch (error) {

    console.error(error);

    alert("Upload Failed");
  }
};

window.deleteProduct = async (id) => {

  if (!confirm("Delete product?"))
    return;

  await deleteDoc(
    doc(db, "products", id)
  );
};

window.editProduct = async (
  id,
  oldName,
  oldPrice
) => {

  const newName =
    prompt(
      "Product Name",
      oldName
    );

  if (!newName) return;

  const newPrice =
    prompt(
      "Price",
      oldPrice
    );

  if (!newPrice) return;

  await updateDoc(
    doc(db, "products", id),
    {
      name: newName,
      price: newPrice
    }
  );
};

onSnapshot(
  collection(db, "products"),
  (snap) => {

    list.innerHTML = "";

    snap.forEach((item) => {

      const p = item.data();

      list.innerHTML += `
        <div class="card">

          <img
            src="${p.image}"
            width="120"
          >

          <h3>${p.name}</h3>

          <p>Rs ${p.price}</p>

          <button onclick="
            editProduct(
              '${item.id}',
              '${p.name}',
              '${p.price}'
            )
          ">
            Edit
          </button>

          <button onclick="
            deleteProduct(
              '${item.id}'
            )
          ">
            Delete
          </button>

        </div>
      `;
    });

  }
);
