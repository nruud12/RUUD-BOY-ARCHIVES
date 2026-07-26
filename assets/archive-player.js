/* ==========================================================
   ArchiveOS Player v2.0
   Sole responsibility:
   - Audio playback
   - Queue navigation
   - Playback events
========================================================== */

(function () {

    if (!window.ArchiveOS) {
        console.error("ArchiveOS Core missing.");
        return;
    }

    const audio =
        document.getElementById("ruud-global-audio");

    if (!audio) {
        console.error(
            "#ruud-global-audio not found."
        );
        return;
    }

    ArchiveOS.audio.element = audio;

    ArchiveOS.player = {

        load(track) {

            if (!track) return;

            audio.src = track.audio || "";

            ArchiveOS.set(
                "activeTrack",
                track
            );

            ArchiveOS.emit(
                "archive:trackchange",
                { track }
            );

        },

        play() {

            audio.play();

            ArchiveOS.set(
                "playing",
                true
            );

            ArchiveOS.emit(
                "archive:play",
                {
                    track:
                        ArchiveOS.get(
                            "activeTrack"
                        )
                }
            );

        },

        pause() {

            audio.pause();

            ArchiveOS.set(
                "playing",
                false
            );

            ArchiveOS.emit(
                "archive:pause"
            );

        },

        seek(seconds) {

            audio.currentTime = seconds;

        },

        next() {

            const queue =
                ArchiveOS.get("queue");

            if (!queue.length) return;

            let index =
                ArchiveOS.get("currentIndex");

            index++;

            if (index >= queue.length)
                index = 0;

            ArchiveOS.set(
                "currentIndex",
                index
            );

            this.load(
                queue[index]
            );

            this.play();

        },

        previous() {

            const queue =
                ArchiveOS.get("queue");

            if (!queue.length) return;

            let index =
                ArchiveOS.get("currentIndex");

            index--;

            if (index < 0)
                index =
                    queue.length - 1;

            ArchiveOS.set(
                "currentIndex",
                index
            );

            this.load(
                queue[index]
            );

            this.play();

        }

    };

    audio.addEventListener(
        "timeupdate",
        () => {

            ArchiveOS.emit(
                "archive:timeupdate",
                {
                    currentTime:
                        audio.currentTime,
                    duration:
                        audio.duration
                }
            );

        }
    );

    audio.addEventListener(
        "ended",
        () => {

            ArchiveOS.emit(
                "archive:ended"
            );

            ArchiveOS.player.next();

        }
    );

    console.log(
        "Archive Player v2.0 Loaded"
    );

})();