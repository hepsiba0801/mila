// =========================================================
// CART DATA
// =========================================================

function getCart() {
    try {
        const savedCart = JSON.parse(localStorage.getItem("milaCart"));

        if (!Array.isArray(savedCart)) {
            return [];
        }

        return savedCart
            .filter(item => item && item.id)
            .map(item => ({
                ...item,
                price: Number(item.price) || 0,
                quantity: Math.max(1, Number(item.quantity) || 1)
            }));

    } catch (error) {
        console.error("Unable to read cart data:", error);
        return [];
    }
}

let cart = getCart();


// =========================================================
// SAVE CART
// =========================================================

function saveCart() {
    localStorage.setItem("milaCart", JSON.stringify(cart));
}


// =========================================================
// FORMAT PRICE
// =========================================================

function formatPrice(price) {
    return "₹" + Number(price).toLocaleString("en-IN");
}


// =========================================================
// FIX PRODUCT IMAGE PATH
// =========================================================

function getCartImagePath(image) {
    if (!image) {
        return "";
    }

    let imagePath = String(image).replace(/\\/g, "/");

    // Leave external image URLs unchanged.
    if (/^(https?:|data:|blob:)/i.test(imagePath)) {
        return imagePath;
    }

    // Convert images/example.jpeg to ../images/example.jpeg.
    if (imagePath.startsWith("images/")) {
        imagePath = "../" + imagePath;
    }

    return imagePath;
}


// =========================================================
// UPDATE CART COUNT
// =========================================================

function updateCartCount() {
    const cartCountElements = document.querySelectorAll(".cart-count");

    const totalQuantity = cart.reduce(function (total, item) {
        return total + item.quantity;
    }, 0);

    cartCountElements.forEach(function (element) {
        element.textContent = totalQuantity;
    });
}


// =========================================================
// DISPLAY CART
// =========================================================

function displayCart() {
    const container = document.getElementById("cart-items-container");

    if (!container) {
        return;
    }

    container.innerHTML = "";


    // =====================================================
    // EMPTY CART
    // =====================================================

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <h2>Your cart is empty</h2>

                <p>
                    Looks like you haven't added
                    anything yet.
                </p>

                <a href="products.html" class="empty-cart-btn">
                    START SHOPPING
                </a>
            </div>
        `;

        updateSummary();
        updateCartCount();

        return;
    }


    // =====================================================
    // CART ITEMS
    // =====================================================

    cart.forEach(function (item, index) {
        const cartItem = document.createElement("div");

        cartItem.classList.add("cart-item");

        const imagePath = getCartImagePath(item.image);

        cartItem.innerHTML = `
            <div class="cart-item-image">
                <img
                    src="${imagePath}"
                    alt="${item.name}"
                    loading="lazy"
                >
            </div>

            <div class="cart-item-info">

                <p class="cart-item-category">
                    ${item.category || ""}
                </p>

                <h3 class="cart-item-name">
                    ${item.name}
                </h3>

                <p class="cart-item-price">
                    ${formatPrice(item.price)}
                </p>

                <div class="quantity-controls">

                    <button
                        type="button"
                        class="quantity-btn decrease-btn"
                        data-index="${index}"
                        aria-label="Decrease quantity">
                        −
                    </button>

                    <span class="quantity-value">
                        ${item.quantity}
                    </span>

                    <button
                        type="button"
                        class="quantity-btn increase-btn"
                        data-index="${index}"
                        aria-label="Increase quantity">
                        +
                    </button>

                </div>

            </div>

            <div class="cart-item-right">

                <p class="cart-item-total">
                    ${formatPrice(item.price * item.quantity)}
                </p>

                <button
                    type="button"
                    class="remove-btn"
                    data-index="${index}">
                    Remove
                </button>

            </div>
        `;

        container.appendChild(cartItem);
    });


    // Update the order summary and navbar.
    updateSummary();
    updateCartCount();
}


// =========================================================
// INCREASE / DECREASE / REMOVE
// =========================================================

document.addEventListener("click", function (event) {
    const button = event.target.closest(
        ".increase-btn, .decrease-btn, .remove-btn"
    );

    if (!button) {
        return;
    }

    const index = Number(button.dataset.index);

    if (!Number.isInteger(index) || !cart[index]) {
        return;
    }


    // =====================================================
    // INCREASE QUANTITY
    // =====================================================

    if (button.classList.contains("increase-btn")) {
        cart[index].quantity++;
    }


    // =====================================================
    // DECREASE QUANTITY
    // =====================================================

    else if (button.classList.contains("decrease-btn")) {
        if (cart[index].quantity > 1) {
            cart[index].quantity--;
        } else {
            cart.splice(index, 1);
        }
    }


    // =====================================================
    // REMOVE PRODUCT
    // =====================================================

    else if (button.classList.contains("remove-btn")) {
        cart.splice(index, 1);
    }


    // Save changes and refresh the cart.
    saveCart();
    displayCart();
});


// =========================================================
// CALCULATE ORDER SUMMARY
// =========================================================

function updateSummary() {
    const subtotal = cart.reduce(function (total, item) {
        return total + item.price * item.quantity;
    }, 0);

    const subtotalElement = document.getElementById("cart-subtotal");
    const totalElement = document.getElementById("cart-total");

    if (subtotalElement) {
        subtotalElement.textContent = formatPrice(subtotal);
    }

    if (totalElement) {
        totalElement.textContent = formatPrice(subtotal);
    }
}


// =========================================================
// CHECKOUT BUTTON
// =========================================================

const checkoutButton = document.getElementById("checkout-btn");

if (checkoutButton) {
    checkoutButton.addEventListener("click", function () {
        if (cart.length === 0) {
            alert("Your cart is empty. Please add products before checkout.");
            return;
        }

        alert("Checkout functionality will be available soon!");
    });
}


// =========================================================
// INITIAL LOAD
// =========================================================

displayCart();
updateCartCount();