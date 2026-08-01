/* ==========================================================
   ARCHIVEOS — TRANSPORT DECK UI

   Owns the persistent deck's DOM and nothing else.

   Responsibilities
   • Reflect player state onto the deck
   • Translate deck input into player / queue calls
   • Run the track-change transition

   Never
   • Own the <audio> element        (archive-player.js)
   • Walk the card list             (archive-card-ui.js)
   • Hold playback state            (the event bus is the truth)

   ---------------------------------------------------------
   ON THE WAVEFORM

   These bars are NOT a spectrum analysis of the audio.

   The vitrine already owns the only permitted
   createMediaElementSource() call on the shared <audio> element,
   and a second call on the same element throws InvalidStateError —
   there is no way to attach a second analyser, and attaching one
   optimistically risks routing the audio into a silent graph with
   no recovery (see the CORS notes in archive-vitrine.js).

   So the waveform is a deterministic *fingerprint* of the artifact:
   the same track always draws the same shape, derived from its id.
   It communicates position and identity, not amplitude. It costs
   no audio graph, no fetch, and cannot break playback.

   Progress is published as a single custom property, --progress.
   CSS clips the played layer from it. Nothing touches the DOM on
   timeupdate beyond that one property write and the time label.
========================================================== */

(() => {
  'use strict';

  const ArchiveOS = window.ArchiveOS;

  if (!ArchiveOS) {
    console.error('[ArchiveOS] Core missing — transport deck not started.');
    return;
  }

  /* Bar (3px) + gap (2px). Must match archive-player.css. */
  const BAR_PITCH = 5;
  const MIN_BARS = 24;
  const MAX_BARS = 160;

  const reduceMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Matches --archive-speed / --archive-speed-reveal. Under reduced
     motion the tokens collapse to 1ms, so the JS midpoints must
     collapse too or text would sit hidden behind a finished
     transition. */
  const MORPH_MS = reduceMotion ? 0 : 240;
  const CROSSFADE_MS = reduceMotion ? 0 : 480;

  const UI = {
    el: {},
    artwork: [],
    activeArtwork: 0,
    barCount: 0,
    scrubbing: false,
    started: false,

    init() {
      this.cacheElements();

      if (!this.el.root) return;

      this.buildWaveform();
      this.bindPlayerEvents();
      this.bindInput();
      this.syncVolume();
    },

    cacheElements() {
      const root = document.querySelector('[data-archive-player]');

      this.el = {
        root,
        title: document.querySelector('[data-player-title]'),
        archive: document.querySelector('[data-player-archive]'),
        bpm: document.querySelector('[data-player-bpm]'),
        key: document.querySelector('[data-player-key]'),
        mood: document.querySelector('[data-player-mood]'),
        play: document.querySelector('[data-player-play]'),
        prev: document.querySelector('[data-player-prev]'),
        next: document.querySelector('[data-player-next]'),
        progress: document.querySelector('[data-player-progress]'),
        time: document.querySelector('[data-player-time]'),
        waveform: document.querySelector('[data-player-waveform]'),
        volume: document.querySelector('[data-player-volume]'),
        mute: document.querySelector('[data-player-mute]'),
      };

      this.artwork = [
        document.querySelector('[data-player-artwork-a]'),
        document.querySelector('[data-player-artwork-b]'),
      ].filter(Boolean);
    },

    /* ------------------------------------------------------
       WAVEFORM
    ------------------------------------------------------ */

    /**
     * Small deterministic PRNG (mulberry32). Same seed, same shape,
     * every visit — an artifact's waveform is part of its identity.
     */
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

    /** Bars that comfortably fill the current scrubber width. */
    desiredBarCount() {
      const width = this.el.waveform ? this.el.waveform.clientWidth : 0;
      if (!width) return MIN_BARS;
      return Math.max(MIN_BARS, Math.min(MAX_BARS, Math.floor(width / BAR_PITCH)));
    },

    buildWaveform() {
      if (!this.el.waveform) return;

      const count = this.desiredBarCount();
      if (count === this.barCount) return;

      this.barCount = count;
      this.el.waveform.textContent = '';

      ['base', 'played'].forEach((variant) => {
        const layer = document.createElement('div');
        layer.className =
          'archive-player__wf-layer archive-player__wf-layer--' + variant;

        for (let i = 0; i < count; i += 1) {
          const bar = document.createElement('span');
          bar.className = 'archive-player__wf-bar';
          bar.style.setProperty('--i', String(i));
          layer.appendChild(bar);
        }

        this.el.waveform.appendChild(layer);
      });

      this.drawWaveform(ArchiveOS.get('currentTrack'));
    },

    /**
     * Writes bar heights for a track. Both layers get identical
     * values so the played copy lines up with the base exactly.
     */
    drawWaveform(track) {
      if (!this.el.waveform || !this.barCount) return;

      const seed = this.hash(track && (track.id || track.title));
      const random = this.rng(seed || 1);

      const heights = [];
      for (let i = 0; i < this.barCount; i += 1) {
        // Two octaves of noise plus a gentle arch, so the shape reads
        // as a recording rather than as static.
        const arch = Math.sin((i / this.barCount) * Math.PI);
        const coarse = random();
        const fine = random();
        const value = 0.18 + arch * 0.34 + coarse * 0.34 + fine * 0.14;
        heights.push(Math.max(0.04, Math.min(1, value)));
      }

      this.el.waveform
        .querySelectorAll('.archive-player__wf-layer')
        .forEach((layer) => {
          const bars = layer.children;
          for (let i = 0; i < bars.length; i += 1) {
            bars[i].style.setProperty('--h', heights[i].toFixed(3));
          }
        });
    },

    /* ------------------------------------------------------
       PLAYER EVENTS
    ------------------------------------------------------ */

    bindPlayerEvents() {
      ArchiveOS.on('archive:trackchange', (event) => {
        const track = (event.detail && event.detail.track) || null;
        if (!track) return;
        this.updateTrack(track);
      });

      ArchiveOS.on('archive:play', () => this.setPlaying(true));
      ArchiveOS.on('archive:pause', () => this.setPlaying(false));

      ArchiveOS.on('archive:timeupdate', (event) => {
        const detail = event.detail || {};
        this.updateProgress(detail.currentTime || 0, detail.duration || 0);
      });

      ArchiveOS.on('archive:volumechange', (event) => {
        const detail = event.detail || {};
        this.reflectVolume(detail.volume, detail.muted);
      });

      let resizeTimer = null;
      window.addEventListener('resize', () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => this.buildWaveform(), 180);
      });
    },

    /* ------------------------------------------------------
       INPUT
    ------------------------------------------------------ */

    bindInput() {
      this.el.play?.addEventListener('click', () => {
        const player = ArchiveOS.getModule('player');
        if (!player) return;

        // Nothing loaded yet: the play button starts the archive
        // rather than doing nothing.
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

      /* Seeking commits on `change` (pointer release, or each arrow
         key press), not on `input`. Committing on every `input` frame
         floods the media element with currentTime writes mid-drag and
         stutters audibly. `input` moves the visual playhead only, so
         the scrub still feels live. */
      this.el.progress?.addEventListener('input', (event) => {
        this.scrubbing = true;
        const ratio = Number(event.target.value) / 1000;
        this.el.root.style.setProperty('--progress', ratio.toFixed(4));

        const duration = ArchiveOS.get('duration') || 0;
        if (duration) this.renderTime(ratio * duration, duration);
      });

      this.el.progress?.addEventListener('change', (event) => {
        const player = ArchiveOS.getModule('player');
        this.scrubbing = false;
        if (!player) return;

        const duration = player.getDuration();
        if (!duration) return;

        player.seek((Number(event.target.value) / 1000) * duration);
      });

      this.el.volume?.addEventListener('input', (event) => {
        const player = ArchiveOS.getModule('player');
        if (!player) return;
        player.setVolume(Number(event.target.value) / 100);
      });

      this.el.mute?.addEventListener('click', () => {
        const player = ArchiveOS.getModule('player');
        if (!player) return;
        player.toggleMute();
      });
    },

    syncVolume() {
      const player = ArchiveOS.getModule('player');
      if (!player || typeof player.getVolume !== 'function') return;
      this.reflectVolume(player.getVolume(), player.isMuted());
    },

    /* ------------------------------------------------------
       RENDERING
    ------------------------------------------------------ */

    updateTrack(track) {
      // First artifact of the session retires the rest state.
      if (!this.started) {
        this.started = true;
        this.el.root.classList.remove('is-empty');
      }

      this.morph(this.el.title, track.title || 'Unattributed artifact');

      this.setText(this.el.archive, track.archive || '');
      this.setText(this.el.bpm, track.bpm || '');
      this.setText(this.el.key, track.key || '');
      this.setText(this.el.mood, track.mood || '');

      this.setArtwork(track.image || '');
      this.drawWaveform(track);

      this.el.root.style.setProperty('--progress', '0');
      if (this.el.progress) this.el.progress.value = '0';
    },

    setText(node, value) {
      if (node) node.textContent = value;
    },

    /**
     * Fades the label out, swaps the text at the midpoint, fades it
     * back. Both strings are never visible at once, so the deck
     * never flickers two identities.
     */
    morph(node, text) {
      if (!node || node.textContent === text) return;

      if (!MORPH_MS) {
        node.textContent = text;
        return;
      }

      node.classList.add('is-morphing');

      window.setTimeout(() => {
        node.textContent = text;
        node.classList.remove('is-morphing');
      }, MORPH_MS);
    },

    /**
     * Cross-fades between the two artwork layers.
     *
     * The incoming layer is only revealed once the image has actually
     * decoded — otherwise the fade begins against an empty frame and
     * reads as a flash. On error the outgoing artwork simply stays.
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
        current.classList.add('is-leaving');

        window.setTimeout(() => {
          current.classList.remove('is-leaving');
        }, CROSSFADE_MS);

        this.activeArtwork = 1 - this.activeArtwork;
      };

      incoming.onload = reveal;
      incoming.onerror = () => {
        incoming.onload = null;
      };

      incoming.src = src;

      // Cached images may already be complete before onload binds.
      if (incoming.complete && incoming.naturalWidth > 0) reveal();
    },

    setPlaying(playing) {
      this.el.root.classList.toggle('is-playing', playing);

      if (this.el.play) {
        this.el.play.setAttribute('aria-label', playing ? 'Pause' : 'Play');
      }
    },

    updateProgress(currentTime, duration) {
      const ratio = duration > 0 ? currentTime / duration : 0;

      if (!this.scrubbing) {
        this.el.root.style.setProperty('--progress', ratio.toFixed(4));
        if (this.el.progress) {
          this.el.progress.value = String(Math.round(ratio * 1000));
        }
        this.renderTime(currentTime, duration);
      }
    },

    renderTime(currentTime, duration) {
      if (!this.el.time) return;
      this.el.time.textContent =
        this.formatTime(currentTime) + ' / ' + this.formatTime(duration);
    },

    reflectVolume(volume, muted) {
      if (typeof volume === 'number' && this.el.volume && document.activeElement !== this.el.volume) {
        this.el.volume.value = String(Math.round(volume * 100));
      }

      this.el.root.classList.toggle('is-muted', Boolean(muted));

      if (this.el.mute) {
        this.el.mute.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
      }
    },

    formatTime(seconds) {
      if (!isFinite(seconds) || seconds < 0) return '0:00';
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return minutes + ':' + String(secs).padStart(2, '0');
    },
  };

  ArchiveOS.register('ui', UI);
})();
