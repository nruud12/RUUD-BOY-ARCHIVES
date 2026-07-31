/* ==========================================================
   ARCHIVEOS — ARTIFACT CARD UI
   RUUD BOY ARCHIVES

   Turns a grid of product cards into a browsable archive.

   The central interaction rule from the design brief:

       Selecting a beat does NOT navigate away.
       Music begins, the vitrine updates, the card becomes active.
       A visitor can audition the whole catalogue without ever
       leaving the page they are on.

   Responsibilities
   • Read each card's artifact record (a JSON <script> emitted by
     snippets/ruud-audio-player.liquid)
   • Hand it to the ArchiveOS player on click
   • Keep exactly one card marked active, and reflect play/pause

   Never
   • Own the audio element
   • Duplicate player state — the event bus is the source of truth

   Previously this file only listened; nothing in the theme ever
   called player.load(), so no card could start playback. Clicks
   are now delegated from document, which also means cards injected
   later by Horizon's paginated-list / section rendering are picked
   up with no rebinding.
========================================================== */

(() => {
  'use strict';

  const CardUI = {
    /** @type {string|null} id of the artifact currently in the case */
    activeId: null,

    init() {
      this.bindClicks();
      this.bindPlayerEvents();
    },

    /* ------------------------------------------------------
       INPUT
    ------------------------------------------------------ */

    bindClicks() {
      document.addEventListener(
        'click',
        (event) => {
          const button = event.target.closest('[data-archive-play]');
          if (!button) return;

          // The whole card is wrapped in an <a> to the product page.
          // Auditioning must not trigger it.
          event.preventDefault();
          event.stopPropagation();

          const card = button.closest('.archive-card');
          if (!card) return;

          this.select(card);
        },
        // Capture phase, so we run before the card link's own handlers.
        true
      );
    },

    /**
     * Reads the artifact record embedded in a card.
     * @param {Element} card
     * @returns {object|null}
     */
    readTrack(card) {
      const node = card.querySelector('.archive-track-data');
      if (!node) return null;

      try {
        return JSON.parse(node.textContent);
      } catch (err) {
        console.warn('[ArchiveOS] Unreadable artifact record on card', card, err);
        return null;
      }
    },

    /**
     * Clicking the active artifact toggles it; clicking any other
     * artifact loads it and starts playback immediately.
     */
    select(card) {
      const player = window.ArchiveOS && window.ArchiveOS.getModule('player');
      if (!player) return;

      const track = this.readTrack(card);
      if (!track || !track.audio) return;

      if (String(track.id) === String(this.activeId)) {
        player.toggle();
        return;
      }

      player.load(track);
      player.play();
    },

    /* ------------------------------------------------------
       STATE REFLECTION
    ------------------------------------------------------ */

    bindPlayerEvents() {
      document.addEventListener('archive:trackchange', (event) => {
        const track = event.detail && event.detail.track;
        if (!track) return;

        this.activeId = String(track.id);
        this.markActive(this.activeId);
      });

      // `is-playing` means "sounding right now" — it drives both the
      // NOW PLAYING label and the play/pause icon swap. `is-active`
      // means "this is the artifact in the case", and survives a pause.
      document.addEventListener('archive:play', () => this.setPlaying(true));
      document.addEventListener('archive:pause', () => this.setPlaying(false));
      document.addEventListener('archive:ended', () => this.setPlaying(false));
    },

    cards() {
      return document.querySelectorAll('.archive-card');
    },

    markActive(id) {
      this.cards().forEach((card) => {
        const match = card.dataset.trackId === id;
        card.classList.toggle('is-active', match);
        if (!match) card.classList.remove('is-playing');
      });
    },

    setPlaying(playing) {
      if (!this.activeId) return;

      this.cards().forEach((card) => {
        const match = card.dataset.trackId === this.activeId;
        card.classList.toggle('is-playing', match && playing);
      });
    },
  };

  if (window.ArchiveOS) {
    window.ArchiveOS.register('cardUI', CardUI);
  } else {
    document.addEventListener('DOMContentLoaded', () => CardUI.init());
  }
})();
