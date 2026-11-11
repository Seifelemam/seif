"""Original adventure theme with an Egyptian flavour (D Hijaz, then a lift to Bb Ajam and back).
Offline additive / physical-model synthesis. Everything here is composed from scratch."""
import numpy as np, sys, json
from scipy import signal
SR = 44100
BPM = 105.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
NB = 40
L = NB * BAR                       # one loop, seconds
XF = 2.5                           # overlap used for the gapless loop in the browser
CYC = 3                            # cycles rendered (the middle/last ones are the steady state)
NS = int((CYC * L + 4) * SR)

def hz(m): return 440.0 * 2 ** ((m - 69) / 12.0)
def seed_of(*a): return abs(hash(a)) % (2 ** 31)
_cache = {}
def cached(fn):
    def w(*a, **kw):
        k = (fn.__name__,) + a + tuple(sorted(kw.items()))
        if k not in _cache: _cache[k] = fn(*a, **kw)
        return _cache[k]
    return w

# ------------------------------------------------------------------ instruments (mono, float32)
def _pan(sig, p):
    a = (p + 1) * np.pi / 4
    return np.cos(a) * sig, np.sin(a) * sig

@cached
def ks(midi, t60, bright, vel, sd, pick=0.18, det=0.0, click=0.12):
    """Karplus-Strong string with a fractional-delay all-pass: oud / qanun / bass pizzicato."""
    f = hz(midi) * 2 ** (det / 1200.0)
    a0 = 0.5 + 0.46 * bright; a1 = 1 - a0
    Dt = SR / f
    Di = int(np.floor(Dt - a1 - 0.5)); fr = Dt - a1 - Di
    c = (1 - fr) / (1 + fr)
    g = 10 ** (-3 * Dt / (SR * t60))
    den = np.zeros(Di + 3); den[0] = 1; den[1] = c
    den[Di] -= g * a0 * c; den[Di + 1] -= g * (a0 + a1 * c); den[Di + 2] -= g * a1
    rng = np.random.default_rng(sd)
    m = Di + 2
    x = rng.standard_normal(m)
    k = max(1, int(round((1 - bright) * 6 + 1)))      # duller pluck = smoother excitation
    x = np.convolve(x, np.ones(k) / k, mode='same')
    pp = max(1, int(pick * Di)); x2 = x.copy(); x2[pp:] -= x[:-pp]; x = x2
    x -= x.mean(); x /= (np.abs(x).max() + 1e-9)
    n = int(min(t60 * 1.15, 6.0) * SR)
    ex = np.zeros(n); ex[:m] = x
    y = signal.lfilter([1, c], den, ex)
    # a short pick click
    nc = int(0.004 * SR); cl = rng.standard_normal(nc) * np.hanning(nc)
    sos = signal.butter(2, [1800, 7000], 'bandpass', fs=SR, output='sos'); cl = signal.sosfilt(sos, cl)
    y[:nc] += click * np.abs(y[:4000]).max() * cl / (np.abs(cl).max() + 1e-9)
    y /= (np.abs(y[:int(0.3 * SR)]).max() + 1e-9)
    fade = int(0.05 * SR); y[-fade:] *= np.linspace(1, 0, fade)
    return (y * vel).astype(np.float32)

@cached
def ney(midi, dur, vel, sd, vib=1.0, scoop=1.0):
    f0 = hz(midi); n = int((dur + 0.3) * SR); t = np.arange(n) / SR
    rng = np.random.default_rng(sd)
    att = np.clip(t / 0.05, 0, 1); att = att * att * (3 - 2 * att)
    r = np.clip((t - dur) / 0.18, 0, 1); rel = 1 - r * r * (3 - 2 * r)
    env = att * rel * (1 + 0.035 * np.sin(2 * np.pi * 5.0 * t + rng.uniform(0, 6)))
    drift = np.convolve(rng.standard_normal(n), np.ones(int(0.08 * SR)) / (0.08 * SR), 'same') * 38
    cents = vib * 16 * np.clip((t - 0.22) / 0.45, 0, 1) * np.sin(2 * np.pi * 5.3 * t) - scoop * 42 * np.exp(-t / 0.045) + drift
    f = f0 * 2 ** (cents / 1200.0)
    ph = 2 * np.pi * np.cumsum(f) / SR
    amps = [1, .44, .24, .13, .075, .04, .02]
    tone = sum(a * np.sin((k + 1) * ph + k * 0.7) for k, a in enumerate(amps))
    bn = rng.standard_normal(n)
    lo = max(900, min(2.2 * f0, 5000)); hi = min(lo * 2.6, 9000)
    sos = signal.butter(2, [lo, hi], 'bandpass', fs=SR, output='sos'); br = signal.sosfilt(sos, bn)
    br *= 0.55 + 1.6 * np.exp(-t / 0.07)
    sig = (0.5 * tone + 0.20 * br) * env
    sos = signal.butter(2, 6500, 'lowpass', fs=SR, output='sos'); sig = signal.sosfilt(sos, sig)
    return (sig * vel * 0.8).astype(np.float32)

@cached
def strings(midis, dur, vel, sd, att=0.85, rel=1.1, fc=2600.0, short=0):
    n = int((dur + rel) * SR); t = np.arange(n, dtype=np.float32) / SR
    rng = np.random.default_rng(sd)
    a = np.clip(t / att, 0, 1); a = a * a * (3 - 2 * a)
    r = np.clip((t - dur) / rel, 0, 1); rl = 1 - r * r * (3 - 2 * r)
    env = (a * rl).astype(np.float32)
    if short:
        env = (np.clip(t / 0.03, 0, 1) * np.exp(-t / short)).astype(np.float32)
    out = np.zeros(n, np.float32)
    for mi in midis:
        f0 = hz(mi)
        for det in (-7.0, 0.0, 7.0):
            fv = f0 * 2 ** (det / 1200.0)
            vib = 1 + 0.0023 * np.sin(2 * np.pi * rng.uniform(4.6, 5.4) * t + rng.uniform(0, 6)).astype(np.float32)
            ph = (2 * np.pi * fv * np.cumsum(vib) / SR).astype(np.float32)
            for k in range(1, 13):
                if k * fv > 16000: break
                amp = k ** -1.05 * np.exp(-((k * fv) / fc) ** 2)
                if amp < 0.004: continue
                out += (amp * np.sin(k * ph + rng.uniform(0, 6.28))).astype(np.float32)
    out *= env / (len(midis) * 3.0)
    return (out * vel).astype(np.float32)

@cached
def sub(midi, dur, vel):
    f = hz(midi); n = int((dur + 0.4) * SR); t = np.arange(n) / SR
    a = np.clip(t / 0.4, 0, 1); r = np.clip((t - dur) / 0.4, 0, 1)
    return (np.sin(2 * np.pi * f * t) * a * (1 - r) * vel).astype(np.float32)

def _noise(sd, n): return np.random.default_rng(sd).standard_normal(n)

@cached
def dum(vel, sd=1):
    n = int(0.55 * SR); t = np.arange(n) / SR
    f = 105 + 95 * np.exp(-t / 0.028)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13)
    body += 0.25 * np.sin(2 * np.pi * np.cumsum(f * 2.31) / SR) * np.exp(-t / 0.05)
    cl = signal.sosfilt(signal.butter(2, [900, 2600], 'bandpass', fs=SR, output='sos'), _noise(sd, n)) * np.exp(-t / 0.006)
    return ((body + 0.25 * cl) * vel).astype(np.float32)

@cached
def tak(vel, sd=2, soft=1.0):
    n = int(0.22 * SR); t = np.arange(n) / SR
    ns = signal.sosfilt(signal.butter(2, [2300, 7500], 'bandpass', fs=SR, output='sos'), _noise(sd, n)) * np.exp(-t / (0.035 * soft))
    ping = np.sin(2 * np.pi * 1850 * t) * np.exp(-t / 0.03) * 0.35 + np.sin(2 * np.pi * 3300 * t) * np.exp(-t / 0.018) * 0.12
    return ((ns * 0.9 + ping) * vel * 0.55).astype(np.float32)

@cached
def boom(vel, f0=64, tau=0.55, sd=3):
    n = int(1.6 * SR); t = np.arange(n) / SR
    f = f0 + 38 * np.exp(-t / 0.05)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / tau)
    th = signal.sosfilt(signal.butter(2, [120, 900], 'bandpass', fs=SR, output='sos'), _noise(sd, n)) * np.exp(-t / 0.04)
    return ((s + 0.35 * th) * vel).astype(np.float32)

@cached
def bendir(vel, sd=4):
    n = int(0.5 * SR); t = np.arange(n) / SR
    f = 118 + 40 * np.exp(-t / 0.03)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    rattle = signal.sosfilt(signal.butter(2, [3000, 9000], 'bandpass', fs=SR, output='sos'), _noise(sd, n)) * np.exp(-t / 0.09) * 0.12
    return ((s + rattle) * vel * 0.9).astype(np.float32)

@cached
def riq(vel, sd=5):
    n = int(0.16 * SR); t = np.arange(n) / SR
    j = signal.sosfilt(signal.butter(2, [6000, 12000], 'bandpass', fs=SR, output='sos'), _noise(sd, n))
    j *= (np.exp(-t / 0.05) * (1 + 0.6 * np.sin(2 * np.pi * 95 * t)))
    return (j * vel * 0.15).astype(np.float32)

@cached
def shaker(vel, sd=6):
    n = int(0.06 * SR); t = np.arange(n) / SR
    s = signal.sosfilt(signal.butter(2, 5500, 'highpass', fs=SR, output='sos'), _noise(sd, n)) * np.exp(-t / 0.014)
    return (s * vel * 0.08).astype(np.float32)

@cached
def riser(dur, vel, sd=7):
    n = int(dur * SR); t = np.arange(n) / SR
    ns = _noise(sd, n)
    out = np.zeros(n)
    for lo in (800, 2000, 4500):
        out += signal.sosfilt(signal.butter(2, [lo, lo * 2.2], 'bandpass', fs=SR, output='sos'), ns)
    e = (t / dur) ** 2.2
    return (out * e * vel * 0.12).astype(np.float32)

# ------------------------------------------------------------------ score
CHORD = {  # pad voicing, bass root, qanun arpeggio notes (octave 4-5)
    'D':  dict(pad=(57, 62, 66, 69), root=38, arp=(62, 66, 69, 74), osc=(38, 45, 50, 57)),
    'Gm': dict(pad=(55, 58, 62, 67), root=43, arp=(62, 67, 70, 74), osc=(43, 50, 55, 62)),
    'Eb': dict(pad=(55, 58, 63, 67), root=39, arp=(63, 67, 70, 75), osc=(39, 46, 51, 58)),
    'Bb': dict(pad=(53, 58, 62, 65), root=46, arp=(62, 65, 70, 74), osc=(46, 53, 58, 65)),
    'F':  dict(pad=(53, 57, 60, 65), root=41, arp=(60, 65, 69, 72), osc=(41, 48, 53, 60)),
}
PROG = (['D', 'D', 'Eb', 'D'] +                                   # intro
        ['D', 'Gm', 'D', 'D', 'Gm', 'Eb', 'Gm', 'D'] * 2 +         # A, A2
        ['Bb', 'F', 'Gm', 'Eb', 'Bb', 'F', 'Gm', 'Eb'] +          # B (lift)
        ['D', 'Gm', 'D', 'D', 'Gm', 'Eb', 'Gm', 'D'] +            # A3
        ['Gm', 'Eb', 'D', 'D'])                                   # outro
assert len(PROG) == NB
D4, Eb4, Fs4, G4, A4, Bb4, C5, D5, Eb5, Fs5, G5, A5 = 62, 63, 66, 67, 69, 70, 72, 74, 75, 78, 79, 81
F4, F5, E5 = 65, 77, 76
# melody A: (beat-in-bar, length, midi) per bar
MEL_A = [
    [(0, 1.5, A4), (1.5, .5, A4), (2, 1, D5), (3, 1, C5)],
    [(0, 1.5, Bb4), (1.5, .5, A4), (2, 1, G4), (3, 1, Fs4)],
    [(0, 1.5, A4), (1.5, .5, A4), (2, 1, D5), (3, 1, Eb5)],
    [(0, 1.5, D5), (1.5, .5, C5), (2, 2, A4)],
    [(0, 1, D5), (1, .5, Eb5), (1.5, .5, D5), (2, 1, C5), (3, 1, Bb4)],
    [(0, 1.5, Bb4), (1.5, .5, G4), (2, 1, Bb4), (3, 1, C5)],
    [(0, 1, A4), (1, 1, Bb4), (2, 1, C5), (3, 1, D5)],
    [(0, 3, D5)],
]
MEL_A2 = [  # the second time: lifted and ornamented
    [(0, 1.5, D5), (1.5, .5, D5), (2, 1, A5), (3, 1, G5)],
    [(0, 1.5, Bb4), (1.5, .5, A4), (2, 1, D5), (3, 1, Fs5)],
    [(0, 1.5, D5), (1.5, .5, D5), (2, 1, A5), (3, 1, Eb5 + 12 - 12)],
    [(0, 1.5, G5), (1.5, .5, Fs5), (2, 2, D5)],
    [(0, 1, D5), (1, .5, Eb5), (1.5, .5, D5), (2, 1, C5), (3, 1, Bb4)],
    [(0, 1.5, Bb4), (1.5, .5, G4), (2, 1, Bb4), (3, 1, C5)],
    [(0, 1, A4), (1, 1, Bb4), (2, 1, C5), (3, 1, D5)],
    [(0, 3, D5)],
]
MEL_B = [
    [(0, 1, Bb4), (1, 1, D5), (2, 2, F5)],
    [(0, 1, A4), (1, 1, C5), (2, 2, F5)],
    [(0, 1.5, G5), (1.5, .5, F5), (2, 1, D5), (3, 1, Bb4)],
    [(0, 2, Eb5), (2, 1, D5), (3, 1, C5)],
    [(0, 1, Bb4), (1, 1, D5), (2, 1, F5), (3, 1, G5)],
    [(0, 1, F5), (1, 1, A5), (2, 1, G5), (3, 1, F5)],
    [(0, 1.5, D5), (1.5, .5, Eb5), (2, 1, D5), (3, 1, C5)],
    [(0, 2, Bb4), (2, 1, C5), (3, 1, Eb5)],
]
OUD_RIFF = [(0, 1.0), (1, .0), (1.5, .55), (2, .7), (2.5, .5), (3, .9), (3.5, .0)]    # not used directly; see oud_bar

def build():
    buses = {k: np.zeros((2, NS), np.float32) for k in ['oud', 'qan', 'ney', 'pad', 'bass', 'perc', 'fx']}
    def put(bus, sig, t, pan=0.0, g=1.0):
        i = int(round(t * SR))
        if i < 0 or i >= NS: return
        e = min(NS, i + len(sig)); s = sig[:e - i] * g
        l, r = _pan(s, pan)
        buses[bus][0, i:e] += l; buses[bus][1, i:e] += r
    SEC = lambda b: ('intro' if b < 4 else 'A' if b < 12 else 'A2' if b < 20 else 'B' if b < 28 else 'A3' if b < 36 else 'outro')
    for cyc in range(CYC):
        for b in range(NB):
            t0 = cyc * L + b * BAR; ch = CHORD[PROG[b]]; sec = SEC(b); bs = lambda x: t0 + x * BEAT
            sd = lambda *a: seed_of(*a)
            # ---------- pad (strings)
            pv = {'intro': .55, 'A': .6, 'A2': .75, 'B': 1.0, 'A3': .95, 'outro': .6}[sec]
            put('pad', strings(ch['pad'], BAR * 1.02, pv, 11 + b), t0, 0.0)
            # ---------- sub drone in the intro/outro
            if sec in ('intro', 'outro'):
                put('bass', sub(ch['root'] + 12 if ch['root'] < 40 else ch['root'], BAR, .16), t0, 0)
            # ---------- percussion
            def grid8(): return [(i, t0 + i * BEAT / 2) for i in range(8)]
            if sec in ('intro', 'outro'):
                if b % 4 >= 1 or sec == 'outro':
                    for i, tt in grid8():
                        if i % 2 == 1: put('perc', riq(.5 if i % 4 == 3 else .3, sd('rq', b, i)), tt, .35)
                if b % 4 in (2, 3) and sec == 'intro':
                    put('perc', bendir(.8), bs(0), -.2); put('perc', bendir(.55), bs(2), -.2)
                if sec == 'outro': put('perc', bendir(.6 if b != 39 else .8), bs(0), -.2)
            else:
                mq = {0: 'D', 1: 'T', 3: 'T', 4: 'D', 6: 'T'}
                ghost = {2: .25, 5: .22, 7: .3}
                vscale = {'A': .85, 'A2': 1.0, 'B': 1.05, 'A3': 1.1}[sec]
                for i, tt in grid8():
                    if i in mq:
                        if mq[i] == 'D': put('perc', dum(vscale * (1.0 if i == 0 else .8), sd('d', i)), tt, -.1)
                        else: put('perc', tak(vscale * .9, sd('t', i)), tt, .1)
                    elif sec != 'A':
                        put('perc', tak(ghost[i] * vscale, sd('g', i), .6), tt, .12)
                put('perc', bendir(.75 * vscale), bs(0), -.3); put('perc', bendir(.5 * vscale), bs(2), -.3)
                for i, tt in grid8(): put('perc', riq(.55 if i % 2 == 0 else .35, sd('rq', i)), tt, .4)
                if sec in ('B', 'A3'):
                    for i in range(16):
                        put('perc', shaker(.5 if i % 4 == 0 else .3 if i % 2 == 0 else .2, sd('sh', i)), t0 + i * BEAT / 4, .5)
                if b in (12, 20, 28) :
                    put('perc', boom(.55), t0, 0)
                if sec == 'A3' and b % 4 == 0:
                    put('perc', boom(.4, 58, .5), t0, 0)
            if b in (19, 27): put('fx', riser(BAR * 1.0, 1.0, 70 + b), t0 + 0.0, 0.0)
            # ---------- bass (pizzicato) from A on
            if sec in ('A', 'A2', 'B', 'A3'):
                r = ch['root']; fif = r + 7
                pat = [(0, r, 1.0, 1.3), (1.5, r + 12, .55, .7), (2, fif, .8, .9), (3, r, .7, 0.9), (3.5, fif, .5, .5)]
                if sec == 'B': pat = [(0, r, 1.0, 2.0), (2, fif, .8, 1.0), (3, r + 12, .6, .8)]
                for beat, m, v, dur in pat:
                    put('bass', ks(m, 1.1, .12, v * .9, sd('bs', m, beat), pick=.3, click=.05) * 1.0, bs(beat), 0, 1.0)
            # ---------- oud ostinato (A, A2, A3, and the intro from bar 3)
            if sec in ('A', 'A2', 'A3') or (sec == 'intro' and b >= 2):
                o = ch['osc']
                riff = [(0, o[0], 1.0), (.5, o[1], .45), (1, o[2], .65), (1.5, o[1], .45), (2, o[0] + 12 if sec != 'intro' else o[0], .85),
                        (2.5, o[1], .5), (3, o[2], .7), (3.5, o[3] if sec == 'A3' else o[1], .5)]
                for beat, m, v in riff:
                    vv = v * (0.7 if sec == 'intro' else 1.0)
                    for det, pan in ((-3, -.35), (3, -.25)):
                        put('oud', ks(m + 12, 1.0, .5, vv * .5, sd('oud', m, beat, det), pick=.16, det=det), bs(beat), pan)
            # ---------- qanun
            if sec == 'intro' or sec == 'outro':
                arp = ch['arp']
                for j, beat in enumerate((0, 1, 2, 3)):
                    if (b + j) % 2 == 0 or sec == 'outro':
                        put('qan', ks(arp[j % 4] + (12 if j % 2 else 0), 2.4, .85, .5, sd('q', b, j), pick=.12), bs(beat + .5), .45)
            if sec == 'B':
                arp = ch['arp']; pat = [0, 1, 2, 3, 2, 1, 2, 3]
                for i in range(8):
                    put('qan', ks(arp[pat[i]] + 0, 2.2, .85, .42, sd('qb', b, i), pick=.12), bs(i * .5), .4)
                    put('qan', ks(arp[pat[(i + 2) % 8]] + 12, 2.0, .85, .3, sd('qb2', b, i), pick=.12), bs(i * .5 + .25), .5)
            if sec in ('A2', 'A3') and b % 4 == 3:
                run = (62, 63, 66, 67, 69, 70, 72, 74)
                for i, m in enumerate(run):
                    put('qan', ks(m + 12, 1.8, .9, .45, sd('run', b, i), pick=.1), bs(2.5 + i * .125 * 4 / 2 * .5 * 1.0), .5)
            if sec == 'A3':
                arp = ch['arp']
                for i in range(4): put('qan', ks(arp[i] + 12, 2.0, .85, .3, sd('qa3', b, i), pick=.12), bs(i + .5), .45)
            # ---------- ney melody
            mel = None; octs = 0
            if sec == 'A': mel = MEL_A[b - 4]
            elif sec == 'A2': mel = MEL_A2[b - 12]
            elif sec == 'B': mel = MEL_B[b - 20]
            elif sec == 'A3': mel = MEL_A[b - 28]
            if mel:
                for k, (beat, ln, m) in enumerate(mel):
                    vel = 0.9 if sec != 'A' else 0.8
                    put('ney', ney(m, ln * BEAT * 0.97, vel, sd('ney', sec, b, k), vib=1.0), bs(beat), 0.05)
                    if sec == 'A3':      # the climax: the tune is doubled an octave below by low strings and above by the qanun
                        put('pad', strings((m - 12,), ln * BEAT * .98, .9, sd('st', b, k), att=.12, rel=.25, fc=2200.0), bs(beat), -.1)
                        put('qan', ks(m + 12, 1.6, .9, .5, sd('qm', b, k), pick=.12), bs(beat), .45)
                    if sec == 'B':
                        put('pad', strings((m - 12,), ln * BEAT * .98, .8, sd('stb', b, k), att=.2, rel=.3, fc=2400.0), bs(beat), -.15)
            # ---------- low strings staccato drive (A3 and B second half)
            if sec == 'A3' or (sec == 'B' and b >= 24):
                r = ch['root'] + 12
                for i in range(8):
                    put('pad', strings((r,), .2, .7 if i % 2 == 0 else .5, sd('cel', i), att=.03, rel=.2, fc=1500.0, short=.14), bs(i * .5), -.1)
    return buses

def reverb(x, secs=2.6, seed=9, hp=300, damp=4800):
    n = int(secs * SR); t = np.arange(n) / SR
    rng = np.random.default_rng(seed)
    ir = np.stack([rng.standard_normal(n) * np.exp(-t / (secs / 6.0)) for _ in range(2)])
    ir *= (1 - np.exp(-t / 0.012))[None, :]
    sos = signal.butter(2, damp, 'lowpass', fs=SR, output='sos'); ir = signal.sosfilt(sos, ir, axis=1)
    sos = signal.butter(2, hp, 'highpass', fs=SR, output='sos'); ir = signal.sosfilt(sos, ir, axis=1)
    ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
    out = np.zeros_like(x)
    for ch in range(2):
        out[ch] = signal.oaconvolve(x[ch], ir[ch], mode='full')[:x.shape[1]]
    return out

def mix(buses, gains, sends):
    dry = np.zeros((2, NS), np.float32); wet = np.zeros((2, NS), np.float32)
    for k, b in buses.items():
        dry += b * gains[k]; wet += b * gains[k] * sends[k]
    return dry, reverb(wet).astype(np.float32)

def hishelf(x, f0, gain_db, fs=SR):
    A = 10 ** (gain_db / 40.0); w = 2 * np.pi * f0 / fs; cs, sn = np.cos(w), np.sin(w); al = sn / 2 * np.sqrt(2)
    b0 = A * ((A + 1) + (A - 1) * cs + 2 * np.sqrt(A) * al); b1 = -2 * A * ((A - 1) + (A + 1) * cs)
    b2 = A * ((A + 1) + (A - 1) * cs - 2 * np.sqrt(A) * al); a0 = (A + 1) - (A - 1) * cs + 2 * np.sqrt(A) * al
    a1 = 2 * ((A - 1) - (A + 1) * cs); a2 = (A + 1) - (A - 1) * cs - 2 * np.sqrt(A) * al
    return signal.lfilter([b0 / a0, b1 / a0, b2 / a0], [1, a1 / a0, a2 / a0], x, axis=1)

def dynamics(x, thr=-22.0, ratio=3.2, lim=-1.5):
    from scipy.ndimage import maximum_filter1d, uniform_filter1d
    pk = np.abs(x).max(0)
    env = uniform_filter1d(maximum_filter1d(pk, int(0.02 * SR)), int(0.12 * SR))
    db = 20 * np.log10(env + 1e-9); over = np.maximum(db - thr, 0)
    g = 10 ** (-(over * (1 - 1 / ratio)) / 20)
    g = uniform_filter1d(g, int(0.01 * SR))
    y = x * g[None, :]
    # look-ahead peak limiter
    ceil = 10 ** (lim / 20); pk = np.abs(y).max(0)
    la = int(0.004 * SR); e2 = maximum_filter1d(pk, la * 2 + 1)
    gl = np.minimum(1.0, ceil / (e2 + 1e-9)); gl = uniform_filter1d(gl, la * 2 + 1)
    y = y * gl[None, :]
    return y

GAINS = dict(oud=1.25, qan=1.0, ney=.85, pad=.42, bass=.6, perc=.62, fx=.8)
SENDS = dict(oud=.12, qan=.32, ney=.34, pad=.3, bass=0.0, perc=.06, fx=.4)

if __name__ == '__main__':
    out = sys.argv[1]
    buses = build()
    secs = [('intro', 0, 4), ('A', 4, 12), ('A2', 12, 20), ('B', 20, 28), ('A3', 28, 36)]
    print('bus rms (dB) per section, after gain:')
    for nm, b0, b1 in secs:
        i0 = int((L + b0 * BAR) * SR); i1 = int((L + b1 * BAR) * SR)
        print('%-6s' % nm, ' '.join('%s:%.0f' % (k, 20 * np.log10(np.sqrt((buses[k][:, i0:i1].mean(0) ** 2).mean()) * GAINS[k] + 1e-9)) for k in buses))
    dry, wet = mix(buses, GAINS, SENDS)
    m = dry + 0.8 * wet
    m = signal.sosfilt(signal.butter(2, 35, 'highpass', fs=SR, output='sos'), m, axis=1)
    m = hishelf(m, 3500, 4.0)
    m = dynamics(m)
    i0 = int(L * SR); i1 = int((2 * L + XF) * SR)
    seg = m[:, i0:i1].astype(np.float32)
    np.save(out, seg)
    print('segment', seg.shape, 'seconds', seg.shape[1] / SR, 'loop L', L)
