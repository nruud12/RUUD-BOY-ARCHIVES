/* ==========================================================
   ArchiveOS Core
========================================================== */

(function () {

    if (window.ArchiveOS) return;

    window.ArchiveOS = {

        version: "1.0.0",

        debug: true,

        audio: {},

        visual: {},

        commerce: {},

        context: {},

        player: {},

        ui: {},

        effects: {},

       state: {

    playing: false,

    mode: "listen",

    activeProductId: null,

    activeTrack: null,

    currentTime: 0,

    duration: 0,

    volume: 1,

    muted: false,

    queue: [],

    currentIndex: -1

},

        set: function (key, value) {

            this.state[key] = value;

            document.dispatchEvent(
                new CustomEvent("archive:state", {
                    detail: {
                        key: key,
                        value: value,
                        state: this.state
                    }
                })
            );

        },

        get: function (key) {

            return this.state[key];

        },
        emit: function (event, data = {}) {

    document.dispatchEvent(
        new CustomEvent(event, {
            detail: data
        })
    );

},

on: function (event, callback) {

    document.addEventListener(
        event,
        callback
    );

}

    };

    console.log(
        "ArchiveOS Core Loaded",
        window.ArchiveOS
    );

})();