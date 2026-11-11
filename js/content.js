/* ==========================================================================
   CONTENT — structured text of the site. Every visible string is { en, de, ar }.
   Interface texts (buttons, headings, form messages) live in ui-en.js / ui-de.js / ui-ar.js.
   Photos and travel destinations live in manifest.js.

   To add an entry, copy an existing object in a list and change its fields.
   Dates use "YYYY-MM"; leave `to` empty for "present". Entries without dates are fine.
   `logo` refers to a key in MANIFEST.logos (logos/…); without a logo file a plain wordmark is shown.
   ========================================================================== */
(function () {
  var L = function (en, de, ar) { return { en: en, de: de, ar: ar }; };
  var EG = L('Egypt', 'Ägypten', 'مصر');
  var DE = L('Germany', 'Deutschland', 'ألمانيا');

  window.SITE = {

    /* ---------------- About: three verbs ---------------- */
    traits: [
      { word: L('Communicate', 'Kommunizieren', 'التواصل'),
        text: L('Customer-facing roles in telecom sales and events.',
                'Kundennahe Rollen im Telekom-Vertrieb und im Eventbereich.',
                'وظائف مباشرة مع العملاء: مبيعات اتصالات وفعاليات.') },
      { word: L('Create', 'Gestalten', 'الإبداع'),
        text: L('Promotional content with a marketing agency, and a visual identity for my football community.',
                'Werbeinhalte mit einer Marketingagentur und eine visuelle Identität für meine Fußball-Community.',
                'محتوى ترويجي مع وكالة تسويق، وهوية بصرية لمجتمعي الكروي.') },
      { word: L('Coordinate', 'Koordinieren', 'التنسيق'),
        text: L('Daily coordination of goods, schedules and records at Flink SE.',
                'Tägliche Koordination von Waren, Terminen und Dokumentation bei Flink SE.',
                'تنسيق يومي للبضائع والمواعيد والسجلات في Flink SE.') }
    ],

    /* ---------------- Marketing & content creation ---------------- */
    /* What I did with REACH UP (collaboration). Keep it exactly as documented. */
    collab: [
      L('Appearing in promotional videos', 'Auftritte in Werbevideos', 'الظهور في فيديوهات ترويجية'),
      L('Taking part in restaurant advertising content', 'Mitwirkung an Werbeinhalten für ein Restaurant', 'المشاركة في محتوى إعلاني لمطعم'),
      L('Brainstorming creative ideas with other people', 'Kreative Ideen gemeinsam mit anderen entwickelt', 'العصف الذهني للأفكار الإبداعية مع آخرين'),
      L('Contributing to content concepts', 'Beiträge zu Content-Konzepten', 'المساهمة في أفكار المحتوى'),
      L('Taking part in producing the promotional videos', 'Mitwirkung bei der Umsetzung der Werbevideos', 'المشاركة في تنفيذ الفيديوهات الترويجية')
    ],

    /* Instagram reels of the promotional videos I appear in (shown in the REACH UP details). Clean links, without tracking parameters. */
    reels: [
      'https://www.instagram.com/reel/DWIbAw5MG7f/',
      'https://www.instagram.com/reel/DWtyRYfMApj/',
      'https://www.instagram.com/reel/DcBxniMtnxv/'
    ],

    skills: {
      transfer: [
        L('Customer communication', 'Kundenkommunikation', 'التواصل مع العملاء'),
        L('Sales, negotiation and closing', 'Vertrieb, Verhandlung und Abschluss', 'المبيعات والتفاوض وإتمام الصفقات'),
        L('Coordination and documentation', 'Koordination und Dokumentation', 'التنسيق والتوثيق'),
        L('Working in international teams', 'Arbeit in internationalen Teams', 'العمل في فرق دولية'),
        L('Microsoft Office, SQL', 'Microsoft Office, SQL', 'Microsoft Office وSQL')
      ],
      develop: [
        L('Branding', 'Branding', 'بناء العلامة التجارية'),
        L('Content strategy', 'Content-Strategie', 'استراتيجية المحتوى'),
        L('Social media management', 'Social-Media-Management', 'إدارة وسائل التواصل الاجتماعي'),
        L('Digital marketing', 'Digitales Marketing', 'التسويق الرقمي'),
        L('Advertising and ads', 'Werbung und Anzeigen', 'الإعلانات والدعاية'),
        L('Content creation', 'Content-Erstellung', 'صناعة المحتوى'),
        L('Video creation', 'Videoerstellung', 'صناعة الفيديو'),
        L('Video editing', 'Videoschnitt', 'مونتاج الفيديو'),
        L('Acting for ads', 'Schauspiel für Werbung', 'التمثيل في الإعلانات'),
        L('Voice-over', 'Sprecherarbeit (Voice-over)', 'التعليق الصوتي'),
        L('Planning client projects', 'Planung von Kundenprojekten', 'التخطيط لمشاريع العملاء')
      ]
    },

    /* ---------------- Experience ----------------
       type: work | volunteer | collab. Newest first; entries without `from` stay at the top. */
    experience: [
      { type: 'collab', logo: 'reachup',
        org: L('REACH UP Marketing Agency', 'REACH UP Marketing Agency', 'REACH UP Marketing Agency'),
        role: L('Collaboration on promotional video content', 'Zusammenarbeit an Werbevideo-Inhalten', 'تعاون في محتوى فيديوهات ترويجية'),
        link: '#marketing',
        bullets: [
          L('Appeared in promotional videos and took part in restaurant advertising content.',
            'In Werbevideos aufgetreten und an Werbeinhalten für ein Restaurant mitgewirkt.',
            'ظهرت في فيديوهات ترويجية وشاركت في محتوى إعلاني لمطعم.'),
          L('Brainstormed creative ideas with other people and contributed to content concepts.',
            'Kreative Ideen gemeinsam mit anderen entwickelt und zu Content-Konzepten beigetragen.',
            'شاركت في العصف الذهني للأفكار الإبداعية وساهمت في أفكار المحتوى.')
        ] },
      { type: 'work', from: '2021-12', to: '2024-11', logo: 'flink',
        org: L('Flink SE', 'Flink SE', 'Flink SE'), place: DE,
        role: L('Inbound & Outbound Coordinator · Warehouse Assistant · Rider', 'Koordinator Wareneingang & Warenausgang · Lagerhelfer · Fahrer', 'منسق البضائع الواردة والصادرة · مساعد مستودع · سائق توصيل'),
        bullets: [
          L('Handled incoming and outgoing goods, processed shipments and coordinated with suppliers and delivery services.',
            'Wareneingang und Warenausgang bearbeitet, Sendungen abgewickelt und mit Lieferanten und Zustelldiensten abgestimmt.',
            'التعامل مع البضائع الواردة والصادرة ومعالجة الشحنات والتنسيق مع الموردين وشركات التوصيل.'),
          L('Organised warehouse stock, supported daily operations and delivered products to customers as a rider.',
            'Lagerbestand organisiert, den täglichen Betrieb unterstützt und als Fahrer Produkte an Kunden ausgeliefert.',
            'تنظيم مخزون المستودع ودعم العمليات اليومية وتوصيل المنتجات إلى العملاء.'),
          L('Assisted with onboarding and guidance of new employees.',
            'Bei der Einarbeitung und Begleitung neuer Mitarbeitender unterstützt.',
            'المساعدة في تدريب الموظفين الجدد وتوجيههم.')
        ] },
      { type: 'work', from: '2021-01', to: '2021-09', logo: 'etisalat',
        org: L('Etisalat Telecom Corporation', 'Etisalat Telecom Corporation', 'Etisalat Telecom Corporation'), place: EG,
        role: L('Sales Representative (Team Leader)', 'Vertriebsmitarbeiter (Teamleiter)', 'مندوب مبيعات (قائد فريق)'),
        bullets: [
          L('Prospecting, lead generation, negotiation and building customer relationships.',
            'Kundenakquise, Lead-Generierung, Verhandlung und Aufbau von Kundenbeziehungen.',
            'البحث عن عملاء محتملين والتفاوض وبناء علاقات مع العملاء.'),
          L('Responded to customer needs and resolved issues to keep customers satisfied.',
            'Auf Kundenbedürfnisse eingegangen und Probleme gelöst, um die Kundenzufriedenheit zu sichern.',
            'تلبية احتياجات العملاء وحل مشكلاتهم لضمان رضاهم.')
        ] },
      { type: 'volunteer', from: '2019-02', to: '2020-05', logo: 'aiesec',   /* Feb 2019 to May 2020 (confirmed) */
        org: L('AIESEC', 'AIESEC', 'AIESEC'), place: EG,
        role: L('Volunteer, Customer Experience', 'Ehrenamtlich, Customer Experience', 'متطوع، تجربة العملاء'),
        bullets: [
          L('Welcomed participants, answered their questions and supported positive experiences at activities and events.',
            'Teilnehmende begrüßt, ihre Fragen beantwortet und positive Erfahrungen bei Aktivitäten und Veranstaltungen unterstützt.',
            'استقبال المشاركين والإجابة عن أسئلتهم ودعم تجربة إيجابية في الأنشطة والفعاليات.'),
          L('Worked with people from different backgrounds and with international teams.',
            'Mit Menschen aus unterschiedlichen Hintergründen und mit internationalen Teams zusammengearbeitet.',
            'العمل مع أشخاص من خلفيات مختلفة ومع فرق دولية.')
        ] }
    ],

    /* ---------------- Education ----------------
       status: done (degree completed) | course (coursework, no degree) | now (in progress). Newest first. */
    education: [
      { status: 'now', from: '2025-09', logo: 'wildau',
        org: L('Technische Hochschule Wildau', 'Technische Hochschule Wildau', 'Technische Hochschule Wildau'), place: DE,
        title: L('Master of Arts, European Business Management', 'Master of Arts, European Business Management', 'ماجستير الآداب في إدارة الأعمال الأوروبية'),
        text: L('Marketing and advertising, within an interdisciplinary programme covering business, administration and law.',
                'Marketing und Werbung, in einem interdisziplinären Studiengang mit Wirtschaft, Verwaltung und Recht.',
                'التسويق والإعلان، ضمن برنامج متعدد التخصصات يشمل الأعمال والإدارة والقانون.') },
      { status: 'course', logo: 'wildau',
        org: L('Technische Hochschule Wildau', 'Technische Hochschule Wildau', 'Technische Hochschule Wildau'), place: DE,
        title: L('European Business Management, bachelor-level coursework', 'European Business Management, Kurse auf Bachelor-Niveau', 'مقررات في إدارة الأعمال الأوروبية بمستوى البكالوريوس'),
        text: L('Coursework before the Master’s programme. No bachelor’s degree was awarded.',
                'Kurse vor dem Masterstudiengang. Ein Bachelorabschluss wurde nicht erworben.',
                'مقررات قبل برنامج الماجستير. لم تُمنح شهادة بكالوريوس.') },
      { status: 'course', from: '2023-04', to: '2024-09', logo: 'magdeburg',
        org: L('Hochschule Magdeburg-Stendal', 'Hochschule Magdeburg-Stendal', 'Hochschule Magdeburg-Stendal'), place: DE,
        title: L('Sustainable Resources Engineering & Management, coursework', 'Sustainable Resources Engineering & Management, Studienleistungen', 'مقررات في هندسة وإدارة الموارد المستدامة'),
        text: L('Coursework in production and supply chain topics, including a research paper on cutting supply chain costs while improving operational performance. No bachelor’s degree was awarded.',
                'Kurse zu Produktions- und Lieferkettenthemen, darunter eine Forschungsarbeit zur Senkung von Lieferkettenkosten bei besserer operativer Leistung. Ein Bachelorabschluss wurde nicht erworben.',
                'مقررات في موضوعات الإنتاج وسلاسل الإمداد، منها ورقة بحثية عن خفض تكاليف سلسلة الإمداد مع تحسين الأداء التشغيلي. لم تُمنح شهادة بكالوريوس.') },
      { status: 'done', from: '2016-09', to: '2020-07', logo: 'mansoura',
        org: L('Mansoura University', 'Mansoura University', 'جامعة المنصورة'), place: EG,
        title: L('Bachelor of Commerce, Accounting (English section)', 'Bachelor of Commerce, Accounting (englischsprachiger Zweig)', 'بكالوريوس التجارة، قسم المحاسبة (الشعبة الإنجليزية)'),
        text: null }
    ],

    /* ---------------- Legal pages (checked against what the site really does) ----------------
       {provider} is replaced by CONFIG.form.providerName. Text in [brackets] must be filled in by you. */
    legal: [
      { id: 'impressum',
        title: L('Impressum', 'Impressum', 'البيانات القانونية (Impressum)'),
        body: [
          L('MISSING INFORMATION: replace the text in [brackets] before this site goes online.',
            'FEHLENDE ANGABEN: Ersetzen Sie die Angaben in [eckigen Klammern], bevor die Website online geht.',
            'معلومات ناقصة: استبدل النص الموجود بين [أقواس] قبل نشر الموقع.'),
          L('German law generally requires a legal notice for professional or business-like websites (§ 5 DDG). It usually includes your full name, a postal address where you can be reached, and an email address. Check whether this applies to your site and what exactly it must contain.',
            'Das deutsche Recht verlangt für berufliche oder geschäftsmäßige Websites in der Regel eine Anbieterkennzeichnung (§ 5 DDG). Sie enthält meist den vollständigen Namen, eine ladungsfähige Postanschrift und eine E-Mail-Adresse. Prüfen Sie, ob das auf Ihre Seite zutrifft und was genau enthalten sein muss.',
            'يتطلب القانون الألماني عادةً بيانات قانونية للمواقع المهنية أو شبه التجارية (المادة 5 من DDG). وتشمل عادةً اسمك الكامل وعنوانًا بريديًا يمكن الوصول إليك عليه وبريدًا إلكترونيًا. تحقق من انطباق ذلك على موقعك ومما يجب أن يتضمنه بالضبط.'),
          L('Seif Elemam · [Street and number] · [Postcode and city], Germany · seifelemam9@gmail.com',
            'Seif Elemam · [Straße und Hausnummer] · [PLZ und Ort], Deutschland · seifelemam9@gmail.com',
            'Seif Elemam · [الشارع والرقم] · [الرمز البريدي والمدينة]، ألمانيا · seifelemam9@gmail.com')
        ] },
      { id: 'datenschutz',
        title: L('Datenschutz (privacy policy)', 'Datenschutzerklärung', 'سياسة الخصوصية (Datenschutz)'),
        body: [
          L('MISSING INFORMATION: have this text checked and complete the parts in [brackets] before publishing.',
            'FEHLENDE ANGABEN: Lassen Sie diesen Text prüfen und ergänzen Sie die Angaben in [eckigen Klammern], bevor Sie veröffentlichen.',
            'معلومات ناقصة: اطلب مراجعة هذا النص وأكمل الأجزاء بين [أقواس] قبل النشر.'),
          L('Controller: Seif Elemam, [postal address], seifelemam9@gmail.com.',
            'Verantwortlicher: Seif Elemam, [Postanschrift], seifelemam9@gmail.com.',
            'المسؤول عن البيانات: Seif Elemam، [العنوان البريدي]، seifelemam9@gmail.com.'),
          L('Cookies and tracking: this site uses no cookies and no analytics. It stores your language choice (local storage) and the fact that you have seen the intro screen (session storage) in your own browser. Nothing is sent anywhere.',
            'Cookies und Tracking: Diese Website verwendet keine Cookies und kein Tracking. Ihre Sprachwahl (Local Storage) und die Information, dass Sie den Intro-Bildschirm gesehen haben (Session Storage), werden nur in Ihrem eigenen Browser gespeichert. Es wird nichts übertragen.',
            'ملفات تعريف الارتباط والتتبع: لا يستخدم هذا الموقع ملفات تعريف ارتباط ولا أدوات تحليل. يحفظ اختيارك للغة (التخزين المحلي) ومشاهدتك لشاشة المقدمة (تخزين الجلسة) في متصفحك فقط. لا يُرسل أي شيء.'),
          L('Hosting: the site is hosted on GitHub Pages (GitHub, Inc., USA). When you open the site, GitHub processes technical data such as your IP address in server logs. [Check GitHub’s current data protection information and add it here.]',
            'Hosting: Die Website wird über GitHub Pages (GitHub, Inc., USA) bereitgestellt. Beim Aufruf verarbeitet GitHub technische Daten wie Ihre IP-Adresse in Server-Logs. [Prüfen Sie die aktuellen Datenschutzinformationen von GitHub und ergänzen Sie sie hier.]',
            'الاستضافة: يُستضاف الموقع على GitHub Pages (شركة GitHub, Inc. في الولايات المتحدة). عند فتح الموقع تعالج GitHub بيانات تقنية مثل عنوان IP في سجلات الخادم. [راجع معلومات حماية البيانات الحالية لدى GitHub وأضفها هنا.]'),
          L('Fonts: the site loads its fonts from Google Fonts, which sends your IP address to Google. [Host the fonts yourself to avoid this, see README, then remove this paragraph.]',
            'Schriften: Die Website lädt ihre Schriften von Google Fonts, wobei Ihre IP-Adresse an Google übertragen wird. [Hosten Sie die Schriften selbst, um das zu vermeiden (siehe README), und entfernen Sie dann diesen Absatz.]',
            'الخطوط: يحمّل الموقع خطوطه من Google Fonts، فيصل عنوان IP الخاص بك إلى Google. [استضف الخطوط بنفسك لتجنب ذلك (انظر README) ثم احذف هذه الفقرة.]'),
          L('Contact form: if you send a message, the name, email address, optional subject and message you enter are sent to the form service {provider} (USA), which forwards them to me by email. I use them only to reply to you. The legal basis is your consent (Art. 6(1)(a) GDPR), which you give by ticking the box before sending. Technical data such as your IP address may be processed by the service. [Check the service’s current privacy policy and add its link here.]',
            'Kontaktformular: Wenn Sie eine Nachricht senden, werden Name, E-Mail-Adresse, optionaler Betreff und Nachricht an den Formulardienst {provider} (USA) übermittelt, der sie per E-Mail an mich weiterleitet. Ich verwende sie nur, um Ihnen zu antworten. Rechtsgrundlage ist Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die Sie durch das Setzen des Häkchens vor dem Absenden erteilen. Technische Daten wie Ihre IP-Adresse können vom Dienst verarbeitet werden. [Prüfen Sie die aktuelle Datenschutzerklärung des Dienstes und fügen Sie den Link hier ein.]',
            'نموذج التواصل: عند إرسال رسالة، تُرسل بيانات الاسم والبريد الإلكتروني والموضوع الاختياري والرسالة إلى خدمة النماذج {provider} (الولايات المتحدة) التي تحوّلها إليّ بالبريد الإلكتروني. أستخدمها فقط للرد عليك. الأساس القانوني هو موافقتك (المادة 6(1)(أ) من اللائحة العامة لحماية البيانات) التي تمنحها بتأشير المربع قبل الإرسال. قد تعالج الخدمة بيانات تقنية مثل عنوان IP. [راجع سياسة الخصوصية الحالية للخدمة وأضف رابطها هنا.]'),
          L('Email and LinkedIn: the email address and LinkedIn profile are plain links. LinkedIn’s own privacy policy applies once you open it.',
            'E-Mail und LinkedIn: E-Mail-Adresse und LinkedIn-Profil sind einfache Links. Sobald Sie LinkedIn öffnen, gilt dessen eigene Datenschutzerklärung.',
            'البريد الإلكتروني وLinkedIn: البريد الإلكتروني وملف LinkedIn مجرد روابط. وعند فتح LinkedIn تنطبق سياسة الخصوصية الخاصة به.'),
          L('Your rights: you can ask for access, correction, deletion or restriction of your data, withdraw your consent at any time, and complain to a data protection authority.',
            'Ihre Rechte: Sie können Auskunft, Berichtigung, Löschung oder Einschränkung der Verarbeitung Ihrer Daten verlangen, Ihre Einwilligung jederzeit widerrufen und sich bei einer Datenschutzaufsichtsbehörde beschweren.',
            'حقوقك: يمكنك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها أو تقييد معالجتها، وسحب موافقتك في أي وقت، وتقديم شكوى إلى سلطة حماية البيانات.')
        ] }
    ],

    meta: {
      title: L('Seif Elemam · Marketing & Content Creation', 'Seif Elemam · Marketing & Content Creation', 'Seif Elemam · التسويق وصناعة المحتوى'),
      description: L('Portfolio of Seif Elemam, an Egyptian marketing student in Berlin: marketing and content creation, experience, education, culture and an interactive journey map.',
                     'Portfolio von Seif Elemam, ägyptischer Marketing-Student in Berlin: Marketing und Content Creation, Erfahrung, Ausbildung, Kultur und eine interaktive Reisekarte.',
                     'ملف أعمال Seif Elemam، طالب تسويق مصري في برلين: التسويق وصناعة المحتوى والخبرة والتعليم والثقافة وخريطة رحلة تفاعلية.')
    }
  };
})();
