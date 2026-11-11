/* ==========================================================================
   INTRO AUDIO — the music and sound effects. The football tune and all effects are synthesised in the browser with
   the Web Audio API. The theme inside the site is an original recording rendered from my own score (see tools/adventure.py)
   and loaded from assets/audio/music/site-theme.mp3. Nothing is borrowed from any film or song.

   Two pieces of music, both original:
     'intro'  the football entrance: a stadium groove, stomps and claps, a brass chant, a faint crowd.
     'site'   inside the site: an adventure theme with an Egyptian flavour (40 bars, 91 seconds, 105 BPM): ney (reed flute)
              melody, oud and qanun, darbuka and frame drum, strings, a bridge that lifts from maqam Hijaz on D to a bright
              Bb major and comes back. The file repeats without a gap (a 2.5 second cross-fade). If the file cannot be
              loaded (for example when index.html is opened straight from a folder), the older synthesised site tune plays instead.
   When the goal is scored, the entrance tune fades out and the site theme fades in. It keeps playing
   while people read; the round button in the header (js/site-sound.js) switches it on and off.

   Browsers only allow sound after a tap, so the music starts with the first tap/keypress on the entrance.
   API: IntroAudio.unlock() · .startMusic() · .stopMusic(seconds) · .setMode('intro'|'site', seconds)
        .setOn(bool) · .isOn() · .isPlaying() · .setDuck(bool) · .sfx(name)
        sfx names: whistle, kick, goal, bar, post, miss, save
   ========================================================================== */
(function () {
  'use strict';
  var AC = window.AudioContext || window.webkitAudioContext;

  var ctx = null, master, musicBus, sfxBus, noiseBuf, timer = null, step = 0, nextTime = 0;
  var on = true, playing = false, started = false, mode = 'intro', track = 'intro', ducked = false, switching = false;
  var LEVEL = { intro: 0.9, site: 0.9 };             /* master volume per mode */
  var TONE = { intro: 18000, site: 9500 };            /* low-pass cut-off of the music */
  var TRACKS = { intro: { bpm: 112, loop: 256 }, site: { bpm: 116, loop: 512 } };   /* loop length in 16th-note steps */
  var SITE_FILE = 'assets/audio/music/site-theme.mp3', SITE_LOOP = 4032000 / 44100, SITE_XF = 2.5;   /* loop length in seconds (exactly 40 bars at 105 BPM) and the overlap */
  var siteBuf = null, siteState = 'idle', siteOn = false, siteNext = 0, siteN = 0, siteNodes = [];   /* idle | loading | ready | failed */
  try { on = sessionStorage.getItem('se-sound') !== 'off'; } catch (e) {}
  function lvl() { return on ? LEVEL[mode] * (ducked ? 0.14 : 1) : 0; }
  function changed() { try { document.dispatchEvent(new CustomEvent('se-sound')); } catch (e) {} }
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function makeNoise(c) {
    var len = c.sampleRate * 2, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function makeHall(c, secs) {                        /* a soft synthetic hall for the reverb */
    var n = Math.floor(c.sampleRate * secs), b = c.createBuffer(2, n, c.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = b.getChannelData(ch), v = 0;
      for (var i = 0; i < n; i++) {
        v = 0.55 * v + 0.45 * (Math.random() * 2 - 1);   /* a one-pole low-pass keeps it warm, not hissy */
        d[i] = v * Math.pow(1 - i / n, 2.4) * (i < 600 ? i / 600 : 1);
      }
    }
    return b;
  }
  function build(c, dest) {                           /* signal chain, shared by live and offline rendering */
    var comp = c.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 14; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    var m = c.createGain(); m.gain.value = 0.9;
    m.connect(comp); comp.connect(dest);
    var mb = c.createGain(); mb.gain.value = 0.7;
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 18000; lp.Q.value = 0.5;
    var hall = c.createConvolver(); hall.buffer = makeHall(c, 2.6);
    var send = c.createGain(); send.gain.value = 0.42;
    var wet = c.createGain(); wet.gain.value = 0.9;
    mb.connect(lp); lp.connect(m);
    lp.connect(send); send.connect(hall); hall.connect(wet); wet.connect(m);     /* dry + a little hall */
    var sb = c.createGain(); sb.gain.value = 0.9; sb.connect(m);
    var fb = c.createGain(); fb.gain.value = 1; fb.connect(m);                     /* the recorded site theme: it already has its own space, so it skips the synth hall */
    return { master: m, music: mb, sfx: sb, tone: lp, noise: makeNoise(c), crowd: null, file: fb };
  }

  /* ---- basic voices ---- */
  function env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function osc(c, type, f, t, dur, dest, peak, a) {
    var o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    env(g, t, a || 0.004, peak, dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + (a || 0.004) + dur + 0.05);
    return o;
  }
  function kick(c, B, t, bus, vol) {
    var o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(46, t + 0.13);
    g.gain.setValueAtTime(vol || 0.9, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.connect(g); g.connect(bus || B.music); o.start(t); o.stop(t + 0.32);
  }
  function burst(c, B, t, f, q, dur, peak, bus, type) {   /* a short filtered noise hit */
    var s = c.createBufferSource(); s.buffer = B.noise; s.loop = true;
    var bp = c.createBiquadFilter(); bp.type = type || 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
    var g = c.createGain();
    g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(bp); bp.connect(g); g.connect(bus || B.music);
    s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }
  function clap(c, B, t, v) { for (var i = 0; i < 3; i++) burst(c, B, t + i * 0.011, 1500, 0.9, 0.11, 0.3 * (v || 1)); }

  /* ---- instruments (all of them soft-edged, so nothing sounds like a ringtone) ---- */
  function flute(c, B, midi, t, dur, vel) {            /* a breathy flute with a slow vibrato */
    var f = hz(midi), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    var o1 = c.createOscillator(), o2 = c.createOscillator(), g2 = c.createGain();
    o1.type = 'sine'; o2.type = 'triangle'; o1.frequency.value = f; o2.frequency.value = f; g2.gain.value = 0.22;
    lfo.frequency.value = 5.1; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.0065, t + Math.min(0.35, dur * 0.7));
    lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
    var peak = 0.21 * vel, end = t + dur;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.05);
    g.gain.setValueAtTime(peak * 0.9, Math.max(t + 0.06, end - 0.05)); g.gain.exponentialRampToValueAtTime(0.0001, end + 0.16);
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(B.music);
    [o1, o2, lfo].forEach(function (o) { o.start(t); o.stop(end + 0.25); });
    burst(c, B, t, 3400, 1.2, 0.09, 0.02 * vel);        /* the breath */
  }
  function harp(c, B, midi, t, vel) {                  /* a plucked string that rings and fades */
    var f = hz(midi), filt = c.createBiquadFilter(); filt.type = 'lowpass'; filt.Q.value = 0.7;
    filt.frequency.setValueAtTime(4200, t); filt.frequency.exponentialRampToValueAtTime(900, t + 0.55);
    filt.connect(B.music);
    osc(c, 'triangle', f, t, 1.5, filt, 0.2 * vel, 0.003);
    osc(c, 'sine', f * 2, t, 0.7, filt, 0.07 * vel, 0.003);
    osc(c, 'sine', f * 3, t, 0.35, filt, 0.03 * vel, 0.003);
  }
  function strings(c, B, notes, t, dur, vel, shift) {  /* a warm string section: slow attack, slow release */
    var g = c.createGain(), lp = c.createBiquadFilter(), a = Math.min(1.1, dur * 0.3), r = 1.3, peak = 0.026 * vel;
    lp.type = 'lowpass'; lp.frequency.value = 1500; lp.Q.value = 0.4;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.setValueAtTime(peak, t + dur - 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + r);
    lp.connect(g); g.connect(B.music);
    notes.forEach(function (m) {
      [-7, 7].forEach(function (cents) {
        var o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m + (shift || 0)); o.detune.value = cents;
        o.connect(lp); o.start(t); o.stop(t + dur + r + 0.1);
      });
    });
  }
  function bassNote(c, B, midi, t, dur, vel) {         /* a round, soft bass; the 2nd harmonic lets small speakers hear it */
    var f = hz(midi), g = c.createGain(), end = t + dur;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3 * vel, t + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, end + 0.12); g.connect(B.music);
    [[1, 1], [2, 0.34], [3, 0.08]].forEach(function (p) {
      var o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f * p[0];
      var pg = c.createGain(); pg.gain.value = p[1]; o.connect(pg); pg.connect(g); o.start(t); o.stop(end + 0.2);
    });
  }
  function tom(c, B, t, f0, vel) {                     /* a hand-drum with a warm low "thud" */
    var o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.55, t + 0.14);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.4 * vel, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o.connect(g); g.connect(B.music); o.start(t); o.stop(t + 0.36);
    burst(c, B, t, 520, 0.8, 0.04, 0.12 * vel, B.music, 'lowpass');
  }
  function conga(c, B, t, vel) {                       /* a higher, drier hand-drum hit */
    var o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(330, t); o.frequency.exponentialRampToValueAtTime(220, t + 0.09);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.24 * vel, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g); g.connect(B.music); o.start(t); o.stop(t + 0.2);
    burst(c, B, t, 1900, 1.4, 0.03, 0.07 * vel);
  }
  function shaker(c, B, t, vel) { burst(c, B, t, 7200, 1, 0.045, 0.05 * vel, B.music, 'highpass'); }
  function brass(c, B, midi, t, dur, vel) {            /* a stadium brass: bright attack that settles */
    var f = hz(midi), g = c.createGain(), lp = c.createBiquadFilter(), end = t + dur, peak = 0.075 * vel;
    lp.type = 'lowpass'; lp.Q.value = 0.8; lp.frequency.setValueAtTime(700, t); lp.frequency.exponentialRampToValueAtTime(2900, t + 0.07); lp.frequency.exponentialRampToValueAtTime(1700, t + 0.4);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.03);
    g.gain.setValueAtTime(peak * 0.85, Math.max(t + 0.04, end - 0.04)); g.gain.exponentialRampToValueAtTime(0.0001, end + 0.1);
    lp.connect(g); g.connect(B.music);
    [-6, 6].forEach(function (cents) {
      var o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = cents;
      o.connect(lp); o.start(t); o.stop(end + 0.2);
    });
  }
  function ohChant(c, B, midi, t, dur, vel) {          /* a group of men calling "oh": sawtooth voices through two vowel filters (about 450 and 800 Hz) */
    var f = hz(midi), g = c.createGain(), end = t + dur, peak = 0.42 * vel;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.035);
    g.gain.setValueAtTime(peak * 0.8, Math.max(t + 0.05, end - 0.05)); g.gain.exponentialRampToValueAtTime(0.0001, end + 0.09);
    g.connect(B.music);
    [[450, 5, 1], [800, 6, 0.55]].forEach(function (fm) {
      var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fm[0]; bp.Q.value = fm[1];
      var gg = c.createGain(); gg.gain.value = fm[2]; bp.connect(gg); gg.connect(g);
      [-14, 0, 13].forEach(function (cents, i) {
        var o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 1.03, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.06); o.detune.value = cents;
        o.connect(bp); o.start(t + i * 0.006); o.stop(end + 0.2);
      });
    });
  }
  function crowdBed(c, B, t, len) {                    /* a faint stadium murmur under the football tune */
    var s = c.createBufferSource(); s.buffer = B.noise; s.loop = true;
    var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 800; bp.Q.value = 0.45;
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    var g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 2.5);
    g.gain.setValueAtTime(0.05, t + len - 2.5); g.gain.linearRampToValueAtTime(0.0001, t + len);
    s.connect(bp); bp.connect(lp); lp.connect(g); g.connect(B.music);
    s.start(t, Math.random()); s.stop(t + len + 0.1);
    B.crowd = { s: s, g: g };
  }

  /* ---- more instruments for the site theme: an Egyptian-flavoured, Disney-bright little band ---- */
  function qanun(c, B, midi, t, vel) {                 /* a plucked zither: bright, quick, sparkling (the "harp" of the Arab orchestra) */
    var f = hz(midi), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.6;
    lp.frequency.setValueAtTime(6500, t); lp.frequency.exponentialRampToValueAtTime(1500, t + 0.4); lp.connect(B.music);
    osc(c, 'sawtooth', f, t, 0.5, lp, 0.045 * vel, 0.002);
    osc(c, 'triangle', f * 2, t, 0.3, lp, 0.07 * vel, 0.002);
    osc(c, 'sine', f * 4, t, 0.12, lp, 0.02 * vel, 0.002);
  }
  function pizz(c, B, midi, t, vel) {                  /* a plucked string for the "oom" of the bass line; the 2nd harmonic helps small speakers */
    var f = hz(midi), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.5;
    lp.frequency.setValueAtTime(1700, t); lp.frequency.exponentialRampToValueAtTime(420, t + 0.26); lp.connect(B.music);
    osc(c, 'triangle', f, t, 0.4, lp, 0.5 * vel, 0.005);
    osc(c, 'sine', f, t, 0.4, lp, 0.3 * vel, 0.005);
    osc(c, 'sine', f * 2, t, 0.22, lp, 0.16 * vel, 0.005);
  }
  function accordion(c, B, notes, t, dur, vel) {       /* reedy chord stabs on the off-beats: the sound of a street wedding */
    var g = c.createGain(), bp = c.createBiquadFilter(), lp = c.createBiquadFilter(), end = t + dur, peak = 0.028 * vel;
    bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 0.55; lp.type = 'lowpass'; lp.frequency.value = 3600; lp.Q.value = 0.5;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.02);
    g.gain.setValueAtTime(peak * 0.8, Math.max(t + 0.03, end - 0.03)); g.gain.exponentialRampToValueAtTime(0.0001, end + 0.06);
    bp.connect(lp); lp.connect(g); g.connect(B.music);
    notes.forEach(function (m) {
      [-9, 9].forEach(function (cents) {
        var o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = cents;
        o.connect(bp); o.start(t); o.stop(end + 0.1);
      });
    });
  }
  function reed(c, B, midi, t, dur, vel) {             /* a mizmar-like double reed: nasal, a little wild, with a quick vibrato */
    var f = hz(midi), g = c.createGain(), bp = c.createBiquadFilter(), lp = c.createBiquadFilter(), lfo = c.createOscillator(), lg = c.createGain(), end = t + dur, peak = 0.05 * vel;
    bp.type = 'bandpass'; bp.frequency.value = 1250; bp.Q.value = 0.9; lp.type = 'lowpass'; lp.frequency.value = 3000; lp.Q.value = 0.5;
    lfo.frequency.value = 5.6; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.007, t + Math.min(0.3, dur * 0.6)); lfo.connect(lg);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.03);
    g.gain.setValueAtTime(peak * 0.85, Math.max(t + 0.04, end - 0.04)); g.gain.exponentialRampToValueAtTime(0.0001, end + 0.08);
    bp.connect(lp); lp.connect(g); g.connect(B.music);
    [-8, 8].forEach(function (cents) {
      var o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = cents;
      lg.connect(o.frequency); o.connect(bp); o.start(t); o.stop(end + 0.15);
    });
    lfo.start(t); lfo.stop(end + 0.15);
  }
  function glock(c, B, midi, t, vel) {                 /* a little bell for the sparkle */
    var f = hz(midi);
    osc(c, 'sine', f, t, 0.7, B.music, 0.07 * vel, 0.002);
    osc(c, 'sine', f * 2.76, t, 0.25, B.music, 0.025 * vel, 0.002);
    osc(c, 'sine', f * 5.4, t, 0.1, B.music, 0.01 * vel, 0.002);
  }
  function dum(c, B, t, vel) {                         /* the darbuka's deep hit */
    var o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.11);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.85 * vel, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g); g.connect(B.music); o.start(t); o.stop(t + 0.3);
    burst(c, B, t, 900, 0.8, 0.03, 0.1 * vel, B.music, 'lowpass');
  }
  function tak(c, B, t, vel) { burst(c, B, t, 3300, 1.6, 0.06, 0.2 * vel); osc(c, 'sine', 1250, t, 0.05, B.music, 0.06 * vel, 0.002); }   /* the darbuka's crisp rim hit */
  function sak(c, B, t, vel) { burst(c, B, t, 4200, 1, 0.04, 0.09 * vel, B.music, 'highpass'); }                                        /* a ghost note */
  function riqq(c, B, t, vel) { burst(c, B, t, 6800, 1, 0.05, 0.07 * vel, B.music, 'highpass'); burst(c, B, t, 9500, 3, 0.09, 0.035 * vel); }   /* a tambourine with jingles */

  /* ---- the site theme: 32 bars at 116 BPM. Original music: a bright D-major tune over the "oom-pah" of a street band,
     a darbuka playing the maqsum rhythm, and a bridge in maqam Hijaz (the augmented second, the sound people hear as Egyptian and Arab).
     Melody notes: [step, MIDI note, length in steps]; one bar = 16 steps. ---- */
  var SI = [[32,74,4],[36,78,4],[40,81,6],[46,78,2],[48,76,4],[52,73,4],[56,74,8]];            /* bars 2-3: the call that opens the tune */
  var SA = [                                                                                    /* bars 4-11: the main tune */
    [64,69,2],[66,74,2],[68,78,4],[72,76,2],[74,74,2],[76,76,4],
    [80,73,2],[82,76,2],[84,81,4],[88,79,2],[90,76,2],[92,73,4],
    [96,71,2],[98,74,2],[100,78,4],[104,76,2],[106,74,2],[108,71,4],
    [112,71,2],[114,74,2],[116,79,4],[120,78,2],[122,74,2],[124,69,4],
    [128,74,2],[130,78,2],[132,81,4],[136,78,2],[138,76,2],[140,78,4],
    [144,76,2],[146,73,2],[148,76,4],[152,81,4],[156,76,4],
    [160,79,4],[164,78,2],[166,76,2],[168,74,4],[172,71,4],
    [176,73,2],[178,76,2],[180,81,2],[182,79,2],[184,76,4],[188,73,4]
  ];
  var SB = [                                                                                    /* bars 16-23: the bridge in Hijaz on A (A Bb C# D E F G) */
    [256,69,2],[258,70,2],[260,73,4],[264,74,2],[266,73,2],[268,70,4],
    [272,70,2],[274,74,2],[276,77,4],[280,77,2],[282,74,2],[284,70,4],
    [288,69,2],[290,70,2],[292,73,4],[296,76,2],[298,74,2],[300,73,4],
    [304,70,2],[306,74,2],[308,79,4],[312,77,2],[314,74,2],[316,70,4],
    [320,73,2],[322,76,2],[324,81,4],[328,79,2],[330,77,2],[332,76,4],
    [336,77,2],[338,74,2],[340,70,4],[344,74,2],[346,77,2],[348,82,4],
    [352,81,4],[356,77,2],[358,74,2],[360,77,4],[364,74,4],
    [368,73,2],[370,76,2],[372,81,6],[378,76,2],[380,73,4]
  ];
  var SITE_NOTES = (function () {                                                               /* the whole melody, indexed by step */
    var map = {};
    function add(list, shift, below) { list.forEach(function (n) { if (below == null || n[0] < below) (map[n[0] + shift] = map[n[0] + shift] || []).push([n[0] + shift, n[1], n[2]]); }); }
    add(SI, 0); add(SA, 0); add(SA, 128, 128); add(SB, 0); add(SA, 320);                        /* bars 12-15 repeat bars 4-7; the finale repeats the tune */
    return map;
  })();
  var SITE_BARS = ['D','A','G','A',  'D','A','Bm','G','D','A','G','A',  'D','A','Bm','G',  'A','Bb','A','Gm','A','Bb','Dm','A',  'D','A','Bm','G','D','A','G','A'];
  var PAD  = { D: [50, 57, 62, 66], A: [45, 52, 57, 61], Bm: [47, 54, 59, 62], G: [43, 50, 55, 59], Bb: [46, 53, 58, 62], Gm: [43, 50, 58, 62], Dm: [50, 57, 62, 65] };
  var QN   = { D: [57, 62, 66, 69], A: [57, 61, 64, 69], Bm: [59, 62, 66, 71], G: [55, 59, 62, 67], Bb: [58, 62, 65, 70], Gm: [58, 62, 67, 70], Dm: [57, 62, 65, 69] };
  var ACC  = { D: [57, 62, 66], A: [57, 61, 64], Bm: [59, 62, 66], G: [59, 62, 67], Bb: [58, 62, 65], Gm: [58, 62, 67], Dm: [57, 62, 65] };
  var SROOT  = { D: 38, A: 45, Bm: 47, G: 43, Bb: 46, Gm: 43, Dm: 38 };
  var SFIFTH = { D: 45, A: 52, Bm: 54, G: 50, Bb: 53, Gm: 50, Dm: 45 };
  var ARP = [0, 1, 2, 3, 2, 1, 2, 3];
  var D_RUN = [62, 66, 69, 74, 78, 81, 86, 90], H_RUN = [69, 70, 73, 74, 76, 77, 79, 81];          /* the sparkling run at the end of a phrase */
  var RUN_AT = { 3: D_RUN, 15: D_RUN, 23: H_RUN, 31: D_RUN };

  function playSite(c, B, s, t) {
    var S = 60 / TRACKS.site.bpm / 4, bar = Math.floor(s / 16), inBar = s % 16, chord = SITE_BARS[bar];
    var sec = bar < 4 ? 0 : bar < 12 ? 1 : bar < 16 ? 2 : bar < 24 ? 3 : 4;                          /* opening · tune · tune + accordion · Hijaz bridge · finale */
    if (inBar === 0 && sec > 0) strings(c, B, PAD[chord], t, 16 * S, sec === 1 ? 0.55 : 0.8);
    /* the "oom-pah": plucked bass on the beats, reedy chords on the off-beats */
    if (inBar === 0) { pizz(c, B, SROOT[chord], t, 1); bassNote(c, B, SROOT[chord], t, 6 * S, 1.15); }
    if (inBar === 8) { pizz(c, B, SFIFTH[chord], t, 0.85); bassNote(c, B, SFIFTH[chord], t, 6 * S, 0.95); }
    if (sec >= 3 && (inBar === 6 || inBar === 14)) pizz(c, B, inBar === 6 ? SROOT[chord] : SFIFTH[chord], t, 0.6);
    if (sec >= 2 && (inBar === 4 || inBar === 12)) accordion(c, B, ACC[chord], t, 3 * S, sec === 2 ? 0.8 : 1);
    /* the qanun's arpeggio runs through the whole piece */
    if (inBar % 2 === 0) qanun(c, B, QN[chord][ARP[(inBar / 2) % 8]], t, sec === 0 ? 0.95 : sec === 1 ? 0.55 : 0.7);
    /* the darbuka plays the maqsum: dum . tak . . tak dum . . . tak . — with ghost notes, a tambourine and the crowd's claps */
    if (inBar === 0 || inBar === 8) dum(c, B, t, inBar === 0 ? 1 : 0.85);
    if (bar > 0) {
      if (inBar === 2 || inBar === 6 || inBar === 12) tak(c, B, t, inBar === 12 ? 0.95 : 0.75);
      if (inBar === 10 || inBar === 14) sak(c, B, t, 0.5);
      if (sec >= 3 && inBar === 10) dum(c, B, t, 0.5);
      if (inBar % 2 === 0) riqq(c, B, t, inBar === 4 || inBar === 12 ? 1.1 : 0.6);
    }
    if (sec >= 2 && (inBar === 4 || inBar === 12)) clap(c, B, t, sec === 2 ? 0.45 : 0.7);
    var run = RUN_AT[bar]; if (run && inBar >= 8) { glock(c, B, run[inBar - 8], t, 0.8); qanun(c, B, run[inBar - 8] - 12, t, 0.5); }
    /* the tune */
    var list = SITE_NOTES[s];
    if (list) list.forEach(function (n) {
      var m = n[1], dur = n[2] * S * 0.97, tt = t, d2 = dur;
      if (sec >= 2 && n[2] >= 4) {                                                                   /* an ornament: a quick note just below, as Egyptian players do */
        flute(c, B, m - (sec === 3 ? 1 : 2), t, S * 0.55, 0.7); tt = t + S * 0.5; d2 = dur - S * 0.5;
      }
      flute(c, B, m, tt, d2, sec === 0 ? 0.9 : sec === 1 ? 0.95 : sec === 3 ? 0.85 : 1);
      if (sec === 2 || sec === 4) flute(c, B, m + 12, tt, d2, 0.3);
      if (sec === 3 || sec === 4) reed(c, B, m, tt, d2, sec === 3 ? 1 : 0.5);
      if ((sec === 2 || sec === 4) && n[2] >= 4) glock(c, B, m + 12, t, sec === 4 ? 0.7 : 0.5);
    });
  }

  /* ---- the football entrance tune: 16 bars (112 BPM), D major ---- */
  var FB_CHORDS = ['D', 'D', 'G', 'A', 'D', 'Bm', 'G', 'A'];
  var FB_ROOT = { D: 38, G: 43, A: 45, Bm: 47 };
  var FB_PAD = { D: [50, 57, 62, 66], G: [47, 55, 59, 62], A: [45, 52, 57, 61], Bm: [47, 54, 59, 62] };
  var FB_MELODY = [
    [0,74,2],[2,74,2],[4,74,2],[6,78,6],  [16,76,2],[18,76,2],[20,76,2],[22,81,6],
    [32,74,2],[34,74,2],[36,74,2],[38,79,6],  [48,73,2],[50,73,2],[52,73,2],[54,76,6],[60,73,4],
    [64,74,2],[66,74,2],[68,74,2],[70,78,6],  [80,74,2],[82,74,2],[84,74,2],[86,78,6],
    [96,71,2],[98,71,2],[100,71,2],[102,74,6],  [112,73,2],[114,76,2],[116,81,6],[122,76,2],[124,73,4]
  ];
  function playFootball(c, B, s, t) {
    var S = 60 / TRACKS.intro.bpm / 4, bar = Math.floor(s / 16) % 8, inBar = s % 16, pass = s < 128 ? 0 : 1, sl = s % 128, chord = FB_CHORDS[bar];
    if (s === 0) crowdBed(c, B, t, 256 * S);
    if (inBar === 0) strings(c, B, FB_PAD[chord], t, 16 * S, 1.7);
    if (inBar % 4 === 0) { kick(c, B, t, B.music, 0.62); }                /* the stomp */
    if (inBar === 4 || inBar === 12) clap(c, B, t, 1.1);
    if (inBar % 2 === 0) shaker(c, B, t, inBar % 4 === 0 ? 1.5 : 1);
    if (inBar === 0 || inBar === 6 || inBar === 8 || inBar === 12) bassNote(c, B, FB_ROOT[chord], t, 3 * S, 1.25);
    if (inBar >= 12 && (bar === 3 || bar === 7)) conga(c, B, t, 0.35 + (inBar - 12) * 0.13);     /* a drum fill at the end of each phrase */
    /* hand-drums: a syncopated pattern in the spirit of a festival crowd, and the "oh oh oh" call between the brass lines */
    if (inBar === 3 || inBar === 7 || inBar === 10 || inBar === 14) conga(c, B, t, pass ? 0.42 : 0.3);
    if (inBar === 2 || inBar === 11) tom(c, B, t, inBar === 2 ? 150 : 120, pass ? 0.7 : 0.5);
    if (inBar === 8 || inBar === 10 || inBar === 12) {
      if (bar > 0 || pass) {
        var CH = { D: [57, 54], G: [55, 59], A: [57, 61], Bm: [54, 59] }[chord], d = inBar === 12 ? 4 : 2;
        ohChant(c, B, CH[inBar === 10 ? 1 : 0], t, d * S * 0.9, pass ? 1.15 : 0.9);
        if (pass) ohChant(c, B, CH[inBar === 10 ? 1 : 0] + 12, t, d * S * 0.9, 0.55);
      }
    }
    for (var i = 0; i < FB_MELODY.length; i++) if (FB_MELODY[i][0] === sl) {
      var n = FB_MELODY[i]; brass(c, B, n[1], t, n[2] * S * 0.9, pass ? 1.5 : 1.3);
      if (pass) brass(c, B, n[1] - 12, t, n[2] * S * 0.9, 0.8);
    }
  }
  function playStep(c, B, tr, s, t) { if (tr === 'site') playSite(c, B, s, t); else playFootball(c, B, s, t); }

  /* ---- effects ---- */
  function roar(c, B, t, len) {                        /* the crowd */
    var s = c.createBufferSource(); s.buffer = B.noise; s.loop = true;
    var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(700, t); bp.frequency.linearRampToValueAtTime(1100, t + 0.6); bp.Q.value = 0.55;
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.55, t + 0.35);
    g.gain.setValueAtTime(0.55, t + 0.35 + len * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35 + len);
    s.connect(bp); bp.connect(lp); lp.connect(g); g.connect(B.sfx);
    s.start(t, Math.random()); s.stop(t + 0.5 + len);
  }
  var FX = {
    whistle: function (c, B, t) {
      var o = c.createOscillator(), trem = c.createOscillator(), tg = c.createGain(), g = c.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(2750, t); o.frequency.linearRampToValueAtTime(2900, t + 0.28);
      trem.type = 'square'; trem.frequency.value = 34; tg.gain.value = 0.12;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.22, t + 0.02); g.gain.setValueAtTime(0.22, t + 0.26); g.gain.linearRampToValueAtTime(0.0001, t + 0.32);
      trem.connect(tg); tg.connect(g.gain); o.connect(g); g.connect(B.sfx);
      o.start(t); trem.start(t); o.stop(t + 0.35); trem.stop(t + 0.35);
    },
    kick: function (c, B, t) { kick(c, B, t, B.sfx, 1); burst(c, B, t, 1800, 1, 0.05, 0.4, B.sfx); },
    goal: function (c, B, t) {
      roar(c, B, t, 1.7);
      [62, 66, 69, 74, 78].forEach(function (m, i) {                     /* a rising fanfare */
        var tt = t + 0.05 + i * 0.09, f = hz(m);
        osc(c, 'sawtooth', f, tt, 0.5, B.sfx, 0.09); osc(c, 'triangle', f * 2, tt, 0.4, B.sfx, 0.07);
      });
      [74, 78, 81].forEach(function (m) { osc(c, 'triangle', hz(m), t + 0.5, 0.9, B.sfx, 0.08); });
      kick(c, B, t, B.sfx, 0.8);
    },
    bar: function (c, B, t) {                          /* the ball hits the crossbar: a metal "ping" */
      [[1210, 0.34], [1833, 0.2], [2760, 0.12]].forEach(function (p) { osc(c, 'sine', p[0], t, 0.9, B.sfx, p[1] * 0.5); });
      burst(c, B, t, 3000, 1, 0.04, 0.35, B.sfx);
      roar(c, B, t + 0.1, 0.5);
    },
    post: function (c, B, t) {
      [[880, 0.34], [1320, 0.2], [2210, 0.1]].forEach(function (p) { osc(c, 'sine', p[0], t, 0.8, B.sfx, p[1] * 0.5); });
      burst(c, B, t, 2400, 1, 0.04, 0.35, B.sfx);
      roar(c, B, t + 0.1, 0.5);
    },
    miss: function (c, B, t) {                          /* a sympathetic "aww" */
      var o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(190, t + 0.75);
      lp.type = 'lowpass'; lp.frequency.value = 1100;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
      o.connect(lp); lp.connect(g); g.connect(B.sfx); o.start(t); o.stop(t + 0.85);
      roar(c, B, t, 0.35);
    },
    save: function (c, B, t) {                         /* the keeper's gloves smack the ball, then the crowd gasps */
      burst(c, B, t, 750, 0.9, 0.09, 0.6, B.sfx);
      osc(c, 'sine', 140, t, 0.22, B.sfx, 0.3);
      var o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(230, t + 0.12); o.frequency.linearRampToValueAtTime(330, t + 0.38); o.frequency.exponentialRampToValueAtTime(210, t + 0.8);
      lp.type = 'lowpass'; lp.frequency.value = 900;
      g.gain.setValueAtTime(0.0001, t + 0.12); g.gain.exponentialRampToValueAtTime(0.13, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
      o.connect(lp); lp.connect(g); g.connect(B.sfx); o.start(t + 0.12); o.stop(t + 0.9);
      roar(c, B, t + 0.1, 0.45);
    }
  };

  var B = null;
  function loadSite() {
    if (!ctx || siteState !== 'idle') return;
    siteState = 'loading';
    try {
      fetch(SITE_FILE).then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.arrayBuffer(); })
        .then(function (ab) { return new Promise(function (ok, no) { var p = ctx.decodeAudioData(ab, ok, no); if (p && p.catch) p.catch(no); }); })
        .then(function (buf) { siteBuf = buf; siteState = 'ready'; })
        .catch(function () { siteState = 'failed'; });
    } catch (e) { siteState = 'failed'; }
  }
  function killSite() {
    siteNodes.forEach(function (o) { try { o.g.gain.cancelScheduledValues(0); o.s.stop(); } catch (e) {} });
    siteNodes = []; siteOn = false;
  }
  function schedSite() {                                /* every cycle starts a new copy of the file, cross-faded with the end of the one before */
    while (siteNext < ctx.currentTime + 1.5) {
      var t = siteNext, s = ctx.createBufferSource(), g = ctx.createGain();
      s.buffer = siteBuf; s.connect(g); g.connect(B.file);
      if (siteN > 0) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + SITE_XF); } else g.gain.setValueAtTime(1, t);
      g.gain.setValueAtTime(1, t + SITE_LOOP); g.gain.linearRampToValueAtTime(0, t + SITE_LOOP + SITE_XF);
      s.start(t); s.stop(t + SITE_LOOP + SITE_XF + 0.1);
      siteNodes.push({ s: s, g: g }); if (siteNodes.length > 4) siteNodes.shift();
      siteNext += SITE_LOOP; siteN++;
    }
  }
  function stepLen(tr) { return 60 / TRACKS[tr].bpm / 4; }
  function unlock() {
    if (!AC) return false;
    if (!ctx) {
      try { ctx = new AC(); } catch (e) { ctx = null; return false; }
      B = build(ctx, ctx.destination);
      master = B.master; musicBus = B.music; sfxBus = B.sfx; noiseBuf = B.noise;
      master.gain.value = lvl(); B.tone.frequency.value = TONE[mode];
      loadSite();
    }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    started = true;
    return true;
  }
  function tick() {
    if (!ctx) return;
    if (track === 'site' && siteState !== 'failed') {                           /* the recorded theme (silent until it has loaded) */
      if (siteState === 'ready') { if (!siteOn) { siteOn = true; siteN = 0; siteNext = ctx.currentTime + 0.08; } schedSite(); }
      else loadSite();
      return;
    }
    if (nextTime < ctx.currentTime - 0.25) nextTime = ctx.currentTime + 0.05;   /* the tab was in the background */
    while (nextTime < ctx.currentTime + 0.14) {
      playStep(ctx, B, track, step, nextTime);
      nextTime += stepLen(track); step = (step + 1) % TRACKS[track].loop;
    }
  }
  function startMusic() {
    if (!unlock() || playing) return;
    playing = true; track = mode; step = 0; nextTime = ctx.currentTime + 0.08; killSite();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(Math.max(lvl(), 0.0001), ctx.currentTime);
    B.tone.frequency.setValueAtTime(TONE[mode], ctx.currentTime);
    tick(); timer = setInterval(tick, 25);
    try { sessionStorage.setItem('se-music', '1'); } catch (e) {}
    changed();
  }
  function stopMusic(sec) {
    if (!ctx || !playing) return;
    playing = false; clearInterval(timer); timer = null; siteOn = false; siteNodes = [];
    var t = ctx.currentTime, s = sec == null ? 1 : sec;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(0.0001, t + s);
    setTimeout(function () { try { ctx.close(); } catch (e) {} ctx = null; B = null; }, s * 1000 + 500);
    changed();
  }
  /* 'intro' = the football tune · 'site' = the warm theme. Switching fades one out and the other in. */
  function setMode(m, sec) {
    if (!LEVEL[m]) return;
    var was = mode; mode = m;
    if (ctx && B) {
      var t = ctx.currentTime, s = sec == null ? 1.2 : sec;
      if (m !== track && playing) {
        var fade = Math.min(0.8, s * 0.4);
        switching = true;
        master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), t);
        master.gain.linearRampToValueAtTime(0.0001, t + fade);
        if (B.crowd) { try { B.crowd.g.gain.cancelScheduledValues(t); B.crowd.g.gain.setValueAtTime(B.crowd.g.gain.value, t); B.crowd.g.gain.linearRampToValueAtTime(0.0001, t + fade); B.crowd.s.stop(t + fade + 0.05); } catch (e) {} B.crowd = null; }
        setTimeout(function () {
          if (!ctx || !B || !playing) { switching = false; return; }
          var n = ctx.currentTime;
          track = mode; step = 0; nextTime = n + 0.1; switching = false; killSite();
          B.tone.frequency.cancelScheduledValues(n); B.tone.frequency.setValueAtTime(TONE[mode], n);
          master.gain.cancelScheduledValues(n); master.gain.setValueAtTime(0.0001, n);
          master.gain.linearRampToValueAtTime(Math.max(lvl(), 0.0001), n + Math.max(0.5, s - fade));
        }, fade * 1000 + 30);
      } else {
        master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t);
        master.gain.linearRampToValueAtTime(Math.max(lvl(), 0.0001), t + s);
        B.tone.frequency.cancelScheduledValues(t); B.tone.frequency.setValueAtTime(B.tone.frequency.value, t);
        B.tone.frequency.exponentialRampToValueAtTime(TONE[m], t + s);
      }
    }
    changed();
  }
  function setDuck(v) {                               /* the music dips while a voice recording plays */
    ducked = !!v;
    if (ctx && master && !switching) {
      var t = ctx.currentTime; master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), t); master.gain.linearRampToValueAtTime(Math.max(lvl(), 0.0001), t + 0.35);
    }
  }
  function setOn(v) {
    on = !!v;
    try { sessionStorage.setItem('se-sound', on ? 'on' : 'off'); } catch (e) {}
    if (ctx && master && !switching) {
      var t = ctx.currentTime; master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), t); master.gain.linearRampToValueAtTime(Math.max(lvl(), 0.0001), t + 0.12);
    }
    if (on && started && !playing && ctx) startMusic();
    changed();
  }
  function sfx(name) {
    if (!on || !ctx || !B || !FX[name]) return;
    FX[name](ctx, B, ctx.currentTime + 0.01);
  }

  /* ---- offline rendering (used only to check the audio in tests) ---- */
  function renderOffline(seconds, withFx, tr) {
    var OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    tr = tr || 'site';
    var rate = 22050, c = new OAC(1, Math.ceil(seconds * rate), rate), b = build(c, c.destination), S = stepLen(tr);
    var steps = Math.floor(seconds / S);
    for (var s = 0; s < steps; s++) playStep(c, b, tr, s % TRACKS[tr].loop, s * S);
    if (withFx) { var t = 1; ['whistle', 'kick', 'goal', 'bar', 'post', 'miss'].forEach(function (n, i) { FX[n](c, b, t + i * 2.2); }); }
    return c.startRendering().then(function (buf) { return Array.prototype.slice.call(buf.getChannelData(0)); });
  }

  /* a hidden tab goes quiet instead of looping in the background */
  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (document.hidden) { try { ctx.suspend(); } catch (e) {} }
    else if (playing) { try { ctx.resume(); } catch (e) {} }
  });

  window.IntroAudio = {
    unlock: unlock, startMusic: startMusic, stopMusic: stopMusic, setMode: setMode, setOn: setOn, setDuck: setDuck, sfx: sfx,
    mode: function () { return mode; }, track: function () { return track; },
    isOn: function () { return on; }, isPlaying: function () { return playing; }, supported: !!AC, renderOffline: renderOffline
  };
})();
