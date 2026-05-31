
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function updateCart(){
document.getElementById("cartCount").innerText = cart.length;
}

function toggleCart(){
document.getElementById("cartPanel").style.display =
document.getElementById("cartPanel").style.display==="block"?"none":"block";
renderCart();
}

function renderCart(){
let div=document.getElementById("cartItems");
div.innerHTML="";
cart.forEach((c,i)=>{
div.innerHTML+=`<p>${c.name} - ${c.price}</p>`;
});
}

function addToCart(name,price){
cart.push({name,price});
localStorage.setItem("cart",JSON.stringify(cart));
updateCart();
}

function checkoutWhatsApp(){
let msg="Order:%0A";
cart.forEach(c=>msg+=`${c.name} - ${c.price}%0A`);
window.open("https://wa.me/94752425790?text="+msg,"_blank");
}

function loadProducts(){
db.collection("products").onSnapshot(snap=>{
let html="";
let adminHtml="";
snap.forEach(doc=>{
let p=doc.data();
html+=`<div class='card'>
<img src='${p.img}' width='100%'>
<h4>${p.name}</h4>
<p>${p.price}</p>
<button onclick="addToCart('${p.name}','${p.price}')">Add</button>
</div>`;

adminHtml+=`<p>${p.name} <button onclick="deleteProduct('${doc.id}')">Delete</button></p>`;
});
document.getElementById("products").innerHTML=html;
document.getElementById("adminProducts").innerHTML=adminHtml;
});
}

function addProduct(){
db.collection("products").add({
name:document.getElementById("pname").value,
price:document.getElementById("pprice").value,
img:document.getElementById("pimg").value
});
}

function deleteProduct(id){
db.collection("products").doc(id).delete();
}

function showAdminLogin(){
document.getElementById("adminLogin").style.display="block";
}

function closeAdminLogin(){
document.getElementById("adminLogin").style.display="none";
}

function loginAdmin(){
auth.signInWithEmailAndPassword(
document.getElementById("email").value,
document.getElementById("password").value
).then(()=>{
document.getElementById("adminPanel").style.display="block";
closeAdminLogin();
}).catch(e=>alert("Login Failed"));
}

function logout(){
auth.signOut();
document.getElementById("adminPanel").style.display="none";
}

auth.onAuthStateChanged(user=>{
if(user){
document.getElementById("adminPanel").style.display="block";
}
});

loadProducts();
updateCart();
