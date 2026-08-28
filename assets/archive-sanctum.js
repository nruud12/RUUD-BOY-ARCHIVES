/* ==========================================================
   ARCHIVEOS — SANCTUM CONTROLLER
   RUUD BOY ARCHIVES

   Structural hook only. Subscribes to the existing playback event
   bus (archive-core.js) and reflects state as a class on the root
   element — nothing more.

   Never:
   • Own playback state. archive-player.js remains the only writer
     of currentTrack; this module only reads what the bus publishes.
   • Touch the audio graph. The vitrine owns the only permitted
     createMediaElementSource() call; a second one on the same
     element throws. Sanctum has no reason to attach one — its
     reaction is play/pause only, not per-frame amplitude.
   • Animate anything itself. It sets a class; archive-sanctum.css
     does the rest, the same division archive-vitrine.js already
     uses.
========================================================== */

(() => {
  'use strict';

  const Sanctum = {
    el: null,

    /* ------------------------------------------------------
       LIFECYCLE
    ------------------------------------------------------ */

    init() {
      this.el = document.querySelector('[data-sanctum]');
      if (!this.el) return;

      this.el.classList.add('is-idle');
      this.bindEvents();
    },

    bindEvents() {
      // Reserved for future use (e.g. per-artifact composition). No
      // visual response yet — establishing the hook, not the effect.
      document.addEventListener('archive:trackchange', (e) => {
        const track = (e.detail || {}).track;
        this.el.dataset.sanctumTrackId = track && track.id != null ? track.id : '';
      });

      document.addEventListener('archive:play', () => this.awaken());
      document.addEventListener('archive:pause', () => this.rest());
      document.addEventListener('archive:ended', () => this.rest());
    },

    /* ------------------------------------------------------
       STATE
    ------------------------------------------------------ */

    awaken() {
      if (!this.el) return;
      this.el.classList.add('is-awake');
      this.el.classList.remove('is-idle');
    },

    rest() {
      if (!this.el) return;
      this.el.classList.remove('is-awake');
      this.el.classList.add('is-idle');
    },
  };

  /* Register with ArchiveOS if it is present (it boots modules on
     DOMContentLoaded); otherwise stand alone. Same guard every other
     ArchiveOS module uses. */
  if (window.ArchiveOS) {
    window.ArchiveOS.register('sanctum', Sanctum);
  } else {
    document.addEventListener('DOMContentLoaded', () => Sanctum.init());
  }

  window.ArchiveSanctum = Sanctum;
})();
