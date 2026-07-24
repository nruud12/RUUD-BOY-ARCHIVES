window.ArchiveSession = {
    queue: [],
    currentIndex: -1
};
function buildQueue() {

    const cards = [
        ...document.querySelectorAll("[data-archive-card]")
    ];

    window.ArchiveSession.queue = cards.map(card => ({

        productId: card.dataset.productId,

        button: card.querySelector(".ruud-play-button")

    }));

}
document.addEventListener("DOMContentLoaded", () => {

    
    console.log("ArchiveOS initialized");
    buildQueue();

console.log(window.ArchiveSession);
    

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

    window.addEventListener(
    "archive:trackchange",
    updateCards
);

window.addEventListener(
    "archive:playstate",
    updateCards
);

updateCards();

});
