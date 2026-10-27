// ==========================================
// MILA - PRODUCT DETAILS
// Fetch products from FastAPI
// ==========================================

const API_BASE_URL = "http://127.0.0.1:8000";

// ==========================================
// GET PRODUCT ID FROM URL
// ==========================================

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

let product = null;
let quantity = 1;

// ==========================================
// HTML ELEMENTS
// ==========================================

const productImage = document.getElementById("product-image");
const productName = document.getElementById("product-name");
const productCategory = document.getElementById("product-category");
const productPrice = document.getElementById("product-price");
const productDescription = document.getElementById("product-description");

const quantityDisplay = document.getElementById("quantity");
const decreaseBtn = document.getElementById("decrease-btn");
const increaseBtn = document.getElementById("increase-btn");
const addToCartBtn = document.getElementById("add-to-cart-btn");


// ==========================================
// FETCH PRODUCT FROM FASTAPI
// ==========================================

async function loadProduct() {

    // Database product IDs are numeric
    if (!productId || !/^\d+$/.test(productId)) {
        showProductError(
            "Invalid product ID. Please open this product from the shop."
        );
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}/products/${encodeURIComponent(productId)}`
        );

        if (response.status === 404) {
            showProductError("Sorry, we couldn't find this product.");
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        // Convert API response into JavaScript data
        product = await response.json();

        // ==========================================
        // DISPLAY PRODUCT INFORMATION
        // ==========================================

        productName.textContent = product.name;

        productCategory.textContent = product.category;

        productPrice.textContent =
            `₹${Number(product.price).toLocaleString("en-IN")}`;

        productDescription.textContent =
            product.description ||
            "Discover this beauty essential from Mila.";

        // ==========================================
        // PRODUCT IMAGE
        // ==========================================

        const imagePath = product.image_url || "";

        if (
            imagePath.startsWith("images/") ||
            imagePath.startsWith("images\\")
        ) {
            productImage.src = "../" + imagePath.replace(/\\/g, "/");
        } else {
            productImage.src = imagePath;
        }

        productImage.alt = product.name;

        productImage.onerror = function () {
            console.error(
                "Product image could not be loaded:",
                productImage.src
            );
        };

        // ==========================================
        // STOCK VALIDATION
        // ==========================================

        if (Number(product.stock_quantity) <= 0) {
            addToCartBtn.disabled = true;
            addToCartBtn.textContent = "OUT OF STOCK";
        }

    } catch (error) {

        console.error("Error fetching product:", error);

        showProductError(
            "Unable to load the product. Please check that the Mila API is running."
        );
    }
}


// ==========================================
// PRODUCT NOT FOUND
// ==========================================

function showProductError(message) {

    const productDetails = document.querySelector(".product-details");

    if (productDetails) {
        productDetails.innerHTML = `
            <div class="product-not-found">
                <h2>Product Not Found</h2>
                <p>${message}</p>
                <a href="products.html">Back to Shop</a>
            </div>
        `;
    }
}


// ==========================================
// DECREASE QUANTITY
// ==========================================

if (decreaseBtn && quantityDisplay) {

    decreaseBtn.addEventListener("click", function () {

        if (quantity > 1) {
            quantity--;
            quantityDisplay.textContent = quantity;
        }

    });

}


// ==========================================
// INCREASE QUANTITY
// ==========================================

if (increaseBtn && quantityDisplay) {

    increaseBtn.addEventListener("click", function () {

        if (!product) return;

        const stock = Number(product.stock_quantity);

        if (quantity < stock) {
            quantity++;
            quantityDisplay.textContent = quantity;
        }

    });

}


// ==========================================
// ADD TO CART
// ==========================================

if (addToCartBtn) {

    addToCartBtn.addEventListener("click", function () {

        // Wait until product data is available
        if (!product) return;

        const stock = Number(product.stock_quantity);

        if (stock <= 0) {
            alert("Sorry, this product is out of stock.");
            return;
        }

        let cart = [];

        // Read existing cart
        try {

            cart = JSON.parse(localStorage.getItem("milaCart")) || [];

            if (!Array.isArray(cart)) {
                cart = [];
            }

        } catch (error) {

            cart = [];

        }

        // Find existing product using database ID
        const existingProduct = cart.find(
            item => String(item.id) === String(product.product_id)
        );

        if (existingProduct) {

            // Increase existing quantity
            const updatedQuantity =
                (Number(existingProduct.quantity) || 0) + quantity;

            if (updatedQuantity > stock) {
                alert("Sorry, there isn't enough stock available.");
                return;
            }

            existingProduct.quantity = updatedQuantity;

        } else {

            // Add new product to cart
            cart.push({
                id: product.product_id,
                name: product.name,
                category: product.category,
                price: Number(product.price),
                image: product.image_url,
                quantity: quantity
            });

        }

        // Save cart
        localStorage.setItem("milaCart", JSON.stringify(cart));

        // Update navbar cart badge
        if (typeof updateCartCount === "function") {
            updateCartCount();
        }

        // Button feedback
        addToCartBtn.textContent = "ADDED ✓";

        setTimeout(function () {

            addToCartBtn.textContent = "ADD TO CART";

        }, 1500);

    });

}


// ==========================================
// INITIAL CART COUNT
// ==========================================

if (typeof updateCartCount === "function") {
    updateCartCount();
}


// ==========================================
// LOAD PRODUCT
// ==========================================

loadProduct();