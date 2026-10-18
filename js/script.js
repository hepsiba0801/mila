$(document).ready(function () {

    // ==========================================
    // SPLASH SCREEN
    // ==========================================

    if (sessionStorage.getItem("milaSplashShown")) {

        // Splash already shown
        $("#splash-screen").hide();

        // Show navbar
        $(".mila-navbar").addClass("show-navbar");

    } else {

        // First visit
        $("#logo").hide();

        $("#logo").fadeIn(1000, function () {
            $("#logo").addClass("logo-zoom");
        });

        setTimeout(function () {

            $("#splash-screen").fadeOut(1000, function () {

                // Show navbar after splash
                $(".mila-navbar").addClass("show-navbar");

            });

            // Remember splash
            sessionStorage.setItem("milaSplashShown", "true");

        }, 3500);
    }


    // ==========================================
    // CATEGORY CLICK
    // ==========================================

    $(".category-card").click(function () {

        const category = $(this).data("category");

        // Navigate to the category in the Products page
        window.location.href =
            "products.html?category=" + encodeURIComponent(category);

    });


    // ==========================================
    // SHOP NAVBAR
    // ==========================================

    $(".nav-links a").click(function (event) {

        const linkText = $(this).text().trim();

        if (linkText === "Shop") {

            event.preventDefault();

            // Open the Products page
            window.location.href = "products.html";

        }

    });

});