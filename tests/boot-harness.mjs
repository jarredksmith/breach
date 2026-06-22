// Boot harness — the piece the per-function tests can't do.
//
// Every other test pulls ONE function out of the source and evals it in isolation. That misses the whole
// class of bugs that only appear when the real file runs top-to-bottom in the real order: temporal-dead-zone
// (a `let` used before its line), use-before-define, and anything that throws on the very first frame. Those
// shipped more than once (the loader-var TDZ, the cutscene-before-loader ordering) because nothing here
// actually BOOTED the game.
//
// This does. It stubs the browser + THREE + Rapier + audio surface with a permissive universal proxy, then
// evaluates the entire game block AND calls window.GAME_START() — which runs the real init and the first
// synchronous loop() tick. If any of that throws, we catch it. requestAnimationFrame is a no-op so the loop
// runs exactly once instead of spinning.
//
// What it CAN catch: TDZ / use-before-init on let/const/class, anything thrown during init wiring, a throw on
// the first loop() tick.
// What it can NOT catch (by design — the proxy is permissive so legit code doesn't throw spuriously): wrong
// pixels, wrong physics numbers, a misspelled DOM id (getElementById returns a stub, never null), or bugs that
// only appear after real user input / real network peers. It's a smoke test for "does the page come up", not
// a correctness oracle.

import vm from 'vm';
import { gameSource } from './harness.mjs';

// A universal, no-throw stub: callable, constructable, every property access returns itself, coerces to 0 in
// math and '' in string context, iterates empty, has length 0. This lets THREE/Rapier/DOM calls chain forever
// without ever throwing, so the ONLY things that throw are real JS errors in the game's own code.
function makeStub() {
  const fn = function () {};
  let proxy;
  const handler = {
    get(t, prop) {
      if (prop === Symbol.toPrimitive) return (hint) => (hint === 'string' ? '' : 0);
      if (prop === Symbol.iterator) return function* () {};
      if (prop === Symbol.asyncIterator) return undefined;
      if (prop === Symbol.toStringTag) return 'Stub';
      if (prop === Symbol.hasInstance) return () => false;
      if (typeof prop === 'symbol') return undefined;
      if (prop === 'length') return 0;
      if (prop === 'then') return undefined;        // never a thenable (so awaits/Promises don't hang)
      if (prop === 'valueOf') return () => 0;
      if (prop === 'toString') return () => '';
      if (prop === 'nodeType') return 1;
      return proxy;
    },
    set() { return true; },
    apply() { return proxy; },
    construct() { return proxy; },
    has() { return true; },
    deleteProperty() { return true; },
  };
  proxy = new Proxy(fn, handler);
  return proxy;
}

export function bootGame() {
  const U = makeStub();

  const base = {
    console,
    Math, Date, JSON, parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent,
    Object, Array, String, Number, Boolean, RegExp, Symbol, Function, Promise,
    Error, TypeError, RangeError, SyntaxError, ReferenceError,
    Map, Set, WeakMap, WeakSet,
    Float32Array, Float64Array, Int8Array, Int16Array, Int32Array,
    Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, ArrayBuffer, DataView,
    NaN, Infinity, undefined,

    // browser surface (only the bits that need real-ish behaviour; everything else falls back to U)
    navigator: { userAgent: 'node-boot-harness', platform: 'node', languages: ['en'], maxTouchPoints: 0, getGamepads: () => [] },
    location: { href: 'http://localhost/breach.html', search: '', hash: '', protocol: 'http:', host: 'localhost', origin: 'http://localhost', reload: () => {} },
    performance: { now: () => Date.now() },
    requestAnimationFrame: () => 0,        // no-op: the explicit loop() call inside init runs exactly once
    cancelAnimationFrame: () => {},
    setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
    queueMicrotask: () => {},
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => true,
    localStorage: (() => { const d = {}; return { getItem: (k) => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = '' + v; }, removeItem: (k) => { delete d[k]; }, clear: () => { for (const k in d) delete d[k]; } }; })(),
    sessionStorage: (() => { const d = {}; return { getItem: (k) => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = '' + v; }, removeItem: (k) => { delete d[k]; } }; })(),
    matchMedia: () => ({ matches: false, media: '', addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {} }),
    getComputedStyle: () => U,
    devicePixelRatio: 1, innerWidth: 1280, innerHeight: 720, scrollX: 0, scrollY: 0,
    alert: () => {}, confirm: () => true, prompt: () => '',
    atob: (s) => Buffer.from('' + s, 'base64').toString('binary'),
    btoa: (s) => Buffer.from('' + s, 'binary').toString('base64'),
    fetch: () => Promise.resolve(U),
    URL: function () { return U; },
    URLSearchParams: function () { return U; },
    Blob: function () { return U; }, File: function () { return U; }, FileReader: function () { return U; },
    Image: function () { return U; }, Audio: function () { return U; },
    Worker: function () { return U; }, WebSocket: function () { return U; },
    AudioContext: function () { return U; }, webkitAudioContext: function () { return U; },
    Peer: function () { return U; },            // PeerJS
    WebGLRenderingContext: function () {}, WebGL2RenderingContext: function () {},
    document: U,                                 // getElementById/createElement/querySelector all -> U (never null)
    THREE: U,
    RAPIER: U,
  };
  base.URL.createObjectURL = () => 'blob:stub';
  base.URL.revokeObjectURL = () => {};

  // global self-references resolve to the permissive proxy global (so window.anything also falls back to U)
  const g = new Proxy(base, {
    // has() must be true for string identifiers so free variables never throw "x is not defined"
    // (that would be a false positive). TDZ on let/const/class still throws — those bindings live in the
    // script's lexical scope, above the global, and are checked before this proxy is ever consulted.
    has(t, prop) { return typeof prop !== 'symbol'; },
    get(t, prop) {
      if (prop in t) return t[prop];
      if (typeof prop === 'symbol') return undefined;   // never hand V8 a stub for Symbol.unscopables etc.
      return U;
    },
    set(t, prop, val) { t[prop] = val; return true; },
  });
  base.window = g; base.self = g; base.globalThis = g; base.top = g; base.parent = g; base.frames = g;

  vm.createContext(g);

  // define the game, then run its real init + first loop() tick, all in one shot so errors surface here.
  const code = gameSource() + '\n;if (typeof window.GAME_START === "function") window.GAME_START();\n';
  try {
    vm.runInContext(code, g, { filename: 'breach-game.js', timeout: 15000 });
    return { ok: true, error: null };
  } catch (e) {
    return { ok: false, error: e };
  }
}
