// ==========================================
// GET PRODUCT ID FROM URL
// ==========================================

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");


// ==========================================
// FIND PRODUCT
// ==========================================

const product = products.find(item => item.id === productId);


// ==========================================
// DISPLAY PRODUCT
// ==========================================

if (product) {

    document.getElementById("product-image").src = product.image;

    document.getElementById("product-name").textContent = product.name;

    document.getElementById("product-category").textContent = product.category;

    document.getElementById("product-price").textContent =
        `₹${product.price}`;

    document.getElementById("product-description").textContent =
        product.description;

} else {

    document.querySelector(".product-details").innerHTML = `
        <h2>Product Not Found</h2>
        <a href="products.html">Back to Shop</a>
    `;
}


// ==========================================
// QUANTITY
// ==========================================

let quantity = 1;

const quantityDisplay = document.getElementById("quantity");

const decreaseBtn = document.getElementById("decrease-btn");

const increaseBtn = document.getElementById("increase-btn");


// DECREASE QUANTITY

decreaseBtn.addEventListener("click", function () {

    if (quantity > 1) {

        quantity--;

        quantityDisplay.textContent = quantity;
    }

});


// INCREASE QUANTITY

increaseBtn.addEventListener("click", function () {

    quantity++;

    quantityDisplay.textContent = quantity;

});


// ==========================================
// ADD TO CART
// ==========================================

const addToCartBtn = document.getElementById("add-to-cart-btn");

if (addToCartBtn && product) {

    addToCartBtn.addEventListener("click", function () {

        // Get existing cart
        let cart =
            JSON.parse(localStorage.getItem("milaCart")) || [];


        // Check if product already exists
        const existingProduct =
            cart.find(item => item.id === product.id);


        if (existingProduct) {

            // Add selected quantity
            existingProduct.quantity += quantity;

        } else {

            // Add new product
            cart.push({

                id: product.id,

                name: product.name,

                category: product.category,

                price: product.price,

                image: product.image,

                quantity: quantity

            });

        }


        // Save cart
        localStorage.setItem(
            "milaCart",
            JSON.stringify(cart)
        );


        // Update navbar cart count
        updateCartCount();


        // Button feedback
        addToCartBtn.textContent = "ADDED ✓";


        setTimeout(() => {

            addToCartBtn.textContent = "ADD TO CART";

        }, 1500);

    });

}


// ==========================================
// UPDATE NAVBAR CART COUNT
// ==========================================

function updateCartCount() {

    const cart =
        JSON.parse(localStorage.getItem("milaCart")) || [];


    const totalQuantity = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );


    const cartCount =
        document.querySelector(".cart-count");


    if (cartCount) {

        cartCount.textContent = totalQuantity;

    }

}


// ==========================================
// INITIAL CART COUNT
// ==========================================

updateCartCount();