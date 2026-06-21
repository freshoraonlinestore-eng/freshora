import { db, collection, onSnapshot, addDoc, doc, updateDoc, getDoc, getDocs } from "./firebase.js";

/* =========================
STATE
========================= */
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allProducts = [];
let selectedRating = 0;
let currentProductId = null;
let allReviews = [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let recentlyViewed = JSON.parse(localStorage.getItem("recentlyViewed")) || [];
let couponDiscount = 0;
let deliveryFee = 0;
let deliveryDistricts = [];
let appliedCoupon = null;

/* =========================
UTIL
========================= */
function num(v) {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
}

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function saveWishlist() {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    updateWishlistUI();
}

function saveRecentlyViewed() {
    localStorage.setItem("recentlyViewed", JSON.stringify(recentlyViewed.slice(0, 10)));
}

function showToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.innerHTML = `
        <i class="fa-solid fa-circle-check"></i>
        <span>${msg}</span>
    `;

    toast.classList.add("show");

    clearTimeout(window.toastTimeout);

    window.toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}

/* =========================
INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
    updateCartDisplay();
    updateWishlistUI();

    document.getElementById("searchInput")
        ?.addEventListener("input", filterProducts);

    document.getElementById("categoryFilter")
        ?.addEventListener("change", filterProducts);

    document.getElementById("priceFilter")
        ?.addEventListener("change", filterProducts);

    document.getElementById("discountFilter")
        ?.addEventListener("change", filterProducts);

    setupStarRating();
    bindReviewButton();

    document.getElementById("modalAddBtn")
        ?.addEventListener("click", () => {
        if (!currentProductId) return;
        const p = allProducts.find(x => x.id === currentProductId);
        if (!p) return;
        const price = getFinalPrice(p);
        addToCart(p.id, p.name, price, p.image);
    });

    document.getElementById("modalWishlistBtn")
        ?.addEventListener("click", () => {
        if (!currentProductId) return;
        toggleWishlistProduct(currentProductId);
    });

    // Load delivery districts
    loadDistricts();
});

/* =========================
PRICE
========================= */
function getFinalPrice(product) {
    const price = num(product.price);
    const discount = num(product.discount);
    return discount > 0 ? Math.round(price - (price * discount / 100)) : price;
}

/* =========================
CART DISPLAY
========================= */
window.updateCartDisplay = () => {

    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");
    const floating = document.getElementById("floatingCartCount");

    if (!cartItems) return;

    let total = 0;
    let totalQty = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = `<p style="text-align:center;padding:20px;">Cart is empty</p>`;
        if (cartTotal) cartTotal.innerText = "Total: Rs 0";
        if (floating) floating.innerText = "0";
        saveCart();
        return;
    }

    cartItems.innerHTML = cart.map((item, i) => {
        const price = num(item.price);
        const qty = num(item.qty);
        total += price * qty;
        totalQty += qty;

        return `
        <div class="cart-item">
            <img src="${item.image}">
            <div style="flex:1">
                <h4>${item.name}</h4>
                <p>Rs ${price * qty}</p>

                <div class="qty-box">
                    <button onclick="changeQty(${i},-1)">-</button>
                    <span>${qty}</span>
                    <button onclick="changeQty(${i},1)">+</button>
                </div>
            </div>

            <button class="remove-btn" onclick="removeFromCart(${i})">✕</button>
        </div>`;
    }).join("");

    // Apply coupon if any
    let discountAmount = 0;
    if (appliedCoupon) {
        discountAmount = Math.min(total * (appliedCoupon.discount / 100), appliedCoupon.maxDiscount || total);
        total = total - discountAmount;
    }

    // Delivery fee
    let delivery = 0;
    if (total > 5000) {
        delivery = 0;
    } else {
        const selectedDistrict = document.getElementById("cusDistrict")?.value;
        const dist = deliveryDistricts.find(d => d.district === selectedDistrict);
        delivery = dist ? dist.cost : 375;
    }
    deliveryFee = delivery;

    if (cartTotal) {
        let displayTotal = total + delivery;
        let text = `Total: Rs ${displayTotal}`;
        if (appliedCoupon) {
            text += ` (Coupon: -Rs ${discountAmount.toFixed(0)})`;
        }
        if (delivery > 0) {
            text += ` + Delivery Rs ${delivery}`;
        } else if (total > 0) {
            text += ` (Free Delivery)`;
        }
        cartTotal.innerText = text;
    }
    if (floating) floating.innerText = totalQty;

    saveCart();
};

/* =========================
CART ACTIONS
========================= */
window.addToCart = (id, name, price, image) => {
    const item = cart.find(i => i.id === id);
    if (item) item.qty += 1;
    else cart.push({ id, name, price: num(price), image, qty: 1 });
    updateCartDisplay();
    showToast("Added 🛒");
};

window.changeQty = (index, change) => {
    if (!cart[index]) return;
    cart[index].qty += change;
    if (cart[index].qty <= 0) cart.splice(index, 1);
    updateCartDisplay();
};

window.removeFromCart = (index) => {
    cart.splice(index, 1);
    updateCartDisplay();
    showToast("Removed");
};

window.clearCart = () => {
    cart = [];
    appliedCoupon = null;
    document.getElementById("couponInput").value = "";
    document.getElementById("couponMessage").innerText = "";
    updateCartDisplay();
    showToast("Cart cleared");
};

/* =========================
COUPON
========================= */
const COUPONS = {
    "SAVE10": { discount: 10, maxDiscount: 500 },
    "SAVE20": { discount: 20, maxDiscount: 1000 },
    "FRESHORA": { discount: 15, maxDiscount: 750 }
};

window.applyCoupon = () => {
    const code = document.getElementById("couponInput").value.trim().toUpperCase();
    const msg = document.getElementById("couponMessage");

    if (!code) {
        msg.innerText = "Enter a coupon code";
        msg.style.color = "red";
        return;
    }

    if (COUPONS[code]) {
        appliedCoupon = COUPONS[code];
        msg.innerText = `Coupon applied! ${appliedCoupon.discount}% off`;
        msg.style.color = "green";
        updateCartDisplay();
        showToast("Coupon applied!");
    } else {
        appliedCoupon = null;
        msg.innerText = "Invalid coupon code";
        msg.style.color = "red";
        updateCartDisplay();
    }
};

/* =========================
FILTER
========================= */
window.filterProducts = () => {

    const search = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const category = document.getElementById("categoryFilter")?.value || "all";
    const priceFilter = document.getElementById("priceFilter")?.value || "all";
    const discountFilter = document.getElementById("discountFilter")?.value || "all";

    let filtered = [...allProducts];

    filtered = filtered.filter(p =>
        (p.name || "").toLowerCase().includes(search)
    );

    if (category !== "all") {
        filtered = filtered.filter(p => p.category === category);
    }

    if (priceFilter !== "all") {
        const [min, max] = priceFilter.split("-").map(Number);
        filtered = filtered.filter(p => {
            const price = getFinalPrice(p);
            if (max) return price >= min && price <= max;
            return price >= min;
        });
    }

    if (discountFilter !== "all") {
        filtered = filtered.filter(p => {
            const disc = Number(p.discount || 0);
            if (discountFilter === "10+") return disc >= 10;
            if (discountFilter === "20+") return disc >= 20;
            if (discountFilter === "50+") return disc >= 50;
            return true;
        });
    }

    renderProducts(filtered);
};

/* =========================
RENDER PRODUCTS
========================= */
window.renderProducts = (products) => {

    const grid = document.getElementById("products");
    if (!grid) return;

    if (!products.length) {
        grid.innerHTML = `<p style="text-align:center;width:100%">No products</p>`;
        return;
    }

    grid.innerHTML = products.map(p => {

        const price = num(p.price);
        const discount = num(p.discount);
        const finalPrice = getFinalPrice(p);
        const isWishlisted = wishlist.includes(p.id);
        const isLowStock = (p.stock || 0) < 5 && (p.stock || 0) > 0;
        const isOutOfStock = (p.stock || 0) <= 0;

        const reviews = allReviews.filter(r => r.productId === p.id);
        const count = reviews.length;
        const avg = count ? (reviews.reduce((t, r) => t + num(r.rating), 0) / count).toFixed(1) : 0;

        // Tags
        let tags = '';
        if (p.featured) tags += `<span class="tag featured">⭐ Featured</span>`;
        if (p.bestseller) tags += `<span class="tag bestseller">🔥 Bestseller</span>`;
        if (p.newArrival) tags += `<span class="tag new">🆕 New</span>`;
        if (isLowStock) tags += `<span class="tag lowstock">⚠️ Low Stock</span>`;
        if (isOutOfStock) tags += `<span class="tag lowstock" style="background:#999;">Out of Stock</span>`;

        return `
        <div class="card">

            ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ""}

            <img src="${p.image || ''}" onclick="openModal('${p.id}')" style="cursor:pointer;">

            <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" onclick="event.stopPropagation(); toggleWishlistProduct('${p.id}')">
                <i class="fa-${isWishlisted ? 'solid' : 'regular'} fa-heart"></i>
            </button>

            <div class="card-content">

                <h3>${p.name || ''}</h3>

                ${tags}

                <div class="price-box">
                    ${discount > 0 ? `<span class="old-price">Rs ${price}</span>` : ""}
                    <span class="new-price">Rs ${finalPrice}</span>
                </div>

                <div class="product-rating">
                    <i class="fa-solid fa-star"></i>
                    ${avg}
                    <span>(${count})</span>
                </div>

                <div class="card-buttons">
                    <button onclick="openModal('${p.id}')">View</button>
                    <button onclick="addToCart('${p.id}','${p.name}',${finalPrice},'${p.image}')" ${isOutOfStock ? 'disabled style="opacity:0.5;"' : ''}>${isOutOfStock ? 'Out of Stock' : 'Add'}</button>
                </div>

            </div>

        </div>`;
    }).join("");
};

/* =========================
REVIEWS RENDER
========================= */
function renderReviews(productId) {
    const container = document.getElementById("reviewList");
    if (!container) return;

    const reviews = allReviews.filter(r => r.productId === productId);

    if (reviews.length === 0) {
        container.innerHTML = `<p style="color:var(--muted);font-size:13px;">No reviews yet</p>`;
        return;
    }

    container.innerHTML = reviews.map(r => `
        <div class="review-item">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="color:#ffb400;">${'★'.repeat(Math.min(r.rating, 5))}${'☆'.repeat(Math.max(0, 5 - Math.min(r.rating, 5)))}</span>
                <span style="font-size:12px;color:var(--muted);">${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
            </div>
            <p style="margin-top:4px;">${r.text || ''}</p>
        </div>
    `).join("");
}

/* =========================
MODAL
========================= */
window.openModal = (id) => {

    const p = allProducts.find(x => x.id === id);
    if (!p) return;

    currentProductId = id;

    // Add to recently viewed
    recentlyViewed = recentlyViewed.filter(pid => pid !== id);
    recentlyViewed.unshift(id);
    saveRecentlyViewed();

    const images = p.images?.length ? p.images : [p.image];

    document.getElementById("modalName").innerText = p.name || "";
    document.getElementById("modalPrice").innerText = "Rs " + getFinalPrice(p);
    document.getElementById("modalDesc").innerText = p.description || "";

    document.getElementById("galleryContainer").innerHTML = `
        <img src="${images[0]}" class="main-img" id="mainModalImg" onclick="zoomImage()">
        <div class="thumbnail-grid">
            ${images.map(img => `
                <img src="${img}" class="thumbnail"
                onclick="document.getElementById('mainModalImg').src='${img}'">
            `).join("")}
        </div>
    `;

    document.getElementById("productModal")?.classList.add("show");

    selectedRating = 0;
    updateStars(0);

    renderReviews(id);

    // Update wishlist button
    const isWishlisted = wishlist.includes(id);
    const btn = document.getElementById("modalWishlistBtn");
    btn.innerHTML = `<i class="fa-${isWishlisted ? 'solid' : 'regular'} fa-heart"></i> ${isWishlisted ? 'Remove from' : 'Add to'} Wishlist`;
};

window.closeModal = () => {
    document.getElementById("productModal")?.classList.remove("show");
    currentProductId = null;
    selectedRating = 0;
};

/* =========================
ZOOM
========================= */
window.zoomImage = () => {
    const img = document.getElementById("mainModalImg");
    if (!img) return;
    document.getElementById("zoomImage").src = img.src;
    document.getElementById("zoomModal").classList.add("show");
};

window.closeZoom = () => {
    document.getElementById("zoomModal").classList.remove("show");
};

/* =========================
SHARE
========================= */
window.shareProduct = () => {
    const p = allProducts.find(x => x.id === currentProductId);
    if (!p) return;

    const data = {
        title: p.name,
        text: `Check out ${p.name} on Freshora!`,
        url: window.location.href + `?product=${p.id}`
    };

    if (navigator.share) {
        navigator.share(data).catch(() => {});
    } else {
        navigator.clipboard.writeText(`${data.text} ${data.url}`).then(() => {
            showToast("Link copied to clipboard!");
        }).catch(() => {
            showToast("Share: " + data.text + " " + data.url);
        });
    }
};

/* =========================
STAR RATING
========================= */
function setupStarRating() {
    const stars = document.querySelectorAll("#starRating i");
    stars.forEach((star, i) => {
        star.onclick = () => {
            selectedRating = i + 1;
            updateStars(selectedRating);
        };
    });
}

function updateStars(rating) {
    document.querySelectorAll("#starRating i").forEach((star, i) => {
        star.classList.toggle("fa-solid", i < rating);
        star.classList.toggle("fa-regular", i >= rating);
    });
}

/* =========================
REVIEWS
========================= */
function bindReviewButton() {
    const btn = document.getElementById("reviewSubmitBtn");
    if (!btn) return;

    btn.onclick = async () => {
        const text = document.getElementById("reviewText")?.value;

        if (!text || selectedRating === 0) {
            showToast("Add rating + review");
            return;
        }

        if (!currentProductId) {
            showToast("Open product first");
            return;
        }

        await addDoc(collection(db, "reviews"), {
            productId: currentProductId,
            rating: selectedRating,
            text,
            createdAt: new Date().toISOString()
        });

        selectedRating = 0;
        updateStars(0);
        document.getElementById("reviewText").value = "";

        showToast("Review added");
    };
}

/* =========================
WISHLIST
========================= */
window.toggleWishlist = () => {
    // Show wishlist products in a simple way
    const items = allProducts.filter(p => wishlist.includes(p.id));
    if (items.length === 0) {
        showToast("Wishlist is empty");
        return;
    }
    // Render products filter to show only wishlist
    renderProducts(items);
    showToast(`Showing ${items.length} wishlist items`);
};

window.toggleWishlistProduct = (id) => {
    const index = wishlist.indexOf(id);
    if (index > -1) {
        wishlist.splice(index, 1);
        showToast("Removed from wishlist");
    } else {
        wishlist.push(id);
        showToast("Added to wishlist ❤️");
    }
    saveWishlist();
    // Update modal button if open
    if (currentProductId === id) {
        const btn = document.getElementById("modalWishlistBtn");
        const isWishlisted = wishlist.includes(id);
        btn.innerHTML = `<i class="fa-${isWishlisted ? 'solid' : 'regular'} fa-heart"></i> ${isWishlisted ? 'Remove from' : 'Add to'} Wishlist`;
    }
    // Re-render products to update heart icons
    filterProducts();
};

function updateWishlistUI() {
    const count = wishlist.length;
    const el = document.getElementById("wishlistCount");
    if (el) {
        if (count > 0) {
            el.style.display = "inline";
            el.innerText = count;
        } else {
            el.style.display = "none";
        }
    }
}

/* =========================
DELIVERY DISTRICTS
========================= */
async function loadDistricts() {
    try {
        const snapshot = await getDocs(collection(db, "deliveryFees"));
        deliveryDistricts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const select = document.getElementById("cusDistrict");
        if (!select) return;
        select.innerHTML = `<option value="">Select District</option>`;
        deliveryDistricts.forEach(d => {
            const opt = document.createElement("option");
            opt.value = d.district;
            opt.textContent = `${d.district} (Rs ${d.cost})`;
            select.appendChild(opt);
        });
        select.addEventListener("change", updateCartDisplay);
    } catch (e) {
        console.warn("Could not load delivery districts", e);
        // Fallback: empty select or use default
    }
}

/* =========================
CHECKOUT
========================= */
window.checkout = async () => {

    const name = document.getElementById("cusName")?.value.trim();
    const phone = document.getElementById("cusPhone")?.value.trim();
    const district = document.getElementById("cusDistrict")?.value;
    const address = document.getElementById("cusAddress")?.value.trim();

    if (!name || !phone || !district || !address) {
        showToast("Fill all details including district");
        return;
    }

    if (!cart.length) {
        showToast("Cart empty");
        return;
    }

    const orderId = "FR-" + Date.now();
    const date = new Date().toLocaleString();

    let subtotal = 0;
    const itemsText = cart.map((item, i) => {
        const total = num(item.price) * item.qty;
        subtotal += total;
        return `${i + 1}) ${item.name} x${item.qty} = LKR ${total}`;
    }).join("\n");

    let total = subtotal;
    let discountAmount = 0;

    if (appliedCoupon) {
        discountAmount = Math.min(subtotal * (appliedCoupon.discount / 100), appliedCoupon.maxDiscount || subtotal);
        total = subtotal - discountAmount;
    }

    const delivery = total > 5000 ? 0 : (deliveryDistricts.find(d => d.district === district)?.cost || 375);
    const finalTotal = total + delivery;

    const message =
`🟢 FRESHORA NEW ORDER 🟢

📦 Order ID: ${orderId}
📅 Date: ${date}

👤 CUSTOMER DETAILS
Name: ${name}
Phone: ${phone}
District: ${district}
Address: ${address}

🛒 ITEMS
${itemsText}

💰 BILL SUMMARY
Subtotal: LKR ${subtotal}
${appliedCoupon ? `Coupon (${appliedCoupon.discount}%): -LKR ${discountAmount.toFixed(0)}\n` : ''}Delivery: LKR ${delivery}
TOTAL: LKR ${finalTotal}`;

    window.open(
        `https://wa.me/94752425790?text=${encodeURIComponent(message)}`,
        "_blank"
    );

    await addDoc(collection(db, "orders"), {
        orderId,
        customer: { name, phone, district, address },
        customerName: name,
        phone: phone,
        district: district,
        address: address,
        items: cart,
        subtotal,
        discount: discountAmount,
        coupon: appliedCoupon?.code || null,
        delivery,
        total: finalTotal,
        status: "Pending",
        createdAt: new Date().toISOString()
    });

    cart = [];
    appliedCoupon = null;
    document.getElementById("couponInput").value = "";
    document.getElementById("couponMessage").innerText = "";
    updateCartDisplay();

    // Show success modal
    document.getElementById("orderSuccessId").innerText = `Order ID: ${orderId}`;
    document.getElementById("orderSuccessModal").classList.add("show");
    showToast("Order sent 🚀");
};

window.closeOrderSuccess = () => {
    document.getElementById("orderSuccessModal").classList.remove("show");
};

/* =========================
UI
========================= */
window.toggleCart = () => {
    document.getElementById("cartDrawer")?.classList.toggle("open");
};

window.toggleDarkMode = () => {
    document.body.classList.toggle("dark");
    const icon = document.querySelector("#darkModeBtn i");
    if (!icon) return;
    icon.classList.toggle("fa-sun");
    icon.classList.toggle("fa-moon");
};

/* =========================
FIREBASE SNAPSHOTS
========================= */

// Products
onSnapshot(collection(db, "products"), (snap) => {
    allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProducts(allProducts);
    document.getElementById("loadingScreen")?.remove();
}, (error) => {
    console.error("Products snapshot error:", error);
    document.getElementById("loadingScreen")?.remove();
    showToast("Error loading products");
});

// Categories
onSnapshot(collection(db, "categories"), (snap) => {
    const categories = snap.docs.map(d => d.data().name);
    const select = document.getElementById("categoryFilter");
    if (!select) return;
    select.innerHTML = `<option value="all">All Categories</option>`;
    categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
    });
}, (error) => {
    console.error("Categories snapshot error:", error);
});

// Reviews
onSnapshot(collection(db, "reviews"), (snap) => {
    allReviews = snap.docs.map(d => d.data());
    renderProducts(allProducts);
    if (currentProductId) {
        renderReviews(currentProductId);
    }
}, (error) => {
    console.error("Reviews snapshot error:", error);
});

// Delivery fees (reload on change)
onSnapshot(collection(db, "deliveryFees"), () => {
    loadDistricts();
}, (error) => {
    console.warn("Delivery fees snapshot error:", error);
});
