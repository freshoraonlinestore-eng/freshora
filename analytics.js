import {
  db,
  collection,
  onSnapshot
} from "./firebase.js";

/* =========================
   ELEMENTS
========================= */
const totalProductsEl =
  document.getElementById("totalProducts");

const totalOrdersEl =
  document.getElementById("totalOrders");

const totalRevenueEl =
  document.getElementById("totalRevenue");

/* =========================
   REALTIME PRODUCTS STATS
========================= */
onSnapshot(collection(db, "products"), (snap) => {

  const totalProducts = snap.size;

  let revenue = 0;

  snap.forEach((docItem) => {

    const p = docItem.data();

    const price = Number(p.price || 0);
    const discount = Number(p.discount || 0);

    const finalPrice =
      price - (price * discount / 100);

    revenue += finalPrice;
  });

  if (totalProductsEl)
    totalProductsEl.innerText = totalProducts;

  if (totalRevenueEl)
    totalRevenueEl.innerText =
      "Rs " + revenue.toFixed(2);
});

/* =========================
   REALTIME ORDERS STATS
   (Firestore collection: orders)
========================= */
onSnapshot(collection(db, "orders"), (snap) => {

  const totalOrders = snap.size;

  if (totalOrdersEl)
    totalOrdersEl.innerText = totalOrders;
});

/* =========================
   OPTIONAL: LIVE EFFECT
========================= */
function pulseEffect(el) {

  if (!el) return;

  el.classList.add("pulse");

  setTimeout(() => {
    el.classList.remove("pulse");
  }, 600);
}

/* =========================
   AUTO UPDATE ANIMATION
========================= */
onSnapshot(collection(db, "products"), (snap) => {

  pulseEffect(totalProductsEl);
});

onSnapshot(collection(db, "orders"), (snap) => {

  pulseEffect(totalOrdersEl);
});
