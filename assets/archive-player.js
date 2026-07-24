document.addEventListener("DOMContentLoaded", () => {

    console.log("ArchiveOS initialized");

    function updateCards() {

    console.log("ArchiveOS State:", window.ArchiveOS);

    if (!window.ArchiveOS) return;

    document
        .querySelectorAll("[data-archive-card]")
        .forEach(card => card.dataset.state = "idle");

    if (!window.ArchiveOS.isPlaying) {
        console.log("Not playing");
        return;
    }

    const selector =
        `[data-product-id="${window.ArchiveOS.activeProductId}"][data-archive-card]`;

    console.log("Selector:", selector);

    const card = document.querySelector(selector);

    console.log("Found card:", card);

    if (card) {

        card.dataset.state = "playing";

        console.log("Playing state applied");

    }

}

    setInterval(updateCards, 100);

});