/* ==========================================================
   ArchiveOS Player v2.1
   ----------------------------------------------------------
   Responsibilities
   • Load audio
   • Control playback
   • Emit playback events
   • Maintain player state

   Never:
   • Touch the DOM
   • Render UI
========================================================== */

(() => {

    const ArchiveOS = window.ArchiveOS;

    if (!ArchiveOS) {
        console.error("ArchiveOS Core missing.");
        return;
    }

    const audio = new Audio();

    const Player = {

        init() {

            console.log("ArchiveOS Player Loaded");

        },

        load(track) {

            if (!track?.audio) return;

            const current = ArchiveOS.get("currentTrack");

            if (current && current.id === track.id) {
                return;
            }

            audio.src = track.audio;
            audio.load();

            ArchiveOS.set("currentTrack", track);
            ArchiveOS.set("currentTime", 0);
            ArchiveOS.set("duration", 0);
            ArchiveOS.set("playing", false);

            ArchiveOS.emit("archive:trackchange", {
                track
            });

            ArchiveOS.emit("archive:timeupdate", {
                currentTime: 0,
                duration: 0
            });

            ArchiveOS.emit("archive:pause");

        },

        async play() {

            if (!audio.paused) return;

            try {

                await audio.play();

                ArchiveOS.set("playing", true);

                ArchiveOS.emit("archive:play");

            } catch (error) {

                console.error("Playback failed:", error);

            }

        },

        pause() {

            if (audio.paused) return;

            audio.pause();

            ArchiveOS.set("playing", false);

            ArchiveOS.emit("archive:pause");

        },

        toggle() {

            if (audio.paused) {
                this.play();
            } else {
                this.pause();
            }

        },

        seek(seconds) {

            audio.currentTime = seconds;

        },

        getDuration() {

            return audio.duration || 0;

        },

        getCurrentTime() {

            return audio.currentTime || 0;

        },

        /**
         * Exposes the underlying <audio> element.
         *
         * The vitrine needs a handle on it to attach a Web Audio
         * analyser. This is the one sanctioned escape hatch from the
         * module's encapsulation — callers may read from it and attach
         * analysis nodes, but must not call play/pause/load directly,
         * or player state will desynchronise from the UI.
         *
         * @returns {HTMLAudioElement}
         */
        getAudioElement() {

            return audio;

        }

    };

    /* -------------------------------------------------------
       Audio Events
    ------------------------------------------------------- */

    audio.addEventListener("loadedmetadata", () => {

        ArchiveOS.set("duration", audio.duration);

        ArchiveOS.emit("archive:timeupdate", {
            currentTime: audio.currentTime,
            duration: audio.duration
        });

    });

    audio.addEventListener("timeupdate", () => {

        ArchiveOS.set("currentTime", audio.currentTime);
        ArchiveOS.set("duration", audio.duration);

        ArchiveOS.emit("archive:timeupdate", {
            currentTime: audio.currentTime,
            duration: audio.duration
        });

    });

    audio.addEventListener("ended", () => {

        ArchiveOS.set("playing", false);
        ArchiveOS.set("currentTime", 0);

        ArchiveOS.emit("archive:pause");

        ArchiveOS.emit("archive:timeupdate", {
            currentTime: 0,
            duration: audio.duration
        });

        ArchiveOS.emit("archive:ended");

    });

    ArchiveOS.register("player", Player);

})();