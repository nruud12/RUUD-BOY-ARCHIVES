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

  /**
   * Anything that can carry an artifact record and be auditioned.
   *
   * Deliberately wider than the queue source below. The product page's
   * Expanded Deck is an artifact host — it can be played and it shows
   * active state — but it is NOT a card, because a page holding one
   * card would collapse the queue to a single entry and lose the
   * catalogue fallback. Hosts are for interaction; cards are for the
   * queue. Keep the two separate.
   */
  const ARTIFACT_HOSTS = '.archive-card, [data-archive-artifact]';

  const CardUI = {
    /**
     * The artifact's runtime identity — READ, never stored.
     *
     * This was a field mirrored from every trackchange. A mirror can
     * drift, and a drifted mirror is two views disagreeing about which
     * artifact is on display. Derived from the one runtime identity
     * instead, so disagreement is not expressible.
     *
     * @type {string|null}
     */
    get activeId() {
      const track = window.ArchiveOS && window.ArchiveOS.get('currentTrack');
      return track && track.id != null ? String(track.id) : null;
    },

    /** @type {Array|null} parsed catalogue feed, lazily populated */
    feedCache: null,

    /** Phase 1 — claim the DOM. Writes no state, emits nothing. */
    init() {
      this.bindClicks();
      this.bindPlayerEvents();
    },

    /**
     * Phase 2 — every view is listening now, so the declaration can be
     * seated and all three views will hear it.
     *
     * This deliberately does NOT run in init(). Seating emits
     * `archive:trackchange`, and any module registered after this one
     * would not yet have bound its listener — the vitrine registers
     * later and would miss the artifact it exists to display.
     */
    ready() {
      this.seatDisplayedArtifact();
    },

    /**
     * Seats the artifact this page puts on display into shared state.
     *
     * A page that displays an artifact — the vitrine on the homepage,
     * the Expanded Deck on a product page — declares it with an
     * artifact record. Without this, that declaration reached the DOM
     * but never the event bus: the case showed a piece while the
     * console reported nothing loaded, and the archive contradicted
     * itself before the visitor touched anything.
     *
     * Loaded, never played. `player.load()` sets currentTrack and
     * emits trackchange, so every view renders the same artifact from
     * the same source. No audio is fetched until the visitor asks.
     *
     * Deliberately does nothing if something is already loaded — a
     * queue advance or a restored session outranks a page default.
     */
    seatDisplayedArtifact() {
      const player = window.ArchiveOS && window.ArchiveOS.getModule('player');
      if (!player || window.ArchiveOS.get('currentTrack')) return;

      const host = document.querySelector('[data-archive-artifact]');
      if (!host) return;

      const track = this.readTrack(host);
      if (!track || !track.audio) return;

      /* Flagged as a seating so views can tell this apart from an
         exchange. The page has already rendered this artifact; the
         case must not darken and relight for a piece that never left. */
      player.load(track, { seated: true });
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

          const host = button.closest(ARTIFACT_HOSTS);
          if (!host) return;

          this.select(host);
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

      this.play(card);
    },

    /* ------------------------------------------------------
       STATE REFLECTION
    ------------------------------------------------------ */

    bindPlayerEvents() {
      document.addEventListener('archive:trackchange', (event) => {
        const track = event.detail && event.detail.track;
        if (!track) return;

        /* Nothing is assigned. The identity already changed in state
           before this event was emitted; this only repaints. */
        this.markActive(this.activeId);
      });

      // `is-playing` means "sounding right now" — it drives both the
      // NOW PLAYING label and the play/pause icon swap. `is-active`
      // means "this is the artifact in the case", and survives a pause.
      document.addEventListener('archive:play', () => this.setPlaying(true));
      document.addEventListener('archive:pause', () => this.setPlaying(false));

      /*
        Auto-advance. Previously `archive:ended` only cleared the
        playing state, so playback stopped dead after every artifact
        and the visitor had to click again to continue — the single
        biggest gap in a "persistent" player.

        No wrap: reaching the end of the archive comes to rest.
        Looping the visitor silently back to the first artifact would
        be a surprise, and there is no visible queue to explain it.
      */
      document.addEventListener('archive:ended', () => {
        this.setPlaying(false);

        const advanced = this.next(false);

        if (!advanced) {
          window.ArchiveOS && window.ArchiveOS.emit('archive:queueend');
        }
      });
    },

    /* ------------------------------------------------------
       QUEUE

       The queue lives here, not in the player, because the queue
       IS the DOM order of the cards on the current page — and the
       player module is contractually forbidden from touching the
       DOM. archive-ui.js asks this module to advance; it never
       walks the card list itself.

       Cards are re-read on every call rather than cached, so
       Horizon's paginated-list and section-rendering can inject
       cards at any time without invalidating the queue.
    ------------------------------------------------------ */

    cards() {
      return document.querySelectorAll('.archive-card');
    },

    /**
     * Is this card genuinely on the page, or hidden?
     *
     * Horizon's facets re-render the grid server-side, so a filtered
     * artifact leaves the DOM entirely and never reaches this check.
     * But nothing guarantees every future surface behaves that way —
     * a collapsed section or a CSS-hidden grid would otherwise let
     * the deck auto-play an artifact the visitor cannot see.
     */
    isVisible(card) {
      if (!card) return false;

      if (typeof card.checkVisibility === 'function') {
        return card.checkVisibility({
          contentVisibilityAuto: true,
          visibilityProperty: true,
        });
      }

      // offsetParent is null for display:none and for any hidden
      // ancestor. Cards are never position:fixed, so the usual
      // false positive for that case does not apply here.
      return Boolean(card.offsetParent);
    },

    /**
     * Queue entries from visible cards on this page.
     * @returns {Array<{track: object, card: Element|null}>}
     */
    cardEntries() {
      return Array.from(this.cards())
        .filter((card) => this.isVisible(card))
        .map((card) => ({ track: this.readTrack(card), card }))
        .filter((entry) => Boolean(entry.track && entry.track.audio));
    },

    /**
     * Queue entries from the catalogue feed — the fallback for
     * templates that render no cards at all (the product page).
     *
     * Cached: the feed is a static blob emitted once per page load,
     * so re-parsing it on every queue step would be waste.
     */
    feedEntries() {
      if (this.feedCache) return this.feedCache;

      const node = document.querySelector('[data-archive-feed]');
      if (!node) {
        this.feedCache = [];
        return this.feedCache;
      }

      try {
        const parsed = JSON.parse(node.textContent);
        this.feedCache = (Array.isArray(parsed) ? parsed : [])
          .filter((track) => Boolean(track && track.audio))
          .map((track) => ({ track, card: null }));
      } catch (err) {
        console.warn('[ArchiveOS] Unreadable catalogue feed', err);
        this.feedCache = [];
      }

      return this.feedCache;
    },

    /**
     * The queue.
     *
     * Visible cards win: they are what the visitor is actually
     * looking at, and they already reflect any active filtering.
     * The catalogue is consulted only when this page shows none.
     */
    queue() {
      const cards = this.cardEntries();
      return cards.length > 0 ? cards : this.feedEntries();
    },

    /** Index of the active artifact within the queue, or -1. */
    currentIndex() {
      if (!this.activeId) return -1;
      return this.queue().findIndex(
        (entry) => String(entry.track.id) === String(this.activeId)
      );
    },

    /**
     * Moves through the queue.
     *
     * `wrap` is false for auto-advance — reaching the end of the
     * archive should come to rest, not loop the visitor back to the
     * top unannounced. It is true for the explicit next/prev
     * buttons, where a deliberate press implies wanting to keep going.
     *
     * @param {number} step  +1 forward, -1 back
     * @param {boolean} wrap
     * @returns {boolean} whether a track was loaded
     */
    step(step, wrap) {
      const player = window.ArchiveOS && window.ArchiveOS.getModule('player');
      if (!player) return false;

      const list = this.queue();
      if (list.length === 0) return false;

      // Nothing selected yet: a next/prev press starts at the top.
      const index = this.currentIndex();
      if (index === -1) {
        return this.playEntry(list[0]);
      }

      // A single artifact has nowhere to go.
      if (list.length === 1) return false;

      let target = index + step;

      if (target >= list.length) {
        if (!wrap) return false;
        target = 0;
      } else if (target < 0) {
        if (!wrap) return false;
        target = list.length - 1;
      }

      return this.playEntry(list[target]);
    },

    /** Loads and starts a queue entry. */
    playEntry(entry) {
      const player = window.ArchiveOS && window.ArchiveOS.getModule('player');
      if (!player || !entry || !entry.track || !entry.track.audio) return false;

      player.load(entry.track);
      player.play();
      return true;
    },

    /** Loads and starts a card. Used by select(). */
    play(card) {
      return this.playEntry({ track: this.readTrack(card), card });
    },

    next(wrap = true) {
      return this.step(1, wrap);
    },

    previous(wrap = true) {
      return this.step(-1, wrap);
    },

    /** Every surface that reflects active state — cards and hosts alike. */
    hosts() {
      return document.querySelectorAll(ARTIFACT_HOSTS);
    },

    markActive(id) {
      this.hosts().forEach((host) => {
        const match = host.dataset.trackId === id;
        host.classList.toggle('is-active', match);
        if (!match) host.classList.remove('is-playing');
      });
    },

    setPlaying(playing) {
      if (!this.activeId) return;

      this.hosts().forEach((host) => {
        const match = host.dataset.trackId === this.activeId;
        host.classList.toggle('is-playing', match && playing);
      });
    },
  };

  if (window.ArchiveOS) {
    window.ArchiveOS.register('cardUI', CardUI);
  } else {
    // Standalone fallback: both phases, in order.
    document.addEventListener('DOMContentLoaded', () => {
      CardUI.init();
      CardUI.ready();
    });
  }
})();
