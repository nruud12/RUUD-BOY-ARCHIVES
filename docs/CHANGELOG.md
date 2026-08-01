# Changelog

Completed work on RUUD BOY ARCHIVES, most recent first.

Principles and the design system live in [`ARCHIVEOS.md`](./ARCHIVEOS.md).
Planned work lives in [`ROADMAP.md`](./ROADMAP.md). Known issues and deferred
cleanup live in [`BACKLOG.md`](./BACKLOG.md).

---

## Sprint 2 — Visual realisation

### Closing room (footer)

The last surface still speaking as a shop.

- `WE SEND TASTY EMAILS` in magenta Anton at poster scale → **Notices of new
  accessions**, set as a wall label like every other heading in the archive
- Column headings `SHOP / ASK / CONNECT` → **The Holdings / Enquiries /
  Elsewhere**
- Two filled bands removed — the footer sat on `#111111` and the utilities
  strip on `#2F2E2E`, the only places on the site where a section announced
  itself with a background colour
- Sign-up field: pill shape and magenta border replaced by a single ruled line
- Generous space above the footer so it reads as the end of the building

### Reading room (collection page)

- Stock portrait hero with a magenta `PRODUCTS` heading replaced by the
  archive's own room title — **The Holdings / The Reading Room**
- **Duplicate metadata removed.** Every card was rendering Horizon's block row
  (condensed title, BPM, struck-through prices) *above* the ArchiveOS record.
  The gallery is now the card's only block, matching the homepage
- Prices left the browsing room with that duplication — discovery happens
  without price tags; acquisition lives on the Expanded Deck
- Facet bar: filled band and 15px sentence-case interface type → archival
  labels at caption size with wide tracking
- Grid ran full-bleed, clipping artifacts against the window edge — now sits
  within the archive's measure
- Room title given header clearance when it opens a page

### Artifact card hover

- **Quick-add removed.** Hovering an artifact produced Horizon's "Choose
  options" chip, clipped at the card edge
- Hover previously dropped artwork to 55% brightness so the audition control
  would read against it — the artifact receded exactly as the visitor leaned
  in. Light now comes *up* instead
- Zoom halved, 1.03 → 1.015

### Homepage hero

- **The case is occupied on load.** A default artifact now sits in the vitrine
  rather than an empty lit case
- Case gained a faint backing board — the artifacts are near-black images and
  had no silhouette against a pure-black interior
- Case enlarged; height taken from the name plate, not from the room
- Monument reduced twice — from `--archive-type-monument` (two lines, 345px of
  an 828px viewport) to a quiet name plate. Size and contrast only; tracking
  preserved
- **The room stopped being magenta.** Seven separate magenta light sources
  were stacked — overhead wash, floor bounce, glass glow, core, plinth and
  fracture seams in three tones. Overhead light is now white, as a gallery's
  is; floor bounce white and fainter; glass glow cut to a third. Magenta
  survives only *inside* the artifact and in the bounce beneath it
- Fracture seams calmed from near-full opacity to just above the threshold of
  notice; rotation slowed 24s → 90s
- Catalogue numbers went neutral — they were magenta in the vitrine and cyan
  on the deck, two accents doing decorative work
- Complete exhibit now fits one screen: name plate, case, wall label, and the
  console beginning below it
- Wall label mounted close to the case rather than a full `--archive-space-xl`
  away
- Standfirst reduced to one line

### Audition console

- **Reads as furniture, not a toolbar.** The 1px rule across the top replaced
  by a short upward gradient so the deck rises out of the floor
- Rest opacity 0.72 → 0.42, returning to full on hover or focus
- Frosted glass removed — `backdrop-filter` was sampling and smearing whatever
  passed behind it, including the vitrine's wall label

### Expanded deck (product page)

- Layout owns presentation only; price, access tiers and add-to-cart render
  through Horizon's own blocks via `content_for` — cart, variant resolution
  and checkout untouched
- Golden-section split: case takes 61.8%, commerce 38.2%
- Access tiers presented as **editions** with faint roman numerals; selected
  edition lit by a single cyan edge rather than a heavier frame
- Purchase control rebuilt — full width, Raleway, quiet at rest, cyan light
  rising through it on hover
- Price stepped down from title scale, where it competed with the artifact
- Title set in Raleway — the deck had been rendering artifact titles in Inter
  while every other surface used the display face

### Empty accession lines

Unnumbered artifacts printed `Archive —` on every card in the grid. Repeated
across a room the dangling dash read as a fault. The line is now omitted
entirely — no placeholder text.

---

## Sprint 1 — Foundation and architecture

### Environment repairs

- **The whole site was rendering white.** `archive-shell.css` set the dark
  canvas on `.archive-os` (which is `<body>`), then four lines later included
  `.archive-os` again in a rule setting `background-color: transparent`. Same
  specificity, later wins
- **The waveform was invisible.** Horizon styles `input[type='range']`, which
  outranks a single class, so the scrubber painted a solid white bar over the
  waveform. The bars had been rendering correctly underneath the whole time
- **Card metadata was rendering white-on-white.** Two causes: `ruud-player.css`
  was still styling every card with an `#101010` box, 22px radius, magenta
  hover border, `!important` padding and an 18px backdrop blur; and the
  de-Shopify layer was dissolving the card background with `!important`,
  exposing white beneath
- **The theme was still on the Savor demo palette** — white background, black
  foreground, `#39FF14` lime accent. Root cause of the white surfaces and the
  lime facet bar

### Persistent player

- Auto-advance built. `archive:ended` fired and cleared state, but nothing
  played next — playback stopped dead after every artifact
- Queue added to `archive-card-ui.js`, which owns the DOM track list; the
  player module is contractually forbidden from touching the DOM
- Auto-advance does not wrap; explicit next/previous do
- Transport rebuilt: real SVG icons replacing `▶`/`❚❚` text glyphs, prev/next,
  volume and mute
- Artwork cross-dissolves between two layers with scale and blur; title fades,
  swaps at the midpoint, fades back
- Waveform scrubber — a deterministic fingerprint derived from the artifact's
  id, not spectrum analysis. The vitrine owns the only permitted
  `createMediaElementSource()` call; a second on the same element throws
- Rest state stopped showing `Nothing Playing · ARCH ---- · --- BPM`

### Expanded deck and shared record

- New `sections/archive-deck.liquid`, `templates/product.json` rewired
- **Artifact record extracted** to `snippets/archive-track-record.liquid` —
  one definition consumed by both the card path and the catalogue feed, so the
  two queue sources cannot drift
- Catalogue feed added as the queue's fallback for templates with no cards
- Cards versus hosts distinction introduced: the deck is
  `[data-archive-artifact]`, not `.archive-card`, so a product page doesn't
  collapse the queue to a single entry

### Foundation cleanup

- ~110 lines of design tokens were being emitted **after `</html>`**, outside
  any `<style>` element and missing their `:root {` opener. Verified lossless:
  of 33 tokens removed, 15 were re-homed and 18 had zero live references
- `ruud-player.css` (27 KB) unloaded — it styled retired markup and was
  actively breaking artifact cards
- A false claim corrected in `snippets/stylesheets.liquid`: it stated
  `archive-tokens.css` absorbed and aliased `archive-design.css`. Only 8 of 29
  tokens overlap
