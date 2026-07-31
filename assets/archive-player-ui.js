/* ==========================================================
   ArchiveOS Player UI v2.0

   Sole responsibility:
   - Render player state
   - Update artwork
   - Update metadata
   - Render progress
   - Update controls

   Never:
   - Play audio
   - Manage queue
   - Store state
========================================================== */

(function () {

    if (!window.ArchiveOS) return;

    const ui = {

        title:
            document.getElementById("ruud-global-title"),

        archive:
            document.getElementById("ruud-archive-number"),

        bpm:
            document.getElementById("ruud-meta-bpm"),

        key:
            document.getElementById("ruud-meta-key"),

        mood:
            document.getElementById("ruud-meta-mood"),

        type:
            document.getElementById("ruud-meta-type"),

        artwork:
            document.getElementById("ruud-global-image")

    };

})();

ArchiveOS.on("archive:trackchange", ({ track }) => {

    if (!track) return;

    ui.title.textContent =
        track.title;

    ui.archive.textContent =
        `ARCHIVE ${track.archive}`;

    ui.bpm.textContent =
        `${track.bpm} BPM`;

    ui.key.textContent =
        track.key;

    ui.mood.textContent =
        track.mood;

    ui.type.textContent =
        track.type;

    ui.artwork.src =
        track.artwork;

});
ArchiveOS.on("archive:play", () => {

    ui.status.textContent =
        "NOW PLAYING";

    ui.playButton.classList.add(
        "is-playing"
    );

});
ArchiveOS.on("archive:pause", () => {

    ui.status.textContent =
        "PAUSED";

    ui.playButton.classList.remove(
        "is-playing"
    );

});
ArchiveOS.on("archive:timeupdate", ({ currentTime, duration }) => {

    if (!duration) return;

    const percent =
        currentTime / duration * 100;

    ui.progress.style.width =
        `${percent}%`;

});