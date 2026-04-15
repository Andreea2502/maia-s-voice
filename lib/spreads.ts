// Mystic App — Tarot Spread Definitions
// All available reading formats, organized by category

export type SpreadCategory = 'daily' | 'decisions' | 'love' | 'depth';

export interface SpreadPosition {
  id: number;
  label: string;         // shown on card position
  question: string;      // what this position answers
}

export interface Spread {
  id: string;
  category: SpreadCategory;
  icon: string;
  title: string;
  subtitle: string;        // short teaser
  cardCount: number;
  durationMin: number;     // approximate reading time in minutes
  positions: SpreadPosition[];
  promptHint: string;      // injected into AI prompt
  isPremium: boolean;      // locked for free users
  isNew?: boolean;
  isBestseller?: boolean;
}

// ─────────────────────────────────────────────────────────────
// TÄGLICH
// ─────────────────────────────────────────────────────────────
const DAILY_SPREADS: Spread[] = [
  {
    id: 'day_card',
    category: 'daily',
    icon: '☀️',
    title: 'Tageskarte',
    subtitle: 'Ein täglicher Impuls in 2 Minuten',
    cardCount: 1,
    durationMin: 2,
    isPremium: false,
    isBestseller: true,
    positions: [
      { id: 1, label: 'Dein Tag', question: 'Welche Energie begleitet mich heute?' },
    ],
    promptHint: 'Eine Karte als täglicher Spiegel. Kurz, klar, persönlich.',
  },
  {
    id: 'morning_ritual',
    category: 'daily',
    icon: '🌅',
    title: 'Morgenritual',
    subtitle: 'Energie, Herausforderung, Geschenk',
    cardCount: 3,
    durationMin: 5,
    isPremium: false,
    positions: [
      { id: 1, label: 'Energie',         question: 'Welche Energie begleitet mich heute?' },
      { id: 2, label: 'Herausforderung', question: 'Was gilt es heute zu meistern?' },
      { id: 3, label: 'Geschenk',        question: 'Was hält der Tag für mich bereit?' },
    ],
    promptHint: 'Tagesausrichtung. Ermutigung ohne Versprechen.',
  },
  {
    id: 'week_ahead',
    category: 'daily',
    icon: '🗓',
    title: 'Wochenausblick',
    subtitle: 'Eine Karte für jeden Tag',
    cardCount: 7,
    durationMin: 10,
    isPremium: true,
    positions: [
      { id: 1, label: 'Montag',     question: 'Energie am Montag' },
      { id: 2, label: 'Dienstag',   question: 'Energie am Dienstag' },
      { id: 3, label: 'Mittwoch',   question: 'Energie am Mittwoch' },
      { id: 4, label: 'Donnerstag', question: 'Energie am Donnerstag' },
      { id: 5, label: 'Freitag',    question: 'Energie am Freitag' },
      { id: 6, label: 'Samstag',    question: 'Energie am Samstag' },
      { id: 7, label: 'Sonntag',    question: 'Energie am Sonntag' },
    ],
    promptHint: 'Jede Karte steht für einen Tag. Muster und Bögen aufzeigen.',
  },
];

// ─────────────────────────────────────────────────────────────
// FRAGEN & ENTSCHEIDUNGEN
// ─────────────────────────────────────────────────────────────
const DECISION_SPREADS: Spread[] = [
  {
    id: 'yes_no',
    category: 'decisions',
    icon: '◎',
    title: 'Ja / Nein Orakel',
    subtitle: 'Eine klare Tendenz für eine Frage',
    cardCount: 1,
    durationMin: 2,
    isPremium: false,
    positions: [
      { id: 1, label: 'Orakel', question: 'Was zeigt die Energie dieser Frage?' },
    ],
    promptHint: 'Keine eindeutige Ja/Nein-Aussage — Tendenz und Energie zeigen.',
  },
  {
    id: 'clarity_mirror',
    category: 'decisions',
    icon: '🔍',
    title: 'Klarheitsspiegel',
    subtitle: 'Was sehe ich, was nicht, was brauche ich',
    cardCount: 3,
    durationMin: 6,
    isPremium: false,
    isNew: true,
    positions: [
      { id: 1, label: 'Was ich sehe',       question: 'Was erkenne ich in dieser Situation?' },
      { id: 2, label: 'Was ich nicht sehe', question: 'Was verberge ich vor mir selbst?' },
      { id: 3, label: 'Was ich brauche',    question: 'Welche Energie brauche ich jetzt?' },
    ],
    promptHint: 'Blinde Flecken aufzeigen. Sanft, nicht konfrontativ.',
  },
  {
    id: 'decision_cross',
    category: 'decisions',
    icon: '⚖️',
    title: 'Entscheidungskreuz',
    subtitle: 'Zwei Wege, eine Wurzel, ein Ergebnis',
    cardCount: 5,
    durationMin: 8,
    isPremium: true,
    positions: [
      { id: 1, label: 'Weg A',      question: 'Energie und Folgen von Weg A' },
      { id: 2, label: 'Weg B',      question: 'Energie und Folgen von Weg B' },
      { id: 3, label: 'Wurzel',     question: 'Was liegt dieser Entscheidung zugrunde?' },
      { id: 4, label: 'Was hilft',  question: 'Welche Ressource unterstützt mich?' },
      { id: 5, label: 'Ergebnis',   question: 'Wohin führt dieser Weg langfristig?' },
    ],
    promptHint: 'Beide Wege würdigen. Kein Urteil, nur Energie und Tendenz zeigen.',
  },
  {
    id: 'new_beginning',
    category: 'decisions',
    icon: '🌱',
    title: 'Neue Energie',
    subtitle: 'Was loslassen, was aufbauen, was kommt',
    cardCount: 3,
    durationMin: 5,
    isPremium: false,
    positions: [
      { id: 1, label: 'Loslassen', question: 'Was darf ich loslassen?' },
      { id: 2, label: 'Aufbauen',  question: 'Was soll ich jetzt stärken?' },
      { id: 3, label: 'Einladen', question: 'Welche neue Energie möchte kommen?' },
    ],
    promptHint: 'Neuanfänge ohne Versprechen. Ermutigung.',
  },
];

// ─────────────────────────────────────────────────────────────
// LIEBE & BEZIEHUNGEN
// ─────────────────────────────────────────────────────────────
const LOVE_SPREADS: Spread[] = [
  {
    id: 'love_reading',
    category: 'love',
    icon: '❤️',
    title: 'Tarot der Liebe',
    subtitle: 'Ich, du, zwischen uns, Hindernis, Potenzial',
    cardCount: 5,
    durationMin: 10,
    isPremium: false,
    isBestseller: true,
    positions: [
      { id: 1, label: 'Ich',          question: 'Welche Energie bringe ich in diese Verbindung?' },
      { id: 2, label: 'Du',           question: 'Welche Energie bringt die andere Person?' },
      { id: 3, label: 'Zwischen uns', question: 'Was verbindet oder trennt uns gerade?' },
      { id: 4, label: 'Hindernis',    question: 'Was steht dieser Verbindung im Weg?' },
      { id: 5, label: 'Potenzial',    question: 'Was ist das Potenzial dieser Verbindung?' },
    ],
    promptHint: 'Liebesfragen mit Würde behandeln. Keine Zukunftsversprechen.',
  },
  {
    id: 'single_energy',
    category: 'love',
    icon: '🌸',
    title: 'Single-Energie',
    subtitle: 'Wo stehst du, was blockiert, was kommt',
    cardCount: 3,
    durationMin: 6,
    isPremium: false,
    positions: [
      { id: 1, label: 'Wo ich stehe',    question: 'Meine aktuelle Liebesenergie' },
      { id: 2, label: 'Was blockiert',   question: 'Was hält mich zurück?' },
      { id: 3, label: 'Was sich öffnet', question: 'Welche neue Energie will kommen?' },
    ],
    promptHint: 'Singles stärken, nicht bemitleiden. Keine Vorhersagen.',
  },
  {
    id: 'soul_connection',
    category: 'love',
    icon: '✨',
    title: 'Seelenverbindung',
    subtitle: 'Zwei Energien im Spiegel',
    cardCount: 2,
    durationMin: 4,
    isPremium: false,
    isNew: true,
    positions: [
      { id: 1, label: 'Meine Seele',   question: 'Was bring ich in diese Verbindung?' },
      { id: 2, label: 'Deine Seele',   question: 'Was bringt die andere Seele?' },
    ],
    promptHint: 'Zwei Energien verbinden. Komplementarität zeigen.',
  },
  {
    id: 'relationship_cross',
    category: 'love',
    icon: '💫',
    title: 'Beziehungskreuz',
    subtitle: 'Vollständige Beziehungsanalyse',
    cardCount: 6,
    durationMin: 12,
    isPremium: true,
    positions: [
      { id: 1, label: 'Fundament',   question: 'Was ist das Fundament dieser Beziehung?' },
      { id: 2, label: 'Gegenwart',   question: 'Wo stehen wir jetzt?' },
      { id: 3, label: 'Herz',        question: 'Was ist das Herzstück dieser Verbindung?' },
      { id: 4, label: 'Herausforderung', question: 'Was gilt es gemeinsam zu meistern?' },
      { id: 5, label: 'Ich brauche', question: 'Was brauche ich in dieser Beziehung?' },
      { id: 6, label: 'Potenzial',   question: 'Wohin kann diese Verbindung wachsen?' },
    ],
    promptHint: 'Tiefgehende Beziehungsanalyse. Stärken und Wachstum betonen.',
  },
];

// ─────────────────────────────────────────────────────────────
// TIEFGANG & LEBENSWEG
// ─────────────────────────────────────────────────────────────
const DEPTH_SPREADS: Spread[] = [
  {
    id: 'celtic_cross',
    category: 'depth',
    icon: '✦',
    title: 'Keltisches Kreuz',
    subtitle: 'Die umfassendste Legung — 10 Karten',
    cardCount: 10,
    durationMin: 20,
    isPremium: true,
    isBestseller: true,
    positions: [
      { id: 1,  label: 'Gegenwart',      question: 'Aktuelle Situation' },
      { id: 2,  label: 'Kreuzendes',     question: 'Was hilft oder hindert' },
      { id: 3,  label: 'Krone',          question: 'Ziel oder ideales Ergebnis' },
      { id: 4,  label: 'Fundament',      question: 'Wurzel des Problems' },
      { id: 5,  label: 'Vergangenheit',  question: 'Was liegt hinter mir' },
      { id: 6,  label: 'Zukunft',        question: 'Was kommt als nächstes auf mich zu' },
      { id: 7,  label: 'Ich',            question: 'Meine aktuelle Haltung' },
      { id: 8,  label: 'Umfeld',         question: 'Externe Einflüsse' },
      { id: 9,  label: 'Hoffnungen',     question: 'Meine Hoffnungen und Ängste' },
      { id: 10, label: 'Ergebnis',       question: 'Mögliches Ergebnis' },
    ],
    promptHint: 'Das große Bild zeigen. Muster verbinden. Keine Prophezeiungen.',
  },
  {
    id: 'moon_phases',
    category: 'depth',
    icon: '🌙',
    title: 'Mondphasen-Legung',
    subtitle: 'Loslassen, Wachsen, Vollenden, Erneuern',
    cardCount: 4,
    durationMin: 8,
    isPremium: false,
    isNew: true,
    positions: [
      { id: 1, label: 'Loslassen',  question: 'Was bittet der abnehmende Mond mich loszulassen?' },
      { id: 2, label: 'Wachsen',    question: 'Was darf ich im zunehmenden Mond kultivieren?' },
      { id: 3, label: 'Vollenden',  question: 'Was erreicht seinen Höhepunkt beim Vollmond?' },
      { id: 4, label: 'Erneuern',   question: 'Welche Saat lege ich beim Neumond?' },
    ],
    promptHint: 'Mondzyklen als Lebensrhythmus. Naturverbunden und poetisch.',
  },
  {
    id: 'soul_mirror',
    category: 'depth',
    icon: '🪞',
    title: 'Seelenspiegel',
    subtitle: 'Wer bin ich wirklich, was verstecke ich, was will meine Seele',
    cardCount: 3,
    durationMin: 8,
    isPremium: true,
    positions: [
      { id: 1, label: 'Wer ich bin',       question: 'Meine tiefste wahre Natur' },
      { id: 2, label: 'Was ich verberge',  question: 'Was verstecke ich vor mir und anderen?' },
      { id: 3, label: 'Was meine Seele will', question: 'Mein tiefster Wunsch, mein Seelenauftrag' },
    ],
    promptHint: 'Tiefpsychologisch aber sanft. Schatten würdevoll ansprechen.',
  },
  {
    id: 'year_arc',
    category: 'depth',
    icon: '🌀',
    title: 'Jahresbogen',
    subtitle: 'Eine Karte für jeden Monat',
    cardCount: 12,
    durationMin: 25,
    isPremium: true,
    positions: Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      label: ['Januar','Februar','März','April','Mai','Juni',
              'Juli','August','September','Oktober','November','Dezember'][i],
      question: `Energie und Thema im ${['Januar','Februar','März','April','Mai','Juni',
                                          'Juli','August','September','Oktober','November','Dezember'][i]}`,
    })),
    promptHint: 'Jahresrhythmus und Bogen zeigen. Saisonale Themen einweben.',
  },
  {
    id: 'karma_roots',
    category: 'depth',
    icon: '🌳',
    title: 'Karma & Wurzeln',
    subtitle: 'Woher ich komme, was ich trage, was ich löse',
    cardCount: 5,
    durationMin: 12,
    isPremium: true,
    positions: [
      { id: 1, label: 'Woher ich komme',   question: 'Prägende Energie aus Vergangenheit/Familie' },
      { id: 2, label: 'Was ich trage',     question: 'Welches Muster begleitet mich?' },
      { id: 3, label: 'Die Lektion',       question: 'Was soll ich in diesem Leben lernen?' },
      { id: 4, label: 'Was sich löst',     question: 'Welches Muster darf ich jetzt loslassen?' },
      { id: 5, label: 'Neue Wurzel',       question: 'Was entsteht, wenn ich mich befreie?' },
    ],
    promptHint: 'Karmische Muster ohne Esoterik-Kitsch. Psychologisch tiefgründig.',
  },
  {
    id: 'chakra_mirror',
    category: 'depth',
    icon: '🔮',
    title: 'Chakra-Spiegel',
    subtitle: 'Energie in allen 7 Zentren',
    cardCount: 7,
    durationMin: 15,
    isPremium: true,
    positions: [
      { id: 1, label: 'Wurzelchakra',   question: 'Sicherheit, Erdung, Überleben' },
      { id: 2, label: 'Sakralchakra',   question: 'Kreativität, Sexualität, Emotionen' },
      { id: 3, label: 'Solarplexus',    question: 'Kraft, Selbstwert, Wille' },
      { id: 4, label: 'Herzchakra',     question: 'Liebe, Mitgefühl, Verbindung' },
      { id: 5, label: 'Halschakra',     question: 'Ausdruck, Wahrheit, Kommunikation' },
      { id: 6, label: 'Drittes Auge',   question: 'Intuition, Klarheit, Weisheit' },
      { id: 7, label: 'Kronenchakra',   question: 'Spiritualität, Bewusstsein, Verbindung' },
    ],
    promptHint: 'Chakra-System als psychologische Landkarte. Nicht esoterisch dogmatisch.',
  },
];

// ─────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────
export const ALL_SPREADS: Spread[] = [
  ...DAILY_SPREADS,
  ...DECISION_SPREADS,
  ...LOVE_SPREADS,
  ...DEPTH_SPREADS,
];

export const SPREADS_BY_CATEGORY: Record<SpreadCategory, Spread[]> = {
  daily:     DAILY_SPREADS,
  decisions: DECISION_SPREADS,
  love:      LOVE_SPREADS,
  depth:     DEPTH_SPREADS,
};

export const CATEGORY_META: Record<SpreadCategory, { label: string; icon: string; description: string }> = {
  daily:     { label: 'Täglich',              icon: '☀️', description: 'Schnelle tägliche Impulse' },
  decisions: { label: 'Fragen & Klarheit',    icon: '🔍', description: 'Entscheidungen und Orientierung' },
  love:      { label: 'Liebe & Beziehungen',  icon: '❤️', description: 'Verbindungen und Gefühle' },
  depth:     { label: 'Tiefgang',             icon: '✦',  description: 'Lebensweg und Selbsterkenntnis' },
};

export function getSpreadById(id: string): Spread | undefined {
  return ALL_SPREADS.find((s) => s.id === id);
}

export function getFreeSpread(): Spread[] {
  return ALL_SPREADS.filter((s) => !s.isPremium);
}
