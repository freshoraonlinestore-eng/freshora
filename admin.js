import { db, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from "./firebase.js";

const CLOUD_NAME="dayvblw7g", UPLOAD_PRESET="freshora_upload", UPLOAD_FOLDER="freshora/products";
let productsData=[], selectedProductId=null;
const qs=id=>document.getElementById(id);
function showToast(msg){ let t=document.querySelector(".admin-toast"); if(!t){t=document.createElement("div");t.className="admin-toast";t.style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#222;color:#fff;padding:10px 20px;border-radius:20px;z-index:9999;";document.body.appendChild(t);} t.innerText=msg; t.style.display="block"; setTimeout(()=>t.style.display="none",2000); }

async function uploadToCloudinary(file){
  const fd=new FormData(); fd.append("file",file); fd.append("upload_preset",UPLOAD_PRESET); fd.append("folder",UPLOAD_FOLDER);
  const res=await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,{method:"POST",body:fd});
  const data=await res.json();
  if(!data.secure_url)throw new Error("Upload failed");
  return data.secure_url;
}

window.uploadAndAddProduct=async()=>{
  const files=qs("pimageFile").files, urls=[];
  const bar=qs("uploadProgress"), status=qs("uploadStatus");
  for(let i=0;i<files.length;i++){
    status.innerText=`Uploading ${i+1}/${files.length}...`;
    bar.style.width=`${((i+1)/files.length)*100}%`;
    try{ urls.push(await uploadToCloudinary(files[i])); }catch(e){ console.error(e); showToast(`Image ${i+1} failed`); }
  }
  status.innerText="Complete!"; bar.style.width="100%";
  await addDoc(collection(db,"products"),{
    name:qs("pname").value||"", price:Number(qs("pprice").value||0), discount:Number(qs("pdiscount").value||0),
    stock:Number(qs("pstock").value||0), category:qs("pcategorySelect").value||"Other", description:qs("pdesc").value||"",
    images:urls, image:urls[0]||"", featured:qs("pfeatured").checked, bestSeller:qs("pbestseller").checked,
    newArrival:qs("pnewarrival").checked, createdAt:Date.now()
  });
  showToast("Added with "+urls.length+" images");
  clearForm();
  setTimeout(()=>{ bar.style.width="0%"; status.innerText=""; },2000);
};

window.updateSelected=async()=>{
  if(!selectedProductId){ showToast("Select product first"); return; }
  const files=qs("pimageFile").files, urls=[], main="";
  if(files.length>0){
    const bar=qs("uploadProgress"), status=qs("uploadStatus");
    for(let i=0;i<files.length;i++){
      status.innerText=`Uploading ${i+1}/${files.length}...`;
      bar.style.width=`${((i+1)/files.length)*100}%`;
      try{ urls.push(await uploadToCloudinary(files[i])); }catch(e){ console.error(e); }
    }
    status.innerText="Complete!";
    setTimeout(()=>{ bar.style.width="0%"; status.innerText=""; },2000);
  }
  const data={ name:qs("pname").value||"", price:Number(qs("pprice").value||0), discount:Number(qs("pdiscount").value||0), stock:Number(qs("pstock").value||0), category:qs("pcategorySelect").value||"Other", description:qs("pdesc").value||"", featured:qs("pfeatured").checked, bestSeller:qs("pbestseller").checked, newArrival:qs("pnewarrival").checked };
  if(urls.length){ data.images=urls; data.image=urls[0]||""; }
  await updateDoc(doc(db,"products",selectedProductId),data);
  showToast("Updated");
  clearForm();
};

window.deleteProduct=async(id)=>{ if(!confirm("Delete?"))return; await deleteDoc(doc(db,"products",id)); showToast("Deleted"); };
window.selectProduct=(id)=>{
  const p=productsData.find(x=>x.id===id); if(!p)return;
  selectedProductId=id;
  qs("pname").value=p.name||""; qs("pprice").value=p.price||0; qs("pdiscount").value=p.discount||0; qs("pstock").value=p.stock||0;
  qs("pcategorySelect").value=p.category||"Other"; qs("pdesc").value=p.description||"";
  qs("pfeatured").checked=!!p.featured; qs("pbestseller").checked=!!p.bestSeller; qs("pnewarrival").checked=!!p.newArrival;
};
window.clearForm=()=>{
  ["pname","pprice","pdiscount","pstock","pdesc"].forEach(id=>qs(id).value="");
  qs("pimageFile").value=""; qs("pfeatured").checked=false; qs("pbestseller").checked=false; qs("pnewarrival").checked=false;
  selectedProductId=null;
};

onSnapshot(collection(db,"products"),(snap)=>{
  productsData=snap.docs.map(d=>({id:d.id,...d.data()}));
  qs("totalProducts").innerText=productsData.length;
  qs("totalStock").innerText=productsData.reduce((a,b)=>a+(b.stock||0),0);
  qs("lowStock").innerText=productsData.filter(p=>(p.stock||0)<5).length;
  qs("productListBody").innerHTML=productsData.map(p=>`
    <tr onclick="selectProduct('${p.id}')">
      <td><img src="${p.image||''}" width="40"></td>
      <td>${p.name}</td><td>${p.price}</td><td>${p.discount}%</td>
      <td>${Math.round(p.price-(p.price*p.discount/100))}</td>
      <td>${p.category}</td><td>${p.stock}</td>
      <td>${p.featured?'⭐':''}${p.bestSeller?'🔥':''}${p.newArrival?'🆕':''}</td>
      <td><button onclick="event.stopPropagation();deleteProduct('${p.id}')">🗑</button></td>
    </tr>
  `).join("");
});

// Delivery, Categories, Orders (පෙර පරිදිම)
// Coupons
window.addCoupon=async()=>{
  const code=qs("couponCode").value.trim().toUpperCase();
  const discount=Number(qs("couponDiscount").value);
  if(!code||!discount){ showToast("Fill all fields"); return; }
  await addDoc(collection(db,"coupons"),{code,discount,active:true});
  showToast("Coupon added");
  qs("couponCode").value=""; qs("couponDiscount").value="";
};
onSnapshot(collection(db,"coupons"),(snap)=>{
  qs("couponList").innerHTML=snap.docs.map(d=>`
    <div class="admin-card" style="display:flex;justify-content:space-between;">
      <span>${d.data().code} (${d.data().discount}%)</span>
      <button onclick="deleteDoc(doc(db,'coupons','${d.id}'))">🗑</button>
    </div>
  `).join("");
});

// Orders with tracking
window.updateOrderStatus=async(id,status)=>{ await updateDoc(doc(db,"orders",id),{status}); showToast("Updated"); };
window.updateTracking=async(id,tracking)=>{ await updateDoc(doc(db,"orders",id),{tracking}); showToast("Tracking updated"); };
onSnapshot(collection(db,"orders"),(snap)=>{
  const orders=snap.docs.map(d=>({id:d.id,...d.data()}));
  qs("orderList").innerHTML=orders.map(o=>`
    <tr>
      <td>${o.id.slice(-5)}</td>
      <td>${o.customer?.name||o.customerName||""}</td>
      <td>${o.customer?.phone||o.phone||""}</td>
      <td>${o.customer?.district||o.district||""}</td>
      <td>Rs ${o.total||0}</td>
      <td><select onchange="updateOrderStatus('${o.id}',this.value)"><option ${o.status=="Pending"?"selected":""}>Pending</option><option ${o.status=="Processing"?"selected":""}>Processing</option><option ${o.status=="Delivered"?"selected":""}>Delivered</option></select></td>
      <td><input placeholder="Tracking #" value="${o.tracking||''}" onchange="updateTracking('${o.id}',this.value)" style="width:80px;"></td>
      <td><button onclick='viewBill(${JSON.stringify(o)})'>View</button></td>
    </tr>
  `).join("");
});

window.viewBill=(order)=>{ qs("billModal").style.display="block"; qs("billContent").innerHTML=`<p><b>Order ID:</b> ${order.orderId||order.id}</p><hr>${(order.items||[]).map(i=>`<div>${i.name} x${i.qty} = Rs ${i.price*i.qty}</div>`).join("")}<hr><p><b>Total:</b> Rs ${order.total||0}</p><p><b>Tracking:</b> ${order.tracking||"Not yet"}</p>`; window.currentOrder=order; };
window.downloadBill=(order)=>{ const {jsPDF}=window.jspdf; const doc=new jsPDF(); doc.text("FRESHORA INVOICE",20,20); doc.text("Order: "+(order.orderId||order.id),20,40); let y=60; (order.items||[]).forEach(i=>{doc.text(`${i.name} x${i.qty} = Rs ${i.price*i.qty}`,20,y); y+=10;}); doc.text("TOTAL: Rs "+(order.total||0),20,y+10); doc.save("invoice_"+(order.orderId||order.id)+".pdf"); };

// Admin search
document.getElementById("adminSearch")?.addEventListener("input",(e)=>{
  const s=e.target.value.toLowerCase();
  document.querySelectorAll("#productListBody tr").forEach(row=>{
    const name=row.querySelector("td:nth-child(2)")?.textContent?.toLowerCase()||"";
    row.style.display=name.includes(s)?"":"none";
  });
});
