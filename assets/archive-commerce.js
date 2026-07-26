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


};

    console.log(
        "ArchiveCommerce",
        window.ArchiveOS.commerce.getVariants()
    );
    
    renderLicenses: function () {

    const container =
        document.getElementById("archive-license-list");

    if (!container) return;

    container.innerHTML = "";

    const licenses = this.getVariants();

    licenses.forEach((license) => {

        const card = document.createElement("button");

        card.type = "button";

        card.className = "archive-edition-card";

        card.dataset.variantId = license.id;

        const features =
    license.title === "Exclusive"
        ? [
            "Unlimited Commercial Use",
            "Track Stems Included",
            "Exclusive Ownership",
            "Removed From Store"
        ]
        : [
            "MP3 + WAV",
            "Commercial Release",
            "Instant Download",
            "Non-Exclusive License"
        ];
        card.innerHTML = `
            <div class="archive-edition-header">
                ${license.title.toUpperCase()} EDITION
            </div>

            <div class="archive-edition-description">
                ${
                    license.title === "Exclusive"
                        ? "Own the record exclusively."
                        : "Perfect for independent releases."
                }
            </div>
            <ul class="archive-edition-features">
    ${features.map(feature => `
        <li>✓ ${feature}</li>
    `).join("")}
</ul>


            <div class="archive-edition-price">
                ${license.priceText}
            </div>

            <div class="archive-edition-button">
                SELECT EDITION →
            </div>
        `;

        card.addEventListener("click", () => {

            document
                .querySelectorAll(".archive-edition-card")
                .forEach(c =>
                    c.classList.remove("selected")
                );

            card.classList.add("selected");

            ArchiveOS.set(
                "selectedVariant",
                license
            );

        });

        container.appendChild(card);

    });

}
);

})();