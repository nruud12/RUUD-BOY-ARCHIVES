# ArchiveOS — Single Source of Truth

**RUUD BOY ARCHIVES** · Horizon-based Shopify theme

This document holds the vision and the design system — what the archive is,
the language it speaks, the rules it obeys, and how it is built. It is the
reference the other three documents defer to.

It deliberately contains **no status and no task lists**. Those live
elsewhere, so that principles stay stable while work moves:

| Document | Holds |
|---|---|
| **`ARCHIVEOS.md`** | Principles, voice, design rules, architecture |
| [`ROADMAP.md`](./ROADMAP.md) | Future work |
| [`CHANGELOG.md`](./CHANGELOG.md) | Completed work |
| [`BACKLOG.md`](./BACKLOG.md) | Known issues and deferred cleanup |

If the code and this document disagree, one of them is wrong and the
disagreement should be resolved rather than worked around.

---

## What this is

A redesign of the stock Horizon theme into a dark, restrained "digital
museum" — premium, cinematic, minimal. Not a Shopify storefront, not
BeatStars, not a gaming interface.

Horizon remains the foundation. Nothing was rebuilt from scratch. Sections,
blocks, the theme editor and all commerce behaviour are intact; what changed
is the skin, the hierarchy, and a handful of things that were structurally
broken.

**Design reference points:** Apple Music, Spotify Editorial, a contemporary
art museum, a luxury watch site, a sci-fi archive. Deliberately *not*
cyberpunk.

### The one idea

> **The music awakens the artifact.**

The display case is permanent. Idle, it is nearly dormant — a slow drift and
a faint glow. When a beat plays, light travels through the object's
fractures. The geometry barely moves; **light responds, not shape**. On pause
the room goes quiet again.

Everything else on the page exists to support that.

---

## Voice

The site is a **classified museum archive**, not an online store. A visitor
is consulting holdings, not browsing products.

**Register: institutional archival, with restricted accents.**

The baseline voice is dry, precise and curatorial — the tone of a catalogue
card, not a sales page. Language of restriction and clearance is held back
for genuinely gated moments: unavailable holdings, exclusive terms, anything
requiring an account. Used everywhere, it becomes cyberpunk, which the design
brief explicitly rules out.

**The rule of thumb:** an archive describes and permits. A store sells and
persuades. If a line is persuading, it is wrong.

### The lexicon

Left column is what the concept is. Never use the "avoid" column on a
visitor-facing surface.

| Concept | Use | Avoid |
|---|---|---|
| The item for sale | artifact | product, beat, item, track |
| The whole catalogue | the holdings | catalog, shop, store, inventory |
| Catalogue number | Archive 0417 | Accession, SKU, product ID |
| No number assigned | Archive — | N/A, Unnumbered |
| Previewing audio | audition | preview, play, listen, demo |
| Currently playing | now sounding | now playing |
| The transport deck | audition console | player, transport deck, widget |
| The display case | the case / the vitrine | hero, banner, showcase |
| Browsing the grid | the reading room | shop, browse, collection page |
| Purchase terms | terms of access | licensing, pricing options |
| A tier | access tier | variant, option |
| Unavailable | withdrawn from circulation | sold out, unavailable |
| Unattributed work | unattributed artifact | unknown, untitled |
| Metadata: mood | Character | Mood, Vibe |
| Metadata: type | Classification | Type, Genre, Category |
| Metadata: length | Runtime | Duration, Length |
| Metadata: tempo | Tempo | BPM as a label (fine as a unit) |
| Metadata: key | Key | — |

### Commerce language

Everything around the transaction is reframed. **The final action is not.**

Shopify's checkout cannot be reworded from the theme, so a visitor who has
been reading "requisition" for five screens would land on a stock checkout
saying "Pay now". Keeping the last step legible avoids that cliff — and a
buyer who hesitates at the button costs more than the illusion gains.

- **Keep plain:** "Add to cart", "Check out", anything inside checkout
- **Reframe freely:** everything else — headings, empty states, filters,
  status, navigation, metadata labels

### Writing rules

**Describe, don't sell.** "Catalogued 2026. Transferred at 96kHz." Not
"Premium quality, industry standard."

**No exclamation marks. No second-person urgency.** An archive does not say
"Grab yours before it's gone."

**Sentence case for prose, uppercase reserved for labels** — and uppercase
gets its authority from letter-spacing (`--archive-track-label`), not from
volume.

**Numbers are precise.** "Archive 0417", not "one of our newest". Precision
is the whole aesthetic.

**Empty states describe the state, not the fix.** "No artifact in the case"
before "Select an artifact from the holdings" — the archive is not eager.

**Accessibility outranks voice.** `aria-label` values stay literal where a
screen-reader user needs the plain meaning: "Play", "Pause", "Mute". A
visitor who cannot see the case should not have to decode archival metaphor
to operate the console.

### Where the voice lives

The lexicon applies to every visitor-facing surface the theme controls.

`locales/en.default.json` holds a further set of storefront-voiced strings
belonging to Horizon rather than to ArchiveOS. That file is **JSONC**, not
JSON — it contains `//` line comments — and is marked auto-generated, so
Shopify's language editor may overwrite it. Any tooling that rewrites it must
preserve the comments and the banner.

---

## Design rules

**Colour.** The archive is almost entirely dark. Accent is a *light source*,
not a paint. If more than ~5% of a viewport is magenta, something has gone
wrong. Cyan is reserved almost exclusively for "this is the artifact
currently sounding".

**Type.** Two families. Raleway for display, always uppercase — the
*tracking* (`--archive-track-*`) is what reads as museum, not the typeface
itself. Inter for body and metadata. Hierarchy: monument → display → title →
heading → body → micro.

**Space, not decoration.** Separation between ideas comes from
`--archive-space-*` and nothing else. Borders were removed nearly
everywhere; the few that remain exist because glass has edges.

**Motion.** 200–300 ms, `cubic-bezier(0.22, 0.61, 0.36, 1)`. Ease-out, no
overshoot, no bounce, no exaggerated scale. Cards lift 4px and stop. Ambient
motion is measured in tens of seconds — the idle drift is ±7° over 96s, the
vitrine's fracture rotation is 90s.

**Accessibility.** The interface disappears visually, never functionally.
Focus is the one place the accent is allowed to shout. `prefers-reduced-motion`
is honoured in tokens *and* per-component — the case still lights up, because
light is information here, but nothing drifts, travels or breathes.

**Performance.** No JavaScript libraries added. Two font families in one
request. All animation is CSS.

---

## Architecture

### Style cascade

Load order is load-bearing (`snippets/stylesheets.liquid`):

```
1. archive-tokens.css    values only
2. archive-shell.css     the room (canvas, nav, footer, reading room)
3. archive-card.css      artifact cards
4. archive-deck.css      the expanded product deck
5. archive-vitrine.css   the homepage display case
6. archive-player.css    the transport deck
```

`ruud-player.css` (27 KB, legacy) is **no longer loaded**.

### Artifact state

Two laws govern the current artifact. The first says who owns it. The second
says how it gets there.

---

#### Law I — One artifact, three views

> An artifact may have many representations.
> It has exactly one runtime identity.
> Every representation observes that identity.
> No representation stores its own copy.
> No representation invents a default.
> Every interaction acts upon the shared artifact.
> If two views disagree, the implementation is wrong.

The runtime identity is `currentTrack` in `archive-core.js`, written in
exactly one place — `archive-player.js`, inside `load()`.

The case, the wall label and the console are representations. So is an
artifact card, and so is the Expanded Deck. None of them owns the artifact.

**In practice.** A view that needs the current identity **derives** it.
`CardUI.activeId` is a getter over `currentTrack`, not a field. It cannot
drift, because it does not remember.

A view needs no memory of what it last rendered. If a view seems to need one,
the information it is missing is almost always a property of the *transition*
rather than of the artifact — and a transition has a caller who already knows.
Put it on the event. `archive:trackchange` carries `seated` for exactly this
reason: the case must tell a seating from an exchange, and being told costs
nothing, whereas inferring it would mean holding an id that could go stale.

**The DOM is a rendering, not state.** A view may write to it freely and read
back what it wrote *within a single operation*. It may not consult rendered
output to answer a question about the state machine. Reading an attribute to
decide whether to animate is the second thing wearing the clothes of the
first.

---

#### Law II — Declaration and seating

> A section may **declare** an artifact.
> Seating it into state is what makes it real.

A template says which artifact it displays by emitting the shared record
(`snippets/archive-track-record.liquid`) and marking itself
`data-archive-artifact`. That is a declaration. It is inert.

At boot, `archive-card-ui.js` reads the first declaration on the page and
seats it — `player.load(track, { seated: true })` — which writes
`currentTrack` and emits `archive:trackchange`. Only then does the artifact
exist at runtime, and only then may any view render it.

**Why the distinction is load-bearing:**

Server-rendered markup is the *first frame* of the declaration, not a
competing answer. The vitrine paints its artifact in Liquid so the case is
never empty while JavaScript starts, and `data-track-id` on the section names
the declared artifact permanently — it is not updated on exchange, because it
was never a record of what is on display.

Seating **defers**. `seatDisplayedArtifact()` does nothing if something is
already loaded: a queue advance or a restored session outranks a page default.
A declaration is a proposal, not a claim.

Seating is **flagged**, and every view is entitled to know. A seating is the
archive stating what this page shows; an exchange is the visitor changing it.
The case relights for one and not the other, and the console paints a seating
instantly rather than morphing into agreement with the other two views.
Without the flag, every page load would darken and relight the case for a
piece that never left, and the console would appear to catch up.

##### Boot has two phases

`ArchiveOS.boot()` runs every module's `init()`, then every module's
`ready()`.

```
init()   claim your DOM, bind listeners.  Write no state. Emit nothing.
ready()  everyone is listening.           Only now may a declaration be seated.
```

Seating emits `archive:trackchange`. If it happens during `init()`, only the
modules registered *before* the seater ever hear it — and registration order
is the order of `<script>` tags in `snippets/scripts.liquid`, a delivery
detail that must never be load-bearing.

This was a live defect. `archive-vitrine.js` registers after
`archive-card-ui.js`, so the case never received the seating of the artifact
it exists to display. It looked correct only because Liquid had painted the
same artifact. **Agreement by coincidence is indistinguishable from agreement
by design, right up until it is not.**

##### A view may not assert what it cannot know

The console renders in `layout/theme.liquid`. The artifact is declared by a
*section*, and Liquid gives the layout no way to see into one. So the server
genuinely does not know whether a page has an artifact, and the console must
not pretend otherwise.

It ships `is-unseated` — which asserts nothing — and boot resolves it to
exactly one of two answers: the seated artifact, or a real `is-empty`. It
previously shipped `is-empty` with "No artifact in the case" hardcoded, which
was false on every page that declares one: the case displayed an artifact
while the console denied there was one, in the server response, before any
script ran.

The empty copy still lives in the markup. Under `is-unseated` the identity
column is `display: none`, so it is neither visible nor in the accessibility
tree — present, but not claimed. **Withholding is not the same as denying.**

---

**A useful test for both laws.** If a test can fabricate a state where one
view disagrees with another, the disagreement is expressible in production
too. When the mirrors were removed, two suites failed precisely because they
had been assigning a view's identity directly — a state that can no longer
exist.

`tests/proof-seating.js` holds both laws to 43 assertions: run it with
`node tests/proof-seating.js`. It boots the real modules against a minimal DOM
stub, so it fails if either law is weakened. `tests/` is not a Shopify theme
directory and is not uploaded by `shopify theme push`.

**The harness must not choose the load order.** It loads modules in the order
`snippets/scripts.liquid` does and boots through `ArchiveOS.boot()` — never by
calling `init()` by hand. An earlier version called `Vitrine.init()` before
`CardUI.init()`, an order the theme never produces, and that is precisely what
hid the boot race above. A harness that tests an arrangement production cannot
reach proves nothing about production. The same applies to markup: the harness
builds the console with the copy Liquid actually ships.

### Runtime

ArchiveOS is a small module registry with an event bus on `document`.
Modules register with `ArchiveOS.register(name, module)` and are booted on
`DOMContentLoaded`.

```
archive-core.js      state + event bus + boot        (owns nothing else)
archive-player.js    the <audio> element, playback   (never touches DOM)
archive-ui.js        the transport deck UI
archive-card-ui.js   card interaction + active state
archive-vitrine.js   the display case
```

Events: `archive:trackchange` · `archive:play` · `archive:pause` ·
`archive:timeupdate` · `archive:ended`

The vitrine and the cards **never talk to each other**. Both listen to the
bus. Adding a third surface later (a sticky catalogue vitrine, etc.) means
listening to the same events — no rewiring.

### How the vitrine reacts to audio

`archive-vitrine.js` publishes exactly three numbers per frame:

| Property | Band | Drives |
|---|---|---|
| `--v-energy` | full spectrum | overall glow, artwork brightness/saturation |
| `--v-bass` | 0–520 Hz | fracture-line intensity, floor bounce, plinth |
| `--v-air` | 3.5 kHz+ | rim light along the top edge of the glass |

The JS writes only those three custom properties. **All** animation is CSS,
so it stays on the compositor. Attack (0.34) is faster than release (0.07)
so the artifact responds to a hit but decays like a room rather than a noise
gate.

#### The CORS problem — read before touching the analyser

`createMediaElementSource()` **permanently** routes an `<audio>` element
through the Web Audio graph. If the media is CORS-tainted, the graph outputs
**silence**, and the node cannot be detached back to a working state. There
is no recovery.

So the analyser is never attached optimistically. The controller first makes
a 1-byte ranged `fetch` against the audio URL. Only if that succeeds —
proving the CDN sends `Access-Control-Allow-Origin` — does it attach.

If the probe fails, the vitrine falls back to a **synthetic envelope**: two
slow detuned sines producing a wandering, obviously-not-beat-synced pulse.
The artifact still feels alive, and **the audio plays completely
untouched**.

This is the difference between "the glow is less accurate" and "the site
has no sound". Do not remove the probe.

### Metafield namespace

Artifact metadata lives under the `custom` namespace, not `product`:

```
custom.archive    custom.bpm       custom.key
custom.mood       custom.type      custom.duration
custom.audio_preview   (file_reference)
```
