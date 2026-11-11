/* ==========================================================================
   ENTRANCE — "From Egypt to the World".
   A short welcome screen with the language chooser and a penalty-kick mini-game (js/intro-game.js,
   music in js/intro-audio.js): score and the site opens. Skippable (button or Esc), shown once per
   browser session, and it never blocks a deep link (see boot.js).
   ========================================================================== */
(function () {
  'use strict';
  var A = window.App, CFG = window.CONFIG || {}, E = CFG.entrance || {};
  var root = document.documentElement, ent = document.getElementById('entrance');
  if (!A || !ent) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (E.enabled === false) { root.classList.remove('has-entrance'); root.classList.add('no-entrance'); return; }
  if (!root.classList.contains('has-entrance')) return;      /* already seen this session, or a deep link */

  var page = document.getElementById('page'), strips = A.$('#ent-strips'), frieze = A.$('#frieze');
  var go = A.$('#ent-go'), skip = A.$('#ent-skip'), leaving = false, N = 8;

  /* curtain strips (the geometric reveal) */
  function delays() {
    var rtl = root.dir === 'rtl';
    Array.prototype.forEach.call(strips.children, function (s, i) { s.style.setProperty('--d', rtl ? N - 1 - i : i); });
  }
  for (var i = 0; i < N; i++) strips.appendChild(document.createElement('i'));
  delays(); A.onLang(delays);

  /* slow hieroglyph-style frieze: the row is doubled so the loop is seamless */
  (function buildFrieze() {
    var ids = ['g-ankh', 'g-eye', 'g-sun', 'g-lotus', 'g-feather', 'g-water', 'g-pyramid'], row = A.el('div', { class: 'frieze__row' });
    for (var k = 0; k < 2; k++) for (var r = 0; r < 7; r++) ids.forEach(function (id) { row.appendChild(A.icon(id)); });
    frieze.appendChild(row);
  })();

  /* modal behaviour: the page behind is inert while the entrance is open */
  if (page) page.setAttribute('inert', '');
  function leave() {
    if (leaving) return; leaving = true;
    if (E.oncePerSession !== false) { try { sessionStorage.setItem('se-intro', 'done'); } catch (e) {} }
    ent.classList.add('is-leaving');
    if (window.IntroAudio) window.IntroAudio.setMode('site', 1.8);   /* the music keeps playing inside the site, softer */
    var hold = (!reduce && window.PTWelcome) ? window.PTWelcome() : 0;      /* "Hello / Hallo / مرحبا" curtain (js/motion.js); the hero arrives when it lifts */
    setTimeout(function () {
      root.classList.add('is-arriving');
      setTimeout(function () { root.classList.remove('is-arriving'); }, reduce ? 0 : 3200);
    }, hold);
    setTimeout(function () {
      root.classList.remove('has-entrance'); root.classList.add('no-entrance');
      if (page) page.removeAttribute('inert');
      document.removeEventListener('keydown', onKey);
      window.scrollTo(0, 0);
      var h = A.$('#hero-name'); if (h) { try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
    }, reduce ? 0 : 1050);
  }
  function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); leave(); } }
  document.addEventListener('keydown', onKey);
  go.addEventListener('click', function () { if (!window.IntroGame) leave(); });   /* the game handles the button; without it the button just opens the site */
  skip.addEventListener('click', leave);
  window.Entrance = { leave: leave };
  requestAnimationFrame(function () { try { go.focus({ preventScroll: true }); } catch (e) {} });
})();
