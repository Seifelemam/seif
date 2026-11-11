/* ==========================================================================
   MOTION — moving from one place to another should feel like moving.
   · Menu / footer / button links to a section: a blue curtain sweeps over the screen with the section's
     name, the page jumps underneath it, and the curtain lifts again.
   · Every section has its own little scene on the curtain (js/scenes.js): an ID card, a clapperboard, a
     briefcase, a book, people joining hands around a globe, a ringing phone. Right after the entrance goal a
     "Hello / Hallo / مرحبا" welcome curtain plays once (PTWelcome below). "My Journey" gets a plane that flies across the sky along a
     dotted route, as if the visitor were travelling there.
   · Switching the language: the content slides back in instead of just changing.
   · A thin progress line under the header follows the scroll.
   The entrance → site animation lives in CSS (html.is-arriving, set by entrance.js).
   Everything is skipped for people who prefer reduced motion; links then behave normally.
   ========================================================================== */
(function () {
  'use strict';
  var A = window.App, root = document.documentElement;
  if (!A) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- scroll progress ---- */
  var bar = document.getElementById('progress'), tick = false;
  function prog() {
    tick = false;
    var max = Math.max(1, root.scrollHeight - innerHeight);
    if (bar) bar.style.setProperty('--p', Math.min(1, Math.max(0, window.scrollY / max)).toFixed(4));
  }
  window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(prog); } }, { passive: true });
  window.addEventListener('resize', prog); prog();

  if (reduce) return;

  /* ---- language switch: content slides back in ---- */
  var main = document.getElementById('main'), swapTimer = 0;
  A.onLang(function () {
    if (!main) return;
    main.classList.remove('lang-swap'); void main.offsetWidth; main.classList.add('lang-swap');
    clearTimeout(swapTimer); swapTimer = setTimeout(function () { main.classList.remove('lang-swap'); }, 1100);
  });

  /* ---- section links: the curtain (and the plane for the Journey) ---- */
  var pt = document.getElementById('pt'), label = document.getElementById('pt-label'), busy = false;
  if (!pt) return;
  var NS = 'http://www.w3.org/2000/svg';
  function svgEl(n, a) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); return e; }
  var fl = svgEl('svg', { 'class': 'pt__flight', 'aria-hidden': 'true', focusable: 'false' });
  var route = svgEl('path', { 'class': 'pt__route' }), plane = svgEl('g', { 'class': 'pt__plane' });
  var shadow = svgEl('g', { 'class': 'pt__shadow', transform: 'translate(10 16)' }), body = svgEl('g', { 'class': 'pt__body' });
  var PLANE = ['M24 2c2.6 0 3.8 3 3.8 7.4V35c0 2.2 1.6 4.6 3.4 8.4v1.2L24 42.4l-7.2 2.2v-1.2c1.8-3.8 3.4-6.2 3.4-8.4V9.4C20.2 5 21.4 2 24 2z',
               'M20.2 17.5L2 31.5v4.6l18.2-6.2z', 'M27.8 17.5L46 31.5v4.6l-18.2-6.2z', 'M20.4 38.6L11 44.6v2l9.4-2.8z', 'M27.6 38.6L37 44.6v2l-9.4-2.8z'];
  PLANE.forEach(function (d) { shadow.appendChild(svgEl('path', { d: d })); body.appendChild(svgEl('path', { d: d })); });
  var inner = svgEl('g', { transform: 'translate(-24 -24)' }); inner.appendChild(shadow); inner.appendChild(body); plane.appendChild(inner);
  fl.appendChild(route); fl.appendChild(plane); pt.appendChild(fl);
  for (var ci = 0; ci < 6; ci++) { var cl = document.createElement('i'); cl.className = 'pt__cloud'; cl.style.setProperty('--k', ci); pt.appendChild(cl); }

  function bez(P, u) {                       /* a point on, and the direction of, a cubic Bezier curve */
    var a = 1 - u, x = a * a * a * P[0][0] + 3 * a * a * u * P[1][0] + 3 * a * u * u * P[2][0] + u * u * u * P[3][0];
    var y = a * a * a * P[0][1] + 3 * a * a * u * P[1][1] + 3 * a * u * u * P[2][1] + u * u * u * P[3][1];
    var dx = 3 * a * a * (P[1][0] - P[0][0]) + 6 * a * u * (P[2][0] - P[1][0]) + 3 * u * u * (P[3][0] - P[2][0]);
    var dy = 3 * a * a * (P[1][1] - P[0][1]) + 6 * a * u * (P[2][1] - P[1][1]) + 3 * u * u * (P[3][1] - P[2][1]);
    return { x: x, y: y, a: Math.atan2(dy, dx) * 180 / Math.PI };
  }
  function fly(dur) {
    var W = innerWidth, H = innerHeight, narrow = W < 620;
    fl.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var P = [[-0.1 * W, 0.80 * H], [0.28 * W, 0.92 * H], [0.60 * W, 0.10 * H], [1.1 * W, 0.20 * H]];
    if (root.dir === 'rtl') P = P.map(function (q) { return [W - q[0], q[1]]; });   /* Arabic reads right to left: so does the flight */
    route.setAttribute('d', 'M' + P[0] + ' C' + P[1] + ' ' + P[2] + ' ' + P[3]);
    var base = narrow ? 1.25 : 1.9, t0 = performance.now();
    (function f(now) {
      var k = Math.min(1, (now - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      var u = 0.55 * k + 0.45 * e;            /* a gentle take-off and landing, never a stall */
      var q = bez(P, u), sc = base * (1 + 0.28 * Math.sin(Math.PI * u));
      plane.setAttribute('transform', 'translate(' + q.x.toFixed(1) + ' ' + q.y.toFixed(1) + ') rotate(' + (q.a + 90).toFixed(1) + ') scale(' + sc.toFixed(2) + ')');
      if (k < 1) requestAnimationFrame(f);
    })(t0);
  }
  var sc = document.createElement('div'); sc.className = 'pt__scene'; sc.id = 'pt-scene'; sc.setAttribute('aria-hidden', 'true'); pt.insertBefore(sc, label);
  function jumpTo(target, hash, text, kind) {
    var byPlane = kind === 'plane', html = (!byPlane && kind && window.PTScenes) ? window.PTScenes.html(kind, root.lang) : '', byScene = !!html;
    busy = true; label.textContent = text || '';
    var DUR = 2150, COVER = byPlane ? 900 : (byScene ? 650 : 560), LIFT = byPlane ? 1150 : (byScene ? 1850 : 0);
    var cls = byPlane ? ' is-plane' : (byScene ? ' is-scene scene-' + kind : '');
    if (byScene) sc.innerHTML = html;
    pt.className = 'pt is-in' + cls;
    if (byPlane) fly(DUR);
    setTimeout(function () {
      var prev = root.style.scrollBehavior; root.style.scrollBehavior = 'auto';
      target.scrollIntoView(); root.style.scrollBehavior = prev;
      try { if (hash && location.hash !== hash) history.pushState(null, '', hash); } catch (e) {}
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      try { target.focus({ preventScroll: true }); } catch (e) {}
      prog();
      var lift = function () {
        pt.className = 'pt is-out' + cls;
        setTimeout(function () { pt.className = 'pt'; label.textContent = ''; sc.innerHTML = ''; busy = false; }, byPlane ? DUR - LIFT + 120 : 650);
      };
      if (byPlane || byScene) setTimeout(lift, LIFT - COVER); else requestAnimationFrame(lift);
    }, COVER);
  }
  /* ---- the welcome: right after the goal (or Skip) the entrance slides away over a blue curtain that says hello in three languages,
     then the curtain lifts and the hero arrives. entrance.js calls this; it returns how long (ms) the curtain stays down. ---- */
  var WELCOME = 2400;
  window.PTWelcome = function () {
    var html = window.PTScenes ? window.PTScenes.html('hello', root.lang) : '';
    if (!html || busy) return 0;
    busy = true;
    pt.className = 'pt is-in is-instant';                       /* the curtain is down at once, hidden under the entrance strips */
    setTimeout(function () {                                    /* the scene starts when the entrance has mostly slid away */
      label.textContent = ''; sc.innerHTML = html; pt.className = 'pt is-in is-instant is-scene scene-hello';
    }, 450);
    setTimeout(function () {
      pt.className = 'pt is-out is-scene scene-hello';
      setTimeout(function () { pt.className = 'pt'; label.textContent = ''; sc.innerHTML = ''; busy = false; }, 650);
    }, WELCOME);
    return WELCOME;
  };
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.classList.contains('skip') || root.classList.contains('has-entrance')) return;
    var id = a.getAttribute('href').slice(1); if (!id) return;
    var target = document.getElementById(id);
    if (!target || !/^(SECTION|MAIN|FOOTER)$/.test(target.tagName)) return;
    e.preventDefault();
    if (busy) return;
    var text = (id === 'top') ? (A.t('foot.top') || '') : (a.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) { var h = target.querySelector('h2'); text = h ? h.textContent.trim() : ''; }
    jumpTo(target, '#' + id, text, window.PTScenes ? window.PTScenes.kindFor(id) : (id === 'journey' ? 'plane' : ''));
  });
})();
