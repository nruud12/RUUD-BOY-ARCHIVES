/* ==========================================================
   ArchiveOS UI v2.0
   Responsibility:
   - Preview buttons
   - Global player UI
   - Progress updates
   - Play / Pause controls
========================================================== */

(function () {

    if (!window.ArchiveOS) {
        console.error("ArchiveOS Core missing.");
        return;
    }

    const player =
        document.getElementById("ruud-global-player");

    const title =
        document.getElementById("ruud-global-title");

    const artwork =
        document.getElementById("ruud-global-image");

    const progress =
        document.getElementById("ruud-global-progress");

    const playButton =
        document.getElementById("ruud-global-play");
        const buyButton =
    document.getElementById("ruud-buy-button");

const licenseDrawer =
    document.getElementById("ruud-license-drawer");

    const cards =
        document.querySelectorAll(".ruud-player");

    function buildTrack(card) {

        return {

    id: card.dataset.productId,

    title: card.dataset.title,

    audio: card.dataset.audio,

    image: card.dataset.image,

    productUrl: card.dataset.productUrl,

    bpm: card.dataset.bpm,

    key: card.dataset.key,

    mood: card.dataset.mood,

    type: card.dataset.type,

    variants: JSON.parse(
        card.dataset.variants || "[]"
    )

};

    }

    document.addEventListener("click", function (event) {

    console.log("CLICK");

    const button = event.target.closest(".ruud-play-button");

    if (!button) return;

    console.log("BUTTON");

    event.preventDefault();

    const card = button.closest(".ruud-player");

    if (!card) return;

    console.log("CARD", card);

    const cards = Array.from(
        document.querySelectorAll(".ruud-player")
    );

    console.log("TRACKS", cards.length);

    const index = cards.indexOf(card);

    const track = buildTrack(card);

    console.log("TRACK", track);

    ArchiveOS.set("queue", cards.map(buildTrack));
    ArchiveOS.set("currentIndex", index);

    ArchiveOS.player.load(track);
    ArchiveOS.player.play();

});

    ArchiveOS.on(
        "archive:trackchange",
        function (event) {

            const track =
                event.detail.track;

            if (player)
                player.classList.remove(
                    "ruud-global-player--hidden"
                );

            if (title)
                title.textContent =
                    track.title || "";
                    const buyButton =
    document.getElementById("ruud-buy-button");

if (buyButton) {

    buyButton.addEventListener("click", function (event) {

        event.preventDefault();

        player.classList.toggle(
            "archive-mode-commerce"
        );

    });

}

            if (
                artwork &&
                track.image
            ) {

                artwork.src =
                    track.image;

                artwork.alt =
                    track.title;

            }

        }
    );

    ArchiveOS.on(
        "archive:timeupdate",
        function (event) {

            if (!progress) return;

            const current =
                event.detail.currentTime;

            const duration =
                event.detail.duration;

            if (!duration) return;

            progress.value =
                (current / duration) * 100;

        }
    );

    ArchiveOS.on(
        "archive:play",
        function () {

            if (playButton)
                playButton.textContent = "❚❚";

        }
    );

    ArchiveOS.on(
        "archive:pause",
        function () {

            if (playButton)
                playButton.textContent = "▶";

        }
    );

    if (playButton) {

        playButton.addEventListener(
            "click",
            function () {

                if (
                    ArchiveOS.get("playing")
                ) {

                    ArchiveOS.player.pause();

                } else {

                    ArchiveOS.player.play();

                }

            }
        );

    }

    console.log(
        "Archive UI v2.0 Loaded"
    );
    if (buyButton && licenseDrawer) {

    buyButton.addEventListener("click", function (event) {

        event.preventDefault();

        licenseDrawer.classList.toggle("is-open");

    });

}

})();