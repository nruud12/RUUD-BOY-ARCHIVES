/* ==========================================================
   ArchiveOS Core v2.0
   ----------------------------------------------------------
   Responsibilities
   • Global namespace
   • State management
   • Event bus
   • Module registration
   • Boot process

   Never:
   • Touch the DOM
   • Play audio
   • Render UI
========================================================== */

(() => {

    if (window.ArchiveOS) return;

    const modules = {};

    const state = {
        playing: false,
        currentTrack: null,
        currentTime: 0,
        duration: 0,
        queue: [],
        currentIndex: -1,
        volume: 1,
        muted: false
    };

    const ArchiveOS = {

        version: "2.0.0",

        debug: true,

        state,

        register(name, module) {

            modules[name] = module;

        },

        getModule(name) {

            return modules[name];

        },

        set(key, value) {

            state[key] = value;

            document.dispatchEvent(
                new CustomEvent("archive:state", {
                    detail: {
                        key,
                        value,
                        state
                    }
                })
            );

        },

        get(key) {

            return state[key];

        },

        emit(event, detail = {}) {

            document.dispatchEvent(
                new CustomEvent(event, {
                    detail
                })
            );

        },

        on(event, callback) {

            document.addEventListener(event, callback);

        },

        boot() {

    console.group("ArchiveOS Boot");

    Object.entries(modules).forEach(([name, module]) => {

        console.log(`Initializing ${name}`);

        if (typeof module.init === "function") {
            module.init();
        }

    });

    console.groupEnd();

}

    };

    window.ArchiveOS = ArchiveOS;

console.log(
    "ArchiveOS Core Loaded",
    ArchiveOS
);

window.addEventListener("DOMContentLoaded", () => {
    ArchiveOS.boot();
});
})();