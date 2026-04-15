import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getOptionalUser } from '../_shared/auth.ts';
import { generateText } from '../_shared/gemini-client.ts';
import { SupportedLanguage } from '../_shared/types.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BirthData {
  birthDate: string;       // ISO date: "1990-03-15"
  birthTime?: string;      // "HH:MM" or null if unknown
  birthLat: number;
  birthLng: number;
  birthTimezone: string;   // IANA tz: "Europe/Vienna"
}

interface QuestionnaireAnswers {
  outputLanguage?: string;
  name?: string;
  pronouns?: string;
  relationshipStatus?: string;
  currentFocus?: string;
  areasOfInterest?: string[];
  characterDescription?: string;
  conflictStyle?: string;
  desiredInsight?: string;
  specificQuestion?: string;
}

interface PlanetPosition {
  name: string;
  sign: string;
  degree: number;          // 0-29.99 within sign
  absoluteDegree: number;  // 0-359.99
  retrograde: boolean;
  house?: number;
}

interface HouseCusp {
  house: number;
  sign: string;
  degree: number;
}

interface AstrologyChart {
  planets: PlanetPosition[];
  sunSign: string;
  moonSign: string;
  risingSign?: string;        // from ascendant
  midheaven?: string;         // MC sign
  ascendantDegree?: number;
  houses?: HouseCusp[];
  aspects: Aspect[];
  northNodeSign?: string;
  southNodeSign?: string;
}

interface Aspect {
  planet1: string;
  planet2: string;
  type: string;
  orb: number;
}

interface InterpretationSection {
  id: string;
  title: string;
  icon: string;
  content: string;
}

// ─── Zodiac signs ─────────────────────────────────────────────────────────────

const SIGNS = [
  'Widder','Stier','Zwillinge','Krebs','Löwe','Jungfrau',
  'Waage','Skorpion','Schütze','Steinbock','Wassermann','Fische'
];

function degreeToSign(deg: number): { sign: string; degree: number } {
  const norm = ((deg % 360) + 360) % 360;
  const signIndex = Math.floor(norm / 30);
  return { sign: SIGNS[signIndex], degree: norm - signIndex * 30 };
}

// ─── VSOP87 approximations ───────────────────────────────────────────────────

function julianDate(year: number, month: number, day: number, hour = 12): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y +
    Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045 +
    (hour - 12) / 24;
}

function jd2000(jd: number): number { return jd - 2451545.0; }

const rad = (d: number) => d * Math.PI / 180;

function sunLongitude(T: number): number {
  const L0 = 280.46646 + 36000.76983 * T;
  const M  = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const Mr = rad(M);
  const C  = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)
           + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
           + 0.000289 * Math.sin(3 * Mr);
  return ((L0 + C) % 360 + 360) % 360;
}

function moonLongitude(T: number): number {
  const L  = 218.3164477 + 481267.88123421 * T;
  const M  = 357.5291092 + 35999.0502909 * T;
  const Mp = 134.9633964 + 477198.8675055 * T;
  const D  = 297.8501921 + 445267.1114034 * T;
  const F  = 93.2720950 + 483202.0175233 * T;
  const lon = L
    + 6.288774 * Math.sin(rad(Mp))
    + 1.274027 * Math.sin(rad(2 * D - Mp))
    + 0.658314 * Math.sin(rad(2 * D))
    + 0.213618 * Math.sin(rad(2 * Mp))
    - 0.185116 * Math.sin(rad(M))
    - 0.114332 * Math.sin(rad(2 * F))
    + 0.058793 * Math.sin(rad(2 * D - 2 * Mp))
    + 0.057066 * Math.sin(rad(2 * D - M - Mp))
    + 0.053322 * Math.sin(rad(2 * D + Mp))
    + 0.045758 * Math.sin(rad(2 * D - M));
  return ((lon % 360) + 360) % 360;
}

function planetMeanLon(T: number, L0: number, rate: number): number {
  return ((L0 + rate * T) % 360 + 360) % 360;
}

function computePlanets(jd: number): Omit<PlanetPosition, 'sign' | 'degree'>[] {
  const T = jd2000(jd) / 36525;
  return [
    { name: 'Sonne',      absoluteDegree: sunLongitude(T),                              retrograde: false },
    { name: 'Mond',       absoluteDegree: moonLongitude(T),                             retrograde: false },
    { name: 'Merkur',     absoluteDegree: planetMeanLon(T, 252.250906, 149474.0722491), retrograde: false },
    { name: 'Venus',      absoluteDegree: planetMeanLon(T, 181.979801, 58519.2130302),  retrograde: false },
    { name: 'Mars',       absoluteDegree: planetMeanLon(T, 355.433,    19141.6964),     retrograde: false },
    { name: 'Jupiter',    absoluteDegree: planetMeanLon(T, 34.351,     3036.3027),      retrograde: false },
    { name: 'Saturn',     absoluteDegree: planetMeanLon(T, 50.077,     1223.5110),      retrograde: false },
    { name: 'Uranus',     absoluteDegree: planetMeanLon(T, 314.055,    429.8633),       retrograde: false },
    { name: 'Neptun',     absoluteDegree: planetMeanLon(T, 304.349,    219.8997),       retrograde: false },
    { name: 'Pluto',      absoluteDegree: planetMeanLon(T, 238.9508,   145.1854),       retrograde: false },
  ];
}

const ASPECT_ANGLES: { type: string; angle: number; orb: number }[] = [
  { type: 'Konjunktion', angle: 0,   orb: 8 },
  { type: 'Sextil',      angle: 60,  orb: 6 },
  { type: 'Quadrat',     angle: 90,  orb: 8 },
  { type: 'Trigon',      angle: 120, orb: 8 },
  { type: 'Opposition',  angle: 180, orb: 8 },
];

function computeAspects(planets: PlanetPosition[]): Aspect[] {
  const aspects: Aspect[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const diff = Math.abs(planets[i].absoluteDegree - planets[j].absoluteDegree);
      const angle = diff > 180 ? 360 - diff : diff;
      for (const asp of ASPECT_ANGLES) {
        const orb = Math.abs(angle - asp.angle);
        if (orb <= asp.orb) {
          aspects.push({
            planet1: planets[i].name,
            planet2: planets[j].name,
            type: asp.type,
            orb: Math.round(orb * 10) / 10,
          });
        }
      }
    }
  }
  return aspects;
}

function buildChart(birthData: BirthData): AstrologyChart {
  const [year, month, day] = birthData.birthDate.split('-').map(Number);
  const hour = birthData.birthTime
    ? parseInt(birthData.birthTime.split(':')[0]) + parseInt(birthData.birthTime.split(':')[1]) / 60
    : 12;

  const jd = julianDate(year, month, day, hour);
  const rawPlanets = computePlanets(jd);
  const planets: PlanetPosition[] = rawPlanets.map((p) => {
    const { sign, degree } = degreeToSign(p.absoluteDegree);
    return { ...p, sign, degree: Math.round(degree * 10) / 10 };
  });

  const sun  = planets.find((p) => p.name === 'Sonne')!;
  const moon = planets.find((p) => p.name === 'Mond')!;
  const aspects = computeAspects(planets);

  return { planets, sunSign: sun.sign, moonSign: moon.sign, aspects };
}

// ─── AstrologyAPI.com integration ─────────────────────────────────────────────

const PLANET_NAME_MAP: Record<string, string> = {
  Sun: 'Sonne', Moon: 'Mond', Mercury: 'Merkur', Venus: 'Venus',
  Mars: 'Mars', Jupiter: 'Jupiter', Saturn: 'Saturn', Uranus: 'Uranus',
  Neptune: 'Neptun', Pluto: 'Pluto', Chiron: 'Chiron',
  'Mean_Node': 'Nordknoten', 'True_Node': 'Nordknoten',
  'Mean_South_Node': 'Südknoten', Ascendant: 'Aszendent', Midheaven: 'Midheaven',
};

const SIGN_MAP: Record<string, string> = {
  Aries: 'Widder', Taurus: 'Stier', Gemini: 'Zwillinge', Cancer: 'Krebs',
  Leo: 'Löwe', Virgo: 'Jungfrau', Libra: 'Waage', Scorpio: 'Skorpion',
  Sagittarius: 'Schütze', Capricorn: 'Steinbock', Aquarius: 'Wassermann', Pisces: 'Fische',
};

// Approximate timezone offset in hours from IANA timezone string at a given date
function getTimezoneOffset(tzString: string, date: Date): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tzString,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(date);
    const offsetPart = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'UTC+0';
    const match = offsetPart.match(/UTC([+-])(\d+)(?::(\d+))?/);
    if (!match) return 0;
    const sign = match[1] === '+' ? 1 : -1;
    const hours = parseInt(match[2]);
    const minutes = parseInt(match[3] ?? '0');
    return sign * (hours + minutes / 60);
  } catch {
    return 0;
  }
}

async function fetchFromAstrologyAPI(birthData: BirthData): Promise<AstrologyChart | null> {
  const userId = Deno.env.get('ASTROLOGY_API_USER_ID');
  const apiKey = Deno.env.get('ASTROLOGY_API_KEY');
  if (!userId || !apiKey) return null;

  try {
    const [year, month, day] = birthData.birthDate.split('-').map(Number);
    const hour = birthData.birthTime ? parseInt(birthData.birthTime.split(':')[0]) : 12;
    const min  = birthData.birthTime ? parseInt(birthData.birthTime.split(':')[1]) : 0;

    const birthDateObj = new Date(birthData.birthDate);
    const tzOffset = getTimezoneOffset(birthData.birthTimezone, birthDateObj);

    const credentials = btoa(`${userId}:${apiKey}`);
    const response = await fetch('https://json.astrologyapi.com/v1/western_chart_data', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        day, month, year, hour, min,
        lat: birthData.birthLat,
        lon: birthData.birthLng,
        tzone: tzOffset,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();

    // Parse planets array
    if (!Array.isArray(data?.planets)) return null;

    const planets: PlanetPosition[] = data.planets.map((p: Record<string, unknown>) => {
      const absD = typeof p.full_degree === 'number' ? p.full_degree : 0;
      const { sign: computedSign, degree: computedDeg } = degreeToSign(absD);
      const rawSign = typeof p.sign === 'string' ? p.sign : '';
      return {
        name: PLANET_NAME_MAP[p.name as string] ?? String(p.name),
        sign: SIGN_MAP[rawSign] ?? computedSign,
        degree: typeof p.norm_degree === 'number' ? Math.round(p.norm_degree * 10) / 10 : Math.round(computedDeg * 10) / 10,
        absoluteDegree: absD,
        retrograde: p.isRetro === 'true' || p.isRetro === true,
        house: typeof p.house === 'number' ? p.house : undefined,
      };
    });

    const sun  = planets.find((p) => p.name === 'Sonne');
    const moon = planets.find((p) => p.name === 'Mond');
    if (!sun || !moon) return null;

    // Parse ascendant
    const rawAscSign = typeof data.ascendant === 'string' ? data.ascendant : '';
    const risingSign = SIGN_MAP[rawAscSign] ?? rawAscSign ?? undefined;

    // Parse midheaven
    const rawMcSign = typeof data.midheaven === 'string' ? data.midheaven : '';
    const midheaven = SIGN_MAP[rawMcSign] ?? rawMcSign ?? undefined;

    // Ascendant degree
    const ascendantDegree: number | undefined = typeof data.ascendant_degree === 'number'
      ? data.ascendant_degree
      : undefined;

    // Parse houses
    let houses: HouseCusp[] | undefined;
    if (Array.isArray(data.houses)) {
      houses = data.houses.map((h: Record<string, unknown>, i: number) => {
        const hSign = typeof h.sign === 'string' ? h.sign : '';
        return {
          house: i + 1,
          sign: SIGN_MAP[hSign] ?? hSign,
          degree: typeof h.degree === 'number' ? Math.round(h.degree * 10) / 10 : 0,
        };
      });
    }

    // North/South node signs
    const northNode = planets.find((p) => p.name === 'Nordknoten');
    const southNode = planets.find((p) => p.name === 'Südknoten');

    const aspects = computeAspects(planets);

    return {
      planets,
      sunSign: sun.sign,
      moonSign: moon.sign,
      risingSign: risingSign || undefined,
      midheaven: midheaven || undefined,
      ascendantDegree,
      houses,
      aspects,
      northNodeSign: northNode?.sign,
      southNodeSign: southNode?.sign,
    };
  } catch {
    return null;
  }
}

// ─── Helper: build person context string from questionnaire ──────────────────

function buildPersonContext(q: QuestionnaireAnswers): string {
  const lines: string[] = [];
  if (q.name)                lines.push(`Name: ${q.name}`);
  if (q.pronouns)            lines.push(`Pronomen: ${q.pronouns}`);
  if (q.relationshipStatus)  lines.push(`Beziehungsstatus: ${q.relationshipStatus}`);
  if (q.currentFocus)        lines.push(`Aktuell beschäftigt: ${q.currentFocus}`);
  if (q.areasOfInterest?.length) lines.push(`Interessiert an: ${q.areasOfInterest.join(', ')}`);
  if (q.characterDescription) lines.push(`Selbstbild: ${q.characterDescription}`);
  if (q.conflictStyle)       lines.push(`Konfliktverhalten: ${q.conflictStyle}`);
  if (q.desiredInsight)      lines.push(`Wunsch aus dem Horoskop: ${q.desiredInsight}`);
  if (q.specificQuestion)    lines.push(`Spezifische Frage: ${q.specificQuestion}`);
  return lines.join('\n');
}

// ─── Language name helper ────────────────────────────────────────────────────

function languageName(code: string): string {
  const map: Record<string, string> = {
    de: 'Deutsch', en: 'English', es: 'Español', ro: 'Română',
    fr: 'Français', it: 'Italiano', pl: 'Polski', ru: 'Русский',
  };
  return map[code] ?? 'Deutsch';
}

// ─── Section metadata — 12 sections (order matters for parsing) ──────────────

const SECTION_META = [
  { id: 'persoenlichkeitskern',  title: 'Dein Persönlichkeitskern', icon: '✦'  },
  { id: 'wie-du-liebst',         title: 'Wie du liebst',            icon: '💛' },
  { id: 'beruf-berufung',        title: 'Beruf & Berufung',         icon: '⚡' },
  { id: 'deine-innenwelt',       title: 'Deine Innenwelt',          icon: '🌊' },
  { id: 'staerken-superkraefte', title: 'Stärken & Superkräfte',    icon: '🌟' },
  { id: 'wachstum-schatten',     title: 'Wachstum & Schatten',      icon: '🌱' },
  { id: 'herkunft-familie',      title: 'Herkunft & Familie',       icon: '🏡' },
  { id: 'dein-seelenweg',        title: 'Dein Seelenweg',           icon: '☊'  },
  { id: 'energie-gesundheit',    title: 'Energie & Gesundheit',     icon: '🔥' },
  { id: 'geld-sicherheit',       title: 'Geld & Sicherheit',        icon: '💰' },
  { id: 'dein-jahr',             title: 'Dein Jahr',                icon: '📅' },
  { id: 'persoenliche-botschaft', title: 'Persönliche Botschaft',   icon: '💌' },
];

// ─── Shared prompt rules (injected into every system prompt) ─────────────────

function buildAbsoluteRules(lang: string): string {
  const langInstruction = lang !== 'de'
    ? `\n- WRITE THE ENTIRE RESPONSE IN ${languageName(lang).toUpperCase()} — this is the required output language, regardless of the planet names or section titles below`
    : '';
  return `## ABSOLUTE RULES — never break:
- NEVER use astrological jargon: no "7th house", no "square", no "conjunction", no "orb", no "trine", no "transit"
- Describe life themes instead: "4th house" → "your family and origins", "7th house" → "your partnerships"
- NEVER: "The stars show...", "The universe says...", "Dear soul", "cosmic energy"
- No predictions — only character traits, patterns, potentials
- Speak directly, warmly, concretely in "du" form — as if you know this person well
- Always incorporate questionnaire answers deeply into the content (not as additions — as the core)

## REQUIRED STRUCTURE — every chapter MUST follow this EXACTLY:

Each chapter contains 3-4 sub-sections:

### [Sub-Section Title]
[150-300 words of warm, personal, concrete prose — no bullet points here]

CHECKLISTE:
• [Hyper-specific statement that feels like you're reading this person's diary — in "du" form, present tense]
• [Another. Be bold. Be specific. Say what others don't dare say.]
• [Another specific statement]
• [Another]
• [Another — 4-5 bullets per sub-section total]

[Repeat ### Sub-Title + prose + CHECKLISTE for each sub-section, then after ALL sub-sections:]

KOMBINATION: [PlanetName] in [Zeichen] + [PlanetName] in [Zeichen]: [2-3 sentences — how these two specific energies interact uniquely in this person's chart and what it creates in everyday life]

KERNAUSSAGEN:
• [Most important insight from this chapter — one sentence, direct]
• [Second key insight — one sentence]
• [Third key insight — one sentence]

AFFIRMATION: "[One powerful, personal sentence in quotes — something this person needs to hear]"

- Total chapter: 1500-2000 words across all sub-sections + structured blocks (not less — this is mandatory)
- CHECKLISTE items must be hyper-personal — NOT "you enjoy creativity" but "du unterbrichst Gespräche nicht, aber innerlich brodelt es manchmal"
- KOMBINATION must name the actual planet signs from this person's chart${langInstruction}`;
}

// ─── Prompt builder — Call 1 (sections 1-6) ──────────────────────────────────

function buildPromptCall1(
  chart: AstrologyChart,
  q: QuestionnaireAnswers,
  personCtx: string,
  name: string,
  pronoun: string,
  lang: string,
): string {
  const planet = (n: string) => {
    const p = chart.planets.find((pl) => pl.name === n);
    if (!p) return 'unbekannt';
    const retroStr = p.retrograde ? ' ℞' : '';
    const houseStr = p.house ? ` (Lebensbereich ${p.house})` : '';
    return `${p.sign} (${p.degree.toFixed(1)}°)${retroStr}${houseStr}`;
  };

  const harmonious = chart.aspects
    .filter((a) => ['Trigon', 'Sextil', 'Konjunktion'].includes(a.type) && a.orb <= 5)
    .slice(0, 5)
    .map((a) => `${a.planet1}–${a.planet2}`)
    .join(', ');

  const challenging = chart.aspects
    .filter((a) => ['Quadrat', 'Opposition'].includes(a.type) && a.orb <= 5)
    .slice(0, 4)
    .map((a) => `${a.planet1}–${a.planet2}`)
    .join(', ');

  const venusHouse = chart.planets.find((p) => p.name === 'Venus')?.house;
  const venusHouseTheme = venusHouse === 1 ? 'Selbstausdruck' : venusHouse === 2 ? 'Besitz und Sicherheit' :
    venusHouse === 5 ? 'Kreativität und Freude' : venusHouse === 7 ? 'Partnerschaft' :
    venusHouse === 8 ? 'Tiefe Verbindung' : undefined;

  return `Du bist eine erfahrene, warmherzige Astrologin. Schreibe 6 Abschnitte eines persönlichen Horoskops für ${name}.

${buildAbsoluteRules(lang)}

## Planetenpositionen von ${name}
Sonne: ${planet('Sonne')} — Kernidentität, Lebensantrieb
Mond: ${planet('Mond')} — Gefühlsleben, emotionale Bedürfnisse
Merkur: ${planet('Merkur')} — Denkstil, Kommunikation
Venus: ${planet('Venus')} — Liebesstil, Schönheitssinn, Werte${venusHouseTheme ? ` (Schwerpunkt: ${venusHouseTheme})` : ''}
Mars: ${planet('Mars')} — Energie, Antrieb, Durchsetzung
Jupiter: ${planet('Jupiter')} — Wachstum, Großzügigkeit, Glück
Saturn: ${planet('Saturn')} — Disziplin, Ausdauer, Lernfelder
${chart.risingSign ? `Aszendent: ${chart.risingSign} — äußere Erscheinung, erster Eindruck` : 'Aszendent: unbekannt (Geburtszeit nicht angegeben)'}
${chart.midheaven ? `Midheaven: ${chart.midheaven} — Berufung, öffentliche Rolle` : ''}

## Planetenverbindungen
Fließende Verbindungen (stärken Fähigkeiten): ${harmonious || 'keine engen fließenden Verbindungen'}
Produktive Spannungen (laden zum Wachstum ein): ${challenging || 'keine engen Spannungen'}

## Was ${name} über sich selbst sagt
${personCtx}

## Aufgabe
Schreibe GENAU diese 6 Abschnitte in dieser Reihenfolge.
Beginne jeden Abschnitt mit "## " gefolgt vom EXAKTEN deutschen Titel (auch wenn du auf ${languageName(lang)} schreibst — die Überschriften bleiben auf Deutsch für die Verarbeitung).
Jedes Kapitel: 3-4 Unterkapitel (### Titel) + CHECKLISTE nach jedem Unterkapitel + KOMBINATION + KERNAUSSAGEN + AFFIRMATION. Pronomen: ${pronoun}.

## Dein Persönlichkeitskern
Schreibe 4 Unterkapitel:
### Dein Wesenskern
Wer ist ${name} wirklich — hinter der Fassade? Sonne, Mond und Aszendent in konkreter Alltagssprache. Was ist der rote Faden, der sich durch ${pronoun}s Leben zieht? Was treibt ${pronoun} morgens aus dem Bett?

### Wie andere dich erleben
Welchen ersten Eindruck macht ${name}? Wie erleben ${pronoun} Fremde im Vergleich zu engen Vertrauten? Wo gibt es eine Diskrepanz zwischen Selbst- und Fremdbild?

### Deine emotionale Landschaft
Wie verarbeitet ${name} innerlich? Welche Gefühle kommen schnell, welche werden unterdrückt? Was braucht ${pronoun} um sich wirklich wohl zu fühlen?

### Was du vielleicht noch nicht siehst
Eine verborgene Qualität oder ein blinder Fleck — etwas, das ${name} vielleicht noch nicht vollständig erkennt, das aber klar im Chart sichtbar ist. Einladend formulieren, nicht enthüllend.

KOMBINATION sollte Sonne + Mond (oder Aszendent) verwenden.

## Wie du liebst
Schreibe 4 Unterkapitel:
### Dein Beziehungsmuster
Wie nähert sich ${name} Nähe und Intimität? Was sind wiederkehrende Muster in Beziehungen — sowohl die schönen als auch die schwierigen?

### Deine Liebessprache
Wie drückt ${name} Zuneigung aus? Was braucht ${pronoun} um sich geliebt zu fühlen? Wo gibt es Missverständnisse mit Partnern?

### Was dich wirklich anzieht
Was zieht ${name} magnetisch an — und warum? Welche Qualitäten sucht ${pronoun}, vielleicht unbewusst? Was sagt das über ${pronoun}s eigene Entwicklung?

### Wenn es schwierig wird
Wie reagiert ${name} in Konflikten? Wo entstehen Risse? Was braucht ${pronoun} um Vertrauen wieder aufzubauen? Konkret und liebevoll.

KOMBINATION sollte Venus + Mars verwenden.

## Beruf & Berufung
Schreibe 4 Unterkapitel:
### Deine natürlichen Talente
Welche Stärken und Fähigkeiten hat ${name} mitgebracht — die ${pronoun} vielleicht als selbstverständlich betrachtet, die aber echte Gaben sind? Konkret, ermutigend.

### Dein Arbeitsstil
Wie arbeitet ${name} am besten? Allein oder im Team? Mit Struktur oder Freiheit? Was braucht ${pronoun} um wirklich produktiv und erfüllt zu sein?

### Karriere & Geld
Wie geht ${name} mit Ressourcen um? Welche Haltung zu Geld und Sicherheit trägt ${pronoun}? Welche unbewussten Muster rund um Erfolg sind erkennbar?

### Deine Herausforderungen im Job
Wo könnte ${name} sich selbst im Weg stehen? Welche Muster wiederholen sich beruflich? Was würde den nächsten großen Schritt ermöglichen?

KOMBINATION sollte Jupiter + Saturn verwenden.

## Deine Innenwelt
Schreibe 3 Unterkapitel:
### Wie du Gefühle verarbeitest
Wie geht ${name} mit starken Emotionen um? Was passiert, wenn ${pronoun} überwältigt ist? Wie lange braucht ${pronoun} um sich zu erholen? Ohne zu psychologisieren.

### Was dich im Tiefsten bewegt
Was sind die wirklichen Sehnsüchte von ${name} — die, die ${pronoun} vielleicht nicht laut ausspricht? Was wünscht ${pronoun} sich am meisten?

### Was du brauchst um aufzublühen
Konkrete Bedingungen: Was lässt ${name} wirklich aufblühen? Beziehungen, Umgebung, Rhythmus, Tätigkeiten. Einladend und präzise.

KOMBINATION sollte Mond + Neptun verwenden.

## Stärken & Superkräfte
Schreibe 3 Unterkapitel:
### Was du besonders gut kannst
Konkrete Stärken — nicht abstrakt ("du bist kreativ") sondern spezifisch ("du erkennst Muster schneller als andere", "du hast ein Gespür für das Unausgesprochene"). Fließende Aspekte als Gaben beschreiben.

### Wo du oft unterschätzt wirst
Welche Stärke wird von anderen (oder von ${name} selbst) zu wenig gesehen? Warum? Was würde passieren, wenn ${name} diese Kraft voll entfaltet?

### Wie du deine Gaben einsetzen kannst
Konkrete, alltägliche Empfehlungen: In welchen Situationen, Rollen, Beziehungen kann ${name} am meisten glänzen? Was maximiert das Potenzial?

KOMBINATION sollte die stärkste harmonische Verbindung aus dem Chart verwenden.

## Wachstum & Schatten
Schreibe 3 Unterkapitel:
### Dein größtes Wachstumsfeld
Was ist das zentrale Thema, das ${name} in diesem Leben lernen darf? Nicht als Schwäche formulieren — als Einladung zu etwas Größerem.

### Das Muster, das dich begleitet
Welches wiederkehrende Muster zeigt sich in ${pronoun}s Leben? Wo taucht die gleiche Herausforderung immer wieder auf? Was steckt dahinter?

### Der nächste Schritt
Konkret: Was wäre der eine, kleine nächste Schritt, den ${name} jetzt tun könnte? Ermutigung, keine Forderung.

KOMBINATION sollte die stärkste spannungsgeladene Verbindung aus dem Chart verwenden.`;
}

// ─── Prompt builder — Call 2 (sections 7-12) ─────────────────────────────────

function buildPromptCall2(
  chart: AstrologyChart,
  q: QuestionnaireAnswers,
  personCtx: string,
  name: string,
  pronoun: string,
  lang: string,
): string {
  const planet = (n: string) => {
    const p = chart.planets.find((pl) => pl.name === n);
    if (!p) return 'unbekannt';
    return `${p.sign} (${p.degree.toFixed(1)}°)${p.retrograde ? ' ℞' : ''}`;
  };

  const fourthHouse = chart.houses?.find((h) => h.house === 4);
  const secondHouse = chart.houses?.find((h) => h.house === 2);

  return `Du bist eine erfahrene, warmherzige Astrologin. Schreibe 6 weitere Abschnitte eines persönlichen Horoskops für ${name}.
Das ist der zweite Teil — die ersten 6 Abschnitte wurden bereits geschrieben.

${buildAbsoluteRules(lang)}

## Planetenpositionen von ${name}
Sonne: ${planet('Sonne')}, Mond: ${planet('Mond')}, Mars: ${planet('Mars')}
Saturn: ${planet('Saturn')}, Jupiter: ${planet('Jupiter')}, Venus: ${planet('Venus')}
Neptun: ${planet('Neptun')}, Pluto: ${planet('Pluto')}, Uranus: ${planet('Uranus')}
${chart.northNodeSign ? `Nordknoten: ${chart.northNodeSign} — Richtung der Seele` : ''}
${chart.southNodeSign ? `Südknoten: ${chart.southNodeSign} — Mitgebrachte Fähigkeiten` : ''}
${fourthHouse ? `Thema Herkunft & Familie: Zeichen ${fourthHouse.sign}` : ''}
${secondHouse ? `Thema Ressourcen & Sicherheit: Zeichen ${secondHouse.sign}` : ''}

## Was ${name} über sich selbst sagt
${personCtx}

## Aktuelles Datum (für "Dein Jahr")
April 2026

## Aufgabe
Schreibe GENAU diese 6 Abschnitte in dieser Reihenfolge.
Beginne jeden Abschnitt mit "## " gefolgt vom EXAKTEN deutschen Titel (Überschriften bleiben auf Deutsch für die Verarbeitung).
Jedes Kapitel: 3-4 Unterkapitel (### Titel) + CHECKLISTE nach jedem Unterkapitel + KOMBINATION + KERNAUSSAGEN + AFFIRMATION. Pronomen: ${pronoun}.

## Herkunft & Familie
Schreibe 3 Unterkapitel:
### Was dich geprägt hat
Welche Kindheitserfahrungen, Familiendynamiken und Prägungen tragen ${name} bis heute? Was wurde mitgegeben — an Stärken, Werten und Wunden?

### Muster aus der Herkunftsfamilie
Welche Verhaltensmuster hat ${name} übernommen — bewusst oder unbewusst? Was wiederholt sich jetzt in ${pronoun}s Erwachsenenleben?

### Was du loslassen und was du integrieren kannst
Was darf ${name} aus der Vergangenheit loslassen? Was ist ein wertvolles Erbe, das ${pronoun} bewusst mitnehmen kann? Konkret und einladend.

KOMBINATION sollte Mond + Saturn verwenden.

## Dein Seelenweg
Schreibe 3 Unterkapitel:
### Wohin du wachsen willst (Nordknoten)
Was ist die Richtung der Seele für ${name} — in Alltagssprache? Nicht metaphysisch. Was fühlt sich gleichzeitig neu und richtig an? Wo muss ${pronoun} sich etwas trauen?

### Was du mitgebracht hast (Südknoten)
Welche Fähigkeiten und Verhaltensmuster hat ${name} mitgebracht? Wo ist die Komfortzone — und warum ist es wichtig, sie manchmal zu verlassen?

### Wenn du auf dem richtigen Weg bist
Wie fühlt sich Wachstum für ${name} an? Welche inneren Signale zeigen, dass ${pronoun} auf dem richtigen Weg ist? Konkrete Hinweise.

KOMBINATION sollte Nordknoten-Zeichen + Saturn verwenden.

## Energie & Gesundheit
Schreibe 3 Unterkapitel:
### Dein Energierhythmus
Wie funktioniert ${name}s natürlicher Energiehaushalt? Wann hat ${pronoun} Hochphasen, wann braucht ${pronoun} Rückzug? Phasen, Rhythmen, Zyklen.

### Was dich auflädt
Konkrete Dinge, Situationen, Beziehungen — die ${name} wirklich regenerieren. Nicht abstrakt, sondern sehr spezifisch auf das Chart bezogen.

### Deine Warnsignale
Was sind die Zeichen, dass ${name} über die eigenen Grenzen geht? Körperliche und emotionale Warnsignale. Wie kommt ${pronoun} zurück ins Gleichgewicht?

KOMBINATION sollte Mars + Mond verwenden.

## Geld & Sicherheit
Schreibe 3 Unterkapitel:
### Dein Geldverhalten
Wie geht ${name} natürlicherweise mit Geld um — sparsam, großzügig, ängstlich, sorglos? Welche Muster sind erkennbar? Konkret und ohne Wertung.

### Was dir wirklich Sicherheit gibt
Nicht Geld an sich — sondern was dahinter steht. Was ist das eigentliche Bedürfnis hinter dem Umgang mit Ressourcen? Tieferes Verständnis für ${name}s Sicherheitsthema.

### Dein Potenzial mit Geld & Ressourcen
Welche Chancen und Fallen gibt es? Welche unbewussten Überzeugungen könnten ${name} limitieren? Einladung zu einem gesünderen, bewussteren Umgang.

KOMBINATION sollte Venus + Jupiter verwenden.

## Dein Jahr
Schreibe 3 Unterkapitel:
### Was jetzt besonders lebendig ist
Welche Chart-Themen und Charakterzüge sind ab April 2026 besonders aktiv? Was steht gerade im Fokus von ${name}s Entwicklung? Nicht als Vorhersage — als Charakterprofil.

### Deine Chancen in den nächsten Monaten
Welche natürlichen Stärken und Tendenzen begünstigen welche Bereiche jetzt? Wo liegt ${name}s größtes Potenzial gerade? Konkret und ermutigend.

### Dein persönlicher Fokus
Welches eine Thema sollte ${name} besonders bewusst kultivieren? Ein konkreter, persönlicher Fokus für die nächsten 12 Monate — bodenständig und umsetzbar.

KOMBINATION sollte Sonne + Jupiter (Wachstum) verwenden.

## Persönliche Botschaft
Schreibe 3 Unterkapitel:
### Was dein Chart über dich sagt
Eine direkte, warmherzige Zusammenfassung: Das Wesentlichste, das ${name}s Chart über ${pronoun} aussagt. Alles Fragebogen-Angaben einbeziehen. Substantiell, ehrlich.

### Deine 3 wichtigsten Lebenslektionen
Drei konkrete Wachstumslektionen — in einfacher, direkter Sprache. Keine Floskeln. Was darf ${name} in diesem Leben wirklich lernen?

### Eine letzte Frage an dich
2-3 echte Reflexionsfragen, die ${name} zum Nachdenken einladen. Nicht rhetorisch — sondern wirklich tiefgehend, auf Basis der persönlichen Angaben. Mit einem abschließenden, aufbauenden Satz.

KOMBINATION sollte die Chart-Kombination verwenden, die ${name} am stärksten definiert.`;
}

// ─── Prompt builder — Call 3 (planet deep-dives) ─────────────────────────────

function buildPromptCall3(
  chart: AstrologyChart,
  name: string,
  pronoun: string,
  lang: string,
): string {
  const planet = (n: string) => {
    const p = chart.planets.find((pl) => pl.name === n);
    if (!p) return 'unbekannt';
    return `${p.sign} (${p.degree.toFixed(1)}°)${p.retrograde ? ' ℞' : ''}${p.house ? ` · Haus ${p.house}` : ''}`;
  };

  const langInstruction = lang !== 'de'
    ? `Write the personal analysis text in ${languageName(lang)}. Keep the ## headers in German for parsing purposes.`
    : 'Write entirely in German.';

  return `Du bist eine erfahrene Astrologin. Schreibe eine persönliche Planeten-Tiefenanalyse für ${name}.

${langInstruction}

## REGELN:
- Kein Fachjargon — einfache, verständliche Alltagssprache
- Keine Bullet Points — fließender Prosatext
- Pro Planet: 400-500 Wörter persönliche Deutung
- Beziehe die konkrete Zeichenstellung persönlich auf ${name} ein
- Direkt, herzlich, konkret. Pronomen: ${pronoun}

## Planetenpositionen von ${name}:
Sonne: ${planet('Sonne')}
Mond: ${planet('Mond')}
Merkur: ${planet('Merkur')}
Venus: ${planet('Venus')}
Mars: ${planet('Mars')}
Jupiter: ${planet('Jupiter')}
Saturn: ${planet('Saturn')}
Uranus: ${planet('Uranus')}
Neptun: ${planet('Neptun')}
Pluto: ${planet('Pluto')}

## Aufgabe
Schreibe für JEDEN der 10 Planeten einen separaten Abschnitt.
Beginne jeden Abschnitt mit "## " gefolgt vom deutschen Planetnamen (z.B. "## Sonne", "## Mond", etc.).
Schreibe für jeden Planeten 400-500 Wörter persönliche, lebensnahe Deutung.

## Sonne
## Mond
## Merkur
## Venus
## Mars
## Jupiter
## Saturn
## Uranus
## Neptun
## Pluto`;
}

// ─── Parse Gemini response into section objects ───────────────────────────────

function parseSectionsFromResponse(raw: string): InterpretationSection[] {
  const sections: InterpretationSection[] = [];
  const parts = raw.split(/\n##\s+/);

  for (const part of parts) {
    const newline = part.indexOf('\n');
    if (newline === -1) continue;
    const rawTitle = part.slice(0, newline).trim();
    const body = part.slice(newline + 1).trim();
    if (!body || body.length < 20) continue;

    const meta = SECTION_META.find((s) => s.title === rawTitle || rawTitle.startsWith(s.title));
    if (meta) {
      sections.push({ id: meta.id, title: meta.title, icon: meta.icon, content: body });
    }
  }

  // If parsing failed, return one big section
  if (sections.length === 0 && raw.trim().length > 100) {
    sections.push({ id: 'full', title: 'Dein Horoskop', icon: '✦', content: raw.trim() });
  }

  return sections;
}

// ─── Parse planet deep-dives from Call 3 response ────────────────────────────

const PLANET_NAMES_DE = ['Sonne','Mond','Merkur','Venus','Mars','Jupiter','Saturn','Uranus','Neptun','Pluto'];

function parsePlanetSections(raw: string): { name: string; content: string }[] {
  const result: { name: string; content: string }[] = [];
  const parts = raw.split(/\n##\s+/);

  for (const part of parts) {
    const newline = part.indexOf('\n');
    if (newline === -1) continue;
    const rawTitle = part.slice(0, newline).trim();
    const body = part.slice(newline + 1).trim();
    if (!body || body.length < 20) continue;

    const matched = PLANET_NAMES_DE.find((pn) => rawTitle === pn || rawTitle.startsWith(pn));
    if (matched) {
      result.push({ name: matched, content: body });
    }
  }

  return result;
}

// ─── Helper: resolve pronoun ─────────────────────────────────────────────────

function resolvePronoun(pronounsStr: string): string {
  if (!pronounsStr) return 'sie/er';
  if (pronounsStr.startsWith('sie')) return 'sie';
  if (pronounsStr.startsWith('er')) return 'er';
  if (pronounsStr.startsWith('they')) return 'they';
  return 'sie/er';
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { supabase, userId } = await getOptionalUser(req);

    const {
      birthData,
      readingType = 'natal_chart',
      questionnaire,
      language: requestLanguage,
    }: {
      birthData: BirthData;
      readingType?: string;
      questionnaire?: QuestionnaireAnswers;
      language?: string;
    } = await req.json();

    if (!birthData?.birthDate || birthData?.birthLat == null || birthData?.birthLng == null) {
      return new Response(JSON.stringify({ error: 'Missing birth data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Resolve language: request param overrides profile ──────────────────
    let language: string = requestLanguage ?? questionnaire?.outputLanguage ?? 'de';

    let profileDisplayName: string | undefined;

    if (userId) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('preferred_language, display_name')
        .eq('id', userId)
        .single();

      profileDisplayName = profile?.display_name ?? undefined;
      // Only fall back to profile language if no language was provided in the request
      if (!requestLanguage && !questionnaire?.outputLanguage) {
        language = (profile?.preferred_language ?? 'de') as SupportedLanguage;
      }
    }

    // ── Build chart: try AstrologyAPI first, fall back to VSOP87 ───────────
    let chart: AstrologyChart = buildChart(birthData);
    let source: 'vsop87' | 'astrologyapi' = 'vsop87';

    const apiChart = await fetchFromAstrologyAPI(birthData);
    if (apiChart) {
      chart = apiChart;
      source = 'astrologyapi';
    }

    // ── Prepare questionnaire context ────────────────────────────────────────
    const q: QuestionnaireAnswers = questionnaire ?? {};
    const personName = q.name || profileDisplayName || 'du';
    const pronoun = resolvePronoun(q.pronouns ?? '');
    const personCtx = buildPersonContext(q);

    // ── Generate content in THREE parallel Gemini calls ──────────────────────
    const systemPrompt1 = buildPromptCall1(chart, q, personCtx, personName, pronoun, language);
    const systemPrompt2 = buildPromptCall2(chart, q, personCtx, personName, pronoun, language);
    const systemPrompt3 = buildPromptCall3(chart, personName, pronoun, language);

    const [raw1, raw2, raw3] = await Promise.all([
      generateText({
        systemPrompt: systemPrompt1,
        userMessage: `Schreibe jetzt die ersten 6 Abschnitte des persönlichen Horoskops für ${personName}. Alle 6 Abschnitte vollständig ausgeschrieben — je 1500-2000 Wörter Fließtext, gefolgt von KERNAUSSAGEN und AFFIRMATION. Nicht kürzen.`,
        maxOutputTokens: 16000,
        usePro: false,
      }),
      generateText({
        systemPrompt: systemPrompt2,
        userMessage: `Schreibe jetzt die Abschnitte 7-12 des persönlichen Horoskops für ${personName}. Alle 6 Abschnitte vollständig ausgeschrieben — je 1500-2000 Wörter Fließtext, gefolgt von KERNAUSSAGEN und AFFIRMATION. Nicht kürzen.`,
        maxOutputTokens: 16000,
        usePro: false,
      }),
      generateText({
        systemPrompt: systemPrompt3,
        userMessage: `Schreibe jetzt die Planeten-Tiefenanalyse für ${personName}. Alle 10 Planeten, je 400-500 Wörter persönliche Deutung. Ausführlich und tiefgründig.`,
        maxOutputTokens: 10000,
        usePro: false,
      }),
    ]);

    const sections1 = parseSectionsFromResponse(raw1);
    const sections2 = parseSectionsFromResponse(raw2);
    const sections = [...sections1, ...sections2];

    const planetSections = parsePlanetSections(raw3);

    // ── Persist reading (authenticated users only) ───────────────────────────
    if (userId) {
      await supabase.from('readings').insert({
        user_id: userId,
        module: 'astrology',
        reading_type: readingType,
        astrology_chart: chart,
        interpretation: sections.map((s) => `## ${s.title}\n${s.content}`).join('\n\n'),
        interpretation_language: language,
        input_mode: 'text',
        voice_used: false,
      });
    }

    return new Response(
      JSON.stringify({ chart, sections, planetSections, source }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
