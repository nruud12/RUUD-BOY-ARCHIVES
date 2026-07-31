/* ==========================================================
   ArchiveOS Timeline
   Version: 1.0.0

   Sole responsibility:
   - Timeline rendering
   - Time formatting
   - Timeline interaction
========================================================== */

(function () {

    if (!window.ArchiveOS) {
        console.error("ArchiveOS Core missing.");
        return;
    }

    ArchiveOS.timeline = {
         dragging: false,
         boundMouseMove: null,

boundMouseUp: null,

        progressTrack:
            document.getElementById(
                "ruud-progress-track"
            ),

        progressFill:
            document.getElementById(
                "ruud-progress-fill"
            ),

        progressThumb:
            document.getElementById(
                "ruud-progress-thumb"
            ),

        currentTime:
            document.getElementById(
                "ruud-current-time"
            ),

        duration:
            document.getElementById(
                "ruud-duration"
            ),

        formatTime(seconds) {

            seconds = Math.floor(seconds || 0);

            const minutes =
                Math.floor(seconds / 60);

            const remaining =
                (seconds % 60)
                    .toString()
                    .padStart(2, "0");

            return `${minutes}:${remaining}`;

        },

        render(current, duration) {


    if (!duration) return;

    const percent =
        (current / duration) * 100;

            if (this.progressFill) {

                this.progressFill.style.width =
                    `${percent}%`;

            }

            if (this.progressThumb) {

                this.progressThumb.style.left =
                    `${percent}%`;

            }

            this.updateTime(
                current,
                duration
            );

        },
        

        updateTime(current, duration) {

            if (this.currentTime) {

                this.currentTime.textContent =
                    this.formatTime(current);

            }

            if (this.duration) {

                this.duration.textContent =
                    this.formatTime(duration);

            }

        },
        seekFromPointer(clientX) {

    if (!this.progressTrack) return;

    const rect =
        this.progressTrack.getBoundingClientRect();

    const percent = Math.max(
        0,
        Math.min(
            1,
            (clientX - rect.left) / rect.width
        )
    );

    ArchiveOS.player.seek(
        percent *
        ArchiveOS.player.getDuration()
    );

},

        bind() {

            if (!this.progressTrack) return;

            this.progressTrack.addEventListener(
                "click",
                (event) => {

                    this.seekFromPointer(
    event.clientX
);
this.progressTrack.addEventListener(
    "mousedown",
    (event) => {

        this.dragging = true;
        document.body.classList.add(
    "archive-dragging"
);
        if (this.progressThumb) {

    this.progressThumb.classList.add(
        "dragging"
    );

}

        this.seekFromPointer(
            event.clientX
        );

    }
);
this.boundMouseMove = (event) => {

    if (!this.dragging) return;

    this.seekFromPointer(
        event.clientX
    );

};

document.addEventListener(
    "mousemove",
    this.boundMouseMove
);
this.boundMouseUp = () => {
    if (this.progressThumb) {

    this.progressThumb.classList.remove(
        "dragging"
    );

}

    this.dragging = false;
    document.body.classList.remove(
    "archive-dragging"
);

};

document.addEventListener(
    "mouseup",
    this.boundMouseUp
);

                }
            );

        },

        init() {

            this.bind();

        }

    };

    ArchiveOS.timeline.init();

})();