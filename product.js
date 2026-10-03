// ==========================================
// GET PRODUCT ID FROM URL
// ==========================================

const url = new URLSearchParams(window.location.search);

const productId = url.get("id");


// ==========================================
// PRODUCT DATA
// ==========================================

const products = [

    // ==========================================
    // MAKEUP PRODUCTS
    // ==========================================

    {
        id: "makeup1",
        name: "Huda Beauty Medium Nude",
        category: "makeup",
        price: 2499,
        image: "images/eyeshadow.jpeg",
        description:
            "A versatile nude eyeshadow palette featuring rich matte and shimmer shades for creating everyday and glamorous eye looks."
    },

    {
        id: "makeup2",
        name: "SHEGLAM Skinfinite Hydrating Foundation",
        category: "makeup",
        price: 899,
        image: "images/foundation.jpeg",
        description:
            "A lightweight hydrating foundation designed to provide smooth, buildable coverage with a natural-looking finish."
    },

    {
        id: "makeup3",
        name: "MAC Lipstick",
        category: "makeup",
        price: 2200,
        image: "images/lipstick.jpeg",
        description:
            "A creamy lipstick with rich colour and a comfortable finish, designed to create a smooth and defined lip look."
    },


    // ==========================================
    // SKINCARE PRODUCTS
    // ==========================================

    {
        id: "skincare1",
        name: "ANUA Heartleaf Pore Deep Cleansing Foam",
        category: "skincare",
        price: 899,
        image: "images/facewash.jpeg",
        description:
            "A gentle cleansing foam formulated with Heartleaf extract to help remove impurities and excess oil while leaving the skin feeling fresh and clean."
    },

    {
        id: "skincare2",
        name: "SKIN1004 Madagascar Centella Ampoule",
        category: "skincare",
        price: 1299,
        image: "images/serum.jpeg",
        description:
            "A lightweight soothing ampoule formulated with Madagascar Centella to help calm and hydrate the skin while supporting the skin barrier."
    },

    {
        id: "skincare3",
        name: "Laneige Water Sleeping Mask",
        category: "skincare",
        price: 1599,
        image: "images/sleepingmask.jpeg",
        description:
            "An overnight hydrating sleeping mask designed to replenish moisture and leave the skin feeling soft, refreshed and hydrated by morning."
    },


    // ==========================================
    // HAIR PRODUCTS
    // ==========================================

    {
        id: "hair1",
        name: "Natural Dry Shampoo",
        category: "hair",
        price: 799,
        image: "images/dryshampoo.jpeg",
        description:
            "A refreshing dry shampoo designed to absorb excess oil and leave hair feeling clean, fresh and lightweight between washes."
    },

    {
        id: "hair2",
        name: "Nourishing Hair Oil",
        category: "hair",
        price: 999,
        image: "images/hairoil.jpeg",
        description:
            "A nourishing hair oil designed to moisturize the scalp and hair while helping improve softness, shine and overall hair health."
    },

    {
        id: "hair3",
        name: "Curl Crush Hair Cream",
        category: "hair",
        price: 899,
        image: "images/curl.jpeg",
        description:
            "A curl-defining cream designed to enhance natural curls, reduce frizz and leave hair soft, smooth and defined."
    },


    // ==========================================
    // FRAGRANCE PRODUCTS
    // ==========================================

    {
        id: "fragrance1",
        name: "YSL Libre Berry Crush",
        category: "fragrance",
        price: 8999,
        image: "images/ysl.jpeg",
        description:
            "A luxurious berry-inspired fragrance with a rich fruity character and an elegant, long-lasting scent."
    },

    {
        id: "fragrance2",
        name: "TUKAN Vanilla Sky",
        category: "fragrance",
        price: 2499,
        image: "images/tukan.jpeg",
        description:
            "A warm and sophisticated vanilla fragrance with a smooth and comforting character designed for everyday wear."
    },

    {
        id: "fragrance3",
        name: "Chanel Coco Mademoiselle",
        category: "fragrance",
        price: 12999,
        image: "images/chanel.jpeg",
        description:
            "An elegant fragrance with a refined blend of citrus, floral and warm notes, creating a sophisticated signature scent."
    },


    // ==========================================
    // BODY CARE PRODUCTS
    // ==========================================

    {
        id: "bodycare1",
        name: "Coba's Daughter Coffee Body Exfoliator",
        category: "bodycare",
        price: 799,
        image: "images/bodyexfo.jpeg",
        description:
            "A coffee-based body exfoliator designed to gently remove dead skin cells and leave the skin feeling smooth, soft and refreshed."
    },

    {
        id: "bodycare2",
        name: "Candleton Coconut Body Butter",
        category: "bodycare",
        price: 699,
        image: "images/coconutwax.jpeg",
        description:
            "A rich coconut body butter designed to nourish and moisturize dry skin while leaving it feeling soft and smooth."
    },

    {
        id: "bodycare3",
        name: "Glow Pastel Guava Foaming Body Wash",
        category: "bodycare",
        price: 599,
        image: "images/bodywash.jpeg",
        description:
            "A refreshing guava-scented foaming body wash designed to gently cleanse the skin while providing a soft and refreshing shower experience."
    },


    // ==========================================
    // LIPS PRODUCTS
    // ==========================================

    {
        id: "lips1",
        name: "Gisou Honey Infused Lip Oil",
        category: "lips",
        price: 999,
        image: "images/lipoil.jpeg",
        description:
            "A glossy honey-infused lip oil designed to nourish, moisturize and give lips a smooth, hydrated shine."
    },

    {
        id: "lips2",
        name: "The Face Hub Lip Butter Balm",
        category: "lips",
        price: 599,
        image: "images/lipbalm.jpeg",
        description:
            "A rich lip butter balm designed to provide lasting moisture and keep lips soft, smooth and comfortable throughout the day."
    },

    {
        id: "lips3",
        name: "Rhode Peptide Lip Tint",
        category: "lips",
        price: 1499,
        image: "images/liptint.jpeg",
        description:
            "A hydrating peptide lip tint that combines comfortable moisture with a soft, glossy tint for an effortless everyday lip look."
    }

];
// =========================================================
// ADD TO CART
// =========================================================

const addCartButtons =
    document.querySelectorAll(".add-cart-btn");


addCartButtons.forEach(function (button) {

    button.addEventListener("click", function (event) {

        // Stop product card from opening
        event.stopPropagation();


        // Get product ID
        const productId =
            button.dataset.id;


        // Find product
        const product =
            products.find(function (item) {

                return item.id === productId;

            });


        if (!product) {
            return;
        }


        // Get existing cart
        let cart =
            JSON.parse(
                localStorage.getItem("milaCart")
            ) || [];


        // Check whether product already exists
        const existingProduct =
            cart.find(function (item) {

                return item.id === product.id;

            });


        if (existingProduct) {

            // Product already in cart
            existingProduct.quantity++;

        } else {

            // Add new product
            cart.push({

                id: product.id,

                name: product.name,

                category: product.category,

                price: product.price,

                image: product.image,

                quantity: 1

            });

        }


        // Save cart
        localStorage.setItem(
            "milaCart",
            JSON.stringify(cart)
        );


        // Update navbar count
        updateNavbarCartCount();


        // Small confirmation
        button.textContent = "Added ✓";


        setTimeout(function () {

            button.textContent = "Add to Cart";

        }, 1000);

    });

});


// =========================================================
// UPDATE NAVBAR CART COUNT
// =========================================================

function updateNavbarCartCount() {

    let cart =
        JSON.parse(
            localStorage.getItem("milaCart")
        ) || [];


    let totalQuantity = 0;


    cart.forEach(function (item) {

        totalQuantity += item.quantity;

    });


    const cartCounts =
        document.querySelectorAll(".cart-count");


    cartCounts.forEach(function (element) {

        element.textContent = totalQuantity;

    });

}


// =========================================================
// LOAD CART COUNT
// =========================================================

updateNavbarCartCount();
// ==========================================
// FIND SELECTED PRODUCT
// ==========================================

const product = products.find(function (item) {

    return item.id === productId;

});


// ==========================================
// DISPLAY PRODUCT
// ==========================================

if (product) {

    document.getElementById("product-image").src =
        product.image;

    document.getElementById("product-image").alt =
        product.name;

    document.getElementById("product-category").textContent =
        product.category;

    document.getElementById("product-name").textContent =
        product.name;

    document.getElementById("product-price").textContent =
        "₹" + product.price;

    document.getElementById("product-description").textContent =
        product.description;

}


// ==========================================
// QUANTITY
// ==========================================

let quantity = 1;

const quantityDisplay =
    document.getElementById("quantity");


document.getElementById("increase-btn")
    .addEventListener("click", function () {

        quantity++;

        quantityDisplay.textContent =
            quantity;

    });


document.getElementById("decrease-btn")
    .addEventListener("click", function () {

        if (quantity > 1) {

            quantity--;

            quantityDisplay.textContent =
                quantity;

        }

    });