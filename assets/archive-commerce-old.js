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