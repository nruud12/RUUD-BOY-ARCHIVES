# Roadmap

Future work on RUUD BOY ARCHIVES.

Principles and the design system live in [`ARCHIVEOS.md`](./ARCHIVEOS.md).
Completed work lives in [`CHANGELOG.md`](./CHANGELOG.md). Known issues and
deferred cleanup live in [`BACKLOG.md`](./BACKLOG.md).

---

## Before launch

### Responsive verification

Layouts are verified at 1440px only. Nothing below that width has been
inspected.

Three assumptions are load-bearing and are the ones most likely to give way as
the window narrows:

- the vitrine sizes the case by subtracting a fixed allowance from viewport
  height
- the audition console is a fixed-height fixed element
- the reading room grid assumes three columns

Review at 1280, 1024, 768, 430 and 390. Check the homepage hero, reading room,
Expanded Deck, console and footer at each.

### Accession numbers

`custom.archive` is unset on most products, so catalogue lines are omitted
rather than showing an identifier. Content, not code — populate the metafield
and identifiers appear everywhere automatically.

### Navigation vocabulary

Menu labels are Shopify content, not theme code
(*Admin → Content → Menus*):

- `Catalog` → **The Reading Room**
- `Contact` → **Enquiries**

"Enquiries" already matches the footer column, so this closes the vocabulary.

### Accessibility pass

Deferred during the console rebuild. New controls received `aria-label`s and a
live-updating play/pause label, but the following remain open:

- `aria-live` announcements on artifact change
- keyboard shortcuts (space, arrows) on the console
- focus-state audit across all rooms
- contrast audit at the faintest text tokens

---

## After launch

### Locale voice pass

`locales/en.default.json` — 295 strings, 103 of them storefront-voiced
(`Cart`, `Sold out`, `Continue shopping`, `Filters`, `Product details`). That
covers the header, cart drawer, search and facets.

Two constraints: the file is **JSONC**, not JSON — it contains `//` line
comments that a naive rewrite will destroy — and it is marked auto-generated,
so Shopify's language editor may overwrite it.

### Sticky vitrine on the catalogue

Selecting an artifact from the grid should update an in-place vitrine without
navigation. The event plumbing already exists on the bus; the surface does
not. Confirmed absent from `templates/collection.json` and the collection
section.

### Environmental rendering system

Unifying what are currently several independent implementations:

- **Glass material** — the vitrine's case, the artifact cards' audition
  button and the header each implement glass separately. One reusable
  material would replace all three
- **Environmental canvas** — a single faint fixed gradient sits behind the
  document while the vitrine builds its own room lighting independently; two
  systems doing one job
- **Motion tokens** — the scale exists (`--archive-speed-*`, `--archive-ease*`,
  ambient durations, all collapsing correctly under `prefers-reduced-motion`).
  Named states (reveal, illuminate, settle, withdraw) would map onto it rather
  than replace it

### Conditional catalogue feed

`snippets/archive-feed.liquid` renders on every page, including pages that
already have artifact cards and will never consult it — roughly 3 KB gzipped
of dead weight on the homepage and collection pages.

Safe by construction, since the queue prefers visible cards. The difficulty is
that Liquid cannot easily know whether the current template will render cards.
Either render the feed only on templates known to lack a grid (`product`,
`article`, `page`) by testing `template.name` in `layout/theme.liquid`, or move
it behind a section-rendering endpoint fetched on demand — which also removes
the 50-artifact cap.

### Reading room refinements

- Filter bar restyled as archival facets (BPM / key / character / genre)
- Empty states
- Related artifacts on the Expanded Deck — `product-recommendations` is
  preserved but still styled stock
