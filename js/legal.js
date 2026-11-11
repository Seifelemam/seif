/* Impressum and Datenschutz page. Independent of main.js; reads the same language choice (se-lang). */
(function () {
  'use strict';
  var UI = window.UI, SITE = window.SITE, CFG = window.CONFIG, LANGS = ['en', 'de', 'ar'];
  var lang = 'en';
  try { var s = localStorage.getItem('se-lang'); if (LANGS.indexOf(s) > -1) lang = s; } catch (e) {}
  var root = document.getElementById('legal-root');
  function tr(o) { return o[lang] || o.en; }

  function para(text) {
    var p = document.createElement('p'), provider = (CFG.form && CFG.form.providerName) || 'FormSubmit';
    text = text.replace(/\{provider\}/g, provider);
    /* highlight every [bracketed] gap so it cannot be missed */
    text.split(/(\[[^\]]+\])/).forEach(function (part) {
      if (!part) return;
      if (part.charAt(0) === '[') { var m = document.createElement('mark'); m.textContent = part; p.appendChild(m); }
      else p.appendChild(document.createTextNode(part));
    });
    return p;
  }
  function render() {
    var d = document.documentElement;
    d.classList.remove('no-js'); d.classList.add('js'); d.lang = lang; d.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.getElementById('legal-back').textContent = UI[lang]['legal.back'];
    document.title = 'Impressum & Datenschutz · Seif Elemam';
    Array.prototype.forEach.call(document.querySelectorAll('[data-lang]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false'); });
    while (root.firstChild) root.removeChild(root.firstChild);
    SITE.legal.forEach(function (sec) {
      var s = document.createElement('section'); s.id = sec.id; s.className = 'legal__sec';
      var h = document.createElement('h1'); h.className = 'h2'; h.textContent = tr(sec.title); s.appendChild(h);
      sec.body.forEach(function (b) { s.appendChild(para(tr(b))); });
      root.appendChild(s);
    });
    if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-lang]'), function (b) {
    b.addEventListener('click', function () {
      lang = b.getAttribute('data-lang'); try { localStorage.setItem('se-lang', lang); } catch (e) {} render();
    });
  });
  render();
})();
