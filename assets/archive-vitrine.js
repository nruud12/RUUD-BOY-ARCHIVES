/* ==========================================================
   ARCHIVEOS — VITRINE CONTROLLER
   RUUD BOY ARCHIVES

   Drives the artifact display case. No dependencies.

   Responsibilities
   • Listen to ArchiveOS playback events and swap the artifact
   • Analyse the playing audio and publish three numbers to CSS
   • Ease those numbers back to rest when playback stops

   Never
   • Own playback (that is archive-player.js)
   • Animate anything itself — it writes custom properties and
     lets the compositor do the work

   ----------------------------------------------------------
   ON THE ANALYSER AND CORS

   Web Audio's createMediaElementSource() permanently routes an
   <audio> element through the graph. If the media is CORS-tainted
   the graph outputs SILENCE, and there is no way to undo it — the
   node cannot be detached back to a working state.

   So we never create the source optimistically. We first make a
   1-byte ranged request to the audio URL. Only if that succeeds
   (proving the CDN sends permissive CORS headers) do we attach
   the analyser. If it fails, the vitrine falls back to a synthetic
   envelope — a slow, musical pulse — and the audio plays normally
   and untouched.

   This is the difference between "the glow is less accurate" and
   "the site has no sound".
========================================================== */

(() => {
  'use strict';

  const REST = { energy: 0, bass: 0, air: 0 };

  /* Smoothing coefficients. Attack is quicker than release so the
     artifact responds to a hit but decays like a room, not a gate. */
  const ATTACK = 0.34;
  const RELEASE = 0.07;

  const Vitrine = {
    el: null,
    art: null,
    fields: {},

    // Audio graph
    ctx: null,
    analyser: null,
    source: null,
    freq: null,
    audioEl: null,
    analyserFailed: false,

    // Animation
    raf: null,
    current: { energy: 0, bass: 0, air: 0 },
    target: { energy: 0, bass: 0, air: 0 },
    awake: false,

    /* ------------------------------------------------------
       LIFECYCLE
    ------------------------------------------------------ */

    init() {
      this.el = document.querySelector('[data-vitrine]');
      if (!this.el) return;

      this.art = this.el.querySelector('[data-vitrine-art]');
      this.fields = {
        catalog: this.el.querySelector('[data-vitrine-catalog]'),
        title: this.el.querySelector('[data-vitrine-title]'),
        bpm: this.el.querySelector('[data-vitrine-bpm]'),
        key: this.el.querySelector('[data-vitrine-key]'),
        mood: this.el.querySelector('[data-vitrine-mood]'),
      };

      this.el.classList.add('is-idle');
      this.bindEvents();
      this.loop();
    },

    bindEvents() {
      document.addEventListener('archive:trackchange', (e) => {
        const track = e.detail && e.detail.track;
        if (track) this.showArtifact(track);
      });

      document.addEventListener('archive:play', () => this.awaken());
      document.addEventListener('archive:pause', () => this.rest());
      document.addEventListener('archive:ended', () => this.rest());
    },

    /* ------------------------------------------------------
       ARTIFACT

       Swapping artwork is the one moment the vitrine is allowed
       a visible transition: a short cross-dissolve, no movement.
    ------------------------------------------------------ */

    showArtifact(track) {
      this.el.classList.add('is-loaded');

      if (this.art && track.image) {
        const next = new Image();
        next.onload = () => {
          this.art.src = track.image;
          this.art.alt = track.title || 'Artifact';
        };
        next.src = track.image;
      }

      this.setText(
        this.fields.catalog,
        track.archive ? `Accession ${track.archive}` : 'Accession pending'
      );
      this.setText(this.fields.title, track.title || '');
      this.setText(this.fields.bpm, track.bpm ? `${track.bpm} BPM` : '');
      this.setText(this.fields.key, track.key || '');
      this.setText(this.fields.mood, track.mood || '');
    },

    setText(node, value) {
      if (node) node.textContent = value;
    },

    /* ------------------------------------------------------
       STATE
    ------------------------------------------------------ */

    awaken() {
      this.awake = true;
      this.el.classList.add('is-awake');
      this.el.classList.remove('is-idle');
      this.connectAnalyser();
    },

    rest() {
      this.awake = false;
      this.el.classList.remove('is-awake');
      this.el.classList.add('is-idle');
      this.target = Object.assign({}, REST);
    },

    /* ------------------------------------------------------
       ANALYSER
    ------------------------------------------------------ */

    connectAnalyser() {
      if (this.analyser || this.analyserFailed) return;

      const player = window.ArchiveOS && window.ArchiveOS.getModule('player');
      const audio = player && typeof player.getAudioElement === 'function' ? player.getAudioElement() : null;

      if (!audio || !audio.src) return;

      // Resume a suspended context on the user gesture that started playback.
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      if (this.analyser) return;

      this.audioEl = audio;
      this.probeCors(audio.src)
        .then((ok) => {
          if (!ok) throw new Error('cors');
          this.attach(audio);
        })
        .catch(() => {
          this.analyserFailed = true;
          if (window.ArchiveOS && window.ArchiveOS.debug) {
            console.info('[Vitrine] Analyser unavailable (CORS). Falling back to synthetic envelope — audio is unaffected.');
          }
        });
    },

    /**
     * Ask for a single byte. Success proves the response carries
     * Access-Control-Allow-Origin, which is the only thing that
     * decides whether the analyser will silence the track.
     */
    probeCors(url) {
      return fetch(url, { method: 'GET', mode: 'cors', headers: { Range: 'bytes=0-0' } })
        .then((r) => r.ok || r.status === 206)
        .catch(() => false);
    },

    attach(audio) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) {
        this.analyserFailed = true;
        return;
      }

      try {
        audio.crossOrigin = 'anonymous';
        this.ctx = this.ctx || new Ctx();

        this.source = this.ctx.createMediaElementSource(audio);
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 512;
        this.analyser.smoothingTimeConstant = 0.72;

        this.source.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);

        this.freq = new Uint8Array(this.analyser.frequencyBinCount);

        if (this.ctx.state === 'suspended') this.ctx.resume();
      } catch (err) {
        this.analyserFailed = true;
      }
    },

    /**
     * Reads the spectrum into three bands.
     * With fftSize 512 at 44.1kHz each bin is ~86Hz, so:
     *   bins 0–5    ≈ 0–520Hz    sub + kick
     *   bins 6–40   ≈ 520–3500Hz body
     *   bins 41–128 ≈ 3.5k+      air
     */
    sample() {
      if (!this.analyser) return null;

      this.analyser.getByteFrequencyData(this.freq);

      const band = (from, to) => {
        let sum = 0;
        for (let i = from; i < to; i++) sum += this.freq[i];
        return sum / (to - from) / 255;
      };

      const bass = band(0, 6);
      const body = band(6, 40);
      const air = band(40, Math.min(128, this.freq.length));

      return {
        bass: Math.min(1, bass * 1.15),
        air: Math.min(1, air * 2.2),
        energy: Math.min(1, bass * 0.5 + body * 0.4 + air * 0.35),
      };
    },

    /**
     * When the analyser is unavailable we still want the artifact
     * to feel alive. Two slow detuned sines produce a wandering
     * envelope that never loops obviously — deliberately calm and
     * clearly not beat-synced, rather than faking accuracy.
     */
    synthesise() {
      const t = performance.now() / 1000;
      const slow = (Math.sin(t * 0.7) + 1) / 2;
      const slower = (Math.sin(t * 0.31 + 1.2) + 1) / 2;

      return {
        bass: 0.22 + slow * 0.34,
        air: 0.16 + slower * 0.2,
        energy: 0.34 + (slow * 0.5 + slower * 0.5) * 0.36,
      };
    },

    /* ------------------------------------------------------
       FRAME LOOP
    ------------------------------------------------------ */

    loop() {
      const tick = () => {
        if (this.awake) {
          this.target = this.sample() || this.synthesise();
        }

        let moved = false;

        for (const key of ['energy', 'bass', 'air']) {
          const to = this.target[key] || 0;
          const from = this.current[key];
          const rate = to > from ? ATTACK : RELEASE;
          const next = from + (to - from) * rate;

          if (Math.abs(next - from) > 0.0005) {
            this.current[key] = next;
            moved = true;
          } else if (next !== from) {
            this.current[key] = to;
            moved = true;
          }
        }

        if (moved) {
          this.el.style.setProperty('--v-energy', this.current.energy.toFixed(3));
          this.el.style.setProperty('--v-bass', this.current.bass.toFixed(3));
          this.el.style.setProperty('--v-air', this.current.air.toFixed(3));
        }

        this.raf = requestAnimationFrame(tick);
      };

      this.raf = requestAnimationFrame(tick);
    },
  };

  /* Register with ArchiveOS if it is present (it boots modules on
     DOMContentLoaded); otherwise stand alone. */
  if (window.ArchiveOS) {
    window.ArchiveOS.register('vitrine', Vitrine);
  } else {
    document.addEventListener('DOMContentLoaded', () => Vitrine.init());
  }

  window.ArchiveVitrine = Vitrine;
})();
