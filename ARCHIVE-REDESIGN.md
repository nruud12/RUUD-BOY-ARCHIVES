# ArchiveOS — Design System & Structural Notes

**RUUD BOY ARCHIVES** · Horizon-based Shopify theme
Pass 1 of 3: **Foundation + Homepage**

---

## What this is

A redesign of the existing Horizon theme into a dark, restrained "digital museum" —
premium, cinematic, minimal. Not a Shopify storefront, not BeatStars, not a
gaming interface.

Horizon remains the foundation. Nothing was rebuilt from scratch. Sections,
blocks, the theme editor and all commerce behaviour are intact; what changed is
the skin, the hierarchy, and a handful of things that were structurally broken.

**Design reference points:** Apple Music, Spotify Editorial, a contemporary art
museum, a luxury watch site, a sci-fi archive. Deliberately *not* cyberpunk.

---

## The one idea

> **The music awakens the artifact.**

The display case is permanent. Idle, it is nearly dormant — a slow drift and a
faint glow. When a beat plays, light travels through the object's fractures.
The geometry barely moves; **light responds, not shape**. On pause the room goes
quiet again.

Everything else on the page exists to support that.

---

## File map

### New

| File | Role |
|---|---|
| `assets/archive-tokens.css` | Every colour, type, space, motion and elevation value. `:root` only — no selectors. |
| `assets/archive-shell.css` | The room: canvas, typography, navigation, and the de-Shopify layer. |
| `assets/archive-vitrine.css` | The display case. |
| `assets/archive-vitrine.js` | Vitrine controller — audio analysis → CSS custom properties. No dependencies. |
| `sections/archive-vitrine.liquid` | The display case section. |
| `sections/archive-room-title.liquid` | Small reusable wall caption (eyebrow / title / link). |

### Rewritten

| File | Why |
|---|---|
| `assets/archive-card.css` | Contained **three** duplicated `.archive-card__meta` blocks silently overriding each other. |
| `assets/archive-card-ui.js` | Only listened for state; nothing ever *started* playback. Now owns card interaction. |
| `snippets/ruud-audio-player.liquid` | Was a second, competing play button. Now a pure JSON data carrier, no UI. |
| `templates/index.json` | Rebuilt around the vitrine; inherited Savor demo content removed. |

### Retired (kept on disk, no longer loaded)

- `assets/archive-design.css` — superseded by `archive-tokens.css`
- `assets/archive-card.css.superseded` — the old card styles
- `snippets/ruud-global-player.liquid` — no longer rendered (see below)

---

## Bugs fixed along the way

These were pre-existing and would have undermined any redesign layered on top.

**1. Raw CSS was being emitted after `</html>`**
`layout/theme.liquid` had ~110 lines of design tokens appended past the closing
tag — outside any `<style>` element and missing its `:root {` opener. Browsers
were parsing it as stray text in the document. Removed; the values now live in
`archive-tokens.css`.

**2. The card hover overlay was outside the card**
In `snippets/product-card.liquid`, `.archive-card__overlay` sat *after*
`</product-card>`, so `.archive-card:hover .archive-card__overlay` could never
match and the play button rendered as a loose element at the end of every card.
Moved inside, into a new `.archive-card__media` wrapper.

**3. The card overlay was unclickable even once moved**
`.product-card__link` is absolutely positioned across the whole card. The
overlay now carries `z-index: 3`, and clicks are intercepted in the **capture**
phase so auditioning a beat never navigates to the product page.

**4. Metafields read from a namespace that does not exist**
The card read `product.metafields.product.archive_number`, `…product.bpm`, etc.
The actual definitions are in the `custom` namespace:

```
custom.archive    custom.bpm       custom.key
custom.mood       custom.type      custom.duration
custom.audio_preview   (file_reference)
```

Because `archive_number` was always blank, the archive number and the NOW
PLAYING marker were **never rendered on any card**. Corrected.

**5. Nothing in the theme ever called `player.load()`**
The playback module was complete and correct, but no code path reached it —
clicking a card could only navigate. `archive-card-ui.js` now wires the two
together.

**6. `assets/archive-card.js` was a syntax landmine**
It contained one orphaned line, `card.classList.add("is-playing");`, with no
surrounding scope — a guaranteed `ReferenceError` if it were ever loaded. It
isn't loaded, so this was latent. Emptied to a documented stub.

**7. Two players were rendering at once**
`layout/theme.liquid` rendered both `ruud-global-player` and `archive-player`.
`ruud-global-player` has unbalanced markup (a stray `</div>` in the transport
block, an unclosed `.ruud-player-controls`) and its controller `ruud-player.js`
is commented out in `scripts.liquid` — so it was dead weight painting a broken
second deck over the page. Only `archive-player` renders now.

---

## Architecture

### Style cascade

Load order is load-bearing (`snippets/stylesheets.liquid`):

```
1. archive-tokens.css    values only
2. archive-shell.css     the room
3. archive-card.css      artifact cards
4. archive-vitrine.css   the display case
5. archive-player.css    the transport deck
```

### Runtime

ArchiveOS is a small module registry with an event bus on `document`.
Modules register with `ArchiveOS.register(name, module)` and are booted on
`DOMContentLoaded`.

```
archive-core.js      state + event bus + boot        (owns nothing else)
archive-player.js    the <audio> element, playback   (never touches DOM)
archive-ui.js        the transport deck UI
archive-card-ui.js   card interaction + active state   ← rewritten
archive-vitrine.js   the display case                  ← new
```

Events: `archive:trackchange` · `archive:play` · `archive:pause` ·
`archive:timeupdate` · `archive:ended`

The vitrine and the cards **never talk to each other**. Both listen to the bus.
Adding a third surface later (the catalogue's sticky vitrine, the product page)
means listening to the same events — no rewiring.

---

## How the vitrine reacts to audio

`archive-vitrine.js` publishes exactly three numbers per frame:

| Property | Band | Drives |
|---|---|---|
| `--v-energy` | full spectrum | overall glow, artwork brightness/saturation |
| `--v-bass` | 0–520 Hz | fracture-line intensity, floor bounce, plinth |
| `--v-air` | 3.5 kHz+ | rim light along the top edge of the glass |

The JS writes only those three custom properties. **All** animation is CSS, so
it stays on the compositor. Attack (0.34) is faster than release (0.07) so the
artifact responds to a hit but decays like a room rather than a noise gate.

### The CORS problem — read before touching the analyser

`createMediaElementSource()` **permanently** routes an `<audio>` element through
the Web Audio graph. If the media is CORS-tainted, the graph outputs **silence**,
and the node cannot be detached back to a working state. There is no recovery.

So the analyser is never attached optimistically. The controller first makes a
1-byte ranged `fetch` against the audio URL. Only if that succeeds — proving the
CDN sends `Access-Control-Allow-Origin` — does it attach.

If the probe fails, the vitrine falls back to a **synthetic envelope**: two slow
detuned sines producing a wandering, obviously-not-beat-synced pulse. The
artifact still feels alive, and **the audio plays completely untouched**.

This is the difference between "the glow is less accurate" and "the site has no
sound". Do not remove the probe.

---

## Design rules

**Colour.** The archive is almost entirely dark. Accent is a *light source*, not
a paint. If more than ~5% of a viewport is magenta, something has gone wrong.
Cyan is reserved almost exclusively for "this is the artifact currently
sounding".

**Type.** Two families. Raleway for display, always uppercase — the *tracking*
(`--archive-track-*`) is what reads as museum, not the typeface itself. Inter
for body and metadata. Hierarchy: monument → display → title → heading → body →
micro.

**Space, not decoration.** Separation between ideas comes from
`--archive-space-*` and nothing else. Borders were removed nearly everywhere;
the few that remain exist because glass has edges.

**Motion.** 200–300 ms, `cubic-bezier(0.22, 0.61, 0.36, 1)`. Ease-out, no
overshoot, no bounce, no exaggerated scale. Cards lift 4px and stop. Ambient
motion is measured in tens of seconds — the idle drift is ±7° over 96s.

**Accessibility.** The interface disappears visually, never functionally. Focus
is the one place the accent is allowed to shout. `prefers-reduced-motion` is
honoured in tokens *and* per-component — the case still lights up, because light
is information here, but nothing drifts, travels or breathes.

**Performance.** No JavaScript libraries added. Two font families in one
request. All animation is CSS.

---

## Homepage composition

```
archive-vitrine        full viewport, wordmark + display case + wall label
archive-room-title     "The Collection / Recently catalogued"
product-list           4-up grid, 8 artifacts, no price, no badges
```

Card captions are no longer assembled from theme blocks. The gallery block is
the only child of `_product-card`; the archive number, title and metadata are
rendered by `snippets/product-card.liquid` from the `custom` namespace.

Removed from the old homepage: the Savor food-brand story section ("A Family
Tradition of Bold, Fresh Flavor"), the `#39ff14` lime-green product grid
background, and magenta price labels.

---

## Still to do

**Pass 2 — Catalogue & product page**

- Sticky vitrine at the top of the catalogue; selecting a beat updates it in
  place without navigation (the event plumbing for this already exists)
- Filter bar restyled as archival facets (BPM / Key / Mood / Genre)
- Product page as album-release layout: large artwork, license tiers, related
  artifacts

**Pass 3 — The transport deck**

- Rebuild `archive-player` against the reference: waveform, queue, volume
- Delete `ruud-player.css` (27 KB, styles the retired markup) and the
  `ruud-global-player` snippet
- Prune the `*-old.js` / `*-backup.js` / `*.superseded` files once nothing
  references them

**Housekeeping**

`assets/` holds several dead files kept deliberately for now:
`archive-*-old.js`, `archive-ui.backup.js`, `ruud-player 2.js`,
`ruud-player-backup.js`, `archive-player-v2.css` (0 bytes),
`archive-effects.js` (commented out in `scripts.liquid`). Safe to delete once
pass 3 lands.

**Known open question:** `archive-audio-engine.js` still expects a global
`window.globalAudio` that no longer exists, and `archive-visual-engine.js`
targets `.ruud-player-artwork` inside the retired player. Both are inert but
still loaded — folding them into `archive-vitrine.js` is the cleaner end state.
