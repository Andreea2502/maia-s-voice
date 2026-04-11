import { SupportedLanguage, DrawnCard, CardMeaning } from '../types.ts';

export interface InterpretationParams {
  language: SupportedLanguage;
  cards: Array<DrawnCard & { positionMeaning: string; cardName: string; meaning: string }>;
  question?: string;
  userContext: string;
  onboardingSummary?: string;
  pastPatterns: string[];
}

export function getInterpretationPrompt(params: InterpretationParams): string {
  const lang = params.language;
  const cardList = params.cards
    .map(
      (c, i) =>
        `Position ${i + 1} (${c.positionMeaning}): ${c.cardName} (${c.orientation === 'upright' ? '↑' : '↓'})\n  Bedeutung: ${c.meaning}`
    )
    .join('\n\n');

  return `Du bist eine erfahrene, einfühlsame Kartenleserin.
Interpretiere die gezogenen Karten im Kontext dieser Person.

## Kontext der Person
${params.userContext}

## Zusammenfassung des Vorgesprächs
${params.onboardingSummary ?? 'Kein Vorgesprächs-Protokoll vorhanden.'}

## Wiederkehrende Themen aus früheren Readings
${params.pastPatterns.length > 0 ? params.pastPatterns.map((p) => `- ${p}`).join('\n') : 'Erstes Reading.'}

## Frage der Person
"${params.question ?? 'Keine spezifische Frage gestellt.'}"

## Gezogene Karten
${cardList}

## Aufgabe
1. Interpretiere jede Karte einzeln im Kontext der Person
2. Zeige Verbindungen zwischen den Karten auf
3. Beziehe dich direkt auf das Vorgespräch
4. Sprich wiederkehrende Themen an, falls vorhanden
5. Ende mit einer ermutigenden, realistischen Botschaft
6. Schlage 1-2 konkrete Reflexionsfragen vor

## Stil
- Antwort auf: ${lang}
- Sprachniveau: A2-B1
- Ton: warm, einfühlsam, respektvoll
- KEINE Zukunftsvorhersagen – nur Reflexion und Perspektiven
- Länge: 300-500 Wörter`;
}

export function getMemoryExtractionPrompt(interpretation: string, onboardingSummary: string): string {
  return `Analysiere die folgende Tarot-Interpretation und das Vorgesprächsprotokoll.
Extrahiere 1-3 wichtige Erinnerungen über die Person, die für zukünftige Readings relevant sein könnten.

## Interpretation
${interpretation}

## Vorgesprächs-Zusammenfassung
${onboardingSummary}

## Ausgabeformat (JSON-Array)
[
  {
    "memory_type": "life_event|emotional_pattern|recurring_question|preference|relationship|goal|concern",
    "content": "Kurze, präzise Beschreibung (max. 100 Zeichen)",
    "importance_score": 0.0-1.0
  }
]

Antworte NUR mit dem JSON-Array, ohne weiteren Text.`;
}
