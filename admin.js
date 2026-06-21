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
CONFIG
========================= */
const CLOUD_NAME = "dayvblw7g";
const UPLOAD_PRESET = "freshora_upload";
const UPLOAD_FOLDER = "freshora/products";

let productsData = [];
let selectedProductId = null;
let ordersData = [];
let deliveryFeesData = [];
let categoriesData = [];

/* =========================
🔔 ORDER NOTIFICATION STATE
========================= */
let previousOrderIds = new Set();

/* =========================
🔊 PLAY SOUND FUNCTION
========================= */
function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create two tones for a pleasant notification sound
    const frequencies = [800, 1000];
    const durations = [0.15, 0.15];
    const gap = 0.1;
    
    frequencies.forEach((freq, index) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime + index * (durations[0] + gap));
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + index * (durations[0] + gap) + durations[index]);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start(audioCtx.currentTime + index * (durations[0] + gap));
      oscillator.stop(audioCtx.currentTime + index * (durations[0] + gap) + durations[index]);
    });
  } catch (e) {
    console.warn("Sound playback failed:", e);
  }
}

/* =========================
🔔 SEND NOTIFICATION
========================= */
function sendOrderNotification(order) {
  // Request notification permission
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return;
  }

  if (Notification.permission === "granted") {
    showNotification(order);
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        showNotification(order);
      }
    });
  }
}

function showNotification(order) {
  const customerName = order.customer?.name || order.customerName || "Customer";
  const total = order.total || order.totalBill || 0;
  const orderId = order.orderId || order.id || "";
  
  const notification = new Notification("🛒 New Order Received!", {
    body: `👤 ${customerName}\n💰 Rs ${total}\n📦 ${orderId}`,
    icon: "logo.png",
    tag: "new-order",
    requireInteraction: true
  });

  // Play sound
  playNotificationSound();

  // Auto-close after 8 seconds
  setTimeout(() => {
    notification.close();
  }, 8000);

  // On click, focus the admin page
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

/* =========================
HELPERS
========================= */
const qs = (id) => document.getElementById(id);

function showToast(msg) {
    let t = document.querySelector(".admin-toast");
    if (!t) {
        t = document.createElement("div");
        t.className = "admin-toast";
        t.style = `
            position:fixed;
            bottom:20px;
            left:50%;
            transform:translateX(-50%);
            background:#222;
            color:#fff;
            padding:10px 20px;
            border-radius:20px;
            z-index:9999;
        `;
        document.body.appendChild(t);
    }
    t.innerText = msg;
    t.style.display = "block";
    setTimeout(() => { t.style.display = "none"; }, 2000);
}

async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", UPLOAD_FOLDER);

    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
    );

    const data = await res.json();
    if (!data.secure_url) {
        console.error(data);
        throw new Error("Image upload failed");
    }
    return data.secure_url;
}

/* =========================
IMAGE PREVIEW
========================= */
document.getElementById("pimageFile")?.addEventListener("change", function(e) {
    const container = document.getElementById("previewContainer");
    container.innerHTML = "";
    const files = e.target.files;
    if (!files.length) return;

    for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = function(ev) {
            const img = document.createElement("img");
            img.src = ev.target.result;
            img.style.width = "60px";
            img.style.height = "60px";
            img.style.objectFit = "cover";
            img.style.borderRadius = "6px";
            img.style.border = "1px solid var(--border)";
            container.appendChild(img);
        };
        reader.readAsDataURL(files[i]);
    }
});

/* =========================
PRODUCT ADD
========================= */
window.uploadAndAddProduct = async () => {

    const files = qs("pimageFile").files;
    const imageUrls = [];

    const progressBar = document.getElementById("uploadProgress");
    const statusText = document.getElementById("uploadStatus");

    for (let i = 0; i < files.length; i++) {
        statusText.innerText = `Uploading ${i+1}/${files.length}...`;
        progressBar.style.width = `${((i+1)/files.length)*100}%`;
        try {
            const url = await uploadToCloudinary(files[i]);
            imageUrls.push(url);
        } catch (err) {
            console.error("Upload failed:", err);
            showToast(`Image ${i+1} upload failed`);
        }
    }

    statusText.innerText = "Upload complete!";
    progressBar.style.width = "100%";

    await addDoc(collection(db, "products"), {
        name: qs("pname").value || "",
        price: Number(qs("pprice").value || 0),
        discount: Number(qs("pdiscount").value || 0),
        stock: Number(qs("pstock").value || 0),
        category: qs("pcategorySelect").value || "Other",
        description: qs("pdesc").value || "",
        featured: qs("pFeatured").checked,
        bestseller: qs("pBestseller").checked,
        newArrival: qs("pNewArrival").checked,
        images: imageUrls,
        image: imageUrls[0] || "",
        createdAt: Date.now()
    });

    showToast("Product Added with " + imageUrls.length + " images");
    clearForm();
    setTimeout(() => {
        progressBar.style.width = "0%";
        statusText.innerText = "";
    }, 2000);
};

/* =========================
UPDATE PRODUCT
========================= */
window.updateSelected = async () => {

    if (!selectedProductId) {
        showToast("Select product first");
        return;
    }

    const files = qs("pimageFile").files;
    let imageUrls = [];
    let mainImage = "";

    if (files.length > 0) {
        const progressBar = document.getElementById("uploadProgress");
        const statusText = document.getElementById("uploadStatus");

        for (let i = 0; i < files.length; i++) {
            statusText.innerText = `Uploading ${i+1}/${files.length}...`;
            progressBar.style.width = `${((i+1)/files.length)*100}%`;
            try {
                const url = await uploadToCloudinary(files[i]);
                imageUrls.push(url);
            } catch (err) {
                console.error("Upload failed:", err);
            }
        }

        mainImage = imageUrls[0] || "";
        statusText.innerText = "Upload complete!";
        setTimeout(() => {
            progressBar.style.width = "0%";
            statusText.innerText = "";
        }, 2000);
    }

    const updateData = {
        name: qs("pname").value || "",
        price: Number(qs("pprice").value || 0),
        discount: Number(qs("pdiscount").value || 0),
        stock: Number(qs("pstock").value || 0),
        category: qs("pcategorySelect").value || "Other",
        description: qs("pdesc").value || "",
        featured: qs("pFeatured").checked,
        bestseller: qs("pBestseller").checked,
        newArrival: qs("pNewArrival").checked
    };

    if (imageUrls.length > 0) {
        updateData.images = imageUrls;
        updateData.image = mainImage;
    }

    await updateDoc(doc(db, "products", selectedProductId), updateData);

    showToast("Product Updated");
    clearForm();
};

/* =========================
DELETE PRODUCT
========================= */
window.deleteProduct = async (id) => {
    if (!confirm("Delete this product?")) return;
    await deleteDoc(doc(db, "products", id));
    showToast("Deleted");
};

/* =========================
SELECT PRODUCT
========================= */
window.selectProduct = (id) => {
    const p = productsData.find(x => x.id === id);
    if (!p) return;

    selectedProductId = id;

    qs("pname").value = p.name || "";
    qs("pprice").value = p.price || 0;
    qs("pdiscount").value = p.discount || 0;
    qs("pstock").value = p.stock || 0;
    qs("pcategorySelect").value = p.category || "Other";
    qs("pdesc").value = p.description || "";
    qs("pFeatured").checked = p.featured || false;
    qs("pBestseller").checked = p.bestseller || false;
    qs("pNewArrival").checked = p.newArrival || false;
};

/* =========================
CLEAR FORM
========================= */
window.clearForm = () => {
    ["pname","pprice","pdiscount","pstock","pdesc"].forEach(id => qs(id).value = "");
    qs("pimageFile").value = "";
    qs("pFeatured").checked = false;
    qs("pBestseller").checked = false;
    qs("pNewArrival").checked = false;
    document.getElementById("previewContainer").innerHTML = "";
    selectedProductId = null;
};

/* =========================
PRODUCTS SNAPSHOT
========================= */
onSnapshot(collection(db, "products"), (snap) => {

    productsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    qs("totalProducts").innerText = productsData.length;
    qs("totalStock").innerText = productsData.reduce((a,b)=>a + (b.stock || 0), 0);
    qs("lowStock").innerText = productsData.filter(p => (p.stock || 0) < 5).length;

    qs("productListBody").innerHTML = productsData.map(p => {
        let tags = '';
        if (p.featured) tags += '⭐ ';
        if (p.bestseller) tags += '🔥 ';
        if (p.newArrival) tags += '🆕 ';
        if ((p.stock || 0) < 5 && (p.stock || 0) > 0) tags += '⚠️';
        if ((p.stock || 0) <= 0) tags += '🚫';

        return `
        <tr onclick="selectProduct('${p.id}')">
            <td><img src="${p.image || ''}" width="40"></td>
            <td>${p.name}</td>
            <td>${p.price}</td>
            <td>${p.discount}%</td>
            <td>${Math.round(p.price - (p.price * p.discount / 100))}</td>
            <td>${p.category}</td>
            <td>${p.stock}</td>
            <td>${tags}</td>
            <td>
                <button onclick="event.stopPropagation(); deleteProduct('${p.id}')">🗑</button>
            </td>
        </tr>`;
    }).join("");
});

/* =========================
DELIVERY LOCATIONS (CRUD)
========================= */
window.addDeliveryLocation = async () => {
    const district = qs("delDistrict").value.trim();
    const cost = Number(qs("delCost").value);

    if (!district || !cost) {
        showToast("Fill all fields");
        return;
    }

    await addDoc(collection(db, "deliveryFees"), { district, cost });
    showToast("Location added");
    qs("delDistrict").value = "";
    qs("delCost").value = "";
};

window.updateDeliveryLocation = async (id, cost) => {
    await updateDoc(doc(db, "deliveryFees", id), { cost: Number(cost) });
    showToast("Updated");
};

window.deleteDeliveryLocation = async (id) => {
    if (!confirm("Delete this location?")) return;
    await deleteDoc(doc(db, "deliveryFees", id));
    showToast("Deleted");
};

onSnapshot(collection(db, "deliveryFees"), (snap) => {
    deliveryFeesData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    qs("deliveryLocationList").innerHTML = deliveryFeesData.map(d => `
        <div class="location-item">
            <span>${d.district}</span>
            <input value="${d.cost}" onchange="updateDeliveryLocation('${d.id}', this.value)" type="number" style="width:100px;">
            <button onclick="deleteDeliveryLocation('${d.id}')" style="background:red;color:white;width:auto;padding:6px 12px;">🗑</button>
        </div>
    `).join("");
});

/* =========================
CATEGORIES (CRUD with icons)
========================= */
window.addCategory = async () => {
    const name = qs("catName").value.trim();
    const icon = qs("catIcon").value.trim() || "📦";

    if (!name) return;

    await addDoc(collection(db, "categories"), { name, icon });
    qs("catName").value = "";
    qs("catIcon").value = "";
    showToast("Category Added");
};

window.updateCategory = async (id, name, icon) => {
    await updateDoc(doc(db, "categories", id), { name, icon });
    showToast("Updated");
};

window.deleteCategory = async (id) => {
    if (!confirm("Delete this category?")) return;
    await deleteDoc(doc(db, "categories", id));
    showToast("Deleted");
};

onSnapshot(collection(db, "categories"), (snap) => {

    categoriesData = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const select = qs("pcategorySelect");
    const list = qs("activeCategoryList");

    select.innerHTML =
        `<option value="Other">Other</option>` +
        categoriesData.map(c => `<option value="${c.name}">${c.icon || '📦'} ${c.name}</option>`).join("");

    list.innerHTML = categoriesData.map(c => `
        <div class="category-item">
            <span>${c.icon || '📦'}</span>
            <input value="${c.name}" onchange="updateCategory('${c.id}', this.value, '${c.icon || '📦'}')">
            <button onclick="deleteCategory('${c.id}')" style="background:red;color:white;width:auto;padding:6px 12px;">🗑</button>
        </div>
    `).join("");
});

/* =========================
🔔 ORDERS (with LIVE NOTIFICATION + SOUND)
========================= */
window.updateOrderStatus = async (id, status) => {
    await updateDoc(doc(db, "orders", id), { status });
    showToast("Status Updated");
};

window.deleteOrder = async (id) => {
    if (!confirm("Delete this order permanently?")) return;
    await deleteDoc(doc(db, "orders", id));
    showToast("Order Deleted");
};

window.sendOrderWhatsApp = (order) => {
    if (!order) return;

    const items = order.items || [];
    let itemsText = items.map((item, i) =>
        `${i+1}) ${item.name} x${item.qty} = LKR ${item.price * item.qty}`
    ).join("\n");

    const message =
`🟢 FRESHORA ORDER UPDATE 🟢

📦 Order: ${order.orderId || order.id}
📅 Date: ${order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}

👤 Customer: ${order.customer?.name || order.customerName || ''}
📞 Phone: ${order.customer?.phone || order.phone || ''}
📍 District: ${order.customer?.district || order.district || ''}
🏠 Address: ${order.customer?.address || order.address || ''}

🛒 Items:
${itemsText}

💰 Total: LKR ${order.total || order.totalBill || 0}
📊 Status: ${order.status || 'Pending'}

Thank you for shopping with Freshora! 🌿`;

    const phone = order.customer?.phone || order.phone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const waNumber = cleanPhone.startsWith('94') ? cleanPhone : '94' + cleanPhone;

    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, "_blank");
};

// 🔔 LIVE ORDERS SNAPSHOT WITH NOTIFICATION
onSnapshot(collection(db, "orders"), (snap) => {

    const newOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const newOrderIds = new Set(newOrders.map(o => o.id));

    // Check for new orders
    newOrders.forEach(order => {
        if (!previousOrderIds.has(order.id)) {
            // This is a NEW order
            console.log("🔔 New Order Detected:", order.id);
            
            // 🔔 Send Notification + Sound (only if not the first load)
            if (previousOrderIds.size > 0) {
                sendOrderNotification(order);
                showToast(`🔔 New Order! ${order.customer?.name || order.customerName || 'Customer'}`);
            }
        }
    });

    // Update previous IDs
    previousOrderIds = newOrderIds;

    // Update orders data
    ordersData = newOrders;

    // Render orders table
    qs("orderList").innerHTML = ordersData.map(o => `
        <tr>
            <td>${o.orderId || o.id.slice(-6)}</td>
            <td>${o.customer?.name || o.customerName || ""}</td>
            <td>${o.customer?.phone || o.phone || ""}</td>
            <td>${o.customer?.district || o.district || ""}</td>
            <td>Rs ${o.total || o.totalBill || 0}</td>
            <td>
                <select onchange="updateOrderStatus('${o.id}', this.value)">
                    <option ${o.status=="Pending"?"selected":""}>Pending</option>
                    <option ${o.status=="Processing"?"selected":""}>Processing</option>
                    <option ${o.status=="Delivered"?"selected":""}>Delivered</option>
                    <option ${o.status=="Cancelled"?"selected":""}>Cancelled</option>
                </select>
            </td>
            <td style="display:flex;gap:5px;flex-wrap:wrap;">
                <button onclick='viewBill(${JSON.stringify(o)})' style="width:auto;padding:4px 8px;">View</button>
                <button onclick='sendOrderWhatsApp(${JSON.stringify(o)})' style="width:auto;padding:4px 8px;background:#25d366;color:white;">
                    <i class="fab fa-whatsapp"></i>
                </button>
                <button onclick="deleteOrder('${o.id}')" style="width:auto;padding:4px 8px;background:red;color:white;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join("");
});

/* =========================
BILL + PDF
========================= */
window.viewBill = (order) => {
    qs("billModal").style.display = "block";

    const items = order.items || [];

    qs("billContent").innerHTML = `
        <p><b>Order ID:</b> ${order.orderId || order.id}</p>
        <p><b>Date:</b> ${order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</p>
        <p><b>Customer:</b> ${order.customer?.name || order.customerName || ''}</p>
        <p><b>Phone:</b> ${order.customer?.phone || order.phone || ''}</p>
        <p><b>District:</b> ${order.customer?.district || order.district || ''}</p>
        <p><b>Address:</b> ${order.customer?.address || order.address || ''}</p>

        <hr>

        ${items.map(i => `
            <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #eee;">
                <span>${i.name} x${i.qty}</span>
                <span>Rs ${i.price * i.qty}</span>
            </div>
        `).join("")}

        <hr>

        <p><b>Subtotal:</b> Rs ${order.subtotal || 0}</p>
        ${order.discount ? `<p><b>Discount:</b> -Rs ${order.discount}</p>` : ''}
        ${order.coupon ? `<p><b>Coupon:</b> ${order.coupon}</p>` : ''}
        <p><b>Delivery:</b> Rs ${order.delivery || 0}</p>
        <p style="font-size:18px;font-weight:bold;color:var(--primary);">
            <b>Total:</b> Rs ${order.total || order.totalBill || 0}
        </p>
        <p><b>Status:</b> ${order.status || 'Pending'}</p>
    `;

    window.currentOrder = order;
};

window.downloadBill = (order) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("FRESHORA INVOICE", 20, 20);

    doc.setFontSize(12);
    doc.text("Order: " + (order.orderId || order.id), 20, 35);
    doc.text("Date: " + (order.createdAt ? new Date(order.createdAt).toLocaleString() : ''), 20, 45);

    const items = order.items || [];
    let y = 65;

    items.forEach(i => {
        doc.text(`${i.name} x${i.qty} = Rs ${i.price * i.qty}`, 20, y);
        y += 8;
    });

    y += 10;
    doc.text("Subtotal: Rs " + (order.subtotal || 0), 20, y);
    y += 8;
    if (order.discount) {
        doc.text("Discount: -Rs " + order.discount, 20, y);
        y += 8;
    }
    doc.text("Delivery: Rs " + (order.delivery || 0), 20, y);
    y += 10;
    doc.setFontSize(16);
    doc.text("TOTAL: Rs " + (order.total || order.totalBill || 0), 20, y);

    doc.save("invoice_" + (order.orderId || order.id) + ".pdf");
};

/* =========================
ADMIN SEARCH
========================= */
document.getElementById("adminSearch")?.addEventListener("input", (e) => {
    const search = e.target.value.toLowerCase();
    const rows = document.querySelectorAll("#productListBody tr");
    rows.forEach(row => {
        const name = row.querySelector("td:nth-child(2)")?.textContent?.toLowerCase() || "";
        row.style.display = name.includes(search) ? "" : "none";
    });
});

/* =========================
INTELLIGENCE REPORTS
========================= */
let reportData = {};

function generateReportData() {
    const totalProducts = productsData.length;
    const totalStock = productsData.reduce((a, b) => a + (b.stock || 0), 0);
    const lowStock = productsData.filter(p => (p.stock || 0) < 5).length;
    const totalOrders = ordersData.length;
    const totalRevenue = ordersData.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalDiscount = ordersData.reduce((sum, o) => sum + (o.discount || 0), 0);
    const totalDelivery = ordersData.reduce((sum, o) => sum + (o.delivery || 0), 0);
    const pendingOrders = ordersData.filter(o => o.status === 'Pending').length;
    const deliveredOrders = ordersData.filter(o => o.status === 'Delivered').length;
    const cancelledOrders = ordersData.filter(o => o.status === 'Cancelled').length;

    reportData = {
        totalProducts,
        totalStock,
        lowStock,
        totalOrders,
        totalRevenue,
        totalDiscount,
        totalDelivery,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        categories: categoriesData.length,
        deliveryLocations: deliveryFeesData.length
    };
    return reportData;
}

window.openReportModal = () => {
    generateReportData();
    const content = document.getElementById("reportContent");
    content.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">

            <div><b>📦 Total Products:</b> ${reportData.totalProducts}</div>
            <div><b>📦 Total Stock:</b> ${reportData.totalStock}</div>
            <div><b>⚠️ Low Stock:</b> ${reportData.lowStock}</div>
            <div><b>📋 Total Orders:</b> ${reportData.totalOrders}</div>

            <div><b>💰 Total Revenue:</b> Rs ${reportData.totalRevenue.toFixed(2)}</div>
            <div><b>🏷️ Total Discount Given:</b> Rs ${reportData.totalDiscount.toFixed(2)}</div>
            <div><b>🚚 Total Delivery Fees:</b> Rs ${reportData.totalDelivery.toFixed(2)}</div>

            <div><b>⏳ Pending Orders:</b> ${reportData.pendingOrders}</div>
            <div><b>✅ Delivered Orders:</b> ${reportData.deliveredOrders}</div>
            <div><b>❌ Cancelled Orders:</b> ${reportData.cancelledOrders}</div>

            <div><b>📂 Categories:</b> ${reportData.categories}</div>
            <div><b>📍 Delivery Locations:</b> ${reportData.deliveryLocations}</div>

        </div>
        <hr>
        <p style="font-size:12px;color:var(--muted);">Last updated: ${new Date().toLocaleString()}</p>
    `;
    document.getElementById("reportModal").style.display = "block";
};

window.downloadReportPDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const d = reportData;

    doc.setFontSize(18);
    doc.text("FRESHORA INTELLIGENCE REPORT", 20, 20);

    doc.setFontSize(12);
    let y = 40;
    const lineHeight = 8;
    const lines = [
        `Products: ${d.totalProducts}`,
        `Total Stock: ${d.totalStock}`,
        `Low Stock: ${d.lowStock}`,
        `Total Orders: ${d.totalOrders}`,
        `Total Revenue: Rs ${d.totalRevenue.toFixed(2)}`,
        `Total Discount Given: Rs ${d.totalDiscount.toFixed(2)}`,
        `Total Delivery Fees: Rs ${d.totalDelivery.toFixed(2)}`,
        `Pending Orders: ${d.pendingOrders}`,
        `Delivered Orders: ${d.deliveredOrders}`,
        `Cancelled Orders: ${d.cancelledOrders}`,
        `Categories: ${d.categories}`,
        `Delivery Locations: ${d.deliveryLocations}`,
        `Generated: ${new Date().toLocaleString()}`
    ];

    lines.forEach(line => {
        doc.text(line, 20, y);
        y += lineHeight;
    });

    doc.save("freshora_report.pdf");
};

window.downloadReportCSV = () => {
    const d = reportData;
    const rows = [
        ["Metric", "Value"],
        ["Total Products", d.totalProducts],
        ["Total Stock", d.totalStock],
        ["Low Stock", d.lowStock],
        ["Total Orders", d.totalOrders],
        ["Total Revenue", d.totalRevenue],
        ["Total Discount Given", d.totalDiscount],
        ["Total Delivery Fees", d.totalDelivery],
        ["Pending Orders", d.pendingOrders],
        ["Delivered Orders", d.deliveredOrders],
        ["Cancelled Orders", d.cancelledOrders],
        ["Categories", d.categories],
        ["Delivery Locations", d.deliveryLocations],
        ["Generated", new Date().toLocaleString()]
    ];

    let csv = rows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "freshora_report.csv";
    a.click();
    URL.revokeObjectURL(url);
};

/* =========================
SALES ANALYTICS (CHART)
========================= */
let analyticsChart = null;

function renderAnalytics() {
    const ctx = document.getElementById("analyticsChart")?.getContext("2d");
    if (!ctx) return;

    const now = new Date();
    const days = [];
    const revenues = [];
    const ordersCount = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        days.push(dateStr);

        const dayOrders = ordersData.filter(o => {
            if (!o.createdAt) return false;
            const oDate = new Date(o.createdAt).toISOString().split("T")[0];
            return oDate === dateStr;
        });

        const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        revenues.push(dayRevenue);
        ordersCount.push(dayOrders.length);
    }

    if (analyticsChart) {
        analyticsChart.destroy();
    }

    analyticsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [
                {
                    label: 'Revenue (Rs)',
                    data: revenues,
                    backgroundColor: 'rgba(31, 143, 77, 0.6)',
                    borderColor: '#1f8f4d',
                    borderWidth: 1,
                    yAxisID: 'y',
                },
                {
                    label: 'Orders',
                    data: ordersCount,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: '#36a2eb',
                    borderWidth: 1,
                    yAxisID: 'y1',
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    position: 'left',
                    title: { display: true, text: 'Revenue (Rs)' }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    title: { display: true, text: 'Orders' }
                }
            }
        }
    });
}

// Re-render chart when orders change
onSnapshot(collection(db, "orders"), () => {
    setTimeout(renderAnalytics, 300);
});

// Initial render
setTimeout(renderAnalytics, 1000);
