# Backlog

Known issues and deferred cleanup on RUUD BOY ARCHIVES.

Principles and the design system live in [`ARCHIVEOS.md`](./ARCHIVEOS.md).
Completed work lives in [`CHANGELOG.md`](./CHANGELOG.md). Planned work lives in
[`ROADMAP.md`](./ROADMAP.md).

---

## Known issues

### Licence swatch renders magenta

The selected access tier on the Expanded Deck fills with a solid magenta
gradient instead of the intended quiet `archive-surface` background and cyan
edge. The roman-numeral counter renders correctly, which points at a leftover
magenta swatch value in the Shopify admin variant configuration — the same
class of leftover-demo-colour issue already cleaned out of the footer — rather
than a CSS defect. Verify against the product's variant and option settings
before touching stylesheets.

### "Your privacy choices" in the footer

Legally required, and the one remaining footer element that reads as a store
rather than an archive. Left deliberately.

### Footer utilities row unverified

The lower row — copyright, policy links, social — sits below the fold and has
not been visually confirmed.

---

## Deferred cleanup

Verified during Sprint 1A to have **zero load references** — no `asset_url`,
`stylesheet_tag` or `src=` anywhere in the theme reaches these files, except
where noted. **Not launch blockers.**

Baseline commit for the original findings: `bf0b6f0`. All are still present.

### Confirmed obsolete — safe to delete

Reversible via `git checkout bf0b6f0 -- <file>`.

**Stale transport-deck implementations (~37 KB)** — five dead variants of the
deck rebuilt in Sprint 1:

| File | Size |
|---|---|
| `assets/ruud-player-backup.js` | 14.1 KB |
| `assets/archive-ui.backup.js` | 10.2 KB |
| `assets/ruud-player 2.js` | 4.6 KB |
| `assets/archive-ui-old.js` | 4.8 KB |
| `assets/archive-player-ui.js` | 1.9 KB |
| `assets/archive-player-v2.css` | 0 B |

**Token pair (~9.8 KB)** — delete together or not at all:

| File | Size | Note |
|---|---|---|
| `assets/archive-design.css` | 1.6 KB | Not loaded. Defines 21 unprefixed tokens |
| `assets/archive-card-old.css` | 8.2 KB | The *only* consumer of those tokens (26 refs) |

Those 21 tokens — `--space-1..7`, `--radius-sm/md/lg/round`,
`--shadow-rest/hover`, `--ease`, `--speed-fast/normal/slow`, `--font-display`,
`--font-body`, `--play-button-size`, `--blur-md` — are **undefined in the live
cascade**. Loading `archive-card-old.css` without first restoring them would
render it nearly unstyled.

**Superseded card and core layers (~8.5 KB):**

| File | Size | Note |
|---|---|---|
| `assets/archive-card.css.superseded` | 4.8 KB | The triple-`__meta` duplication behind the original card bug |
| `assets/archive-commerce-old.js` | 2.2 KB | |
| `assets/archive-core-old.js` | 1.5 KB | Stale twin of the event bus the player depends on |

**Total: ~55 KB across 11 files.**

```bash
cd ~/RUUD-BOY-ARCHIVES
git rm "assets/archive-card-old.css" \
       "assets/archive-design.css" \
       "assets/archive-ui.backup.js" \
       "assets/ruud-player-backup.js" \
       "assets/ruud-player 2.js" \
       "assets/archive-ui-old.js" \
       "assets/archive-core-old.js" \
       "assets/archive-commerce-old.js" \
       "assets/archive-player-ui.js" \
       "assets/archive-player-v2.css" \
       "assets/archive-card.css.superseded"
git commit -m "Post-launch cleanup: remove superseded assets (~55 KB)"
```

Three comments become false the moment these are gone — fix in the same
commit:

- `assets/archive-card.css:12` — *"kept as archive-card.css.superseded for reference"*
- `snippets/stylesheets.liquid` — *"Do NOT load archive-card-old.css without first restoring those 21 values"*
- `assets/archive-tokens.css:18` — historical note referencing `archive-design.css`

### Preserved deliberately — do not delete

| File | Why it stays |
|---|---|
| `assets/archive-card.js` | Deliberate 529 B guard stub. Its comment states it exists so a stale `asset_url` reference resolves harmlessly rather than 404ing |
| `snippets/ruud-global-player.liquid` | Reference implementation the Expanded Deck was checked against. Has unbalanced markup; do not render |

### Uncertain — decide before touching

| File | Size | Question |
|---|---|---|
| `assets/archive-effects.js` | 14.4 KB | Referenced in `snippets/scripts.liquid` but inside a `{% comment %}` block. Shelved or abandoned? |
| `snippets/ruud-global-player.backup.liquid` | — | A backup of a file itself kept as reference. Third copy of the retired player |
| `archive-preview.html` | 14.3 KB | Standalone preview at repo root, not part of the theme. Since joined by `archive-deck-preview.html`, `archive-deck-product-preview.html` and `archive-vitrine-preview.html` — same question applies to all four |
| `assets/package.json` | 23 B | Unreferenced. Configures editor tooling but ships to the Shopify CDN |
| `assets/jsconfig.json` | 345 B | As above |

### Inert code still loading on every page

Not dead files — live `<script>` tags doing nothing. Two requests per page
view. Unloading is a comment-out, not a deletion.

| File | Size | Why inert |
|---|---|---|
| `assets/archive-visual-engine.js` | 1.5 KB | Targets `.ruud-player-artwork`, which appears in **zero** liquid files |
| `assets/archive-audio-engine.js` | 5.6 KB | Expects `window.globalAudio`, which no longer exists |

`archive-audio-engine.js` also contains a `createMediaElementSource()` call,
guarded by `if (!window.globalAudio) return;`. Inert today, but a landmine if
anything ever defines that global — see the analyser note in
[`ARCHIVEOS.md`](./ARCHIVEOS.md).

Folding both into `archive-vitrine.js` is the cleaner end state.

### Resolved — `ruud-player.css`

The load-bearing assumption ("a handful of its rules still reach
product/collection pages") was checked, found true and harmful — it was
compositing artifact metadata invisible on live cards — and the tag was
removed from `snippets/stylesheets.liquid`. The 27 KB file still sits
unreferenced in `assets/` and belongs in a future pass of the section above.

### Repo hygiene

- `.DS_Store` and `assets/.DS_Store` are tracked and not yet ignored
- `.claude/CLAUDE.md`, `COMPONENTS.md`, `DECK.md`, `DESIGN.md`, `MOTION.md`,
  `PROJECT.md`, `ROADMAP.md` and the root `CLAUDE.md` are all 0 bytes — never
  filled in. Delete or leave as inert placeholders
