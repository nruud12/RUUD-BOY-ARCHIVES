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

        /**
         * @param {object} track
         * @param {object} [options]
         * @param {boolean} [options.seated] True when this is a page
         *   DECLARING the artifact it displays, rather than a visitor
         *   changing it. Views use this to tell a seating apart from an
         *   exchange — the case must not perform its exchange for an
         *   artifact the page already rendered.
         *
         *   Carried on the event because only the caller knows which
         *   this is. A view cannot infer it without remembering what it
         *   drew, and remembering is what the artifact-state rule
         *   forbids.
         */
        load(track, options) {

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
                track,
                seated: Boolean(options && options.seated)
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

        /* -------------------------------------------------------
           Volume

           Core already carried `volume` and `muted` in state but
           nothing ever wrote to them. These are the writers.

           Volume is stored unmuted, so unmuting restores the level
           the visitor chose rather than jumping to 1.
        ------------------------------------------------------- */

        setVolume(value) {

            const clamped = Math.min(1, Math.max(0, Number(value) || 0));

            audio.volume = clamped;

            ArchiveOS.set("volume", clamped);

            // Moving the slider off zero is an implicit unmute.
            if (clamped > 0 && audio.muted) {
                audio.muted = false;
                ArchiveOS.set("muted", false);
            }

            ArchiveOS.emit("archive:volumechange", {
                volume: clamped,
                muted: audio.muted
            });

        },

        getVolume() {

            return audio.volume;

        },

        toggleMute() {

            audio.muted = !audio.muted;

            ArchiveOS.set("muted", audio.muted);

            ArchiveOS.emit("archive:volumechange", {
                volume: audio.volume,
                muted: audio.muted
            });

        },

        isMuted() {

            return audio.muted;

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