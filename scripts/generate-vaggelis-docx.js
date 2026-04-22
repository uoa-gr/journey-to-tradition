/* eslint-disable no-console */
// Formal minimalist Greek DOCX briefing for Evangelos Spyrou ("Vaggelis").
// Run: NODE_PATH="$APPDATA/npm/node_modules" node scripts/generate-vaggelis-docx.js

const fs = require('fs');
const path = require('path');

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, TabStopType,
} = require('docx');

const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'docs', 'assets');
const WIREFRAMES = path.join(ASSETS, 'wireframes');
const OUTPUT = path.join(ROOT, 'docs', 'Σημείωμα Σχεδιασμού - Ταξίδι στην Παράδοση.docx');

// Live URL Vaggelis can visit (set after `gh repo create` + Pages enable).
const LIVE_URL = 'https://uoa-gr.github.io/journey-to-tradition/';
const WIREFRAMES_URL = LIVE_URL + 'diagrams/';

// ---------- Design tokens ----------

const C = {
  ink: '1A1A1A',
  charcoal: '333333',
  slate: '555555',
  stone: '666666',
  ash: '888888',
  mist: 'BBBBBB',
  fog: 'E0E0E0',
  paper: 'FAFAF5',
};

// A4 paper (DXA = twentieths of a point; 1440 = 1 inch)
const A4 = { width: 11906, height: 16838 };
const MARGIN = { top: 1440, right: 1440, bottom: 1440, left: 1440 };
const CONTENT_W = A4.width - MARGIN.left - MARGIN.right; // 9026

const FONT = 'Calibri';
const FONT_LIGHT = 'Calibri Light';

// ---------- Helpers ----------

function txt(text, opts = {}) {
  return new TextRun({ text, font: FONT, ...opts });
}

function para(text, opts = {}) {
  const { run = {}, ...p } = opts;
  return new Paragraph({
    children: [txt(text, run)],
    ...p,
  });
}

function p(text) {
  return new Paragraph({
    children: [txt(text, { size: 22, color: C.charcoal })],
    spacing: { after: 120, line: 330 },
    alignment: AlignmentType.JUSTIFIED,
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [txt(text, { size: 36, bold: true, color: C.ink })],
    spacing: { before: 480, after: 240 },
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [txt(text, { size: 26, bold: true, color: C.ink })],
    spacing: { before: 320, after: 160 },
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [txt(text, { size: 22, bold: true, color: C.charcoal })],
    spacing: { before: 240, after: 120 },
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    children: [txt(text, { size: 22, color: C.charcoal })],
    spacing: { after: 60, line: 300 },
  });
}

function numbered(text) {
  return new Paragraph({
    numbering: { reference: 'numbers', level: 0 },
    children: [txt(text, { size: 22, color: C.charcoal })],
    spacing: { after: 60, line: 300 },
  });
}

function divider() {
  return new Paragraph({
    border: {
      bottom: {
        style: BorderStyle.SINGLE, size: 6, color: C.fog, space: 1,
      },
    },
    children: [txt('')],
    spacing: { before: 200, after: 200 },
  });
}

function spacer(size = 400) {
  return new Paragraph({ spacing: { before: size }, children: [txt('')] });
}

function cell({ text, width, bold = false, header = false, align = AlignmentType.LEFT, runs = null }) {
  const border = { style: BorderStyle.SINGLE, size: 3, color: C.fog };
  const borderTop = header
    ? { style: BorderStyle.SINGLE, size: 6, color: C.stone }
    : border;
  const borderBottom = header
    ? { style: BorderStyle.SINGLE, size: 6, color: C.stone }
    : border;
  const children = runs
    ? [new Paragraph({ alignment: align, children: runs, spacing: { line: 280 } })]
    : [new Paragraph({
        alignment: align,
        children: [txt(text, { size: 20, bold, color: header ? C.ink : C.charcoal })],
        spacing: { line: 280 },
      })];
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: { top: borderTop, bottom: borderBottom, left: border, right: border },
    shading: header ? { fill: C.paper, type: ShadingType.CLEAR } : undefined,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    children,
  });
}

function simpleTable(widths, header, rows) {
  const tableWidth = widths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: tableWidth, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: header.map((c, i) => cell({ text: c, width: widths[i], bold: true, header: true })),
      }),
      ...rows.map((row) =>
        new TableRow({
          children: row.map((c, i) => cell({ text: c, width: widths[i] })),
        }),
      ),
    ],
  });
}

function imagePara(filename, width, height, caption, baseDir = ASSETS) {
  const data = fs.readFileSync(path.join(baseDir, filename));
  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 120 },
      children: [
        new ImageRun({
          type: 'png',
          data,
          transformation: { width, height },
          altText: {
            title: caption || filename,
            description: caption || filename,
            name: filename,
          },
        }),
      ],
    }),
  ];
  if (caption) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 240 },
      children: [txt(caption, { italics: true, size: 18, color: C.stone })],
    }));
  }
  return children;
}

function wireframePara(filename, caption, route) {
  // Wireframes are rendered at 1400×1000 px @ 1x. Fit ~600 wide in docx for readability.
  const data = fs.readFileSync(path.join(WIREFRAMES, filename));
  const w = 600;
  const h = Math.round(w * (1000 / 1400)); // 429
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 60 },
      children: [
        new ImageRun({
          type: 'png',
          data,
          transformation: { width: w, height: h },
          altText: {
            title: caption,
            description: caption,
            name: filename,
          },
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 240 },
      children: [
        txt(caption, { italics: true, size: 18, color: C.charcoal }),
        ...(route ? [
          txt('   ·   ', { size: 16, color: C.ash }),
          txt(route, { size: 16, color: C.ash, font: 'Consolas' }),
        ] : []),
      ],
    }),
  ];
}

// ---------- Cover page ----------

const cover = [
  // Institutional header, top-right, small
  new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 60 },
    children: [txt('ΕΘΝΙΚΟ ΚΑΙ ΚΑΠΟΔΙΣΤΡΙΑΚΟ ΠΑΝΕΠΙΣΤΗΜΙΟ ΑΘΗΝΩΝ', {
      size: 16, color: C.ash, characterSpacing: 60,
    })],
  }),
  new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 120 },
    children: [txt('Τμήμα Γεωλογίας και Γεωπεριβάλλοντος', { size: 18, color: C.stone })],
  }),

  // Push the title down
  spacer(2800),

  // Title
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [txt('Ταξίδι στην Παράδοση', { font: FONT_LIGHT, size: 72, color: C.ink, characterSpacing: -20 })],
  }),

  // Subtitle
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360 },
    children: [txt('WebGIS Ελληνικών Μουσικών Παραδόσεων', { italics: true, size: 28, color: C.slate })],
  }),

  // Divider
  divider(),

  // Document type
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 160 },
    children: [txt('Σημείωμα Σχεδιασμού', { size: 32, color: C.charcoal })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [txt('Ενημέρωση προς τον Επιστημονικό Υπεύθυνο', { italics: true, size: 22, color: C.slate })],
  }),

  // Spacer
  spacer(2400),

  // Author / date
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [txt('Αλέξανδρος Π. Λιάσκος', { size: 22, bold: true, color: C.ink })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [txt('alexliaskos@geol.uoa.gr', { size: 20, color: C.slate })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 0 },
    children: [txt('22 Απριλίου 2026', { size: 20, color: C.ash })],
  }),

  // Bottom note
  spacer(2400),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [txt('Εσωτερικό έγγραφο — προς επανεξέταση από τον επιστημονικό υπεύθυνο.', {
      italics: true, size: 16, color: C.ash,
    })],
  }),

  // Force next section (and thus next page)
  new Paragraph({ children: [new PageBreak()] }),
];

// ---------- Περιεχόμενα ----------

function tocRow(n, title) {
  return new Paragraph({
    tabStops: [
      { type: TabStopType.LEFT, position: 700 },
      { type: TabStopType.LEFT, position: CONTENT_W - 100 },
    ],
    spacing: { after: 120 },
    children: [
      txt(`${n}.`, { size: 22, color: C.stone }),
      txt('\t', {}),
      txt(title, { size: 22, color: C.charcoal }),
    ],
  });
}

const toc = [
  h1('Περιεχόμενα'),
  tocRow('1', 'Σκοπός του εγγράφου'),
  tocRow('2', 'Τι έχει αποφασιστεί'),
  tocRow('3', 'Δομή δεδομένων'),
  tocRow('4', 'Έγκυρες τιμές ανά πεδίο'),
  tocRow('5', 'Διάταξη ιστοσελίδας'),
  tocRow('6', 'Ροή ανεβάσματος ήχου'),
  tocRow('7', 'Ερωτήσεις προς εσάς'),
  tocRow('8', 'Επόμενα βήματα'),
  tocRow('9', 'Παράρτημα — Ζωντανά σκαριφήματα UI'),
  spacer(360),
  new Paragraph({
    spacing: { after: 0 },
    children: [txt('Ζωντανή προεπισκόπηση', { size: 18, bold: true, color: C.ink, characterSpacing: 50 })],
  }),
  new Paragraph({
    spacing: { before: 80, after: 0 },
    children: [
      txt('Όλα τα έγγραφα και τα σκαριφήματα είναι διαθέσιμα και ζωντανά εδώ:', {
        size: 20, color: C.charcoal,
      }),
    ],
  }),
  new Paragraph({
    spacing: { before: 80, after: 0 },
    children: [
      txt(LIVE_URL, { size: 22, color: C.ink, underline: {} }),
    ],
  }),
  new Paragraph({
    spacing: { before: 80, after: 0 },
    children: [
      txt('(δεν χρειάζεται λογαριασμός — απλώς ανοίξτε τον σύνδεσμο)', {
        size: 18, italics: true, color: C.ash,
      }),
    ],
  }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ---------- Section 1 ----------

const section1 = [
  h1('1. Σκοπός του εγγράφου'),
  p('Το παρόν σημείωμα συνοψίζει τις αποφάσεις σχεδιασμού του WebGIS «Ταξίδι στην Παράδοση», όπως διαμορφώθηκαν μετά την επικοινωνία μας της 21ης Απριλίου 2026, και θέτει συγκεκριμένα ερωτήματα πριν ξεκινήσει η υλοποίηση.'),
  p('Θα βρείτε εδώ: (α) τι έχει ήδη κριθεί και δεν χρειάζεται περαιτέρω συζήτηση, (β) πώς θα οργανωθούν τα δεδομένα σε ένα απλό σχεσιακό μοντέλο, (γ) ποιες λίστες κανονικών τιμών χρειαζόμαστε από εσάς για να ξεκινήσει η εισαγωγή περιεχομένου, (δ) πώς προβλέπεται να μοιάζει η δημόσια σελίδα και η σελίδα διαχείρισης, και (ε) ένα σύνολο ερωτήσεων που σας ζητείται να απαντήσετε για να προχωρήσει η εργασία.'),
  p('Η σύνταξη είναι σκόπιμα συνοπτική. Το αναλυτικό τεχνικό παράρτημα (αρχιτεκτονική, RLS, CI/CD, ER σε πλήρη μορφή) βρίσκεται στα εσωτερικά έγγραφα του αποθετηρίου και δεν απαιτεί επισκόπηση από εσάς.'),
];

// ---------- Section 2 ----------

const section2 = [
  h1('2. Τι έχει αποφασιστεί'),
  p('Οι παρακάτω επιλογές έχουν κλειδωθεί και δεν αποτελούν αντικείμενο συζήτησης σε αυτό το στάδιο, εκτός αν εντοπίσετε πρόβλημα.'),
  bullet('Τεχνική βάση: σύγχρονη στοίβα ανοιχτού / ακαδημαϊκά φιλικού λογισμικού (Next.js, Supabase, Vercel, Leaflet). Δεν απαιτείται από εσάς καμία εγκατάσταση — η εργασία σας γίνεται αποκλειστικά από τον φυλλομετρητή.'),
  bullet('Γλώσσα εκδοχής 1: αποκλειστικά ελληνικά στο περιβάλλον χρήστη. Η βάση δεδομένων είναι έτοιμη να δεχθεί και αγγλικές αποδόσεις αργότερα χωρίς μετατροπές.'),
  bullet('Αρχεία ήχου: φιλοξενούνται από εμάς (όχι YouTube). Κρυπτογραφημένη μεταφορά, δημόσιο CDN για γρήγορη αναπαραγωγή.'),
  bullet('Διαχείριση: θα διαθέτετε ολοκληρωμένο πίνακα διαχειριστή με φόρμες για κάθε οντότητα (τραγούδια, περιοχές, κατηγορίες κ.λπ.), χωρίς παρέμβαση προγραμματιστή.'),
  bullet('Είσοδος διαχειριστή: σύνδεσμος μιας χρήσης στο email σας (evspyrou@geol.uoa.gr) — δεν χρειάζεται κωδικός. Προαιρετική ενεργοποίηση δεύτερου παράγοντα (MFA) όταν το επιθυμείτε.'),
  bullet('Αντίγραφα ασφαλείας: ημερήσια της βάσης (7 ημέρες διατήρηση), νυχτερινά των ηχητικών αρχείων (30 ημέρες), εβδομαδιαίο πλήρες αρχείο (1 έτος), τριμηνιαίος έλεγχος επαναφοράς.'),
  bullet('Φορητότητα: μηνιαίο εξαγόμενο αρχείο (ZIP) με όλη τη βάση + ήχο + ιστορικό αλλαγών, παραδοτέο σε οποιαδήποτε διάδοχη εγκατάσταση.'),
];

// ---------- Section 3 ----------

const entityRows = [
  ['Περιοχή', 'Μεγαλύτερη γεωγραφική μονάδα (π.χ. Ήπειρος, Πόντος, Κρήτη). Κάθε τραγούδι ανήκει σε ακριβώς μία.'],
  ['Υποπεριοχή', 'Εξειδίκευση μιας περιοχής (π.χ. Θεσπρωτία εντός Ηπείρου). Προαιρετική.'],
  ['Επί μέρους Υποπεριοχή', 'Λεπτότερη διαίρεση — εκκρεμεί μετονομασία (βλ. Ερώτηση 1). Προαιρετική.'],
  ['Νησί', 'Νησιωτική γεωγραφική μονάδα, όπου εφαρμόζεται.'],
  ['Χωριό', 'Σημείο στον χάρτη (όχι πολύγωνο).'],
  ['Τραγούδι', 'Η κύρια οντότητα. Φέρει τίτλο, στίχους, περιγραφή, ρυθμό, χορό, ήχο, πηγές, παραπομπές κ.λπ.'],
  ['Κατηγορία', 'Είδος τραγουδιού (π.χ. κλέφτικο, μοιρολόι, γαμήλιο). Έως 3 ανά τραγούδι.'],
  ['Ρυθμός', 'Ρυθμικό πλαίσιο (π.χ. τρεχάτος, καλαματιανός). Συνδέεται με παράρτημα επεξήγησης.'],
  ['Χορός', 'Είδος χορού, όπου εφαρμόζεται.'],
  ['Γλώσσα', 'Μία ή περισσότερες ανά τραγούδι (δίγλωσσα τραγούδια).'],
  ['Πηγή πληροφορίας', 'Σύνδεσμος ή βιβλιογραφική αναφορά ή αρχειακή / προφορική πηγή.'],
  ['Παραπομπή', 'Σχέση ενός τραγουδιού με άλλο: μελωδική, ρυθμική, στιχουργική ή θεματική συγγένεια.'],
  ['Παράρτημα', 'Αυτοτελές επεξηγηματικό κείμενο (π.χ. για ρυθμούς, κατηγορίες, ιστορικό).'],
];

const section3 = [
  h1('3. Δομή δεδομένων'),
  p('Το ακόλουθο διάγραμμα δείχνει τις βασικές οντότητες και τις σχέσεις μεταξύ τους. Κάθε πλαίσιο αντιστοιχεί σε έναν πίνακα της βάσης δεδομένων.'),
  ...imagePara('vaggelis-er.png', 620, 220, 'Σχήμα 1 — Βασικές οντότητες και σχέσεις (απλοποιημένο).'),
  h3('Τι περιέχει κάθε οντότητα'),
  simpleTable(
    [2600, 6426],
    ['Οντότητα', 'Περιγραφή'],
    entityRows,
  ),
];

// ---------- Section 4 ----------

const section4 = [
  h1('4. Έγκυρες τιμές ανά πεδίο'),
  h2('4.1 Σταθερές τιμές (ορίζονται από εμάς)'),
  p('Οι παρακάτω λίστες είναι δομικές και δεν αλλάζουν ανά σώμα δεδομένων.'),

  h3('Τύποι παραπομπής μεταξύ τραγουδιών'),
  simpleTable(
    [2200, 6826],
    ['Τιμή', 'Νόημα'],
    [
      ['melodic', 'Κοινή ή παρόμοια μελωδία'],
      ['rhythmic', 'Κοινό ρυθμικό πλαίσιο'],
      ['lyrical', 'Κοινοί ή παράλληλοι στίχοι'],
      ['thematic', 'Κοινό θέμα / περιεχόμενο'],
    ],
  ),

  h3('Τύποι πηγής πληροφορίας'),
  simpleTable(
    [2200, 6826],
    ['Τιμή', 'Νόημα'],
    [
      ['link', 'Σύνδεσμος ιστοσελίδας (π.χ. ψηφιακό αρχείο)'],
      ['bibliography', 'Βιβλιογραφική αναφορά'],
      ['archival', 'Παραπομπή σε αρχείο / συλλογή'],
      ['oral', 'Προφορική πηγή (π.χ. πληροφορητής)'],
    ],
  ),

  h3('Άδειες χρήσης ηχητικού αρχείου (ανά τραγούδι)'),
  p('Η προεπιλεγμένη τιμή είναι uncleared και ο ήχος δεν εμφανίζεται δημόσια μέχρι να ορίσετε συγκεκριμένη άδεια.'),
  simpleTable(
    [3000, 6026],
    ['Τιμή', 'Τι εμφανίζεται στο δημόσιο site'],
    [
      ['public_domain', 'Κοινό κτήμα — ελεύθερη χρήση'],
      ['cc_by', 'CC Αναφορά 4.0 (CC BY)'],
      ['cc_by_sa', 'CC Αναφορά – Παρόμοια Διανομή 4.0'],
      ['cc_by_nc', 'CC Αναφορά – Μη Εμπορική 4.0'],
      ['cc_by_nc_sa', 'CC Αναφορά – Μη Εμπορική – Παρόμοια 4.0'],
      ['all_rights_reserved', 'Με επιφύλαξη πνευματικών δικαιωμάτων'],
      ['uncleared', '(προεπιλογή) ο ήχος δεν προβάλλεται'],
    ],
  ),

  h3('Ρόλοι χρηστών διαχείρισης'),
  simpleTable(
    [2200, 6826],
    ['Τιμή', 'Περιεχόμενο'],
    [
      ['admin', 'Πλήρη δικαιώματα — εσείς και ο προγραμματιστής.'],
      ['editor', 'Επεξεργασία τραγουδιών (όχι διαγραφή δομικών δεδομένων). Διατηρείται για μελλοντικούς συνεργάτες.'],
      ['viewer', 'Απλή σύνδεση, χωρίς πρόσβαση στο admin panel. Προεπιλογή για νέους λογαριασμούς.'],
    ],
  ),

  h2('4.2 Λίστες που χρειαζόμαστε από εσάς'),
  p('Οι τιμές των ακόλουθων πεδίων θα προέλθουν από εσάς. Δεν θα τις δημιουργήσουμε μόνοι μας, σύμφωνα με την οδηγία σας «αν δεν ξέρεις, ρώτησε».'),
  simpleTable(
    [2600, 3200, 3226],
    ['Πεδίο', 'Παραδείγματα που γνωρίζουμε', 'Τι χρειαζόμαστε'],
    [
      ['Περιοχές', 'Ήπειρος, Πελοπόννησος, Ιόνιο, Αιγαίο, Πόντος, Κύπρος, Κρήτη, Θεσσαλία, Θράκη', 'Πλήρη λίστα με σύντομο κωδικό (π.χ. EPE) και ονομασία'],
      ['Υποπεριοχές', 'Θεσπρωτία (Ήπειρος)', 'Όλες, με γονικές περιοχές'],
      ['Επί μέρους Υποπ.', '(όσες έχετε ψηφιοποιήσει)', 'Ό,τι έχετε — δέχεται σταδιακή συμπλήρωση'],
      ['Νησιά', 'Θάσος, Ικαρία', 'Λίστα με γονική περιοχή'],
      ['Κατηγορίες', 'κλέφτικο, μοιρολόι, γαμήλιο', 'Πλήρη λίστα + σύντομη περιγραφή (για tooltip)'],
      ['Ρυθμοί', 'τρεχάτος, καλαματιανός', 'Λίστα + κείμενο παραρτήματος όπου υπάρχει'],
      ['Χοροί', 'καλαματιανός, τσάμικος, πεντοζάλι', 'Απλή λίστα ονομασιών'],
      ['Γλώσσες', 'Ελληνικά, Ποντιακά, Τουρκικά, Αρβανίτικα', 'Λίστα γλωσσών που θα εμφανίζονται'],
    ],
  ),
  p('Οποιαδήποτε μορφή σας βολεύει: Excel, Word, plain text, ή και μια λίστα γραμμένη χειρόγραφα την οποία θα ψηφιοποιήσουμε.'),
];

// ---------- Section 5 ----------

const section5 = [
  h1('5. Διάταξη ιστοσελίδας'),
  h2('5.1 Δημόσια σελίδα'),
  p('Η διάταξη ακολουθεί το σκαρίφημα που μας στείλατε. Αριστερά τα φίλτρα, κέντρο ο χάρτης, δεξιά το πάνελ τραγουδιού, κάτω τα παραρτήματα.'),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 200 },
    children: [
      txt('Πλήρες σκαρίφημα HTML με προσομοιωμένα δεδομένα στο Παράρτημα — §9 ή ζωντανά: ', {
        size: 18, italics: true, color: C.stone,
      }),
      txt(WIREFRAMES_URL, { size: 18, color: C.ink, underline: {} }),
    ],
  }),
  ...imagePara('vaggelis-layout.png', 560, 380, 'Σχήμα 2 — Διάταξη δημόσιας σελίδας (κατά το σκαρίφημα σας).'),
  p('Συμπεριφορά χάρτη: αρχικά όλες οι περιοχές φαίνονται χρωματισμένες. Κλικ σε περιοχή εστιάζει σε αυτήν, αποκρύπτει τις άλλες και εμφανίζει τις υποπεριοχές και τα χωριά της. Ο μετρητής «11/15» στο πάνελ δείχνει ποιο από τα φιλτραρισμένα τραγούδια βλέπετε, με βέλη για προηγούμενο / επόμενο. Το πάνελ παραμένει ορατό ακόμα και αν το τρέχον τραγούδι δεν ανήκει στα τρέχοντα φίλτρα.'),
  h2('5.2 Πίνακας διαχείρισης (admin)'),
  p('Οι σελίδες που θα χρησιμοποιείτε εσείς:'),
  bullet('/admin — σύνοψη (σύνολα τραγουδιών, πρόσφατες αλλαγές, σημεία που λείπει ήχος ή κατηγορία).'),
  bullet('/admin/songs — λίστα τραγουδιών με φίλτρα και φόρμες επεξεργασίας.'),
  bullet('/admin/regions, /admin/subregions, /admin/villages — γεωγραφία, με εργαλείο σχεδίασης και επεξεργασίας πολυγώνων απευθείας στον χάρτη.'),
  bullet('/admin/categories, /admin/rhythms, /admin/dances, /admin/languages, /admin/appendices — αναφορικές λίστες.'),
  bullet('/admin/import — μαζική εισαγωγή από Excel/XLSX ή ZIP (προεπισκόπηση πριν επιβεβαίωση).'),
  bullet('/admin/activity — πλήρες ιστορικό αλλαγών (ποιος άλλαξε τι, πότε).'),
];

// ---------- Section 6 ----------

const section6 = [
  h1('6. Ροή ανεβάσματος ήχου'),
  p('Η διαδικασία από τη δική σας πλευρά είναι πέντε βήματα:'),
  ...imagePara('vaggelis-audio.png', 640, 120, 'Σχήμα 3 — Ανέβασμα ηχητικού αρχείου (απλοποιημένο).'),
  numbered('Ανοίγετε το τραγούδι στο admin panel.'),
  numbered('Σέρνετε το αρχείο MP3, M4A ή OGG πάνω στο πεδίο ήχου.'),
  numbered('Το σύστημα ανεβάζει το αρχείο στον server με ένδειξη προόδου.'),
  numbered('Μόλις ολοκληρωθεί, το αρχείο συνδέεται αυτόματα με το τραγούδι στη βάση.'),
  numbered('Εμφανίζεται player για να ακούσετε αμέσως ότι ανέβηκε σωστά.'),
  p('Περιορισμοί για λόγους απόδοσης και προστασίας: ανώτατο μέγεθος 15 MB ανά αρχείο (επαρκές για ~15 λεπτά σε 128 kbps), αποδεκτές μορφές MP3 / M4A / OGG. Μέχρι να ορίσετε άδεια χρήσης (βλ. §4.1), ο ήχος δεν προβάλλεται δημόσια — προστατευτική προεπιλογή.'),
];

// ---------- Section 7 ----------

function questionBlock(n, title, body) {
  return [
    new Paragraph({
      spacing: { before: 240, after: 120 },
      children: [
        txt(`${n}. `, { size: 22, bold: true, color: C.ink }),
        txt(title, { size: 22, bold: true, color: C.ink }),
      ],
    }),
    new Paragraph({
      spacing: { after: 120, line: 330 },
      alignment: AlignmentType.JUSTIFIED,
      children: [txt(body, { size: 22, color: C.charcoal })],
    }),
  ];
}

const section7 = [
  h1('7. Ερωτήσεις προς εσάς'),
  p('Δίπλα σε κάθε ερώτηση υπάρχει η πρότασή μας — αρκεί να επιβεβαιώσετε ή να αντιπροτείνετε. Οι ερωτήσεις ομαδοποιούνται κατά επείγον: οι (Α) μπλοκάρουν την έναρξη της υλοποίησης.'),

  h2('Α. Απαραίτητα για την έναρξη'),
  ...questionBlock('1', 'Μετονομασία «Επί μέρους υποπεριοχή».',
    'Είχατε αναφέρει την ανάγκη καλύτερης ονομασίας. Σκεφτήκαμε: «Τοπική ενότητα», «Επαρχία» (ιστορική έννοια), ή δική σας πρόταση. Ποιο προτιμάτε;'),
  ...questionBlock('2', 'Πλήρεις λίστες κανονικών τιμών.',
    'Χρειαζόμαστε: Περιοχές, Υποπεριοχές, Επί μέρους Υποπεριοχές (όσες υπάρχουν), Νησιά, Κατηγορίες, Ρυθμοί, Χοροί, Γλώσσες — σε οποιαδήποτε μορφή (§4.2).'),
  ...questionBlock('3', 'Άδεια δημοσίευσης ήχου ανά τραγούδι.',
    'Αποδέχεστε το μοντέλο 7 τιμών (§4.1); Υπάρχει προεπιλογή που θα εφαρμοστεί σε όλα (π.χ. CC BY-NC 4.0 με αναφορά σε εσάς / Ε.Κ.Π.Α.); Εναλλακτικά, χαρακτηρίζετε κάθε τραγούδι ξεχωριστά.'),
  ...questionBlock('4', 'Άδεια χρήσης ιστοσελίδας (περιγραφές, σχόλια, μεταδεδομένα).',
    'Προτείνουμε Creative Commons Αναφορά – Μη Εμπορική 4.0 (CC BY-NC 4.0), με αναφορά στον Ε. Σπύρου / Τμήμα Γεωλογίας Ε.Κ.Π.Α. Συμφωνείτε;'),

  h2('Β. Λειτουργικότητα'),
  ...questionBlock('5', 'Μέγιστος αριθμός κατηγοριών ανά τραγούδι.',
    'Είχατε προτείνει 1–3 με σειρά (πρωτεύουσα, δευτερεύουσα, τριτεύουσα). Κρατάμε αυτό, ή προτιμάτε απεριόριστες «ετικέτες» χωρίς κατάταξη; Το ranking είναι χρήσιμο για την UI (πρώτη κατηγορία σε πίνακες σύνοψης)· οι ετικέτες είναι πιο ευέλικτες όταν ένα τραγούδι είναι, π.χ., ισότιμα «μοιρολόι» και «γαμήλιο».'),
  ...questionBlock('6', 'Διάταξη πάνελ τραγουδιού: στοίβα ή πίνακας;',
    'Είχατε αναφέρει πίνακα. Λόγω της ανομοιογένειας των πεδίων (κείμενο, στίχοι, ήχος, λίστες, παραπομπές) προτείνουμε κάθετη στοίβα με ενότητες. Θα εξετάσετε την πρώτη έκδοση πριν οριστικοποιηθεί.'),
  ...questionBlock('7', 'Σειρά φίλτρων.',
    'Είχατε προτείνει γεωγραφικά πρώτα. Σκέψη: πολλοί χρήστες ψάχνουν πρώτα Κατηγορία ή Γλώσσα («μοιρολόγια», «ποντιακά»). Προτείνουμε: Περιοχή — Κατηγορία — Γλώσσα — Ρυθμός — Χορός — Τίτλος — Λέξεις-κλειδιά. Εναλλακτικά, κρατάμε τη δική σας σειρά.'),
  ...questionBlock('8', 'Εύρος αναζήτησης λέξεων-κλειδιών.',
    'Θα ψάχνει σε Περιγραφή + Στίχους + Σχόλια ταυτόχρονα. Θέλετε επιπλέον επιλογή περιορισμού («Όλα / Στίχοι / Περιγραφή / Σχόλια»), ή μόνο ενοποιημένη αναζήτηση για απλότητα;'),
  ...questionBlock('9', 'Πολλαπλές παραπομπές στο ίδιο ζεύγος τραγουδιών.',
    'Μπορεί ένα ζεύγος τραγουδιών να συνδέεται με πολλαπλούς τύπους παραπομπής (π.χ. μελωδική ΚΑΙ στιχουργική); Προτείνουμε ναι, με ξεχωριστές καταχωρήσεις.'),
  ...questionBlock('10', 'Τραγούδια που ανήκουν σε περισσότερες από μία περιοχές.',
    'Περίπτωση τραγουδιών προσφύγων (π.χ. Πόντιοι στη Μακεδονία). Ο κανόνας «ακριβώς μία περιοχή ανά τραγούδι» ισχύει αυστηρά, ή χρειάζεται μία «κύρια» περιοχή και μία λίστα «σχετικών»; Ο κωδικός θα παραμείνει σταθερός (§11).'),

  h2('Γ. Τεχνικές επιλογές που σας αφορούν'),
  ...questionBlock('11', 'Σταθερότητα κωδικών τραγουδιών.',
    'Προτείνουμε ότι ο κωδικός (π.χ. EPE-THS-001) δημιουργείται μια φορά και δεν αλλάζει ποτέ, ακόμα κι αν μεταφέρετε το τραγούδι σε άλλη υποπεριοχή. Έτσι προστατεύονται οι επιστημονικές παραπομπές σε δημοσιεύσεις.'),
  ...questionBlock('12', 'Domain και χρόνος εγκατάστασης.',
    'Ποιο domain θα χρησιμοποιηθεί και σε τι χρονικό ορίζοντα αναμένεται η εγκατάσταση DNS που αναφέρατε;'),
  ...questionBlock('13', 'Υποστήριξη κινητού / tablet.',
    'Χρειάζεται να λειτουργεί άνετα και σε κινητό / tablet (για πεδίο), ή πρώτη έκδοση desktop-first είναι αποδεκτή; Η δεύτερη είναι σημαντικά φθηνότερη και γρηγορότερη.'),

  h2('Δ. Προαιρετικά / μελλοντικά'),
  ...questionBlock('14', 'Δημιουργία παραπομπής για επιστημονική χρήση.',
    'Κουμπί «Παραπομπή σε αυτό το τραγούδι» που δίνει έτοιμη μορφή APA / MLA / Chicago. Αξίζει από την αρχή;'),
  ...questionBlock('15', 'Εξαγωγή αποτελεσμάτων σε CSV / JSON.',
    'Για ερευνητές που θέλουν να εξάγουν δεδομένα φιλτραρισμένα. Άμεσα ή σε μεταγενέστερη φάση;'),
  ...questionBlock('16', 'Εκτυπώσιμη έκδοση σελίδας τραγουδιού.',
    'PDF-ready όψη της σελίδας για ερευνητές που θέλουν να εκτυπώσουν ή να αρχειοθετήσουν.'),
];

// ---------- Section 8 ----------

// ---------- Section 9: Wireframes appendix ----------

const section9 = [
  h1('9. Παράρτημα — Ζωντανά σκαριφήματα UI'),
  p('Παρακάτω παρουσιάζονται όλες οι κύριες όψεις της εφαρμογής σε χαμηλής πιστότητας σκαριφήματα HTML. Είναι αυτόνομες σελίδες — μπορείτε να τις δείτε στατικά εδώ ή ζωντανά (με δυνατότητα κλικ) στον σύνδεσμο που ακολουθεί.'),
  new Paragraph({
    spacing: { before: 80, after: 240 },
    children: [
      txt('Ζωντανός σύνδεσμος: ', { size: 22, color: C.charcoal }),
      txt(WIREFRAMES_URL, { size: 22, color: C.ink, underline: {} }),
    ],
  }),

  h2('9.1 Αρχική σελίδα'),
  p('Τρεις στήλες: φίλτρα αριστερά, χάρτης στο κέντρο (με γενικές πληροφορίες πάνω), πάνελ τραγουδιού δεξιά. Παραρτήματα κάτω. Όλα ορατά χωρίς κύλιση στην οθόνη.'),
  ...wireframePara('vaggelis-layout.png', 'Σχήμα 9.1 — Δημόσια αρχική σελίδα', '/'),

  h2('9.2 Σελίδα τραγουδιού'),
  p('Αυτόνομη όψη με μόνιμο σύνδεσμο για επιστημονική παραπομπή. Περιλαμβάνει τίτλο, εναλλακτικό τίτλο, περιγραφή, ηχητικό αρχείο με player, στίχους κεντραρισμένους, σχόλια, και πλευρικό πίνακα με ιδιότητες, πηγές και παραπομπές σε συναφή τραγούδια.'),
  ...wireframePara('vaggelis-song-detail.png', 'Σχήμα 9.2 — Σελίδα τραγουδιού (permalink)', '/songs/[code]'),

  h2('9.3 Εκδοτικές σελίδες (Σχετικά / Μέθοδοι)'),
  p('Πρότυπο για τις σελίδες που εξηγούν το αρχείο — σκοπός, κριτήρια συμπερίληψης, δομή, άδειες χρήσης. Καθαρή τυπογραφία με κεφάλαια, lede, υποσημειώσεις.'),
  ...wireframePara('vaggelis-editorial.png', 'Σχήμα 9.3 — Εκδοτική σελίδα', '/about · /methods'),

  h2('9.4 Ταμπλό διαχείρισης'),
  p('Η πρώτη σελίδα όταν συνδέεστε ως διαχειριστής. Σύνοψη: συνολικά τραγούδια, περιοχές, ηχητικά αρχεία, παραπομπές. Πρόσφατες αλλαγές, εκκρεμότητες (π.χ. τραγούδια χωρίς ήχο), χάρτης κάλυψης, γρήγορες ενέργειες.'),
  ...wireframePara('vaggelis-admin-dashboard.png', 'Σχήμα 9.4 — Ταμπλό διαχείρισης', '/admin'),

  h2('9.5 Λίστα τραγουδιών'),
  p('Πίνακας με όλα τα τραγούδια. Φιλτράρισμα κατά περιοχή, υποπεριοχή, κατηγορία, ρυθμό, χορό, γλώσσα. Αναζήτηση κειμένου σε στίχους / περιγραφή / σχόλια. Κουκίδες κατάστασης (ήχος / στίχοι / κατηγορία) ανά γραμμή. Μαζικές ενέργειες σε επιλεγμένα.'),
  ...wireframePara('vaggelis-admin-songs-list.png', 'Σχήμα 9.5 — Λίστα τραγουδιών (admin)', '/admin/songs'),

  h2('9.6 Επεξεργασία τραγουδιού'),
  p('Φόρμα διαχωρισμένη σε έξι καρτέλες: Βασικά (τίτλος, γεωγραφία), Κείμενα (περιγραφή, στίχοι, σχόλια — Markdown), Κατηγορίες (έως 3 με σειρά), Πηγές (βιβλιογραφία/σύνδεσμοι/αρχεία), Ήχος (ανέβασμα + άδεια), Παραπομπές (σύνδεση με άλλα τραγούδια). Πλευρικός πίνακας με κατάσταση και κουμπιά αποθήκευσης.'),
  ...wireframePara('vaggelis-admin-song-edit.png', 'Σχήμα 9.6 — Επεξεργασία τραγουδιού', '/admin/songs/[id]'),

  h2('9.7 Επεξεργαστής περιοχών'),
  p('Σχεδίαση και επεξεργασία πολυγώνων απευθείας πάνω στον χάρτη με leaflet-geoman: σχεδίαση, μετακίνηση κορυφών, διαίρεση, συγχώνευση, snapping. Πλευρικός πίνακας με ιδιότητες (κωδικός, ονομασίες, χρώμα, εμβαδόν) και ιστορικό αλλαγών με δυνατότητα αναίρεσης.'),
  ...wireframePara('vaggelis-admin-region-editor.png', 'Σχήμα 9.7 — Επεξεργαστής περιοχών', '/admin/regions'),

  spacer(240),
  divider(),
  p('Όλα τα παραπάνω είναι σκαριφήματα προς συζήτηση — όχι τελική σχεδίαση. Κάθε λεπτομέρεια (διάταξη, χρώματα, τυπογραφία, κείμενα-εικονικά) μπορεί να αλλάξει σύμφωνα με τη γνώμη σας. Ο σκοπός τους είναι να συμφωνήσουμε στη γενική κατεύθυνση πριν γραφτεί η πρώτη γραμμή κώδικα.'),
];

// ---------- Section 8 ----------

const section8 = [
  h1('8. Επόμενα βήματα'),
  numbered('Συνάντηση (όπως προτείνατε) για να συζητήσουμε τις ερωτήσεις Α που μπλοκάρουν την έναρξη.'),
  numbered('Αποστολή των κανονικών λιστών (§4.2) σε οποιαδήποτε μορφή σας βολεύει.'),
  numbered('Έναρξη υλοποίησης — σκελετός εφαρμογής, βάση δεδομένων, κενό admin panel. Εκτιμώμενος χρόνος: 1 εβδομάδα μετά τη συνάντηση.'),
  numbered('Εισαγωγή δειγματικών δεδομένων (τραγούδια Θεσσαλονίκης από το αρχείο που μοιραστήκατε).'),
  numbered('Πρώτη ιδιωτική επίδειξη σε σύνδεσμο προεπισκόπησης για δοκιμή από εσάς. Επανάληψη του κύκλου ανά φάση.'),

  spacer(360),
  divider(),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 240, after: 60 },
    children: [txt('Με εκτίμηση,', { size: 22, color: C.charcoal, italics: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 240, after: 0 },
    children: [txt('Αλέξανδρος Π. Λιάσκος', { size: 22, bold: true, color: C.ink })],
  }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 0, after: 0 },
    children: [txt('alexliaskos@geol.uoa.gr', { size: 20, color: C.slate })],
  }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 0, after: 0 },
    children: [txt('22 Απριλίου 2026', { size: 18, color: C.ash })],
  }),
];

// ---------- Document ----------

const doc = new Document({
  creator: 'Αλέξανδρος Π. Λιάσκος',
  title: 'Σημείωμα Σχεδιασμού — Ταξίδι στην Παράδοση',
  description: 'Σημείωμα σχεδιασμού WebGIS για τον Επιστημονικό Υπεύθυνο Ευάγγελο Σπύρου',
  styles: {
    default: {
      document: { run: { font: FONT, size: 22, color: C.charcoal } },
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FONT, size: 36, bold: true, color: C.ink },
        paragraph: { spacing: { before: 480, after: 240 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FONT, size: 26, bold: true, color: C.ink },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 1 },
      },
      {
        id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FONT, size: 22, bold: true, color: C.charcoal },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: 'numbers',
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  sections: [
    // Cover section — no footer
    {
      properties: { page: { size: A4, margin: MARGIN } },
      children: cover,
    },
    // Main content section — with footer and page numbers
    {
      properties: { page: { size: A4, margin: MARGIN } },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              txt('Ταξίδι στην Παράδοση   ·   Σημείωμα Σχεδιασμού   ·   σελ. ', { size: 16, color: C.ash }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: C.ash, font: FONT }),
              txt(' / ', { size: 16, color: C.ash }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: C.ash, font: FONT }),
            ],
          })],
        }),
      },
      children: [
        ...toc,
        ...section1,
        ...section2,
        ...section3,
        ...section4,
        ...section5,
        ...section6,
        ...section7,
        ...section8,
        new Paragraph({ children: [new PageBreak()] }),
        ...section9,
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUTPUT, buffer);
  const kb = (buffer.length / 1024).toFixed(1);
  console.log(`Wrote ${OUTPUT} (${kb} KB)`);
});
