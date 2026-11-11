#!/usr/bin/env python3
"""
Scans assets/images/, writes js/images-present.js (the list of pictures that really exist) and prints a
report of every picture the site expects but cannot find yet.

Usage (from the project folder):
    python3 tools/sync_images.py            # scan + report
    python3 tools/sync_images.py --compress # only for huge files (over ~2.5 MB / 3000 px); needs: pip install pillow

Picture quality: put the ORIGINAL photo in the folder (same file name) and do not use --compress unless a file is
huge. The site never shrinks or re-encodes pictures by itself.

Why: the site only requests files listed in js/images-present.js, so a missing picture never produces
a broken image or a 404. After adding or replacing pictures, run this once.
"""
import json, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
IMG = os.path.join(ROOT, 'assets', 'images')
OUT = os.path.join(ROOT, 'js', 'images-present.js')
MANIFEST = os.path.join(ROOT, 'js', 'manifest.js')
VOICE = os.path.join(ROOT, 'assets', 'audio', 'voice')      # voice recordings (optional)
AUDIO_EXT = ('.mp3', '.m4a', '.wav', '.ogg')
EXT = ('.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg', '.mp4', '.webm', '.pdf', '.vtt')
SKIP_DIRS = {'_placeholders'}
MAX_EDGE, QUALITY = 3000, 92   # keep photos sharp: only very large files are touched, and at high quality


def scan():
    found = {}
    for dirpath, dirs, files in os.walk(IMG):
        dirs[:] = sorted(d for d in dirs if d not in SKIP_DIRS)
        rel = os.path.relpath(dirpath, IMG).replace(os.sep, '/')
        names = sorted(f for f in files if f.lower().endswith(EXT))
        if rel != '.' and names:
            found[rel] = names
    return found


def scan_audio():
    if not os.path.isdir(VOICE):
        return []
    return sorted(f for f in os.listdir(VOICE) if f.lower().endswith(AUDIO_EXT))


def compress(found):
    try:
        from PIL import Image, ImageOps
    except ImportError:
        print('Pillow is not installed (pip install pillow); skipping --compress.')
        return
    saved = 0
    for folder, names in found.items():
        for n in names:
            if not n.lower().endswith(('.jpg', '.jpeg')):
                continue
            p = os.path.join(IMG, folder, n)
            before = os.path.getsize(p)
            im = ImageOps.exif_transpose(Image.open(p))
            if max(im.size) <= MAX_EDGE and before < 2_500_000:
                continue
            im.thumbnail((MAX_EDGE, MAX_EDGE))
            im.convert('RGB').save(p, 'JPEG', quality=QUALITY, optimize=True, progressive=True)
            saved += before - os.path.getsize(p)
            print(f'  shrunk {folder}/{n}')
    print(f'Saved {saved/1e6:.1f} MB.' if saved else 'Nothing needed shrinking.')


# Folders whose pictures are a bonus, not a gap: nothing is shown and nothing is reported while they are empty.
OPTIONAL = {'marketing/reach-up'}      # REACH UP work samples (a box appears by itself once a file is added)


def expected():
    """Every picture mentioned in manifest.js: logos ('logos/x.png'), hero files and gallery slots
    (folder: '...' followed by file: '...' entries)."""
    src = open(MANIFEST, encoding='utf-8').read()
    exp = {}
    ext = r'(?:jpe?g|png|webp|avif|svg|mp4|webm)'
    # full paths such as 'logos/reach-up.png' or 'hero/seif-portrait.jpg'
    for m in re.finditer(r"'([A-Za-z0-9_\-]+/[A-Za-z0-9_\-.]+\." + ext + r")'", src):
        folder, name = m.group(1).rsplit('/', 1)
        exp.setdefault(folder, set()).add(name)
    # folder: 'x/y' ... file: 'z.jpg'   (the file belongs to the nearest folder above it)
    cur = None
    for m in re.finditer(r"folder:\s*'([^']+)'|file:\s*'([^']+\." + ext + r")'", src):
        if m.group(1):
            cur = m.group(1); exp.setdefault(cur, set())
        elif cur and '/' not in m.group(2):
            exp[cur].add(m.group(2))
    for opt in OPTIONAL:                       # optional extras: never reported as missing
        exp.pop(opt, None)
    return exp


def main():
    if not os.path.isdir(IMG):
        sys.exit('assets/images not found. Run this from the project folder.')
    found = scan()
    if '--compress' in sys.argv:
        compress(found)
        found = scan()
    body = json.dumps(found, indent=2, ensure_ascii=False)
    cfg = open(os.path.join(ROOT, 'js', 'config.js'), encoding='utf-8').read()
    cv = re.search(r"cvFile:\s*'([^']+)'", cfg)
    cv_ready = bool(cv) and os.path.isfile(os.path.join(ROOT, cv.group(1)))
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('/* Written by tools/sync_images.py: the pictures (and the CV PDF) that really exist. */\n')
        f.write('window.IMAGES = ' + body + ';\n')
        f.write('window.AUDIO = ' + json.dumps(scan_audio()) + ';   /* voice recordings in assets/audio/voice/ */\n')
        f.write('window.CV_READY = ' + ('true' if cv_ready else 'false') + ';  /* true only if ' + (cv.group(1) if cv else 'the CV file') + ' exists */\n')
    total = sum(len(v) for v in found.values())
    print(f'{total} picture(s) in {len(found)} folder(s) -> js/images-present.js')
    print('Voice recordings:', ', '.join(scan_audio()) or 'none yet (the "Hear my voice" box stays hidden)')
    print('CV PDF:', 'found, the Download CV buttons are shown' if cv_ready else 'not found, the CV buttons stay hidden')

    exp = expected()
    missing = []
    for folder, names in sorted(exp.items()):
        have = set(found.get(folder, []))
        for n in sorted(names - have):
            missing.append(f'{folder}/{n}')
    empty = sorted(f for f in exp if not found.get(f) and not exp[f])
    print('\nMissing files the site is ready to show (the page simply leaves them out until they exist):')
    if missing:
        for m in missing:
            print('   -', m)
    else:
        print('   none')
    report = os.path.join(IMG, 'MISSING_FILES.txt')
    with open(report, 'w', encoding='utf-8') as f:
        f.write('Pictures the site expects but cannot find yet (written by tools/sync_images.py).\n')
        f.write('Put each file at exactly this path inside assets/images/, then run: python3 tools/sync_images.py\n\n')
        f.write('\n'.join(missing) if missing else 'None: every expected picture exists.')
        f.write('\n')
    if empty:
        print('\nFolders waiting for photos (any .jpg/.png/.webp you drop in is picked up automatically):')
        for f in empty:
            print('   -', f)


if __name__ == '__main__':
    main()
