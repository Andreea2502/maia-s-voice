/**
 * Tarot card definitions — 78 cards with Supabase Storage URLs.
 *
 * IMAGE STORAGE:
 *   Supabase Storage → bucket: "tarot-cards" (public)
 *   Path: tarot-cards/major/00-the-fool.jpg
 *         tarot-cards/minor/cups/01-ace-of-cups.jpg
 *
 * Once you upload your Midjourney images, replace SUPABASE_URL below
 * with your actual Supabase project URL (from .env.local).
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const BASE = `${SUPABASE_URL}/storage/v1/object/public/tarot-cards`;

function img(path: string): string {
  return `${BASE}/${path}`;
}

export type CardSuit = 'cups' | 'wands' | 'swords' | 'pentacles';
export type CardArcana = 'major' | 'minor';

export interface TarotCard {
  id: string;               // e.g. "major_00", "cups_01"
  arcana: CardArcana;
  suit?: CardSuit;
  number: number;           // major: 0-21, minor: 1-14
  nameDE: string;
  nameEN: string;
  imageUrl: string;
  keywords: string[];
  meaningUpright: string;
  meaningReversed: string;
  element?: string;
  planet?: string;
}

// ─── Major Arcana (22 cards) ────────────────────────────────────────────────
export const MAJOR_ARCANA: TarotCard[] = [
  {
    id: 'major_00', arcana: 'major', number: 0,
    nameDE: 'Der Narr', nameEN: 'The Fool',
    imageUrl: img('major/00-the-fool.jpg'),
    keywords: ['Neubeginn', 'Spontaneität', 'Vertrauen', 'Unschuld'],
    meaningUpright: 'Ein neuer Anfang voller Möglichkeiten. Vertraue dem Leben und wage den Sprung.',
    meaningReversed: 'Unüberlegte Entscheidungen, Naivität, fehlende Richtung.',
    planet: 'Uranus', element: 'Luft',
  },
  {
    id: 'major_01', arcana: 'major', number: 1,
    nameDE: 'Der Magier', nameEN: 'The Magician',
    imageUrl: img('major/01-the-magician.jpg'),
    keywords: ['Willenskraft', 'Manifestation', 'Ressourcen', 'Kreativität'],
    meaningUpright: 'Du hast alles, was du brauchst. Nutze deine Fähigkeiten um deine Ziele zu manifestieren.',
    meaningReversed: 'Manipulation, ungenutzte Talente, fehlende Konzentration.',
    planet: 'Merkur', element: 'Alle vier',
  },
  {
    id: 'major_02', arcana: 'major', number: 2,
    nameDE: 'Die Hohepriesterin', nameEN: 'The High Priestess',
    imageUrl: img('major/02-the-high-priestess.jpg'),
    keywords: ['Intuition', 'Unterbewusstsein', 'Geheimnis', 'inneres Wissen'],
    meaningUpright: 'Vertraue deiner inneren Stimme. Die Antwort liegt bereits in dir.',
    meaningReversed: 'Ignorierte Intuition, verborgene Informationen, oberflächliches Wissen.',
    planet: 'Mond', element: 'Wasser',
  },
  {
    id: 'major_03', arcana: 'major', number: 3,
    nameDE: 'Die Herrscherin', nameEN: 'The Empress',
    imageUrl: img('major/03-the-empress.jpg'),
    keywords: ['Fülle', 'Fruchtbarkeit', 'Natur', 'Mutterliebe'],
    meaningUpright: 'Schöpferische Kraft, Fürsorge und Wachstum. Eine Zeit des Wohlstands und der Verbundenheit.',
    meaningReversed: 'Abhängigkeit, Kreativitätsmangel, Vernachlässigung.',
    planet: 'Venus', element: 'Erde',
  },
  {
    id: 'major_04', arcana: 'major', number: 4,
    nameDE: 'Der Herrscher', nameEN: 'The Emperor',
    imageUrl: img('major/04-the-emperor.jpg'),
    keywords: ['Autorität', 'Struktur', 'Stabilität', 'Vaterenergie'],
    meaningUpright: 'Feste Grundlagen, Führungskraft und Disziplin führen dich zum Ziel.',
    meaningReversed: 'Tyrannei, Inflexibilität, Kontrollverlust.',
    planet: 'Mars', element: 'Feuer',
  },
  {
    id: 'major_05', arcana: 'major', number: 5,
    nameDE: 'Der Hierophant', nameEN: 'The Hierophant',
    imageUrl: img('major/05-the-hierophant.jpg'),
    keywords: ['Tradition', 'Lehre', 'Konvention', 'spirituelle Führung'],
    meaningUpright: 'Suche Rat bei Bewährtem. Spirituelles Lernen und Zugehörigkeit zu einer Gemeinschaft.',
    meaningReversed: 'Dogmatismus, Rebellion gegen Tradition, Heuchelei.',
    planet: 'Venus', element: 'Erde',
  },
  {
    id: 'major_06', arcana: 'major', number: 6,
    nameDE: 'Die Liebenden', nameEN: 'The Lovers',
    imageUrl: img('major/06-the-lovers.jpg'),
    keywords: ['Liebe', 'Harmonie', 'Entscheidung', 'Werte'],
    meaningUpright: 'Tiefe Verbundenheit und eine wichtige Entscheidung, die aus dem Herzen kommt.',
    meaningReversed: 'Fehlkommunikation, Wertekonflikt, falsche Wahl.',
    planet: 'Merkur', element: 'Luft',
  },
  {
    id: 'major_07', arcana: 'major', number: 7,
    nameDE: 'Der Wagen', nameEN: 'The Chariot',
    imageUrl: img('major/07-the-chariot.jpg'),
    keywords: ['Kontrolle', 'Willenskraft', 'Sieg', 'Zielstrebigkeit'],
    meaningUpright: 'Mit Disziplin und Fokus überwindest du Hindernisse und erreichst dein Ziel.',
    meaningReversed: 'Kontrollverlust, Aggression, Ziellosigkeit.',
    planet: 'Mond', element: 'Wasser',
  },
  {
    id: 'major_08', arcana: 'major', number: 8,
    nameDE: 'Die Kraft', nameEN: 'Strength',
    imageUrl: img('major/08-strength.jpg'),
    keywords: ['Mut', 'Sanftheit', 'innere Stärke', 'Geduld'],
    meaningUpright: 'Wahre Stärke zeigt sich in Mitgefühl und Sanftheit, nicht in Gewalt.',
    meaningReversed: 'Selbstzweifel, Kontrollverlust, innere Schwäche.',
    planet: 'Sonne', element: 'Feuer',
  },
  {
    id: 'major_09', arcana: 'major', number: 9,
    nameDE: 'Der Eremit', nameEN: 'The Hermit',
    imageUrl: img('major/09-the-hermit.jpg'),
    keywords: ['Einsamkeit', 'innere Suche', 'Weisheit', 'Rückzug'],
    meaningUpright: 'Eine Phase der Selbstreflexion und inneren Einkehr führt zu echter Weisheit.',
    meaningReversed: 'Isolation, Sturheit, unnötige Einsamkeit.',
    planet: 'Merkur', element: 'Erde',
  },
  {
    id: 'major_10', arcana: 'major', number: 10,
    nameDE: 'Das Rad des Schicksals', nameEN: 'Wheel of Fortune',
    imageUrl: img('major/10-wheel-of-fortune.jpg'),
    keywords: ['Schicksal', 'Wandel', 'Zyklen', 'Glück'],
    meaningUpright: 'Das Rad dreht sich — nach jedem Tief kommt ein Hoch. Vertraue dem Zyklus.',
    meaningReversed: 'Pech, Widerstand gegen Veränderung, schlechtes Timing.',
    planet: 'Jupiter', element: 'Feuer',
  },
  {
    id: 'major_11', arcana: 'major', number: 11,
    nameDE: 'Die Gerechtigkeit', nameEN: 'Justice',
    imageUrl: img('major/11-justice.jpg'),
    keywords: ['Wahrheit', 'Ausgewogenheit', 'Recht', 'Karma'],
    meaningUpright: 'Was du aussäst, das erntest du. Entscheidungen werden mit Klarheit und Fairness getroffen.',
    meaningReversed: 'Ungerechtigkeit, Unehrlichkeit, Ungleichgewicht.',
    planet: 'Venus', element: 'Luft',
  },
  {
    id: 'major_12', arcana: 'major', number: 12,
    nameDE: 'Der Gehängte', nameEN: 'The Hanged Man',
    imageUrl: img('major/12-the-hanged-man.jpg'),
    keywords: ['Pause', 'Opfer', 'neue Perspektive', 'Loslassen'],
    meaningUpright: 'Manchmal muss man innehalten und aus einer anderen Perspektive schauen.',
    meaningReversed: 'Martyrium, Stagnation, Widerstand gegen das Loslassen.',
    planet: 'Neptun', element: 'Wasser',
  },
  {
    id: 'major_13', arcana: 'major', number: 13,
    nameDE: 'Der Tod', nameEN: 'Death',
    imageUrl: img('major/13-death.jpg'),
    keywords: ['Transformation', 'Wandel', 'Ende', 'Neubeginn'],
    meaningUpright: 'Kein Ende ohne Neubeginn. Eine tiefe Transformation bahnt sich an.',
    meaningReversed: 'Widerstand gegen Veränderung, Festhalten am Alten.',
    planet: 'Pluto', element: 'Wasser',
  },
  {
    id: 'major_14', arcana: 'major', number: 14,
    nameDE: 'Die Mäßigkeit', nameEN: 'Temperance',
    imageUrl: img('major/14-temperance.jpg'),
    keywords: ['Gleichgewicht', 'Geduld', 'Heilung', 'Harmonie'],
    meaningUpright: 'Balance und Mäßigung führen zu innerem Frieden und Heilung.',
    meaningReversed: 'Extreme, Ungeduld, fehlende Balance.',
    planet: 'Jupiter', element: 'Feuer',
  },
  {
    id: 'major_15', arcana: 'major', number: 15,
    nameDE: 'Der Teufel', nameEN: 'The Devil',
    imageUrl: img('major/15-the-devil.jpg'),
    keywords: ['Schatten', 'Bindung', 'Materialismus', 'Besessenheit'],
    meaningUpright: 'Erkenne die Ketten, die dich halten — viele davon hast du selbst angelegt.',
    meaningReversed: 'Befreiung, Selbstbewusstsein, Ablegen von Abhängigkeiten.',
    planet: 'Saturn', element: 'Erde',
  },
  {
    id: 'major_16', arcana: 'major', number: 16,
    nameDE: 'Der Turm', nameEN: 'The Tower',
    imageUrl: img('major/16-the-tower.jpg'),
    keywords: ['Zusammenbruch', 'Offenbarung', 'Chaos', 'Erneuerung'],
    meaningUpright: 'Was auf falschen Fundamenten steht, bricht zusammen — um Platz für Neues zu machen.',
    meaningReversed: 'Nahender Zusammenbruch, Vermeidung von Veränderung.',
    planet: 'Mars', element: 'Feuer',
  },
  {
    id: 'major_17', arcana: 'major', number: 17,
    nameDE: 'Der Stern', nameEN: 'The Star',
    imageUrl: img('major/17-the-star.jpg'),
    keywords: ['Hoffnung', 'Heilung', 'Inspiration', 'Segen'],
    meaningUpright: 'Nach dem Sturm kommt die Ruhe. Du wirst geheilt und von der Welt gesegnet.',
    meaningReversed: 'Hoffnungslosigkeit, Enttäuschung, Verlust des Glaubens.',
    planet: 'Uranus', element: 'Luft',
  },
  {
    id: 'major_18', arcana: 'major', number: 18,
    nameDE: 'Der Mond', nameEN: 'The Moon',
    imageUrl: img('major/18-the-moon.jpg'),
    keywords: ['Illusion', 'Angst', 'Unbewusstes', 'Intuition'],
    meaningUpright: 'Die Dinge sind nicht, was sie scheinen. Vertraue deiner Intuition im Nebel.',
    meaningReversed: 'Verwirrung löst sich, Klarheit kommt, Täuschung aufgedeckt.',
    planet: 'Neptun', element: 'Wasser',
  },
  {
    id: 'major_19', arcana: 'major', number: 19,
    nameDE: 'Die Sonne', nameEN: 'The Sun',
    imageUrl: img('major/19-the-sun.jpg'),
    keywords: ['Freude', 'Erfolg', 'Vitalität', 'Klarheit'],
    meaningUpright: 'Licht, Freude und Erfolg. Eine der positivsten Karten des Decks.',
    meaningReversed: 'Temporäre Wolken, gedämpfte Begeisterung, übertriebeher Optimismus.',
    planet: 'Sonne', element: 'Feuer',
  },
  {
    id: 'major_20', arcana: 'major', number: 20,
    nameDE: 'Das Gericht', nameEN: 'Judgement',
    imageUrl: img('major/20-judgement.jpg'),
    keywords: ['Erneuerung', 'Rückblick', 'Entscheidung', 'Absolution'],
    meaningUpright: 'Eine innere Abrechnung führt zur Befreiung. Du wirst zu einem höheren Selbst gerufen.',
    meaningReversed: 'Selbstzweifel, Verleugnung, unfaire Selbstkritik.',
    planet: 'Pluto', element: 'Feuer',
  },
  {
    id: 'major_21', arcana: 'major', number: 21,
    nameDE: 'Die Welt', nameEN: 'The World',
    imageUrl: img('major/21-the-world.jpg'),
    keywords: ['Vollendung', 'Integration', 'Erfolg', 'Ganzheit'],
    meaningUpright: 'Du hast einen Zyklus vollendet. Feiere diesen Abschluss und die Ganzheit, die du erlangt hast.',
    meaningReversed: 'Unvollendetes, fehlende Vollendung, Abkürzungen.',
    planet: 'Saturn', element: 'Erde',
  },
];

// ─── Minor Arcana — helper ──────────────────────────────────────────────────
function minor(
  suit: CardSuit,
  number: number,
  nameDE: string,
  nameEN: string,
  keywords: string[],
  upright: string,
  reversed: string
): TarotCard {
  const pad = String(number).padStart(2, '0');
  const slug = nameEN.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return {
    id: `${suit}_${pad}`,
    arcana: 'minor',
    suit,
    number,
    nameDE,
    nameEN,
    imageUrl: img(`minor/${suit}/${pad}-${slug}.jpg`),
    keywords,
    meaningUpright: upright,
    meaningReversed: reversed,
  };
}

export const CUPS: TarotCard[] = [
  minor('cups', 1,  'Ass der Kelche',    'Ace of Cups',    ['Liebe','neue Gefühle','Intuition'],      'Ein neues Gefühl öffnet sich wie eine Blüte.',   'Emotionale Blockade, unterdrückte Gefühle.'),
  minor('cups', 2,  'Zwei der Kelche',   'Two of Cups',    ['Partnerschaft','Verbindung','Harmonie'],  'Tiefe gegenseitige Verbindung und Zuneigung.',   'Ungleichgewicht, Trennung, Missverständnis.'),
  minor('cups', 3,  'Drei der Kelche',   'Three of Cups',  ['Feier','Gemeinschaft','Freude'],          'Freude teilen und feiern mit geliebten Menschen.','Übermaß, Isolation, Vernachlässigung.'),
  minor('cups', 4,  'Vier der Kelche',   'Four of Cups',   ['Langeweile','Rückzug','Grübeln'],         'Innenschau und Neubeurteilung deiner Gefühle.',  'Neue Chancen öffnen sich, Motivation kehrt zurück.'),
  minor('cups', 5,  'Fünf der Kelche',   'Five of Cups',   ['Verlust','Trauer','Bedauern'],            'Ein Verlust schmerzt — doch es bleibt noch etwas.','Akzeptanz, Heilung, vorwärts gehen.'),
  minor('cups', 6,  'Sechs der Kelche',  'Six of Cups',    ['Nostalgie','Kindheit','Unschuld'],        'Schöne Erinnerungen und reine Herzensfreude.',   'Festhalten an der Vergangenheit, Naivität.'),
  minor('cups', 7,  'Sieben der Kelche', 'Seven of Cups',  ['Illusion','Wahl','Fantasie'],             'Viele Möglichkeiten — bleib geerdet bei der Wahl.','Klarheit, entschlossene Entscheidung.'),
  minor('cups', 8,  'Acht der Kelche',   'Eight of Cups',  ['Aufbruch','Suche','Loslassen'],           'Es ist Zeit, das Vertraute zu verlassen.',        'Zögern, aus Angst bleiben.'),
  minor('cups', 9,  'Neun der Kelche',   'Nine of Cups',   ['Zufriedenheit','Wunscherfüllung','Glück'],'Dein Herzenwunsch erfüllt sich.',                 'Selbstzufriedenheit, materielle Ausrichtung.'),
  minor('cups', 10, 'Zehn der Kelche',   'Ten of Cups',    ['Harmonie','Familie','Erfüllung'],         'Tiefes Glück in Beziehungen und Zuhause.',        'Brüche in der Familie, mangelnde Harmonie.'),
  minor('cups', 11, 'Bube der Kelche',   'Page of Cups',   ['Kreativität','Botschaft','Träumerei'],    'Eine kreative Botschaft oder Eingebung trifft ein.','Unreife Gefühle, emotionale Manipulation.'),
  minor('cups', 12, 'Ritter der Kelche', 'Knight of Cups', ['Romantik','Charme','Abenteuer'],          'Romantischer Schwung und Ideale leiten dich.',    'Launenhaftigkeit, Unrealismus.'),
  minor('cups', 13, 'Königin der Kelche','Queen of Cups',  ['Einfühlsamkeit','Intuition','Fürsorge'],  'Tiefes emotionales Verständnis und Mitgefühl.',   'Emotionale Unsicherheit, Co-Abhängigkeit.'),
  minor('cups', 14, 'König der Kelche',  'King of Cups',   ['Reife','Ruhe','emotionale Stärke'],       'Emotionale Reife und weises, mitfühlendes Handeln.','Emotionale Manipulation, Instabilität.'),
];

export const WANDS: TarotCard[] = [
  minor('wands', 1,  'Ass der Stäbe',    'Ace of Wands',    ['Inspiration','Energie','Neubeginn'],      'Zündender Funke — ein neues kreatives Projekt beginnt.','Blockade, fehlende Energie.'),
  minor('wands', 2,  'Zwei der Stäbe',   'Two of Wands',    ['Planung','Zukunft','Mut'],                 'Du blickst in die Ferne und planst deinen nächsten Schritt.','Angst vor dem Unbekannten.'),
  minor('wands', 3,  'Drei der Stäbe',   'Three of Wands',  ['Expansion','Fortschritt','Weitblick'],     'Deine Pläne tragen erste Früchte. Halte den Horizont im Blick.','Verzögerungen, fehlende Langzeitplanung.'),
  minor('wands', 4,  'Vier der Stäbe',   'Four of Wands',   ['Feier','Heimat','Harmonie'],               'Feiern, Ankommen, eine stabile Grundlage genießen.',    'Verschobene Feier, häusliche Spannung.'),
  minor('wands', 5,  'Fünf der Stäbe',   'Five of Wands',   ['Konflikt','Konkurrenz','Chaos'],           'Produktive Reibung — nutze den Wettbewerb als Antrieb.',  'Unnötige Konflikte, Chaos.'),
  minor('wands', 6,  'Sechs der Stäbe',  'Six of Wands',    ['Sieg','Anerkennung','Erfolg'],             'Öffentliche Anerkennung und Erfolg nach harter Arbeit.',  'Selbstüberschätzung, fehlende Anerkennung.'),
  minor('wands', 7,  'Sieben der Stäbe', 'Seven of Wands',  ['Verteidigung','Ausdauer','Mut'],           'Halte deinen Standpunkt — du hast einen Vorteil.',        'Aufgeben, Überwältigtsein.'),
  minor('wands', 8,  'Acht der Stäbe',   'Eight of Wands',  ['Bewegung','Schnelligkeit','Nachrichten'],  'Alles geht schnell voran. Gute Neuigkeiten im Anflug.',   'Verzögerungen, schlechtes Timing.'),
  minor('wands', 9,  'Neun der Stäbe',   'Nine of Wands',   ['Ausdauer','Stärke','Schutz'],              'Fast am Ziel — halte durch, trotz Müdigkeit.',            'Erschöpfung, Paranoia.'),
  minor('wands', 10, 'Zehn der Stäbe',   'Ten of Wands',    ['Bürde','Verantwortung','Erschöpfung'],     'Zu viel aufgenommen — es ist Zeit abzugeben.',            'Kollaps, zu viel auf einmal.'),
  minor('wands', 11, 'Bube der Stäbe',   'Page of Wands',   ['Abenteuer','Energie','Neugier'],           'Frische Energie und Abenteuerlust treiben dich an.',      'Energie ohne Richtung, Impulsivität.'),
  minor('wands', 12, 'Ritter der Stäbe', 'Knight of Wands', ['Abenteuerlust','Feuer','Kühnheit'],        'Voller Feuereifer in Richtung Ziel — schnell und mutig.',  'Rücksichtslosigkeit, Frustration.'),
  minor('wands', 13, 'Königin der Stäbe','Queen of Wands',  ['Zuversicht','Charisma','Unabhängigkeit'],  'Charismatisch, leidenschaftlich, selbstsicher.',          'Dominanz, Eifersucht.'),
  minor('wands', 14, 'König der Stäbe',  'King of Wands',   ['Vision','Führung','Entschlossenheit'],     'Visionäre Führungskraft mit natürlicher Autorität.',      'Impulsive Entscheidungen, Tyrannei.'),
];

export const SWORDS: TarotCard[] = [
  minor('swords', 1,  'Ass der Schwerter',    'Ace of Swords',    ['Klarheit','Wahrheit','Durchbruch'],      'Geistige Klarheit und Wahrheit durchbricht den Nebel.',   'Falsche Überzeugungen, Verwirrung.'),
  minor('swords', 2,  'Zwei der Schwerter',   'Two of Swords',    ['Pattsituation','Entscheidung','Balance'], 'Eine schwierige Entscheidung steht an — du musst hinsehen.',  'Lügen aufgedeckt, zu langes Zögern.'),
  minor('swords', 3,  'Drei der Schwerter',   'Three of Swords',  ['Herzschmerz','Verlust','Schmerz'],        'Schmerz und Trauer gehören zum Leben — lass sie zu.',     'Heilung, Vergebung, Schmerz überunden.'),
  minor('swords', 4,  'Vier der Schwerter',   'Four of Swords',   ['Ruhe','Erholung','Meditation'],           'Rückzug und Erholung sind jetzt notwendig.',              'Rastlosigkeit, Überarbeitung.'),
  minor('swords', 5,  'Fünf der Schwerter',   'Five of Swords',   ['Konflikt','Niederlage','Hohlsieg'],       'Nicht jeder Sieg ist es wert.',                           'Frieden nach Konflikt, Wiedergutmachung.'),
  minor('swords', 6,  'Sechs der Schwerter',  'Six of Swords',    ['Übergang','Heilung','Vorwärtsbewegung'],  'Du bewegst dich weg von Turbulenzen in ruhigeres Gewässer.','Festhalten, Schwierigkeiten beim Loslassen.'),
  minor('swords', 7,  'Sieben der Schwerter', 'Seven of Swords',  ['Täuschung','List','Strategie'],           'Taktisches Vorgehen — aber pass auf vor Unehrlichkeit.',  'Betrüger entlarvt, Schuldgefühle.'),
  minor('swords', 8,  'Acht der Schwerter',   'Eight of Swords',  ['Gefangenschaft','Begrenzung','Angst'],    'Du hältst dich selbst gefangen — die Befreiung liegt in dir.','Befreiung, neue Perspektive.'),
  minor('swords', 9,  'Neun der Schwerter',   'Nine of Swords',   ['Angst','Albträume','Sorgen'],             'Nächtliche Ängste sind oft schlimmer als die Realität.',  'Hoffnung kehrt zurück, Heilung.'),
  minor('swords', 10, 'Zehn der Schwerter',   'Ten of Swords',    ['Niederlage','Ende','Zusammenbruch'],      'Das Ende eines Zyklus — dunkel, aber notwendig.',         'Erholung, Neubeginn, Heilung.'),
  minor('swords', 11, 'Bube der Schwerter',   'Page of Swords',   ['Neugier','Kommunikation','Wachheit'],     'Geistige Agilität und Neugierde — frag, lerne, erkunde.', 'Klatsch, übermäßige Kritik.'),
  minor('swords', 12, 'Ritter der Schwerter', 'Knight of Swords', ['Entschlossenheit','Ehrgeiz','Tatkraft'],  'Voller Entschlossenheit voran — aber mit Bedacht.',       'Impulsivität, Rücksichtslosigkeit.'),
  minor('swords', 13, 'Königin der Schwerter','Queen of Swords',  ['Unabhängigkeit','Klarheit','Direktheit'], 'Scharfer Verstand, direkte Kommunikation, klare Grenzen.',  'Bitterkeit, Kälte.'),
  minor('swords', 14, 'König der Schwerter',  'King of Swords',   ['Autorität','Ethik','Intellekt'],          'Intellektuelle Führung und ethisches Handeln.',           'Manipulation, Tyrannei.'),
];

export const PENTACLES: TarotCard[] = [
  minor('pentacles', 1,  'Ass der Pentakel',    'Ace of Pentacles',    ['Wohlstand','Neubeginn','Chancen'],     'Eine neue materielle Chance oder finanzieller Neubeginn.','Verpasste Gelegenheit, Instabilität.'),
  minor('pentacles', 2,  'Zwei der Pentakel',   'Two of Pentacles',    ['Balance','Anpassung','Jonglieren'],   'Mehrere Dinge gleichzeitig im Gleichgewicht halten.',    'Überforderung, Unorganisiertheit.'),
  minor('pentacles', 3,  'Drei der Pentakel',   'Three of Pentacles',  ['Teamarbeit','Handwerk','Lernen'],     'Kompetenz und Teamarbeit führen zu soliden Ergebnissen.','Fehlende Zusammenarbeit, mittelmäßige Arbeit.'),
  minor('pentacles', 4,  'Vier der Pentakel',   'Four of Pentacles',   ['Sicherheit','Kontrolle','Geiz'],      'Festhalten an Sicherheit — aber ist es zu viel?',         'Loslassen, Großzügigkeit, Verlust.'),
  minor('pentacles', 5,  'Fünf der Pentakel',   'Five of Pentacles',   ['Armut','Isolation','Verlust'],        'Materielle Not — aber du bist nicht allein.',             'Erholung, spirituelle Reichtum.'),
  minor('pentacles', 6,  'Sechs der Pentakel',  'Six of Pentacles',    ['Großzügigkeit','Geben','Empfangen'],  'Geben und Nehmen in Balance.',                           'Schulden, Ungleichgewicht in der Großzügigkeit.'),
  minor('pentacles', 7,  'Sieben der Pentakel', 'Seven of Pentacles',  ['Geduld','Bestandsaufnahme','Wachstum'],'Halte inne und bewerte deinen Fortschritt.',             'Ungeduld, fehlende Langzeitplanung.'),
  minor('pentacles', 8,  'Acht der Pentakel',   'Eight of Pentacles',  ['Fleiß','Handwerk','Fokus'],           'Meisterschaft durch Übung und Hingabe.',                 'Perfektionismus, fehlende Motivation.'),
  minor('pentacles', 9,  'Neun der Pentakel',   'Nine of Pentacles',   ['Luxus','Unabhängigkeit','Selbstgenüge'],'Materieller Erfolg durch eigene Kraft.',                'Scheinerfolg, Überabhängigkeit.'),
  minor('pentacles', 10, 'Zehn der Pentakel',   'Ten of Pentacles',    ['Erbe','Familie','Wohlstand'],         'Dauerhafter Wohlstand und familiäre Stabilität.',        'Familienkonflikte um Erbe.'),
  minor('pentacles', 11, 'Bube der Pentakel',   'Page of Pentacles',   ['Lernen','Ehrgeiz','Neustart'],        'Praktischer Lernender mit großen Träumen.',              'Träumerei ohne Handeln.'),
  minor('pentacles', 12, 'Ritter der Pentakel', 'Knight of Pentacles', ['Routine','Beständigkeit','Methodik'], 'Zuverlässig, methodisch, ausdauernd.',                   'Sturheit, Langeweile.'),
  minor('pentacles', 13, 'Königin der Pentakel','Queen of Pentacles',  ['Fürsorge','Praktizismus','Natur'],    'Erdende, fürsorgliche Energie verbunden mit der Natur.',  'Selbstvernachlässigung, materielle Fixierung.'),
  minor('pentacles', 14, 'König der Pentakel',  'King of Pentacles',   ['Wohlstand','Führung','Stabilität'],   'Stabiler, erfolgreicher Anführer mit solider Grundlage.','Gier, Sturheit, Materialismus.'),
];

// ─── Full deck ────────────────────────────────────────────────────────────────
export const ALL_CARDS: TarotCard[] = [
  ...MAJOR_ARCANA,
  ...CUPS,
  ...WANDS,
  ...SWORDS,
  ...PENTACLES,
];

export function getCardById(id: string): TarotCard | undefined {
  return ALL_CARDS.find((c) => c.id === id);
}

export function drawCards(count: number): TarotCard[] {
  const shuffled = [...ALL_CARDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((card) => ({
    ...card,
    // Random orientation
    orientation: Math.random() > 0.25 ? 'upright' : 'reversed',
  } as any));
}
