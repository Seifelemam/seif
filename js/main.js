/* ==========================================================================
   MAIN — language (EN / DE / AR with RTL), rendering of all content, header, menu,
   scroll reveals, CV button. Other modules: viewer.js, atlas.js, form.js, entrance.js.
   Shared helpers are exposed on window.App.
   ========================================================================== */
(function () {
  'use strict';
  var SITE = window.SITE, UI = window.UI, CFG = window.CONFIG, MAN = window.MANIFEST, IMG = window.IMAGES || {};
  var LANGS = ['en', 'de', 'ar'];
  var LOCALE = { en: 'en-GB', de: 'de-DE', ar: 'ar-EG-u-nu-latn' };
  var NS = 'http://www.w3.org/2000/svg';
  var state = { lang: 'en' };
  var listeners = [];

  /* ---------------------------- helpers ---------------------------- */
  function t(key, vars) {
    var s = UI[state.lang] && UI[state.lang][key];
    if (s == null) s = UI.en[key];
    if (s == null) return key;
    if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
    return s;
  }
  function tr(o) { if (o == null) return ''; if (typeof o === 'string') return o; return o[state.lang] || o.en || ''; }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v;
      else if (k === 'style') n.setAttribute('style', v); else n.setAttribute(k, v === true ? '' : v);
    });
    (function add(list) {
      [].concat(list == null ? [] : list).forEach(function (c) {
        if (Array.isArray(c)) return add(c);
        if (c == null || c === false) return;
        n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    })(kids);
    return n;
  }
  function icon(id, cls) {
    var s = document.createElementNS(NS, 'svg'); s.setAttribute('aria-hidden', 'true');
    if (cls) s.setAttribute('class', cls);
    var u = document.createElementNS(NS, 'use'); u.setAttribute('href', '#' + id); s.appendChild(u); return s;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); return n; }
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  /* images: only files listed in js/images-present.js are ever requested */
  function splitPath(p) { var i = p.lastIndexOf('/'); return [p.slice(0, i), p.slice(i + 1)]; }
  function exists(folder, file) { var l = IMG[folder]; return !!l && l.indexOf(file) > -1; }
  function existsPath(rel) { var s = splitPath(rel); return exists(s[0], s[1]); }
  function src(folder, file) { return MAN.base + folder + '/' + file; }
  function srcPath(rel) { return MAN.base + rel; }
  function folderFiles(folder) { return (IMG[folder] || []).filter(function (f) { return /\.(jpe?g|png|webp|avif|gif)$/i.test(f); }); }

  /* dates */
  function parseYM(s) { if (!s) return null; var p = s.split('-'); return { y: +p[0], m: p[1] ? +p[1] : null }; }
  function fmtYM(s, long) {
    var d = parseYM(s); if (!d) return '';
    if (!d.m) return String(d.y);
    try { return new Intl.DateTimeFormat(LOCALE[state.lang], { month: long ? 'long' : 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(d.y, d.m - 1, 1))); }
    catch (e) { return pad2(d.m) + '/' + d.y; }
  }
  function fmtRange(from, to) {
    if (!from) return '';
    return fmtYM(from) + ' – ' + (to ? fmtYM(to) : t('exp.present'));
  }

  /* ------------------------- places (shared with atlas.js) ------------------------- */
  function placeWhen(p) {
    if (!p.when) return p.whenText ? tr(p.whenText) : '';
    if (p.until === 'now') return t('jr.since', { y: parseYM(p.when).y });
    return fmtYM(p.when, true);
  }
  var VIDEO = /\.(mp4|webm)$/i, POSTER = /-poster\.(jpe?g|png|webp)$/i;
  function placePhotos(p) {
    var out = [], used = {}, folder = p.folder, label = tr(p.city);
    function item(file, caption, poster) {
      var o = { src: src(folder, file), alt: caption, caption: caption };
      if (VIDEO.test(file)) { o.video = true; o.poster = poster && exists(folder, poster) ? src(folder, poster) : ''; }
      return o;
    }
    (p.photos || []).forEach(function (ph) {
      if (ph.poster) used[ph.poster] = 1;
      if (exists(folder, ph.file)) { used[ph.file] = 1; var o = item(ph.file, tr(ph.caption) || label, ph.poster); o.featured = ph.file === p.featured; out.push(o); }
    });
    folderFiles(folder).forEach(function (f) {
      if (!used[f] && !POSTER.test(f)) out.push(item(f, label + (p.when ? ', ' + parseYM(p.when).y : ''), ''));
    });
    var fi = -1; out.forEach(function (o, i) { if (o.featured && fi < 0) fi = i; });
    if (fi > 0) out.unshift(out.splice(fi, 1)[0]);
    return out;
  }
  function allPlaces() { return MAN.travel.concat(MAN.also.map(function (a) { a.role = 'also'; return a; })); }
  function placeById(id) { var l = allPlaces(); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }

  /* ------------------------- language ------------------------- */
  function applyStatic() {
    var root = document.documentElement;
    root.lang = state.lang; root.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    $$('[data-i18n]').forEach(function (n) { n.textContent = t(n.getAttribute('data-i18n')); });
    $$('[data-i18n-aria]').forEach(function (n) { n.setAttribute('aria-label', t(n.getAttribute('data-i18n-aria'))); });
    $$('[data-i18n-alt]').forEach(function (n) { n.setAttribute('alt', t(n.getAttribute('data-i18n-alt'))); });
    $$('[data-i18n-ph]').forEach(function (n) { n.setAttribute('placeholder', t(n.getAttribute('data-i18n-ph'))); });
    $$('[data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === state.lang ? 'true' : 'false'); });
    $$('.dbtn').forEach(labelDisc);
    document.title = tr(SITE.meta.title);
    var md = $('meta[name="description"]'); if (md) md.setAttribute('content', tr(SITE.meta.description));
    var og = $('meta[property="og:title"]'); if (og) og.setAttribute('content', tr(SITE.meta.title));
  }
  function setLang(l, silent) {
    if (LANGS.indexOf(l) < 0) l = 'en';
    state.lang = l;
    if (!silent) { try { localStorage.setItem('se-lang', l); } catch (e) {} }
    applyStatic(); renderAll();
    listeners.forEach(function (fn) { try { fn(l); } catch (e) { console.error(e); } });
  }

  /* ------------------------- link and CV wiring ------------------------- */
  function wireLinks() {
    $$('[data-link="linkedin"]').forEach(function (a) { a.href = CFG.linkedin; });
    $$('[data-link="email"],[data-link="email-plain"]').forEach(function (a) { a.href = 'mailto:' + CFG.email; });
    var em = $('#email-link'); if (em) em.textContent = CFG.email;
  }
  var cvOK = null;
  function renderCv() {
    /* No CV file yet: the buttons (and the box around the one in Contact) are hidden completely.
       Put assets/cv/Seif_Elemam_CV.pdf there, run tools/sync_images.py, and they appear by themselves. */
    var box = $('.cv-box'); if (box) box.hidden = !cvOK;
    $$('[data-cv]').forEach(function (a) {
      var label = $('[data-cv-label]', a);
      a.hidden = !cvOK;
      if (cvOK) { a.setAttribute('href', CFG.cvFile); a.setAttribute('download', ''); a.removeAttribute('aria-disabled'); if (label) label.textContent = t('hero.cv'); }
      else { a.removeAttribute('href'); a.removeAttribute('download'); a.setAttribute('aria-disabled', 'true'); if (label) label.textContent = t('hero.cv.soon'); }
    });
  }
  function checkCv() {
    cvOK = false; renderCv();
    /* js/images-present.js (written by tools/sync_images.py) says whether the PDF exists: no failing request in the console */
    if (typeof window.CV_READY === 'boolean') { cvOK = window.CV_READY; renderCv(); return; }
    if (!/^https?:$/.test(location.protocol) || !window.fetch) return;
    fetch(CFG.cvFile, { method: 'HEAD', cache: 'no-store' }).then(function (r) {
      var type = (r.headers.get('content-type') || '').toLowerCase();
      cvOK = r.ok && (type.indexOf('pdf') > -1 || type.indexOf('octet') > -1);
      renderCv();
    }).catch(function () { cvOK = false; renderCv(); });
  }

  /* ------------------------- logos ------------------------- */
  function logoNode(key, opts) {
    opts = opts || {};
    var L = MAN.logos[key]; if (!L) return null;
    if (existsPath(L.file)) return el('img', { src: srcPath(L.file), alt: opts.decorative ? '' : L.name, class: opts.cls || '', loading: 'lazy', decoding: 'async' });
    return opts.mono ? el('b', { text: L.mono || L.name }) : null;
  }

  /* ------------------------- details on click ------------------------- */
  /* Nothing long is shown up front: a section shows its headline, and a button opens the rest.
     The open/closed state survives a language switch (the lists are rebuilt in the new language). */
  var openSet = {};
  function labelDisc(btn) {
    var on = btn.getAttribute('aria-expanded') === 'true', s = btn.querySelector('.dbtn__t');
    if (s) s.textContent = t(on ? 'ui.hide' : (btn.getAttribute('data-k') || 'ui.details'));
  }
  function setDisc(btn, panel, on) {
    btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    panel.classList.toggle('is-open', on);
    if (on) panel.removeAttribute('inert'); else panel.setAttribute('inert', '');
    openSet[panel.id] = on; labelDisc(btn);
    if (on) observeReveals();
  }
  function wireDisc(btn, panel) {
    btn.addEventListener('click', function () {
      var on = btn.getAttribute('aria-expanded') !== 'true';
      setDisc(btn, panel, on);
      if (on && panel.id === 'ct-form') setTimeout(function () { var f = $('#f-name'); if (f) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } } }, 80);
    });
  }
  function initDisc() {
    $$('.dbtn[data-disc]').forEach(function (b) {
      var p = document.getElementById(b.getAttribute('data-disc'));
      if (p) { wireDisc(b, p); labelDisc(b); }
    });
  }
  /* a button + panel pair for items that are built by script (experience, education) */
  function itemDisc(key, kids) {
    var id = 'dd-' + key, on = !!openSet[id];
    var panel = el('div', { class: 'disc' + (on ? ' is-open' : ''), id: id }, el('div', { class: 'disc__in' }, el('div', { class: 'disc__pad' }, kids)));
    if (!on) panel.setAttribute('inert', '');
    var btn = el('button', { type: 'button', class: 'dbtn dbtn--sm', 'data-k': 'ui.details', 'aria-expanded': on ? 'true' : 'false', 'aria-controls': id }, [el('span', { class: 'dbtn__t' }), icon('i-plus')]);
    labelDisc(btn); wireDisc(btn, panel);
    return { btn: btn, panel: panel };
  }

  /* ------------------------- renderers ------------------------- */
  function renderVerbs() {
    var box = clear($('#verbs')); if (!box) return;
    SITE.traits.forEach(function (v, i) {
      box.appendChild(el('div', { class: 'verb reveal is-in', style: '--i:' + i }, [
        el('p', { class: 'verb__word', text: tr(v.word) }), el('p', { class: 'verb__text', text: tr(v.text) })]));
    });
  }
  function renderMarketing() {
    var ol = clear($('#collab-list'));
    SITE.collab.forEach(function (c) { ol.appendChild(el('li', { text: tr(c) })); });
    /* The Instagram reels. If a video file reel-N.mp4 (and subtitles reel-N.en.vtt, optionally .de/.ar) is in
       assets/images/marketing/reach-up/, it plays here with its subtitles; the Instagram link always stays. */
    var rl = clear($('#reels-list')), rb = $('#reels'), reels = SITE.reels || [], RF = MAN.marketing.folder;
    var RLANG = { en: 'English', de: 'Deutsch', ar: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' }, withVideo = false;
    if (rb) rb.hidden = !reels.length;
    reels.forEach(function (u, i) {
      var n = i + 1, vf = 'reel-' + n + '.mp4', hasV = exists(RF, vf), kids = [];
      if (hasV) {
        withVideo = true;
        var v = el('video', { src: src(RF, vf) + '#t=0.1', controls: true, playsinline: true, preload: 'metadata', 'aria-label': t('mk.reels.v', { n: n }) });
        ['en', 'de', 'ar'].forEach(function (c) {
          var tf = 'reel-' + n + '.' + c + '.vtt';
          if (exists(RF, tf)) { var tr2 = el('track', { kind: 'subtitles', src: src(RF, tf), srclang: c, label: RLANG[c] }); if (c === 'en') tr2.setAttribute('default', ''); v.appendChild(tr2); }
        });
        kids.push(v);
      }
      kids.push(el('a', { class: hasV ? 'reel__ig' : 'btn btn--gold', href: u, target: '_blank', rel: 'noopener noreferrer', title: 'Instagram' }, [icon(hasV ? 'i-arrow' : 'i-play', 'ico'), el('span', { text: t(hasV ? 'mk.reels.ig' : 'mk.reels.v', { n: n }) })]));
      rl.appendChild(el('li', { class: hasV ? 'reel reel--video' : 'reel' }, kids));
    });
    rl.classList.toggle('reels__list--video', withVideo);
    /* Plain photos under the videos: no caption, no title (decorative image). Hidden until a real file exists. */
    var mm = clear($('#moments')), MO = MAN.marketing.moments;
    if (mm && MO) {
      var mf = (MO.files || []).filter(function (f) { return exists(MO.folder, f); });
      mm.hidden = !mf.length;
      mf.forEach(function (f) { mm.appendChild(el('figure', { class: 'moment' }, [el('img', { src: src(MO.folder, f), alt: '', loading: 'lazy', decoding: 'async' })])); });
    }
    var d = clear($('#develop-list')); SITE.skills.develop.forEach(function (s) { d.appendChild(el('li', { text: tr(s) })); });
    var tl = clear($('#transfer-list')); SITE.skills.transfer.forEach(function (s) { tl.appendChild(el('li', { text: tr(s) })); });

    var lw = $('#logo-reachup'); clear(lw);
    var lg = logoNode('reachup', { cls: '' });
    if (lg) { lw.appendChild(lg); lw.hidden = false; } else lw.hidden = true;

    /* samples: images or short videos you add to assets/images/marketing/reach-up/.
       Nothing is shown (no placeholders, no "coming soon") until at least one real file exists. */
    var box = clear($('#samples'));
    var M = MAN.marketing, listed = {};
    var items = M.slots.map(function (s) { listed[s.file] = 1; return { file: s.file, caption: tr(s.caption) }; });
    (IMG[M.folder] || []).forEach(function (f) { if (!listed[f] && !/^reel-\d+\./i.test(f) && /\.(jpe?g|png|webp|mp4|webm)$/i.test(f)) items.push({ file: f, caption: 'REACH UP' }); });
    items = items.filter(function (it) { return exists(M.folder, it.file); });
    box.hidden = !items.length;
    if (!items.length) return;
    box.appendChild(el('h4', { class: 'samples__title', text: t('mk.samples.title') }));
    var photos = items.filter(function (it) { return !/\.(mp4|webm)$/i.test(it.file); })
      .map(function (it) { return { src: src(M.folder, it.file), alt: it.caption, caption: it.caption }; });
    items.forEach(function (it) {
      if (/\.(mp4|webm)$/i.test(it.file)) {
        box.appendChild(el('div', { class: 'sample' }, [el('video', { src: src(M.folder, it.file), controls: true, playsinline: true, preload: 'none', 'aria-label': it.caption }), el('span', { class: 'cap', text: it.caption })]));
      } else {
        var idx = photos.map(function (p) { return p.src; }).indexOf(src(M.folder, it.file));
        var b = el('button', { type: 'button', class: 'sample', 'aria-label': t('cu.open') + ': ' + it.caption }, [el('img', { src: src(M.folder, it.file), alt: it.caption, loading: 'lazy', decoding: 'async' }), el('span', { class: 'cap', text: it.caption })]);
        b.addEventListener('click', function () { openPhotos({ title: t('mk.collab.title'), kicker: t('mk.collab.tag'), photos: photos, start: idx }); });
        box.appendChild(b);
      }
    });
  }

  /* Voice recordings: put them in assets/audio/voice/ (names ending -en, -de, -ar are labelled by language),
     run tools/sync_images.py, and a "Hear my voice" player appears by itself. Nothing is shown until then. */
  function renderVoice() {
    var box = $('#voice'); if (!box) return;
    clear(box);
    var files = (window.AUDIO || []).slice();
    box.hidden = !files.length;
    if (!files.length) return;
    var LN = { en: 'English', de: 'Deutsch', ar: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' }, order = { en: 0, de: 1, ar: 2 };
    function code(f) { var m = /-(en|de|ar)\.[a-z0-9]+$/i.exec(f); return m ? m[1].toLowerCase() : ''; }
    files.sort(function (a, b) { var x = code(a) in order ? order[code(a)] : 9, y = code(b) in order ? order[code(b)] : 9; return x - y || (a < b ? -1 : 1); });
    box.appendChild(el('h4', { class: 'voice__title', text: t('mk.voice.title') }));
    var audios = [];
    files.forEach(function (f) {
      var c = code(f), label = c ? LN[c] : f.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ');
      var a = el('audio', { controls: true, preload: 'none', src: 'assets/audio/voice/' + f, 'aria-label': label });
      audios.push(a);
      a.addEventListener('play', function () { audios.forEach(function (o) { if (o !== a) o.pause(); }); if (window.IntroAudio) window.IntroAudio.setDuck(true); });
      a.addEventListener('pause', function () { if (window.IntroAudio && !audios.some(function (o) { return !o.paused; })) window.IntroAudio.setDuck(false); });
      a.addEventListener('ended', function () { if (window.IntroAudio) window.IntroAudio.setDuck(false); });
      var row = el('div', { class: 'voice__row' }, [el('span', { class: 'voice__lang', text: label }), a]);
      if (c) row.querySelector('.voice__lang').setAttribute('lang', c);
      box.appendChild(row);
    });
  }
  function renderTimeline() {
    var box = clear($('#timeline')); if (!box) return;
    var list = SITE.experience.slice().sort(function (a, b) {
      if (!a.from && b.from) return -1; if (a.from && !b.from) return 1;
      return (b.from || '').localeCompare(a.from || '');
    });
    list.forEach(function (e, i) {
      var typeLabel = t('exp.t.' + e.type);
      var when = e.from ? fmtRange(e.from, e.to) : '';
      var logo = e.logo ? logoNode(e.logo, { cls: 'tl__logo' }) : null;
      var d = itemDisc('tl' + i, [
        el('ul', { class: 'tl__list' }, e.bullets.map(function (b) { return el('li', { text: tr(b) }); }))
      ]);
      /* an item with a `link` (REACH UP) gets a second, always visible button: it only jumps down to the Marketing
         section (the curtain animation comes from motion.js, which handles every #link). The Details there stay
         closed: the visitor opens them with the Details button. */
      var go = null;
      if (e.link) go = el('a', { class: 'dbtn dbtn--sm tl__go', href: e.link }, [el('span', { class: 'dbtn__t', text: t('exp.seeMarketing') }), icon('i-arrow', 'ico ico--down')]);
      var main = el('div', { class: 'tl__main' }, [
        logo, el('h3', { class: 'tl__org', text: tr(e.org) }),
        el('p', { class: 'tl__role' }, [tr(e.role), e.place ? el('span', { class: 'tl__place', text: ' · ' + tr(e.place) }) : null]),
        go ? el('div', { class: 'tl__btns' }, [d.btn, go]) : d.btn, d.panel
      ]);
      box.appendChild(el('article', { class: 'tl__item reveal', 'data-type': e.type, style: '--i:' + Math.min(i, 3) }, [
        el('div', { class: 'tl__when' }, when ? [when, el('small', { text: typeLabel })] : [typeLabel]), main]));
    });
    observeReveals();
  }

  function renderEducation() {
    var box = clear($('#edu-list')); if (!box) return;
    SITE.education.forEach(function (e, i) {
      var logo = e.logo ? logoNode(e.logo, { decorative: true, mono: true }) : null;
      var when = e.from ? fmtRange(e.from, e.status === 'now' ? '' : e.to) : '';
      var d = e.text ? itemDisc('edu' + i, [el('p', { class: 'edu__text', text: tr(e.text) })]) : null;
      box.appendChild(el('article', { class: 'edu__item reveal', 'data-status': e.status, style: '--i:' + Math.min(i, 3) }, [
        el('div', { class: 'badge', 'aria-hidden': 'true' }, logo),
        el('div', { class: 'edu__body' }, [
          el('span', { class: 'edu__status' }, [el('span', { class: 'stat stat--' + e.status, 'aria-hidden': 'true' }), t('edu.s.' + e.status)]),
          el('p', { class: 'edu__org', text: tr(e.org) + ' · ' + tr(e.place) }),
          el('h3', { class: 'edu__title', text: tr(e.title) }),
          when ? el('p', { class: 'edu__when', text: when }) : null,
          d ? d.btn : null, d ? d.panel : null])
      ]));
    });
    observeReveals();
  }

  /* culture galleries: asymmetrical layouts, real photos when present, tidy placeholders otherwise */
  function galleryPhotos(G) {
    var out = [], used = {};
    G.slots.forEach(function (s) { if (exists(G.folder, s.file)) { used[s.file] = 1; out.push({ key: s.file, src: src(G.folder, s.file), alt: tr(s.alt) || tr(s.caption), caption: tr(s.caption) }); } });
    folderFiles(G.folder).forEach(function (f) { if (!used[f]) out.push({ key: f, src: src(G.folder, f), alt: '', caption: '' }); });
    return out;
  }
  function renderGallery(boxId, G, meta) {
    var box = clear($(boxId)); if (!box) return;
    var photos = galleryPhotos(G), slots = G.slots.slice();
    var listed = {}; slots.forEach(function (s) { listed[s.file] = 1; });
    folderFiles(G.folder).forEach(function (f) { if (!listed[f]) slots.push({ slot: 'x', file: f, caption: { en: '', de: '', ar: '' } }); });
    slots.forEach(function (s) {
      var cap = tr(s.caption), present = exists(G.folder, s.file);
      if (present) {
        var idx = 0; photos.forEach(function (p, i) { if (p.key === s.file) idx = i; });
        var b = el('button', { type: 'button', class: 'tile', 'data-slot': s.slot, role: 'listitem', 'aria-label': t('cu.open') + (cap ? ': ' + cap : '') }, [
          el('img', { src: src(G.folder, s.file), alt: tr(s.alt) || cap, loading: 'lazy', decoding: 'async' }), cap ? el('span', { class: 'cap', text: cap }) : null]);
        b.addEventListener('click', function () { openPhotos({ title: meta.title(), kicker: meta.kicker(), text: meta.text ? meta.text() : '', photos: photos, start: idx }); });
        box.appendChild(b);
      } else {
        box.appendChild(el('div', { class: 'tile', 'data-slot': s.slot, role: 'listitem' }, el('div', { class: 'ph' }, [icon('i-camera'), el('span', { text: cap }), el('small', { text: t('cu.photo.soon') })])));
      }
    });
  }
  /* The Best Koshary Ever recipe page: a card with a preview, "Open PDF" and "Download PDF". It only shows if the PDF exists. */
  function renderCookbook() {
    var C = MAN.culture.cookbook, box = $('#cookbook-card'); if (!C || !box) return;
    clear(box);
    if (!exists(C.folder, C.pdf)) { box.hidden = true; return; }
    box.hidden = false;
    var href = src(C.folder, C.pdf);
    var thumb = exists(C.folder, C.preview)
      ? el('a', { class: 'pdfcard__thumb', href: href, target: '_blank', rel: 'noopener', 'aria-label': t('cu.pdf.open') + ': ' + t('cu.pdf.title') },
          el('img', { src: src(C.folder, C.preview), alt: t('cu.pdf.alt'), loading: 'lazy', decoding: 'async' }))
      : null;
    box.appendChild(thumb);
    box.appendChild(el('div', { class: 'pdfcard__body' }, [
      el('span', { class: 'tag', text: 'PDF' }),
      el('h4', { class: 'pdfcard__title', text: t('cu.pdf.title') }),
      el('p', { class: 'pdfcard__meta', text: t('cu.pdf.meta') }),
      el('div', { class: 'pdfcard__btns' }, [
        el('a', { class: 'btn btn--ink', href: href, target: '_blank', rel: 'noopener' }, [el('span', { text: t('cu.pdf.open') }), icon('i-arrow', 'ico ico--flip')]),
        el('a', { class: 'btn btn--out', href: href, download: C.download || '' }, [icon('i-down', 'ico'), el('span', { text: t('cu.pdf.dl') })])
      ])
    ]));
  }
  function renderCulture() {
    renderGallery('#mosaic-intl', MAN.culture.intl, { title: function () { return t('cu.a.title'); }, kicker: function () { return t('cu.a.eyebrow'); } });
    renderGallery('#aiesec-row', MAN.culture.aiesec, { title: function () { return t('cu.b.title'); }, kicker: function () { return ''; } });
    var lg = clear($('#logo-aiesec')); var l = logoNode('aiesec');
    if (l) { lg.appendChild(l); lg.hidden = false; } else lg.hidden = true;

    /* Berliner Pharaohs: the illustration of me as a pharaoh footballer, with the logo as a round badge on its corner.
       Either one alone still works; with neither file there is a placeholder. */
    var G = MAN.culture.football, s = G.slots[0], s2 = G.slots[1], wrap = clear($('#emblem-wrap'));
    /* a finished picture you drop in (seif-pharaoh.png / .webp / .jpg) replaces the drawn illustration (seif-pharaoh.svg) */
    var artFile = '';
    if (s2) ['seif-pharaoh.png', 'seif-pharaoh.webp', 'seif-pharaoh.jpg', 'seif-pharaoh.svg', s2.file].some(function (f) { if (exists(G.folder, f)) { artFile = f; return true; } return false; });
    var hasLogo = exists(G.folder, s.file), hasArt = !!artFile;
    function ph(slot) { return { src: src(G.folder, slot.file), alt: tr(slot.alt), caption: tr(slot.caption) }; }
    function phArt() { return { src: src(G.folder, artFile), alt: tr(s2.alt), caption: tr(s2.caption) }; }
    function openAt(i) { openPhotos({ title: t('cu.c.title'), kicker: t('cu.c.eyebrow'), text: t('cu.c.note'), photos: (hasArt ? [phArt()] : []).concat(hasLogo ? [ph(s)] : []), start: i }); }
    if (hasArt) {
      var art = el('button', { type: 'button', class: 'pharaoh__art', 'aria-label': t('cu.open') + ': ' + tr(s2.caption) }, el('img', { src: src(G.folder, artFile), alt: tr(s2.alt), loading: 'lazy', decoding: 'async' }));
      art.addEventListener('click', function () { openAt(0); });
      var artImg = art.firstChild; if (artImg) artImg.addEventListener('load', function () { if (artImg.naturalWidth && artImg.naturalHeight) art.style.aspectRatio = artImg.naturalWidth + ' / ' + artImg.naturalHeight; });
      var box = el('div', { class: 'pharaoh' }, art);
      if (hasLogo) {
        var lg2 = el('button', { type: 'button', class: 'emblem pharaoh__logo', 'aria-label': t('cu.open') + ': ' + tr(s.caption) }, el('img', { src: src(G.folder, s.file), alt: tr(s.alt), loading: 'lazy', decoding: 'async' }));
        lg2.addEventListener('click', function () { openAt(1); });
        box.appendChild(lg2);
      }
      wrap.appendChild(box);
    } else if (hasLogo) {
      var b = el('button', { type: 'button', class: 'emblem', 'aria-label': t('cu.open') + ': ' + tr(s.caption) }, el('img', { src: src(G.folder, s.file), alt: tr(s.alt), loading: 'lazy', decoding: 'async' }));
      b.addEventListener('click', function () { openAt(0); });
      wrap.appendChild(b);
    } else wrap.appendChild(el('div', { class: 'emblem' }, el('div', { class: 'ph' }, [icon('i-camera'), el('span', { text: tr(s.caption) })])));

    /* Community photos under the logo and the cartoon: two plain photos side by side at the same height. */
    var cp = clear($('#comm-photos')), CL = (G.photos || []).filter(function (p) { return exists(G.folder, p.file); });
    if (cp) {
      cp.hidden = !CL.length;
      var cphotos = CL.map(function (p) { return { src: src(G.folder, p.file), alt: tr(p.alt) || tr(p.caption), caption: tr(p.caption) }; });
      CL.forEach(function (p, i) {
        var cap = tr(p.caption);
        var bt = el('button', { type: 'button', class: 'tile comm__tile', role: 'listitem', style: '--r:' + p.ratio, 'aria-label': t('cu.open') + (cap ? ': ' + cap : '') },
          [el('img', { src: src(G.folder, p.file), alt: tr(p.alt) || cap, loading: 'lazy', decoding: 'async' }), cap ? el('span', { class: 'cap', text: cap }) : null]);
        bt.addEventListener('click', function () { openPhotos({ title: t('cu.c.title'), kicker: t('cu.c.eyebrow'), text: t('cu.c.note'), photos: cphotos, start: i }); });
        cp.appendChild(bt);
      });
    }

    renderCookbook();

  }
  function openPhotos(o) { if (window.App && App.Viewer) App.Viewer.open(o); }

  function renderAll() {
    renderVerbs(); renderMarketing(); renderVoice(); renderTimeline(); renderEducation(); renderCulture(); renderCv();
  }

  /* ------------------------- scroll reveal, header, nav ------------------------- */
  var revealIO = null;
  function observeReveals() {
    var nodes = $$('.reveal:not(.is-in)');
    if (!('IntersectionObserver' in window)) { nodes.forEach(function (n) { n.classList.add('is-in'); }); return; }
    if (!revealIO) revealIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    nodes.forEach(function (n) { revealIO.observe(n); });
  }
  function initHeader() {
    var h = $('#header'); function on() { h.classList.toggle('is-solid', window.scrollY > 24); }
    on(); window.addEventListener('scroll', on, { passive: true });
    var links = $$('#nav a'), map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { var a = map[e.target.id]; if (a && e.isIntersecting) { links.forEach(function (x) { x.removeAttribute('aria-current'); }); a.setAttribute('aria-current', 'true'); } });
      }, { rootMargin: '-45% 0px -50% 0px' });
      Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
    }
  }
  function initMenu() {
    var m = $('#menu'), openB = $('#menu-open'), closeB = $('#menu-close');
    function open() { m.classList.add('is-open'); openB.setAttribute('aria-expanded', 'true'); document.documentElement.style.overflow = 'hidden'; closeB.focus(); }
    function close(focus) { m.classList.remove('is-open'); openB.setAttribute('aria-expanded', 'false'); document.documentElement.style.overflow = ''; if (focus) openB.focus(); }
    openB.addEventListener('click', open); closeB.addEventListener('click', function () { close(true); });
    $$('a', m).forEach(function (a) { a.addEventListener('click', function () { close(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && m.classList.contains('is-open')) close(true); });
    /* menu is hidden visually; keep it out of the tab order while closed */
    m.setAttribute('inert', '');
    new MutationObserver(function () { if (m.classList.contains('is-open')) m.removeAttribute('inert'); else m.setAttribute('inert', ''); }).observe(m, { attributes: true, attributeFilter: ['class'] });
  }
  function initCopy() {
    var b = $('#copy-email'); if (!b) return;
    b.addEventListener('click', function () {
      function done(ok) { b.textContent = ok ? t('ct.copied') : t('ct.copyfail'); setTimeout(function () { b.textContent = t('ct.copy'); }, 1800); }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(CFG.email).then(function () { done(true); }, function () { done(false); });
      else { var r = document.createRange(); r.selectNodeContents($('#email-link')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); done(false); }
    });
  }
  function initLangButtons() {
    $$('[data-lang]').forEach(function (b) { b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); }); });
  }

  /* ------------------------- public API ------------------------- */
  window.App = {
    t: t, tr: tr, $: $, $$: $$, el: el, icon: icon, clear: clear, NS: NS,
    get lang() { return state.lang; },
    setLang: setLang, onLang: function (fn) { listeners.push(fn); },
    fmtYM: fmtYM, parseYM: parseYM, placeWhen: placeWhen, placePhotos: placePhotos, placeById: placeById, allPlaces: allPlaces,
    exists: exists, src: src, observeReveals: observeReveals
  };

  /* ------------------------- start ------------------------- */
  var stored = CFG.defaultLang || 'en';
  try { stored = localStorage.getItem('se-lang') || stored; } catch (e) {}
  function initReplay() {                                /* footer link: show the entrance (the penalty game) again */
    var a = $('#replay-intro'); if (!a) return;
    a.addEventListener('click', function (e) {
      e.preventDefault();
      try { sessionStorage.removeItem('se-intro'); } catch (x) {}
      try { history.replaceState(null, '', location.pathname + location.search.replace(/([?&])intro=\d&?/, '$1').replace(/[?&]$/, '')); } catch (x) {}
      location.reload();
    });
  }
  function initHeroMenu() {                              /* the one button in the hero: it opens the list of all sections */
    var b = $('#hero-discover'), menu = $('#hero-menu'); if (!b || !menu) return;
    function set(on) { menu.hidden = !on; b.setAttribute('aria-expanded', on ? 'true' : 'false'); }
    b.addEventListener('click', function () { set(menu.hidden); });
    menu.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { set(false); try { b.focus(); } catch (x) {} } });
  }
  wireLinks(); initLangButtons(); initHeader(); initMenu(); initCopy(); initDisc(); initReplay(); initHeroMenu();
  setLang(stored, true);
  checkCv(); observeReveals();
})();
