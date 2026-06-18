import {
  db,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  getDocs
} from "./firebase.js";

/* =========================
STATE
========================= */
let products = [];
let orders = [];
let selectedId = null;
let currentPage = 1;
const perPage = 8;

const $ = (id) => document.getElementById(id);

/* =========================
TOAST
========================= */
function toast(msg) {
  let t = document.querySelector(".admin-toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "admin-toast";
    document.body.appendChild(t);
  }
  t.innerText = msg;
  t.style.display = "block";
  setTimeout(() => (t.style.display = "none"), 2000);
}

/* =========================
UPLOAD IMAGE
========================= */
async function uploadImages(files) {
  let urls = [];
  if (!files) return urls;

  for (let f of files) {
    let form = new FormData();
    form.append("file", f);
    form.append("upload_preset", "freshora_upload");

    let res = await fetch(
      "https://api.cloudinary.com/v1_1/dayvblw7g/image/upload",
      { method: "POST", body: form }
    );

    let data = await res.json();
    if (data.secure_url) urls.push(data.secure_url);
  }

  return urls;
}

/* =========================
PRODUCT ADD
========================= */
window.uploadAndAddProduct = async () => {
  const images = await uploadImages($("pimageFile").files);

  await addDoc(collection(db, "products"), {
    name: $("pname").value,
    price: Number($("pprice").value),
    discount: Number($("pdiscount").value),
    stock: Number($("pstock").value),
    desc: $("pdesc").value,
    category: $("pcategorySelect").value,
    images,
    createdAt: Date.now()
  });

  toast("Product Added");
  clearForm();
};

/* =========================
RENDER PRODUCTS
========================= */
function renderProducts(list) {
  let start = (currentPage - 1) * perPage;
  let page = list.slice(start, start + perPage);

  $("productListBody").innerHTML = page.map(p => `
    <tr onclick="selectProduct('${p.id}')">
      <td><img src="${p.images?.[0] || ''}" width="40"></td>
      <td>${p.name}</td>
      <td>${p.price}</td>
      <td>${p.discount}%</td>
      <td>${p.stock}</td>
      <td>${p.category}</td>
      <td><button onclick="event.stopPropagation(); deleteProduct('${p.id}')">🗑</button></td>
    </tr>
  `).join("");
}

/* =========================
PRODUCTS LIVE
========================= */
onSnapshot(collection(db, "products"), snap => {
  products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderProducts(products);

  $("totalProducts").innerText = products.length;
});

/* =========================
SELECT / UPDATE
========================= */
window.selectProduct = (id) => {
  let p = products.find(x => x.id === id);
  selectedId = id;

  $("pname").value = p.name;
  $("pprice").value = p.price;
  $("pdiscount").value = p.discount;
  $("pstock").value = p.stock;
  $("pdesc").value = p.desc;
};

window.updateSelected = async () => {
  await updateDoc(doc(db,"products",selectedId),{
    name:$("pname").value,
    price:Number($("pprice").value),
    discount:Number($("pdiscount").value),
    stock:Number($("pstock").value)
  });

  toast("Updated");
};

/* =========================
DELETE
========================= */
window.deleteProduct = async (id) => {
  await deleteDoc(doc(db,"products",id));
  toast("Deleted");
};

/* =========================
CLEAR
========================= */
window.clearForm = () => {
  ["pname","pprice","pdiscount","pstock","pdesc"].forEach(i=>$(i).value="");
  $("pimageFile").value="";
  selectedId=null;
};

/* =========================
SEARCH
========================= */
$("adminSearch")?.addEventListener("input", e => {
  let v = e.target.value.toLowerCase();
  renderProducts(products.filter(p =>
    p.name.toLowerCase().includes(v)
  ));
});

/* =========================
ORDERS
========================= */
onSnapshot(collection(db,"orders"), snap => {
  orders = snap.docs.map(d=>({id:d.id,...d.data()}));

  let total = 0;

  $("orderList").innerHTML = orders.map(o=>{
    total += Number(o.totalBill||0);

    return `
      <tr>
        <td>${o.customerName}</td>
        <td>${o.status}</td>
        <td>${o.totalBill}</td>
        <td>
          <button onclick="updateStatus('${o.id}','Confirmed')">✔</button>
          <button onclick="updateStatus('${o.id}','Delivered')">📦</button>
        </td>
      </tr>
    `;
  }).join("");

  $("totalRevenue").innerText="Rs "+total;
});

/* =========================
ORDER STATUS + WHATSAPP
========================= */
window.updateStatus = async (id,status)=>{
  await updateDoc(doc(db,"orders",id),{status});

  window.open(
    "https://wa.me/94752425790?text="+encodeURIComponent("Order "+id+" "+status),
    "_blank"
  );

  toast("Updated");
};

/* =========================
COUPON
========================= */
window.addCoupon = async ()=>{
  await addDoc(collection(db,"coupons"),{
    code:$("couponCode").value,
    discount:Number($("couponDiscount").value)
  });

  toast("Coupon Added");
};

/* =========================
BANNER
========================= */
window.uploadBanner = async ()=>{
  const file=$("bannerUpload").files[0];

  let form=new FormData();
  form.append("file",file);
  form.append("upload_preset","freshora_upload");

  let res=await fetch("https://api.cloudinary.com/v1_1/dayvblw7g/image/upload",{method:"POST",body:form});
  let data=await res.json();

  await addDoc(collection(db,"banners"),{
    image:data.secure_url,
    createdAt:Date.now()
  });

  toast("Banner Added");
};

/* =========================
PAGINATION
========================= */
window.nextPage=()=>{currentPage++;renderProducts(products)};
window.prevPage=()=>{if(currentPage>1)currentPage--;renderProducts(products)};
