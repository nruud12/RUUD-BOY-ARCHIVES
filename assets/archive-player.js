/* ==========================================================
   ArchiveOS Player
========================================================== */

(function () {

    const audio = new Audio();

    ArchiveOS.audio.element = audio;

    ArchiveOS.player = {

        play() {

            audio.play();

            ArchiveOS.set("playing", true);

ArchiveOS.emit("archive:play", {

    track: ArchiveOS.get("activeTrack")

});

        },

        pause() {

            audio.pause();

            ArchiveOS.set("playing", false);

ArchiveOS.emit("archive:pause");

        },

        load(track) {

            if (!track) return;

            audio.src = track.audio;

            ArchiveOS.emit("archive:trackchange", {

    track

});

        },

        seek(seconds) {

            audio.currentTime = seconds;

        },

        next() {

            const queue =
                ArchiveOS.get("queue");

            let index =
                ArchiveOS.get("currentIndex");

            index++;

            if (index >= queue.length)
                index = 0;

            this.load(queue[index]);

            ArchiveOS.set(
                "currentIndex",
                index
            );

            this.play();

        },

        previous() {

            const queue =
                ArchiveOS.get("queue");

            let index =
                ArchiveOS.get("currentIndex");

            index--;

            if (index < 0)
                index = queue.length - 1;

            this.load(queue[index]);

            ArchiveOS.set(
                "currentIndex",
                index
            );

            this.play();

        }

    };

    console.log(
        "Archive Player Loaded"
    );

})();