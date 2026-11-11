/* ==========================================================================
   MANIFEST — every photo, logo and travel destination of the site, in one place.

   HOW IT WORKS
   • Image files live in  assets/images/<folder>/  (see README.md for the tree).
   • A photo is only shown if the file really exists: js/images-present.js lists the
     existing files (run  python3 tools/sync_images.py  after adding pictures).
   • Files you add to a folder that are NOT mentioned below still appear in that
     destination's gallery, with the destination's default caption.
   • Every caption is { en, de, ar }.

   TO ADD / CHANGE A PHOTO       put the file in its folder, run the sync tool, (optionally) add a caption here.
   TO CHANGE A DATE OR TEXT      edit the destination below.
   TO ADD A DESTINATION          copy an entry in TRAVEL, change id, folder, lat, lng, names and text.

   Dates:  when: '2019' | '2023-01'   (YYYY or YYYY-MM)   ·   until: 'now' for "still lives here"
   Roles:  origin = where it started · home = current home · residence = lived for a period
           visit  = visited · also = visited, details/photos not added yet (no date shown)
   ========================================================================== */
(function () {
  var L = function (en, de, ar) { return { en: en, de: de, ar: ar }; };

  var C = {
    eg: L('Egypt', 'Ägypten', 'مصر'),
    us: L('United States', 'USA', 'الولايات المتحدة'),
    de: L('Germany', 'Deutschland', 'ألمانيا'),
    be: L('Belgium', 'Belgien', 'بلجيكا'),
    al: L('Albania', 'Albanien', 'ألبانيا'),
    tn: L('Tunisia', 'Tunesien', 'تونس'),
    pl: L('Poland', 'Polen', 'بولندا'),
  };

  window.MANIFEST = {
    base: 'assets/images/',

    /* ------------------------------ Logos ------------------------------
       If a logo file is missing, the site shows the name as a simple wordmark. */
    logos: {
      reachup:   { file: 'logos/reach-up.png',            name: 'REACH UP', mono: 'RU' },
      aiesec:    { file: 'logos/aiesec.png',              name: 'AIESEC', mono: 'AI' },
      mansoura:  { file: 'logos/mansoura-university.png', name: 'Mansoura University', mono: 'MU' },
      magdeburg: { file: 'logos/magdeburg-university.png', name: 'Hochschule Magdeburg-Stendal', mono: 'HMS' },
      wildau:    { file: 'logos/th-wildau.png',           name: 'TH Wildau', mono: 'TH W' },
      flink:     { file: 'logos/flink.png',               name: 'Flink', mono: 'FL' },
      etisalat:  { file: 'logos/etisalat.png',            name: 'Etisalat', mono: 'ET' }
    },

    /* ------------------------------ Hero ------------------------------ */
    hero: {
      portrait: 'hero/seif-illustration.jpg',         /* your illustrated portrait (hero). The real photo seif-portrait.jpg is kept in the folder */
      cutout:   'hero/seif-portrait-cutout.webp',    /* same photo, white background removed (not used at the moment) */
      alt: L('Portrait of Seif Elemam: a smiling man with glasses and a beard, wearing a dark suit and a blue tie.',
             'Porträt von Seif Elemam: ein lächelnder Mann mit Brille und Bart in dunklem Anzug und blauer Krawatte.',
             'صورة شخصية لـ Seif Elemam: رجل مبتسم يرتدي نظارة ولحية وبدلة داكنة وربطة عنق زرقاء.')
    },

    /* ------------------------ Marketing: REACH UP samples ------------------------
       Images (.jpg/.png/.webp) or short videos (.mp4). Add as many as you like. */
    marketing: {
      folder: 'marketing/reach-up',
      slots: [
        { file: 'reach-up-sample-1.jpg', caption: L('REACH UP: content sample 1', 'REACH UP: Content-Beispiel 1', 'REACH UP: نموذج محتوى 1') },
        { file: 'reach-up-sample-2.jpg', caption: L('REACH UP: content sample 2', 'REACH UP: Content-Beispiel 2', 'REACH UP: نموذج محتوى 2') }
      ],
      /* Plain photos shown under the videos, with no caption and no title. Drop a file in the folder, list it here,
         then run  python3 tools/sync_images.py */
      moments: { folder: 'marketing/on-set', files: ['on-set-1.jpg'] }
    },

    /* ------------------------ Culture & community galleries ------------------------
       `slot` is the position in the asymmetrical layout (a–g). */
    culture: {
      intl: {
        folder: 'culture/wildau-international-afternoon',
        slots: [
          { slot: 'a', file: 'flag-1.jpg',  caption: L('Holding the Egyptian flag', 'Mit der ägyptischen Flagge', 'أحمل العلم المصري') },
          { slot: 'b', file: 'group-1.jpg', caption: L('With international students', 'Mit internationalen Studierenden', 'مع طلاب دوليين') },
          { slot: 'c', file: 'table-1.jpg', caption: L('The Egyptian table at International Afternoon', 'Der ägyptische Tisch beim International Afternoon', 'الطاولة المصرية في International Afternoon') },
          { slot: 'e', file: 'food-1.jpg',  caption: L('Koshary, Egypt’s national dish', 'Koshary, Ägyptens Nationalgericht', 'الكشري، الأكلة الشعبية المصرية') },
          { slot: 'f', file: 'food-2.jpg',  caption: L('A koshary meal', 'Eine Portion Koshary', 'وجبة كشري') },
          { slot: 'g', file: 'flag-2.jpg',  caption: L('Representing Egypt at International Afternoon', 'Ägypten beim International Afternoon vertreten', 'تمثيل مصر في International Afternoon') },
          { slot: 'h', file: 'table-2-egypt-table.jpg',
            caption: L('The Egypt table, with food, tea and papyrus prints', 'Der Ägypten-Tisch mit Essen, Tee und Papyrus-Drucken', 'طاولة مصر بالأكل والشاي ولوحات البردي'),
            alt: L('A table covered with a large Egyptian flag, an EGYPT sign, papyrus prints, a box of tea, a pot and containers of food.',
                   'Ein Tisch mit großer ägyptischer Flagge, einem EGYPT-Schild, Papyrus-Drucken, einer Packung Tee, einem Topf und Behältern mit Essen.',
                   'طاولة مغطاة بعلم مصري كبير وعليها لافتة EGYPT ولوحات بردي وعلبة شاي وقدر وأوعية طعام.') },
          { slot: 'i', file: 'table-3-flags-and-shirt.jpg',
            caption: L('Flags, scarves and a football shirt from other countries on the table', 'Flaggen, Schals und ein Fußballtrikot aus anderen Ländern auf dem Tisch', 'أعلام وأوشحة وقميص كرة قدم من دول أخرى على الطاولة'),
            alt: L('Close-up of a table with the Egyptian flag, a yellow EGYPT sign, small flags, a scarf reading SYRIA and a red and yellow football shirt.',
                   'Nahaufnahme eines Tisches mit ägyptischer Flagge, gelbem EGYPT-Schild, kleinen Flaggen, einem Schal mit der Aufschrift SYRIA und einem rot-gelben Fußballtrikot.',
                   'لقطة قريبة لطاولة عليها العلم المصري ولافتة EGYPT صفراء وأعلام صغيرة ووشاح مكتوب عليه SYRIA وقميص كرة قدم أحمر وأصفر.') }
        ]
      },
      /* The recipe page is NOT in the photo mosaic: it is a PDF card (open + download) under the cookbook text. */
      cookbook: {
        folder: 'culture/cookbook',
        preview: 'best-koshary-ever-preview.jpg',
        pdf: 'best-koshary-ever.pdf',
        download: 'Best-Koshary-Ever.pdf'
      },
      aiesec: {
        folder: 'culture/aiesec',
        slots: [
          { slot: 'a', file: 'aiesec-1.jpg', caption: L('At the AIESEC chalkboard wall', 'Vor der AIESEC-Tafelwand', 'أمام لوحة AIESEC') },
          { slot: 'b', file: 'aiesec-2.jpg', caption: L('With a laughing-emoji cushion', 'Mit einem Lach-Emoji-Kissen', 'مع وسادة إيموجي ضاحك') },
          { slot: 'c', file: 'aiesec-3.jpg', caption: L('Cultural exchange on the football pitch', 'Kultureller Austausch auf dem Fußballplatz', 'تبادل ثقافي في ملعب كرة القدم') }
        ]
      },
      football: {
        folder: 'culture/football-community',
        /* Plain community photos shown under the logo and the cartoon (inside the Details panel).
           `ratio` = width / height of the picture, so the two sit side by side at the same height. */
        photos: [
          { file: 'football-1.jpg', ratio: 4 / 3,
            caption: L('Winter football with the community', 'Fußball im Winter mit der Community', 'كرة قدم في الشتاء مع المجتمع'),
            alt: L('Ten men posing together on a football pitch on a sunny winter day, one kneeling with his arms spread wide and one giving a thumbs up.',
                   'Zehn Männer posieren an einem sonnigen Wintertag gemeinsam auf einem Fußballplatz, einer kniet mit weit ausgebreiteten Armen, einer zeigt den Daumen nach oben.',
                   'عشرة رجال يتصورون معًا على ملعب كرة قدم في يوم شتوي مشمس، أحدهم راكع وباسط ذراعيه وآخر يرفع إبهامه.') },
          { file: 'football-2.jpg', ratio: 3 / 4,
            caption: L('Summer football with the community', 'Fußball im Sommer mit der Community', 'كرة قدم في الصيف مع المجتمع'),
            alt: L('Six men in red football kits with their arms around each other on a green pitch under a cloudy summer sky.',
                   'Sechs Männer in roten Fußballtrikots stehen Arm in Arm auf einem grünen Platz unter bewölktem Sommerhimmel.',
                   'ستة رجال بقمصان كرة قدم حمراء يقفون متعانقين على ملعب أخضر تحت سماء صيفية غائمة.') }
        ],
        slots: [
          { slot: 'a', file: 'berliner-pharaohs-emblem.jpg',
            caption: L('The Berliner Pharaohs logo, designed by me', 'Das Berliner-Pharaohs-Logo, von mir gestaltet', 'شعار Berliner Pharaohs من تصميمي'),
            alt: L('Round embroidered-style logo reading Berliner Pharaohs, est. 2026, with a gold pharaoh mask beside a gold eagle on a red, black and white field.',
                   'Rundes Logo im Stickpatch-Stil mit der Aufschrift Berliner Pharaohs, est. 2026, mit goldener Pharaonenmaske neben einem goldenen Adler auf rotem, schwarzem und weißem Grund.',
                   'شعار دائري بأسلوب الشارة المطرزة مكتوب عليه Berliner Pharaohs، تأسس 2026، يضم قناع فرعون ذهبيًا بجانب نسر ذهبي على خلفية حمراء وسوداء وبيضاء.') },
          { slot: 'b', file: 'seif-pharaoh.jpg',
            caption: L('Me as a pharaoh footballer in Berlin: my own cartoon portrait', 'Ich als Fußball-Pharao in Berlin: mein eigenes Cartoon-Porträt', 'أنا كفرعون لاعب كرة في برلين: بورتريه كرتوني لي'),
            alt: L('Cartoon of Seif with a beard, wearing a striped pharaoh headcloth and a dark-red Egypt-style shirt with the number 22, white shorts and black socks, with one foot on a football in front of the Brandenburg Gate, on a green background of Egyptian and Berlin line drawings.',
                   'Cartoon von Seif mit Bart, gestreiftem Pharaonen-Kopftuch, dunkelrotem Ägypten-Trikot mit der Nummer 22, weißer Hose und schwarzen Stutzen, einen Fuß auf einem Fußball vor dem Brandenburger Tor, vor grünem Hintergrund mit ägyptischen und Berliner Strichzeichnungen.',
                   'رسم كرتوني لـ Seif بلحية، يرتدي غطاء رأس فرعونيًا مخططًا وقميصًا أحمر داكنًا بطابع منتخب مصر برقم 22 وشورتًا أبيض وجوارب سوداء، وقدمه على كرة أمام بوابة براندنبورغ، على خلفية خضراء برسومات خطية مصرية وبرلينية.') }
        ]
      }
    },

    /* ------------------------------ Travel ------------------------------ */
    travel: [
      /* ---- Starting point ---- */
      { id: 'mansoura', role: 'origin', order: 0, lat: 31.04, lng: 31.38,
        folder: 'travel/egypt/mansoura',
        city: L('Mansoura', 'Mansoura', 'المنصورة'), country: C.eg,
        text: L('Where my journey starts. I earned my Bachelor of Commerce in Accounting at Mansoura University.',
                'Hier beginnt mein Weg. An der Mansoura University habe ich meinen Bachelor of Commerce in Accounting erworben.',
                'من هنا بدأت رحلتي. حصلت على بكالوريوس التجارة في المحاسبة من جامعة المنصورة.'),
        photos: [{ file: 'mansoura-1.jpg', caption: L('With Aspire, Mansoura', 'Mit Aspire, Mansoura', 'مع Aspire، المنصورة'),
                   alt: L('Four men standing in front of Aspire and University Center for Career Development banners; one of them holds a certificate.', 'Vier Männer vor Aufstellern von Aspire und dem University Center for Career Development; einer hält eine Urkunde.', 'أربعة رجال أمام لافتات Aspire ومركز تطوير المسار المهني الجامعي؛ أحدهم يحمل شهادة.') }] },

      /* ---- USA 2019 (one trip, three places) ---- */
      { id: 'north-carolina', role: 'visit', trip: 'usa-2019', order: 1, when: '2019', lat: 35.6, lng: -79.4,
        folder: 'travel/usa/north-carolina',
        city: L('North Carolina', 'North Carolina', 'نورث كارولاينا'), country: C.us,
        text: L('Part of my first confirmed trip to the United States, in 2019.',
                'Teil meiner ersten bestätigten Reise in die USA im Jahr 2019.',
                'جزء من أول رحلة مؤكدة لي إلى الولايات المتحدة عام 2019.'),
        photos: [
          { file: 'north-carolina-1.jpg', caption: L('North Carolina, 2019', 'North Carolina, 2019', 'نورث كارولاينا، 2019') },
          { file: 'north-carolina-2.jpg', caption: L('On the lakeside walkway, North Carolina, 2019', 'Auf dem Seesteg, North Carolina, 2019', 'على ممشى البحيرة، نورث كارولاينا، 2019') },
          { file: 'north-carolina-3.jpg', caption: L('James B. Hunt Jr. Library, North Carolina, 2019', 'James B. Hunt Jr. Library, North Carolina, 2019', 'مكتبة جيمس هانت الابن، نورث كارولاينا، 2019') }
        ] },
      { id: 'alabama', role: 'visit', trip: 'usa-2019', order: 1, when: '2019', lat: 32.8, lng: -86.8,
        folder: 'travel/usa/alabama',
        city: L('Alabama', 'Alabama', 'ألاباما'), country: C.us,
        text: L('A stop on the same trip to the United States in 2019.',
                'Eine Station derselben USA-Reise im Jahr 2019.',
                'محطة في الرحلة نفسها إلى الولايات المتحدة عام 2019.'),
        photos: [{ file: 'alabama-1.jpg', caption: L('Alabama, 2019', 'Alabama, 2019', 'ألاباما، 2019') }] },
      { id: 'houston', role: 'visit', trip: 'usa-2019', order: 1, when: '2019', lat: 29.76, lng: -95.37,
        again: { order: 6.5, whenText: L('February 2025', 'Februar 2025', 'فبراير 2025') },   /* listed a second time, after Wildau and before Tirana */
        folder: 'travel/usa/houston',
        city: L('Houston, Texas', 'Houston, Texas', 'هيوستن، تكساس'), country: C.us,
        text: L('Visiting NASA-related attractions in Houston as a tourist. The displays are museum exhibits. I visited Houston again in February 2025.',
                'Besuch NASA-bezogener Sehenswürdigkeiten in Houston als Tourist. Die Darstellungen sind Museumsausstellungen. Im Februar 2025 war ich noch einmal in Houston.',
                'زيارة معالم مرتبطة بناسا في هيوستن كسائح. ما يظهر في الصور معروضات متحفية. زرت هيوستن مرة أخرى في فبراير 2025.'),
        photos: [
          { file: 'houston-1.jpg', caption: L('The NASA logo, Houston', 'Das NASA-Logo, Houston', 'شعار ناسا، هيوستن') },
          { file: 'houston-2.jpg', caption: L('Space shuttle on its carrier aircraft, Houston', 'Space Shuttle auf seinem Trägerflugzeug, Houston', 'مكوك فضاء فوق طائرة النقل، هيوستن') },
          { file: 'houston-3.jpg', caption: L('Astronaut display, Space Center Houston', 'Astronauten-Ausstellungsstück, Space Center Houston', 'مجسم رائد فضاء، مركز الفضاء في هيوستن') },
          { file: 'houston-4.jpg', caption: L('Presidential seal exhibit, Houston', 'Ausstellung mit dem Präsidentensiegel, Houston', 'معروض بشعار الرئاسة الأمريكية، هيوستن') },
          { file: 'houston-video-1.mp4', poster: 'houston-video-1-poster.jpg', caption: L('Driving through Houston', 'Unterwegs in Houston', 'على الطريق في هيوستن') }
        ] },

      /* ---- Cairo: lived there after coming back from the USA, then on to Germany (no date given, so none is shown) ---- */
      { id: 'cairo', role: 'residence', order: 1.5, lat: 30.04, lng: 31.24,
        folder: 'travel/egypt/cairo',
        city: L('Cairo', 'Kairo', 'القاهرة'), country: C.eg,
        text: L('After coming back from the United States I lived in Cairo, and from there I left for Germany.',
                'Nach meiner Rückkehr aus den USA habe ich in Kairo gelebt, und von dort aus bin ich nach Deutschland aufgebrochen.',
                'بعد عودتي من الولايات المتحدة عشت في القاهرة، ومنها سافرت إلى ألمانيا.'),
        photos: [{ file: 'cairo-1.jpg', caption: L('In Cairo, before leaving for Germany', 'In Kairo, vor der Abreise nach Deutschland', 'في القاهرة، قبل السفر إلى ألمانيا'),
                   alt: L('Selfie of Seif wearing sunglasses, a dark suit, a white shirt and a light-blue tie, standing on a road with a petrol station behind him.',
                          'Selfie von Seif mit Sonnenbrille, dunklem Anzug, weißem Hemd und hellblauer Krawatte auf einer Straße, im Hintergrund eine Tankstelle.',
                          'سيلفي لـ Seif بنظارة شمس وبدلة داكنة وقميص أبيض وكرافتة زرقاء فاتحة، واقف على طريق وخلفه محطة وقود.') }] },

      /* ---- Berlin: moved in 2021, current home ---- */
      { id: 'berlin', role: 'home', order: 2, when: '2021', until: 'now', lat: 52.52, lng: 13.405,
        again: { order: 5.5, whenText: L('Back in Berlin', 'Zurück in Berlin', 'العودة إلى برلين') },   /* listed a second time, after Hamburg */
        folder: 'travel/germany/berlin',
        city: L('Berlin', 'Berlin', 'برلين'), country: C.de,
        text: L('I first moved to Berlin in 2021. It is my current city of residence.',
                'Ich bin 2021 zum ersten Mal nach Berlin gezogen. Berlin ist mein aktueller Wohnort.',
                'انتقلت إلى برلين لأول مرة عام 2021، وهي مدينة إقامتي الحالية.'),
        photos: [
          { file: 'berlin-1-wall-mural.jpg', caption: L('A wall mural in Berlin', 'Ein Wandbild in Berlin', 'جدارية على جدار في برلين') },
          { file: 'berlin-2-art-museum.jpg', caption: L('An art museum in Berlin', 'In einem Kunstmuseum in Berlin', 'في متحف فني في برلين') },
          { file: 'berlin-3-brandenburg-gate.jpg', caption: L('Brandenburg Gate', 'Brandenburger Tor', 'بوابة براندنبورغ') },
          { file: 'berlin-4-alexanderplatz.jpg', caption: L('Alexanderplatz and the TV Tower', 'Alexanderplatz und Fernsehturm', 'ميدان ألكسندربلاتز وبرج التلفزيون') },
          { file: 'berlin-5-brandenburg-gate-snow.jpg', caption: L('Brandenburg Gate in the snow', 'Brandenburger Tor im Schnee', 'بوابة براندنبورغ تحت الثلج') },
          { file: 'berlin-6-olympiastadion.jpg', caption: L('The Olympic Stadium', 'Das Olympiastadion', 'الاستاد الأولمبي') }
        ] },

      { id: 'brussels', role: 'visit', order: 3, when: '2023-01', lat: 50.85, lng: 4.35,
        folder: 'travel/belgium/brussels',
        city: L('Brussels', 'Brüssel', 'بروكسل'), country: C.be,
        text: L('A tourist trip to Brussels. The photo shows a building with the Belgian and European Union flags.',
                'Eine Touristenreise nach Brüssel. Das Foto zeigt ein Gebäude mit den Flaggen Belgiens und der Europäischen Union.',
                'رحلة سياحية إلى بروكسل. تظهر في الصورة بناية عليها علما بلجيكا والاتحاد الأوروبي.'),
        photos: [{ file: 'brussels-1.jpg', caption: L('A building with the Belgian and European Union flags', 'Ein Gebäude mit den Flaggen Belgiens und der EU', 'بناية عليها علما بلجيكا والاتحاد الأوروبي') }] },

      { id: 'magdeburg', role: 'residence', order: 4, when: '2023-04', lat: 52.12, lng: 11.63,
        folder: 'travel/germany/magdeburg',
        city: L('Magdeburg', 'Magdeburg', 'ماغديبورغ'), country: C.de,
        text: L('I moved to Magdeburg for a period of residence and study, and later returned to Berlin.',
                'Ich bin für eine Zeit des Wohnens und Studierens nach Magdeburg gezogen und später nach Berlin zurückgekehrt.',
                'انتقلت إلى ماغديبورغ لفترة إقامة ودراسة، ثم عدت لاحقًا إلى برلين.'),
        photos: [
          { file: 'magdeburg-1.jpg', caption: L('Magdeburg', 'Magdeburg', 'ماغديبورغ') },
          { file: 'magdeburg-2.jpg', caption: L('Magdeburg', 'Magdeburg', 'ماغديبورغ') },
          { file: 'magdeburg-3-river-bridge.jpg', caption: L('By the river', 'Am Fluss', 'على النهر') },
          { file: 'magdeburg-4-cathedral-selfie.jpg', caption: L('A selfie in front of the cathedral', 'Ein Selfie vor dem Dom', 'سيلفي أمام الكاتدرائية') },
          { file: 'magdeburg-5-cathedral.jpg', caption: L('In front of the cathedral', 'Vor dem Dom', 'أمام الكاتدرائية') },
          { file: 'magdeburg-6-blue-letters.jpg', caption: L('Having fun in the park', 'Spaß im Park', 'مرح في الحديقة') },
          { file: 'magdeburg-7-lake.jpg', caption: L('By the lake', 'Am See', 'عند البحيرة') },
          { file: 'magdeburg-8-ropes-1.jpg', caption: L('At a high ropes course', 'Im Hochseilgarten', 'في حديقة الحبال العالية') },
          { file: 'magdeburg-9-zipline.jpg', caption: L('On the zip line', 'An der Seilrutsche', 'على الحبل المعلّق (زيب لاين)') },
          { file: 'magdeburg-10-ropes-net.jpg', caption: L('In the climbing net', 'Im Kletternetz', 'داخل شبكة التسلق') }
        ] },

      { id: 'hamburg', role: 'visit', order: 5, when: '2024', lat: 53.55, lng: 9.99,
        folder: 'travel/germany/hamburg',
        city: L('Hamburg', 'Hamburg', 'هامبورغ'), country: C.de,
        text: L('A visit to Hamburg in 2024.', 'Ein Besuch in Hamburg im Jahr 2024.', 'زيارة إلى هامبورغ عام 2024.'),
        photos: [
          { file: 'hamburg-1.jpg', caption: L('Hamburg, 2024', 'Hamburg, 2024', 'هامبورغ، 2024') },
          { file: 'hamburg-2.jpg', caption: L('The harbour, Hamburg, 2024', 'Der Hafen, Hamburg, 2024', 'الميناء، هامبورغ، 2024') },
          { file: 'hamburg-3-harbour-view.jpg', caption: L('Overlooking the harbour', 'Mit Blick auf den Hafen', 'مطلًّا على الميناء') }
        ] },

      { id: 'wildau', role: 'visit', order: 6, whenText: L('University', 'Hochschule', 'الجامعة'), lat: 52.318, lng: 13.632,
        folder: 'travel/germany/wildau',
        city: L('Wildau', 'Wildau', 'فيلداو'), country: C.de,
        text: L('Technische Hochschule Wildau, the university where I study my Master’s in European Business Management, just outside Berlin.',
                'Die Technische Hochschule Wildau, an der ich meinen Master in European Business Management studiere, direkt vor den Toren Berlins.',
                'جامعة Technische Hochschule Wildau التي أدرس فيها الماجستير في إدارة الأعمال الأوروبية، على أطراف برلين.'),
        photos: [
          { file: 'wildau-1.jpg', caption: L('Me in Wildau, in my Egypt shirt', 'Ich in Wildau, im Ägypten-Trikot', 'أنا في فيلداو بقميص منتخب مصر') },
          { file: 'wildau-2-poster.jpg', caption: L('Presenting my poster on Adidas’s strategic entry and expansion in China, at TH Wildau',
                                                    'Ich präsentiere mein Poster zum strategischen Markteintritt und zur Expansion von Adidas in China, an der TH Wildau',
                                                    'أعرض بوستري عن دخول أديداس الاستراتيجي إلى السوق الصيني وتوسعها فيه، في TH Wildau') }
        ] },

      { id: 'tirana', role: 'visit', order: 7, when: '2025-08', lat: 41.33, lng: 19.82,
        folder: 'travel/albania/tirana',
        city: L('Tirana', 'Tirana', 'تيرانا'), country: C.al,
        text: L('A visit to Tirana: the skyline, Skanderbeg Square and Albanian currency.',
                'Ein Besuch in Tirana: die Skyline, der Skanderbeg-Platz und albanisches Geld.',
                'زيارة إلى تيرانا: أفق المدينة وساحة سكندربيغ والعملة الألبانية.'),
        photos: [
          { file: 'tirana-1-skyline.jpg', caption: L('The Tirana skyline', 'Die Skyline von Tirana', 'أفق مدينة تيرانا') },
          { file: 'tirana-2-skanderbeg-square.jpg', caption: L('Skanderbeg Square', 'Skanderbeg-Platz', 'ساحة سكندربيغ') },
          { file: 'tirana-3-currency.jpg', caption: L('Albanian currency', 'Albanisches Geld', 'العملة الألبانية') }
        ] },

      { id: 'tunis', role: 'visit', order: 8, when: '2025-09', lat: 36.81, lng: 10.18,
        folder: 'travel/tunisia/tunis',
        city: L('Tunis', 'Tunis', 'تونس العاصمة'), country: C.tn,
        text: L('A visit to Tunis: the clock tower, a monument with Tunisian flags and a mosque courtyard.',
                'Ein Besuch in Tunis: der Uhrturm, ein Denkmal mit tunesischen Flaggen und der Hof einer Moschee.',
                'زيارة إلى تونس العاصمة: برج الساعة ونصب تذكاري عليه الأعلام التونسية وصحن أحد المساجد.'),
        photos: [
          { file: 'tunis-1-clock-tower.jpg', caption: L('The clock tower', 'Der Uhrturm', 'برج الساعة') },
          { file: 'tunis-2-monument-flags.jpg', caption: L('A monument and Tunisian flags', 'Ein Denkmal und tunesische Flaggen', 'نصب تذكاري والأعلام التونسية') },
          { file: 'tunis-3-flags.jpg', caption: L('Tunisian flags', 'Tunesische Flaggen', 'الأعلام التونسية') },
          { file: 'tunis-4-mosque-courtyard.jpg', caption: L('A mosque courtyard in Tunis', 'Der Hof einer Moschee in Tunis', 'صحن أحد المساجد في تونس العاصمة') }
        ] },

      { id: 'szczecin', role: 'visit', order: 9, when: '2026-10', lat: 53.43, lng: 14.55,
        folder: 'travel/poland/szczecin',
        city: L('Szczecin', 'Stettin', 'شتشيتسين'), country: C.pl,
        text: L('A visit to Szczecin, Poland.', 'Ein Besuch in Stettin, Polen.', 'زيارة إلى شتشيتسين في بولندا.'),
        photos: [
          { file: 'szczecin-1-harbour-gate.jpg', caption: L('The Harbour Gate (Brama Portowa)', 'Das Hafentor (Brama Portowa)', 'بوابة الميناء (براما بورتوفا)') },
          { file: 'szczecin-2-cathedral-steps.jpg', caption: L('In front of St. James\' Cathedral', 'Vor der St.-Jakobi-Kathedrale', 'أمام كاتدرائية القديس يعقوب') },
          { file: 'szczecin-3-cathedral.jpg', caption: L('St. James\' Cathedral', 'Die St.-Jakobi-Kathedrale', 'كاتدرائية القديس يعقوب') },
          { file: 'szczecin-4-arcade.jpg', caption: L('Szczecin', 'Stettin', 'شتشيتسين') }
        ] }
    ],

    /* Confirmed moves only. A line is drawn for these and nothing else.
       `dashed` = the move is certain, its date is not. */
    routes: [
      { from: 'cairo',     to: 'berlin',    when: '2021',    reveal: 'berlin' },
      { from: 'berlin',    to: 'magdeburg', when: '2023-04', reveal: 'magdeburg' },
      { from: 'magdeburg', to: 'berlin',    dashed: true,    reveal: 'hamburg',   late: true }
    ],

    /* Small open markers for places visited without dates or photos. Empty on purpose: Greece, Frankfurt,
       Darmstadt and Munich were removed on request. Add { id, lat, lng, city, country } entries to bring such markers back
       (the "Also visited" list is gone from the page, but the markers still work). */
    also: []
  };
})();
