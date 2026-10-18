// ==========================================
// GET PRODUCT ID FROM URL
// ==========================================

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");


// ==========================================
// FIND PRODUCT
// ==========================================

const product = products.find(
    item => String(item.id) === String(productId)
);


// ==========================================
// DISPLAY PRODUCT
// ==========================================

if (product) {

    // Product image
    const productImage = document.getElementById("product-image");

    if (productImage) {

        // Support image paths with or without the images/ prefix
        const imagePath = product.image || "";

        if (
            imagePath.startsWith("images/") ||
            imagePath.startsWith("images\\")
        ) {
            productImage.src = "../" + imagePath.replace(/\\/g, "/");
        } else {
            productImage.src = imagePath;
        }

        productImage.alt = product.name;

        // Report image loading errors
        productImage.onerror = function () {
            console.error(
                "Product image could not be loaded:",
                productImage.src
            );
        };
    }

    // Product name
    document.getElementById("product-name").textContent = product.name;

    // Product category
    document.getElementById("product-category").textContent =
        product.category;

    // Product price
    document.getElementById("product-price").textContent =
        `₹${product.price}`;

    // Product description
    document.getElementById("product-description").textContent =
        product.description ||
        "Discover this beauty essential from Mila.";

} else {

    // Product not found
    const productDetails = document.querySelector(".product-details");

    if (productDetails) {
        productDetails.innerHTML = `
            <div class="product-not-found">
                <h2>Product Not Found</h2>
                <p>Sorry, we couldn't find this product.</p>
                <a href="products.html">Back to Shop</a>
            </div>
        `;
    }
}


// ==========================================
// QUANTITY
// ==========================================

let quantity = 1;

const quantityDisplay = document.getElementById("quantity");
const decreaseBtn = document.getElementById("decrease-btn");
const increaseBtn = document.getElementById("increase-btn");


// DECREASE QUANTITY

if (decreaseBtn && quantityDisplay) {

    decreaseBtn.addEventListener("click", function () {

        if (quantity > 1) {
            quantity--;
            quantityDisplay.textContent = quantity;
        }

    });
}


// INCREASE QUANTITY

if (increaseBtn && quantityDisplay) {

    increaseBtn.addEventListener("click", function () {

        quantity++;
        quantityDisplay.textContent = quantity;

    });
}


// ==========================================
// ADD TO CART
// ==========================================

const addToCartBtn = document.getElementById("add-to-cart-btn");

if (addToCartBtn && product) {

    addToCartBtn.addEventListener("click", function () {

        // Read existing cart
        let cart;

        try {
            cart = JSON.parse(localStorage.getItem("milaCart")) || [];

            if (!Array.isArray(cart)) {
                cart = [];
            }

        } catch (error) {
            cart = [];
        }

        // Check if product already exists
        const existingProduct = cart.find(
            item => String(item.id) === String(product.id)
        );

        if (existingProduct) {

            // Increase existing quantity
            existingProduct.quantity =
                (Number(existingProduct.quantity) || 0) + quantity;

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
        localStorage.setItem("milaCart", JSON.stringify(cart));

        // Update cart badge
        updateCartCount();

        // Button feedback
        addToCartBtn.textContent = "ADDED ✓";

        setTimeout(function () {
            addToCartBtn.textContent = "ADD TO CART";
        }, 1500);

    });

}


// ==========================================
// UPDATE NAVBAR CART COUNT
// ==========================================

function updateCartCount() {

    let cart = [];

    try {
        cart = JSON.parse(localStorage.getItem("milaCart")) || [];

        if (!Array.isArray(cart)) {
            cart = [];
        }

    } catch (error) {
        cart = [];
    }

    // Calculate total number of items
    const totalQuantity = cart.reduce(
        (total, item) => total + (Number(item.quantity) || 0),
        0
    );

    // Update badge
    const cartCount = document.querySelector(".cart-count");

    if (cartCount) {
        cartCount.textContent = totalQuantity;
    }

}


// ==========================================
// INITIAL CART COUNT
// ==========================================

updateCartCount();