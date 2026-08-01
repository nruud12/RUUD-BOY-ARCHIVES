# Voice — RUUD BOY ARCHIVES

The site is a **classified museum archive**, not an online store. A visitor is
consulting holdings, not browsing products.

**Register: institutional archival, with restricted accents.**

The baseline voice is dry, precise and curatorial — the tone of a catalogue
card, not a sales page. Language of restriction and clearance is held back for
genuinely gated moments: unavailable holdings, exclusive terms, anything
requiring an account. Used everywhere, it becomes cyberpunk, which the design
brief explicitly rules out.

**The rule of thumb:** an archive describes and permits. A store sells and
persuades. If a line is persuading, it is wrong.

---

## The lexicon

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

## Commerce language

Everything around the transaction is reframed. **The final action is not.**

Shopify's checkout cannot be reworded from the theme, so a visitor who has been
reading "requisition" for five screens would land on a stock checkout saying
"Pay now". Keeping the last step legible avoids that cliff — and a buyer who
hesitates at the button costs more than the illusion gains.

- **Keep plain:** "Add to cart", "Check out", anything inside checkout
- **Reframe freely:** everything else — headings, empty states, filters,
  status, navigation, metadata labels

## Writing rules

**Describe, don't sell.** "Catalogued 2026. Transferred at 96kHz." Not
"Premium quality, industry standard."

**No exclamation marks. No second-person urgency.** An archive does not say
"Grab yours before it's gone."

**Sentence case for prose, uppercase reserved for labels** — and uppercase gets
its authority from letter-spacing (`--archive-track-label`), not from volume.

**Numbers are precise.** "Accession 0417", not "one of our newest". Precision
is the whole aesthetic.

**Empty states describe the state, not the fix.** "No artifact in the case"
before "Select an artifact from the holdings" — the archive is not eager.

**Accessibility outranks voice.** `aria-label` values stay literal where a
screen-reader user needs the plain meaning: "Play", "Pause", "Mute". A visitor
who cannot see the case should not have to decode archival metaphor to operate
the console.

---

## Status

**Applied:** ArchiveOS surfaces — artifact cards, vitrine, room titles,
audition console, Expanded Deck.

**Not yet applied:** `locales/en.default.json` — 295 strings, 103 of them
storefront-voiced (`Cart`, `Sold out`, `Continue shopping`, `Filters`…).
Deferred to a second pass.

> That file is **JSONC**, not JSON — it contains `//` line comments. It is also
> marked auto-generated and may be overwritten by Shopify's language editor.
> Any tooling that rewrites it must preserve the comments and the banner.
