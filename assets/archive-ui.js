/* ==========================================================
   ArchiveOS UI
========================================================== */

(function () {

    ArchiveOS.on(
        "archive:play",
        () => {

            console.log(
                "UI → Playing"
            );

        }
    );

    ArchiveOS.on(
        "archive:pause",
        () => {

            console.log(
                "UI → Paused"
            );

        }
    );

    ArchiveOS.on(
        "archive:trackchange",
        (event) => {

            console.log(
                "UI → Track",
                event.detail.track
            );

        }
    );

})();