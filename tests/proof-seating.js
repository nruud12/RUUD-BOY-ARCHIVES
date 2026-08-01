/* ==========================================================
   PROOF — declaration, seating, exchange
   RUUD BOY ARCHIVES

   Holds the two architectural invariants in docs/ARCHIVEOS.md:

     Law I  — One artifact, three views
              (no view stores identity; no view invents a default)
     Law II — Declaration and seating
              (a declaration is inert until seated into state)

   Run:  node tests/proof-seating.js
========================================================== */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { install, El } = require('./dom-stub');

const ASSETS = path.join(__dirname, '..', 'assets');

/* Load order matters and is NOT ours to choose. This mirrors
   snippets/scripts.liquid exactly — ui, then card-ui, then vitrine —
   because registration order decides init order, and an earlier
   version of this harness called Vitrine.init() before CardUI.init(),
   an order the theme never produces. That hid a real defect: seating
   ran during init and the vitrine, registering later, never heard it.
   Boot through ArchiveOS.boot() and never call init() by hand. */
const LOAD_ORDER = [
  'archive-core.js',
  'archive-player.js',
  'archive-ui.js',
  'archive-card-ui.js',
  'archive-vitrine.js',
];

let pass = 0;
let fail = 0;
const failures = [];

function ok(label, cond, detail) {
  if (cond) { pass++; console.log(`  PASS  ${label}`); }
  else {
    fail++; failures.push(label);
    console.log(`  FAIL  ${label}${detail ? '\n        ' + detail : ''}`);
  }
}
function section(name) { console.log(`\n${name}`); }

/* ----------------------------------------------------------
   SCENE
---------------------------------------------------------- */

function record(id, title) {
  return JSON.stringify({
    id, title,
    audio: `https://cdn.example/${id}.mp3`,
    image: `https://cdn.example/${id}.jpg`,
    archive: `0${id}`, bpm: 90, key: 'Am', mood: 'Nocturnal',
  });
}

function recordScript(id, title) {
  return new El('script',
    { class: 'archive-track-data', 'data-archive-track': String(id) },
    record(id, title));
}

/** The console, exactly as snippets/archive-player.liquid ships it. */
function buildConsole(document) {
  const root = new El('div', {
    class: 'archive-player is-unseated',
    'data-archive-player': '',
    'data-template': 'index',
  });

  const stack = new El('div', { class: 'archive-player__artwork-stack' });
  stack.appendChild(new El('img', { 'data-player-artwork-a': '', class: 'is-showing' }));
  stack.appendChild(new El('img', { 'data-player-artwork-b': '' }));
  root.appendChild(stack);

  /* The empty-state copy ships in the markup, exactly as
     snippets/archive-player.liquid has it. It is not a claim while
     `is-unseated` is present — CSS removes the whole identity column,
     so it is neither visible nor in the accessibility tree. It becomes
     an assertion only once boot resolves the console to `is-empty`. */
  root.appendChild(new El('h2', { 'data-player-title': '' }, 'No artifact in the case'));
  root.appendChild(new El('p', { class: 'archive-player__hint' }, 'Select an artifact from the holdings'));
  ['archive', 'bpm', 'key', 'mood', 'time'].forEach((f) =>
    root.appendChild(new El('span', { [`data-player-${f}`]: '' })));
  ['play', 'prev', 'next', 'mute'].forEach((f) =>
    root.appendChild(new El('button', { [`data-player-${f}`]: '' })));
  root.appendChild(new El('div', { 'data-player-waveform': '' }));
  root.appendChild(new El('input', { 'data-player-progress': '', value: '0' }));
  root.appendChild(new El('input', { 'data-player-volume': '', value: '100' }));

  document.appendChild(root);
  return root;
}

/**
 * Builds a page and boots ArchiveOS over it.
 * @param {boolean} declare whether a section declares an artifact
 */
function scene({ declare }) {
  const { document } = install();

  let vitrine = null;
  if (declare) {
    vitrine = new El('section', {
      class: 'vitrine archive-shell is-loaded',
      'data-vitrine': '', 'data-archive-artifact': '', 'data-track-id': '100',
    });
    vitrine.appendChild(recordScript(100, 'Declared Artifact'));
    vitrine.appendChild(new El('img', { 'data-vitrine-art': '' }));
    ['catalog', 'title', 'bpm', 'key', 'mood'].forEach((f) =>
      vitrine.appendChild(new El('span', { [`data-vitrine-${f}`]: '' })));
    document.appendChild(vitrine);
  }

  [200, 300].forEach((id) => {
    const card = new El('article', { class: 'archive-card', 'data-track-id': String(id) });
    card.appendChild(recordScript(id, `Artifact ${id}`));
    card.appendChild(new El('button', { 'data-archive-play': '' }));
    document.appendChild(card);
  });

  const consoleEl = buildConsole(document);

  const ctx = vm.createContext(global);
  LOAD_ORDER.forEach((f) => {
    vm.runInContext(fs.readFileSync(path.join(ASSETS, f), 'utf8'), ctx, { filename: f });
  });

  const OS = global.window.ArchiveOS;
  const emitted = [];
  document.addEventListener('archive:trackchange', (e) => emitted.push(e.detail));

  /* Each scene installs a fresh global.window, so building a second
     scene repoints `window` for the first one too. The modules resolve
     `window.ArchiveOS` at call time — correctly, since a browser has
     one window for the page's life — which means a scene must be made
     current again before asserting on it. A harness artifact, not a
     product defect, but it silently reads as a view disagreeing with
     state, so it is worth naming rather than working around. */
  const win = global.window;
  const use = () => { global.window = win; global.document = document; };

  return {
    document, vitrine, consoleEl, OS, emitted, use,
    Vitrine: global.window.ArchiveVitrine,
    CardUI: OS.getModule('cardUI'),
    UI: OS.getModule('ui'),
    boot: () => { use(); OS.boot(); },
  };
}

/* ==========================================================
   SCENARIO A — a page that declares an artifact
========================================================== */

const A = scene({ declare: true });

section('Law II — a declaration is inert until seated');

ok('before boot, no artifact exists at runtime', A.OS.get('currentTrack') === null);
ok('the section carries a declaration', A.vitrine.querySelector('.archive-track-data') !== null);
ok('before boot the console asserts nothing (is-unseated)',
  A.consoleEl.classList.contains('is-unseated'));
ok('before boot the console does NOT claim to be empty',
  !A.consoleEl.classList.contains('is-empty'));
ok('the shipped console names no artifact',
  A.consoleEl.querySelector('[data-player-title]').textContent !== 'Declared Artifact');
ok('and its empty copy is withheld, not asserted, while unseated',
  A.consoleEl.classList.contains('is-unseated') && !A.consoleEl.classList.contains('is-empty'),
  'CSS removes .archive-player__meta under .is-unseated');

A.boot();

ok('boot seats the declared artifact', String(A.OS.get('currentTrack')?.id) === '100');
ok('seating emitted exactly one trackchange', A.emitted.length === 1, `got ${A.emitted.length}`);
ok('seating is flagged on the event', A.emitted[0]?.seated === true);
ok('seating loaded but did not play', A.OS.get('playing') === false);

const beforeSecond = A.OS.get('currentTrack');
A.CardUI.ready();
ok('a second seating attempt defers to what is loaded',
  A.OS.get('currentTrack') === beforeSecond);

/* ---------- the race this harness previously hid ---------- */

section('Law II — seating reaches every view, whatever the load order');

ok('the vitrine received the seating despite registering LAST',
  A.vitrine.querySelector('[data-vitrine-title]').textContent === 'Declared Artifact',
  'the case rendered from state, not merely from Liquid');
ok('the console received the seating', A.consoleEl.querySelector('[data-player-title]').textContent === 'Declared Artifact');
ok('the console is no longer unseated', !A.consoleEl.classList.contains('is-unseated'));
ok('the console does not claim to be empty', !A.consoleEl.classList.contains('is-empty'));

/* ---------- a seating is not an exchange ---------- */

section('Law II — a seating is presented as already true');

ok('case is lit', A.vitrine.classList.contains('is-loaded'));
ok('case did NOT darken for the artifact it already showed',
  !A.vitrine.classList.contains('is-changing'));
ok('case painted the declared artifact', A.vitrine.querySelector('[data-vitrine-art]').src === 'https://cdn.example/100.jpg');
ok('console title did NOT morph into agreement',
  !A.consoleEl.querySelector('[data-player-title]').classList.contains('is-morphing'));

/* ---------- the three views agree at boot ---------- */

section('Law I — all three views agree the moment boot ends');

ok('state, case and console name one artifact',
  String(A.OS.get('currentTrack').id) === '100' &&
  A.vitrine.querySelector('[data-vitrine-title]').textContent === 'Declared Artifact' &&
  A.consoleEl.querySelector('[data-player-title]').textContent === 'Declared Artifact');

/* ---------- no view stores identity ---------- */

section('Law I — no view stores the artifact identity');

ok('CardUI.activeId is a getter, not a field',
  typeof Object.getOwnPropertyDescriptor(A.CardUI, 'activeId')?.get === 'function');
ok('CardUI.activeId throws if assigned (strict, as the modules run)', (() => {
  'use strict';
  try { A.CardUI.activeId = '999'; return false; } catch (e) { return e instanceof TypeError; }
})());
ok('and the derived value is untouched', A.CardUI.activeId === '100');
ok('Vitrine has no displayedId at all', !('displayedId' in A.Vitrine));
ok('Vitrine stores no artifact id on itself',
  !Object.keys(A.Vitrine).some((k) => /trackid|artifactid|displayed/i.test(k)),
  Object.keys(A.Vitrine).join(', '));
ok('UI stores no "started" latch',
  !('started' in A.UI),
  'whether the console is empty is a question state answers');

/* ---------- an exchange ---------- */

section('Law II — an exchange earns the transition');

A.emitted.length = 0;
A.CardUI.select(A.document.querySelectorAll('.archive-card')[0]);

ok('exchange emitted a trackchange', A.emitted.length === 1);
ok('exchange is NOT flagged as seated', A.emitted[0]?.seated === false);
ok('case darkened for the exchange', A.vitrine.classList.contains('is-changing'));
ok('console title morphed for the exchange',
  A.consoleEl.querySelector('[data-player-title]').classList.contains('is-morphing'));

/* ==========================================================
   SCENARIO B — a page that declares nothing
========================================================== */

const B = scene({ declare: false });
B.boot();

section('Law I — with nothing declared, the console may say so');

ok('nothing is seated', B.OS.get('currentTrack') === null);
ok('the console resolved out of is-unseated', !B.consoleEl.classList.contains('is-unseated'));
ok('the console is genuinely empty and says so', B.consoleEl.classList.contains('is-empty'));
ok('the console invented no artifact, and says the true thing',
  B.consoleEl.querySelector('[data-player-title]').textContent === 'No artifact in the case');

/* ==========================================================
   SETTLE — assert on the exchange only after it completes
   (REST_MS = 300ms dwell, plus a rAF to relight)
========================================================== */

setTimeout(() => {
  A.use(); // scenario B installed its own window; make A current again

  section('Law I — the three views agree after an exchange');

  const identity = String(A.OS.get('currentTrack').id);
  const hosts = A.document.querySelectorAll('[data-track-id]');

  ok('state names artifact 200', identity === '200');
  ok('the case shows artifact 200',
    A.vitrine.querySelector('[data-vitrine-art]').src === 'https://cdn.example/200.jpg');
  ok('the wall label names artifact 200',
    A.vitrine.querySelector('[data-vitrine-title]').textContent === 'Artifact 200');
  ok('the console names artifact 200',
    A.consoleEl.querySelector('[data-player-title]').textContent === 'Artifact 200');
  ok('CardUI derives the same identity', A.CardUI.activeId === identity);
  ok('exactly one host is marked active',
    hosts.filter((n) => n.classList.contains('is-active')).length === 1);
  ok('the active host is artifact 200',
    hosts.find((n) => n.classList.contains('is-active'))?.getAttribute('data-track-id') === '200');
  ok('the case relit after the exchange', !A.vitrine.classList.contains('is-changing'));

  section("Law II — a declaration is not a display record");

  ok('vitrine data-track-id still names the DECLARED artifact (100)',
    A.vitrine.getAttribute('data-track-id') === '100');

  console.log(`\n${pass}/${pass + fail} assertions passed`);
  if (fail) console.log('failed:\n  - ' + failures.join('\n  - '));
  process.exit(fail ? 1 : 0);
}, 600);
