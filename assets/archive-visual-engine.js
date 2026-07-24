(function () {

    function updateVisuals() {

        if (!window.ArchiveEngine || !ArchiveEngine.started) {
            requestAnimationFrame(updateVisuals);
            return;
        }

        //
        // Global Player Artwork
        //

        const artwork =
            document.querySelector(".ruud-player-artwork img");

        if (artwork) {

            const bass = Math.max(
                ArchiveEngine.frequency.sub,
                ArchiveEngine.frequency.kick
            );

            const scale = 1 + bass * 0.09;
            const glow = 18 + bass * 30;

            artwork.style.setProperty(
                "--artwork-scale",
                scale.toFixed(3)
            );

            artwork.style.setProperty(
                "--artwork-glow",
                `${glow}px`
            );
        }
        //
// Player Aura
//

const player =
    document.getElementById("ruud-global-player");

if (player) {

    const energy =
        ArchiveEngine.frequency.volume;

    const opacity =
    0.16 + energy * 0.70;

    const blur =
    55 + energy * 45;

const scale =
    1 + energy * 0.12;

player.style.setProperty(
    "--player-aura-opacity",
    opacity.toFixed(3)
);

player.style.setProperty(
    "--player-aura-blur",
    `${blur}px`
);

player.style.setProperty(
    "--player-aura-scale",
    scale.toFixed(3)
);

}

        requestAnimationFrame(updateVisuals);

    }

    window.addEventListener("load", updateVisuals);

})();