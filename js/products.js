// =========================================================
// MILA - PRODUCTS CATALOG
// Dynamic Product Listing & Category Filtering from FastAPI
// =========================================================

const API_BASE_URL = "http://127.0.0.1:8000";

// URL parameters
const urlParams = new URLSearchParams(window.location.search);
const categoryParam = urlParams.get("category");

// DOM elements
const categoryTitle = document.getElementById("category-title");
const categoryDescription = document.getElementById("category-description");
const productContainer = document.getElementById("product-container");

// In-memory products for add-to-cart lookups
let loadedProducts = [];

// =========================================================
// NORMALIZE IMAGE PATHS
// =========================================================
function getProductImagePath(image) {
    if (!image) return "";
    const normalizedPath = String(image).replace(/\\/g, "/");

    // Keep external and data URLs unchanged
    if (/^(https?:|data:|blob:)/i.test(normalizedPath)) {
        return normalizedPath;
    }

    // Convert images/foo.jpeg to ../images/foo.jpeg when served from html/
    if (normalizedPath.startsWith("images/")) {
        return "../" + normalizedPath;
    }

    if (normalizedPath.startsWith("../images/")) {
        return normalizedPath;
    }

    return "../images/" + normalizedPath;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (text === null || text === undefined) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// =========================================================
// UPDATE HEADER
// =========================================================
function updateCategoryHeader(category) {
    if (!categoryTitle || !categoryDescription) return;

    if (category) {
        const cleanName = category.trim();
        categoryTitle.textContent = cleanName.toUpperCase();
        categoryDescription.textContent =
            `Explore our ${cleanName.toLowerCase()} collection.`;
    } else {
        categoryTitle.textContent = "ALL PRODUCTS";
        categoryDescription.textContent =
            "Discover everything from the Mila collection.";
    }
}

// =========================================================
// FETCH AND RENDER PRODUCTS
// =========================================================
async function loadProducts() {
    updateCategoryHeader(categoryParam);

    if (!productContainer) return;

    // Loading state
    productContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #666;">
            <p style="font-size: 16px; letter-spacing: 1px;">Loading beauty essentials...</p>
        </div>
    `;

    try {
        const url = categoryParam
            ? `${API_BASE_URL}/products/?category=${encodeURIComponent(categoryParam.toLowerCase())}`
            : `${API_BASE_URL}/products/`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();
        loadedProducts = Array.isArray(data) ? data : [];

        renderProducts(loadedProducts);
    } catch (error) {
        console.error("Error fetching products:", error);
        productContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <h3 style="font-size: 20px; color: #211c1d; margin-bottom: 12px;">Unable to Load Products</h3>
                <p style="color: #666; margin-bottom: 24px;">Please ensure the Mila backend server is running.</p>
                <button onclick="loadProducts()" class="add-cart-btn" style="max-width: 200px; margin: 0 auto; display: block;">
                    Try Again
                </button>
            </div>
        `;
    }
}

// =========================================================
// RENDER PRODUCT CARDS
// =========================================================
function renderProducts(items) {
    if (!productContainer) return;
    productContainer.innerHTML = "";

    if (items.length === 0) {
        productContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #666;">
                <h3 style="font-size: 20px; color: #211c1d; margin-bottom: 10px;">No Products Found</h3>
                <p>We couldn't find any products in this category.</p>
                <a href="products.html" style="display: inline-block; margin-top: 15px; color: #8bbbc9; text-decoration: underline;">
                    View All Products
                </a>
            </div>
        `;
        return;
    }

    items.forEach(product => {
        const productCard = document.createElement("div");
        productCard.classList.add("product-card");

        const imagePath = getProductImagePath(product.image_url);
        const isOutOfStock = Number(product.stock_quantity) <= 0;
        const formattedPrice = Number(product.price).toLocaleString("en-IN");

        productCard.innerHTML = `
            <div class="product-image">
                <img
                    src="${imagePath}"
                    alt="${escapeHtml(product.name)}"
                    loading="lazy"
                    onerror="this.onerror=null; this.src='../images/logo.png';"
                >
            </div>

            <div class="product-info">
                <p class="product-category">
                    ${escapeHtml(product.category || "")}
                </p>

                <h3>
                    ${escapeHtml(product.name)}
                </h3>

                <p class="product-price">
                    ₹${formattedPrice}
                </p>

                <button
                    type="button"
                    class="add-cart-btn"
                    data-id="${product.product_id}"
                    ${isOutOfStock ? "disabled" : ""}
                >
                    ${isOutOfStock ? "OUT OF STOCK" : "Add to Cart"}
                </button>
            </div>
        `;

        // Card navigation (details page)
        productCard.addEventListener("click", function (event) {
            if (event.target.closest(".add-cart-btn")) {
                return;
            }
            window.location.href = `product.html?id=${encodeURIComponent(product.product_id)}`;
        });

        // Add to Cart button
        const addBtn = productCard.querySelector(".add-cart-btn");
        if (addBtn && !isOutOfStock) {
            addBtn.addEventListener("click", function (event) {
                event.stopPropagation();
                handleAddToCart(product, addBtn);
            });
        }

        productContainer.appendChild(productCard);
    });
}

// =========================================================
// ADD TO CART FUNCTIONALITY
// =========================================================
function handleAddToCart(product, buttonElement) {
    const stock = Number(product.stock_quantity);
    if (stock <= 0) {
        alert("Sorry, this item is out of stock.");
        return;
    }

    let cart = [];
    try {
        cart = JSON.parse(localStorage.getItem("milaCart")) || [];
        if (!Array.isArray(cart)) cart = [];
    } catch (e) {
        cart = [];
    }

    // Match by numeric product ID
    const existingIndex = cart.findIndex(item => String(item.id) === String(product.product_id));

    if (existingIndex > -1) {
        const currentQty = Number(cart[existingIndex].quantity) || 0;
        if (currentQty + 1 > stock) {
            alert(`Sorry, only ${stock} items are available in stock.`);
            return;
        }
        cart[existingIndex].quantity = currentQty + 1;
    } else {
        cart.push({
            id: product.product_id,
            name: product.name,
            category: product.category,
            price: Number(product.price),
            image: product.image_url,
            quantity: 1
        });
    }

    localStorage.setItem("milaCart", JSON.stringify(cart));

    // Update cart badge across page
    if (typeof updateCartCount === "function") {
        updateCartCount();
    } else {
        window.dispatchEvent(new Event("milaCartUpdated"));
    }

    // Temporary button confirmation
    buttonElement.textContent = "Added ✓";
    buttonElement.style.backgroundColor = "#211c1d";
    buttonElement.style.color = "#ffffff";

    setTimeout(() => {
        buttonElement.textContent = "Add to Cart";
        buttonElement.style.backgroundColor = "";
        buttonElement.style.color = "";
    }, 1200);
}

// =========================================================
// INITIALIZATION
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
});
