/* ==========================================================
   RB-001 — CRYSTAL PLAYER UI (Stage 3 / 3B)
   RUUD BOY ARCHIVES

   A second VIEW of ArchiveOS state, exactly as archive-ui.js is
   a view for the transport deck. The Blender render supplies the
   physical device; this module writes only the changing content
   into the calibrated zones of snippets/rb001-player.liquid.

   Responsibilities
   • Reflect bus state onto the RB-001 zones (data-rb001-*)
   • Translate RB-001 hit-area input into player / queue calls
   • Draw the artifact-fingerprint waveform + progress

   Never
   • Own or create an <audio> element   (archive-player.js does)
   • Walk the card list                 (archive-card-ui.js does)
   • Hold playback state                (the event bus is the truth)
   • Draw chrome — the rendered glass is the chrome

   ----------------------------------------------------------
   RB-001 DATA CONTRACT (Stage 3A)

   One input model: the ArchiveOS track record (emitted by
   snippets/archive-track-record.liquid — the single definition
   of the shape) plus live playback state from the bus.

     field        source                                   event
     -----        ------                                   -----
     artwork      track.image   (product.featured_image)   archive:trackchange
     title        track.title   (product.title)            archive:trackchange
     producer     track.vendor  (product.vendor)           archive:trackchange
     bpm          track.bpm     (custom.bpm metafield)     archive:trackchange
     key          track.key     (custom.key metafield)     archive:trackchange
     style/tags   track.mood + track.type (custom.*)       archive:trackchange
     product URL  track.url     (product.url)              archive:trackchange
     currentTime  live <audio> position                    archive:timeupdate
     duration     live <audio> metadata                    archive:timeupdate
     playing      player state                             archive:play / :pause
     waveform     deterministic fingerprint of track.id — NOT amplitude
                  data. The vitrine owns the one permitted analyser on
                  the shared <audio> element (see archive-ui.js "ON THE
                  WAVEFORM"); this reuses that same house architecture.

   STAGE 3B/3C — GLYPH AND PAUSE STATE

     Play and heart reproduce the measured Blender objects. Prev and
     next follow the CANONICAL REFERENCE instead (Stage 3C): double
     chevrons, since Blender's single triangles trace back to a stale,
     permanently hidden object. All four glyphs are inline SVG in the
     snippet; sizes, offsets and colours live in rb001-player.css.

     There is NO pause glyph anywhere in the Blender file — a search of
     every object returned nothing, and playback state is carried there
     by PT6_Play_Ring (custom property `beat_playing`, material
     PT6_Play_Ring_Playback_State), not by swapping the glyph. So the
     play mark does not change on play, and none was invented. The
     playing state still reaches the view as the `is-playing` class,
     which the waveform reads.

   NOT AVAILABLE in current Shopify data (reported, not faked):
     • static pre-play duration  — custom.duration metafield is
       defined but unpopulated on sampled products; the record does
       not carry it. Duration renders live once audio metadata loads.
     • real amplitude waveform   — no stored peak data exists.
     • favorites                 — the theme has no favorites system;
       the heart hit stays disabled.
   ========================================================== */

(() => {
  'use strict';

  const ArchiveOS = window.ArchiveOS;
  if (!ArchiveOS) return;

  /* Bar pitch, MEASURED — corrected in Stage 5 (CP1).
     Stage 3B derived 0.40870% from "the 154 PI6_Wave_* objects". Only 52
     of those render: the other 102 are hidden PI6_Wave_Interp_* bars that
     interleave with the visible ones, so averaging their centres reported
     a pitch far finer than anything the scene draws. Width was unaffected
     (the interpolants are the same 0.0808%), pitch alone was wrong.

     The corrected figure is measured off the canonical reference's own
     band at native resolution by autocorrelation — 7px on its 1522px card
     face, r=0.771, with the expected harmonic at 15px:

       0.4599% of shell width  ->  136 bars across the 62.35% band

     (Blender's 52 visible bars sit at 1.2261%, a sparser figure than the
     reference draws; that difference is a design question, not this
     arithmetic error, and is left alone here.) */
  const WF_PITCH_PCT = 0.4599;
  const MIN_BARS = 24;
  const MAX_BARS = 160;

  /* Lines whose text changes per product. The Blender objects carry one
     product's words, so their measured width is an ENVELOPE: keep the
     measured tracking, and shrink only when a longer title would break
     out of the box the shell was built around. */
  const FIT_FLOOR = 0.62;

  const RB001 = {
    el: {},
    artwork: [],
    activeArtwork: 0,
    barCount: 0,

    /** Phase 1 — claim the DOM and bind. Writes no state, emits nothing. */
    init() {
      const root = document.querySelector('[data-rb001]');
      if (!root) return; // page without an RB-001 mount: stay inert

      this.el = {
        root,
        title: root.querySelector('[data-rb001-title]'),
        producer: root.querySelector('[data-rb001-producer]'),
        bpm: root.querySelector('[data-rb001-bpm]'),
        key: root.querySelector('[data-rb001-key]'),
        tags: root.querySelector('[data-rb001-tags]'),
        meta: root.querySelector('.rb001__meta'),
        time: root.querySelector('[data-rb001-time]'),
        nowplaying: root.querySelector('.rb001__nowplaying'),
        waveform: root.querySelector('[data-rb001-waveform]'),
        play: root.querySelector('[data-rb001-play]'),
        prev: root.querySelector('[data-rb001-prev]'),
        next: root.querySelector('[data-rb001-next]'),
        acquire: root.querySelector('[data-rb001-acquire]'),
      };

      this.artwork = [
        root.querySelector('[data-rb001-artwork-a]'),
        root.querySelector('[data-rb001-artwork-b]'),
      ].filter(Boolean);

      this.buildWaveform();
      this.bindPlayerEvents();
      this.bindInput();
    },

    /** Phase 2 — every module listens; reflect whatever is seated. */
    ready() {
      if (!this.el.root) return;

      const track = ArchiveOS.get('currentTrack');
      if (track) this.updateTrack(track);

      this.setPlaying(Boolean(ArchiveOS.get('playing')));
      this.updateProgress(
        ArchiveOS.get('currentTime') || 0,
        ArchiveOS.get('duration') || 0
      );
    },

    /* ------------------------------------------------------
       PLAYER EVENTS (read-only reflection of the bus)
    ------------------------------------------------------ */

    bindPlayerEvents() {
      ArchiveOS.on('archive:trackchange', (event) => {
        const detail = event.detail || {};
        if (detail.track) this.updateTrack(detail.track);
      });

      ArchiveOS.on('archive:play', () => this.setPlaying(true));
      ArchiveOS.on('archive:pause', () => this.setPlaying(false));

      ArchiveOS.on('archive:timeupdate', (event) => {
        const detail = event.detail || {};
        this.updateProgress(detail.currentTime || 0, detail.duration || 0);
      });

      let resizeTimer = null;
      window.addEventListener('resize', () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
          this.buildWaveform();
          this.fitLines();
        }, 180);
      });
    },

    /* ------------------------------------------------------
       INPUT — hits translate to the ONE player / queue.
       Same resolution rules as the transport deck.
    ------------------------------------------------------ */

    bindInput() {
      const enable = (button) => {
        if (button) button.disabled = false;
      };

      /* The heart stays disabled: the theme has no favorites
         mechanism, and RB-001 must not invent a second one. */
      enable(this.el.play);
      enable(this.el.prev);
      enable(this.el.next);

      this.el.play?.addEventListener('click', () => {
        const player = ArchiveOS.getModule('player');
        if (!player) return;

        /* Nothing seated: ask the queue to advance from nowhere —
           asking is not choosing (see archive-ui.js). */
        if (!ArchiveOS.get('currentTrack')) {
          const cards = ArchiveOS.getModule('cardUI');
          if (cards && typeof cards.next === 'function') cards.next(true);
          return;
        }

        player.toggle();
      });

      this.el.next?.addEventListener('click', () => {
        const cards = ArchiveOS.getModule('cardUI');
        if (cards && typeof cards.next === 'function') cards.next(true);
      });

      this.el.prev?.addEventListener('click', () => {
        const cards = ArchiveOS.getModule('cardUI');
        if (cards && typeof cards.previous === 'function') cards.previous(true);
      });
    },

    /* ------------------------------------------------------
       RENDERING
    ------------------------------------------------------ */

    updateTrack(track) {
      this.el.root.classList.add('has-track');

      this.setText(this.el.title, track.title || '');
      this.setText(this.el.producer, track.vendor || '');
      this.setText(this.el.bpm, track.bpm ? track.bpm + ' BPM' : '');
      this.setText(this.el.key, track.key || '');

      const tags = [track.mood, track.type].filter(Boolean).join(' / ');
      this.setText(this.el.tags, tags);

      this.setArtwork(track.image || '');
      this.drawWaveform(track);
      this.updateAcquire(track);
      this.fitLines();

      this.el.root.style.setProperty('--rb001-progress', '0');
    },

    /**
     * The Stage-2 CTA follows the artifact on display. The rendered
     * anchor keeps its element and treatment; only the destination
     * moves with the bus. The Liquid-rendered product URL remains
     * the no-JS fallback.
     */
    updateAcquire(track) {
      const cta = this.el.acquire;
      if (!cta || !track.url) return;

      if (cta.tagName === 'A') {
        cta.href = track.url;
      } else {
        // Mounted without Liquid product context: the button becomes
        // a real navigation to the artifact on display.
        cta.disabled = false;
        if (!cta.dataset.rb001AcquireBound) {
          cta.dataset.rb001AcquireBound = 'true';
          cta.addEventListener('click', () => {
            const current = ArchiveOS.get('currentTrack');
            if (current && current.url) window.location.assign(current.url);
          });
        }
      }
    },

    setText(node, value) {
      if (node) node.textContent = value;
    },

    setPlaying(playing) {
      this.el.root.classList.toggle('is-playing', playing);
      if (this.el.play) {
        this.el.play.setAttribute('aria-label', playing ? 'Pause' : 'Play');
      }
    },

    updateProgress(currentTime, duration) {
      const ratio = duration > 0 ? currentTime / duration : 0;
      this.el.root.style.setProperty('--rb001-progress', ratio.toFixed(4));
      this.renderTime(currentTime, duration);
    },

    /**
     * The time readout lives inside a span because the measured Blender
     * treatment is horizontally condensed (object scale 0.8/1.1) and the
     * CSS reproduces that with scaleX — which needs an element of its
     * own, or it would squash the whole calibrated box.
     */
    renderTime(currentTime, duration) {
      if (!this.el.time) return;

      if (!this.timeSpan) {
        this.timeSpan = this.el.time.querySelector('span');
        if (!this.timeSpan) {
          this.timeSpan = document.createElement('span');
          this.el.time.appendChild(this.timeSpan);
        }
      }

      this.timeSpan.textContent = duration
        ? this.formatTime(currentTime) + ' / ' + this.formatTime(duration)
        : '';
    },

    /* ------------------------------------------------------
       ENVELOPE FIT

       The measured box is the envelope the crystal was built around,
       so text may not leave it. Live titles are longer than the
       "ABYSS" the Blender object carries; those shrink to fit at the
       measured tracking rather than being stretched, letter-crushed,
       or allowed to run under the time readout.
    ------------------------------------------------------ */

    fitLines() {
      [this.el.title, this.el.producer, this.el.meta].forEach((node) =>
        this.fitLine(node)
      );
    },

    fitLine(node) {
      if (!node) return;

      // Back to the calibrated size before measuring, or each pass
      // would compound the last one's shrink.
      node.style.fontSize = '';

      const base = parseFloat(window.getComputedStyle(node).fontSize);
      const available = node.clientWidth;
      if (!base || !available) return;

      /* Measured over the text itself, not by scrollWidth: the line is a
         flex box, and a flex box reports the width its item was laid out
         at, which is already clamped to the box — so scrollWidth reads
         back roughly the box width no matter how far the letters
         actually run, and the fit silently under-corrects. A Range over
         the contents reports where the glyphs really end. */
      const range = document.createRange();
      range.selectNodeContents(node);
      const wanted = range.getBoundingClientRect().width;

      if (!wanted || wanted <= available) return;

      const scale = Math.max(FIT_FLOOR, available / wanted);
      node.style.fontSize = (base * scale).toFixed(3) + 'px';
    },

    /**
     * RB-001 reads MM:SS, zero-padded, because that is what the crystal
     * was built around: PI6_Time carries "01:24 / 03:42", and the type
     * calibration solved its condensation against exactly that
     * thirteen-character run. The theme's own transport deck keeps the
     * house 0:00 form — this override is local to this view.
     */
    formatTime(seconds) {
      if (!isFinite(seconds) || seconds < 0) return '00:00';
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return String(minutes).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    },

    /* ------------------------------------------------------
       WAVEFORM — the house fingerprint, verbatim from
       archive-ui.js: same PRNG, same hash, same height curve.
       Same track, same shape, on every surface of the theme.
    ------------------------------------------------------ */

    rng(seed) {
      let a = seed >>> 0;
      return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },

    hash(value) {
      const str = String(value == null ? '' : value);
      let h = 2166136261;
      for (let i = 0; i < str.length; i += 1) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return h >>> 0;
    },

    desiredBarCount() {
      const shell = this.el.root ? this.el.root.clientWidth : 0;
      const band = this.el.waveform ? this.el.waveform.clientWidth : 0;
      if (!shell || !band) return MIN_BARS;

      const pitch = (shell * WF_PITCH_PCT) / 100;
      if (!pitch) return MIN_BARS;

      return Math.max(MIN_BARS, Math.min(MAX_BARS, Math.round(band / pitch)));
    },

    buildWaveform() {
      if (!this.el.waveform) return;

      const count = this.desiredBarCount();
      if (count === this.barCount) return;

      this.barCount = count;
      this.el.waveform.textContent = '';

      ['base', 'played'].forEach((variant) => {
        const layer = document.createElement('div');
        layer.className = 'rb001__wf-layer rb001__wf-layer--' + variant;

        for (let i = 0; i < count; i += 1) {
          const bar = document.createElement('span');
          bar.className = 'rb001__wf-bar';
          bar.style.setProperty('--i', String(i));
          layer.appendChild(bar);
        }

        this.el.waveform.appendChild(layer);
      });

      this.drawWaveform(ArchiveOS.get('currentTrack'));
    },

    drawWaveform(track) {
      if (!this.el.waveform || !this.barCount) return;

      const seed = this.hash(track && (track.id || track.title));
      const random = this.rng(seed || 1);

      const heights = [];
      for (let i = 0; i < this.barCount; i += 1) {
        const arch = Math.sin((i / this.barCount) * Math.PI);
        const coarse = random();
        const fine = random();
        const value = 0.18 + arch * 0.34 + coarse * 0.34 + fine * 0.14;
        heights.push(Math.max(0.04, Math.min(1, value)));
      }

      this.el.waveform
        .querySelectorAll('.rb001__wf-layer')
        .forEach((layer) => {
          const bars = layer.children;
          for (let i = 0; i < bars.length; i += 1) {
            bars[i].style.setProperty('--h', heights[i].toFixed(3));
          }
        });
    },

    /**
     * Two-layer decode-gated crossfade, as the transport deck does:
     * the incoming artwork is revealed only once decoded, so a swap
     * never flashes an empty frame inside the crystal.
     */
    setArtwork(src) {
      if (this.artwork.length < 2) return;

      const current = this.artwork[this.activeArtwork];
      const incoming = this.artwork[1 - this.activeArtwork];

      if (!src) {
        current.classList.remove('is-showing');
        current.removeAttribute('src');
        return;
      }

      if (current.getAttribute('src') === src) return;

      const reveal = () => {
        incoming.classList.add('is-showing');
        current.classList.remove('is-showing');
        this.activeArtwork = 1 - this.activeArtwork;
      };

      incoming.onload = reveal;
      incoming.onerror = () => {
        incoming.onload = null;
      };

      incoming.src = src;

      if (incoming.complete && incoming.naturalWidth > 0) reveal();
    },
  };

  ArchiveOS.register('rb001UI', RB001);
})();
