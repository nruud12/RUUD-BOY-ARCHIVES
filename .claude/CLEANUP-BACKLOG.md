# Cleanup Backlog — deferred to post-launch

Deferred by decision during Sprint 1A. **Do not action before launch.**

Everything here was verified during the Sprint 1A audit to have **zero load
references** — no `asset_url`, `stylesheet_tag`, or `src=` anywhere in the theme.
None of it reaches the browser. Leaving it in place costs nothing at runtime;
it is a developer-clarity and CDN-tidiness debt only.

Baseline commit for all findings below: `bf0b6f0`
(*Checkpoint: ArchiveOS redesign pass 1 before Sprint 1A cleanup*).

---

## 1. Confirmed obsolete — safe to delete

Verified unreferenced. All are present in `bf0b6f0`, so deletion is reversible
via `git checkout bf0b6f0 -- <file>`.

### Stale transport-deck implementations (~37 KB)

Highest-value group. The Expanded Deck rebuild happens in this exact namespace,
and five dead variants of the thing being rebuilt is an active trap.

| File | Size |
|---|---|
| `assets/ruud-player-backup.js` | 14.1 KB |
| `assets/archive-ui.backup.js` | 10.2 KB |
| `assets/ruud-player 2.js` | 4.6 KB |
| `assets/archive-ui-old.js` | 4.8 KB |
| `assets/archive-player-ui.js` | 1.9 KB |
| `assets/archive-player-v2.css` | 0 B (empty) |

### Token single-source-of-truth (~9.8 KB)

A **closed pair** — delete together or not at all.

| File | Size | Note |
|---|---|---|
| `assets/archive-design.css` | 1.6 KB | Not loaded. Defines 21 unprefixed tokens |
| `assets/archive-card-old.css` | 8.2 KB | The *only* consumer of those 21 tokens (26 refs) |

The 21 tokens — `--space-1..7`, `--radius-sm/md/lg/round`, `--shadow-rest/hover`,
`--ease`, `--speed-fast/normal/slow`, `--font-display`, `--font-body`,
`--play-button-size`, `--blur-md` — are **undefined in the live cascade**.
Loading `archive-card-old.css` without first restoring them would render it
nearly unstyled. See the comment block in `snippets/stylesheets.liquid`.

### Superseded card + core layers (~8.5 KB)

| File | Size | Note |
|---|---|---|
| `assets/archive-card.css.superseded` | 4.8 KB | The triple-`__meta` duplication that caused the original card bug |
| `assets/archive-commerce-old.js` | 2.2 KB | |
| `assets/archive-core-old.js` | 1.5 KB | Stale twin of the event bus the player depends on |

**Group total: ~55 KB across 11 files.**

### Command

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

### Follow-up required after deletion

Three comments become false the moment these files are gone. Fix in the same
commit — this is the exact defect class Sprint 1A Phase 1 existed to correct:

- `assets/archive-card.css:12` — *"kept as archive-card.css.superseded for reference"*
- `snippets/stylesheets.liquid` — *"Do NOT load archive-card-old.css without first restoring those 21 values"*
- `assets/archive-tokens.css:18` — historical note referencing `archive-design.css`

---

## 2. Preserved deliberately — do NOT delete

| File | Size | Why it stays |
|---|---|---|
| `assets/archive-card.js` | 529 B | Deliberate guard stub. Its comment states it exists so a stale `asset_url` reference resolves harmlessly instead of 404ing. Also carries the history of the orphaned-statement bug. |
| `snippets/ruud-global-player.liquid` | — | Kept per `ARCHIVE-REDESIGN.md` as the reference implementation for the Expanded Deck rebuild. Has unbalanced markup; do not render. |

---

## 3. Uncertain — decide before touching

| File | Size | Question |
|---|---|---|
| `assets/archive-effects.js` | 14.4 KB | Referenced in `snippets/scripts.liquid` but inside a `{% comment %}` block, so not loaded. Is this a shelved feature or abandoned? |
| `snippets/ruud-global-player.backup.liquid` | — | A backup of a file that is itself kept as a reference. Third copy of the retired player. |
| `archive-preview.html` | 14.3 KB | Standalone preview at repo root, not part of the theme. Still a live design reference? |
| `assets/package.json` | 23 B | Unreferenced. Configures editor tooling, but ships to the Shopify CDN. |
| `assets/jsconfig.json` | 345 B | Same as above. |

---

## 4. Inert code still loading on every page

**Not dead files — live `<script>` tags doing nothing.** Costs 2 requests per
page view. Unloading is a `scripts.liquid` comment-out, not a deletion.

| File | Size | Why inert |
|---|---|---|
| `assets/archive-visual-engine.js` | 1.5 KB | Targets `.ruud-player-artwork`, which appears in **zero** liquid files |
| `assets/archive-audio-engine.js` | 5.6 KB | Expects `window.globalAudio`, which no longer exists |

`ARCHIVE-REDESIGN.md` proposes folding both into `archive-vitrine.js` as the
cleaner end state.

---

## 5. Larger deferred item

`assets/ruud-player.css` — **27 KB, still loaded on every page.** Styles the
retired `#ruud-global-player` markup. Retained on the untested assumption that
"a handful of its rules still reach product/collection pages."

**That assumption has not been verified.** Confirming it means auditing which
of its selectors match live product/collection markup. If the assumption is
wrong, this is the single largest CSS win available — larger than all of
section 1 combined.

---

## 6. Deferred optimisation — conditional catalogue feed

`snippets/archive-feed.liquid` renders on **every** page, including pages that
already have artifact cards and will therefore never consult it. Roughly 3 KB
gzipped of dead weight on the homepage and collection pages.

The queue in `archive-card-ui.js` already prefers visible cards and only falls
back to the feed, so omitting the feed where cards exist is safe by
construction. The difficulty is that Liquid cannot easily know whether the
current template will render cards — the section list is dynamic. Likely
approaches:

- Render the feed only on templates known to lack a grid (`product`, `article`,
  `page`), by testing `template.name` in `layout/theme.liquid`
- Or move it behind a section-rendering endpoint fetched on demand, which also
  removes the 50-artifact cap

**Not a launch blocker.** Confirmed as a post-launch optimisation.

---

## 7. Repo hygiene

- No `.gitignore` exists. `.DS_Store` and `assets/.DS_Store` are tracked.
- `.claude/CLAUDE.md`, `COMPONENTS.md`, `DECK.md`, `DESIGN.md`, `MOTION.md`,
  `PROJECT.md`, `ROADMAP.md` and the root `CLAUDE.md` are all **0 bytes**.
  `ARCHIVE-REDESIGN.md` is currently the only real documentation.
