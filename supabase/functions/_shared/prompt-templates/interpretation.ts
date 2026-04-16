import { SupportedLanguage, DrawnCard, CardMeaning } from '../types.ts';

export interface InterpretationParams {
  language: SupportedLanguage;
  cards: Array<DrawnCard & { positionMeaning: string; cardName: string; meaning: string }>;
  spreadTitle: string;
  question?: string;
  userContext: string;
  onboardingSummary?: string;
  pastPatterns: string[];            // from session_memories — only if memory_enabled
  memoryEnabled: boolean;            // user consent flag
  personaId?: 'luna' | 'zara' | 'maya';
}

// ─── Safety check: detect crisis signals in user input ───────
const CRISIS_SIGNALS_DE = [
  'suizid', 'selbstmord', 'sterben wollen', 'nicht mehr leben',
  'umbringen', 'alles beenden', 'keinen ausweg', 'hoffnungslos',
  'ich will nicht mehr', 'es hat keinen sinn mehr',
];
const CRISIS_SIGNALS_EN = [
  'suicide', 'kill myself', 'end it all', 'don\'t want to live',
  'no reason to live', 'hopeless', 'want to die',
];

export function detectCrisisSignals(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    CRISIS_SIGNALS_DE.some((s) => lower.includes(s)) ||
    CRISIS_SIGNALS_EN.some((s) => lower.includes(s))
  );
}

// ─── Crisis response — ends reading immediately ──────────────
export function getCrisisResponse(language: SupportedLanguage): string {
  const responses: Partial<Record<SupportedLanguage, string>> = {
    de: `Ich höre dich. Was du gerade teilst, ist wichtig — und es zeigt mir, dass du gerade durch etwas sehr Schweres gehst.

Ich möchte die Karten jetzt zur Seite legen, denn das hier ist wichtiger als jedes Reading.

Bitte wende dich jetzt an die Telefonseelsorge — sie sind kostenlos, rund um die Uhr erreichbar, und hören wirklich zu:
📞 **0800 111 0 111** (Deutschland, kostenlos, 24/7)
📞 **142** (Österreich, kostenlos, 24/7)
📞 **143** (Schweiz, Die Dargebotene Hand, 24/7)

Du bist nicht allein damit. Bitte ruf an.`,

    en: `I hear you. What you're sharing matters — and it tells me you're going through something very heavy right now.

I want to set the cards aside, because this is more important than any reading.

Please reach out to a crisis line — they're free, available around the clock, and they truly listen:
📞 **116 123** (Samaritans UK, free, 24/7)
📞 **988** (USA Suicide & Crisis Lifeline, free, 24/7)
📞 **13 11 14** (Australia Lifeline, 24/7)

You are not alone in this. Please reach out.`,
  };
  return responses[language] ?? responses['de']!;
}

// ─── Main interpretation prompt ──────────────────────────────
export function getInterpretationPrompt(params: InterpretationParams): string {
  const lang = params.language;

  const cardList = params.cards
    .map(
      (c, i) =>
        `Position ${i + 1} — ${c.positionMeaning}: "${c.cardName}" (${c.orientation === 'upright' ? 'aufrecht' : 'umgekehrt'})${c.meaning ? `\n  Bedeutung aus DB: ${c.meaning}` : ''}`
    )
    .join('\n\n');

  const memorySection = params.memoryEnabled && params.pastPatterns.length > 0
    ? `## Wiederkehrende Muster aus früheren Gesprächen\n${params.pastPatterns.map((p) => `- ${p}`).join('\n')}\n(Beziehe diese Muster ein — nicht als Diagnose, sondern als Wiedererkennung.)`
    : '';

  const personaNote = params.personaId ? PERSONA_STYLE_INJECTION[params.personaId] ?? '' : '';
  const hasOnboarding = params.onboardingSummary && params.onboardingSummary.trim().length > 10;
  const hasQuestion = params.question && params.question.trim().length > 3;

  return `Du bist ${personaNote ? personaNote.split('\n')[0] : 'eine erfahrene Kartenleserin'} bei MYSTIC.
${personaNote}

## ABSOLUTE GRENZEN — immer, ohne Ausnahme:
- KEINE konkreten Vorhersagen ("Im Sommer wirst du...", "Er wird zurückkommen...")
- KEINE medizinischen, rechtlichen oder finanziellen Aussagen
- KEIN Bewerten der Entscheidungen der Person
- Bei Suizid-Signalen: Reading sofort stoppen, Krisenhotline nennen (0800 111 0 111)
- Nicht mit "Liebe Seele", "Geliebte" oder ähnlichen Anreden beginnen

## Kontext
${hasOnboarding ? `Vorgespräch-Zusammenfassung: ${params.onboardingSummary}` : 'Kein Vorgespräch.'}
${hasQuestion ? `Frage der Person (WORTLAUT): "${params.question}"` : 'Keine spezifische Frage.'}
${params.spreadTitle ? `Legetechnik: ${params.spreadTitle}` : ''}
${memorySection}

## Gezogene Karten
${cardList}

## Ausgabe-Anweisung

Antworte AUSSCHLIESSLICH mit einem JSON-Objekt — kein Text davor oder danach, keine Markdown-Codeblöcke, kein \`\`\`json.
Nur reines, direkt parsebares JSON.

{
  "opening": "${hasQuestion ? 'Greife die Frage der Person im ersten Satz direkt auf' : 'Steige direkt mit der Energie der Karten ein'} — 1-2 prägnante Sätze, konkret auf diese Person bezogen",
  "cards": [
    {
      "name": "Exakter Kartenname aus der Legetechnik",
      "position": "Positionsbezeichnung (z.B. Vergangenheit, Unterbewusstsein, ...)",
      "orientation": "aufrecht oder umgekehrt",
      "interpretation": "Was bedeutet genau diese Karte in genau dieser Position für genau diese Person? 2-3 direkte, konkrete Sätze. Bezug auf Vorgespräch wenn vorhanden.",
      "classic_meaning": "Klassische Tarot-Bedeutung dieser Karte — kurz und präzise, 1-2 Sätze. Nutze die DB-Bedeutung als Basis.",
      "anecdote": "Eine faszinierende historische, mythologische oder kulturelle Anekdote zu dieser Karte. 1-2 Sätze."
    }
  ],
  "synthesis": "Was sagen die Karten zusammen? Spannungen, Bögen, übergeordnete Geschichte. 2-3 Sätze.",
  "core_message": "Kernbotschaft: Was kann die Person jetzt konkret damit anfangen? Praktisch, nicht nur inspirierend. 1-2 Sätze.",
  "questions": [
    "Erste echte Reflexionsfrage — lädt zum Nachdenken ein, kein Ratschlag",
    "Zweite Reflexionsfrage"
  ]
}

WICHTIG: Das JSON muss exakt ${params.cards.length} Einträge im "cards"-Array haben — einen pro gezogener Karte.

Sprache: ${lang === 'de' ? 'Deutsch' : lang}
Stil: ${PERSONA_TONE[params.personaId ?? 'luna']}
Keine Phrasen wie "Die Karten zeigen...", "Das Universum sagt...", "Deine Seele..."`;
}

// ─── Persona style injections ─────────────────────────────────
const PERSONA_STYLE_INJECTION: Record<string, string> = {
  luna: `Luna — eine ruhige, ehrliche Kartenleserin. Warm aber direkt. Kein Blabla.`,
  zara: `Zara — direkt, scharf, unverblümt. Sagt die Wahrheit, auch wenn sie unbequem ist. Ohne Umschweife.`,
  maya: `Maya — geerdet, mütterlich, klar. Spricht aus Erfahrung. Keine mystischen Floskeln.`,
};

const PERSONA_TONE: Record<string, string> = {
  luna: 'warm und klar — keine überladene Metaphorik',
  zara: 'direkt und scharf — sagt was ist, ohne Drumherum',
  maya: 'ruhig und geerdet — verständlich, aus dem Leben',
  master: 'neutral und klar',
};

// ─── Memory extraction (only when memory_enabled = true) ──────
export function getMemoryExtractionPrompt(
  interpretation: string,
  onboardingSummary: string,
  memoryEnabled: boolean
): string {
  if (!memoryEnabled) {
    // Return empty array prompt — nothing will be stored
    return `[]`;
  }

  return `Analysiere die folgende Tarot-Interpretation und das Vorgesprächsprotokoll.
Extrahiere 1-3 wichtige Erinnerungen über die Person, die für zukünftige Readings relevant sein könnten.
Extrahiere NUR Dinge die für ein späteres Gespräch wirklich nützlich sind — keine banalen Details.

## Interpretation
${interpretation}

## Vorgesprächs-Zusammenfassung
${onboardingSummary}

## Ausgabeformat (JSON-Array, NUR JSON, kein weiterer Text)
[
  {
    "memory_type": "life_event|emotional_pattern|recurring_question|preference|relationship|goal|concern",
    "content": "Kurze, präzise Beschreibung (max. 100 Zeichen)",
    "importance_score": 0.0-1.0
  }
]

WICHTIG: Niemals sensible Details wie Krankheiten, Suizidgedanken oder intime Details speichern.
Antworte NUR mit dem JSON-Array.`;
}
