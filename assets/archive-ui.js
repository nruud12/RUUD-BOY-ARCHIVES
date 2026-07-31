/* ==========================================================
   ArchiveOS UI v1.0
   Global Archive Console
========================================================== */

(() => {

    const ArchiveOS = window.ArchiveOS;

    if (!ArchiveOS) {
        console.error("ArchiveOS Core missing.");
        return;
    }

    const UI = {

        elements: {},

        init() {

            console.log("ArchiveOS UI Loaded");

            this.cacheElements();
            this.bindEvents();

        },

        cacheElements() {

            this.elements = {
                artwork: document.querySelector("[data-player-artwork]"),
                title: document.querySelector("[data-player-title]"),
                archive: document.querySelector("[data-player-archive]"),
                bpm: document.querySelector("[data-player-bpm]"),
                key: document.querySelector("[data-player-key]"),
                mood: document.querySelector("[data-player-mood]"),
                playButton: document.querySelector("[data-player-play]"),
                progress: document.querySelector("[data-player-progress]"),
                time: document.querySelector("[data-player-time]")
            };

        },

        bindEvents() {

            /* ----------------------------------
               Track Changed
            ---------------------------------- */

            ArchiveOS.on("archive:trackchange", (event) => {

                const { track } = event.detail || {};

                if (!track) return;

                this.updateTrack(track);

            });

            /* ----------------------------------
               Playback State
            ---------------------------------- */

            ArchiveOS.on("archive:play", () => {

                if (this.elements.playButton) {
                    this.elements.playButton.textContent = "❚❚";
                }

            });

            ArchiveOS.on("archive:pause", () => {

                if (this.elements.playButton) {
                    this.elements.playButton.textContent = "▶";
                }

            });

            /* ----------------------------------
               Progress / Time
            ---------------------------------- */

            ArchiveOS.on("archive:timeupdate", (event) => {

                const {
                    currentTime = 0,
                    duration = 0
                } = event.detail || {};

                if (this.elements.progress) {

                    this.elements.progress.value =
                        duration > 0
                            ? (currentTime / duration) * 100
                            : 0;

                }

                if (this.elements.time) {

                    this.elements.time.textContent =
                        `${this.formatTime(currentTime)} / ${this.formatTime(duration)}`;

                }

            });

            /* ----------------------------------
               Play Button
            ---------------------------------- */

            this.elements.playButton?.addEventListener("click", () => {

                const player = ArchiveOS.getModule("player");

                if (!player) return;

                player.toggle();

            });

            /* ----------------------------------
               Seek
            ---------------------------------- */

            this.elements.progress?.addEventListener("input", (event) => {

                const player = ArchiveOS.getModule("player");

                if (!player) return;

                const duration = player.getDuration();

                player.seek(
                    (event.target.value / 100) * duration
                );

            });

        },

        updateTrack(track) {

            if (this.elements.title)
                this.elements.title.textContent =
                    track.title || "Unknown";

            if (this.elements.artwork) {

                this.elements.artwork.src =
                    track.image || "";

                this.elements.artwork.alt =
                    track.title || "Artwork";

            }

            if (this.elements.archive)
                this.elements.archive.textContent =
                    track.archive || "ARCH ----";

            if (this.elements.bpm)
                this.elements.bpm.textContent =
                    track.bpm || "--";

            if (this.elements.key)
                this.elements.key.textContent =
                    track.key || "--";

            if (this.elements.mood)
                this.elements.mood.textContent =
                    track.mood || "--";

        },

        formatTime(seconds = 0) {

            if (!isFinite(seconds))
                return "0:00";

            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);

            return `${minutes}:${String(secs).padStart(2, "0")}`;

        }

    };

    ArchiveOS.register("ui", UI);

})();