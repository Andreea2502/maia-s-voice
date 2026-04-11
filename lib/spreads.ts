import { SpreadDefinition, SpreadType } from '@/types/card';

export const SPREADS: SpreadDefinition[] = [
  {
    id: 'single',
    name: { de: 'Tageskarte', en: 'Daily Card', ar: 'بطاقة اليوم', tr: 'Günlük Kart' },
    cardCount: 1,
    positions: [
      {
        index: 0,
        meaning: { de: 'Die Botschaft des Tages', en: 'Message of the Day', ar: 'رسالة اليوم', tr: 'Günün Mesajı' },
      },
    ],
  },
  {
    id: 'three_card',
    name: { de: '3-Karten-Legung', en: 'Three Card Spread', ar: 'بطاقات ثلاث', tr: 'Üç Kart' },
    cardCount: 3,
    positions: [
      { index: 0, meaning: { de: 'Vergangenheit', en: 'Past', ar: 'الماضي', tr: 'Geçmiş' } },
      { index: 1, meaning: { de: 'Gegenwart', en: 'Present', ar: 'الحاضر', tr: 'Şimdi' } },
      { index: 2, meaning: { de: 'Zukunft', en: 'Future', ar: 'المستقبل', tr: 'Gelecek' } },
    ],
  },
  {
    id: 'past_present_future',
    name: {
      de: 'Vergangenheit – Gegenwart – Zukunft',
      en: 'Past – Present – Future',
      ar: 'الماضي – الحاضر – المستقبل',
    },
    cardCount: 3,
    positions: [
      { index: 0, meaning: { de: 'Was war', en: 'What was', ar: 'ما كان' } },
      { index: 1, meaning: { de: 'Was ist', en: 'What is', ar: 'ما هو' } },
      { index: 2, meaning: { de: 'Was wird sein', en: 'What will be', ar: 'ما سيكون' } },
    ],
  },
  {
    id: 'yes_no',
    name: { de: 'Ja oder Nein', en: 'Yes or No', ar: 'نعم أم لا', tr: 'Evet mi Hayır mı' },
    cardCount: 1,
    positions: [
      { index: 0, meaning: { de: 'Die Antwort', en: 'The Answer', ar: 'الجواب', tr: 'Cevap' } },
    ],
  },
  {
    id: 'love_spread',
    name: { de: 'Liebe & Beziehung', en: 'Love & Relationship', ar: 'الحب والعلاقة', tr: 'Aşk ve İlişki' },
    cardCount: 5,
    positions: [
      { index: 0, meaning: { de: 'Ich selbst', en: 'Myself', ar: 'أنا', tr: 'Ben' } },
      { index: 1, meaning: { de: 'Der/die Andere', en: 'The Other', ar: 'الآخر', tr: 'Diğer' } },
      { index: 2, meaning: { de: 'Die Verbindung', en: 'The Connection', ar: 'الارتباط', tr: 'Bağ' } },
      { index: 3, meaning: { de: 'Herausforderungen', en: 'Challenges', ar: 'التحديات', tr: 'Zorluklar' } },
      { index: 4, meaning: { de: 'Potenzial', en: 'Potential', ar: 'الإمكانات', tr: 'Potansiyel' } },
    ],
  },
  {
    id: 'career_spread',
    name: { de: 'Beruf & Karriere', en: 'Career & Work', ar: 'العمل والمهنة', tr: 'Kariyer' },
    cardCount: 4,
    positions: [
      { index: 0, meaning: { de: 'Aktuelle Situation', en: 'Current Situation' } },
      { index: 1, meaning: { de: 'Stärken', en: 'Strengths' } },
      { index: 2, meaning: { de: 'Hindernisse', en: 'Obstacles' } },
      { index: 3, meaning: { de: 'Empfehlung', en: 'Recommendation' } },
    ],
  },
  {
    id: 'celtic_cross',
    name: { de: 'Keltisches Kreuz', en: 'Celtic Cross' },
    cardCount: 10,
    positions: [
      { index: 0, meaning: { de: 'Die Situation', en: 'The Situation' } },
      { index: 1, meaning: { de: 'Die Kreuzung', en: 'The Cross' } },
      { index: 2, meaning: { de: 'Die Basis', en: 'The Foundation' } },
      { index: 3, meaning: { de: 'Die Vergangenheit', en: 'The Past' } },
      { index: 4, meaning: { de: 'Die Krone', en: 'The Crown' } },
      { index: 5, meaning: { de: 'Die nahe Zukunft', en: 'Near Future' } },
      { index: 6, meaning: { de: 'Selbstbild', en: 'Self' } },
      { index: 7, meaning: { de: 'Äußere Einflüsse', en: 'External Influences' } },
      { index: 8, meaning: { de: 'Hoffnungen & Ängste', en: 'Hopes & Fears' } },
      { index: 9, meaning: { de: 'Das Ergebnis', en: 'The Outcome' } },
    ],
  },
];

export function getSpread(id: SpreadType): SpreadDefinition {
  return SPREADS.find((s) => s.id === id) ?? SPREADS[0];
}
