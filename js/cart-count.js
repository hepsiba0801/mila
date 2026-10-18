// =====================================
// MILA - SHARED CART COUNT
// =====================================

function getMilaCart() {
    try {
        return JSON.parse(localStorage.getItem("milaCart")) || [];
    } catch (error) {
        console.error("Unable to read Mila cart:", error);
        return [];
    }
}

function updateCartCount() {
    const cart = getMilaCart();

    // Count total quantities, not just unique products.
    const totalItems = cart.reduce((total, item) => {
        return total + (Number(item.quantity) || 1);
    }, 0);

    // Update every cart badge on the current page.
    document.querySelectorAll(".cart-count").forEach((badge) => {
        badge.textContent = totalItems;
    });
}

// Run when the page loads.
document.addEventListener("DOMContentLoaded", updateCartCount);

// Update if the cart changes in another browser tab.
window.addEventListener("storage", (event) => {
    if (event.key === "milaCart") {
        updateCartCount();
    }
});

// Allow other scripts to request a cart-count refresh.
window.addEventListener("milaCartUpdated", updateCartCount);