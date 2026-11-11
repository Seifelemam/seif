/* ==========================================================================
   VIEWER — accessible photo gallery / information panel.
   Used by the world map (a place with its photos) and by the culture galleries.
   App.Viewer.open({ title, kicker, sub, text, photos:[{src,alt,caption}], start, siblings, onSibling, backLabel,
                     tour: { label, dwell, onDone, onNext, onStop } })
   With `tour` the gallery plays by itself: every photo for `dwell` ms (a video until it ends), then onDone() is called.
   A small bar (pause / next place / stop) is shown; browsing by hand gives that photo more time.
   Keyboard: Esc closes, arrow keys browse. Touch: swipe. Focus stays inside while open.
   ========================================================================== */
(function () {
  'use strict';
  var A = window.App; if (!A) return;
  var el = A.el, t = A.t, icon = A.icon;
  var root, stage, img, vid, ph, phText, capEl, countEl, prevB, nextB, kickerEl, titleEl, subEl, textEl, tripEl, thumbsEl, hintEl, closeB, backB;
  var tourEl, tourTxt, tourBar, tourPauseB, tourNextB, tourStopB;
  var cur = null, idx = 0, lastFocus = null, sx = 0, sy = 0, tracking = false;
  var tourT = 0, tourTok = 0, tourPaused = false, tourLong = false;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function build() {
    if (root) return;
    img = el('img', { class: 'viewer__img', alt: '', decoding: 'async' });
    vid = el('video', { class: 'viewer__vid', controls: '', playsinline: '', preload: 'metadata', hidden: true });
    ph = el('div', { class: 'viewer__ph ph' }, [icon('i-camera'), phText = el('span')]);
    capEl = el('p', { class: 'viewer__cap' });
    countEl = el('span', { class: 'viewer__count', 'aria-live': 'polite' });
    prevB = el('button', { type: 'button', class: 'viewer__nav viewer__nav--prev' }, icon('i-chev'));
    nextB = el('button', { type: 'button', class: 'viewer__nav viewer__nav--next' }, icon('i-chev'));
    stage = el('div', { class: 'viewer__stage' }, [img, vid, ph, prevB, nextB, capEl, countEl]);

    kickerEl = el('p', { class: 'viewer__kicker' });
    titleEl = el('h3', { class: 'viewer__title', id: 'viewer-title' });
    subEl = el('p', { class: 'viewer__sub' });
    textEl = el('p', { class: 'viewer__text' });
    tripEl = el('div', { class: 'viewer__trip' });
    thumbsEl = el('div', { class: 'viewer__thumbs', role: 'group' });
    hintEl = el('p', { class: 'viewer__hint' });
    closeB = el('button', { type: 'button', class: 'viewer__close' }, icon('i-close'));
    backB = el('button', { type: 'button', class: 'btn btn--line viewer__back' });
    tourTxt = el('span', { class: 'viewer__tourtxt' });
    tourPauseB = el('button', { type: 'button', class: 'viewer__tbtn viewer__tbtn--pause' });
    tourNextB = el('button', { type: 'button', class: 'viewer__tbtn' });
    tourStopB = el('button', { type: 'button', class: 'viewer__tbtn' });
    tourBar = el('i', { class: 'viewer__tourbar', 'aria-hidden': 'true' });
    tourEl = el('div', { class: 'viewer__tour', hidden: true }, [tourTxt, el('div', { class: 'viewer__tourbtns' }, [tourPauseB, tourNextB, tourStopB]), el('div', { class: 'viewer__tourtrack' }, tourBar)]);
    var side = el('aside', { class: 'viewer__side' }, [closeB, tourEl, kickerEl, titleEl, subEl, textEl, tripEl, thumbsEl, hintEl, backB]);

    root = el('div', { class: 'viewer', id: 'viewer', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'viewer-title', hidden: true },
      el('div', { class: 'viewer__panel' }, [stage, side]));
    document.body.appendChild(root);

    closeB.addEventListener('click', close); backB.addEventListener('click', close);
    root.addEventListener('click', function (e) { if (e.target === root) close(); });
    prevB.addEventListener('click', function () { go(idx - 1); });
    nextB.addEventListener('click', function () { go(idx + 1); });
    tourPauseB.addEventListener('click', function () { tourSetPaused(!tourPaused); });
    tourNextB.addEventListener('click', function () { var f = cur && cur.tour && cur.tour.onNext; tourClear(); if (f) f(); });
    tourStopB.addEventListener('click', function () { var f = cur && cur.tour && cur.tour.onStop; tourClear(); if (f) f(); else close(); });
    img.addEventListener('load', function () { img.classList.remove('is-loading'); });
    img.addEventListener('error', function () { img.hidden = true; ph.hidden = false; phText.textContent = capEl.textContent; });
    document.addEventListener('keydown', onKey);
    stage.addEventListener('pointerdown', function (e) { if (e.target.closest('button, video')) return; tracking = true; sx = e.clientX; sy = e.clientY; });
    stage.addEventListener('pointerup', function (e) {
      if (!tracking) return; tracking = false;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        var rtl = document.documentElement.dir === 'rtl';
        go(idx + ((dx < 0) !== rtl ? 1 : -1));
      }
    });
    stage.addEventListener('pointercancel', function () { tracking = false; });
  }

  function labels() {
    prevB.setAttribute('aria-label', t('jr.v.prev')); nextB.setAttribute('aria-label', t('jr.v.next'));
    closeB.setAttribute('aria-label', t('jr.v.close'));
    root.setAttribute('aria-label', t('jr.v.label'));
    hintEl.textContent = t('jr.v.swipe');
    tourNextB.textContent = t('jr.tour.next'); tourStopB.textContent = t('jr.tour.stop');
    tourPauseB.textContent = t(tourPaused ? 'jr.tour.resume' : 'jr.tour.pause');
    tourPauseB.setAttribute('aria-pressed', tourPaused ? 'true' : 'false');
    if (cur && cur.tour) { tourTxt.textContent = [t('jr.tour.label'), typeof cur.tour.label === 'function' ? cur.tour.label() : cur.tour.label].filter(Boolean).join(' · '); tourEl.setAttribute('aria-label', t('jr.tour.label')); }
  }

  /* ---- tour: the gallery plays by itself ---- */
  function tourClear() {
    clearTimeout(tourT); tourT = 0; tourTok++;
    if (tourBar) { tourBar.style.transition = 'none'; tourBar.style.transform = 'scaleX(0)'; }
    if (vid) vid.onended = null;
  }
  function tourSetPaused(on) {
    tourPaused = on; labels();
    if (on) { tourClear(); try { vid.pause(); } catch (e) {} }
    else { tourLong = false; tourArm(); if (vid && !vid.hidden) { try { var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {} } }
  }
  function tourStep() {
    if (!cur || !cur.tour) return;
    if (idx < cur.photos.length - 1) { idx++; show(); }
    else { var f = cur.tour.onDone; tourClear(); if (f) f(); }
  }
  function tourArm() {
    tourClear();
    if (!cur || !cur.tour || tourPaused) return;
    var tok = tourTok, p = cur.photos[idx], base = cur.tour.dwell || 2200, long = tourLong; tourLong = false;
    if (reduce) base = Math.max(base, 4000);
    function run(ms) {
      if (tok !== tourTok) return;
      tourBar.style.transition = 'none'; tourBar.style.transform = 'scaleX(0)'; void tourBar.offsetWidth;
      tourBar.style.transition = 'transform ' + ms + 'ms linear'; tourBar.style.transform = 'scaleX(1)';
      tourT = setTimeout(function () { if (tok === tourTok) tourStep(); }, ms);
    }
    if (!p) { run(1800); return; }
    if (p.video) {
      vid.muted = true; vid.loop = false;
      vid.onended = function () { if (tok === tourTok) tourStep(); };
      try { var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {}
      run(long ? 16000 : 9000); return;
    }
    var ms = long ? Math.max(base * 2.6, 6000) : base;
    if (img.complete && img.naturalWidth) { run(ms); return; }
    var started = false;
    function go2() { if (started || tok !== tourTok) return; started = true; run(ms); }
    img.addEventListener('load', go2, { once: true }); img.addEventListener('error', go2, { once: true });
    tourT = setTimeout(go2, 5000);   /* a slow connection never freezes the tour */
  }

  function show() {
    var photos = cur.photos, n = photos.length;
    var many = n > 1;
    prevB.hidden = nextB.hidden = !many; thumbsEl.hidden = !many; hintEl.hidden = !many; countEl.hidden = !n;
    if (!n) {
      img.hidden = true; stopVideo(); ph.hidden = false; capEl.hidden = true;
      phText.textContent = cur.emptyNote || t('jr.nophotos');
      if (cur.tour) tourArm();
      return;
    }
    var p = photos[idx];
    ph.hidden = true; capEl.hidden = !p.caption;
    stage.classList.toggle('is-vid', !!p.video);
    if (p.video) {
      img.hidden = true; vid.hidden = false;
      vid.poster = p.poster || ''; vid.setAttribute('aria-label', p.caption || ''); vid.src = p.src;
    } else {
      stopVideo(); img.hidden = false;
      img.classList.add('is-loading'); img.alt = p.alt || p.caption || ''; img.src = p.src;
    }
    capEl.textContent = p.caption || '';
    countEl.textContent = n > 1 ? t('jr.v.of', { i: idx + 1, n: n }) : '';
    Array.prototype.forEach.call(thumbsEl.children, function (b, i) { b.setAttribute('aria-current', i === idx ? 'true' : 'false'); });
    /* warm the neighbours */
    [idx - 1, idx + 1].forEach(function (k) { if (photos[k] && !photos[k].video) { var pre = new Image(); pre.src = photos[k].src; } });
    if (cur.tour) tourArm();
  }
  function stopVideo() { if (!vid) return; try { vid.pause(); } catch (e) {} vid.hidden = true; vid.removeAttribute('src'); vid.removeAttribute('poster'); try { vid.load(); } catch (e) {} }
  function go(i) {
    var n = cur.photos.length; if (n < 2) return;
    if (cur.tour) tourLong = true;   /* browsing by hand: give this photo more time */
    idx = (i + n) % n; show();
  }

  function fill(o) {
    tourClear(); tourPaused = false; tourLong = false;
    cur = o; idx = Math.max(0, Math.min(o.start || 0, (o.photos || []).length - 1)); cur.photos = o.photos || [];
    tourEl.hidden = !o.tour; root.classList.toggle('is-tour', !!o.tour);
    kickerEl.textContent = o.kicker || ''; kickerEl.hidden = !o.kicker;
    titleEl.textContent = o.title || '';
    subEl.textContent = o.sub || ''; subEl.hidden = !o.sub;
    textEl.textContent = o.text || ''; textEl.hidden = !o.text;
    backB.textContent = o.backLabel || t('jr.v.close');
    A.clear(tripEl);
    if (o.siblings && o.siblings.length > 1) {
      tripEl.hidden = false;
      tripEl.appendChild(el('p', { class: 'viewer__triplabel', text: o.tripLabel || '' }));
      var row = el('div', { class: 'viewer__tripbtns' });
      o.siblings.forEach(function (s) {
        var b = el('button', { type: 'button', 'aria-current': s.active ? 'true' : 'false', text: s.label });
        b.addEventListener('click', function () { if (o.onSibling) o.onSibling(s.id); });
        row.appendChild(b);
      });
      tripEl.appendChild(row);
    } else tripEl.hidden = true;
    A.clear(thumbsEl);
    cur.photos.forEach(function (p, i) {
      var b = el('button', { type: 'button', 'aria-label': t('jr.v.of', { i: i + 1, n: cur.photos.length }) + (p.caption ? ': ' + p.caption : '') }, p.video ? el('span', { class: 'viewer__vthumb' }, p.poster ? el('img', { src: p.poster, alt: '', loading: 'lazy' }) : icon('i-play')) : el('img', { src: p.src, alt: '', loading: 'lazy' }));
      if (p.video) b.setAttribute('data-video', '');
      b.addEventListener('click', function () { go(i); });
      thumbsEl.appendChild(b);
    });
    labels(); show();
  }

  function focusables() {
    return Array.prototype.filter.call(root.querySelectorAll('button:not([hidden]), [href], [tabindex]:not([tabindex="-1"])'), function (n) { return !n.disabled && n.offsetParent !== null; });
  }
  function onKey(e) {
    if (!root || root.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !(e.target && e.target.tagName === 'VIDEO')) {
      var rtl = document.documentElement.dir === 'rtl';
      go(idx + ((e.key === 'ArrowRight') !== rtl ? 1 : -1)); e.preventDefault();
    } else if (e.key === 'Tab') {
      var f = focusables(); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!root.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    }
  }

  function open(o) {
    build();
    var wasOpen = !root.hidden;
    if (!wasOpen) lastFocus = document.activeElement;
    fill(o);
    root.hidden = false;
    if (!wasOpen) {
      document.documentElement.classList.add('viewer-open');
      var page = document.getElementById('page'); if (page) page.setAttribute('inert', '');
      requestAnimationFrame(function () { root.classList.add('is-open'); closeB.focus(); });
    }
    if (o.onOpen) o.onOpen();
  }
  function close() {
    if (!root || root.hidden) return;
    tourClear(); stopVideo(); root.classList.remove('is-open'); root.classList.remove('is-tour'); root.hidden = true;
    document.documentElement.classList.remove('viewer-open');
    var page = document.getElementById('page'); if (page) page.removeAttribute('inert');
    var cb = cur && cur.onClose; cur = null;
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) { lastFocus.focus(); } }
    if (cb) cb();
  }

  A.Viewer = { open: open, close: close, isOpen: function () { return !!root && !root.hidden; }, relabel: function () { if (root && !root.hidden) labels(); } };
  A.onLang(function () { if (A.Viewer.isOpen()) labels(); });
})();
