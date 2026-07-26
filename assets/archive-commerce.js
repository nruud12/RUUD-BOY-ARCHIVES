console.log("archive-commerce.js loaded");

(function () {

    window.ArchiveOS.commerce = {

    getVariants: function () {

    const track =
        ArchiveOS.get("activeTrack");

    if (
        !track ||
        !track.variants
    ) {
        return [];
    }

    return track.variants.map(function (variant) {

        return {

            id: variant.id,

            title:
                variant.public_title ||
                variant.name ||
                "License",

            price: variant.price,

            priceText:
                new Intl.NumberFormat(
                    "en-US",
                    {
                        style: "currency",
                        currency: "USD"
                    }
                ).format(
                    variant.price / 100
                )

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
    ArchiveOS.on(
    "archive:trackchange",
    function () {

        ArchiveOS.commerce.renderLicenses();

    }
);

})();