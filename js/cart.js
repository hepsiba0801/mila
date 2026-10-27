// =========================================================
// MILA - SHOPPING CART & CHECKOUT
// Integrated LocalStorage & Database Order Processing
// =========================================================

const CART_API_URL = "http://127.0.0.1:8000";

// =========================================================
// CART DATA INITIALIZATION
// =========================================================

function getCart() {
    try {
        const savedCart = JSON.parse(localStorage.getItem("milaCart"));

        if (!Array.isArray(savedCart)) {
            return [];
        }

        // Filter and sanitize entries: numeric IDs, positive integers
        return savedCart
            .filter(item => item && item.id && !isNaN(Number(item.id)))
            .map(item => ({
                id: Number(item.id),
                name: String(item.name || "Mila Cosmetic Item"),
                category: String(item.category || ""),
                price: Number(item.price) || 0,
                image: String(item.image || ""),
                quantity: Math.max(1, parseInt(item.quantity, 10) || 1)
            }));

    } catch (error) {
        console.error("Unable to read cart data:", error);
        return [];
    }
}

let cart = getCart();

// =========================================================
// SAVE CART & OPTIONAL BACKEND SYNC
// =========================================================

function saveCart() {
    localStorage.setItem("milaCart", JSON.stringify(cart));

    // If user is authenticated, sync to database cart
    const token = localStorage.getItem("milaAuthToken");
    if (token && typeof syncLocalCartWithServer === "function") {
        syncLocalCartWithServer();
    }
}

// =========================================================
// FORMAT CURRENCY (INR)
// =========================================================

function formatPrice(price) {
    return "₹" + Number(price).toLocaleString("en-IN");
}

// =========================================================
// FIX PRODUCT IMAGE PATH
// =========================================================

function getCartImagePath(image) {
    if (!image) {
        return "../images/logo.png";
    }

    let imagePath = String(image).replace(/\\/g, "/");

    if (/^(https?:|data:|blob:)/i.test(imagePath)) {
        return imagePath;
    }

    if (imagePath.startsWith("images/")) {
        imagePath = "../" + imagePath;
    } else if (!imagePath.startsWith("../images/")) {
        imagePath = "../images/" + imagePath;
    }

    return imagePath;
}

// =========================================================
// UPDATE NAVBAR CART COUNT BADGES
// =========================================================

function updateCartCount() {
    const totalQuantity = cart.reduce(function (total, item) {
        return total + item.quantity;
    }, 0);

    document.querySelectorAll(".cart-count").forEach(function (element) {
        element.textContent = totalQuantity;
    });
}

// =========================================================
// DISPLAY CART ITEMS
// =========================================================

function displayCart() {
    const container = document.getElementById("cart-items-container");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    // EMPTY CART STATE
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <h2>Your cart is empty</h2>
                <p>Looks like you haven't added any beauty essentials yet.</p>
                <a href="products.html" class="empty-cart-btn">
                    START SHOPPING
                </a>
            </div>
        `;

        updateSummary();
        updateCartCount();
        return;
    }

    // CART ITEMS LIST
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
                    onerror="this.onerror=null; this.src='../images/logo.png';"
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

    updateSummary();
    updateCartCount();
}

// =========================================================
// QUANTITY ADJUSTMENTS & REMOVALS
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

    // INCREASE
    if (button.classList.contains("increase-btn")) {
        cart[index].quantity++;
    }
    // DECREASE
    else if (button.classList.contains("decrease-btn")) {
        if (cart[index].quantity > 1) {
            cart[index].quantity--;
        } else {
            cart.splice(index, 1);
        }
    }
    // REMOVE
    else if (button.classList.contains("remove-btn")) {
        cart.splice(index, 1);
    }

    saveCart();
    displayCart();
});

// =========================================================
// ORDER SUMMARY
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
// CHECKOUT WORKFLOW
// =========================================================

const checkoutButton = document.getElementById("checkout-btn");

if (checkoutButton) {
    checkoutButton.addEventListener("click", async function () {
        if (cart.length === 0) {
            alert("Your cart is empty. Please add products before checking out.");
            return;
        }

        const token = localStorage.getItem("milaAuthToken");

        // If not logged in, prompt to Sign In or Sign Up
        if (!token) {
            showAuthRequiredModal();
            return;
        }

        // Open checkout modal and pre-fill address
        await openCheckoutModal(token);
    });
}

function showAuthRequiredModal() {
    // Remove existing modal if any
    const existing = document.querySelector(".checkout-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.className = "checkout-overlay";
    overlay.innerHTML = `
        <div class="checkout-modal" style="text-align: center; max-width: 440px;">
            <button class="checkout-close-btn" onclick="this.closest('.checkout-overlay').remove()">&times;</button>
            <h2>Sign In Required</h2>
            <p class="checkout-subtitle">Please sign in to your Mila account to complete your checkout and track your delivery.</p>
            <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 25px;">
                <a href="signin.html?redirect=cart.html" class="btn-primary-action" style="text-align: center;">Sign In</a>
                <a href="signup.html" class="btn-secondary-action" style="text-align: center;">Create an Account</a>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

async function openCheckoutModal(token) {
    const existing = document.querySelector(".checkout-overlay");
    if (existing) existing.remove();

    // Fetch saved address from backend
    let savedAddress = null;
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem("milaUser")) || {};
        const res = await fetch(`${CART_API_URL}/addresses`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
            savedAddress = await res.json();
        }
    } catch (e) {
        console.warn("Could not prefill address:", e);
    }

    const recipient = savedAddress ? savedAddress.recipient_name : (user.full_name || "");
    const phone = savedAddress ? savedAddress.phone_number : "";
    const line1 = savedAddress ? savedAddress.address_line1 : "";
    const line2 = savedAddress ? (savedAddress.address_line2 || "") : "";
    const city = savedAddress ? savedAddress.city : "";
    const state = savedAddress ? savedAddress.state : "";
    const zip = savedAddress ? savedAddress.postal_code : "";

    const totalAmount = cart.reduce((tot, item) => tot + item.price * item.quantity, 0);

    const itemsSummaryHtml = cart.map(item => `
        <div class="checkout-review-row">
            <span>${item.name} × ${item.quantity}</span>
            <span>${formatPrice(item.price * item.quantity)}</span>
        </div>
    `).join("");

    const overlay = document.createElement("div");
    overlay.className = "checkout-overlay";
    overlay.innerHTML = `
        <div class="checkout-modal">
            <button class="checkout-close-btn" id="modalCloseBtn">&times;</button>
            <h2>Complete Your Order</h2>
            <p class="checkout-subtitle">Enter your delivery details to complete your order.</p>

            <form id="checkoutForm">
                <div class="checkout-section-title">Shipping Address</div>

                <div class="checkout-form-group">
                    <label for="coRecipient">Recipient Full Name</label>
                    <input type="text" id="coRecipient" value="${recipient}" required>
                </div>

                <div class="checkout-form-group">
                    <label for="coPhone">Phone Number</label>
                    <input type="tel" id="coPhone" value="${phone}" placeholder="e.g. +91 9876543210" required>
                </div>

                <div class="checkout-form-group">
                    <label for="coLine1">Address Line 1</label>
                    <input type="text" id="coLine1" value="${line1}" placeholder="House/Flat number, Street" required>
                </div>

                <div class="checkout-form-group">
                    <label for="coLine2">Address Line 2 (Optional)</label>
                    <input type="text" id="coLine2" value="${line2}" placeholder="Apartment, suite, landmark">
                </div>

                <div class="checkout-row">
                    <div class="checkout-form-group">
                        <label for="coCity">City</label>
                        <input type="text" id="coCity" value="${city}" required>
                    </div>
                    <div class="checkout-form-group">
                        <label for="coState">State</label>
                        <input type="text" id="coState" value="${state}" required>
                    </div>
                </div>

                <div class="checkout-row">
                    <div class="checkout-form-group">
                        <label for="coZip">Postal Code</label>
                        <input type="text" id="coZip" value="${zip}" required>
                    </div>
                    <div class="checkout-form-group">
                        <label for="coCountry">Country</label>
                        <input type="text" id="coCountry" value="India" readonly>
                    </div>
                </div>

                <div class="checkout-section-title">Order Review</div>
                <div class="checkout-order-review">
                    ${itemsSummaryHtml}
                    <div class="checkout-review-row" style="color: #666; margin-top: 8px;">
                        <span>Standard Delivery</span>
                        <span>FREE</span>
                    </div>
                    <div class="checkout-review-total">
                        <span>Total Due</span>
                        <span>${formatPrice(totalAmount)}</span>
                    </div>
                </div>

                <div class="payment-notice-box">
                    <strong>Payment Method:</strong> Cash on Delivery / Simulated Payment (Demonstration Flow). No real payment card will be charged.
                </div>

                <button type="submit" class="btn-place-order" id="placeOrderBtn">
                    PLACE ORDER &bull; ${formatPrice(totalAmount)}
                </button>

                <div class="checkout-error" id="checkoutErrorMsg"></div>
            </form>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("modalCloseBtn").addEventListener("click", () => {
        overlay.remove();
    });

    document.getElementById("checkoutForm").addEventListener("submit", async function (event) {
        event.preventDefault();

        const submitBtn = document.getElementById("placeOrderBtn");
        const errorMsg = document.getElementById("checkoutErrorMsg");
        errorMsg.textContent = "";

        submitBtn.disabled = true;
        submitBtn.textContent = "Processing Order...";

        const payload = {
            recipient_name: document.getElementById("coRecipient").value.trim(),
            phone_number: document.getElementById("coPhone").value.trim(),
            address_line1: document.getElementById("coLine1").value.trim(),
            address_line2: document.getElementById("coLine2").value.trim() || null,
            city: document.getElementById("coCity").value.trim(),
            state: document.getElementById("coState").value.trim(),
            postal_code: document.getElementById("coZip").value.trim(),
            country: "India",
            items: cart.map(item => ({
                product_id: item.id,
                quantity: item.quantity
            }))
        };

        try {
            const response = await fetch(`${CART_API_URL}/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Unable to place order.");
            }

            // Order placed successfully!
            // 1. Clear cart locally
            cart = [];
            localStorage.setItem("milaCart", JSON.stringify([]));
            updateCartCount();

            // 2. Remove modal and display confirmation screen
            overlay.remove();
            showOrderSuccessScreen(data);

        } catch (error) {
            console.error("Checkout error:", error);
            errorMsg.textContent = error.message || "An error occurred while placing your order.";
            submitBtn.disabled = false;
            submitBtn.textContent = `PLACE ORDER • ${formatPrice(totalAmount)}`;
        }
    });
}

function showOrderSuccessScreen(order) {
    const mainPage = document.querySelector(".cart-page");
    if (!mainPage) return;

    const itemsSummary = (order.items || []).map(it => `
        <li style="margin-bottom: 5px;">
            ${it.product_name} × ${it.quantity} — ₹${Number(it.unit_price).toLocaleString("en-IN")}
        </li>
    `).join("");

    mainPage.innerHTML = `
        <div class="order-success-screen">
            <div class="order-success-icon">✓</div>
            <h2>Thank You for Your Order!</h2>
            <p style="color: #666; font-size: 15px;">Your beauty order has been successfully placed and confirmed.</p>

            <div class="order-success-details">
                <p><strong>Order ID:</strong> #${order.order_id}</p>
                <p><strong>Order Status:</strong> <span style="text-transform: uppercase; color: #27845c; font-weight: bold;">${order.order_status}</span></p>
                <p><strong>Total Paid:</strong> ₹${Number(order.total_amount).toLocaleString("en-IN")}</p>
                <p><strong>Delivering to:</strong> ${order.recipient_name}, ${order.address_line1}, ${order.city}, ${order.state} ${order.postal_code}</p>
                <div style="margin-top: 12px; border-top: 1px solid #e5e0d9; padding-top: 10px;">
                    <strong>Items Ordered:</strong>
                    <ul style="padding-left: 20px; margin-top: 6px; color: #444;">
                        ${itemsSummary}
                    </ul>
                </div>
            </div>

            <div class="order-success-actions">
                <a href="profile.html" class="btn-primary-action">View in My Account</a>
                <a href="products.html" class="btn-secondary-action">Continue Shopping</a>
            </div>
        </div>
    `;
}

// =========================================================
// INITIAL PAGE LOAD
// =========================================================

document.addEventListener("DOMContentLoaded", function () {
    displayCart();
    updateCartCount();
});
