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

        /**
         * Boot runs in two phases, and the split is architectural.
         *
         *   1. init()   — a module claims its DOM and binds listeners.
         *                 It must not write state or emit events.
         *   2. ready()  — every module is now listening. Only here may
         *                 a module seat a declaration into state.
         *
         * Without the split, seating happens during phase 1 and only
         * the modules registered BEFORE the seater ever hear it. The
         * vitrine registers after archive-card-ui.js, so it missed the
         * seating entirely; the case looked correct only because Liquid
         * had painted the same artifact. Agreement by coincidence is
         * indistinguishable from agreement by design right up until it
         * is not.
         *
         * Registration order must not be load-bearing. It is the order
         * of <script> tags in snippets/scripts.liquid, which is a
         * delivery detail, not a contract.
         */
        boot() {

    console.group("ArchiveOS Boot");

    Object.entries(modules).forEach(([name, module]) => {

        console.log(`Initializing ${name}`);

        if (typeof module.init === "function") {
            module.init();
        }

    });

    Object.entries(modules).forEach(([name, module]) => {

        if (typeof module.ready === "function") {
            console.log(`Ready ${name}`);
            module.ready();
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