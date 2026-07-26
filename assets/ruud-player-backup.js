document.addEventListener("DOMContentLoaded", () => {

    // =====================================================
    // DOM REFERENCES
    // =====================================================

    const globalPlayer = document.getElementById("ruud-global-player");
    const globalAudio = document.getElementById("ruud-global-audio");

    const globalTitle = document.getElementById("ruud-global-title");
    const globalImage = document.getElementById("ruud-global-image");

    const playButton = document.getElementById("ruud-global-play");
    const prevButton = document.getElementById("ruud-global-prev");
    const nextButton = document.getElementById("ruud-global-next");

    const buyButton = document.getElementById("ruud-buy-button");

    const progress = document.getElementById("ruud-global-progress");
    const progressTrack = document.getElementById("ruud-progress-track");

    const currentTime = document.getElementById("ruud-current-time");
    const duration = document.getElementById("ruud-duration");

    const playerStatus =
        document.getElementById("ruud-player-status");

    const queuePosition =
        document.getElementById("ruud-queue-position");

    const upNext =
        document.querySelector("#ruud-up-next span");



    // =====================================================
    // GLOBAL STATE
    // =====================================================

    const cards = Array.from(
        document.querySelectorAll(".ruud-player")
    );

    let currentCard = null;

    const currentTrack = {

        audio: "",
        title: "",
        image: "",
        productId: "",
        productUrl: "",
        variants: []

    };



    window.ArchiveOS = window.ArchiveOS || {};

    Object.assign(window.ArchiveOS, {

        activePlayer: null,
        activeProductId: null,
        isPlaying: false

    });



    // =====================================================
    // PLAYER MODES
    // =====================================================

    function setArchiveMode(mode){

        globalPlayer.classList.remove(
            "archive-mode-listen",
            "archive-mode-commerce"
        );

        globalPlayer.classList.add(

            mode === "commerce"

                ? "archive-mode-commerce"

                : "archive-mode-listen"

        );

    }

    setArchiveMode("listen");



    // =====================================================
    // PLAYER STATUS
    // =====================================================

    function setPlayerStatus(text){

        if(!playerStatus) return;

        playerStatus.style.opacity = "0";

        setTimeout(()=>{

            playerStatus.textContent = text;

            playerStatus.style.opacity = "1";

        },150);

    }



    // =====================================================
    // BUTTON HELPERS
    // =====================================================

    function updatePlayButton(isPlaying){

        playButton.innerHTML =
            isPlaying ? "❚❚" : "▶";

        playButton.classList.toggle(
            "is-playing",
            isPlaying
        );

    }



    function updateCardButton(card,state="preview"){

        if(!card) return;

        const button =
            card.querySelector(".ruud-play-button");

        const footer =
            card.querySelector(".archive-card-footer");

        const icon =
            button?.querySelector(".ruud-play-icon");

        const label =
            button?.querySelector(".ruud-play-label");

        if(!button) return;



        button.classList.remove("is-playing");



        switch(state){

            case "playing":

                button.classList.add("is-playing");

                if(icon) icon.textContent="❚❚";
                if(label) label.textContent="Playing";

                if(footer)
                    footer.textContent="NOW PLAYING";

                break;



            case "paused":

                if(icon) icon.textContent="▶";
                if(label) label.textContent="Resume";

                if(footer)
                    footer.textContent="READY TO RESUME";

                break;



            default:

                if(icon) icon.textContent="▶";
                if(label) label.textContent="Preview";

                if(footer)
                    footer.textContent=
                        "4 LICENSE OPTIONS AVAILABLE";

        }

    }



    // =====================================================
    // SESSION
    // =====================================================

    function savePlayerState(){

        sessionStorage.setItem(

            "ruud-player",

            JSON.stringify({

                track:currentTrack.audio,

                title:currentTrack.title,

                artwork:currentTrack.image,

                time:globalAudio.currentTime,

                playing:!globalAudio.paused

            })

        );

    }

  function loadTrack(card) {

    if (!card) return;

    globalPlayer.classList.add("is-transitioning");

    setTimeout(() => {

        globalPlayer.classList.remove("is-transitioning");

    }, 220);


    // -------------------------
    // Track Data
    // -------------------------

    currentTrack.audio = card.dataset.audio || "";
    currentTrack.title = card.dataset.title || "";
    currentTrack.image = card.dataset.image || "";
    currentTrack.productId = card.dataset.productId || "";
    try {

    currentTrack.variants =
        JSON.parse(card.dataset.variants || "[]");

} catch {

    currentTrack.variants = [];

}
    


    // -------------------------
    // Product URL
    // -------------------------

    const productCard =
        card.closest("[data-archive-card]");

    if (productCard) {

        const link =
            productCard.querySelector("a[href]");

        currentTrack.productUrl =
            link ? link.href : "";

    } else {

        currentTrack.productUrl = "";

    }


    // -------------------------
    // Queue UI
    // -------------------------

    const index = cards.indexOf(card);

    if (queuePosition) {

        queuePosition.textContent =
            `${index + 1} / ${cards.length}`;

    }

    if (upNext) {

        upNext.textContent =

            index < cards.length - 1

                ? cards[index + 1].dataset.title

                : "Session Complete";

    }


    // -------------------------
    // Global Player
    // -------------------------

    globalPlayer.classList.remove(
        "ruud-global-player--hidden"
    );

    globalTitle.textContent =
        currentTrack.title;

    if (globalImage && currentTrack.image) {

        globalImage.src =
            currentTrack.image;

        globalImage.alt =
            currentTrack.title;

    }


    // -------------------------
    // Card State
    // -------------------------

    if (
        currentCard &&
        currentCard !== card
    ) {

        updateCardButton(
            currentCard,
            "preview"
        );

    }

    currentCard = card;


    // -------------------------
    // Audio
    // -------------------------

    globalAudio.src =
        currentTrack.audio;

    globalAudio.load();
    


    // -------------------------
    // UI Refresh
    // -------------------------

    updateSessionUI();
    renderLicenseDrawer();

}
  function updateSessionUI() {

    if (!currentCard) return;

    const upNext =
        document.querySelector("#ruud-up-next span");

    const queuePosition =
        document.getElementById("ruud-queue-position");

    const index =
        cards.indexOf(currentCard);

    const total =
        cards.length;

    // Queue position

    if (queuePosition) {

        queuePosition.textContent =
            `${index + 1} / ${total}`;
            const buyButton =
    document.getElementById("ruud-buy-button");

if (buyButton) {

    const productCard =
        currentCard.closest("[data-archive-card]");

    if (buyButton) {

    buyButton.href =
        currentTrack.productUrl || "#";

    buyButton.textContent =
        `BUY ${currentTrack.title}`;
}
function renderLicenseDrawer() {

    const container =
        document.getElementById("archive-license-list");

    if (!container) return;

    container.innerHTML = "";

    if (!currentTrack.variants.length) {

        container.innerHTML = `
            <div class="ruud-license-empty">
                No licenses available.
            </div>
        `;

        return;

    }

    currentTrack.variants.forEach((variant) => {

        const button =
            document.createElement("button");

        button.className =
            "ruud-license-option";

        button.dataset.variantId =
            variant.id;

        const price =
            (variant.price / 100).toLocaleString(
                "en-US",
                {
                    style: "currency",
                    currency: "USD"
                }
            );

        button.innerHTML = `
            <div class="license-title">
                ${variant.public_title || variant.name || "License"}
            </div>

            <div class="license-price">
                ${price}
            </div>
        `;

        container.appendChild(button);

    });

}


}

    }

    // Up Next

    if (upNext) {

        if (index < total - 1) {

            upNext.textContent =
                cards[index + 1].dataset.title;

        } else {

            upNext.textContent =
                "End of Session";

        }

    }

}
function dispatchArchiveState(playing) {
  document.dispatchEvent(
    new CustomEvent("archive:statechange", {
      detail: {
        playing,
        track: {
          id: currentCard?.closest("[data-archive-card]")?.dataset.productId,
          title: currentCard?.dataset.title,
          audio: currentCard?.dataset.audio,
          image: currentCard?.dataset.image
        },
        card: currentCard
      }
    })
  );
}
function updateBass() {

    // Bass visualization temporarily disabled
    // Will be rebuilt during ArchiveOS RC1.

}
 function play() {

    if (!currentCard) return;

    setPlayerStatus("NOW ACCESSING...");

    setTimeout(() => {
        setPlayerStatus("AUTHENTICATING...");
    }, 250);

    setTimeout(() => {
        setPlayerStatus("ARCHIVE ONLINE");
    }, 500);

    setTimeout(() => {
        setPlayerStatus("NOW PLAYING");
    }, 800);

    globalAudio.play();

    window.ArchiveOS.isPlaying = true;

    updatePlayButton(true);

    updateCardButton(
        currentCard,
        "playing"
    );

    savePlayerState();

    // updateBass();

}

  function pause() {

    globalAudio.pause();

    window.ArchiveOS.isPlaying = false;

    updatePlayButton(false);

    updateCardButton(
        currentCard,
        "paused"
    );

    setPlayerStatus("PAUSED");

    savePlayerState();

}

  document.querySelectorAll(".ruud-player").forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();

      const audio = card.dataset.audio;
window.ArchiveOS.activePlayer = card;
window.ArchiveOS.activeProductId = card.dataset.productId;
console.log(window.ArchiveOS);
      // Same track
      if (audio === currentTrack.audio) {
        if (globalAudio.paused) {
          play();
        } else {
          pause();
        }
        return;
      }

      // New track
      loadTrack(card);
      play();
    });
  });

  playButton.addEventListener("click", () => {
    if (!currentTrack) return;

    if (globalAudio.paused) {
      play();
    } else {
      pause();
    }
    });
    prevButton.addEventListener("click", () => {

    if (!currentCard) return;

    const index = cards.indexOf(currentCard);

    if (index <= 0) return;

    loadTrack(cards[index - 1]);

    play();

  });
  nextButton.addEventListener("click", () => {

    if (!currentCard) return;

    const index = cards.indexOf(currentCard);

    if (index >= cards.length - 1) return;

    loadTrack(cards[index + 1]);

    play();

});

  globalAudio.addEventListener("ended", () => {

    updatePlayButton(false);

playButton.classList.remove("is-playing");

    updateCardButton(currentCard, "preview");

    const index = cards.indexOf(currentCard);

    // More beats available
    if (index < cards.length - 1) {

        setPlayerStatus("LOADING NEXT ARCHIVE...");

        setTimeout(() => {

            loadTrack(cards[index + 1]);

            play();

        }, 900);

        return;

    }

    // End of queue
    window.ArchiveOS.isPlaying = false;

    setPlayerStatus("SESSION COMPLETE");

});
  
  globalAudio.addEventListener("loadedmetadata", () => {

  duration.textContent = format(globalAudio.duration);

});

globalAudio.addEventListener("timeupdate", () => {

  currentTime.textContent = format(globalAudio.currentTime);

  progress.value =
    (globalAudio.currentTime / globalAudio.duration) * 100 || 0;

  const progressFill =
    document.getElementById("ruud-progress-fill");

  progressFill.style.width = progress.value + "%";
  savePlayerState();

});

progress.addEventListener("input", () => {

  if (!globalAudio.duration) return;

  globalAudio.currentTime =
    (progress.value / 100) * globalAudio.duration;

});


progressTrack.addEventListener("click",(e)=>{

    const rect =
        progressTrack.getBoundingClientRect();

    const percent =
        (e.clientX-rect.left)/rect.width;

    progress.value = percent*100;

    progress.dispatchEvent(
        new Event("input")
    );

});
if (buyButton) {

    buyButton.addEventListener("click", (event) => {

    event.preventDefault();

    const commerceMode =
        globalPlayer.classList.contains(
            "archive-mode-commerce"
        );

    setArchiveMode(
        commerceMode ? "listen" : "commerce"
    );

});

}
function format(seconds){

  const minutes = Math.floor(seconds / 60);

  const secs = Math.floor(seconds % 60);

  return `${minutes}:${String(secs).padStart(2,"0")}`;

}

});
