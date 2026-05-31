import {
  db,
  collection,
  addDoc,
  onSnapshot
} from "./firebase.js";

const list = document.getElementById("list");

// ADD PRODUCT
window.addProduct = async () => {
  try {

    const name = document.getElementById("name").value.trim();
    const price = document.getElementById("price").value.trim();
    const image = document.getElementById("image").value.trim();

    if (!name || !price || !image) {
      alert("Please fill all fields");
      return;
    }

    await addDoc(collection(db, "products"), {
      name,
      price,
      image,
      createdAt: Date.now()
    });

    // Clear inputs
    document.getElementById("name").value = "";
    document.getElementById("price").value = "";
    document.getElementById("image").value = "";

    alert("Product Added Successfully");

  } catch (error) {
    console.error(error);
    alert("Error adding product");
  }
};

// REALTIME LOAD
onSnapshot(collection(db, "products"), (snap) => {

  list.innerHTML = "";

  if (snap.empty) {
    list.innerHTML = "<p>No products found</p>";
    return;
  }

  snap.forEach((docItem) => {

    const p = docItem.data();

    list.innerHTML += `
      <div class="card">
        <img src="${p.image}" alt="${p.name}" width="100">
        <h3>${p.name}</h3>
        <p>Rs ${p.price}</p>
      </div>
    `;
  });

}, (error) => {

  console.error(error);

  list.innerHTML = `
    <p style="color:red">
      Failed to load products
    </p>
  `;
});
