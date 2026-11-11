# Seif Elemam — personal portfolio (redesign)

Plain HTML, CSS and JavaScript. No build step, no framework, no tracking, no cookies.
Languages: English (default), Deutsch, العربية (the whole page mirrors to right-to-left).

---

## 1. Preview on your computer

```
cd seif-portfolio
python3 -m http.server 8000
```
Open http://localhost:8000. (Open it through this small server, not by double-clicking `index.html`, so fonts and the form behave like on the real site.)

Useful links while testing: `/?intro=1` always shows the entrance (the penalty game), `/?intro=0` skips it. The footer also has a **Play the intro again** link.

## 2. Publish on GitHub Pages
1. Create a repository on github.com (for example `portfolio`) and upload **the contents** of this folder, so that `index.html` is at the top level.
2. Repository → **Settings → Pages** → *Build and deployment*: Source **Deploy from a branch**, Branch **main**, folder **/ (root)** → Save.
3. After a minute the site is at `https://<your-username>.github.io/<repository>/`. All links are relative, so it also works in that sub-folder.
4. Then do the **form activation** (section 7) and go through the **checklist** (section 10).

---

## 3. What changed in this redesign
**Look:** the classic blue-and-white design. Cobalt blue `#1b3df5`, white and pale blue `#eef2ff`, deep ink `#0a1640`. **No yellow anywhere** and no logo triangle next to the name. Big bold condensed headlines (Big Shoulders Display), Public Sans for body text, IBM Plex Mono for the small labels; Arabic uses Cairo and Noto Sans Arabic. Square boxed cards with a hard offset shadow, white label tags on blue, cobalt label tags on light backgrounds. The page is **always light** (it does not switch to dark when your device is in dark mode). All colours are tokens at the top of `css/styles.css` (the old names `--gold`, `--gold-2`, `--gold-3` now hold white / pale blue so nothing breaks).

**Details on click:** nothing long is shown up front. Each section shows its headline and a short lead; a **Details** button opens the rest (About, Marketing, each experience and degree, Culture, the contact form). The open/closed state survives a language switch, closed panels are really hidden from keyboard and screen readers, and the buttons are labelled in EN / DE / AR.

**Removed:** the barcode, the shipping-label theme, the "5 organisations" counter, the Leaflet/OpenStreetMap map (`js/map.js`, `js/locations.js`, `css/leaflet-core.css`), and Netherlands, England, France, Istanbul and Antalya from the map.

**Experience list:** REACH UP, Flink SE, Etisalat and AIESEC. The Talla Dental Center and Chick Restaurant jobs were removed on request, together with the sentences in About that mentioned them.

**Added interactive features**
- **Entrance: a penalty kick.** A cartoon Seif (friendly front-facing face with a short beard, no glasses, a pharaoh's blue-and-white striped headcloth and an Egypt-style red shirt, white shorts and black socks) takes a penalty at a goal with a crossbar, in front of pyramids and a crowd. A ring sweeps over the goal: tap or click the scene, or press Space, to shoot. A cartoon **goalkeeper** (my own drawing: pale-blue and white kit, blue shorts, red gloves) guards the goal. He dives at every shot: about one time in three he reads it and goes the right way, and then he saves it if his gloves can reach it (the top corners are out of his reach, so aiming at them is the skill); otherwise he dives the wrong way. When he saves, he jumps up and celebrates with a big grin; when he is beaten, his face turns sad (worried brows, a tear, eyes down) and he gets up with his shoulders down. **Goal → the site opens. Miss, bar, post or save → try again.** After three failed shots the next shot is helped into the goal (the keeper guesses wrong), so nobody gets stuck. *Skip intro* and Esc are always there; the language chooser (English / Deutsch / العربية) is on the same screen. It is shown once per browser session, never on deep links, and with *reduce motion* the shot simply scores. Result banners are translated (GOAL! / TOR! / جووول!, SAVED! / GEHALTEN! / تصدّى الحارس!).
- **Hero:** only the name, *Marketing & Content Creation*, the *MA European Business Management — TH Wildau* line, the *Discover me* button and your illustration. The intro paragraph was removed on request: its content already lives in About, Experience and Marketing.
- **Community trips wording:** the text says you love to explore, that the trips you have already taken can be repeated with the Egyptian community (you can see them on the map), and that places you have not been to yet are discovered together as you explore more. The old line "this site is personal…" was removed.
- **Music and sound effects** (`js/intro-audio.js`): **at the football entrance** the stadium tune and every effect (whistle, kick, roar, crossbar "ping", "aww", glove-smack) are still made live in the browser with the Web Audio API. **Inside the site** an **original theme recorded from my own score** plays from `assets/audio/music/site-theme.mp3` (about 2.3 MB): an adventure piece with an Egyptian flavour, 40 bars at 105 BPM (about 91 seconds, then it repeats without a gap through a 2.5-second cross-fade). A ney (reed flute) carries the melody over an oud riff, a qanun, darbuka and frame drum, strings and a plucked bass; it starts calm, builds, lifts in a bridge from *maqam Hijaz* on D to a bright B-flat major, returns to the tune with the full band, and thins out into the calm start again. When the goal is scored, the football tune fades out and the site theme fades in, and it **keeps playing** inside the site. If the file cannot be loaded (for example when `index.html` is opened straight from a folder), the older synthesised site tune plays instead. The score and the renderer are in `tools/music/` (`adventure.py` writes the audio, `premix.py` + `finish.py` mix and normalise it to about -18 LUFS, `analyze.py` checks it). I cannot listen to it from here: I measured levels (about -18 LUFS, peak -3 dB, no clipping), pitch accuracy of the instruments, the loop seam (identical to -130 dB) and the section balance, so tell me what you hear (faster, slower, louder, more or less Egyptian) and I will tune it. Browsers only allow sound after a tap, so it starts with the first tap or key press. The round **sound button** (header on wide screens, a small floating button in the corner on phones, `js/site-sound.js`) switches it on and off, and the choice is remembered for the session. After a reload or a link inside the same session it resumes with the first tap, and it pauses while the tab is hidden. (The song from the Tarzan film, or any other existing song, is deliberately not used: lyrics and melodies are protected by copyright. The theme here is written from scratch.)
- **Voice-over and storytelling** (Marketing → Details → Personal projects) and an optional **"Hear my voice" player**: put recordings in `assets/audio/voice/` (names ending `-en`, `-de`, `-ar` are labelled English / Deutsch / العربية), run `python3 tools/sync_images.py`, and the box appears by itself; the background music dips while a recording plays. Nothing is shown until files exist, and the page does not claim any voice work beyond what you said (a wish to do voice-over and dubbing for animation and children's stories, and that you tell stories).
- **Movement between places** (`js/motion.js` + section 23 of `css/styles.css`): from the entrance into the site the header drops in and the hero builds up; the menu, footer and button links to a section sweep a blue curtain with the section's name over the screen while the page jumps underneath; switching the language slides the content back in; a thin progress line follows the scroll; section headings draw an underline and cards slide in from alternating sides on wide screens. Links to **My Journey** use a different movement: a plane flies across the sky along a dotted route (mirrored in Arabic) while the page jumps underneath. All of it is skipped with *reduce motion*.
- **A scene for every section** (`js/scenes.js` + section 26 of `css/styles.css`): when you jump to a section from the menu or a button, the curtain shows its own small animation: **About** an animated ID card (avatar, Egypt flag, lines being written, an "i" badge), **Marketing** a clapperboard and "Action!", **Experience** a briefcase that opens with cards rising out, **Education** a book that opens and turns a page, **Culture** eight people of different backgrounds joining hands in a ring around a turning globe, with Egypt as the red dot (section 32 of `css/styles.css`), **Contact** a ringing phone and a message, **My Journey** the plane. **The welcome:** right after the goal (or Skip), the entrance slides away over a blue curtain with three speech bubbles (Hello / Hallo / مرحبا) and your name, about 2.4 s; then the curtain lifts and the hero arrives (`PTWelcome` in `js/motion.js`, called from `js/entrance.js`). Skipped for people who prefer reduced motion.
- **Section order (menu and page):** About · Experience · Marketing · Education · Culture · Journey (menu label "Journey (Trips)") · Contact. The REACH UP experience item has a **Marketing details** button that jumps down to Marketing and opens its details. To change the order, move the `<section>` blocks in `index.html` and the links in the two nav lists (header and mobile menu).
- **Berliner Pharaohs (Culture):** your own wide cartoon of you as a pharaoh footballer in front of the Brandenburg Gate (`assets/images/culture/football-community/seif-pharaoh.jpg`) is shown at a moderate size (about 540 px wide, so it stays sharp; the file is used exactly as you supplied it, without extra compression), and the round logo is a separate picture beside it (stacked below it on phones), with a gap between them. Both open in the photo viewer. If you have a higher-resolution original of the cartoon, replace the file and it will look crisper. To swap it for another picture, save it in the same folder as `seif-pharaoh.png`, `.webp` or `.jpg` (a `.png` or `.webp` wins over the `.jpg`) and run `python3 tools/sync_images.py`; the frame follows the picture's own proportions.
- **Experience and Education** are collapsed: the section shows its headline and a button (*Show my experience* / *Show my education*); each entry inside still has its own *Details* button.
- **Photo viewer:** photos are never dimmed while they load, thumbnails are larger and keep faces in the crop.
- **Language everywhere:** the choice is remembered, sets `lang` and `dir` on the page, and re-renders every text including the map.
- **My Journey atlas:** an original stylised dot-matrix world map (drawn in SVG, no map service, no API key). Egypt is highlighted as the start. Drag to move, pinch / buttons / Ctrl+scroll to zoom, double-click to zoom, *Reset view* and *Whole world*. Overlapping markers become numbered clusters that zoom apart when selected. **Start the journey** flies from stop to stop, in order, with a caption and opens each place's photos by itself (details below).
- **Photo viewer:** opens from any marker, list entry or culture photo. Swipe or arrow keys (direction-aware in Arabic), thumbnails, captions, title, date and short text in all three languages, focus kept inside, Esc to close.
- **Trip grouping:** the 2019 United States trip (North Carolina, Alabama, Houston) is one trip with three places; the viewer lets you hop between them.
- **Journey order (as you gave it):** Mansoura · North Carolina, Alabama, Houston (2019) · **Cairo (lived there after coming back from the United States, no date; one photo of you in a suit and sunglasses, `cairo-1.jpg`)** · Berlin (since 2021, moved from Cairo) · Brussels (tourist trip, Jan 2023) · Magdeburg (moved, Apr 2023) · Hamburg (2024) · back in Berlin (date not confirmed; shown as a dashed line and a second list entry) · Wildau (TH Wildau, no date; one photo of you in the Egypt shirt, `wildau-1.jpg`) · Tirana · Tunis · Szczecin. The order is the `order` number of each place in `js/manifest.js`; More Wildau photos go in `assets/images/travel/germany/wildau/` (list them in `js/manifest.js`).
- **Culture:** an asymmetrical photo gallery for "Representing Egypt, Connecting Cultures" (flags, group photo, table, two food photos), the **Best Koshary Ever PDF card** (preview of the recipe page with *Open PDF* and *Download PDF* buttons), the AIESEC story with three photos, the Berliner Pharaohs emblem, and **Community trips** (trips for the Egyptian community within and beyond Europe; the same trips are listed as a personal project in the Marketing section).
- **Video in the viewer:** a place can hold short videos next to its photos (Houston has one). Put `name.mp4` plus an optional `name-poster.jpg` in the place's folder.
- **Contact form** with validation, spam protection and real delivery (section 7).

**Honest-data rules built into the site**
- **Lines on the map:** a **dotted white line with small arrows** follows the *order* of all my places and trips (Mansoura → North Carolina → Alabama → Houston → Cairo → Berlin → Brussels → Magdeburg → Hamburg → Wildau → Tirana → Tunis → Szczecin); it draws itself once when the map first comes into view. It is **not an exact travel route**, and the legend says so. A leg that goes back to a country an earlier leg left (USA and back, Germany and back) arcs the other way, so out and back never lie on top of each other, and where a solid line already joins the same two places (Cairo → Berlin) only the solid line is drawn, carrying the arrow. **Solid white lines** are drawn only for moves that are confirmed (Cairo → Berlin; Berlin → Magdeburg; Magdeburg → Berlin as a dashed line because no date is confirmed). The order comes from the `order` number of each place in `js/manifest.js`.
- **Legend (small, right under the map):** every symbol is drawn with the real marker or line style and has its name and a short explanation beside it: the large white marker (Mansoura, where the journey began, and Berlin, where you live now), *lived for a period*, *visited*, the number in a circle (several places close together), the dotted line with arrows, the solid line (a move I am sure of) and the dashed line (a move, date not confirmed). The old "stops list" under the map is gone.
- **Start the journey (guided tour):** a big *Start the journey* button sits on the map (and in the bar above it) and the first marker pulses until the visitor does something. The tour flies to every place in order (13 stops), draws the line that leads there, comes close, **opens that place's photos by itself** (each photo for about 2 to 3 seconds, the Houston clip until it ends), closes the gallery and moves on. It takes about 2 minutes. In the gallery a small bar has *Pause*, *Next place* and *Stop tour*; closing the gallery by hand (cross, Esc, click outside) or touching the map also ends the tour. With reduced-motion settings the camera does not fly and each photo stays longer.
- Residences and visits look different (white rings and white dots vs. light-blue dots).
- Greece, Frankfurt, Darmstadt and Munich were removed on request (map and list). The `also: []` array in `js/manifest.js` still supports small open markers without dates or photos if you ever want some back.
- Bremen, Malaysia, the Netherlands, England, France, Istanbul and Antalya are not on the map.
- Education separates *completed* (Mansoura Bachelor of Commerce, Accounting, English section), *coursework* (Hochschule Magdeburg-Stendal, Sustainable Resources Engineering & Management, Apr 2023 – Sep 2024; TH Wildau bachelor-level coursework) and *in progress* (TH Wildau MA, European Business Management).
- The REACH UP section is a **collaboration**: no job title, dates, results or independent campaign management are claimed.
- The CV buttons appear only if a real PDF exists; with no file they are hidden completely. The contact form never shows a success message unless the form service confirms it.

## 4. How each supplied image is used
| File | Where it is used |
|---|---|
| Your portrait photo → `assets/images/hero/seif-portrait.jpg` | Hero, on a pale-blue arch (white background blended in) |
| Cut-out of the same photo → `assets/images/hero/seif-portrait-cutout.webp` | Entrance screen, in front of the sun disc |
| Berliner Pharaohs emblem → `assets/images/culture/football-community/berliner-pharaohs-emblem.jpg` | Culture & Community → football community |
| The five CV PDFs | Read only for facts. **Not published** and not copied into the site |
| Logos (Magdeburg-Stendal, TH Wildau, Etisalat, AIESEC, Mansoura University, REACH UP) → `assets/images/logos/` | Education badges, experience cards (Etisalat on the telecom job), REACH UP section. White margins were trimmed. |
| Travel photos → `assets/images/travel/<country>/<city>/` | North Carolina 3, Houston 4 + 1 video (silent: the sound was removed at your request), Alabama 1, Tirana 3, Berlin 6, Hamburg 2, Magdeburg 2, Tunis 4, Szczecin 4, Brussels 1 |
| Wildau International Afternoon → `assets/images/culture/wildau-international-afternoon/` | Culture gallery: flags, group, table, two food photos (the Koshary recipe page is no longer in the gallery) |
| Cookbook → `assets/images/culture/cookbook/` | `best-koshary-ever-preview.jpg` (the preview shown on the card) and `best-koshary-ever.pdf` (what *Open PDF* / *Download PDF* use). **Both are my rebuild** of your card: typos fixed, icons labelled correctly (Main dish, 60 min, 4–6 servings, Vegetarian), Marketing-focused About text. The source image was about 1264 px wide, so the PDF is fine on screen but not print quality. The preview JPEG is rendered from that PDF at 2528 px, so its text stays sharp. If you have the official or higher-resolution PDF, replace the file with the **same name**. If the PDF is missing the card hides itself. |
| AIESEC photos → `assets/images/culture/aiesec/` | The AIESEC story: chalkboard wall, laughing-emoji cushion, and the football-pitch photo ("cultural exchange") |
| Aspire photo → `assets/images/travel/egypt/mansoura/mansoura-1.jpg` | Mansoura place on the map ("With Aspire, Mansoura") |
| Flink logo → `assets/images/logos/flink.png` | Flink SE experience entry (the logo is pink; it is the brand's colour) |

**Not received yet / left out on purpose:** REACH UP work samples (the Samples box stays hidden until you add files to `assets/images/marketing/reach-up/`), and the CV (its buttons are hidden). Other missing slots show a clean placeholder; full list: `assets/images/MISSING_FILES.txt`. Two photos came as HEIC files that could not be opened in the build environment, so their preview versions were used; export them as JPG if you want the full quality.

**Entrance character:** the cartoon is drawn in code (`js/intro-game.js`, as SVG: skin, beard, headcloth and the Egypt kit are at the top of that file and easy to change). The goalkeeper's look is the `KC` colours block and his chance of saving is `K.saveChance` (0.35) in the same file. No photo is used on the character any more.

---

## 5. Folders and adding pictures
```
index.html            the page            legal.html   Impressum + Datenschutz
css/styles.css        look and layout     css/atlas.css  map, lists, photo viewer
js/config.js          ALL settings (email, LinkedIn, CV path, form service, entrance)
js/content.js         texts in en / de / ar (experience, education, skills, legal text)
js/ui-en.js ui-de.js ui-ar.js   interface texts
js/manifest.js        every picture slot + every place on the map (captions, dates, order)
js/images-present.js  written by the sync tool: which pictures really exist
js/world.js           the world outline used by the map
js/main.js viewer.js atlas.js form.js legal.js   behaviour
js/entrance.js        the welcome screen (language, skip, curtain)
js/intro-game.js      the penalty-kick game  ·  js/intro-audio.js   music + sound effects (the site theme is assets/audio/music/site-theme.mp3)
js/site-sound.js      the music button inside the site  ·  js/motion.js   curtain, language slide, progress line
tools/sync_images.py  picture sync + missing-file report  ·  tools/music/  the score and renderer of the site theme
assets/images/        logos/ hero/ marketing/ culture/ (incl. cookbook/ with the PDF) education/ travel/<country>/<city>/
assets/cv/            put Seif_Elemam_CV.pdf here
```
**To add or replace pictures**
1. Drop the file into the matching folder (every folder has a `README.txt` with the expected names). Photos in a place's folder are picked up automatically, even without a caption.
2. Run `python3 tools/sync_images.py`. Keep photos at **original quality**: do not shrink or re-save them (`--compress` exists only for huge files, over ~2.5 MB or 3000 px). It rewrites `js/images-present.js` and prints and saves the list of expected-but-missing files. No Python? Edit `js/images-present.js` by hand: add the file name to its folder list.
3. Captions, dates and texts live in `js/manifest.js` (every caption has `en`, `de`, `ar`). Add a `{ file: 'x.jpg', caption: L('…', '…', '…') }` line to give a photo a proper caption.

The site only requests files listed in `images-present.js`, so a missing picture never causes a broken image or a 404 in the console.

---

## 6. LinkedIn
The only LinkedIn address on the site is `https://www.linkedin.com/in/seif-elemam/`. It is set once in `js/config.js` (`linkedin`) and used by the contact section, the footer, the structured data in `index.html` (`sameAs`) and every dynamic link. It opens in a new tab with `rel="noopener noreferrer"`. The earlier, longer LinkedIn address that ended in a number appears nowhere.

## 7. Contact form (real delivery)
The site is static, so the form posts to a form service. Default: **FormSubmit** (no account; delivers to `seifelemam9@gmail.com`, taken from `js/config.js`). Alternative: **Formspree**.

**What the form does:** full name, email, optional subject, message, consent checkbox (with a link to the Datenschutz); validation with clear messages; a hidden honeypot field; a minimum time before sending; one message per visitor every 30 seconds; labels, placeholders, errors and status in EN / DE / AR with RTL. The **success message appears only when the service answers that it accepted the message**. Otherwise you see an honest message: *waiting for activation*, *not connected*, *could not be sent*, or *no connection*.

### Option A: FormSubmit (default). One-time activation
1. Publish the site (section 2).
2. Open the live site and send **one** test message through the form.
3. FormSubmit emails an **activation link** to `seifelemam9@gmail.com` (check the spam folder). Click it. Until then the site shows "waiting for a one-time activation".
4. Send a second test message. It should arrive in the inbox. (Whether the very first message is delivered after activation is decided by FormSubmit, so do not rely on it.)
5. Optional: after activation FormSubmit can give you a random form address. If you prefer not to show your email in the endpoint, paste it into `form.endpoint` in `js/config.js` (`https://formsubmit.co/ajax/<random-id>`).
FormSubmit has no key to invent or copy: the endpoint is built from your email address.

### Option B: Formspree
1. Create a free account at formspree.io → **New form**, set the notification email to `seifelemam9@gmail.com`.
2. Copy the form URL (`https://formspree.io/f/xxxxxxxx`).
3. In `js/config.js` set:
```js
form: { provider: 'formspree', endpoint: 'https://formspree.io/f/xxxxxxxx', providerName: 'Formspree', minSeconds: 3, cooldownSeconds: 30 }
```
4. In Formspree you can also restrict the allowed domain to your GitHub Pages address.

**Privacy:** the consent text names the provider and `legal.html#datenschutz` explains the transfer (USA, consent under Art. 6(1)(a) GDPR). The text is a starting point, not legal advice: fill in the highlighted `[brackets]` and have it checked.

**Status of testing:** the validation, error handling and every response case (accepted, activation needed, rejected, no connection) were tested in a browser against *intercepted* responses. **No real message was sent to FormSubmit or Formspree**, so real delivery is still unconfirmed until you activate the form and send a test.

## 8. Download CV (hidden for now)
No CV is shown at the moment, by your choice: the "Download CV" button in the hero and the CV box in Contact are hidden completely (no "coming soon"). To bring them back later: put a CV at `assets/cv/Seif_Elemam_CV.pdf` (**without date of birth, phone number or home address**, because the file is public; the path is `cvFile` in `js/config.js`) and run `python3 tools/sync_images.py`. Both buttons then appear by themselves.

## 9. Editing text
- Interface text: `js/ui-en.js`, `ui-de.js`, `ui-ar.js` (same keys in all three).
- Experience, education, skills, legal pages: `js/content.js`. (The About language list was removed on request; the EN/DE/AR switcher stays.)
- Places, dates, captions, photo slots: `js/manifest.js`.

---

## 10. Checklist: things only you can confirm or supply
- [ ] **CV PDF** (sanitised) → `assets/cv/Seif_Elemam_CV.pdf`, then run the sync tool.
- [ ] **REACH UP samples:** optional. Drop photos or short videos into `assets/images/marketing/reach-up/` and run the sync tool; the Samples box then appears by itself. The CV is optional and hidden until you add a PDF (section 8).
- [ ] **Listen to the new site music** and tell me what to change (tempo, instruments, volume, mood). I could only check it technically (levels, no clipping, loop seam, pitch), not hear it.
- [x] **Community trips (decided):** the site says that you organise trips for the Egyptian community, that tourism is part of your marketing interest (you want to work in tourism and market it), and that trip details are **not** shown here: anyone who asks is answered by you personally, through the contact form ("Ask about a trip" jumps to it). No destinations, dates or photos are listed on purpose.
- [ ] **Best Koshary Ever PDF:** replace with a higher-resolution/official version if you have one (same file name).
- [ ] **Activate the contact form** and send a real test (section 7).
- [ ] **Impressum / Datenschutz:** postal address, GitHub hosting information, FormSubmit privacy link. Every gap is highlighted on `legal.html`.
- [ ] **Fonts (Big Shoulders Display, Public Sans, IBM Plex Mono, Cairo, Noto Sans Arabic):** they load from Google Fonts (mentioned in the Datenschutz). For full privacy, self-host them and remove that paragraph.
- [ ] **REACH UP:** exact role/dates, if you want them shown. Nothing is invented today.
- [ ] **Return to Berlin from Magdeburg:** date of the move (the dashed line is intentionally undated).
- [ ] **Szczecin** (October 2026) and the other trip dates in `js/manifest.js`: confirm. Also the **Wildau** entry has no date yet, and the date of the return to Berlin is open.

## 11. Quality checks run on this build
No console errors or failed requests (other than fonts, which the test sandbox cannot reach), no horizontal overflow, and correct `lang`/`dir`, in EN, DE and AR at 1280 px and 390 px. Entrance game (goal, bar, post, miss, the helped third goal, tap/Space/button, skip, Esc, sound button, music starting only after a tap and continuing, softer, inside the site with the header/floating button muting and resuming it, once per session, reduced motion; English, German and Arabic at several phone, tablet and desktop sizes), map (drag, pinch, zoom, clusters, journey playback, marker and list opening, keyboard), photo viewer (swipe/arrows in both directions, focus trap, siblings), form (all validation and response cases with intercepted responses) and the legal page were exercised in a headless browser. Fonts could not be loaded in that environment (a plain fallback font was used), so the real headline type, which is much narrower than the fallback, should be checked once on the live site. A scan of all text, backgrounds, borders, shadows and SVG fills/strokes found no yellow. A real form submission and a real iPhone/Android test are still open.

**Known limits of the preview:** inside the claude.ai preview the PDF *Download* button cannot save a file (the viewer blocks downloads); it works on GitHub Pages or any normal host. The music could not be listened to in the build environment, only measured.

## Changes in v37 and v38
- **Hero (v40):** one button, *Discover me*. It opens the list of all sections (About, Experience, Marketing, Education, Culture, Journey, Contact) and the visitor picks one; Esc or choosing a section closes it. The small "Scroll" hint at the bottom left is gone. *Explore my journey* lives in the community-trips block (Culture), next to *Ask about trips*.
- **About:** only the headline "From Mansoura to Berlin, with marketing in focus." and a *Details* button are visible. Everything else is inside *Details*: first "Today I am in the Master's programme…", then "I started out in Egypt…", the move to Berlin, the voice-over sentence (rephrased more formally), the three verbs and *Outside work*.
- **Outside work:** football, padel, riding horse, acting, travel and cultural exchange (voice-over and dubbing are covered in About and Marketing).
- **Marketing:** *Details* and *Projects & skills* are two buttons side by side in the REACH UP card; each opens its own panel.
- **Photo under the videos (v41):** inside Marketing *Details*, directly under "Videos I appeared in", there is one plain photo with no caption and no title (`assets/images/marketing/on-set/on-set-1.jpg`, listed under `marketing.moments` in `js/manifest.js`). To add another, drop it in that folder, add its file name to `moments.files`, and run `python3 tools/sync_images.py`.
- **Magdeburg (v43):** 8 new photos (river and bridge, the cathedral, blue letters in a park, a lake, a high ropes course) after the original two, so the gallery has 10. Captions are short and describe only what is visible ("By the river", "At a high ropes course", ...); edit or empty them in `js/manifest.js` (place `magdeburg`). In the guided tour, places with many photos show each one for a shorter time, so Magdeburg adds about 20 seconds.
- **Hamburg (v44):** a third photo (`hamburg-3-harbour-view.jpg`, overlooking the harbour). The face of a child in the background was blurred out before publishing.
- **Football community (v44):** two plain photos (`football-1.jpg` winter, `football-2.jpg` summer) under the logo and the cartoon, inside that block's Details panel. They are listed under `culture.football.photos` in `js/manifest.js` (with `ratio` = width / height so they sit side by side at the same height); to add more, drop the file in `assets/images/culture/football-community/`, list it there, and run `python3 tools/sync_images.py`.
- **Details stay closed (v44):** every Details panel is closed when the site opens. The *Marketing details* button next to REACH UP in Experience now only scrolls down to Marketing; it no longer opens the panel (the visitor presses *Details*).
- **Best Koshary Ever (v44):** the sentence about the International Office sits directly under the title (one column), and the recipe card comes below it.
- **International Afternoon (v45):** two more photos of the Egypt table (`table-2-egypt-table.jpg`, `table-3-flags-and-shirt.jpg`), so the gallery has 8. Both are listed in `culture.intl.slots` in `js/manifest.js` with a short caption and alt text.
- **Wildau (v41):** a second photo in the Wildau gallery (`wildau-2-poster.jpg`, presenting the Adidas poster). The student number printed on the poster was blurred out before publishing.
- **Education:** the heading is just "Education"; the explanatory sentence under it is gone (the legend with the three status markers stays).
- **Culture:** the AIESEC description sits directly under the title (not in a second column). Football community: "friendly matches", the Moroccan phrase removed. *Best Koshary Ever*: one short description (the International Office liked the recipe, asked for it, and will present it at the event); the "Upcoming" box is gone.
- **Trips for the Egyptian community:** written in the future tense ("I am going to start organising trips…", the community has already been organising trips, I have other ideas it can draw on); same in Marketing (*Community trips*). The button says *Ask about trips*; the closing sentence is "If you have another idea, just let me know."
- **Journey:** the sentence under "From Egypt to the world." and the duplicate *Start the journey* button above the map are removed; *Play my journey* stays on the map: big at first, then it shrinks into the bottom corner of the map as soon as the visitor drags, zooms or opens a marker, and it is hidden only while the tour plays (the tour bar takes over). The numbers inside the grouped-place circles are gone (the legend calls them "Group of places").
- **Footer:** LinkedIn and Email links removed (they are in Contact); *Back to top* is now *Home*; *Play the intro again* stays.
- **Scenes:** About = animated ID card, Contact = ringing phone, **Home** (footer link and the name in the header) = a little house with the label "Home" (not your name). **Welcome:** right after the goal (or Skip) a blue curtain with three speech bubbles (Hello / Hallo / مرحبا) plays for about 2.4 seconds before the hero arrives (`PTWelcome` in `js/motion.js`, called from `js/entrance.js`).
- **REACH UP videos:** the three Instagram reels are linked in the REACH UP *Details* ("Videos I appeared in", clean links without tracking parameters). To show them as videos with English subtitles on the site: save each reel as `assets/images/marketing/reach-up/reel-1.mp4`, `reel-2.mp4`, `reel-3.mp4` (same order as the links in `js/content.js`, `reels`), add subtitles as `reel-1.en.vtt` (optionally `reel-1.de.vtt`, `reel-1.ar.vtt`), then run `python3 tools/sync_images.py`. The English track is on by default; the "Watch on Instagram" link stays under each video. Until a file exists, that reel simply shows its *Watch video* button. Keep each file small (about 10 MB or less; `ffmpeg -i in.mp4 -vf scale=-2:720 -crf 28 -preset veryfast out.mp4`).
