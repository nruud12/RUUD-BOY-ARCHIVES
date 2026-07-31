/* ==========================================================
   ArchiveOS History
   Version 1.0

   Owns:
   ✓ Listening history
   ✓ Session memory
   ✓ localStorage

   Does NOT own:
   ✗ UI
   ✗ Player
   ✗ Commerce
========================================================== */

(function () {

    if (!window.ArchiveOS) {
        console.error(
            "ArchiveOS Core missing."
        );
        return;
    }

    ArchiveOS.memory = {

    history: [],

    saveTimer: null,

    currentTrack: null,

    init() {

    console.log(
        "Archive Memory Loaded"
    );

    this.bindEvents();

},

bindEvents() {

    ArchiveOS.on(
        "archive:trackchange",
        (event) => {

            this.onTrackChange(
                event.detail.track
            );

        }
    );

},

onTrackChange(track) {

    console.log(
        "Memory tracking:",
        track.title
    );

},

};

    ArchiveOS.memory.init();

})();