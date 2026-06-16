FULL COMPLETE admin.js (REPLACE ENTIRE FILE)

import {
db,
collection,
addDoc,
onSnapshot,
deleteDoc,
doc
} from "./firebase.js";

/* =========================
CONFIG
========================= */
const CLOUD_NAME = "dayvblw7g";
const UPLOAD_PRESET = "freshora_upload";

/* =========================
STATE
========================= */
let productsData = [];
let ordersData = [];
let categoriesData = [];
let analyticsChart = null;

/* =========================
UTIL
========================= */
function qs(id){
return document.getElementById(id);
}

function toast(msg){

let t=document.querySelector(".admin-toast");

if(!t){

t=document.createElement("div");
t.className="admin-toast";
document.body.appendChild(t);

}

t.innerText=msg;
t.classList.add("show");

clearTimeout(window.toastTimer);

window.toastTimer=setTimeout(()=>{
t.classList.remove("show");
},2500);

}

function format(v){
return Number(v||0).toLocaleString();
}

/* =========================
UPLOAD IMAGE
========================= */
async function uploadImage(file){

if(!file) return "";

const fd=new FormData();

fd.append("file",file);
fd.append("upload_preset",UPLOAD_PRESET);
fd.append("folder","freshora/products");

const res=await fetch(
`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
{
method:"POST",
body:fd
}
);

const data=await res.json();

return data.secure_url || "";
}

/* =========================
CATEGORY SYSTEM
========================= */
window.addCategory=async()=>{

const name=qs("categoryName").value.trim();

if(!name){
toast("Enter category");
return;
}

await addDoc(collection(db,"categories"),{
name,
createdAt:new Date().toISOString()
});

qs("categoryName").value="";

toast("Category added");

};

window.deleteCategory=async(id)=>{

await deleteDoc(doc(db,"categories",id));

toast("Category deleted");

};

onSnapshot(collection(db,"categories"),snap=>{

categoriesData=snap.docs.map(d=>({
id:d.id,
...d.data()
}));

renderCategories();

});

/* =========================
RENDER CATEGORIES
========================= */
function renderCategories(){

const list=qs("categoryList");

if(list){

list.innerHTML=categoriesData.map(c=>`
<div class="category-item">

${c.name}

<button onclick="deleteCategory('${c.id}')">
<i class="fa-solid fa-xmark"></i>
</button>

</div>
`).join("");

}

const select=qs("pcategory");

if(select){

select.innerHTML=`
<option value="">Select Category</option>

${categoriesData.map(c=>`
<option value="${c.name}">
${c.name}
</option>
`).join("")}
`;

}

}

/* =========================
DELIVERY SETTINGS
========================= */
window.saveDeliverySettings=()=>{

localStorage.setItem(
"deliveryFee",
qs("deliveryFee").value || 350
);

localStorage.setItem(
"freeDelivery",
qs("freeDelivery").value || 5000
);

qs("deliveryFeeText").innerText=
"Rs "+(qs("deliveryFee").value||350);

toast("Delivery settings saved");

};

/* =========================
PRODUCT ADD
========================= */
window.uploadAndAddProduct=async()=>{

try{

const name=qs("pname").value.trim();
const price=qs("pprice").value;
const discount=qs("pdiscount").value;
const stock=qs("pstock").value;
const category=qs("pcategory").value;
const description=qs("pdesc").value;
const status=qs("pstatus").value;

if(!name || !price){

toast("Fill required fields");
return;

}

toast("Uploading images...");

const image1=await uploadImage(qs("pimage1").files[0]);
const image2=await uploadImage(qs("pimage2").files[0]);
const image3=await uploadImage(qs("pimage3").files[0]);

const images=[
image1,
image2,
image3
].filter(Boolean);

await addDoc(collection(db,"products"),{

name,
price:Number(price),
discount:Number(discount||0),
stock:Number(stock||0),
category,
description,

status,

image:images[0] || "",

images,

rating:0,

createdAt:new Date().toISOString()

});

toast("Product saved ✅");

clearForm();

}catch(err){

console.error(err);

toast("Save failed");

}

};

/* =========================
CLEAR FORM
========================= */
function clearForm(){

qs("pname").value="";
qs("pprice").value="";
qs("pdiscount").value="";
qs("pstock").value="";
qs("pcategory").value="";
qs("pdesc").value="";

qs("pimage1").value="";
qs("pimage2").value="";
qs("pimage3").value="";

}

/* =========================
DELETE PRODUCT
========================= */
window.deleteProduct=async(id)=>{

const ok=confirm("Delete product?");

if(!ok) return;

await deleteDoc(doc(db,"products",id));

toast("Product deleted");

};

/* =========================
EDIT PRODUCT
========================= */
window.editProduct=(id)=>{

const p=productsData.find(x=>x.id===id);

if(!p) return;

qs("pname").value=p.name || "";
qs("pprice").value=p.price || "";
qs("pdiscount").value=p.discount || "";
qs("pstock").value=p.stock || "";
qs("pcategory").value=p.category || "";
qs("pdesc").value=p.description || "";

window.scrollTo({
top:0,
behavior:"smooth"
});

toast("Edit loaded");

};

/* =========================
SEARCH PRODUCTS
========================= */
window.searchProducts=()=>{

const q=
qs("adminSearch")
.value
.toLowerCase()
.trim();

const filtered=productsData.filter(p=>
(p.name||"")
.toLowerCase()
.includes(q)
);

renderProducts(filtered);

};

/* =========================
RENDER PRODUCTS
========================= */
function renderProducts(data){

const list=qs("productList");

if(!list) return;

list.innerHTML=data.map(p=>{

const finalPrice=
p.discount>0
? Math.round(
p.price-(p.price*p.discount/100)
)
: p.price;

let stockClass="in-stock";
let stockText="In Stock";

if(p.stock<=0){

stockClass="out-stock";
stockText="Out Of Stock";

}else if(p.stock<=5){

stockClass="low-stock";
stockText="Low Stock";

}

return `
<div class="product-card">

<img src="${p.image || ""}">

<div class="product-content">

<div class="product-images">

${(p.images||[]).map(img=>`
<img src="${img}">
`).join("")}

</div>

<h4>${p.name}</h4>

<p>
Rs ${format(finalPrice)}
</p>

<p>
Category: ${p.category || "N/A"}
</p>

<div class="badge ${stockClass}">
${stockText}
</div>

<div class="product-actions">

<button
class="edit-btn"
onclick="editProduct('${p.id}')">

Edit

</button>

<button
class="delete-btn"
onclick="deleteProduct('${p.id}')">

Delete

</button>

</div>

</div>

</div>
`;

}).join("");

}

/* =========================
LOAD PRODUCTS
========================= */
onSnapshot(collection(db,"products"),snap=>{

productsData=snap.docs.map(d=>({
id:d.id,
...d.data()
}));

renderProducts(productsData);

qs("totalProducts").innerText=
productsData.length;

updateAnalytics();

});

/* =========================
RENDER ORDERS
========================= */
function renderOrders(data){

const list=qs("orderList");

if(!list) return;

list.innerHTML=data.map(o=>`

<div class="order-card">

<div class="order-top">

<h4>${o.orderId || "ORDER"}</h4>

<select class="order-status">

<option>Pending</option>
<option>Confirmed</option>
<option>Packing</option>
<option>Shipped</option>
<option>Delivered</option>

</select>

</div>

<p>👤 ${o.customer?.name || ""}</p>

<p>📞 ${o.customer?.phone || ""}</p>

<p>💰 Rs ${format(o.total || 0)}</p>

<p>📍 ${o.customer?.address || ""}</p>

</div>

`).join("");

}

/* =========================
LOAD ORDERS
========================= */
onSnapshot(collection(db,"orders"),snap=>{

ordersData=snap.docs.map(d=>({
id:d.id,
...d.data()
}));

renderOrders(ordersData);

qs("totalOrders").innerText=
ordersData.length;

updateAnalytics();

});

/* =========================
ANALYTICS
========================= */
function updateAnalytics(){

const revenue=ordersData.reduce(
(sum,o)=>sum+Number(o.total||0),
0
);

qs("totalRevenue").innerText=
"Rs "+format(revenue);

const canvas=qs("analyticsChart");

if(!canvas || typeof Chart==="undefined")
return;

const ctx=canvas.getContext("2d");

if(analyticsChart){
analyticsChart.destroy();
}

analyticsChart=new Chart(ctx,{

type:"bar",

data:{

labels:[
"Products",
"Orders",
"Revenue"
],

datasets:[{

label:"Freshora Analytics",

data:[
productsData.length,
ordersData.length,
revenue
],

borderRadius:12,
borderWidth:2

}]

},

options:{

responsive:true,

plugins:{
legend:{
display:false
}
}

}

});

}

/* =========================
LOGOUT
========================= */
window.logout=()=>{

localStorage.removeItem("admin");

window.location.href="login.html";

};

/* =========================
INIT
========================= */
window.addEventListener("DOMContentLoaded",()=>{

qs("adminSearch")
?.addEventListener(
"input",
searchProducts
);

qs("deliveryFee").value=
localStorage.getItem("deliveryFee") || 350;

qs("freeDelivery").value=
localStorage.getItem("freeDelivery") || 5000;

qs("deliveryFeeText").innerText=
"Rs "+(
localStorage.getItem("deliveryFee") || 350
);

console.log("Freshora Admin V7 Loaded");

});
