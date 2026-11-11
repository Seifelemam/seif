/* ==========================================================================
   ATLAS — an original, stylised world map drawn in SVG (Equal Earth projection, dot-matrix land).
   • Every destination is a real marker you can open directly (mouse, touch or keyboard).
   • Markers that overlap are grouped into a numbered cluster; select it to zoom in.
   • Solid lines are drawn only for moves I can confirm (see MANIFEST.routes).
   • A dotted line with arrows follows the ORDER of all my places and trips (it is not an exact travel route).
   • "Start the journey" is a guided tour: it flies to every place in order, draws the line, opens the photos by
     themselves, closes them and moves on (the gallery has pause / next place / stop buttons).
   Data: js/manifest.js · outlines: js/world.js · photo panel: js/viewer.js
   ========================================================================== */
(function () {
  'use strict';
  var A = window.App, W = window.WORLD, MAN = window.MANIFEST;
  if (!A || !W || !MAN) return;
  var el = A.el, t = A.t, tr = A.tr, NS = A.NS;
  var stage = A.$('#atlas-stage'), svg = A.$('#atlas-svg');
  if (!stage || !svg) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Equal Earth projection ---------------- */
  var A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, S3 = Math.sqrt(3), RAD = Math.PI / 180;
  var LAT_TOP = 84, LAT_BOT = -58;
  function proj(lon, lat) {
    var th = Math.asin(S3 / 2 * Math.sin(lat * RAD)), t2 = th * th, t6 = t2 * t2 * t2;
    return [2 * S3 * (lon * RAD) * Math.cos(th) / (3 * (9 * A4 * t6 * t2 + 7 * A3 * t6 + 3 * A2 * t2 + A1)), th * (A1 + A2 * t2 + A3 * t6 + A4 * t6 * t2)];
  }
  function inv(x, y) {
    var th = y, i, t2, t6, f, fp;
    for (i = 0; i < 12; i++) { t2 = th * th; t6 = t2 * t2 * t2; f = th * (A1 + A2 * t2 + A3 * t6 + A4 * t6 * t2) - y; fp = A1 + 3 * A2 * t2 + 7 * A3 * t6 + 9 * A4 * t6 * t2; th -= f / fp; }
    t2 = th * th; t6 = t2 * t2 * t2;
    return [3 * x * (9 * A4 * t6 * t2 + 7 * A3 * t6 + 3 * A2 * t2 + A1) / (2 * S3 * Math.cos(th)) / RAD, Math.asin(2 * Math.sin(th) / S3) / RAD];
  }
  var XMIN = proj(-180, 0)[0], XMAX = proj(180, 0)[0], YTOP = proj(0, LAT_TOP)[1], YBOT = proj(0, LAT_BOT)[1];
  var SC = 1000 / (XMAX - XMIN), WB = { w: 1000, h: (YTOP - YBOT) * SC };
  function toW(lon, lat) { var p = proj(lon, lat); return [(p[0] - XMIN) * SC, (YTOP - p[1]) * SC]; }

  /* ---------------- geometry helpers ---------------- */
  function prep(list) {
    return list.map(function (pts) {
      var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      pts.forEach(function (p) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; });
      return { pts: pts, x0: x0, x1: x1, y0: y0, y1: y1 };
    });
  }
  function inPoly(x, y, pts) {
    var c = false;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  function inAny(list, x, y) {
    for (var i = 0; i < list.length; i++) { var p = list[i]; if (x >= p.x0 && x <= p.x1 && y >= p.y0 && y <= p.y1 && inPoly(x, y, p.pts)) return true; }
    return false;
  }
  function polyPath(pts) { return 'M' + pts.map(function (p) { var w = toW(p[0], p[1]); return w[0].toFixed(1) + ' ' + w[1].toFixed(1); }).join('L') + 'Z'; }
  function svgEl(tag, attrs) { var n = document.createElementNS(NS, tag); if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); }); return n; }

  /* ---------------- static layers ---------------- */
  var world = svgEl('g', { class: 'atlas__world' });
  var overlay = svgEl('g', { class: 'atlas__overlay' });
  svg.appendChild(world); svg.appendChild(overlay);

  function line(pts) { return 'M' + pts.map(function (p) { var w = toW(p[0], p[1]); return w[0].toFixed(1) + ' ' + w[1].toFixed(1); }).join('L'); }
  (function buildStatic() {
    var edge = [], lon, lat;
    for (lon = -180; lon <= 180; lon += 4) edge.push([lon, LAT_TOP]);
    for (lat = LAT_TOP; lat >= LAT_BOT; lat -= 4) edge.push([180, lat]);
    for (lon = 180; lon >= -180; lon -= 4) edge.push([lon, LAT_BOT]);
    for (lat = LAT_BOT; lat <= LAT_TOP; lat += 4) edge.push([-180, lat]);
    world.appendChild(svgEl('path', { class: 'sea', d: line(edge) + 'Z' }));

    var g = '';
    for (lon = -150; lon <= 150; lon += 30) { var m = []; for (lat = LAT_BOT; lat <= LAT_TOP; lat += 4) m.push([lon, lat]); g += line(m); }
    for (lat = -30; lat <= 60; lat += 30) { var r = []; for (lon = -180; lon <= 180; lon += 6) r.push([lon, lat]); g += line(r); }
    world.appendChild(svgEl('path', { class: 'grat', d: g }));

    world.appendChild(svgEl('path', { class: 'land', d: W.land.map(polyPath).join('') }));
    world.appendChild(svgEl('path', { class: 'lake', d: W.water.map(polyPath).join('') }));
    world.appendChild(svgEl('path', { class: 'egypt', d: polyPath(W.egypt) }));

    /* dot matrix: even spacing in the projected plane, hex offset per row */
    var D = 6.4, land = prep(W.land), water = prep(W.water), eg = prep([W.egypt]), n = [], e = [], row = 0, wx, wy;
    for (wy = D / 2; wy < WB.h; wy += D, row++) {
      var ry = YTOP - wy / SC;
      for (wx = (row % 2 ? D : D / 2); wx < WB.w; wx += D) {
        var ll = inv(XMIN + wx / SC, ry);
        if (!(ll[0] >= -180 && ll[0] <= 180)) continue;
        if (inAny(land, ll[0], ll[1]) && !inAny(water, ll[0], ll[1])) (inAny(eg, ll[0], ll[1]) ? e : n).push('M' + wx.toFixed(1) + ' ' + wy.toFixed(1) + 'h0');
      }
    }
    world.appendChild(dotsN = svgEl('path', { class: 'dots', d: n.join('') }));
    world.appendChild(dotsE = svgEl('path', { class: 'dots dots--egypt', d: e.join('') }));
  })();
  var dotsN, dotsE;

  /* ---------------- overlay: continent names, routes, markers ---------------- */
  var contG = svgEl('g', { class: 'conts' }), routeG = svgEl('g', { class: 'routes' }), markG = svgEl('g', { class: 'marks' }), clusterG = svgEl('g', { class: 'clusters' });
  overlay.appendChild(contG); overlay.appendChild(routeG); overlay.appendChild(markG); overlay.appendChild(clusterG);

  var conts = W.labels.map(function (c) {
    var w = toW(c.lon, c.lat), n = svgEl('text', { class: 'cont', 'text-anchor': 'middle' }); contG.appendChild(n);
    return { key: c.key, wx: w[0], wy: w[1], node: n };
  });
  var egW = toW(30.2, 26.2), egLabel = svgEl('text', { class: 'cont cont--egypt', 'text-anchor': 'middle' }); contG.appendChild(egLabel);

  function shapes(role) {
    var out = [];
    if (role === 'origin') { out.push(svgEl('circle', { class: 'mk__halo', r: 15 }), svgEl('circle', { class: 'mk__core', r: 8 }), svgEl('circle', { class: 'mk__dot', r: 2.8 })); }
    else if (role === 'home') { out.push(svgEl('circle', { class: 'mk__halo', r: 13 }), svgEl('circle', { class: 'mk__core', r: 7.5 }), svgEl('circle', { class: 'mk__dot', r: 2.6 })); }
    else if (role === 'residence') { out.push(svgEl('circle', { class: 'mk__ring', r: 7 }), svgEl('circle', { class: 'mk__core', r: 2.8 })); }
    else if (role === 'visit') { out.push(svgEl('circle', { class: 'mk__halo', r: 10 }), svgEl('circle', { class: 'mk__core', r: 5 })); }
    else { out.push(svgEl('circle', { class: 'mk__ring', r: 4 })); }
    return out;
  }

  var items = [], byId = {};
  A.allPlaces().forEach(function (p) {
    var w = toW(p.lng, p.lat), g = svgEl('g', { class: 'mk mk--' + p.role, tabindex: '0', role: 'button', 'data-id': p.id });
    g.appendChild(svgEl('circle', { class: 'mk__hit', r: 17 }));
    g.appendChild(svgEl('circle', { class: 'mk__pulse', r: 8 }));
    shapes(p.role).forEach(function (s) { g.appendChild(s); });
    var lbl = svgEl('text', { class: 'mk__lbl' }); g.appendChild(lbl);
    var it = { p: p, id: p.id, role: p.role, wx: w[0], wy: w[1], g: g, lbl: lbl, x: 0, y: 0, hidden: false, labelW: 40, spot: false };
    g.addEventListener('click', function () { if (performance.now() < suppressUntil) return; openPlace(p.id, false); });
    g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPlace(p.id, false); } });
    g.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') showTip(it); });
    g.addEventListener('pointerleave', hideTip);
    g.addEventListener('focus', function () { showTip(it); });
    g.addEventListener('blur', hideTip);
    markG.appendChild(g); items.push(it); byId[p.id] = it;
  });
  var primary = items.filter(function (i) { return i.role !== 'also'; });
  var alsoItems = items.filter(function (i) { return i.role === 'also'; });
  var PRIORITY = { origin: 0, home: 1, residence: 2, visit: 3, also: 4 };

  /* routes (confirmed moves only) */
  var routes = MAN.routes.map(function (r) {
    var n = svgEl('path', { class: 'route' + (r.dashed ? ' route--dashed' : '') }); routeG.appendChild(n);
    return { r: r, node: n, prog: 1 };
  });

  /* the journey line: every place in the order of my travels, dotted, so a visitor can simply follow it */
  var seq = MAN.travel.map(function (p, i) { return { p: p, i: i }; })
    .sort(function (a, b) { return (a.p.order - b.p.order) || (a.i - b.i); })
    .map(function (o) { return byId[o.p.id]; });
  var trailG = svgEl('g', { class: 'trails' }); overlay.insertBefore(trailG, routeG);
  var trail = seq.slice(1).map(function (b, i) {
    var a = seq[i], node = svgEl('path', { class: 'trail' }), arrow = svgEl('path', { class: 'trail__arrow', d: 'M5.5 0L-4 -5L-4 5Z' }), cover = null;
    trailG.appendChild(node); trailG.appendChild(arrow);
    /* where a confirmed move already joins the same two places, only that solid line is drawn (no two lines on top of each other); the dotted leg lends it its arrow */
    routes.forEach(function (rt) { if ((rt.r.from === a.id && rt.r.to === b.id) || (rt.r.from === b.id && rt.r.to === a.id)) cover = rt; });
    return { a: a, b: b, node: node, arrow: arrow, prog: 1, cover: cover, flip: false };
  });
  /* a leg that goes back to a country an earlier leg left (USA and back, Germany, Belgium and back) arcs the other way,
     so the two never lie on top of each other: out over the top, back underneath */
  trail.forEach(function (sg, i) {
    var f = sg.a.p.country.en, g = sg.b.p.country.en;
    if (f === g) return;
    for (var j = 0; j < i; j++) { if (trail[j].a.p.country.en === g && trail[j].b.p.country.en === f) { sg.flip = true; break; } }
  });
  var hasIO = 'IntersectionObserver' in window;
  if (hasIO && !reduce) trail.forEach(function (sg) { sg.prog = 0; });   /* drawn in once, when the map comes into view */

  /* ---------------- view state ---------------- */
  var cw = 1000, ch = 500, v = { k: 1, tx: 0, ty: 0 }, kMin = 0.4, kMax = 24, kHome = 1, atHome = true, raf = 0;
  var anim = 0, suppressUntil = 0;

  function measure() { var r = stage.getBoundingClientRect(); cw = Math.max(200, r.width); ch = Math.max(200, r.height); }
  function sizeStage() {
    var w = stage.parentNode.clientWidth || 1000;
    if (w >= 720) stage.style.height = Math.min(Math.round(w * WB.h / WB.w + 36), 780) + 'px';
    else stage.style.height = Math.round(Math.max(360, Math.min(480, window.innerHeight * 0.6))) + 'px';
  }
  function clampView(o) {
    var mw = WB.w * o.k, mh = WB.h * o.k, m = 48;
    o.tx = mw <= cw ? (cw - mw) / 2 : Math.min(m, Math.max(cw - mw - m, o.tx));
    o.ty = mh <= ch ? (ch - mh) / 2 : Math.min(m, Math.max(ch - mh - m, o.ty));
    return o;
  }
  function viewAround(cx, cy, k) { return clampView({ k: k, tx: cw / 2 - cx * k, ty: ch / 2 - cy * k }); }
  function fitBox(b, pad, maxK, minSpan) {
    var w = Math.max(b.x1 - b.x0, minSpan || 40), h = Math.max(b.y1 - b.y0, (minSpan || 40) * 0.6);
    var k = Math.min((cw - 2 * pad) / w, (ch - 2 * pad) / h); k = Math.max(kMin, Math.min(maxK || kMax, k));
    return viewAround((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, k);
  }
  function boxOf(list) {
    var b = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
    list.forEach(function (i) { b.x0 = Math.min(b.x0, i.wx); b.x1 = Math.max(b.x1, i.wx); b.y0 = Math.min(b.y0, i.wy); b.y1 = Math.max(b.y1, i.wy); });
    return b;
  }
  function worldView() { var k = Math.min(cw / WB.w, ch / WB.h); return viewAround(WB.w / 2, WB.h / 2, k); }
  function homeView() { return cw >= 720 ? worldView() : fitBox(boxOf(primary), 40, 3, 150); }
  function setView(o) { v.k = o.k; v.tx = o.tx; v.ty = o.ty; schedule(); }
  function cancelAnim() { if (anim) { cancelAnimationFrame(anim); anim = 0; } }
  function tweenTo(target, dur, done) {
    cancelAnim();
    if (reduce || !dur) { setView(target); if (done) done(); return; }
    var c0x = (cw / 2 - v.tx) / v.k, c0y = (ch / 2 - v.ty) / v.k, k0 = v.k;
    var c1x = (cw / 2 - target.tx) / target.k, c1y = (ch / 2 - target.ty) / target.k, k1 = target.k, t0 = performance.now();
    (function frame(now) {
      var p = Math.min(1, (now - t0) / dur), e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      var k = k0 * Math.pow(k1 / k0, e), cx = c0x + (c1x - c0x) * e, cy = c0y + (c1y - c0y) * e;
      v.k = k; v.tx = cw / 2 - cx * k; v.ty = ch / 2 - cy * k; schedule();
      if (p < 1) anim = requestAnimationFrame(frame); else { anim = 0; if (done) done(); }
    })(t0);
  }
  function zoomAt(f, px, py, dur) {
    var k = Math.max(kMin, Math.min(kMax, v.k * f)), r = k / v.k;
    var target = clampView({ k: k, tx: px - (px - v.tx) * r, ty: py - (py - v.ty) * r });
    atHome = false; stopPlay(false); dismissCta(); tweenTo(target, dur == null ? 220 : dur);
  }

  /* ---------------- labels, tooltip ---------------- */
  var tip = A.$('#atlas-tip'), tipItem = null;
  function itemTitle(it) { return tr(it.p.city); }
  function itemMeta(it) {
    var p = it.p, bits = [tr(p.country)];
    var when = p.role === 'also' ? '' : (p.role === 'origin' ? t('jr.role.origin') : A.placeWhen(p));
    if (when) bits.push(when);
    return bits.join(' · ');
  }
  function showTip(it) { tipItem = it; tip.textContent = ''; tip.appendChild(el('strong', { text: itemTitle(it) })); tip.appendChild(el('span', { text: itemMeta(it) })); tip.hidden = false; placeTip(); }
  function hideTip() { tipItem = null; tip.hidden = true; }
  function placeTip() {
    if (!tipItem || tipItem.hidden) { if (tipItem && tipItem.hidden) tip.hidden = true; return; }
    tip.hidden = false; tip.style.left = tipItem.x + 'px'; tip.style.top = tipItem.y + 'px';
  }
  function roleLabel(it) { return t('jr.role.' + it.role); }
  function refreshText() {
    items.forEach(function (it) {
      it.lbl.textContent = itemTitle(it);
      var when = it.role === 'also' ? '' : (it.role === 'origin' ? '' : A.placeWhen(it.p));
      it.g.setAttribute('aria-label', [itemTitle(it) + ', ' + tr(it.p.country), roleLabel(it), when].filter(Boolean).join(', '));
      it.g.setAttribute('aria-haspopup', 'dialog');
    });
    conts.forEach(function (c) { c.node.textContent = t(c.key); });
    egLabel.textContent = t('jr.egypt');
    A.$('#atlas-hint').textContent = (window.matchMedia && matchMedia('(hover: none)').matches) ? t('jr.hint.touch') : t('jr.hint.mouse');
    buildLegend();
    measureLabels(); schedule();
  }
  function measureLabels() {
    items.forEach(function (it) { try { it.labelW = it.lbl.getComputedTextLength() || 60; } catch (e) { it.labelW = 60; } });
  }

  /* ---------------- render ---------------- */
  function schedule() { if (!raf) raf = requestAnimationFrame(render); }
  function pointOn(it) { it.x = it.wx * v.k + v.tx; it.y = it.wy * v.k + v.ty; }

  /* grouping: places whose markers would overlap (26 px, or 20 px when one is a small "also" marker) form a cluster;
     neighbouring clusters are then merged so a region like Europe reads as one numbered bubble, not a crowd of them */
  var byPriority = items.slice().sort(function (a, b) { return PRIORITY[a.role] - PRIORITY[b.role]; });
  function centre(g) { var x = 0, y = 0; g.forEach(function (m) { x += m.x; y += m.y; }); return [x / g.length, y / g.length]; }
  function groupAll(pool) {
    var used = {}, groups = [];
    pool.forEach(function (a) {
      if (used[a.id]) return; var g = [a]; used[a.id] = true;
      pool.forEach(function (b) {
        if (used[b.id]) return;
        var R = (a.role === 'also' || b.role === 'also') ? 20 : 26;
        if (Math.hypot(a.x - b.x, a.y - b.y) < R) { g.push(b); used[b.id] = true; }
      });
      groups.push(g);
    });
    var again = true;
    while (again) {
      again = false;
      outer: for (var i = 0; i < groups.length; i++) {
        if (groups[i].length < 2) continue;
        var ci = centre(groups[i]);
        for (var j = i + 1; j < groups.length; j++) {
          if (groups[j].length < 2) continue;
          var cj = centre(groups[j]);
          if (Math.hypot(ci[0] - cj[0], ci[1] - cj[1]) < 44) { groups[i] = groups[i].concat(groups[j]); groups.splice(j, 1); again = true; break outer; }
        }
      }
    }
    return groups;
  }

  var clPool = [];
  function getCluster(i) {
    if (clPool[i]) return clPool[i];
    var g = svgEl('g', { class: 'cl', tabindex: '0', role: 'button' });
    g.appendChild(svgEl('circle', { class: 'cl__hit', r: 22 })); g.appendChild(svgEl('circle', { class: 'cl__pulse', r: 13 })); g.appendChild(svgEl('circle', { class: 'cl__halo', r: 17 })); g.appendChild(svgEl('circle', { class: 'cl__core', r: 13 }));
    var o = { g: g, members: [] };
    g.addEventListener('click', function () { if (performance.now() < suppressUntil) return; zoomToMembers(o.members); });
    g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); zoomToMembers(o.members); } });
    clusterG.appendChild(g); clPool[i] = o; return o;
  }
  function nearestWorld(it, list) {
    var d = 1e9; list.forEach(function (o) { if (o !== it) { var x = Math.hypot(o.wx - it.wx, o.wy - it.wy); if (x < d) d = x; } }); return d;
  }
  /* zoom just far enough for the members of a cluster to separate */
  function zoomToMembers(m) {
    var fit = fitBox(boxOf(m), Math.min(110, cw * 0.18), kMax, 24), need = 1e9;
    m.forEach(function (it) { need = Math.min(need, 40 / Math.max(nearestWorld(it, m), 0.5)); });
    var k = Math.max(v.k * 1.7, Math.min(fit.k, need)), c = boxOf(m);
    atHome = false; stopPlay(false); tweenTo(viewAround((c.x0 + c.x1) / 2, (c.y0 + c.y1) / 2, Math.min(kMax, k)), 650);
  }

  function render() {
    raf = 0;
    world.setAttribute('transform', 'translate(' + v.tx.toFixed(2) + ' ' + v.ty.toFixed(2) + ') scale(' + v.k.toFixed(4) + ')');
    var dw = (Math.min(3.5 * Math.sqrt(Math.max(v.k, 0.3)), 8) / Math.max(v.k, 0.3)).toFixed(3);
    dotsN.setAttribute('stroke-width', dw); dotsE.setAttribute('stroke-width', dw);
    svg.style.touchAction = v.k > kHome * 1.04 ? 'none' : 'pan-y';
    var rtl = document.documentElement.dir === 'rtl';

    items.forEach(pointOn);
    /* clusters: primary markers closer than 26 px, "also" markers closer than 15 px */
    /* while the journey plays, only the real stops are shown; the small "also visited" markers rest */
    var pool = playing ? byPriority.filter(function (m) { return m.role !== 'also'; }) : byPriority;
    items.forEach(function (it) { it.hidden = pool.indexOf(it) < 0; });
    var groups = v.k >= kMax * 0.95 ? pool.map(function (m) { return [m]; }) : groupAll(pool), ci = 0, shown = [];
    groups.forEach(function (g) {
      if (g.length === 1) { g[0].hidden = false; shown.push(g[0]); return; }
      var cx = 0, cy = 0; g.forEach(function (m) { m.hidden = true; cx += m.x; cy += m.y; }); cx /= g.length; cy /= g.length;
      var c = getCluster(ci++); c.members = g; c.g.removeAttribute('hidden'); c.g.style.display = '';
      c.g.setAttribute('transform', 'translate(' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ')');
      c.g.setAttribute('class', 'cl' + (g.some(function (m) { return m.role !== 'also' && m.role !== 'visit'; }) ? '' : ' cl--also') + (g.some(function (m) { return m.spot || m.hint; }) ? ' is-spot' : ''));
      c.g.setAttribute('aria-label', t('jr.cluster', { n: g.length }));
    });
    for (var i = ci; i < clPool.length; i++) clPool[i].g.style.display = 'none';

    /* marker positions */
    items.forEach(function (it) {
      it.g.style.display = it.hidden ? 'none' : '';
      if (!it.hidden) it.g.setAttribute('transform', 'translate(' + it.x.toFixed(1) + ' ' + it.y.toFixed(1) + ')');
      it.g.classList.toggle('is-spot', !!it.spot || !!it.hint);
      it.g.classList.toggle('is-future', playing && (stepOf[it.id] > stepIdx));
    });

    /* labels with simple collision avoidance */
    var placed = [], minK = { origin: 0, home: 0, residence: 0, visit: 1.7, also: 3.2 };
    shown.slice().sort(function (a, b) { return PRIORITY[a.role] - PRIORITY[b.role]; }).forEach(function (it) {
      var force = it.active || it.spot || it === tipItem, ok = force || v.k >= (minK[it.role] + (cw < 720 ? 0.6 : 0));
      var x0 = rtl ? it.x - 12 - it.labelW : it.x + 12, rect = { x0: x0, x1: x0 + it.labelW, y0: it.y - 9, y1: it.y + 9 };
      if (ok && !force) for (var i = 0; i < placed.length; i++) { var q = placed[i]; if (rect.x0 < q.x1 + 4 && rect.x1 > q.x0 - 4 && rect.y0 < q.y1 + 2 && rect.y1 > q.y0 - 2) { ok = false; break; } }
      if (ok) placed.push(rect);
      it.lbl.style.display = ok ? '' : 'none';
      it.lbl.setAttribute('x', rtl ? -12 : 12); it.lbl.setAttribute('y', 0); it.lbl.setAttribute('text-anchor', rtl ? 'end' : 'start');
    });

    /* continent and country names */
    var contOp = v.k < 2.3 ? 1 : 0;
    conts.forEach(function (c) { c.node.setAttribute('x', (c.wx * v.k + v.tx).toFixed(1)); c.node.setAttribute('y', (c.wy * v.k + v.ty).toFixed(1)); c.node.style.opacity = contOp; });
    egLabel.setAttribute('x', (egW[0] * v.k + v.tx).toFixed(1)); egLabel.setAttribute('y', (egW[1] * v.k + v.ty).toFixed(1)); egLabel.style.opacity = (v.k >= 1.5 && v.k < 5) ? 1 : 0;

    /* confirmed routes */
    routes.forEach(function (rt) {
      var a = byId[rt.r.from], b = byId[rt.r.to];
      var dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy);
      if (dist < 8) { rt.node.style.display = 'none'; rt.cx = null; return; }
      rt.node.style.display = '';
      var bend = (rt.r.dashed ? -1 : 1) * Math.min(dist * 0.22, 140) * (rt.r.from === 'mansoura' || rt.r.from === 'cairo' ? 1 : (rt.r.dashed ? 1 : -1));
      var mx = (a.x + b.x) / 2 - dy / dist * bend, my = (a.y + b.y) / 2 + dx / dist * bend;
      rt.cx = mx; rt.cy = my;
      rt.node.setAttribute('d', 'M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + 'Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1));
      if (rt.prog < 1) {
        if (rt.r.dashed) { rt.node.style.opacity = rt.prog; rt.node.removeAttribute('stroke-dasharray'); }
        else { var L = rt.node.getTotalLength(); rt.node.setAttribute('stroke-dasharray', (L * rt.prog).toFixed(1) + ' ' + L.toFixed(1)); rt.node.style.opacity = rt.prog > 0 ? 1 : 0; }
      } else { rt.node.removeAttribute('stroke-dasharray'); rt.node.style.opacity = rt.hidden ? 0 : ''; }
    });
    /* journey line (dotted, with a small arrow on every leg) */
    trail.forEach(function (sg) {
      var a = sg.a, b = sg.b, dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy), pr = Math.min(1, sg.prog);
      if (sg.cover) {
        sg.node.style.display = 'none';
        var rt = sg.cover, fw = rt.r.from === a.id, pa = fw ? a : b, pb = fw ? b : a;
        if (rt.cx == null || rt.hidden || rt.prog < 0.62 || pr < 0.62 || dist < 36) { sg.arrow.style.display = 'none'; return; }
        var tq = 0.55, u = 1 - tq, rx = u * u * pa.x + 2 * u * tq * rt.cx + tq * tq * pb.x, ry = u * u * pa.y + 2 * u * tq * rt.cy + tq * tq * pb.y;
        var rdx = 2 * u * (rt.cx - pa.x) + 2 * tq * (pb.x - rt.cx), rdy = 2 * u * (rt.cy - pa.y) + 2 * tq * (pb.y - rt.cy);
        sg.arrow.style.display = '';
        sg.arrow.setAttribute('transform', 'translate(' + rx.toFixed(1) + ' ' + ry.toFixed(1) + ') rotate(' + (Math.atan2(fw ? rdy : -rdy, fw ? rdx : -rdx) / RAD).toFixed(1) + ')');
        return;
      }
      if (dist < 8 || pr <= 0 || (a.hidden && b.hidden && dist < 70)) { sg.node.style.display = 'none'; sg.arrow.style.display = 'none'; return; }
      var bend = Math.min(dist * 0.2, 120), nx = -dy / dist, ny = dx / dist, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      var c1y = my + ny * bend, c2y = my - ny * bend, up = c1y <= c2y, cx, cy;
      if (sg.flip) { up = !up; }
      cx = up ? mx + nx * bend : mx - nx * bend; cy = up ? c1y : c2y;
      function q(tt, p0, c, p1) { var u = 1 - tt; return u * u * p0 + 2 * u * tt * c + tt * tt * p1; }
      var ex = q(pr, a.x, cx, b.x), ey = q(pr, a.y, cy, b.y), kx = a.x + (cx - a.x) * pr, ky = a.y + (cy - a.y) * pr;
      sg.node.style.display = '';
      sg.node.setAttribute('d', 'M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + 'Q' + kx.toFixed(1) + ' ' + ky.toFixed(1) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1));
      if (pr > 0.62 && dist > 36) {
        var tt = 0.55, ax = q(tt, a.x, cx, b.x), ay = q(tt, a.y, cy, b.y);
        var tx = 2 * (1 - tt) * (cx - a.x) + 2 * tt * (b.x - cx), ty = 2 * (1 - tt) * (cy - a.y) + 2 * tt * (b.y - cy);
        sg.arrow.style.display = '';
        sg.arrow.setAttribute('transform', 'translate(' + ax.toFixed(1) + ' ' + ay.toFixed(1) + ') rotate(' + (Math.atan2(ty, tx) / RAD).toFixed(1) + ')');
      } else sg.arrow.style.display = 'none';
    });
    placeTip();
  }

  /* ---------------- legend ----------------
     Small and right under the map: every symbol is drawn with the real marker / line classes, with a short explanation beside it. */
  function buildLegend() {
    var box = A.clear(A.$('#atlas-legend'));
    function row(icon, key, vars) {
      return el('li', null, [el('span', { class: 'lg__ico', 'aria-hidden': 'true' }, icon),
        el('span', { class: 'lg__t' }, [el('strong', { text: t('jr.l.' + key) }), el('span', { text: t('jr.l.' + key + '.d', vars) })])]);
    }
    function role(r) { var s = svgEl('svg', { viewBox: '-14 -14 28 28', class: 'lgi mk mk--' + r }); shapes(r).forEach(function (n) { s.appendChild(n); }); return s; }
    function line(cls, arrow) {
      var s = svgEl('svg', { viewBox: '0 0 40 18', class: 'lgi lgi--route' });
      s.appendChild(svgEl('path', { d: 'M3 14Q20 -4 37 14', class: cls }));
      if (arrow) s.appendChild(svgEl('path', { class: 'trail__arrow', d: 'M5.5 0L-4 -5L-4 5Z', transform: 'translate(20 5.2) rotate(0)' }));
      return s;
    }
    var cl = svgEl('svg', { viewBox: '-20 -20 40 40', class: 'lgi lgi--cl cl' });
    cl.appendChild(svgEl('circle', { class: 'cl__halo', r: 17 })); cl.appendChild(svgEl('circle', { class: 'cl__core', r: 13 }));

    var oP = MAN.travel.filter(function (p) { return p.role === 'origin'; })[0], hP = MAN.travel.filter(function (p) { return p.role === 'home'; })[0];
    var places = [row(role('home'), 'main', { a: oP ? tr(oP.city) : '', b: hP ? tr(hP.city) : '' }), row(role('residence'), 'residence'), row(role('visit'), 'visit')];
    if ((MAN.also || []).length) places.push(row(role('also'), 'also'));
    places.push(row(cl, 'cluster'));
    var lines = [row(line('trail', true), 'trail'), row(line('route', false), 'route'), row(line('route route--dashed', false), 'routeDashed')];

    box.appendChild(el('ul', { class: 'lg__list' }, places.concat(lines)));
  }

  /* ---------------- opening a place ---------------- */
  var activeId = null;
  function setActive(id) { activeId = id; items.forEach(function (it) { it.active = it.id === id; it.g.classList.toggle('is-active', it.id === id); }); schedule(); }
  function focusItem(id) {
    var it = byId[id]; if (!it) return;
    var k = Math.min(kMax, Math.max(v.k, it.role === 'also' ? 4 : 3.2, 40 / Math.max(nearestWorld(it, items), 0.5)));
    atHome = false; tweenTo(viewAround(it.wx, it.wy, k), 600);
  }
  function openPlace(id, fromList) {
    var p = A.placeById(id); if (!p) return;
    stopPlay(false); dismissCta(); setActive(id); hideTip();
    if (fromList) focusItem(id);
    var isAlso = p.role === 'also';
    var when = isAlso ? '' : (p.role === 'origin' ? '' : A.placeWhen(p));
    var sibs = p.trip ? MAN.travel.filter(function (x) { return x.trip === p.trip; }).map(function (x) { return { id: x.id, label: tr(x.city), active: x.id === p.id }; }) : null;
    A.Viewer.open({
      title: tr(p.city), sub: tr(p.country),
      kicker: [t('jr.role.' + p.role), when].filter(Boolean).join(' · '),
      text: isAlso ? '' : tr(p.text),
      photos: A.placePhotos(p), start: 0,
      siblings: sibs, tripLabel: p.trip ? t('jr.trip.' + p.trip) : '',
      onSibling: function (sid) { setActive(sid); openPlace(sid, false); },
      backLabel: t('jr.v.back'), emptyNote: isAlso ? t('jr.noinfo') : t('jr.nophotos'),
      onClose: function () { setActive(null); }
    });
  }

  /* ---------------- guided journey (the tour) ----------------
     For every place, in order: fly there, draw the dotted line that leads to it, come close, open its photos by
     themselves (they change on their own), close the gallery, go on to the next place. */
  var playing = false, stepIdx = 0, steps = [], timers = [], stepEl = A.$('#atlas-step');
  var ctaEl = A.$('#atlas-cta'), ctaB = A.$('#atlas-cta-btn'), tourOpen = false, tourClosing = false, introDone = false, introOn = false;
  steps = seq.map(function (it) { return { ids: [it.id] }; });
  var stepOf = {};
  steps.forEach(function (st, i) { st.ids.forEach(function (id) { stepOf[id] = i; }); });
  function later(fn, ms) { timers.push(setTimeout(function () { if (playing) fn(); }, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function clearSpot() { items.forEach(function (i) { i.spot = false; }); }
  /* the big "Play my journey" button on the map shrinks into the corner once the visitor acts (it never disappears); the pulsing first marker goes away */
  function dismissCta() {
    if (ctaEl) ctaEl.classList.add('is-docked');            /* the button shrinks into the corner of the map and stays there */
    if (byId.mansoura && byId.mansoura.hint) { byId.mansoura.hint = false; schedule(); }
  }
  if (byId.mansoura) byId.mansoura.hint = true;
  function stepCaption(s, i) {
    var p = A.placeById(s.ids[0]);
    var when = p.role === 'origin' ? t('jr.role.origin') : A.placeWhen(p);
    var moved = routes.some(function (r) { return s.ids.indexOf(r.r.reveal) > -1 && !r.r.late; });
    A.clear(stepEl);
    stepEl.appendChild(el('span', { class: 'atlas__stepn', text: t('jr.step', { n: i + 1, m: steps.length }) }));
    stepEl.appendChild(el('strong', { text: [tr(p.city), when].filter(Boolean).join(' · ') }));
    if (p.trip) stepEl.appendChild(el('em', { text: t('jr.trip.' + p.trip) }));
    else if (moved) stepEl.appendChild(el('em', { text: t('jr.moved') }));
    stepEl.hidden = false;
  }
  function animateRoute(rt, dur) {
    var t0 = performance.now(); rt.hidden = false;
    if (reduce) { rt.prog = 1; schedule(); return; }
    (function f(now) { var p = Math.min(1, (now - t0) / dur); rt.prog = p; schedule(); if (p < 1 && playing) requestAnimationFrame(f); else if (playing) { rt.prog = 1; schedule(); } })(t0);
  }
  function animateTrail(sg, dur) {
    var t0 = performance.now();
    if (reduce || !dur) { sg.prog = 1; schedule(); return; }
    (function f(now) { var p = Math.min(1, (now - t0) / dur); sg.prog = p; schedule(); if (p < 1 && playing) requestAnimationFrame(f); else if (playing) { sg.prog = 1; schedule(); } })(t0);
  }
  /* the dotted line draws itself once, the first time the map is on screen */
  function introTrail() {
    if (introDone) return; introDone = true;
    if (reduce || !hasIO) { trail.forEach(function (sg) { sg.prog = 1; }); schedule(); return; }
    introOn = true;
    var n = trail.length, total = Math.min(4200, 380 * n), t0 = performance.now();
    (function f(now) {
      if (playing) { introOn = false; return; }
      var e = Math.min(1, (now - t0) / total) * n;
      trail.forEach(function (sg, i) { sg.prog = Math.max(0, Math.min(1, e - i)); });
      schedule();
      if (e < n) requestAnimationFrame(f); else introOn = false;
    })(t0);
  }
  if (hasIO && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { introTrail(); io.disconnect(); } }); }, { threshold: 0.35 });
    io.observe(stage);
  }
  function play() {
    if (playing) { stopPlay(true); return; }
    dismissCta(); introDone = true; introOn = false;
    if (ctaEl) ctaEl.hidden = true;                           /* while the tour plays, the tour bar takes over */
    atHome = false; playing = true; stepIdx = 0; hideTip();
    routes.forEach(function (r) { r.prog = 0; r.hidden = true; });
    trail.forEach(function (sg) { sg.prog = 0; });
    schedule(); runStep();
  }
  function closeTourGallery() {
    if (!tourOpen) return;
    tourOpen = false; tourClosing = true;
    A.Viewer.close();
    tourClosing = false;
  }
  function stopPlay(resetView) {
    var was = playing; playing = false; clearTimers();
    if (!was) return;
    closeTourGallery();
    stepEl.hidden = true; clearSpot(); routes.forEach(function (r) { r.prog = 1; r.hidden = false; }); trail.forEach(function (sg) { sg.prog = 1; });
    if (ctaEl) ctaEl.hidden = false;          /* the big button on the map comes back, so the journey can be started again */
    schedule();
    if (resetView) { atHome = true; tweenTo(homeView(), 800); }
  }
  function closeZoom(it) { return Math.min(kMax, Math.max(v.k, it.role === 'also' ? 4 : 3.2, 40 / Math.max(nearestWorld(it, items), 0.5))); }
  function dwellFor(n) { return Math.max(1800, Math.min(3200, Math.round(9000 / Math.max(1, n)))); }
  function leaveGallery(i) {
    closeTourGallery(); setActive(null);
    if (!playing) return;
    later(function () { stepIdx = i + 1; runStep(); }, 450);
  }
  function openTourGallery(i) {
    if (!playing) return;
    var p = A.placeById(steps[i].ids[0]), when = p.role === 'origin' ? '' : A.placeWhen(p), photos = A.placePhotos(p);
    setActive(p.id); tourOpen = true;
    A.Viewer.open({
      title: tr(p.city), sub: tr(p.country),
      kicker: [t('jr.role.' + p.role), when].filter(Boolean).join(' · '),
      text: tr(p.text), photos: photos, start: 0,
      backLabel: t('jr.v.close'), emptyNote: t('jr.nophotos'),
      tour: {
        label: function () { return t('jr.step', { n: i + 1, m: steps.length }); },
        dwell: dwellFor(photos.length),
        onDone: function () { leaveGallery(i); },
        onNext: function () { leaveGallery(i); },
        onStop: function () { stopPlay(true); }
      },
      /* closing the gallery by hand (cross, Esc, click outside) ends the tour */
      onClose: function () { setActive(null); if (tourClosing) return; if (tourOpen) { tourOpen = false; stopPlay(true); } }
    });
  }
  function finishTour() { stepEl.hidden = true; clearSpot(); schedule(); later(function () { stopPlay(true); }, 600); }
  function runStep() {
    if (!playing) return;
    if (stepIdx >= steps.length) { finishTour(); return; }
    var s = steps[stepIdx], i = stepIdx, it = byId[s.ids[0]], prev = i > 0 ? byId[steps[i - 1].ids[0]] : null, seg = i > 0 ? trail[i - 1] : null;
    clearSpot(); it.spot = true;
    var rs = routes.filter(function (r) { return s.ids.indexOf(r.r.reveal) > -1; });
    var cover = [it];
    if (prev) cover.push(prev);
    rs.forEach(function (r) { cover.push(byId[r.r.from]); if (r.r.late) cover.push(byId[r.r.to]); });
    stepCaption(s, i); schedule();
    function draw() {
      var ms = reduce ? 0 : 950, late = false;
      if (seg) animateTrail(seg, ms);
      rs.forEach(function (r) {
        if (r.r.late) { late = true; stepEl.appendChild(el('em', { class: 'atlas__later', text: tr(byId[r.r.to].p.city) + ': ' + t('jr.moved.later') })); }
        animateRoute(r, 1000);
      });
      return ms + (late ? 900 : 150);
    }
    function arrive() {
      if (!playing) return;
      tweenTo(viewAround(it.wx, it.wy, closeZoom(it)), reduce ? 0 : 750, function () {
        if (!playing) return;
        later(function () { openTourGallery(i); }, reduce ? 0 : 250);
      });
    }
    if (!prev) { tweenTo(viewAround(it.wx, it.wy, closeZoom(it)), reduce ? 0 : 1300, function () { if (playing) later(function () { openTourGallery(i); }, 350); }); return; }
    tweenTo(fitBox(boxOf(cover), Math.min(120, cw * 0.2), 6, 50), reduce ? 0 : 1100, function () {
      if (!playing) return;
      var wait = draw();
      later(arrive, wait);
    });
  }

  /* ---------------- pointer interaction ---------------- */
  var ptrs = {}, nptr = 0, drag = null, moved = false, pinch = null;
  function rectOf() { return stage.getBoundingClientRect(); }
  svg.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button > 0) return;
    ptrs[e.pointerId] = { x: e.clientX, y: e.clientY }; nptr++;
    stopPlay(false); cancelAnim(); dismissCta();
    if (nptr === 1) { drag = { x: e.clientX, y: e.clientY, tx: v.tx, ty: v.ty }; moved = false; }
    else if (nptr === 2) {
      var ks = Object.keys(ptrs), a = ptrs[ks[0]], b = ptrs[ks[1]], r = rectOf();
      var mx = (a.x + b.x) / 2 - r.left, my = (a.y + b.y) / 2 - r.top;
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, k: v.k, wx: (mx - v.tx) / v.k, wy: (my - v.ty) / v.k };
      drag = null; moved = true;
    }
  });
  svg.addEventListener('pointermove', function (e) {
    if (!ptrs[e.pointerId]) return;
    ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (nptr === 2 && pinch) {
      var ks = Object.keys(ptrs), a = ptrs[ks[0]], b = ptrs[ks[1]], r = rectOf();
      var mx = (a.x + b.x) / 2 - r.left, my = (a.y + b.y) / 2 - r.top, k = Math.max(kMin, Math.min(kMax, pinch.k * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d));
      var o = clampView({ k: k, tx: mx - pinch.wx * k, ty: my - pinch.wy * k }); v.k = o.k; v.tx = o.tx; v.ty = o.ty; atHome = false; schedule(); return;
    }
    if (drag && nptr === 1) {
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!moved && Math.hypot(dx, dy) > 5) { moved = true; if (e.pointerType === 'mouse') { try { svg.setPointerCapture(e.pointerId); } catch (x) {} } stage.classList.add('is-drag'); hideTip(); }
      if (moved) { var o2 = clampView({ k: v.k, tx: drag.tx + dx, ty: drag.ty + dy }); v.tx = o2.tx; v.ty = o2.ty; atHome = false; schedule(); }
    }
  });
  function endPtr(e) {
    if (!ptrs[e.pointerId]) return;
    delete ptrs[e.pointerId]; nptr = Math.max(0, nptr - 1); if (nptr < 2) pinch = null;
    if (nptr === 0) { drag = null; stage.classList.remove('is-drag'); if (moved) suppressUntil = performance.now() + 80; moved = false; }
    else if (nptr === 1) { var k = Object.keys(ptrs)[0]; drag = { x: ptrs[k].x, y: ptrs[k].y, tx: v.tx, ty: v.ty }; moved = true; }
  }
  svg.addEventListener('pointerup', endPtr); svg.addEventListener('pointercancel', endPtr);
  stage.addEventListener('wheel', function (e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault(); var r = rectOf(); zoomAt(Math.exp(-e.deltaY * 0.0022), e.clientX - r.left, e.clientY - r.top, 0);
  }, { passive: false });
  svg.addEventListener('dblclick', function (e) { if (e.target.closest && e.target.closest('.mk,.cl')) return; var r = rectOf(); zoomAt(1.8, e.clientX - r.left, e.clientY - r.top); });
  stage.addEventListener('keydown', function (e) {
    if (e.key === '+' || e.key === '=') { zoomAt(1.5, cw / 2, ch / 2); }
    else if (e.key === '-') { zoomAt(1 / 1.5, cw / 2, ch / 2); }
  });
  A.$('#atlas-zin').addEventListener('click', function () { zoomAt(1.6, cw / 2, ch / 2); });
  A.$('#atlas-zout').addEventListener('click', function () { zoomAt(1 / 1.6, cw / 2, ch / 2); });
  A.$('#atlas-reset').addEventListener('click', function () { stopPlay(false); atHome = true; tweenTo(homeView(), 600); });
  A.$('#atlas-world').addEventListener('click', function () { stopPlay(false); atHome = false; tweenTo(worldView(), 600); });
  if (ctaB) ctaB.addEventListener('click', function () { play(); var bar = stage.getBoundingClientRect(); if (bar.top < 0 || bar.bottom > window.innerHeight) stage.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); });

  /* ---------------- init ---------------- */
  function layout() {
    sizeStage(); measure();
    kMin = Math.min(cw / WB.w, ch / WB.h) * 0.98; kHome = homeView().k;
    if (atHome) setView(homeView()); else { var o = clampView({ k: Math.max(kMin, v.k), tx: v.tx, ty: v.ty }); setView(o); }
  }
  layout(); refreshText();
  if ('ResizeObserver' in window) new ResizeObserver(function () { var w = stage.clientWidth; if (Math.abs(w - cw) > 1) layout(); }).observe(stage);
  else window.addEventListener('resize', layout);
  A.onLang(function () { refreshText(); if (playing) stepCaption(steps[stepIdx], stepIdx); });
  /* fonts finish loading after first paint: measure label widths again */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measureLabels(); schedule(); });

  A.atlas = { openPlace: openPlace, play: play, stop: function () { stopPlay(true); }, focusItem: focusItem, get view() { return v; }, items: items, clusters: function () { return clPool; },
              trail: trail, steps: steps, get playing() { return playing; }, get stepIdx() { return stepIdx; } };
})();
