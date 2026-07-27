/* ==========================================================
   ArchiveOS Commerce v3.0
   Responsibility
   ----------------
   ✓ Variant parsing
   ✓ Edition rendering
   ✓ Edition selection
   ✓ Buy button updates
========================================================== */

(function () {

    if (!window.ArchiveOS) {
        console.error("ArchiveOS Core missing.");
        return;
    }

    const EDITIONS = {

        Lease: {

            description:
                "Perfect for independent releases.",

            features: [

                "MP3 + WAV",
                "Commercial Release",
                "Instant Download",
                "Non-Exclusive License"

            ]

        },

        Exclusive: {

            description:
                "Own the record exclusively.",

            features: [

                "Unlimited Commercial Use",
                "Track Stems Included",
                "Exclusive Ownership",
                "Removed From Store"

            ]

        }

    };

    ArchiveOS.commerce = {

        getVariants() {

            const track =
                ArchiveOS.get("activeTrack");

            if (
                !track ||
                !Array.isArray(track.variants)
            ) {
                return [];
            }

            return track.variants.map((variant) => ({

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

            }));

        },

        getEditionContent(title) {

            return EDITIONS[title] || {

                description:
                    "Professional license.",

                features: [

                    "Instant Download"

                ]

            };

        },
                renderLicenses() {

            const container =
                document.getElementById(
                    "archive-license-list"
                );

            if (!container) return;

            container.innerHTML = "";

            this.getVariants().forEach((license) => {

                const content =
                    this.getEditionContent(
                        license.title
                    );

                const card =
                    document.createElement("button");

                card.type = "button";

                card.className =
                    "archive-edition-card";

                card.dataset.variantId =
                    license.id;

                card.innerHTML = `
                    <div class="archive-edition-header">
                        ${license.title.toUpperCase()} EDITION
                    </div>

                    <div class="archive-edition-description">
                        ${content.description}
                    </div>

                    <ul class="archive-edition-features">
                        ${content.features.map(feature => `
                            <li>✓ ${feature}</li>
                        `).join("")}
                    </ul>

                    <div class="archive-edition-price">
                        ${license.priceText}
                    </div>

                    <div class="archive-edition-button">
                        SELECT EDITION
                    </div>
                `;

                card.addEventListener(
                    "click",
                    () => {

                        this.selectVariant(
                            license
                        );

                    }
                );

                container.appendChild(
                    card
                );

            });

        },
                selectVariant(license) {

            document
                .querySelectorAll(
                    ".archive-edition-card"
                )
                .forEach((card) => {

                    card.classList.remove(
                        "selected"
                    );

                });

            const selectedCard =
                document.querySelector(
                    `[data-variant-id="${license.id}"]`
                );

            if (selectedCard) {

                selectedCard.classList.add(
                    "selected"
                );

            }

            ArchiveOS.set(
                "selectedVariant",
                license
            );

            this.updateBuyButton(
                license
            );

        },

        updateBuyButton(license) {

            const button =
                document.getElementById(
                    "ruud-buy-button"
                );

            if (!button) return;

            button.textContent =
                `BUY ${license.title.toUpperCase()} • ${license.priceText}`;

        },

        init() {

            ArchiveOS.on(
                "archive:trackchange",
                () => {

                    this.renderLicenses();

                }
            );

        }

    };

    ArchiveOS.commerce.init();

})();