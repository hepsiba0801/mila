// =========================================================
// CART DATA
// =========================================================

let cart = JSON.parse(localStorage.getItem("milaCart")) || [];


// =========================================================
// SAVE CART
// =========================================================

function saveCart() {

    localStorage.setItem(
        "milaCart",
        JSON.stringify(cart)
    );

}


// =========================================================
// UPDATE CART COUNT
// =========================================================

function updateCartCount() {

    const cartCounts =
        document.querySelectorAll(".cart-count");

    let totalQuantity = 0;

    cart.forEach(function (item) {

        totalQuantity += item.quantity;

    });


    cartCounts.forEach(function (element) {

        element.textContent = totalQuantity;

    });

}


// =========================================================
// DISPLAY CART
// =========================================================

function displayCart() {

    const container =
        document.getElementById("cart-items-container");


    if (!container) {
        return;
    }


    container.innerHTML = "";


    // ================= EMPTY CART =================

    if (cart.length === 0) {

        container.innerHTML = `

            <div class="empty-cart">

                <h2>
                    Your cart is empty
                </h2>

                <p>
                    Looks like you haven't added
                    anything yet.
                </p>

                <a
                    href="products.html"
                    class="empty-cart-btn">

                    START SHOPPING

                </a>

            </div>

        `;


        updateSummary();

        return;
    }


    // ================= CART ITEMS =================

    cart.forEach(function (item, index) {

        const cartItem =
            document.createElement("div");

        cartItem.classList.add("cart-item");


        cartItem.innerHTML = `

            <div class="cart-item-image">

                <img
                    src="${item.image}"
                    alt="${item.name}"
                >

            </div>


            <div class="cart-item-info">

                <p class="cart-item-category">
                    ${item.category}
                </p>

                <h3 class="cart-item-name">
                    ${item.name}
                </h3>

                <p class="cart-item-price">
                    ₹${item.price}
                </p>


                <div class="quantity-controls">

                    <button
                        class="quantity-btn decrease-btn"
                        data-index="${index}">

                        −

                    </button>


                    <span class="quantity-value">

                        ${item.quantity}

                    </span>


                    <button
                        class="quantity-btn increase-btn"
                        data-index="${index}">

                        +

                    </button>

                </div>

            </div>


            <div class="cart-item-right">

                <p class="cart-item-total">

                    ₹${item.price * item.quantity}

                </p>


                <button
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
// INCREASE / DECREASE / REMOVE
// =========================================================

document.addEventListener("click", function (event) {


    // ================= INCREASE =================

    if (
        event.target.classList.contains("increase-btn")
    ) {

        const index =
            event.target.dataset.index;

        cart[index].quantity++;

        saveCart();

        displayCart();

    }


    // ================= DECREASE =================

    if (
        event.target.classList.contains("decrease-btn")
    ) {

        const index =
            event.target.dataset.index;


        if (cart[index].quantity > 1) {

            cart[index].quantity--;

        } else {

            cart.splice(index, 1);

        }


        saveCart();

        displayCart();

    }


    // ================= REMOVE =================

    if (
        event.target.classList.contains("remove-btn")
    ) {

        const index =
            event.target.dataset.index;

        cart.splice(index, 1);

        saveCart();

        displayCart();

    }

});


// =========================================================
// CALCULATE SUMMARY
// =========================================================

function updateSummary() {

    let subtotal = 0;


    cart.forEach(function (item) {

        subtotal +=
            item.price * item.quantity;

    });


    document.getElementById("cart-subtotal").textContent =
        "₹" + subtotal;


    document.getElementById("cart-total").textContent =
        "₹" + subtotal;

}


// =========================================================
// INITIAL LOAD
// =========================================================

displayCart();

updateCartCount();