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
let products = [];
let orders = [];
let categories = [];

/* =========================
CLOUDINARY
========================= */
const CLOUD = "dayvblw7g";
const PRESET = "freshora_upload";

async function uploadImages(files) {
let urls = [];

if (!files) return urls;

for (let i = 0; i < Math.min(files.length, 3); i++) {
const form = new FormData();
form.append("file", files[i]);
form.append("upload_preset", PRESET);

const res = await fetch(
`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`,
{
method: "POST",
body: form
}
);

const data = await res.json();
urls.push(data.secure_url);
}

return urls;
}

/* =========================
ADD / UPDATE PRODUCT
========================= */
window.uploadAndAddProduct = async () => {

const name = pname.value;
const price = Number(pprice.value);
const discount = Number(pdiscount.value || 0);
const category = pcategory.value;
const desc = pdesc.value;
const files = pimageFile.files;

if (!name || !price) return alert("Fill required fields");

const images = await uploadImages(files);

await addDoc(collection(db, "products"), {
name,
price,
discount,
category,
description: desc,
stock: 10,
images,
image: images[0] || "",
createdAt: new Date().toISOString()
});

alert("Saved ✅");
};

/* =========================
DELETE PRODUCT
========================= */
window.deleteProduct = async (id) => {
await deleteDoc(doc(db, "products", id));
};

/* =========================
EDIT MODAL STYLE UPDATE
========================= */
window.editProduct = (p) => {
pname.value = p.name;
pprice.value = p.price;
pdiscount.value = p.discount;
pcategory.value = p.category;
pdesc.value = p.description;

window.editId = p.id;
};

/* =========================
UPDATE PRODUCT
========================= */
window.updateProduct = async () => {
if (!window.editId) return alert("Select product first");

await updateDoc(doc(db, "products", window.editId), {
name: pname.value,
price: Number(pprice.value),
discount: Number(pdiscount.value),
category: pcategory.value,
description: pdesc.value
});

alert("Updated ✅");
};

/* =========================
LOAD PRODUCTS
========================= */
onSnapshot(collection(db, "products"), (snap) => {

products = snap.docs.map(d => ({ id: d.id, ...d.data() }));

productList.innerHTML = products.map(p => `
<div class="card">

<img src="${p.image}" width="60">

<div>
<b>${p.name}</b><br>
Rs ${p.price}<br>
Stock:
<button onclick="changeStock('${p.id}',-1)">-</button>
${p.stock || 0}
<button onclick="changeStock('${p.id}',1)">+</button>
<br>
${p.category}
</div>

<button onclick='editProduct(${JSON.stringify(p)})'>Edit</button>
<button onclick="deleteProduct('${p.id}')">Del</button>

</div>
`).join("");

updateAnalytics();
});

/* =========================
STOCK SYSTEM
========================= */
window.changeStock = async (id, val) => {

const p = products.find(x => x.id === id);
if (!p) return;

await updateDoc(doc(db,"products",id), {
stock: (p.stock || 0) + val
});
};

/* =========================
CATEGORIES CRUD
========================= */
window.addCategory = async () => {
await addDoc(collection(db,"categories"), {
name: catInput.value
});
catInput.value = "";
};

window.deleteCategory = async (id) => {
await deleteDoc(doc(db,"categories",id));
};

function loadCategories() {
onSnapshot(collection(db,"categories"), snap => {

categories = snap.docs.map(d => ({id:d.id,...d.data()}));

pcategory.innerHTML =
categories.map(c=>`<option value="${c.name}">${c.name}</option>`).join("");

catList.innerHTML =
categories.map(c=>`
<div>
${c.name}
<button onclick="deleteCategory('${c.id}')">X</button>
</div>
`).join("");
});
}
loadCategories();

/* =========================
ORDERS + STATUS
========================= */
onSnapshot(collection(db,"orders"), snap => {

orders = snap.docs.map(d => ({id:d.id,...d.data()}));

orderList.innerHTML = orders.map(o=>`
<div>
<b>${o.orderId}</b>
<p>${o.customer?.name}</p>

<span class="${o.status}">
${o.status || "Pending"}
</span>

<select onchange="updateStatus('${o.id}',this.value)">
<option>Pending</option>
<option>Delivered</option>
</select>
</div>
`).join("");

updateAnalytics();
});

window.updateStatus = async (id,status)=>{
await updateDoc(doc(db,"orders",id),{status});
};

/* =========================
ANALYTICS + CHART
========================= */
function updateAnalytics(){

totalProducts.innerText = products.length;
totalOrders.innerText = orders.length;

let revenue = 0;
orders.forEach(o => revenue += Number(o.total||0));

totalRevenue.innerText = "Rs " + revenue;

renderChart(products.length, orders.length, revenue);
}

function renderChart(p,o,r){

if(window.chart) window.chart.destroy();

window.chart = new Chart(analyticsChart,{
type:"line",
data:{
labels:["Products","Orders","Revenue"],
datasets:[{
data:[p,o,r],
borderColor:"#1f8f4d",
tension:0.3
}]
}
});
}

/* =========================
LOGOUT
========================= */
window.logout = ()=>{
localStorage.removeItem("admin");
location.href="login.html";
};
