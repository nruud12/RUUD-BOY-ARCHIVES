/* ==========================================================
   ArchiveOS UI
   Version: 3.1.0

   Owns:
   ✓ Preview buttons
   ✓ Global player UI
   ✓ Drawer state
   ✓ Progress updates

   Does NOT own:
   ✗ Commerce
   ✗ Audio engine
========================================================== */

(function () {

    if (!window.ArchiveOS) {
        console.error("ArchiveOS Core missing.");
        return;
    }

    ArchiveOS.ui = {
        currentTime:
    document.getElementById(
        "ruud-current-time"
    ),

duration:
    document.getElementById(
        "ruud-duration"
    ),
        prevButton:
    document.getElementById(
        "ruud-global-prev"
    ),

nextButton:
    document.getElementById(
        "ruud-global-next"
    ),

        player:
            document.getElementById(
                "ruud-global-player"
            ),

        title:
            document.getElementById(
                "ruud-global-title"
            ),

        artwork:
            document.getElementById(
                "ruud-global-image"
            ),

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

        playButton:
            document.getElementById(
                "ruud-global-play"
            ),

        buyButton:
            document.getElementById(
                "ruud-buy-button"
            ),

        licenseDrawer:
            document.getElementById(
                "ruud-license-drawer"
            ),

        buildTrack(card) {

            return {

                id:
                    card.dataset.productId,

                title:
                    card.dataset.title,

                audio:
                    card.dataset.audio,

                image:
                    card.dataset.image,

                productUrl:
                    card.dataset.productUrl,

                bpm:
                    card.dataset.bpm,

                key:
                    card.dataset.key,

                mood:
                    card.dataset.mood,

                type:
                    card.dataset.type,

                variants:
                    JSON.parse(
                        card.dataset.variants ||
                        "[]"
                    )

            };

        },

        bindPreview() {

            document.addEventListener(
                "click",
                (event) => {

                    const button =
                        event.target.closest(
                            ".ruud-play-button"
                        );

                    if (!button) return;

                    event.preventDefault();

                    const card =
                        button.closest(
                            ".ruud-player"
                        );

                    if (!card) return;

                    const cards =
                        Array.from(
                            document.querySelectorAll(
                                ".ruud-player"
                            )
                        );

                    const index =
                        cards.indexOf(card);

                    const track =
                        this.buildTrack(card);

                    ArchiveOS.set(
                        "queue",
                        cards.map(card =>
                            this.buildTrack(card)
                        )
                    );

                    ArchiveOS.set(
                        "currentIndex",
                        index
                    );

                    ArchiveOS.player.load(
                        track
                    );

                    ArchiveOS.player.play();

                }
            );

        },
                updateTrack(track) {

            if (this.player) {

                this.player.classList.remove(
                    "ruud-global-player--hidden"
                );

            }

            if (this.title) {

                this.title.textContent =
                    track.title || "";

            }

            if (
                this.artwork &&
                track.image
            ) {

                this.artwork.src =
                    track.image;

                this.artwork.alt =
                    track.title;

            }

            if (ArchiveOS.commerce) {

                ArchiveOS.commerce.renderLicenses();

            }

        },

        updateProgress(current, duration) {

    ArchiveOS.timeline.render(
        current,
        duration
    );

},
formatTime(seconds) {

    const minutes =
        Math.floor(seconds / 60);

    const remaining =
        Math.floor(seconds % 60)
            .toString()
            .padStart(2, "0");

    return `${minutes}:${remaining}`;

},

updateTime(current, duration) {

    const currentTime =
        document.getElementById(
            "ruud-current-time"
        );

    const totalTime =
        document.getElementById(
            "ruud-duration"
        );

    if (currentTime) {

        currentTime.textContent =
            this.formatTime(current);

    }

    if (totalTime) {

        totalTime.textContent =
            this.formatTime(duration);

    }

},

        bindPlayerEvents() {

            ArchiveOS.on(
                "archive:trackchange",
                (event) => {

                    this.updateTrack(
                        event.detail.track
                    );

                }
            );

            ArchiveOS.on(
                "archive:timeupdate",
                (event) => {

                    this.updateProgress(
                        event.detail.currentTime,
                        event.detail.duration
                    );

                }
            );

            ArchiveOS.on(
                "archive:play",
                () => {

                    if (
                        this.playButton
                    ) {

                        this.playButton.textContent =
                            "❚❚";

                    }
                    

                }
            );

            ArchiveOS.on(
                "archive:pause",
                () => {

                    if (
                        this.playButton
                    ) {

                        this.playButton.textContent =
                            "▶";

                    }

                }
            );


        },
        bindTransport() {

    if (this.playButton) {

        this.playButton.addEventListener(
            "click",
            () => {

                if (
                    ArchiveOS.get("playing")
                ) {

                    ArchiveOS.player.pause();

                } else {

                    ArchiveOS.player.play();

                }

            }
        );

    }

    if (this.prevButton) {

        this.prevButton.addEventListener(
            "click",
            () => {

                ArchiveOS.player.previous();

            }
        );

    }

    if (this.nextButton) {

        this.nextButton.addEventListener(
            "click",
            () => {

                ArchiveOS.player.next();

            }
        );

    }

    if (this.progress) {

    this.progress.addEventListener(
    "input",
    () => {

        console.log("SCRUB!", this.progress.value);

        const duration =
            ArchiveOS.player.getDuration();

        const seconds =
            (this.progress.value / 100) * duration;

        console.log("Seeking to", seconds);

        ArchiveOS.player.seek(seconds);

    }
);

}
if (this.progressTrack) {

    this.progressTrack.addEventListener(
        "click",
        (event) => {

            const rect =
                this.progressTrack.getBoundingClientRect();

            const percent = Math.max(
    0,
    Math.min(
        1,
        (event.clientX - rect.left) / rect.width
    )
);

            const duration =
                ArchiveOS.player.getDuration();

            ArchiveOS.player.seek(
                percent * duration
            );

        }
    );

}

},


                bindDrawer() {

            if (
                !this.buyButton ||
                !this.licenseDrawer
            ) {
                return;
            }

            this.buyButton.addEventListener(
                "click",
                (event) => {

                    event.preventDefault();

                    ArchiveOS.set(
    "playerMode",
    ArchiveOS.get("playerMode") === "purchase"
        ? "listen"
        : "purchase"
);


ArchiveOS.commerce.toggle();

                }
            );

        },

        init() {

    this.bindPreview();

    this.bindTransport();

    this.bindDrawer();

    this.bindPlayerEvents();

}

    };

    ArchiveOS.ui.init();
    })();