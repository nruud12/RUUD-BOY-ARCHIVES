console.log("archive-commerce.js loaded");

(function () {

    window.ArchiveOS.commerce = {

    getVariants: function () {

        if (
            !window.meta ||
            !window.meta.product ||
            !window.meta.product.variants
        ) {
            return [];
        }

        return window.meta.product.variants.map(function (variant) {

            return {

                id: variant.id,

                title:
                    variant.public_title ||
                    variant.name,

                price: variant.price,

                priceText: new Intl.NumberFormat(
                    "en-US",
                    {
                        style: "currency",
                        currency: "USD"
                    }
                ).format(variant.price / 100)

            };

        });

    },

    renderLicenses: function () {

        const container =
            document.getElementById(
                "archive-license-list"
            );

        if (!container) return;

        container.innerHTML = "";

        const licenses =
            this.getVariants();

        licenses.forEach(function (license) {

            const button =
                document.createElement("button");

            button.className =
                "ruud-license-option";

            button.dataset.variantId =
                license.id;

            button.innerHTML = `
                <div class="license-title">
                    ${license.title}
                </div>
                <div class="license-price">
                    ${license.priceText}
                </div>
            `;

            container.appendChild(button);

        });

    }

};

    console.log(
        "ArchiveCommerce",
        window.ArchiveOS.commerce.getVariants()
    );
    // window.ArchiveOS.commerce.renderLicenses();

})();