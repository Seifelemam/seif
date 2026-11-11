/* ==========================================================================
   INTRO GAME — the entrance is a quick penalty kick.
   A cartoon Seif (profile, glasses, short beard) takes a penalty at a goal with a crossbar.
   A ring sweeps over the goal: tap / click the scene or press Space to shoot at the ring.
   Goal  -> celebration, then the website opens.
   A cartoon goalkeeper (original: blue and white kit, red gloves) guards the goal. He dives at every shot: sometimes the right way
   (then he can save it, if he can reach it: the top corners are too far), sometimes the wrong way.
   Miss / bar / post / save -> try again. After three failed shots the next shot is helped into the goal (the keeper guesses wrong),
   so nobody is ever stuck. "Skip intro" and Esc are always there; the music has a sound button.
   Drawn as one SVG and animated with requestAnimationFrame. No images, no libraries.
   Needs: entrance.js (window.Entrance), intro-audio.js (window.IntroAudio), main.js (window.App).
   ========================================================================== */
(function () {
  'use strict';
  var A = window.App, E = window.Entrance, AU = window.IntroAudio;
  var ent = document.getElementById('entrance'), mount = document.getElementById('pk');
  if (!A || !E || !ent || !mount) return;
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';

  /* ---------------------------- scene numbers ---------------------------- */
  var G = { x1: 440, x2: 740, top: 165, base: 300 };            /* the goal mouth, in SVG units */
  var B0 = { x: 350, y: 430 }, GROUND = 442;                    /* ball start, ground line at the spot */
  var P0 = { x: 262, y: 442 };                                  /* where the player stands */
  var CX = (G.x1 + G.x2) / 2, CY = (G.top + G.base) / 2;
  var PS = 1.22;                                                /* the player is drawn a bit bigger than life */
  var LAUNCH = 0.66, FLIGHT = 0.62, ARRIVE = LAUNCH + FLIGHT;   /* seconds after the press */
  var HIP0 = { x: CX, y: G.base - 32 };                         /* the keeper's hip while he stands a step in front of the goal line, between the posts (his feet are 46 below it) */
  var K = { reach: 65, catchR: 22, maxX: 36, lift: 14, saveChance: 0.35 };   /* arm reach from the hip, glove catch radius, how far he can travel / jump, how often he reads the shot */

  /* Egypt kit: red shirt, white shorts, black socks. Plain colours only: no crest, no brand marks. */
  var C = { skin: '#d9a070', skinF: '#c28a5c', ear: '#c28a5c', hair: '#14122a', beard: '#2e2220', jer: '#d3202f', jerF: '#a8141f',
            trim: '#111111', band: '#ffffff', short: '#ffffff', shortF: '#dfe4f2', sock: '#141414', sockF: '#2e2e2e', boot: '#f4f6ff', bootF: '#c9d2ee' };

  /* ---------------------------- the picture ---------------------------- */
  function arm(far) {
    var k = far ? 'F' : 'N', sk = far ? C.skinF : C.skin, sl = far ? C.jerF : C.jer;
    return '<g id="p-arm' + k + '" transform="translate(0,-120)">' +
      '<rect x="-6.5" y="-4" width="13" height="19" rx="5.5" fill="' + sl + '"/><rect x="-6.5" y="11" width="13" height="4" fill="' + C.trim + '"/>' +
      '<rect x="-4.8" y="14" width="9.6" height="13" rx="4" fill="' + sk + '"/>' +
      '<g id="p-fore' + k + '" transform="translate(0,26)"><rect x="-4.5" y="-3" width="9" height="23" rx="4.5" fill="' + sk + '"/><circle cx="0" cy="22" r="5.4" fill="' + sk + '"/></g></g>';
  }
  function leg(far) {
    var k = far ? 'F' : 'N', sk = far ? C.skinF : C.skin, sh = far ? C.shortF : C.short, so = far ? C.sockF : C.sock, bo = far ? C.bootF : C.boot;
    return '<g id="p-leg' + k + '" transform="translate(0,-60)">' +
      '<rect x="-8.8" y="-4" width="17.6" height="22" rx="6" fill="' + sh + '"/><rect x="-6" y="14" width="12" height="16" rx="5" fill="' + sk + '"/>' +
      '<g id="p-shin' + k + '" transform="translate(0,28)"><rect x="-5.8" y="-2" width="11.6" height="26" rx="5" fill="' + so + '"/><rect x="-5.8" y="6" width="11.6" height="4" fill="' + C.band + '"/>' +
      '<path d="M-6.5 21 H11 Q20 21 20 28 Q20 32 15 32 H-5 Q-7.5 32 -7.5 29 Z" fill="' + bo + '" stroke="#0a1640" stroke-width=".9"/><rect x="-7" y="29.5" width="26" height="2.6" rx="1.3" fill="#111" opacity=".85"/></g></g>';
  }
  /* a pharaoh's headcloth (nemes): an old, public Egyptian shape, drawn here in the site's own blue and white (no yellow) */
  var NEMES = 'M-12 -26 H12 Q19 -25 20 -8 L21.5 4 L20 26 L9.5 26 L10.5 8 L-10.5 8 L-9.5 26 L-20 26 L-21.5 4 L-20 -8 Q-19 -25 -12 -26 Z';
  function nemesFill() {
    var bands = '';
    for (var y = -26; y < 27; y += 7.2) bands += '<rect x="-30" y="' + y.toFixed(1) + '" width="60" height="3.6" fill="#ffffff"/>';
    return '<g clip-path="url(#pkNemes)"><rect x="-30" y="-30" width="60" height="60" fill="#1b3df5"/>' + bands + '</g>' +
           '<path d="' + NEMES + '" fill="none" stroke="#0a1640" stroke-width="1.1" stroke-linejoin="round"/>';
  }
  /* the head: a friendly front-facing cartoon face (short beard, no glasses) under the pharaoh's headcloth */
  var BEARD = '#5a2e1c', INK = '#0a1640';
  var HEAD =
    '<defs><clipPath id="pkNemes"><path d="' + NEMES + '"/></clipPath>' +
      '<clipPath id="pkNemesTop"><path d="M-30 -40 H30 V-4 L14.5 -6 Q13.5 -10 12.5 -11 Q0 -16 -12.5 -11 Q-13.5 -10 -14.5 -6 L-30 -4 Z"/></clipPath></defs>' +
    '<rect x="-6" y="12" width="12" height="13" rx="3" fill="' + C.skinF + '"/>' +
    nemesFill() +                                                                                  /* behind the face: the dome and the two side flaps */
    '<ellipse cx="-14.1" cy="2" rx="2.7" ry="3.9" fill="' + C.ear + '"/><ellipse cx="14.1" cy="2" rx="2.7" ry="3.9" fill="' + C.ear + '"/>' +
    '<ellipse cx="0" cy="0" rx="14" ry="17.5" fill="' + C.skin + '"/>' +
    '<path d="M-13.8 3 Q-14.4 15 -7 19.2 Q0 22.8 7 19.2 Q14.4 15 13.8 3 Q11 9.4 6.4 9.4 Q3 8.2 0 8.4 Q-3 8.2 -6.4 9.4 Q-11 9.4 -13.8 3 Z" fill="' + BEARD + '"/>' +   /* short beard */
    '<ellipse cx="0" cy="12.4" rx="5.4" ry="3" fill="#e9b98c"/>' +
    '<path d="M-6.4 8.6 Q-3 5.6 0 7.4 Q3 5.6 6.4 8.6 Q3 10.4 0 9.4 Q-3 10.4 -6.4 8.6 Z" fill="#46210f"/>' +                                    /* moustache */
    '<circle cx="-8.4" cy="5.2" r="2.7" fill="#e48a7a" opacity=".35"/><circle cx="8.4" cy="5.2" r="2.7" fill="#e48a7a" opacity=".35"/>' +
    '<ellipse cx="-5.6" cy="-3" rx="3.5" ry="4.3" fill="#fff" stroke="' + INK + '" stroke-width=".8"/><ellipse cx="5.6" cy="-3" rx="3.5" ry="4.3" fill="#fff" stroke="' + INK + '" stroke-width=".8"/>' +
    '<g id="p-pup"><circle cx="-5.2" cy="-2.6" r="2.5" fill="#3a2415"/><circle cx="6" cy="-2.6" r="2.5" fill="#3a2415"/>' +
    '<circle cx="-4.5" cy="-3.7" r=".9" fill="#fff"/><circle cx="6.7" cy="-3.7" r=".9" fill="#fff"/></g>' +
    '<path id="p-brL" d="M-9.8 -8.6 Q-5.8 -11.2 -2.2 -8.8" stroke="#3b2216" stroke-width="2" fill="none" stroke-linecap="round"/><path id="p-brR" d="M9.8 -8.6 Q5.8 -11.2 2.2 -8.8" stroke="#3b2216" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    '<ellipse cx="0" cy="3.6" rx="2.2" ry="1.8" fill="#c58555"/>' +
    '<ellipse cx="0" cy="0" rx="14" ry="17.5" fill="none" stroke="' + INK + '" stroke-width="1.2"/>' +
    '<g clip-path="url(#pkNemesTop)">' + nemesFill() + '</g>' +                                    /* over the hair: the same cloth down to the forehead */
    '<path d="M-13.4 -11.2 Q0 -16.4 13.4 -11.2" fill="none" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round"/>' +
    '<path d="M-13 -11.4 Q0 -16.5 13 -11.4" fill="none" stroke="#fff" stroke-width=".7" stroke-linecap="round" opacity=".85"/>' +
    '<path d="M0 -20.5 Q2.7 -18.6 1.6 -15.2 Q.8 -13.4 0 -13.4 Q-.8 -13.4 -1.6 -15.2 Q-2.7 -18.6 0 -20.5 Z" fill="#d3202f" stroke="' + INK + '" stroke-width=".7"/>' +   /* the cobra on the brow */
    '<path id="p-mc" d="M-3.6 11.6 Q0 15 3.6 11.6" stroke="#5a1f1a" stroke-width="1.4" fill="none" stroke-linecap="round"/>' +
    '<path id="p-ms" d="M-3.8 15 Q0 10.6 3.8 15" stroke="#5a1f1a" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0"/>' +                                    /* sad: after a miss or a save */
    '<g id="p-tears" opacity="0"><path d="M-8.4 1.4 Q-6.4 4.6 -8.4 7.4 Q-10.4 4.6 -8.4 1.4 Z" fill="#9db0ff" stroke="' + INK + '" stroke-width=".6"/><path d="M8.4 1.4 Q10.4 4.6 8.4 7.4 Q6.4 4.6 8.4 1.4 Z" fill="#9db0ff" stroke="' + INK + '" stroke-width=".6"/></g>' +
    '<g id="p-mo" opacity="0"><ellipse cx="0" cy="12.8" rx="4.3" ry="3.7" fill="#4a1d1a"/><rect x="-3.2" y="9.6" width="6.4" height="1.9" rx=".9" fill="#fff"/><ellipse cx="0" cy="14.5" rx="2.5" ry="1.2" fill="#c4566a"/></g>';
  var PLAYER =
    '<ellipse cx="6" cy="1" rx="38" ry="6.5" fill="#0a1640" opacity=".28"/>' +
    leg(true) +
    '<rect x="-17.5" y="-80" width="36" height="24" rx="5" fill="' + C.short + '"/>' +
    '<g id="p-up">' + arm(true) +
      '<path d="M-17 -118 Q-17 -131 -8 -131 H11 Q19.5 -131 19.5 -122 L19.5 -72 H-17 Z" fill="' + C.jer + '"/>' +
      '<path d="M3 -131 H13 L19.5 -123 L12 -119 Z" fill="' + C.trim + '"/>' +
      '<rect x="-17" y="-76" width="36.5" height="4" fill="' + C.trim + '"/>' +
      '<g id="p-head" transform="translate(3,-149)">' + HEAD + '</g>' + arm(false) + '</g>' +
    leg(false);

  /* the goalkeeper: an original cartoon, drawn around his hip (0,0): feet at y=46, shoulders at y=-31, gloves up at about y=-66.
     Plain blue and white kit with red gloves: no yellow, no crest, no brand marks. */
  var KC = { skin: '#b4764b', skinF: '#9c6440', hair: '#1c1530', shirt: '#e9eeff', band: '#1b3df5', short: '#1b3df5', sock: '#ffffff', boot: '#0a1640', glove: '#d3202f', cuff: '#ffffff' };
  function kArm(side) {
    var L = side === 'L';
    return '<g id="k-arm' + side + '" transform="translate(' + (L ? -15 : 15) + ',-31) rotate(' + (L ? -104 : 104) + ')">' +
      '<rect x="-5.6" y="-20" width="11.2" height="22" rx="5.6" fill="' + KC.shirt + '" stroke="' + INK + '" stroke-width="1"/>' +
      '<rect x="-5.6" y="-20" width="11.2" height="4.2" rx="2" fill="' + KC.band + '"/>' +
      '<rect x="-4" y="-25.5" width="8" height="6.5" rx="2" fill="' + KC.skin + '"/>' +
      '<rect x="-5.2" y="-27.5" width="10.4" height="3.8" rx="1.4" fill="' + KC.cuff + '" stroke="' + INK + '" stroke-width=".8"/>' +
      '<ellipse cx="' + (L ? 7.4 : -7.4) + '" cy="-32" rx="3" ry="4.6" fill="' + KC.glove + '" stroke="' + INK + '" stroke-width=".9"/>' +
      '<circle cx="0" cy="-35" r="8.6" fill="' + KC.glove + '" stroke="' + INK + '" stroke-width="1.1"/>' +
      '<path d="M-4.6 -38.4 Q0 -42.4 4.6 -38.4 M-3 -34 H3" stroke="#fff" stroke-opacity=".75" stroke-width="1.3" fill="none" stroke-linecap="round"/></g>';
  }
  function kLeg(side) {
    return '<g id="k-leg' + side + '" transform="translate(' + (side === 'L' ? -6 : 6) + ',0)">' +
      '<rect x="-7" y="-3" width="14" height="20" rx="5" fill="' + KC.short + '" stroke="' + INK + '" stroke-width="1"/>' +
      '<rect x="-4.6" y="14" width="9.2" height="25" rx="3.6" fill="' + KC.sock + '" stroke="' + INK + '" stroke-width="1"/>' +
      '<rect x="-4.6" y="21" width="9.2" height="3.4" fill="' + KC.band + '"/>' +
      '<rect x="-7.4" y="36" width="14.8" height="10" rx="4.6" fill="' + KC.boot + '"/></g>';
  }
  var KHEAD =
    '<g id="k-head" transform="translate(0,-52)">' +
    '<rect x="-4.5" y="8" width="9" height="9" fill="' + KC.skinF + '"/>' +
    '<ellipse cx="-11.6" cy="1" rx="2.4" ry="3.4" fill="' + KC.skinF + '"/><ellipse cx="11.6" cy="1" rx="2.4" ry="3.4" fill="' + KC.skinF + '"/>' +
    '<circle r="11.8" fill="' + KC.skin + '" stroke="' + INK + '" stroke-width="1.1"/>' +
    '<path d="M-11.8 -2 C-13.6 -12 -6 -15.4 0 -15.4 C6 -15.4 13.6 -12 11.8 -2 C9.6 -8 4 -9 0 -9 C-4 -9 -9.6 -8 -11.8 -2 Z" fill="' + KC.hair + '"/>' +
    '<circle cx="-7.4" cy="-13" r="3.3" fill="' + KC.hair + '"/><circle cx="0" cy="-15.6" r="3.6" fill="' + KC.hair + '"/><circle cx="7.4" cy="-13" r="3.3" fill="' + KC.hair + '"/>' +
    '<circle cx="-7.6" cy="4.4" r="2.5" fill="#e48a7a" opacity=".3"/><circle cx="7.6" cy="4.4" r="2.5" fill="#e48a7a" opacity=".3"/>' +
    '<ellipse cx="-4.3" cy="-.6" rx="3.2" ry="3.8" fill="#fff" stroke="' + INK + '" stroke-width=".7"/><ellipse cx="4.3" cy="-.6" rx="3.2" ry="3.8" fill="#fff" stroke="' + INK + '" stroke-width=".7"/>' +
    '<g id="k-pL"><circle cx="-4.3" cy="-.2" r="2.1" fill="' + KC.hair + '"/><circle cx="-3.6" cy="-1.1" r=".7" fill="#fff"/></g>' +
    '<g id="k-pR"><circle cx="4.3" cy="-.2" r="2.1" fill="' + KC.hair + '"/><circle cx="5" cy="-1.1" r=".7" fill="#fff"/></g>' +
    '<path id="k-br" d="M-8 -6 Q-4.6 -8.4 -1.4 -6.4 M8 -6 Q4.6 -8.4 1.4 -6.4" stroke="' + KC.hair + '" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
    '<ellipse cx="0" cy="3.4" rx="1.8" ry="1.4" fill="' + KC.skinF + '"/>' +
    '<path id="k-mc" d="M-3.6 6.4 Q0 9.4 3.6 6.4" stroke="#5a1f1a" stroke-width="1.4" fill="none" stroke-linecap="round"/>' +
    '<g id="k-mo" opacity="0"><ellipse cx="0" cy="7.4" rx="3.5" ry="3.2" fill="#4a1d1a"/><ellipse cx="0" cy="8.7" rx="2" ry="1.1" fill="#c4566a"/></g>' +                                  /* effort: mouth open while diving */
    '<g id="k-mh" opacity="0"><path d="M-5.4 5.4 Q0 8 5.4 5.4 Q4.8 12.8 0 13 Q-4.8 12.8 -5.4 5.4 Z" fill="#4a1d1a" stroke="' + INK + '" stroke-width=".8" stroke-linejoin="round"/><path d="M-4 6.2 Q0 8 4 6.2 L3.6 8.2 Q0 9.6 -3.6 8.2 Z" fill="#fff"/><ellipse cx="0" cy="11.4" rx="2.6" ry="1.4" fill="#c4566a"/></g>' +   /* happy: a big grin after a save */
    '<path id="k-ms" d="M-3.8 9.6 Q0 5.8 3.8 9.6" stroke="#5a1f1a" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0"/>' +                                                           /* sad: after a goal */
    '<path id="k-tear" d="M-8.6 3.2 Q-6.9 5.6 -8.6 7.4 Q-10.3 5.6 -8.6 3.2 Z" fill="#9db0ff" stroke="' + INK + '" stroke-width=".6" opacity="0"/></g>';
  var KEEPER =
    '<ellipse id="k-sh" cx="' + HIP0.x + '" cy="' + (G.base + 13) + '" rx="22" ry="3.6" fill="#0a1640" opacity=".3"/>' +
    '<g id="k-root" transform="translate(' + HIP0.x + ',' + HIP0.y + ')">' + kLeg('L') + kLeg('R') +
      '<path d="M-16 -31 Q-16 -37 -9 -37 H9 Q16 -37 16 -31 V0 Q16 6 10 6 H-10 Q-16 6 -16 0 Z" fill="' + KC.shirt + '" stroke="' + INK + '" stroke-width="1.1"/>' +
      '<rect x="-15.4" y="-19" width="30.8" height="6" fill="' + KC.band + '"/><path d="M-6 -37 L0 -30 L6 -37 Z" fill="' + INK + '"/>' +
      kArm('L') + kArm('R') + KHEAD + '</g>';

  function ballSvg() {
    return '<circle r="12" fill="#fff" stroke="#0a1640" stroke-width="1.7"/>' +
      '<polygon points="0,-5 4.8,-1.6 2.9,4 -2.9,4 -4.8,-1.6" fill="#0a1640"/>' +
      '<path d="M0 -5 L0 -11.5 M4.8 -1.6 L10.6 -3.6 M2.9 4 L6.6 9.4 M-2.9 4 L-6.6 9.4 M-4.8 -1.6 L-10.6 -3.6" stroke="#0a1640" stroke-width="1.5" fill="none" stroke-linecap="round"/>';
  }

  function sceneSvg() {
    var s = '';
    s += '<defs><radialGradient id="pkSun" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="#fff"/><stop offset=".62" stop-color="#e6ecff"/><stop offset="1" stop-color="#9db0ff"/></radialGradient>' +
         '<pattern id="pkNet" width="11" height="11" patternUnits="userSpaceOnUse"><path d="M0 0H11M0 0V11" stroke="#fff" stroke-opacity=".45" stroke-width="1" fill="none"/></pattern></defs>';
    /* sky: sun and the pyramids */
    s += '<g aria-hidden="true"><circle cx="118" cy="168" r="66" fill="#fff" opacity=".13"/><circle cx="118" cy="168" r="44" fill="url(#pkSun)"/>' +
         '<polygon points="-30,236 70,186 170,236" fill="#0f2bb4"/><polygon points="40,236 190,142 340,236" fill="#12299f"/><polygon points="190,142 340,236 190,236" fill="#0d2086"/>' +
         '<polygon points="270,236 372,176 474,236" fill="#12299f"/><polygon points="372,176 474,236 372,236" fill="#0d2086"/><path d="M190 142 L340 236 M372 176 L474 236" stroke="#fff" stroke-opacity=".25" fill="none"/></g>';
    /* stands */
    s += '<g aria-hidden="true"><polygon points="-700,214 1500,214 1500,300 -700,300" fill="#0a1640"/><g id="pk-crowdA"></g><g id="pk-crowdB"></g>';
    for (var i = -18; i < 38; i++) s += '<rect x="' + (i * 40) + '" y="289" width="40" height="11" fill="' + (i % 2 ? '#fff' : '#1b3df5') + '"/>';
    s += '</g>';
    /* pitch */
    var bands = [[300, 322], [322, 350], [350, 384], [384, 426], [426, 476], [476, 520]];
    s += '<g aria-hidden="true">';
    bands.forEach(function (b, i) { s += '<rect x="-700" y="' + b[0] + '" width="2200" height="' + (b[1] - b[0]) + '" fill="' + (i % 2 ? '#1636d6' : '#1230c4') + '"/>'; });
    s += '<g stroke="#fff" stroke-width="2.6" fill="none" stroke-linejoin="round" opacity=".92"><path d="M-700 300 H1500"/>' +
         '<path d="M476 300 L452 338 H728 L704 300"/></g>' +
         '<ellipse cx="350" cy="' + GROUND + '" rx="7" ry="3" fill="#fff"/></g>';
    /* goal: back + net (ripples), ball layer (behind), front net + frame */
    s += '<g id="pk-goal-back" aria-hidden="true"><g id="pk-net">' +
         '<polygon points="' + G.x1 + ',' + G.top + ' ' + G.x2 + ',' + G.top + ' ' + (G.x2 - 22) + ',' + (G.top + 16) + ' ' + (G.x1 + 22) + ',' + (G.top + 16) + '" fill="#0a1640" opacity=".8"/>' +
         '<polygon points="' + G.x1 + ',' + G.top + ' ' + (G.x1 + 22) + ',' + (G.top + 16) + ' ' + (G.x1 + 22) + ',' + (G.base - 8) + ' ' + G.x1 + ',' + G.base + '" fill="#0a1640" opacity=".7"/>' +
         '<polygon points="' + G.x2 + ',' + G.top + ' ' + (G.x2 - 22) + ',' + (G.top + 16) + ' ' + (G.x2 - 22) + ',' + (G.base - 8) + ' ' + G.x2 + ',' + G.base + '" fill="#0a1640" opacity=".7"/>' +
         '<rect x="' + (G.x1 + 22) + '" y="' + (G.top + 16) + '" width="' + (G.x2 - G.x1 - 44) + '" height="' + (G.base - G.top - 24) + '" fill="#0a1640" opacity=".82"/></g></g>';
    s += '<g id="pk-ball-back"></g>';
    s += '<g aria-hidden="true"><g id="pk-net2"><rect x="' + G.x1 + '" y="' + G.top + '" width="' + (G.x2 - G.x1) + '" height="' + (G.base - G.top) + '" fill="url(#pkNet)"/></g>' +
         '<g stroke="#fff" stroke-width="7" stroke-linecap="square" fill="none"><path d="M' + G.x1 + ' ' + G.base + ' V' + G.top + ' H' + G.x2 + ' V' + G.base + '"/></g></g>';
    /* the keeper stands between the posts, in front of the net (in front of the ball once it is in the net) */
    s += '<g id="pk-keeper" aria-hidden="true">' + KEEPER + '</g>';
    /* characters, ball, aim */
    s += '<ellipse id="pk-bshadow" cx="' + B0.x + '" cy="' + GROUND + '" rx="11" ry="3.4" fill="#0a1640" opacity=".3"/>';
    s += '<g id="pk-p" aria-hidden="true">' + PLAYER + '</g>';
    s += '<g id="pk-ball"><g id="pk-ball-spin">' + ballSvg() + '</g></g>';
    s += '<g id="pk-ring" aria-hidden="true"><circle r="22" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2" id="pk-ring-o"/><circle r="15" fill="#1b3df5" fill-opacity=".18" stroke="#fff" stroke-width="3"/>' +
         '<path d="M-27 0H-10M10 0H27M0 -27V-10M0 10V27" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle r="2.6" fill="#fff"/></g>';
    s += '<g id="pk-conf" aria-hidden="true"></g>';
    return s;
  }

  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 800 520'); svg.setAttribute('preserveAspectRatio', 'xMidYMax meet'); svg.setAttribute('role', 'img');
  svg.setAttribute('class', 'pk__svg'); svg.setAttribute('focusable', 'false');
  svg.innerHTML = sceneSvg();
  mount.appendChild(svg);

  /* the visible window: the player and the goal always fit; a wide screen shows more stadium, a tall one more sky */
  function fit() {
    var w = mount.clientWidth, h = mount.clientHeight; if (!w || !h) return;
    var a = w / h, CORE_W = 580, CORE_H = 394, X0 = 196, BOTTOM = 512, vw, vh, x0, y0;
    if (a >= CORE_W / CORE_H) { vh = CORE_H; vw = vh * a; x0 = X0 + CORE_W / 2 - vw / 2; y0 = BOTTOM - vh; }
    else { vw = CORE_W; vh = vw / a; x0 = X0; y0 = BOTTOM - vh; }
    if (vw > 2200) { x0 += (vw - 2200) / 2; vw = 2200; }                  /* the stadium is drawn 2200 wide; beyond that the scene is just centred */
    svg.setAttribute('viewBox', x0.toFixed(1) + ' ' + y0.toFixed(1) + ' ' + vw.toFixed(1) + ' ' + vh.toFixed(1));
  }
  fit();
  if (window.ResizeObserver) new ResizeObserver(fit).observe(mount); else window.addEventListener('resize', fit);
  function $(id) { return svg.querySelector('#' + id); }

  /* the crowd */
  (function crowd() {
    var tints = ['#8fa5ff', '#b9c8ff', '#dbe2ff', '#ffffff', '#6f89ff', '#c9d4ff'], a = '', b = '';
    for (var r = 0; r < 3; r++) for (var x = -700 + (r % 2 ? 8 : 0); x < 1500; x += 16) {
      var c = '<circle cx="' + x + '" cy="' + (244 + r * 16) + '" r="5.4" fill="' + tints[Math.abs(x * 7 + r * 13 + (x >> 4)) % tints.length] + '"/>';
      if (r === 1) b += c; else a += c;
    }
    $('pk-crowdA').innerHTML = a; $('pk-crowdB').innerHTML = b;
  })();

  var el = {
    p: $('pk-p'), up: $('p-up'), head: $('p-head'), legN: $('p-legN'), shinN: $('p-shinN'), legF: $('p-legF'), shinF: $('p-shinF'),
    armN: $('p-armN'), foreN: $('p-foreN'), armF: $('p-armF'), foreF: $('p-foreF'), mc: $('p-mc'), mo: $('p-mo'), ms: $('p-ms'), tears: $('p-tears'), brL: $('p-brL'), brR: $('p-brR'), pup: $('p-pup'),
    ball: $('pk-ball'), spin: $('pk-ball-spin'), bshadow: $('pk-bshadow'), ring: $('pk-ring'), ringO: $('pk-ring-o'),
    ballBack: $('pk-ball-back'), net: $('pk-net'), net2: $('pk-net2'), crowdA: $('pk-crowdA'), crowdB: $('pk-crowdB'), conf: $('pk-conf'),
    k: $('k-root'), ksh: $('k-sh'), kaL: $('k-armL'), kaR: $('k-armR'), klL: $('k-legL'), klR: $('k-legR'), kpL: $('k-pL'), kpR: $('k-pR'), kmo: $('k-mo'), kmc: $('k-mc'), kmh: $('k-mh'), kms: $('k-ms'), ktear: $('k-tear'), kbr: $('k-br'), khead: $('k-head')
  };

  /* ---------------------------- poses ---------------------------- */
  var KEYS = ['lean', 'y', 'tN', 'sN', 'tF', 'sF', 'aN', 'fN', 'aF', 'fF', 'tilt', 'mouth'];
  function P(a) { var o = {}; KEYS.forEach(function (k, i) { o[k] = a[i]; }); return o; }
  var POSE = {
    //          lean y  tN   sN  tF  sF  aN   fN  aF   fF  tilt mouth
    idle:   P([ 2,   0,  4,   6, -8, 14,  10, -25, -6, -30,  4, 0]),
    run:    P([ 7,  -2, -30, 46, 24, 30,  32, -22, -40, -30,  6, 0]),
    wind:   P([ 11,  0,  44, 98, -6, 14, -40, -30,  42, -22,  8, 0]),
    strike: P([ -2, -3, -62, -6,  8, 22,  40, -30, -58, -42,  2, 0]),
    follow: P([ -8,-10, -86,-16, 14, 30,  52, -20, -76, -44,  0, 0]),
    cheer:  P([ -6,-22,  22, 50,-18, 40, 136,  10,-162, -10, -4, 1]),   /* near arm up and back, so it does not cover his smile */
    sad:    P([  9,  2,   6, 10, -4,  8,   4,  -6,  -2,   -8, 14, 0])
  };
  function ease(u) { u = u < 0 ? 0 : u > 1 ? 1 : u; return u * u * (3 - 2 * u); }
  function lerpPose(a, b, u) { var o = {}, e = ease(u); KEYS.forEach(function (k) { o[k] = a[k] + (b[k] - a[k]) * e; }); return o; }
  function seqPose(seq, t) {
    if (t <= seq[0][0]) return POSE[seq[0][1]];
    for (var i = 1; i < seq.length; i++) if (t <= seq[i][0]) return lerpPose(POSE[seq[i - 1][1]], POSE[seq[i][1]], (t - seq[i - 1][0]) / (seq[i][0] - seq[i - 1][0]));
    return POSE[seq[seq.length - 1][1]];
  }
  function applyPose(p, x, y) {
    el.p.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + (y + p.y * PS).toFixed(1) + ') scale(' + PS + ')');
    el.up.setAttribute('transform', 'rotate(' + p.lean.toFixed(1) + ' 0 -60)');
    el.head.setAttribute('transform', 'translate(3,-149) rotate(' + p.tilt.toFixed(1) + ' 0 17)');
    el.legN.setAttribute('transform', 'translate(0,-60) rotate(' + p.tN.toFixed(1) + ')'); el.shinN.setAttribute('transform', 'translate(0,28) rotate(' + p.sN.toFixed(1) + ')');
    el.legF.setAttribute('transform', 'translate(0,-60) rotate(' + p.tF.toFixed(1) + ')'); el.shinF.setAttribute('transform', 'translate(0,28) rotate(' + p.sF.toFixed(1) + ')');
    el.armN.setAttribute('transform', 'translate(0,-120) rotate(' + p.aN.toFixed(1) + ')'); el.foreN.setAttribute('transform', 'translate(0,26) rotate(' + p.fN.toFixed(1) + ')');
    el.armF.setAttribute('transform', 'translate(0,-120) rotate(' + p.aF.toFixed(1) + ')'); el.foreF.setAttribute('transform', 'translate(0,26) rotate(' + p.fF.toFixed(1) + ')');
    var o = p.mouth > 0.5 && !p.sad, sd = !!p.sad;     /* smile, big open cheer, or sad: frown, worried brows, tears, eyes down */
    el.mo.setAttribute('opacity', o ? 1 : 0); el.mc.setAttribute('opacity', o || sd ? 0 : 1); el.ms.setAttribute('opacity', sd ? 1 : 0); el.tears.setAttribute('opacity', sd ? 1 : 0);
    el.brL.setAttribute('d', sd ? 'M-9.8 -6.4 Q-6 -7.4 -2.2 -11' : 'M-9.8 -8.6 Q-5.8 -11.2 -2.2 -8.8'); el.brR.setAttribute('d', sd ? 'M9.8 -6.4 Q6 -7.4 2.2 -11' : 'M9.8 -8.6 Q5.8 -11.2 2.2 -8.8');
    el.pup.setAttribute('transform', sd ? 'translate(0,1.5)' : 'translate(0,0)');
  }

  /* ---------------------------- state ---------------------------- */
  var banner = document.getElementById('pk-banner'), hint = document.getElementById('pk-hint'), live = document.getElementById('pk-live');
  var pips = Array.prototype.slice.call(document.querySelectorAll('#pk-pips li'));
  var go = document.getElementById('ent-go'), snd = document.getElementById('ent-snd');
  var T = A.t;
  var S = { phase: 'aim', clock: 0, t0: 0, aimT: 0.4, fails: 0, shot: null, doneAt: 0, assist: false, px: P0.x, confetti: [], celebrating: false };
  var aimFixed = null;                                  /* tests can pin the ring */

  function ringPos() {
    if (aimFixed) return aimFixed;
    if (reduce) return { x: CX, y: CY };
    var t = S.aimT;
    return { x: CX + (G.x2 - G.x1) * 0.62 * Math.sin(1.55 * t) / 1, y: CY + (G.base - G.top) * 0.74 * Math.sin(2.05 * t + 0.8) };
  }
  function judge(x, y) {
    if (x > G.x1 + 12 && x < G.x2 - 12 && y > G.top + 12 && y < G.base - 4) return 'goal';
    if (y >= G.top - 12 && y <= G.top + 12 && x > G.x1 - 8 && x < G.x2 + 8) return 'bar';
    if (y >= G.top - 8 && y <= G.base && (Math.abs(x - G.x1) <= 11 || Math.abs(x - G.x2) <= 11)) return 'post';
    return 'miss';
  }
  function say(text, cls) {
    if (!banner) return;
    banner.textContent = text; banner.className = 'pk__banner is-on ' + (cls || '');
    void banner.offsetWidth; banner.classList.add('pop');
    if (live) live.textContent = text;
  }
  function clearBanner() { if (banner) banner.className = 'pk__banner'; }
  function setHint() {
    if (!hint) return;
    hint.textContent = S.phase === 'leaving' ? T('ent.open') : (S.fails >= 3 ? T('ent.help') : T('ent.hint'));
  }
  function paintPips() { pips.forEach(function (li, i) { li.className = i < S.fails ? 'is-miss' : (i === S.fails && S.phase === 'aim' ? 'is-now' : ''); }); }

  /* ---------------------------- the goalkeeper ---------------------------- */
  var kForce = null;                                     /* tests only: 'save' = he reads the shot, 'beat' = he guesses wrong */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function kIdle(clock, aimX) {                          /* the ready stance: a little side-to-side shuffle on his toes */
    var sw = reduce ? 0 : Math.sin(clock * 2.1), bob = reduce ? 0 : Math.abs(Math.sin(clock * 4.2)), hx = HIP0.x + sw * 10;
    return { hx: hx, hy: HIP0.y - bob * 1.8, th: sw * 2.5, aL: -104 + bob * 5, aR: 104 - bob * 5, lg: 7, look: clamp((aimX - hx) / 70, -1, 1), face: 0 };
  }
  function kReach(T) {                                   /* the best way for him to stretch for a point; how far he gets decides whether he saves it */
    var best = null, L = K.reach;
    for (var th = -84; th <= 84; th += 3) {
      var r = th * Math.PI / 180, ux = Math.sin(r), uy = -Math.cos(r);
      var hx = clamp(T.x - L * ux, HIP0.x - K.maxX, HIP0.x + K.maxX), hy = clamp(T.y - L * uy, HIP0.y - K.lift, G.base);
      var gx = hx + L * ux, gy = hy + L * uy, e = Math.sqrt((gx - T.x) * (gx - T.x) + (gy - T.y) * (gy - T.y));
      var move = Math.abs(hx - HIP0.x) + 0.5 * Math.abs(hy - HIP0.y);
      if (!best || e < best.e - 0.5 || (Math.abs(e - best.e) <= 0.5 && move < best.move)) best = { th: th, hx: hx, hy: hy, gx: gx, gy: gy, e: e, move: move };
    }
    return best;
  }
  function kPlan(x, y, out, helped) {                    /* which way he dives, and whether his gloves get to the ball */
    var guess = helped ? false : (kForce ? kForce === 'save' : Math.random() < K.saveChance), T;
    if (guess) T = { x: clamp(x, G.x1 + 18, G.x2 - 18), y: clamp(y, G.top + 14, G.base - 8) };
    else {
      var d = Math.abs(x - CX) < 28 ? (Math.random() < 0.5 ? -1 : 1) : (x < CX ? 1 : -1);
      T = { x: CX + d * (80 + Math.random() * 45), y: G.top + 38 + Math.random() * 70 };
    }
    var R = kReach(T), dx = R.gx - x, dy = R.gy - y;
    R.guess = guess; R.caught = Math.sqrt(dx * dx + dy * dy) <= K.catchR;
    return R;
  }
  function kDive(t) {                                    /* t = seconds since the press: settle, get ready, then dive so the gloves arrive with the ball */
    var sh = S.shot, kp = sh.kp, s = Math.max(0, 1 - t / 0.45), ru = ease(t / 0.45), sw = reduce ? 0 : Math.sin(S.clock * 2.1) * s;
    var k = clamp((t - (LAUNCH + 0.12)) / 0.52, 0, 1), e = ease(k), ea = ease(Math.min(1, k * 1.7));
    var hx0 = HIP0.x + sw * 10, hx = hx0 + (kp.hx - hx0) * e, hy = HIP0.y + (kp.hy - HIP0.y) * e - 15 * Math.sin(Math.PI * k);
    var aL = -104 + 29 * ru + 87 * ea;
    return { hx: hx, hy: hy, th: sw * 2.5 * (1 - e) + kp.th * e, aL: aL, aR: -aL, lg: 7 + 12 * e, look: clamp((sh.x - hx) / 70, -1, 1), face: k > 0.12 ? 1 : 0 };
  }
  /* after the ball arrives (rt = seconds since then): a save -> he jumps up and celebrates; a goal -> he gets up, shoulders down; anything else -> he just gets up */
  function kAfter(rt) {
    var sh = S.shot, f = kDive(99), idle = kIdle(S.clock, CX), hx = clamp(f.hx, G.x1 + 34, G.x2 - 34);
    if (sh.out === 'save') {
      var u = ease(rt / 0.45), w = Math.sin(rt * 8);
      var q = kMix(f, { hx: hx, hy: HIP0.y - Math.abs(w) * 14 * u, th: w * 4, aL: -28 + w * 12, aR: 28 + w * 12, lg: 10, look: 0, face: 2 }, u);
      q.face = rt > 0.12 ? 2 : 1; return q;                                                            /* a save: a big grin */
    }
    if (sh.out === 'goal') { var g = kMix(f, { hx: hx, hy: HIP0.y + 2, th: 0, aL: -166, aR: 166, lg: 6, look: 0, face: 3 }, ease((rt - 0.35) / 0.6)); g.face = 3; return g; }   /* a goal: sad face at once */
    var o = kMix(f, { hx: hx, hy: HIP0.y, th: 0, aL: -120, aR: 120, lg: 7, look: 0, face: 0 }, ease((rt - 0.4) / 0.6)); o.face = rt > 0.5 ? 0 : 1; return o;
  }
  function kMix(a, b, u) { var o = {}; for (var n in a) o[n] = n === 'face' ? (u < 0.5 ? a[n] : b[n]) : a[n] + (b[n] - a[n]) * u; return o; }
  function kApply(p) {
    el.k.setAttribute('transform', 'translate(' + p.hx.toFixed(1) + ',' + p.hy.toFixed(1) + ') rotate(' + p.th.toFixed(1) + ')');
    el.kaL.setAttribute('transform', 'translate(-15,-31) rotate(' + p.aL.toFixed(1) + ')'); el.kaR.setAttribute('transform', 'translate(15,-31) rotate(' + p.aR.toFixed(1) + ')');
    el.klL.setAttribute('transform', 'translate(-6,0) rotate(' + p.lg.toFixed(1) + ')'); el.klR.setAttribute('transform', 'translate(6,0) rotate(' + (-p.lg).toFixed(1) + ')');
    var lx = (p.look * 1.5).toFixed(2); el.kpL.setAttribute('transform', 'translate(' + lx + ',0)'); el.kpR.setAttribute('transform', 'translate(' + lx + ',0)');
    var fc = Math.round(p.face);                         /* 0 calm, 1 effort, 2 grin (saved), 3 sad (beaten) */
    el.kmc.setAttribute('opacity', fc === 0 ? 1 : 0); el.kmo.setAttribute('opacity', fc === 1 ? 1 : 0); el.kmh.setAttribute('opacity', fc === 2 ? 1 : 0); el.kms.setAttribute('opacity', fc === 3 ? 1 : 0);
    el.ktear.setAttribute('opacity', fc === 3 ? 1 : 0);
    el.kbr.setAttribute('d', fc === 3 ? 'M-8 -4.6 Q-5 -5.6 -1.4 -9 M8 -4.6 Q5 -5.6 1.4 -9' : 'M-8 -6 Q-4.6 -8.4 -1.4 -6.4 M8 -6 Q4.6 -8.4 1.4 -6.4');
    el.khead.setAttribute('transform', fc === 3 ? 'translate(0,-50) rotate(7)' : 'translate(0,-52)');
    if (fc === 3) { el.kpL.setAttribute('transform', 'translate(0,1.4)'); el.kpR.setAttribute('transform', 'translate(0,1.4)'); }
    el.ksh.setAttribute('cx', p.hx.toFixed(1)); el.ksh.setAttribute('opacity', (0.3 * Math.max(0.3, 1 - Math.max(0, HIP0.y - p.hy) / 50)).toFixed(2));
  }
  function keeperStep() {
    if (S.freeze) return;
    var p = null, ph = S.phase, sh = S.shot;
    if (ph === 'aim') p = kIdle(S.clock, ringPos().x);
    else if (sh && ph === 'shot') p = kDive(S.clock - S.t0);
    else if (sh && (ph === 'result' || ph === 'leaving')) p = kAfter(S.clock - S.resAt);
    else if (sh && ph === 'reset') p = kMix(kAfter(S.clock - S.resAt), kIdle(S.clock, CX), ease((S.clock - S.doneAt) / 0.55));
    if (p) kApply(p);
  }

  function shoot() {
    if (S.phase !== 'aim' || !root.classList.contains('has-entrance')) return;
    var r = ringPos(), x = r.x, y = r.y;
    if (S.fails >= 3) { x = Math.max(G.x1 + 34, Math.min(G.x2 - 34, x)); y = Math.max(G.top + 36, Math.min(G.base - 22, y)); S.assist = true; }
    if (reduce) { S.phase = 'leaving'; setHint(); say(T('ent.goal'), 'is-goal'); if (AU) AU.sfx('goal'); setTimeout(E.leave, 1000); return; }
    var out = judge(x, y), kp = kPlan(x, y, out, S.fails >= 3);
    if (out === 'goal' && kp.caught) out = 'save';           /* the keeper got there */
    S.shot = { x: x, y: y, out: out, kp: kp, launched: false, arrived: false };
    S.phase = 'shot'; S.t0 = S.clock; clearBanner(); paintPips();
    if (AU) AU.sfx('whistle');
    if (go) go.disabled = true;
  }

  function ballPlace(x, y, sc, rot, op) {
    el.ball.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') scale(' + sc.toFixed(3) + ')');
    el.spin.setAttribute('transform', 'rotate(' + rot.toFixed(0) + ')');
    el.ball.setAttribute('opacity', op == null ? 1 : op);
    var gy = GROUND, k = Math.max(0.2, 1 - Math.abs(gy - y) / 340);
    el.bshadow.setAttribute('cx', x.toFixed(1)); el.bshadow.setAttribute('rx', (11 * k * sc).toFixed(1)); el.bshadow.setAttribute('opacity', (0.3 * k * (op == null ? 1 : op)).toFixed(2));
  }
  function toBack(on) {                                  /* the ball goes behind the front net once it is in the goal */
    if (on) { if (el.ball.parentNode !== el.ballBack) el.ballBack.appendChild(el.ball); }
    else if (el.ball.parentNode === el.ballBack) svg.insertBefore(el.ball, el.ring);
  }
  function resetBall() { toBack(false); el.ball.setAttribute('opacity', 1); ballPlace(B0.x, B0.y, 1, 0, 1); el.bshadow.setAttribute('cx', B0.x); el.bshadow.setAttribute('rx', 11); el.bshadow.setAttribute('opacity', .3); }

  function startConfetti() {
    var cols = ['#ffffff', '#d62839', '#0a1640', '#9db0ff', '#ffffff', '#d62839'], n = 70;
    el.conf.innerHTML = ''; S.confetti = [];
    for (var i = 0; i < n; i++) {
      var r = document.createElementNS(NS, 'rect'); r.setAttribute('width', 8); r.setAttribute('height', 4.5); r.setAttribute('fill', cols[i % cols.length]);
      el.conf.appendChild(r);
      S.confetti.push({ n: r, x: 40 + Math.random() * 720, y: -20 - Math.random() * 200, vy: 70 + Math.random() * 90, vx: (Math.random() - .5) * 50, rot: Math.random() * 360, vr: (Math.random() - .5) * 600, ph: Math.random() * 6 });
    }
    stepConfetti(0);
  }
  function stepConfetti(dt) {
    S.confetti.forEach(function (c) {
      c.y += c.vy * dt; c.x += (c.vx + Math.sin(S.clock * 3 + c.ph) * 30) * dt; c.rot += c.vr * dt;
      c.n.setAttribute('transform', 'translate(' + c.x.toFixed(1) + ',' + c.y.toFixed(1) + ') rotate(' + c.rot.toFixed(0) + ')');
    });
  }

  var SHOT_SEQ = [[0, 'idle'], [0.30, 'run'], [0.56, 'wind'], [LAUNCH, 'strike'], [0.95, 'follow'], [ARRIVE + 0.1, 'follow']];

  function frame(ts) {
    if (!root.classList.contains('has-entrance')) return;                      /* the entrance is gone: stop */
    requestAnimationFrame(frame);
    var now = ts / 1000, dt = Math.min(0.05, now - (frame.last || now)); frame.last = now;
    S.clock += dt;
    var bob = Math.sin(S.clock * 3.2);

    /* the crowd bounces a little all the time, a lot when celebrating */
    var amp = S.celebrating ? 6 : 1.1, sp = S.celebrating ? 14 : 3;
    el.crowdA.setAttribute('transform', 'translate(0,' + (-Math.abs(Math.sin(S.clock * sp)) * amp).toFixed(2) + ')');
    el.crowdB.setAttribute('transform', 'translate(0,' + (-Math.abs(Math.sin(S.clock * sp + 1.6)) * amp).toFixed(2) + ')');
    if (S.confetti.length) stepConfetti(dt);
    keeperStep();

    if (S.phase === 'aim') {
      S.aimT += dt;
      var r = ringPos(); el.ring.setAttribute('transform', 'translate(' + r.x.toFixed(1) + ',' + r.y.toFixed(1) + ')');
      el.ring.setAttribute('opacity', 1); el.ringO.setAttribute('r', (22 + Math.sin(S.clock * 6) * 3).toFixed(1));
      var q = lerpPose(POSE.idle, POSE.idle, 0); q.y = bob * 0.8; q.lean += bob * 0.6;
      S.px += (P0.x - S.px) * Math.min(1, dt * 6);
      if (!S.freeze) applyPose(q, S.px, P0.y);
      return;
    }
    el.ring.setAttribute('opacity', 0);
    var sh = S.shot, t = S.clock - S.t0;

    if (S.phase === 'shot') {
      var px = P0.x + 26 * ease(t / 0.55);
      applyPose(seqPose(SHOT_SEQ, t), px, P0.y); S.px = px;
      if (!sh.launched && t >= LAUNCH) { sh.launched = true; if (AU) AU.sfx('kick'); }
      if (sh.launched) {
        var u = Math.min(1, (t - LAUNCH) / FLIGHT), e = 1 - Math.pow(1 - u, 1.5);
        var bx = B0.x + (sh.x - B0.x) * e, by = B0.y + (sh.y - B0.y) * e - 34 * Math.sin(Math.PI * e);
        if (sh.out === 'miss') { bx = B0.x + (sh.x - B0.x) * e * 1.25; by = B0.y + (sh.y - B0.y) * e * 1.25 - 34 * Math.sin(Math.PI * e); }
        ballPlace(bx, by, 1 - 0.42 * e, t * 900, 1);
        if (sh.out === 'goal' && u > 0.92) toBack(true);
        if (u >= 1) arrive();
      } else { ballPlace(B0.x, B0.y, 1, 0, 1); }
      return;
    }

    if (S.phase === 'result') {
      var rt = S.clock - S.doneAt, po;
      if (sh.out === 'goal') {
        po = lerpPose(POSE.follow, POSE.cheer, rt / 0.4); po.y += -Math.abs(Math.sin(rt * 7)) * 14 * Math.min(1, rt / 0.4); po.lean += Math.sin(rt * 7) * 2;
        var rp = Math.exp(-rt * 4.2) * Math.sin(rt * 34);
        el.net.setAttribute('transform', 'translate(' + CX + ',' + CY + ') scale(' + (1 + rp * 0.07).toFixed(3) + ',' + (1 - rp * 0.05).toFixed(3) + ') translate(' + (-CX) + ',' + (-CY) + ')');
        el.net2.setAttribute('transform', el.net.getAttribute('transform'));
        var by2 = Math.min(sh.y + 26 * (1 - Math.exp(-rt * 6)), G.base - 12);
        ballPlace(sh.x, by2, 0.58, 900 * Math.min(rt, 0.4), 1);
        S.px += ((P0.x + 40) - S.px) * Math.min(1, dt * 3);
      } else {
        po = lerpPose(POSE.follow, POSE.sad, rt / 0.5); po.sad = rt > 0.08; po.y += Math.sin(rt * 13) * 1.3 * Math.min(1, rt / 0.5);   /* he cries a little */
        if (sh.out === 'bar' || sh.out === 'post' || sh.out === 'save') {
          var sv = sh.out === 'save', g = 460, vx = sv ? (sh.x >= CX ? 130 : -130) : -105, vy = sv ? -95 : -70, bx2 = sh.x + vx * rt, by3 = sh.y + vy * rt + 0.5 * g * rt * rt, sc = 0.58 + 0.42 * Math.min(1, rt / 1.2);
          if (by3 > GROUND - 10) by3 = GROUND - 10 - Math.abs(Math.sin(rt * 5)) * 6 * Math.exp(-rt);
          ballPlace(bx2, by3, sc, rt * 600, Math.max(0, 1 - Math.max(0, rt - 1) * 1.6));
        } else {
          var fx = sh.x - B0.x, fy = sh.y - B0.y;
          ballPlace(B0.x + fx * 1.25 + fx * 0.5 * Math.min(rt, 0.5), B0.y + fy * 1.25 + fy * 0.5 * Math.min(rt, 0.5) - 8 * rt, 0.58 - 0.12 * Math.min(rt, 0.5), 900 + rt * 300, Math.max(0, 1 - rt * 1.8));
        }
      }
      applyPose(po, S.px, P0.y);
      if (sh.out === 'goal') { if (rt > 2.3 && S.phase === 'result') { S.phase = 'leaving'; setHint(); E.leave(); } }
      else if (rt > 1.45) { S.phase = 'reset'; S.doneAt = S.clock; clearBanner(); }
      return;
    }

    if (S.phase === 'reset') {
      var tt = S.clock - S.doneAt, u2 = ease(tt / 0.55);
      var rp2 = lerpPose(POSE.sad, POSE.idle, u2); rp2.sad = tt < 0.3;
      S.px += (P0.x - S.px) * Math.min(1, dt * 5);
      applyPose(rp2, S.px, P0.y);
      if (tt > 0.2) { resetBall(); }
      if (tt >= 0.6) { S.phase = 'aim'; S.shot = null; S.aimT += 0; paintPips(); setHint(); if (go) go.disabled = false; }
      return;
    }
    if (S.phase === 'leaving') { applyPose(POSE.cheer, S.px, P0.y - Math.abs(Math.sin(S.clock * 7)) * 14); }
  }

  function arrive() {
    var sh = S.shot; if (sh.arrived) return; sh.arrived = true;
    S.phase = 'result'; S.doneAt = S.clock; S.resAt = S.clock;
    if (sh.out === 'goal') {
      toBack(true); say(T('ent.goal'), 'is-goal'); if (AU) AU.sfx('goal'); S.celebrating = true; startConfetti();
    } else {
      S.fails++; paintPips();
      if (sh.out === 'bar') { say(T('ent.bar'), 'is-bad'); if (AU) AU.sfx('bar'); }
      else if (sh.out === 'post') { say(T('ent.post'), 'is-bad'); if (AU) AU.sfx('post'); }
      else if (sh.out === 'save') { say(T('ent.save'), 'is-bad'); if (AU) AU.sfx('save'); }
      else { say(T('ent.miss'), 'is-bad'); if (AU) AU.sfx('miss'); }
    }
    setHint();
  }

  /* ---------------------------- wiring ---------------------------- */
  mount.addEventListener('click', shoot);
  if (go) go.addEventListener('click', shoot);
  document.addEventListener('keydown', function onKey(e) {
    if (!root.classList.contains('has-entrance')) { document.removeEventListener('keydown', onKey); return; }
    if ((e.key === ' ' || e.code === 'Space') && !(e.target.closest && e.target.closest('button,a,input,select,textarea'))) { e.preventDefault(); shoot(); }
  });

  /* music: starts with the first tap or key press (browsers require that), then the sound button toggles it */
  var woke = false;
  function wake(e) {
    if (woke || !AU) return;
    var t = e.target && e.target.closest ? e.target : null;
    if (e.type === 'keydown' && (e.key === 'Escape' || e.key === 'Tab' || e.key === 'Shift')) return;
    if (t && (t.closest('#ent-skip') || t.closest('#ent-snd'))) return;
    woke = true; document.removeEventListener('click', wake, true); document.removeEventListener('keydown', wake, true);
    if (AU.unlock() && AU.isOn()) AU.startMusic();
    paintSound();
  }
  document.addEventListener('click', wake, true);
  document.addEventListener('keydown', wake, true);
  function paintSound() {
    if (!snd || !AU) return;
    var on = AU.isOn(); snd.setAttribute('aria-pressed', on ? 'true' : 'false');
    var u = snd.querySelector('use'); if (u) u.setAttribute('href', on ? '#i-sound' : '#i-mute');
    snd.classList.toggle('is-wait', on && !woke);
  }
  if (snd) {
    if (!AU || !AU.supported) snd.hidden = true;
    snd.addEventListener('click', function () {
      if (!AU) return;
      var first = !woke;                                  /* before anything has played, the first press starts the music */
      woke = true; AU.unlock();
      var next = first ? true : !AU.isOn(); AU.setOn(next); if (next) AU.startMusic();
      paintSound();
    });
    paintSound();
  }

  /* texts */
  function texts() {
    svg.setAttribute('aria-label', T('ent.scene'));
    if (go) { var s = go.querySelector('span'); if (s) s.textContent = T('ent.shoot'); }
    setHint();
    if (banner && S.phase === 'result' && S.shot) { var o = S.shot.out; banner.textContent = T(o === 'goal' ? 'ent.goal' : o === 'bar' ? 'ent.bar' : o === 'post' ? 'ent.post' : o === 'save' ? 'ent.save' : 'ent.miss'); }
  }
  A.onLang(texts); texts();

  applyPose(POSE.idle, P0.x, P0.y); kApply(kIdle(0, CX)); resetBall(); paintPips();
  requestAnimationFrame(frame);

  window.IntroGame = {
    shoot: shoot, state: S, G: G,
    _aim: function (x, y) { aimFixed = (x == null) ? null : { x: x, y: y }; },
    _freeze: function (b) { S.freeze = !!b; },
    _pose: function (name, x) { applyPose(POSE[name], x == null ? P0.x : x, P0.y); },
    _confetti: startConfetti,
    _keeper: function (m) { kForce = m || null; },                          /* 'save' | 'beat' | null (random) */
    _reach: function (x, y) { var f = kForce; kForce = 'save'; var q = kPlan(x, y, 'goal', false); kForce = f; return { caught: q.caught, e: q.e, th: q.th, hx: q.hx, hy: q.hy }; },
    _dive: function (x, y) { var f = kForce; kForce = 'save'; var q = kPlan(x, y, 'goal', false); kForce = f; S.freeze = true; S.shot = { x: x, y: y, kp: q }; kApply(kDive(99)); S.shot = null; return q.caught; }
  };
})();
