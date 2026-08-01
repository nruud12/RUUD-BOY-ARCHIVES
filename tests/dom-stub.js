/* Minimal DOM sufficient for the ArchiveOS modules under test.
   Supports: class selectors, attribute selectors, comma lists. */

class ClassList {
  constructor(node) { this.node = node; this.set = new Set(); }
  add(...c) { c.forEach((x) => this.set.add(x)); }
  remove(...c) { c.forEach((x) => this.set.delete(x)); }
  contains(c) { return this.set.has(c); }
  toggle(c, force) {
    const on = force === undefined ? !this.set.has(c) : Boolean(force);
    if (on) this.set.add(c); else this.set.delete(c);
    return on;
  }
  toString() { return [...this.set].join(' '); }
}

class El {
  constructor(tag, attrs = {}, text = '') {
    this.tagName = tag.toUpperCase();
    this.attrs = {};
    this.children = [];
    this.parent = null;
    this.textContent = text;
    this.classList = new ClassList(this);
    this.style = {
      props: {},
      setProperty(k, v) { this.props[k] = v; },
      getPropertyValue(k) { return this.props[k]; },
    };
    this.dataset = new Proxy(this, {
      get: (t, k) =>
        t.attrs['data-' + String(k).replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())],
      set: (t, k, v) => {
        t.attrs['data-' + String(k).replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())] = v;
        return true;
      },
    });
    /* Images: `src` must round-trip through the attribute, because
       archive-ui.js guards its cross-fade with getAttribute('src')
       while assigning with .src. If those two diverge in the stub, the
       guard never matches and the harness silently tests a code path
       production does not take. Cached-decode is simulated as
       synchronous-complete, which is the case the reveal path checks. */
    this.onload = null;
    this.onerror = null;
    Object.defineProperty(this, 'src', {
      get: () => this.attrs.src || '',
      set: (v) => {
        this.attrs.src = String(v);
        this.complete = true;
        this.naturalWidth = 1;
        if (typeof this.onload === 'function') setTimeout(() => this.onload(), 0);
      },
      configurable: true,
    });
    this.complete = false;
    this.naturalWidth = 0;

    Object.entries(attrs).forEach(([k, v]) => this.setAttribute(k, v));
  }

  setAttribute(k, v) {
    if (k === 'class') { v.split(/\s+/).filter(Boolean).forEach((c) => this.classList.add(c)); return; }
    this.attrs[k] = String(v);
  }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  get classNameList() { return [...this.classList.set]; }
  hasAttribute(k) { return k in this.attrs; }
  removeAttribute(k) { delete this.attrs[k]; }

  appendChild(child) { child.parent = this; this.children.push(child); return child; }

  addEventListener(type, fn) { (this.listeners ||= {})[type] = (this.listeners[type] || []).concat(fn); }
  dispatchEvent(evt) {
    ((this.listeners || {})[evt.type] || []).slice().forEach((fn) => fn(evt));
    return true;
  }
  /** Fire a listener directly — the harness's stand-in for a click. */
  fire(type, detail = {}) {
    this.dispatchEvent(Object.assign({ type, target: this, preventDefault() {}, stopPropagation() {} }, detail));
  }

  get offsetParent() { return this.parent || null; }

  descendants() {
    const out = [];
    const walk = (n) => n.children.forEach((c) => { out.push(c); walk(c); });
    walk(this);
    return out;
  }

  matches(selector) {
    return selector.split(',').map((s) => s.trim()).filter(Boolean).some((s) => {
      if (s.startsWith('.')) return this.classList.contains(s.slice(1));
      const attr = s.match(/^\[([^\]=]+)(?:=["']?([^\]"']*)["']?)?\]$/);
      if (attr) {
        const [, name, value] = attr;
        if (!(name in this.attrs)) return false;
        return value === undefined || this.attrs[name] === value;
      }
      return this.tagName === s.toUpperCase();
    });
  }

  querySelector(sel) { return this.descendants().find((n) => n.matches(sel)) || null; }
  querySelectorAll(sel) { return this.descendants().filter((n) => n.matches(sel)); }

  closest(sel) {
    let n = this;
    while (n) { if (n.matches && n.matches(sel)) return n; n = n.parent; }
    return null;
  }
}

class Doc extends El {
  constructor() {
    super('document');
    this.listeners = {};
  }
  createElement(tag) { return new El(tag); }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  dispatchEvent(evt) {
    (this.listeners[evt.type] || []).slice().forEach((fn) => fn(evt));
    return true;
  }
}

function install() {
  const document = new Doc();

  global.document = document;
  global.CustomEvent = class CustomEvent {
    constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
  };
  global.Image = class Image {
    constructor() { this.src = ''; }
    decode() { return Promise.resolve(); }
  };
  global.Audio = class Audio {
    constructor() { this.src = ''; this.paused = true; this.volume = 1; this.muted = false; this.currentTime = 0; this.duration = 0; }
    load() {}
    play() { this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
    addEventListener() {}
  };
  global.requestAnimationFrame = (fn) => setTimeout(fn, 0);
  global.cancelAnimationFrame = (id) => clearTimeout(id);
  global.performance = global.performance || { now: () => Date.now() };
  global.fetch = () => Promise.resolve({ ok: false, status: 0 });
  global.window = {
    matchMedia: () => ({ matches: false }),
    addEventListener() {},
    clearTimeout,
    setTimeout,
  };
  global.window.document = document;

  return { document, El };
}

module.exports = { install, El };
