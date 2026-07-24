/* ==========================================================
   ArchiveOS
   Version: 0.4.0

   Core Bootstrap
   ----------------------------------------------------------
   Initializes the ArchiveOS namespace.

   Built for RUUD BOY ARCHIVES
========================================================== */

(() => {

    if (window.ArchiveOS) return;

    window.ArchiveOS = {

        version: "0.4.0",

        audio: {},

        visual: {},

        player: {},

        ui: {},

        effects: {},

        debug: true

    };

    if (ArchiveOS.debug) {

        console.log(
            `%cArchiveOS ${ArchiveOS.version}`,
            "color:#ff00ff;font-weight:bold;"
        );

    }

})();