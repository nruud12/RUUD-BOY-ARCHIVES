document.addEventListener("DOMContentLoaded", () => {
  const globalPlayer = document.getElementById("ruud-global-player");
  const globalAudio = document.getElementById("ruud-global-audio");
  window.globalAudio = globalAudio;
  // ==========================================
// ARCHIVE AUDIO ENGINE
// ==========================================


  const globalTitle = document.getElementById("ruud-global-title");
  const globalImage = document.getElementById("ruud-global-image");
  const playButton = document.getElementById("ruud-global-play");
  const prevButton =
    document.getElementById("ruud-global-prev");

const nextButton =
    document.getElementById("ruud-global-next");
const progress = document.getElementById("ruud-global-progress");
const currentTime = document.getElementById("ruud-current-time");
const duration = document.getElementById("ruud-duration");
const progressTrack = document.getElementById("ruud-progress-track");
  let currentCard = null;
  let currentTrack = "";
  window.ArchiveOS = {
    activePlayer: null,
    activeProductId: null,
    isPlaying: false
};
  const cards = Array.from(
  document.querySelectorAll(".ruud-player")
);
  function savePlayerState(){

  sessionStorage.setItem(
    "ruud-player",

    JSON.stringify({

      track:currentTrack,

      title:globalTitle.textContent,

      artwork:globalImage.src,

      time:globalAudio.currentTime,

      playing:!globalAudio.paused

    })

  );

}

  function updateCardButton(card, playing) {
    if (!card) return;

    const button = card.querySelector(".ruud-play-button");
    if (!button) return;

    button.textContent = playing ? "❚❚ Playing" : "▶ Preview";
  }

  function loadTrack(card) {
    const title = card.dataset.title;
    const audio = card.dataset.audio;
    const image = card.dataset.image;

    globalPlayer.classList.remove("ruud-global-player--hidden");

    globalTitle.textContent = title;

    if (globalImage && image) {
      globalImage.src = image;
      globalImage.alt = title;
    }

    if (currentCard && currentCard !== card) {
      updateCardButton(currentCard, false);
    }

    currentCard = card;
    currentTrack = audio;

    globalAudio.src = audio;
    globalAudio.load();
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
 function play() {
  globalAudio.play();

function updateBass() {

    if (!archiveAudio.analyser) return;

    archiveAudio.analyser.getByteFrequencyData(
        archiveAudio.data
    );

    let sum = 0;

    // Average the first 6 frequency bins (~20–120Hz)
    for (let i = 0; i < 6; i++) {

        sum += archiveAudio.data[i];

    }

    archiveAudio.bass = sum / 6 / 255;
    // Smooth the bass value
archiveAudio.bass +=
    ((sum / 6 / 255) - archiveAudio.bass) * 0.18;

// Calculate values for CSS
const scale =
    1 + archiveAudio.bass * 0.025;

const glow =
    18 + archiveAudio.bass * 55;

// Send finished values to CSS
document.documentElement.style.setProperty(
    "--archive-scale",
    scale
);

document.documentElement.style.setProperty(
    "--archive-glow",
    glow + "px"
);

    requestAnimationFrame(updateBass);

}
  window.ArchiveOS.isPlaying = true;
  console.trace("PLAY()");
  playButton.textContent = "❚❚";
  playButton.classList.add("is-playing");
  updateCardButton(currentCard, true);
  savePlayerState();
}

  function pause() {
  globalAudio.pause();
  window.ArchiveOS.isPlaying = false;
  console.log("PAUSE()", window.ArchiveOS);
  playButton.textContent = "▶";
  playButton.classList.remove("is-playing");
  updateCardButton(currentCard, false);
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
      if (audio === currentTrack) {
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
  playButton.textContent = "▶";
  playButton.classList.remove("is-playing");
  updateCardButton(currentCard, false);
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
function format(seconds){

  const minutes = Math.floor(seconds / 60);

  const secs = Math.floor(seconds % 60);

  return `${minutes}:${String(secs).padStart(2,"0")}`;

}

});