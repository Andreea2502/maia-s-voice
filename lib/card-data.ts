import { CardLibraryEntry } from '@/types/card';

// Major Arcana (22 cards)
export const MAJOR_ARCANA: CardLibraryEntry[] = [
  {
    id: 'major_00_fool',
    arcana: 'major',
    number: 0,
    nameTranslations: { de: 'Der Narr', en: 'The Fool', ar: 'المهرج', tr: 'Deli', hi: 'मूर्ख' },
    meaningUpright: {
      de: 'Neubeginn, Spontaneität, Freiheit, Abenteuer, Offenheit',
      en: 'New beginnings, spontaneity, freedom, adventure, openness',
    },
    meaningReversed: {
      de: 'Leichtsinn, Naivität, Risiko, Unvorsichtigkeit',
      en: 'Recklessness, naivety, risk, carelessness',
    },
    keywords: {
      de: ['Freiheit', 'Neubeginn', 'Abenteuer', 'Vertrauen'],
      en: ['Freedom', 'New beginning', 'Adventure', 'Trust'],
    },
    visualDescription:
      'A young figure stands at the edge of a cliff, looking upward with a small bag on a stick, a white rose in hand, and a small dog at their heels.',
  },
  {
    id: 'major_01_magician',
    arcana: 'major',
    number: 1,
    nameTranslations: { de: 'Der Magier', en: 'The Magician', ar: 'الساحر', tr: 'Büyücü' },
    meaningUpright: {
      de: 'Willenskraft, Geschicklichkeit, Manifestation, Resourcennutzung',
      en: 'Will power, skill, manifestation, resourcefulness',
    },
    meaningReversed: {
      de: 'Manipulation, schlechte Planung, ungenutzte Talente',
      en: 'Manipulation, poor planning, untapped talents',
    },
    keywords: { de: ['Wille', 'Können', 'Manifestation'], en: ['Will', 'Skill', 'Manifestation'] },
    visualDescription:
      'A figure stands behind a table with all four suit symbols, one arm raised holding a wand, the other pointing down. An infinity symbol hovers above.',
  },
  {
    id: 'major_02_high_priestess',
    arcana: 'major',
    number: 2,
    nameTranslations: { de: 'Die Hohepriesterin', en: 'The High Priestess', ar: 'الكاهنة العظيمة', tr: 'Büyük Rahibe' },
    meaningUpright: {
      de: 'Intuition, inneres Wissen, Stille, Mysterium, Unterbewusstsein',
      en: 'Intuition, inner knowledge, stillness, mystery, subconscious',
    },
    meaningReversed: {
      de: 'Ignorierte Intuition, verborgenem Wissen, Geheimnisse',
      en: 'Ignored intuition, hidden knowledge, secrets',
    },
    keywords: { de: ['Intuition', 'Stille', 'Weisheit'], en: ['Intuition', 'Stillness', 'Wisdom'] },
    visualDescription: 'A serene figure sits between two pillars, holding a scroll, with a crescent moon at her feet.',
  },
  {
    id: 'major_03_empress',
    arcana: 'major',
    number: 3,
    nameTranslations: { de: 'Die Herrscherin', en: 'The Empress', ar: 'الإمبراطورة', tr: 'İmparatoriçe' },
    meaningUpright: {
      de: 'Fruchtbarkeit, Natur, Schöpfung, Mutterschaft, Überfluss',
      en: 'Fertility, nature, creation, motherhood, abundance',
    },
    meaningReversed: {
      de: 'Abhängigkeit, Kreativitätsblockade, Vernachlässigung',
      en: 'Dependence, creative block, neglect',
    },
    keywords: { de: ['Fülle', 'Natur', 'Schöpfung'], en: ['Abundance', 'Nature', 'Creation'] },
    visualDescription: 'A lush figure sits on a throne in a fertile landscape, crowned with stars, surrounded by wheat and a waterfall.',
  },
  {
    id: 'major_04_emperor',
    arcana: 'major',
    number: 4,
    nameTranslations: { de: 'Der Herrscher', en: 'The Emperor', ar: 'الإمبراطور', tr: 'İmparator' },
    meaningUpright: {
      de: 'Autorität, Struktur, Stabilität, Führung, Väterlichkeit',
      en: 'Authority, structure, stability, leadership, fatherhood',
    },
    meaningReversed: {
      de: 'Dominanz, Starrheit, Kontrolle, mangelnde Flexibilität',
      en: 'Dominance, rigidity, control, lack of flexibility',
    },
    keywords: { de: ['Autorität', 'Struktur', 'Stabilität'], en: ['Authority', 'Structure', 'Stability'] },
    visualDescription: 'An imposing figure sits on a stone throne with ram-head armrests, holding an ankh scepter, wearing a red robe.',
  },
  {
    id: 'major_05_hierophant',
    arcana: 'major',
    number: 5,
    nameTranslations: { de: 'Der Hierophant', en: 'The Hierophant', ar: 'الحبر الأعظم', tr: 'Din Adamı' },
    meaningUpright: {
      de: 'Tradition, Spiritualität, Konvention, institutionelle Weisheit',
      en: 'Tradition, spirituality, convention, institutional wisdom',
    },
    meaningReversed: { de: 'Rebellion, Dogma, Freigeistigkeit', en: 'Rebellion, dogma, free-thinking' },
    keywords: { de: ['Tradition', 'Glaube', 'Weisheit'], en: ['Tradition', 'Faith', 'Wisdom'] },
    visualDescription: 'A religious figure sits between two pillars, making a blessing gesture, with two supplicants kneeling before him.',
  },
  {
    id: 'major_06_lovers',
    arcana: 'major',
    number: 6,
    nameTranslations: { de: 'Die Liebenden', en: 'The Lovers', ar: 'العشاق', tr: 'Aşıklar' },
    meaningUpright: {
      de: 'Liebe, Harmonie, Entscheidung, Werte, Partnerschaft',
      en: 'Love, harmony, decision, values, partnership',
    },
    meaningReversed: {
      de: 'Fehlentscheidung, Disharmonie, Wertekonflikte',
      en: 'Poor decision, disharmony, value conflicts',
    },
    keywords: { de: ['Liebe', 'Entscheidung', 'Verbindung'], en: ['Love', 'Decision', 'Connection'] },
    visualDescription: 'Two figures stand beneath an angel with outstretched wings, one before a fruit tree, the other before a flaming tree.',
  },
  {
    id: 'major_07_chariot',
    arcana: 'major',
    number: 7,
    nameTranslations: { de: 'Der Wagen', en: 'The Chariot', ar: 'المركبة', tr: 'Savaş Arabası' },
    meaningUpright: {
      de: 'Willenskraft, Kontrolle, Sieg, Entschlossenheit, Disziplin',
      en: 'Will power, control, victory, determination, discipline',
    },
    meaningReversed: { de: 'Kontrollverlust, Aggressivität, Richtungslosigkeit', en: 'Loss of control, aggression, lack of direction' },
    keywords: { de: ['Sieg', 'Wille', 'Disziplin'], en: ['Victory', 'Will', 'Discipline'] },
    visualDescription: 'An armored figure stands in a chariot pulled by two sphinxes, holding a wand, crowned with stars.',
  },
  {
    id: 'major_08_strength',
    arcana: 'major',
    number: 8,
    nameTranslations: { de: 'Die Kraft', en: 'Strength', ar: 'القوة', tr: 'Güç' },
    meaningUpright: {
      de: 'Innere Stärke, Mut, Mitgefühl, Geduld, Sanftheit',
      en: 'Inner strength, courage, compassion, patience, gentleness',
    },
    meaningReversed: { de: 'Selbstzweifel, Schwäche, mangelndes Vertrauen', en: 'Self-doubt, weakness, lack of confidence' },
    keywords: { de: ['Stärke', 'Mut', 'Mitgefühl'], en: ['Strength', 'Courage', 'Compassion'] },
    visualDescription: 'A figure gently holds open the jaws of a lion, with an infinity symbol above, wearing white robes and a floral crown.',
  },
  {
    id: 'major_09_hermit',
    arcana: 'major',
    number: 9,
    nameTranslations: { de: 'Der Eremit', en: 'The Hermit', ar: 'الناسك', tr: 'Keşiş' },
    meaningUpright: {
      de: 'Innenschau, Einsamkeit, Führung, innere Suche, Rückzug',
      en: 'Soul searching, solitude, guidance, introspection, withdrawal',
    },
    meaningReversed: { de: 'Isolation, Einsamkeit, Ablehnung von Führung', en: 'Isolation, loneliness, rejection of guidance' },
    keywords: { de: ['Stille', 'Innenschau', 'Weisheit'], en: ['Stillness', 'Introspection', 'Wisdom'] },
    visualDescription: 'An old figure stands on a mountaintop in grey robes, holding a lantern and a staff.',
  },
  {
    id: 'major_10_wheel',
    arcana: 'major',
    number: 10,
    nameTranslations: { de: 'Das Rad des Schicksals', en: 'Wheel of Fortune', ar: 'عجلة الحظ', tr: 'Kader Çarkı' },
    meaningUpright: {
      de: 'Glück, Karma, Wendepunkte, Schicksal, Lebenszyklen',
      en: 'Good luck, karma, turning point, fate, life cycles',
    },
    meaningReversed: { de: 'Pech, Widerstand gegen Veränderung, Kontrollverlust', en: 'Bad luck, resistance to change, loss of control' },
    keywords: { de: ['Wandel', 'Schicksal', 'Zyklus'], en: ['Change', 'Fate', 'Cycle'] },
    visualDescription: 'A large wheel with symbolic figures is surrounded by four winged beings reading books in the corners.',
  },
  {
    id: 'major_11_justice',
    arcana: 'major',
    number: 11,
    nameTranslations: { de: 'Die Gerechtigkeit', en: 'Justice', ar: 'العدالة', tr: 'Adalet' },
    meaningUpright: {
      de: 'Fairness, Wahrheit, Gesetz, Ursache und Wirkung, Ausgeglichenheit',
      en: 'Fairness, truth, law, cause and effect, balance',
    },
    meaningReversed: { de: 'Ungerechtigkeit, Unehrlichkeit, Unbalance', en: 'Injustice, dishonesty, imbalance' },
    keywords: { de: ['Gerechtigkeit', 'Wahrheit', 'Balance'], en: ['Justice', 'Truth', 'Balance'] },
    visualDescription: 'A robed figure sits on a throne holding scales and a sword upright, wearing a crown.',
  },
  {
    id: 'major_12_hanged_man',
    arcana: 'major',
    number: 12,
    nameTranslations: { de: 'Der Gehängte', en: 'The Hanged Man', ar: 'المشنوق', tr: 'Asılan Adam' },
    meaningUpright: {
      de: 'Pause, Loslassen, neue Perspektiven, Opferbereitschaft',
      en: 'Pause, letting go, new perspectives, sacrifice',
    },
    meaningReversed: { de: 'Festhalten, Verzögerung, mangelndes Opfer', en: 'Stalling, holding on, lack of sacrifice' },
    keywords: { de: ['Pause', 'Loslassen', 'Perspektive'], en: ['Pause', 'Release', 'Perspective'] },
    visualDescription: 'A figure hangs upside down from one foot on a T-shaped cross made of living wood, with a serene expression.',
  },
  {
    id: 'major_13_death',
    arcana: 'major',
    number: 13,
    nameTranslations: { de: 'Der Tod', en: 'Death', ar: 'الموت', tr: 'Ölüm' },
    meaningUpright: {
      de: 'Wandel, Transformation, Übergänge, Abschlüsse, Neubeginn',
      en: 'Change, transformation, transitions, endings, new beginnings',
    },
    meaningReversed: { de: 'Widerstand gegen Wandel, Stagnation, Festhalten', en: 'Resistance to change, stagnation, holding on' },
    keywords: { de: ['Wandel', 'Transformation', 'Abschluss'], en: ['Change', 'Transformation', 'Ending'] },
    visualDescription: 'A skeletal figure in black armor rides a white horse, carrying a black flag with a white rose.',
  },
  {
    id: 'major_14_temperance',
    arcana: 'major',
    number: 14,
    nameTranslations: { de: 'Die Mäßigung', en: 'Temperance', ar: 'الاعتدال', tr: 'Denge' },
    meaningUpright: {
      de: 'Balance, Mäßigung, Geduld, Zweck, Sinn',
      en: 'Balance, moderation, patience, purpose, meaning',
    },
    meaningReversed: { de: 'Unbalance, Übertreibung, Ungeduld', en: 'Imbalance, excess, impatience' },
    keywords: { de: ['Balance', 'Mäßigung', 'Geduld'], en: ['Balance', 'Moderation', 'Patience'] },
    visualDescription: 'A winged figure pours water between two cups, standing with one foot in water, one on land.',
  },
  {
    id: 'major_15_devil',
    arcana: 'major',
    number: 15,
    nameTranslations: { de: 'Der Teufel', en: 'The Devil', ar: 'الشيطان', tr: 'Şeytan' },
    meaningUpright: {
      de: 'Bindungen, Abhängigkeit, Materalismus, Begrenzung, Schattenseiten',
      en: 'Bondage, dependency, materialism, restriction, shadow self',
    },
    meaningReversed: { de: 'Befreiung, Kontrolle zurückgewinnen, loslassen', en: 'Liberation, reclaiming control, letting go' },
    keywords: { de: ['Bindung', 'Schatten', 'Befreiung'], en: ['Bondage', 'Shadow', 'Liberation'] },
    visualDescription: 'A horned, bat-winged figure sits on a pedestal above two chained figures, holding an inverted torch.',
  },
  {
    id: 'major_16_tower',
    arcana: 'major',
    number: 16,
    nameTranslations: { de: 'Der Turm', en: 'The Tower', ar: 'البرج', tr: 'Kule' },
    meaningUpright: {
      de: 'Plötzlicher Wandel, Chaos, Offenbarung, Zerstörung alter Strukturen',
      en: 'Sudden change, chaos, revelation, destruction of old structures',
    },
    meaningReversed: { de: 'Abgewandtes Chaos, Verzögerung, innere Transformation', en: 'Averted chaos, delay, inner transformation' },
    keywords: { de: ['Erschütterung', 'Wandel', 'Offenbarung'], en: ['Upheaval', 'Change', 'Revelation'] },
    visualDescription: 'A tower is struck by lightning, with two figures falling from the top, amid flames and a dark sky.',
  },
  {
    id: 'major_17_star',
    arcana: 'major',
    number: 17,
    nameTranslations: { de: 'Der Stern', en: 'The Star', ar: 'النجمة', tr: 'Yıldız' },
    meaningUpright: {
      de: 'Hoffnung, Erneuerung, Inspiration, Heilung, Ruhe',
      en: 'Hope, renewal, inspiration, healing, calm',
    },
    meaningReversed: { de: 'Hoffnungslosigkeit, Enttäuschung, Desillusion', en: 'Hopelessness, disappointment, disillusion' },
    keywords: { de: ['Hoffnung', 'Heilung', 'Inspiration'], en: ['Hope', 'Healing', 'Inspiration'] },
    visualDescription: 'A naked figure kneels by a pool under a sky full of stars, pouring water from two jugs.',
  },
  {
    id: 'major_18_moon',
    arcana: 'major',
    number: 18,
    nameTranslations: { de: 'Der Mond', en: 'The Moon', ar: 'القمر', tr: 'Ay' },
    meaningUpright: {
      de: 'Illusion, Angst, Unterbewusstsein, Verwirrung, Intuition',
      en: 'Illusion, fear, subconscious, confusion, intuition',
    },
    meaningReversed: { de: 'Klarheit, Überwindung von Ängsten, innere Wahrheit', en: 'Clarity, overcoming fears, inner truth' },
    keywords: { de: ['Illusion', 'Intuition', 'Unterbewusstsein'], en: ['Illusion', 'Intuition', 'Subconscious'] },
    visualDescription: 'A full moon shines over a path leading to towers, with a crayfish emerging from water and a wolf and dog howling.',
  },
  {
    id: 'major_19_sun',
    arcana: 'major',
    number: 19,
    nameTranslations: { de: 'Die Sonne', en: 'The Sun', ar: 'الشمس', tr: 'Güneş' },
    meaningUpright: {
      de: 'Freude, Erfolg, Vitalität, Positivität, Kindlichkeit',
      en: 'Joy, success, vitality, positivity, childlike wonder',
    },
    meaningReversed: { de: 'Übermäßiger Optimismus, Selbstgefälligkeit, trübe Aussichten', en: 'Overconfidence, complacency, clouded outlook' },
    keywords: { de: ['Freude', 'Erfolg', 'Vitalität'], en: ['Joy', 'Success', 'Vitality'] },
    visualDescription: 'A young child rides a white horse beneath a radiant sun, with sunflowers in the background.',
  },
  {
    id: 'major_20_judgement',
    arcana: 'major',
    number: 20,
    nameTranslations: { de: 'Das Gericht', en: 'Judgement', ar: 'الحكم', tr: 'Yargılama' },
    meaningUpright: {
      de: 'Reflexion, Wiederbelebung, innerer Ruf, Befreiung, Absolution',
      en: 'Reflection, revival, inner calling, liberation, absolution',
    },
    meaningReversed: { de: 'Selbstzweifel, mangelnde Reflexion, verpasste Gelegenheit', en: 'Self-doubt, lack of reflection, missed opportunity' },
    keywords: { de: ['Erwachen', 'Befreiung', 'Ruf'], en: ['Awakening', 'Liberation', 'Calling'] },
    visualDescription: 'An angel blows a trumpet above figures rising from coffins, arms outstretched, beneath red crosses.',
  },
  {
    id: 'major_21_world',
    arcana: 'major',
    number: 21,
    nameTranslations: { de: 'Die Welt', en: 'The World', ar: 'العالم', tr: 'Dünya' },
    meaningUpright: {
      de: 'Vollendung, Erfolg, Integration, Reisen, Erfüllung',
      en: 'Completion, success, integration, travel, fulfillment',
    },
    meaningReversed: { de: 'Unvollständigkeit, Abkürzungen, mangelhafte Vollendung', en: 'Incompleteness, shortcuts, lack of completion' },
    keywords: { de: ['Vollendung', 'Erfolg', 'Integration'], en: ['Completion', 'Success', 'Integration'] },
    visualDescription: 'A dancing figure is surrounded by a laurel wreath and four winged beings in each corner, holding two wands.',
  },
];

export const ALL_CARD_IDS = MAJOR_ARCANA.map((c) => c.id);

export function getCardById(id: string): CardLibraryEntry | undefined {
  return MAJOR_ARCANA.find((c) => c.id === id);
}

export function drawRandomCards(count: number): string[] {
  const shuffled = [...ALL_CARD_IDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
