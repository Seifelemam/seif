/* ==========================================================================
   SCENES — every section has its own little signature animation when you jump to it from the menu or a button.
     About      an ID card slides in, the avatar pops, the lines write themselves, an info badge appears
     Marketing  a film clapperboard claps: "Action!"
     Experience a briefcase opens and cards rise out of it
     Education  a book opens and its pages turn
     Culture    people of different cultures join hands in a ring around a turning globe
     Contact    a phone rings and a message arrives
     Welcome    (not a section) three speech bubbles say hello in English, German and Arabic: shown right after the goal, when the site opens
     Journey    the plane (drawn in motion.js)
     Home       (the footer link and the name in the header) a little house: the roof drops on, the windows light up, smoke rises
   Drawn as inline SVG and animated with CSS (see "26 · Section scenes" in css/styles.css). Plain site colours only: no yellow.
   motion.js asks for scene(kind) and puts the result into #pt-scene while the blue curtain is down.
   ========================================================================== */
(function () {
  'use strict';
  var KIND = { about: 'card', marketing: 'clap', experience: 'case', education: 'book', culture: 'together', contact: 'phone', journey: 'plane', top: 'home' };

  function star(x, y, s, d) {                                   /* a small four-pointed sparkle */
    return '<path class="sc-spark" style="--d:' + d + 's;transform-origin:' + x + 'px ' + y + 'px;transform-box:view-box" d="M' + x + ' ' + (y - s) + ' Q' + x + ' ' + y + ' ' + (x + s) + ' ' + y + ' Q' + x + ' ' + y + ' ' + x + ' ' + (y + s) + ' Q' + x + ' ' + y + ' ' + (x - s) + ' ' + y + ' Q' + x + ' ' + y + ' ' + x + ' ' + (y - s) + ' Z" fill="#fff"/>';
  }
  function lines(x, y, w, n, gap, col, sw) {                    /* ruled lines, like text on a page */
    var s = '';
    for (var i = 0; i < n; i++) s += '<path d="M' + x + ' ' + (y + i * gap) + ' h' + (i === n - 1 ? w * 0.6 : w) + '" stroke="' + col + '" stroke-width="' + (sw || 4) + '" stroke-linecap="round"/>';
    return s;
  }

  /* The welcome after the penalty goal: hello in the three languages of the site (shown by motion.js, see PTWelcome) */
  function hello() {
    function bubble(cls, x, y, w, h, tail, txt, ar) {
      var tx = tail === 'l' ? x + 26 : (tail === 'r' ? x + w - 26 : x + w / 2);
      return '<g class="sc-bub ' + cls + '"><path d="M' + (x + 22) + ' ' + y + ' H' + (x + w - 22) + ' Q' + (x + w) + ' ' + y + ' ' + (x + w) + ' ' + (y + 22) + ' V' + (y + h - 22) +
        ' Q' + (x + w) + ' ' + (y + h) + ' ' + (x + w - 22) + ' ' + (y + h) + ' H' + (tx + 18) + ' L' + tx + ' ' + (y + h + 22) + ' L' + (tx - 8) + ' ' + (y + h) + ' H' + (x + 22) +
        ' Q' + x + ' ' + (y + h) + ' ' + x + ' ' + (y + h - 22) + ' V' + (y + 22) + ' Q' + x + ' ' + y + ' ' + (x + 22) + ' ' + y + ' Z" fill="#fff" stroke="#0a1640" stroke-width="4" stroke-linejoin="round"/>' +
        '<text class="' + (ar ? 'sc-ar' : 'sc-t') + '" x="' + (x + w / 2) + '" y="' + (y + h / 2 + (ar ? 15 : 13)) + '" text-anchor="middle">' + txt + '</text></g>';
    }
    return '<svg class="sc" viewBox="0 0 400 300" aria-hidden="true" focusable="false">' +
      bubble('b1', 12, 128, 150, 76, 'l', 'Hallo', false) + bubble('b2', 124, 28, 152, 78, 'c', 'مرحبا', true) + bubble('b3', 238, 142, 150, 76, 'r', 'Hello', false) +
      star(50, 70, 14, 0.9) + star(350, 74, 11, 1.05) + star(364, 252, 13, 1.2) + star(34, 246, 10, 1.1) + '</svg>';
  }

  /* Marketing: the clapperboard, and the word "Action!" */
  function clap(lang) {
    var word = lang === 'ar' ? 'أكشن!' : 'ACTION!';
    var stripes = '';
    for (var i = 0; i < 6; i++) stripes += '<path d="M' + (90 + i * 44 - 20) + ' 130 L' + (90 + i * 44 + 14) + ' 96 H' + (90 + i * 44 + 36) + ' L' + (90 + i * 44 + 2) + ' 130 Z" fill="#0a1640"/>';
    var rays = '';
    for (var r = 0; r < 9; r++) { var a = (-170 + r * 20) * Math.PI / 180; rays += '<path d="M' + (200 + Math.cos(a) * 110).toFixed(1) + ' ' + (150 + Math.sin(a) * 100).toFixed(1) + ' L' + (200 + Math.cos(a) * 140).toFixed(1) + ' ' + (150 + Math.sin(a) * 124).toFixed(1) + '" stroke="#fff" stroke-width="5" stroke-linecap="round"/>'; }
    return '<svg class="sc" viewBox="0 0 400 300" aria-hidden="true" focusable="false">' +
      '<g class="sc-rays">' + rays + '</g>' +
      '<g class="sc-slate"><rect x="90" y="134" width="220" height="128" rx="6" fill="#0a1640" stroke="#fff" stroke-width="4"/>' +
        lines(112, 164, 176, 3, 24, '#9db0ff', 5) + '<rect x="112" y="234" width="40" height="18" rx="3" fill="#d3202f"/><rect x="164" y="234" width="40" height="18" rx="3" fill="#fff" opacity=".85"/>' +
      '</g>' +
      '<g class="sc-stick" style="transform-origin:92px 130px;transform-box:view-box"><rect x="90" y="96" width="220" height="34" rx="4" fill="#fff" stroke="#0a1640" stroke-width="4"/>' +
        '<clipPath id="scStick"><rect x="92" y="98" width="216" height="30"/></clipPath><g clip-path="url(#scStick)">' + stripes + '</g></g>' +
      '<text class="sc-act ' + (lang === 'ar' ? 'sc-ar' : 'sc-t') + '" x="200" y="70" text-anchor="middle">' + word + '</text>' + '</svg>';
  }

  /* Experience: a briefcase opens, cards rise out of it */
  function briefcase() {
    function card(cls, x, inner) {
      return '<g class="sc-card ' + cls + '" style="transform-origin:' + (x + 40) + 'px 150px;transform-box:view-box"><rect x="' + x + '" y="62" width="80" height="104" rx="7" fill="#fff" stroke="#0a1640" stroke-width="4"/>' + inner + '</g>';
    }
    var chart = '<rect x="' + (122) + '" y="124" width="12" height="26" fill="#1b3df5"/><rect x="' + 140 + '" y="106" width="12" height="44" fill="#1b3df5"/><rect x="' + 158 + '" y="88" width="12" height="62" fill="#d3202f"/>';
    var tick = lines(118, 80, 44, 3, 16, '#9db0ff', 4) + '<path d="M128 132 l9 9 l17 -19" stroke="#1b3df5" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    var person = '<circle cx="240" cy="96" r="12" fill="#1b3df5"/><path d="M220 140 Q240 108 260 140 Z" fill="#1b3df5"/>' + lines(224, 148, 32, 1, 0, '#9db0ff', 4);
    return '<svg class="sc" viewBox="0 0 400 300" aria-hidden="true" focusable="false">' +
      '<rect x="108" y="124" width="184" height="40" fill="#050c28"/>' +
      card('c1', 112, chart) + card('c2', 160, tick) + card('c3', 208, person) +
      '<g class="sc-body"><rect x="100" y="158" width="200" height="104" rx="10" fill="#0a1640" stroke="#fff" stroke-width="4"/><path d="M100 204 H300" stroke="#fff" stroke-opacity=".3" stroke-width="3"/><rect x="186" y="190" width="28" height="26" rx="5" fill="#fff"/></g>' +
      '<g class="sc-lid" style="transform-origin:100px 168px;transform-box:view-box"><path d="M162 126 V108 Q162 98 172 98 H228 Q238 98 238 108 V126" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/>' +
        '<rect x="100" y="124" width="200" height="44" rx="10" fill="#0a1640" stroke="#fff" stroke-width="4"/></g>' +
      '<g class="sc-check"><circle cx="300" cy="104" r="26" fill="#fff" stroke="#0a1640" stroke-width="4"/><path d="M288 104 l9 10 l17 -20" stroke="#1b3df5" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>' +
      star(52, 96, 12, 1.0) + star(350, 196, 12, 1.15) + '</svg>';
  }

  /* Education: a book opens and the pages turn */
  function book() {
    var pageL = '<rect x="60" y="64" width="140" height="172" rx="4" fill="#fff" stroke="#0a1640" stroke-width="4"/>' + lines(78, 92, 104, 6, 22, '#9db0ff', 5);
    var pageR = '<rect x="200" y="64" width="140" height="172" rx="4" fill="#fff" stroke="#0a1640" stroke-width="4"/><circle cx="270" cy="130" r="30" fill="#d3202f"/><path d="M252 136 l12 12 l24 -28" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' + lines(218, 186, 104, 2, 22, '#9db0ff', 5);
    return '<svg class="sc" viewBox="0 0 400 300" aria-hidden="true" focusable="false"><g class="sc-bk">' +
      '<rect x="200" y="58" width="148" height="184" rx="8" fill="#0a1640"/>' +
      '<g class="sc-pl"><rect x="52" y="58" width="148" height="184" rx="8" fill="#0a1640"/>' + pageL + '</g>' + pageR +
      '<g class="sc-flip f1" style="transform-origin:200px 150px;transform-box:view-box"><rect x="200" y="64" width="140" height="172" rx="4" fill="#fff" stroke="#0a1640" stroke-width="4"/>' + lines(218, 92, 104, 6, 22, '#1b3df5', 5) + '</g>' +
      '<g class="sc-cover" style="transform-origin:200px 150px;transform-box:view-box"><rect x="200" y="58" width="150" height="184" rx="8" fill="#0a1640" stroke="#fff" stroke-width="5"/>' +
        '<circle cx="275" cy="120" r="26" fill="none" stroke="#fff" stroke-width="5"/><path d="M249 120 H301 M275 94 Q258 120 275 146 Q292 120 275 94" stroke="#fff" stroke-width="4" fill="none"/>' + lines(236, 176, 78, 2, 20, '#fff', 6) + '</g></g>' +
      star(54, 40, 13, 1.35) + star(352, 44, 11, 1.45) + star(366, 260, 12, 1.55) + '</svg>';
  }

  /* Culture: people of different backgrounds join hands around a turning globe (Egypt is the red dot) */
  function together() {
    var cx = 200, cy = 150, fills = ['#ffffff', '#0a1640', '#d3202f', '#9db0ff'], ppl = '';
    for (var i = 0; i < 8; i++) {
      var a = (-90 + i * 45) * Math.PI / 180, x = cx + Math.cos(a) * 150, y = cy + Math.sin(a) * 106;
      ppl += '<g class="sc-per" style="--i:' + i + '"><g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(1.45)"><g class="sc-hop">' +
        '<path d="M-12 21 Q-12 -3 0 -3 Q12 -3 12 21 Z" fill="' + fills[i % 4] + '" stroke="#0a1640" stroke-width="2.6" stroke-linejoin="round"/>' +
        '<circle cx="0" cy="-14" r="9" fill="#fff" stroke="#0a1640" stroke-width="2.6"/></g></g></g>';
    }
    return '<svg class="sc" viewBox="0 0 400 300" aria-hidden="true" focusable="false">' +
      '<ellipse class="sc-ring" cx="200" cy="150" rx="150" ry="106" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>' +
      '<g class="sc-glb"><circle cx="200" cy="150" r="64" fill="#fff" stroke="#0a1640" stroke-width="4"/>' +
        '<clipPath id="scGlobe"><circle cx="200" cy="150" r="62"/></clipPath><g clip-path="url(#scGlobe)">' +
          '<path d="M130 120 H270 M130 150 H270 M130 180 H270" stroke="#9db0ff" stroke-width="3" fill="none"/>' +
          '<ellipse class="sc-mer m1" cx="200" cy="150" rx="62" ry="62" fill="none" stroke="#9db0ff" stroke-width="3"/>' +
          '<ellipse class="sc-mer m2" cx="200" cy="150" rx="62" ry="62" fill="none" stroke="#9db0ff" stroke-width="3"/>' +
          '<ellipse class="sc-mer m3" cx="200" cy="150" rx="62" ry="62" fill="none" stroke="#9db0ff" stroke-width="3"/>' +
        '</g><circle class="sc-egypt" cx="214" cy="132" r="7.5" fill="#d3202f" stroke="#fff" stroke-width="2.5"/></g>' +
      ppl + star(36, 36, 12, 1.3) + star(366, 38, 11, 1.45) + star(34, 266, 11, 1.6) + star(368, 264, 12, 1.5) + '</svg>';
  }

  /* About: an ID card with an avatar, written lines, Egypt's flag and an info badge */
  function card() {
    function ln(x, y, w, col, sw, i) { return '<path class="sc-wr" style="--i:' + i + '" d="M' + x + ' ' + y + ' h' + w + '" stroke="' + col + '" stroke-width="' + sw + '" stroke-linecap="round" fill="none"/>'; }
    return '<svg class="sc" viewBox="0 0 400 300" aria-hidden="true" focusable="false">' +
      '<g class="sc-id"><rect x="70" y="52" width="260" height="196" rx="12" fill="#fff" stroke="#0a1640" stroke-width="4"/>' +
        '<path d="M72 64 Q72 54 84 54 H316 Q328 54 328 64 V92 H72 Z" fill="#1b3df5"/><rect x="176" y="64" width="48" height="12" rx="6" fill="#050c28" opacity=".55"/>' +
        '<g class="sc-av"><circle cx="124" cy="150" r="32" fill="#eef2ff" stroke="#0a1640" stroke-width="3.5"/><circle cx="124" cy="141" r="11" fill="#1b3df5"/><path d="M101 173 Q124 144 147 173 Z" fill="#1b3df5"/></g>' +
        ln(172, 120, 118, '#0a1640', 8, 0) + ln(172, 142, 92, '#9db0ff', 6, 1) +
        '<g class="sc-flag"><rect x="172" y="158" width="48" height="10" fill="#d3202f"/><rect x="172" y="168" width="48" height="10" fill="#fff"/><rect x="172" y="178" width="48" height="10" fill="#0a1640"/><rect x="172" y="158" width="48" height="30" fill="none" stroke="#0a1640" stroke-width="3"/></g>' +
        ln(232, 173, 58, '#9db0ff', 6, 2) + ln(92, 210, 216, '#9db0ff', 5, 3) + ln(92, 228, 150, '#9db0ff', 5, 4) +
      '</g>' +
      '<g class="sc-badge"><circle cx="330" cy="60" r="26" fill="#fff" stroke="#0a1640" stroke-width="4"/><circle cx="330" cy="49" r="3.8" fill="#1b3df5"/><rect x="326.4" y="57" width="7.2" height="18" rx="3.4" fill="#1b3df5"/></g>' +
      star(46, 84, 12, 1.3) + star(360, 226, 12, 1.5) + star(40, 244, 10, 1.6) + '</svg>';
  }

  /* Contact: a phone rings, a message arrives */
  function phone() {
    function wave(cls, side, k) {
      var x = side < 0 ? 140 - k * 22 : 260 + k * 22, c = side * (14 + k * 6);
      return '<path class="sc-wave ' + cls + '" style="--k:' + k + '" d="M' + x + ' ' + (110 - k * 10) + ' q' + c + ' ' + (40 + k * 10) + ' 0 ' + (80 + k * 20) + '" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>';
    }
    return '<svg class="sc" viewBox="0 0 400 300" aria-hidden="true" focusable="false">' +
      wave('wl', -1, 0) + wave('wl', -1, 1) + wave('wl', -1, 2) + wave('wr', 1, 0) + wave('wr', 1, 1) + wave('wr', 1, 2) +
      '<g class="sc-phone" style="transform-origin:200px 150px;transform-box:view-box"><rect x="150" y="34" width="100" height="212" rx="20" fill="#0a1640" stroke="#fff" stroke-width="5"/>' +
        '<rect x="159" y="62" width="82" height="156" rx="7" fill="#eef2ff"/><rect x="186" y="44" width="28" height="7" rx="3.5" fill="#fff" opacity=".6"/>' +
        '<circle cx="200" cy="108" r="22" fill="#1b3df5"/><circle cx="200" cy="101" r="7.5" fill="#fff"/><path d="M186 124 Q200 106 214 124 Z" fill="#fff"/>' + lines(176, 148, 48, 2, 14, '#9db0ff', 4) +
        '<circle class="sc-no" cx="176" cy="196" r="12" fill="#d3202f"/><circle class="sc-yes" cx="224" cy="196" r="12" fill="#1b3df5"/><path d="M219 196 l4 4 l7 -9" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>' +
      '<g class="sc-mail" style="transform-origin:316px 70px;transform-box:view-box"><rect x="274" y="44" width="84" height="58" rx="7" fill="#fff" stroke="#0a1640" stroke-width="4"/><path d="M278 50 L316 80 L354 50" fill="none" stroke="#1b3df5" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>' +
        '<circle cx="354" cy="46" r="13" fill="#d3202f" stroke="#fff" stroke-width="3"/><text class="sc-t" x="354" y="52" text-anchor="middle" style="font-size:17px" fill="#fff">1</text></g>' +
      star(52, 60, 12, 1.2) + star(60, 250, 11, 1.4) + '</svg>';
  }

  /* Home: a little house with lit windows and smoke from the chimney */
  function house() {
    function puff(k, x) { return '<circle class="sc-smoke" style="--k:' + k + '" cx="' + x + '" cy="58" r="' + (9 + k * 2) + '" fill="#fff"/>'; }
    function win(x) {
      return '<g class="sc-hwin"><rect x="' + x + '" y="158" width="34" height="34" rx="3" fill="#eef2ff" stroke="#0a1640" stroke-width="4"/>' +
        '<path d="M' + (x + 17) + ' 158 V192 M' + x + ' 175 H' + (x + 34) + '" stroke="#0a1640" stroke-width="3"/></g>';
    }
    return '<svg class="sc" viewBox="0 0 400 300" aria-hidden="true" focusable="false">' +
      '<path class="sc-hgrd" d="M52 252 H348" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/>' +
      puff(0, 262) + puff(1, 270) + puff(2, 278) +
      '<g class="sc-hbody"><rect x="112" y="128" width="176" height="124" fill="#fff" stroke="#0a1640" stroke-width="5" stroke-linejoin="round"/>' + win(128) + win(238) +
        '<rect x="176" y="178" width="48" height="74" fill="#1b3df5" stroke="#0a1640" stroke-width="4"/><circle cx="214" cy="218" r="3.5" fill="#fff"/></g>' +
      '<rect class="sc-hchim" x="248" y="68" width="28" height="52" fill="#0a1640" stroke="#fff" stroke-width="4"/>' +
      '<path class="sc-hroof" d="M94 134 L200 52 L306 134 Z" fill="#0a1640" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>' +
      star(52, 70, 12, 1.2) + star(352, 96, 11, 1.4) + star(56, 214, 10, 1.6) + '</svg>';
  }

  var MAKE = { hello: hello, clap: clap, 'case': briefcase, book: book, together: together, card: card, phone: phone, home: house };
  window.PTScenes = {
    kindFor: function (id) { return KIND[id] || ''; },
    html: function (kind, lang) { return MAKE[kind] ? MAKE[kind](lang) : ''; }
  };
})();
