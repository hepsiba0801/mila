// =========================================================
// MILA - AUTHENTICATION & NAVBAR STATE
// Shared Auth Helper for Session, Cart Sync & Navigation
// =========================================================

const AUTH_API_URL = "http://127.0.0.1:8000";

function getAuthToken() {
    return localStorage.getItem("milaAuthToken") || null;
}

function getAuthUser() {
    try {
        return JSON.parse(localStorage.getItem("milaUser")) || null;
    } catch (e) {
        return null;
    }
}

function isLoggedIn() {
    return !!getAuthToken();
}

function logout() {
    localStorage.removeItem("milaAuthToken");
    localStorage.removeItem("milaUser");
    window.location.href = "signin.html";
}

// Sync localStorage cart items to the server
async function syncLocalCartWithServer() {
    const token = getAuthToken();
    if (!token) return;

    try {
        const localCart = JSON.parse(localStorage.getItem("milaCart")) || [];
        if (!Array.isArray(localCart) || localCart.length === 0) return;

        const syncItems = localCart.map(item => ({
            id: Number(item.id),
            quantity: Number(item.quantity) || 1,
        })).filter(item => !isNaN(item.id) && item.id > 0);

        if (syncItems.length === 0) return;

        const response = await fetch(`${AUTH_API_URL}/cart/sync`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ items: syncItems }),
        });

        if (response.ok) {
            const data = await response.json();
            // Update local storage with backend-confirmed prices/stock
            const updatedLocalCart = data.items.map(item => ({
                id: item.product_id,
                name: item.product_name,
                category: item.category,
                price: item.price,
                image: item.image_url,
                quantity: item.quantity,
            }));
            localStorage.setItem("milaCart", JSON.stringify(updatedLocalCart));
            if (typeof updateCartCount === "function") {
                updateCartCount();
            }
        }
    } catch (error) {
        console.warn("Cart sync error:", error);
    }
}

// Update navbar account link based on auth state
function updateNavbarAuth() {
    const accountLinks = document.querySelectorAll(".account-link");
    const user = getAuthUser();

    accountLinks.forEach(link => {
        if (user && isLoggedIn()) {
            link.href = "profile.html";
            link.title = `My Account (${user.full_name})`;
            link.setAttribute("aria-label", `Account of ${user.full_name}`);
            // Subtle logged-in indicator
            link.style.filter = "drop-shadow(0 0 2px rgba(139, 187, 201, 0.9))";
        } else {
            link.href = "signin.html";
            link.title = "Sign In";
            link.setAttribute("aria-label", "Sign In");
            link.style.filter = "none";
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    updateNavbarAuth();
});
