// Note: PDF export requires expo-print and expo-sharing
// Install with: npx expo install expo-print expo-sharing
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Animated, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { C } from '@/lib/colors';
import { useSupabase } from '@/hooks/useSupabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanetPosition {
  name: string;
  sign: string;
  degree: number;
  absoluteDegree: number;
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
  risingSign?: string;
  midheaven?: string;
  ascendantDegree?: number;
  houses?: HouseCusp[];
  aspects: { planet1: string; planet2: string; type: string; orb: number }[];
  northNodeSign?: string;
  southNodeSign?: string;
}

interface InterpretationSection {
  id: string;
  title: string;
  icon: string;
  content: string;
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

// ─── Section colors ────────────────────────────────────────────────────────────

const SECTION_COLORS: Record<string, string> = {
  'Dein Persönlichkeitskern': '#C8A96E',
  'Wie du liebst':            '#D97DBE',
  'Beruf & Berufung':         '#7B8CDE',
  'Deine Innenwelt':          '#6DCFA8',
  'Stärken & Superkräfte':    '#E8B86D',
  'Wachstum & Schatten':      '#8BB8E8',
  'Herkunft & Familie':       '#A8C4D4',
  'Dein Seelenweg':           '#9B8AC4',
  'Energie & Gesundheit':     '#7DC4A8',
  'Geld & Sicherheit':        '#C4A87D',
  'Dein Jahr':                '#D4B896',
  'Persönliche Botschaft':    '#C8A96E',
};

// ─── Loading screen ───────────────────────────────────────────────────────────

const LOADING_STARS = ['✦', '✧', '✦', '★', '✧', '✦', '★', '✧', '✦', '★', '✧', '✦'];
const LOADING_MESSAGES = [
  'Planetenpositionen werden berechnet…',
  'Dein Persönlichkeitskern wird gedeutet…',
  'Wie du liebst wird erforscht…',
  'Beruf & Berufung kommt ans Licht…',
  'Deine Innenwelt wird betrachtet…',
  'Stärken & Superkräfte werden erkannt…',
  'Wachstum & Schatten werden beleuchtet…',
  'Herkunft & Familie wird gedeutet…',
  'Dein Seelenweg wird kartiert…',
  'Energie & Gesundheit werden analysiert…',
  'Geld & Sicherheit kommt ins Bild…',
  'Deine persönliche Botschaft wird verfasst…',
  'Planeten-Tiefenanalyse läuft…',
  'PDF-Inhalt wird vorbereitet…',
];

function LoadingScreen({ birthDate }: { birthDate: string }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [starCount, setStarCount] = useState(1);
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    const msgInterval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 3500);

    const starInterval = setInterval(() => {
      setStarCount((c) => (c < LOADING_STARS.length ? c + 1 : 1));
    }, 1800);

    return () => {
      clearInterval(msgInterval);
      clearInterval(starInterval);
    };
  }, []);

  return (
    <View style={styles.loadingContainer}>
      <Animated.Text style={[styles.loadingStarRow, { opacity: pulse }]}>
        {LOADING_STARS.slice(0, starCount).join('  ')}
      </Animated.Text>
      <Text style={styles.loadingTitle}>Dein Horoskop wird erstellt</Text>
      {birthDate ? (
        <Text style={styles.loadingBirthdate}>Geburtstag: {birthDate}</Text>
      ) : null}
      <Text style={styles.loadingMsg}>{LOADING_MESSAGES[msgIndex]}</Text>
      <Text style={styles.loadingNote}>
        12 persönliche Abschnitte + Planeten-Tiefenanalyse.{'\n'}Das dauert etwa 45–90 Sekunden.
      </Text>
    </View>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  section,
  index,
}: {
  section: InterpretationSection;
  index: number;
}) {
  const [expanded, setExpanded] = useState(index < 3);
  const color = SECTION_COLORS[section.title] ?? C.gold;
  const paragraphs = section.content.split(/\n\n+/).filter(Boolean);

  return (
    <View style={[styles.sectionCard, { borderTopColor: color, borderTopWidth: 3 }]}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
      >
        <Text style={styles.sectionIcon}>{section.icon}</Text>
        <Text style={[styles.sectionTitle, { color }]}>{section.title}</Text>
        <Text style={[styles.sectionChevron, { color }]}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded &&
        paragraphs.map((para, i) => (
          <Text key={i} style={styles.sectionBody}>
            {para}
          </Text>
        ))}
    </View>
  );
}

// ─── Date formatter ───────────────────────────────────────────────────────────

const GERMAN_MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

function formatBirthDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [, month, day] = dateStr.split('-').map(Number);
    return `${day}. ${GERMAN_MONTHS[month - 1]}`;
  } catch {
    return dateStr;
  }
}

// ─── PDF HTML generator ───────────────────────────────────────────────────────

const PLANET_SYMBOLS: Record<string, string> = {
  'Sonne': '☀️',
  'Mond': '🌙',
  'Merkur': '☿',
  'Venus': '♀',
  'Mars': '♂',
  'Jupiter': '♃',
  'Saturn': '♄',
  'Uranus': '♅',
  'Neptun': '♆',
  'Pluto': '♇',
  'Chiron': '⚷',
  'Nordknoten': '☊',
  'Südknoten': '☋',
};

const ELEMENT_GROUPS: Record<string, string[]> = {
  'Feuer': ['Widder', 'Löwe', 'Schütze'],
  'Erde': ['Stier', 'Jungfrau', 'Steinbock'],
  'Luft': ['Zwillinge', 'Waage', 'Wassermann'],
  'Wasser': ['Krebs', 'Skorpion', 'Fische'],
};

const MODALITY_GROUPS: Record<string, string[]> = {
  'Kardinal': ['Widder', 'Krebs', 'Waage', 'Steinbock'],
  'Fix': ['Stier', 'Löwe', 'Skorpion', 'Wassermann'],
  'Mutable': ['Zwillinge', 'Jungfrau', 'Schütze', 'Fische'],
};

const PLANET_MEANINGS: Record<string, string> = {
  'Sonne': 'Dein Kernwesen, Lebensantrieb und Identität',
  'Mond': 'Deine Gefühlswelt, emotionale Bedürfnisse und Intuitionen',
  'Merkur': 'Dein Denkstil, Kommunikation und geistige Verarbeitung',
  'Venus': 'Dein Liebesstil, Schönheitssinn und persönliche Werte',
  'Mars': 'Deine Energie, Antrieb und Durchsetzungskraft',
  'Jupiter': 'Dein Wachstum, Großzügigkeit und Lebensphilosophie',
  'Saturn': 'Deine Disziplin, Ausdauer und wichtigste Lernfelder',
  'Uranus': 'Dein Freiheitsdrang, Originalität und plötzliche Veränderungen',
  'Neptun': 'Deine Träume, Spiritualität und tiefen Sehnsüchte',
  'Pluto': 'Deine Transformation, Tiefenpsychologie und regenerative Kraft',
};

function generateHtml(
  name: string,
  sections: InterpretationSection[],
  planetSections: { name: string; content: string }[],
  chart: AstrologyChart,
  birthCity: string,
  birthDate: string,
): string {
  const currentYear = new Date().getFullYear();
  const formattedDate = formatBirthDate(birthDate);

  // ── Big Three ──────────────────────────────────────────────────────────────
  const bigThreeLine = `☀️ ${chart.sunSign} · 🌙 ${chart.moonSign} · ↑ ${chart.risingSign ?? '—'}`;

  // ── Conditional column flags ───────────────────────────────────────────────
  const hasHouseData  = chart.planets.some((p) => p.house != null);
  const hasRetroData  = chart.planets.some((p) => p.retrograde);

  // ── Planet table rows ──────────────────────────────────────────────────────
  const planetTableRows = chart.planets
    .filter((p) => p.name !== 'Aszendent' && p.name !== 'Midheaven')
    .map(
      (p) =>
        `<tr>
          <td style="font-size:18px;text-align:center">${PLANET_SYMBOLS[p.name] ?? ''}</td>
          <td><strong>${p.name}</strong></td>
          <td>${p.sign}</td>
          <td>${p.degree.toFixed(1)}°</td>
          ${hasHouseData ? `<td>${p.house != null ? `H${p.house}` : '—'}</td>` : ''}
          ${hasRetroData ? `<td style="text-align:center">${p.retrograde ? '<span style="color:#9B3000;font-weight:700">℞</span>' : '—'}</td>` : ''}
        </tr>`,
    )
    .join('');

  // ── Element distribution ───────────────────────────────────────────────────
  const elementCounts: Record<string, number> = { 'Feuer': 0, 'Erde': 0, 'Luft': 0, 'Wasser': 0 };
  const corePlanets = chart.planets.filter((p) =>
    ['Sonne','Mond','Merkur','Venus','Mars','Jupiter','Saturn','Uranus','Neptun','Pluto'].includes(p.name)
  );
  for (const p of corePlanets) {
    for (const [el, signs] of Object.entries(ELEMENT_GROUPS)) {
      if (signs.includes(p.sign)) { elementCounts[el]++; break; }
    }
  }
  const elementRows = Object.entries(elementCounts)
    .map(([el, count]) => {
      const barW = Math.round(Math.min(100, (count / 10) * 100) * 1.9); // max 190px
      const icons = ['🔥','🌍','💨','💧'];
      const elIdx = ['Feuer','Erde','Luft','Wasser'].indexOf(el);
      return `<tr>
        <td>${icons[elIdx] ?? ''} <strong>${el}</strong></td>
        <td>${count} Planeten</td>
        <td style="width:200px">
          <div style="background:#E8DCC8;border-radius:3px;height:12px;width:190px;display:block">
            <div style="background:#C8A96E;height:12px;border-radius:3px;width:${barW}px;display:block"></div>
          </div>
        </td>
      </tr>`;
    })
    .join('');

  // ── Element interpretation ─────────────────────────────────────────────────
  const sortedElements = Object.entries(elementCounts).sort((a, b) => b[1] - a[1]);
  const dominantEl = sortedElements[0][0];
  const dominantElCount = sortedElements[0][1];
  const secondEl = sortedElements[1]?.[0];
  const elInterps: Record<string, string> = {
    'Feuer': `Mit ${dominantElCount} von 10 Planeten im Feuerelement bist du vor allem leidenschaftlich, spontan und voller Lebensenergie. Du handelst instinktiv, bist begeisterungsfähig und liebst es, Dinge anzustoßen. Hinter deinem Handeln steckt echte innere Glut — du brauchst Projekte, Ziele und Menschen, die dich entflammen.${secondEl ? ` Das Erdelement (${secondEl}) als zweitstärkstes Element verleiht dir zusätzliche Stabilität.` : ''}`,
    'Erde': `Mit ${dominantElCount} von 10 Planeten im Erdelement bist du bodenständig, verlässlich und auf Beständigkeit ausgerichtet. Sicherheit, greifbare Ergebnisse und handfeste Qualität sind dir wichtig. Du baust langsam — aber was du baust, hält und hat Bestand.${secondEl ? ` Das Element ${secondEl} bringt Beweglichkeit und Inspiration in dein solides Wesen.` : ''}`,
    'Luft': `Mit ${dominantElCount} von 10 Planeten im Luftelement denkst du schnell, kommunizierst gerne und liebst den Austausch von Ideen. Verbindungen zu Menschen und Konzepten geben dir Energie. Du lebst viel im Kopf — und bist am lebendigsten, wenn du dich austauschen, lernen und verbinden kannst.${secondEl ? ` Das Element ${secondEl} erdet und vertieft dein Denken.` : ''}`,
    'Wasser': `Mit ${dominantElCount} von 10 Planeten im Wasserelement bist du ein tief fühlendes, intuitives Wesen. Emotionen, Empathie und seelische Verbindungen prägen dein inneres Erleben stark. Du spürst mehr, als du in Worte fassen kannst — und deine Intuition ist oft treffsicherer als jede Analyse.${secondEl ? ` Das Element ${secondEl} gibt dir zusätzliche Kraft und Ausdauer.` : ''}`,
  };
  const elementInterpretation = elInterps[dominantEl] ?? '';

  // ── Modality distribution ──────────────────────────────────────────────────
  const modalityCounts: Record<string, number> = { 'Kardinal': 0, 'Fix': 0, 'Mutable': 0 };
  for (const p of corePlanets) {
    for (const [mod, signs] of Object.entries(MODALITY_GROUPS)) {
      if (signs.includes(p.sign)) { modalityCounts[mod]++; break; }
    }
  }
  const modalityRows = Object.entries(modalityCounts)
    .map(([mod, count]) => {
      const barW = Math.round(Math.min(100, (count / 10) * 100) * 1.9);
      return `<tr>
        <td><strong>${mod}</strong></td>
        <td>${count} Planeten</td>
        <td style="width:200px">
          <div style="background:#E8DCC8;border-radius:3px;height:12px;width:190px;display:block">
            <div style="background:#C8A96E;height:12px;border-radius:3px;width:${barW}px;display:block"></div>
          </div>
        </td>
      </tr>`;
    })
    .join('');

  // ── Modality interpretation ────────────────────────────────────────────────
  const sortedModalities = Object.entries(modalityCounts).sort((a, b) => b[1] - a[1]);
  const dominantMod = sortedModalities[0][0];
  const dominantModCount = sortedModalities[0][1];
  const modInterps: Record<string, string> = {
    'Kardinal': `Mit ${dominantModCount} kardinalen Planeten bist du ein geborener Initiator. Du erkennst Möglichkeiten, startest Projekte und bringst Dinge ins Rollen — manchmal schneller, als andere folgen können. Deine Energie liegt im Anfangen, im Aufbrechen, im ersten mutigen Schritt. Einmal in Bewegung, bist du kaum aufzuhalten.`,
    'Fix': `Mit ${dominantModCount} fixen Planeten bist du ausdauernd, zielstrebig und loyal bis in die Knochen. Einmal entschieden, ziehst du es durch — selbst wenn andere längst aufgegeben hätten. Deine Stärke liegt in Beständigkeit, Tiefe und unerschütterlicher Verlässlichkeit. Menschen können sich auf dich verlassen.`,
    'Mutable': `Mit ${dominantModCount} mutablen Planeten bist du beweglich, anpassungsfähig und erstaunlich vielseitig. Du meisterst Übergänge und Veränderungen besser als die meisten, siehst verschiedene Perspektiven und findest immer einen Weg. Deine Stärke liegt im Vermitteln, im Verbinden und im geschickten Umgang mit dem Wandel des Lebens.`,
  };
  const modalityInterpretation = modInterps[dominantMod] ?? '';

  // ── Aspect counts ──────────────────────────────────────────────────────────
  const aspectTypes = [
    { type: 'Konjunktion', symbol: '☌', meaning: 'Vereinigung, Verstärkung' },
    { type: 'Sextil',      symbol: '⚹', meaning: 'Gelegenheit, Fließen' },
    { type: 'Quadrat',     symbol: '□', meaning: 'Spannung, Wachstumsimpuls' },
    { type: 'Trigon',      symbol: '△', meaning: 'Harmonie, Talent' },
    { type: 'Opposition',  symbol: '☍', meaning: 'Polarität, Integration' },
  ];
  const aspectCounts: Record<string, number> = {};
  for (const a of chart.aspects) { aspectCounts[a.type] = (aspectCounts[a.type] ?? 0) + 1; }
  const aspectOverviewRows = aspectTypes
    .map(
      (at) =>
        `<tr>
          <td>${at.symbol} <strong>${at.type}</strong></td>
          <td>${aspectCounts[at.type] ?? 0}×</td>
          <td>${at.meaning}</td>
        </tr>`,
    )
    .join('');

  // ── Aspect matrix ──────────────────────────────────────────────────────────
  const matrixPlanets = ['Sonne','Mond','Merkur','Venus','Mars','Jupiter','Saturn','Uranus','Neptun','Pluto'];
  const aspectMap: Record<string, { type: string }> = {};
  for (const a of chart.aspects) {
    aspectMap[`${a.planet1}|${a.planet2}`] = { type: a.type };
    aspectMap[`${a.planet2}|${a.planet1}`] = { type: a.type };
  }

  function aspectCellClass(type: string): string {
    switch (type) {
      case 'Trigon':     return 'asp-trine';
      case 'Sextil':     return 'asp-sextile';
      case 'Quadrat':    return 'asp-square';
      case 'Opposition': return 'asp-opposition';
      case 'Konjunktion': return 'asp-conjunction';
      default: return '';
    }
  }
  function aspectAbbr(type: string): string {
    switch (type) {
      case 'Trigon':     return 'T';
      case 'Sextil':     return 'S';
      case 'Quadrat':    return 'Q';
      case 'Opposition': return 'O';
      case 'Konjunktion': return 'K';
      default: return '';
    }
  }

  const matrixShortNames: Record<string, string> = {
    'Sonne': '☀', 'Mond': '☽', 'Merkur': '☿', 'Venus': '♀', 'Mars': '♂',
    'Jupiter': '♃', 'Saturn': '♄', 'Uranus': '♅', 'Neptun': '♆', 'Pluto': '♇',
  };

  const matrixHeader = `<tr><th class="matrix-corner"></th>${matrixPlanets.map((p) => `<th class="matrix-head">${matrixShortNames[p] ?? p.slice(0,3)}</th>`).join('')}</tr>`;
  const matrixRows = matrixPlanets
    .map((rowP) => {
      const cells = matrixPlanets.map((colP) => {
        if (rowP === colP) return `<td class="matrix-diag">—</td>`;
        const key = `${rowP}|${colP}`;
        const asp = aspectMap[key];
        if (!asp) return `<td class="matrix-empty"></td>`;
        return `<td class="${aspectCellClass(asp.type)}">${aspectAbbr(asp.type)}</td>`;
      }).join('');
      return `<tr><th class="matrix-row-head">${matrixShortNames[rowP] ?? rowP.slice(0,3)} ${rowP}</th>${cells}</tr>`;
    })
    .join('');

  // ── Table of Contents ──────────────────────────────────────────────────────
  const allTocSections = [
    ...sections.map((s, i) => `<div class="toc-item"><span class="toc-num">${String(i + 1).padStart(2, '0')}</span><span class="toc-title">${s.icon} ${s.title}</span></div>`),
    `<div class="toc-item"><span class="toc-num">${String(sections.length + 1).padStart(2, '0')}</span><span class="toc-title">✦ Deine Planeten im Detail</span></div>`,
    `<div class="toc-item"><span class="toc-num">${String(sections.length + 2).padStart(2, '0')}</span><span class="toc-title">📋 Anhang &amp; Glossar</span></div>`,
  ].join('');

  // ── Chapter content parser ─────────────────────────────────────────────────
  interface ParsedSubSection {
    title: string;
    prose: string;
    checklist: string[];
  }
  interface ParsedChapter {
    subSections: ParsedSubSection[];
    kombination: string;
    insights: string[];
    affirmation: string;
    rawProse: string; // fallback if no sub-sections parsed
  }

  function parseChapterContent(raw: string): ParsedChapter {
    const kernIdx = raw.search(/\nKERNAUSSAGEN:/i);
    const affirmIdx = raw.search(/\nAFFIRMATION:/i);
    const kombIdx = raw.search(/\nKOMBINATION:/i);

    // Extract KERNAUSSAGEN
    const insights: string[] = [];
    if (kernIdx !== -1) {
      const end = affirmIdx !== -1 ? affirmIdx : raw.length;
      const bulletText = raw.slice(kernIdx + 15, end);
      bulletText.split('\n').forEach((line) => {
        const cleaned = line.replace(/^[•\-\*]\s*/, '').trim();
        if (cleaned.length > 5) insights.push(cleaned);
      });
    }

    // Extract AFFIRMATION
    let affirmation = '';
    if (affirmIdx !== -1) {
      const affLine = raw.slice(affirmIdx, affirmIdx + 300);
      const m = affLine.match(/AFFIRMATION:\s*["\u201E\u201C\u201D]?([^"\u201E\u201C\u201D\n]{10,})["\u201E\u201C\u201D]?/i);
      if (m) affirmation = m[1].trim();
    }

    // Extract KOMBINATION
    let kombination = '';
    if (kombIdx !== -1) {
      const end = Math.min(
        kernIdx !== -1 ? kernIdx : raw.length,
        kombIdx + 500,
      );
      const kombLine = raw.slice(kombIdx + 1, end).split('\n')[0].replace(/^KOMBINATION:\s*/i, '').trim();
      kombination = kombLine;
    }

    // Determine body (before KOMBINATION, or before KERNAUSSAGEN)
    const bodyEnd = kombIdx !== -1 ? kombIdx : kernIdx !== -1 ? kernIdx : raw.length;
    const bodyRaw = raw.slice(0, bodyEnd).trim();

    // Parse sub-sections (### Title)
    const subSections: ParsedSubSection[] = [];
    const subParts = bodyRaw.split(/\n###\s+/);

    if (subParts.length > 1) {
      // First part before any ### is intro text (usually empty or short)
      for (let i = 1; i < subParts.length; i++) {
        const part = subParts[i];
        const newlineIdx = part.indexOf('\n');
        if (newlineIdx === -1) continue;
        const title = part.slice(0, newlineIdx).trim();
        const rest = part.slice(newlineIdx + 1).trim();

        // Extract CHECKLISTE from this sub-section
        const checkIdx = rest.search(/\nCHECKLISTE:/i);
        let prose = rest;
        const checklist: string[] = [];
        if (checkIdx !== -1) {
          prose = rest.slice(0, checkIdx).trim();
          const checkText = rest.slice(checkIdx + 12);
          checkText.split('\n').forEach((line) => {
            const cleaned = line.replace(/^[•\-\*]\s*/, '').trim();
            if (cleaned.length > 5) checklist.push(cleaned);
          });
        }

        if (title) subSections.push({ title, prose, checklist });
      }
    }

    return {
      subSections,
      kombination,
      insights,
      affirmation,
      rawProse: bodyRaw,
    };
  }

  // ── Chapters HTML ──────────────────────────────────────────────────────────
  const chaptersHtml = sections
    .map((s, i) => {
      const parsed = parseChapterContent(s.content);

      // Sub-sections HTML
      const subSectionsHtml = parsed.subSections.length > 0
        ? parsed.subSections.map((sub) => {
            const subParas = sub.prose
              .split(/\n\n+/)
              .filter(Boolean)
              .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
              .join('');
            const checklistHtml = sub.checklist.length > 0
              ? `<div class="checklist-box">
                  <div class="checklist-label">Das trifft auf dich zu</div>
                  ${sub.checklist.map((item) => `<div class="checklist-item"><span class="checklist-check">✓</span><span>${item}</span></div>`).join('')}
                </div>`
              : '';
            return `<div class="sub-section">
              <h3 class="sub-section-title">${sub.title}</h3>
              ${subParas}
              ${checklistHtml}
            </div>`;
          }).join('')
        : (() => {
            // Fallback: render raw prose without sub-sections
            const paragraphs = parsed.rawProse
              .split(/\n\n+/)
              .filter(Boolean)
              .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
              .join('');
            return `<div class="section-intro">${paragraphs}</div>`;
          })();

      // KOMBINATION box
      const kombinationHtml = parsed.kombination
        ? `<div class="kombination-box">
            <div class="kombination-label">⚡ Deine einzigartige Kombination</div>
            <div class="kombination-text">${parsed.kombination}</div>
          </div>`
        : '';

      // KERNAUSSAGEN box
      const insightBoxHtml = parsed.insights.length > 0
        ? `<div class="insight-box">
            <div class="insight-box-title">Kernaussagen</div>
            ${parsed.insights.map((item) => `<div class="insight-item"><span class="insight-bullet">✦</span><span>${item}</span></div>`).join('')}
          </div>`
        : '';

      // AFFIRMATION
      const affirmationHtml = parsed.affirmation
        ? `<div class="affirmation">
            <div class="affirmation-label">Deine Affirmation</div>
            „${parsed.affirmation}"
          </div>`
        : '';

      return `<div class="page-break">
  <div class="chapter-banner">
    <div class="chapter-num">Kapitel ${i + 1} von ${sections.length}</div>
    <span class="chapter-icon-large">${s.icon}</span>
    <h2 class="chapter-title-banner">${s.title}</h2>
  </div>
  ${subSectionsHtml}
  ${kombinationHtml}
  ${insightBoxHtml}
  ${affirmationHtml}
  <div class="section-ornament">✦ · · · ✦</div>
</div>`;
    })
    .join('\n');

  // ── Planet deep-dives HTML ─────────────────────────────────────────────────
  const planetDeepDivesHtml = planetSections.length > 0
    ? `<div class="page-break">
        <div class="chapter-banner" style="margin-bottom:40px">
          <div class="chapter-num">Vertiefung</div>
          <span class="chapter-icon-large">✦</span>
          <h2 class="chapter-title-banner">Deine Planeten im Detail</h2>
        </div>
        <p class="section-intro" style="margin-bottom:32px">Was jeder Planet persönlich für dich bedeutet — seine Energie, seine Botschaft, sein Einfluss auf dein Leben.</p>
        ${planetSections
          .map((ps) => {
            const sym = PLANET_SYMBOLS[ps.name] ?? '';
            const meaning = PLANET_MEANINGS[ps.name] ?? '';
            const planetSign = chart.planets.find((p) => p.name === ps.name)?.sign ?? '';
            const { rawProse: planetProse } = parseChapterContent(ps.content);
            const planetParagraphs = planetProse
              .split(/\n\n+/)
              .filter(Boolean)
              .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
              .join('');
            return `<div class="planet-block">
              <div class="planet-sidebar">
                <div class="planet-symbol-large">${sym}</div>
                <div class="planet-name-sidebar">${ps.name}</div>
                ${planetSign ? `<div class="planet-sign-sidebar">${planetSign}</div>` : ''}
              </div>
              <div class="planet-body">
                ${meaning ? `<div class="planet-meaning-box">${meaning}</div>` : ''}
                ${planetParagraphs}
              </div>
            </div>`;
          })
          .join('\n')}
        <div class="section-ornament">✦ · · · ✦</div>
      </div>`
    : '';

  // ── House reference table ──────────────────────────────────────────────────
  const houseMeanings = [
    ['1', 'Persönlichkeit, Erscheinung, erster Eindruck'],
    ['2', 'Ressourcen, Geld, Werte, Besitz'],
    ['3', 'Kommunikation, Geschwister, kurze Reisen'],
    ['4', 'Herkunft, Familie, Zuhause, Wurzeln'],
    ['5', 'Kreativität, Kinder, Liebe, Freude'],
    ['6', 'Gesundheit, Arbeit, Alltagsroutinen'],
    ['7', 'Partnerschaft, Ehe, enge Beziehungen'],
    ['8', 'Transformation, Tiefe, gemeinsame Ressourcen'],
    ['9', 'Philosophie, Reisen, höhere Bildung, Glaube'],
    ['10', 'Beruf, öffentliche Rolle, Ruf, Karriere'],
    ['11', 'Freundschaften, Gruppen, Visionen, Ideale'],
    ['12', 'Rückzug, Unbewusstes, Spiritualität, Isolation'],
  ];

  const houseTableRows = houseMeanings
    .map(([num, meaning]) => {
      const houseData = chart.houses?.find((h) => h.house === parseInt(num));
      return `<tr>
        <td style="text-align:center;font-weight:bold;color:#C8A96E">${num}</td>
        <td>${houseData ? `<strong>${houseData.sign}</strong> · ${houseData.degree.toFixed(1)}°` : '—'}</td>
        <td>${meaning}</td>
      </tr>`;
    })
    .join('');

  // ── Zodiac glossary ────────────────────────────────────────────────────────
  const zodiacGlossary = [
    ['♈ Widder', '21.3–19.4', 'Feuer, Kardinal', 'Pioniergeist, Mut, Direktheit'],
    ['♉ Stier', '20.4–20.5', 'Erde, Fix', 'Beständigkeit, Genuss, Verlässlichkeit'],
    ['♊ Zwillinge', '21.5–20.6', 'Luft, Mutable', 'Neugier, Kommunikation, Vielseitigkeit'],
    ['♋ Krebs', '21.6–22.7', 'Wasser, Kardinal', 'Fürsorge, Intuition, Heimatliebe'],
    ['♌ Löwe', '23.7–22.8', 'Feuer, Fix', 'Kreativität, Führung, Großzügigkeit'],
    ['♍ Jungfrau', '23.8–22.9', 'Erde, Mutable', 'Analyse, Dienst, Präzision'],
    ['♎ Waage', '23.9–22.10', 'Luft, Kardinal', 'Harmonie, Gerechtigkeit, Ästhetik'],
    ['♏ Skorpion', '23.10–21.11', 'Wasser, Fix', 'Tiefe, Transformation, Intensität'],
    ['♐ Schütze', '22.11–21.12', 'Feuer, Mutable', 'Freiheit, Philosophie, Abenteuer'],
    ['♑ Steinbock', '22.12–19.1', 'Erde, Kardinal', 'Ehrgeiz, Disziplin, Verantwortung'],
    ['♒ Wassermann', '20.1–18.2', 'Luft, Fix', 'Originalität, Humanismus, Unabhängigkeit'],
    ['♓ Fische', '19.2–20.3', 'Wasser, Mutable', 'Empathie, Kreativität, Spiritualität'],
  ];

  const zodiacRows = zodiacGlossary
    .map(
      ([sign, dates, element, traits]) =>
        `<tr><td><strong>${sign}</strong></td><td>${dates}</td><td>${element}</td><td>${traits}</td></tr>`,
    )
    .join('');

  // ── Big Three cards ────────────────────────────────────────────────────────
  const big3Cards = `
    <div class="big3-grid">
      <div class="big3-card">
        <div class="big3-symbol">☀️</div>
        <div class="big3-label">Sonne</div>
        <div class="big3-value">${chart.sunSign}</div>
        <div class="big3-meaning">Dein Wesenskern</div>
      </div>
      <div class="big3-card">
        <div class="big3-symbol">🌙</div>
        <div class="big3-label">Mond</div>
        <div class="big3-value">${chart.moonSign}</div>
        <div class="big3-meaning">Deine Gefühlswelt</div>
      </div>
      <div class="big3-card">
        <div class="big3-symbol">↑</div>
        <div class="big3-label">Aszendent</div>
        <div class="big3-value">${chart.risingSign ?? '—'}</div>
        <div class="big3-meaning">Wie andere dich wahrnehmen</div>
      </div>
    </div>`;

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Horoskop – ${name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 11px;
    line-height: 1.75;
    color: #1C1409;
    background: #FAF8F3;
    max-width: 740px;
    margin: 0 auto;
    padding: 0 20mm;
  }
  p { margin: 0 0 10px; text-align: justify; }

  /* ── Cover ── */
  .cover {
    min-height: 90vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    page-break-after: always;
    padding: 40px;
  }
  .cover-stars { font-size: 20px; letter-spacing: 16px; color: #C8A96E; margin-bottom: 48px; }
  .cover-label { font-family: system-ui, sans-serif; font-size: 9px; letter-spacing: 4px; text-transform: uppercase; color: #8B6914; margin-bottom: 20px; }
  .cover-name { font-size: 56px; color: #1C1409; line-height: 1.1; margin-bottom: 16px; font-weight: 300; letter-spacing: -1px; }
  .cover-big3 { font-size: 16px; color: #5C4010; margin-bottom: 8px; letter-spacing: 1px; }
  .cover-divider { color: #C8A96E; letter-spacing: 12px; font-size: 18px; margin: 32px 0; }
  .cover-meta { font-family: system-ui, sans-serif; font-size: 11px; color: #8A7250; }
  .cover-node { font-family: system-ui, sans-serif; font-size: 11px; color: #8B6914; margin-top: 12px; letter-spacing: 1px; }

  /* ── Chapter banner ── */
  .chapter-banner {
    background: linear-gradient(135deg, #1C0F00 0%, #2E1A00 100%);
    color: #C8A96E;
    padding: 32px 40px 28px;
    margin: 0 -20mm 32px;
    page-break-inside: avoid;
  }
  .chapter-num { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #8B6914; margin-bottom: 8px; font-family: system-ui, sans-serif; }
  .chapter-icon-large { font-size: 36px; margin-bottom: 10px; display: block; }
  .chapter-title-banner { font-size: 22px; font-weight: 700; color: #F5E6C8; font-family: system-ui, sans-serif; letter-spacing: 0.5px; margin: 0; border: none; padding: 0; }

  /* ── Section intro ── */
  .section-intro { font-style: italic; color: #5C4010; font-size: 12px; border-bottom: 1px solid #E8DCC8; padding-bottom: 20px; margin-bottom: 24px; line-height: 1.8; }
  .section-intro p { font-style: normal; color: #1C1409; font-size: 11px; }

  /* ── Insight box ── */
  .insight-box { border: 1.5px solid #C8A96E; border-radius: 6px; background: #FDFAF2; padding: 18px 22px; margin: 28px 0 20px; page-break-inside: avoid; }
  .insight-box-title { font-family: system-ui, sans-serif; font-size: 9px; letter-spacing: 2.5px; text-transform: uppercase; color: #8B6914; margin-bottom: 12px; }
  .insight-item { display: flex; gap: 10px; margin-bottom: 8px; font-size: 11px; }
  .insight-bullet { color: #C8A96E; font-weight: bold; flex-shrink: 0; }

  /* ── Affirmation ── */
  .affirmation { border-left: 4px solid #C8A96E; background: linear-gradient(135deg, #FAF6EC, #F5EDD8); padding: 16px 20px; margin: 20px 0; font-style: italic; font-size: 12px; color: #4A3000; page-break-inside: avoid; }
  .affirmation-label { font-family: system-ui, sans-serif; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #8B6914; margin-bottom: 6px; font-style: normal; }

  /* ── Sub-sections ── */
  .sub-section { margin-bottom: 32px; }
  .sub-section-title { font-family: system-ui, sans-serif; font-size: 13px; font-weight: 700; color: #1C0F00; margin: 24px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #D4C4A0; letter-spacing: 0.3px; }

  /* ── Checklist box ── */
  .checklist-box { background: #F5F9F0; border: 1.5px solid #8BAF5C; border-radius: 6px; padding: 14px 18px; margin: 14px 0 20px; page-break-inside: avoid; }
  .checklist-label { font-family: system-ui, sans-serif; font-size: 8.5px; letter-spacing: 2.5px; text-transform: uppercase; color: #4A7A20; margin-bottom: 10px; font-weight: 700; }
  .checklist-item { display: flex; gap: 10px; margin-bottom: 7px; font-size: 11px; line-height: 1.55; }
  .checklist-check { color: #4A7A20; font-weight: 700; flex-shrink: 0; font-size: 12px; }

  /* ── Kombination box ── */
  .kombination-box { background: linear-gradient(135deg, #1C0F00, #2E1A00); color: #F5E6C8; border-radius: 6px; padding: 18px 22px; margin: 24px 0 20px; page-break-inside: avoid; }
  .kombination-label { font-family: system-ui, sans-serif; font-size: 8.5px; letter-spacing: 2.5px; text-transform: uppercase; color: #C8A96E; margin-bottom: 8px; }
  .kombination-text { font-size: 11.5px; line-height: 1.7; color: #F5E6C8; font-style: italic; }

  /* ── Planet deep-dives ── */
  .planet-block { display: flex; gap: 24px; margin-bottom: 48px; page-break-inside: avoid; }
  .planet-sidebar { width: 90px; flex-shrink: 0; text-align: center; }
  .planet-symbol-large { font-size: 42px; line-height: 1; margin-bottom: 6px; }
  .planet-name-sidebar { font-family: system-ui, sans-serif; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #8B6914; }
  .planet-sign-sidebar { font-size: 11px; color: #4A3000; margin-top: 4px; font-weight: bold; }
  .planet-body { flex: 1; }
  .planet-meaning-box { background: #F5EDD8; border-radius: 4px; padding: 10px 14px; margin-bottom: 14px; font-size: 10.5px; color: #5C3A00; font-style: italic; }

  /* ── Big Three ── */
  .big3-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin: 24px 0; }
  .big3-card { border: 1px solid #DDD3BC; border-radius: 6px; padding: 16px; text-align: center; background: white; }
  .big3-symbol { font-size: 28px; margin-bottom: 6px; }
  .big3-label { font-family: system-ui, sans-serif; font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: #8B6914; }
  .big3-value { font-size: 15px; font-weight: 700; color: #1C1409; margin: 4px 0 2px; font-family: system-ui, sans-serif; }
  .big3-meaning { font-size: 9.5px; color: #8A7250; }

  /* ── TOC ── */
  .toc-item { display: flex; align-items: baseline; gap: 10px; padding: 7px 0; border-bottom: 1px dotted #D4C4A0; font-size: 11px; }
  .toc-num { color: #C8A96E; font-weight: 700; min-width: 28px; font-family: system-ui, sans-serif; font-size: 10px; letter-spacing: 1px; }
  .toc-title { color: #1C1409; flex: 1; }
  .toc-section-label { font-family: system-ui, sans-serif; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #8B6914; margin: 24px 0 8px; }

  /* ── Tables ── */
  table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 10.5px; }
  th { background: #1C0F00; color: #C8A96E; padding: 7px 10px; text-align: left; font-family: system-ui, sans-serif; font-size: 9px; letter-spacing: 1px; text-transform: uppercase; }
  td { padding: 6px 10px; border-bottom: 1px solid #E8DCC8; }
  tr:nth-child(even) { background: #F5F0E6; }

  /* ── Aspect matrix ── */
  .matrix-corner, .matrix-head, .matrix-row-head { background: #2E1A00; color: #C8A96E; font-size: 10px; padding: 5px 6px; text-align: center; font-family: system-ui, sans-serif; }
  .matrix-row-head { text-align: left; padding-left: 8px; white-space: nowrap; }
  .matrix-diag { background: #EDE8DE; text-align: center; font-size: 10px; color: #A09070; }
  .matrix-empty { background: #FAFAF6; }
  .asp-trine { background: #C8ECC8; color: #1A5C1A; font-weight: 700; text-align: center; font-size: 10px; }
  .asp-sextile { background: #C8DCF0; color: #1A3A6A; font-weight: 700; text-align: center; font-size: 10px; }
  .asp-square { background: #F0C8C8; color: #6A1A1A; font-weight: 700; text-align: center; font-size: 10px; }
  .asp-opposition { background: #F5B8B8; color: #8A0000; font-weight: 700; text-align: center; font-size: 10px; }
  .asp-conjunction { background: #F0ECC0; color: #5A4A00; font-weight: 700; text-align: center; font-size: 10px; }

  /* ── Bars ── */
  .bar-container { background: #E8DCC8; border-radius: 3px; height: 12px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #8B6914, #C8A96E); }

  /* ── Archetype box ── */
  .archetype-box { border: 2px solid #C8A96E; padding: 28px 32px; text-align: center; margin: 24px 0; background: linear-gradient(135deg, #FDFAF4, #F8F0E0); }
  .archetype-label { font-family: system-ui, sans-serif; font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: #8B6914; margin-bottom: 10px; }
  .archetype-text { font-size: 18px; color: #1C1409; font-weight: 600; font-family: system-ui, sans-serif; line-height: 1.4; }

  /* ── Ornaments & rules ── */
  .section-ornament { text-align: center; color: #C8A96E; font-size: 14px; letter-spacing: 8px; margin: 40px 0 32px; }
  .gold-rule { border: none; border-top: 1.5px solid #C8A96E; margin: 24px 0; }
  .page-break { page-break-before: always; padding-top: 0; }

  /* ── Section headers (non-chapter) ── */
  .section-title { font-family: system-ui, sans-serif; font-size: 14px; font-weight: 700; color: #1C0F00; margin: 32px 0 16px; padding-bottom: 8px; border-bottom: 1.5px solid #C8A96E; text-transform: uppercase; letter-spacing: 1px; }
  .section-subtitle { font-family: system-ui, sans-serif; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #8B6914; margin-bottom: 20px; }

  /* ── Print ── */
  @page { margin: 16mm 20mm; size: A4; }
  @media print { body { background: white; } }
</style>
</head>
<body>

<!-- ═══════════════════════════════════════════════════════════════
     PAGE 1: COVER
═══════════════════════════════════════════════════════════════ -->
<div class="cover">
  <div class="cover-stars">✦ ✧ ✦ ✧ ✦</div>
  <div class="cover-label">Persönliches Horoskop · Maia's Voice</div>
  <div class="cover-name">${name}</div>
  <div class="cover-big3">☀️ ${chart.sunSign} · 🌙 ${chart.moonSign} · ↑ ${chart.risingSign ?? '—'}</div>
  ${chart.northNodeSign ? `<div class="cover-node">☊ Seelenrichtung: ${chart.northNodeSign}</div>` : ''}
  <div class="cover-divider">· · · · ·</div>
  <div class="cover-meta">${[birthCity, formattedDate, String(currentYear)].filter(Boolean).join(' · ')}</div>
</div>

<!-- ═══════════════════════════════════════════════════════════════
     PAGE 2: BIG THREE + OVERVIEW
═══════════════════════════════════════════════════════════════ -->
<div style="page-break-after: always; padding-top: 20px;">
  <div class="section-subtitle">Dein kosmischer Fingerabdruck</div>
  <div class="section-title">Die Großen Drei</div>

  ${big3Cards}

  <div class="archetype-box">
    <div class="archetype-label">Dein astrologisches Profil</div>
    <div class="archetype-text">☀️ ${chart.sunSign} · 🌙 ${chart.moonSign} · ↑ ${chart.risingSign ?? '—'}</div>
  </div>

  <hr class="gold-rule"/>

  <div class="section-title" style="margin-top: 28px;">Planetenpositionen</div>
  <p style="font-size:10px;color:#6A5030;margin-bottom:10px;">Zeigt, wo jeder Planet zum Zeitpunkt deiner Geburt im Tierkreis stand. <strong>Planet</strong> = Lebensthema, <strong>Zeichen</strong> = Energie &amp; Stil, <strong>Grad</strong> = genaue Position.</p>
  <table>
    <thead>
      <tr>
        <th style="width:36px;text-align:center"></th>
        <th>Planet</th>
        <th>Zeichen</th>
        <th>Grad</th>
        ${hasHouseData ? '<th>Haus</th>' : ''}
        ${hasRetroData ? '<th style="text-align:center">℞</th>' : ''}
      </tr>
    </thead>
    <tbody>${planetTableRows}</tbody>
  </table>
  ${!hasHouseData ? `<p style="font-size:9px;color:#8A7250;margin-top:6px;font-style:italic">💡 Häuser werden nur berechnet, wenn eine Geburtszeit angegeben wurde. Mit Uhrzeit erhältst du dein vollständiges Geburtshoroskop.</p>` : ''}

  <div class="section-title" style="margin-top: 32px;">Deine Elemente</div>
  <p style="font-size:10.5px;color:#4A3000;margin-bottom:10px;line-height:1.7">${elementInterpretation}</p>
  <table>
    <thead><tr><th>Element</th><th>Planeten</th><th style="width:210px">Verteilung</th></tr></thead>
    <tbody>${elementRows}</tbody>
  </table>

  <div class="section-title" style="margin-top: 32px;">Deine Energie — Modalitäten</div>
  <p style="font-size:10.5px;color:#4A3000;margin-bottom:10px;line-height:1.7">${modalityInterpretation}</p>
  <p style="font-size:9.5px;color:#8A7250;margin-bottom:8px">Kardinal = Initiieren &amp; Starten · Fix = Bewahren &amp; Durchhalten · Mutable = Wandeln &amp; Anpassen</p>
  <table>
    <thead><tr><th>Qualität</th><th>Planeten</th><th style="width:210px">Verteilung</th></tr></thead>
    <tbody>${modalityRows}</tbody>
  </table>
</div>

<!-- ═══════════════════════════════════════════════════════════════
     PAGE 3: TABLE OF CONTENTS
═══════════════════════════════════════════════════════════════ -->
<div class="page-break" style="padding-top: 28px;">
  <div class="section-subtitle">Vollständige Übersicht</div>
  <div class="section-title">Inhalt</div>

  <div class="toc-section-label">Persönliche Kapitel</div>
  ${sections.map((s, i) => `<div class="toc-item"><span class="toc-num">${String(i + 1).padStart(2, '0')}</span><span class="toc-title">${s.icon} ${s.title}</span></div>`).join('')}

  <div class="toc-section-label" style="margin-top:20px">Vertiefung &amp; Anhang</div>
  <div class="toc-item"><span class="toc-num">${String(sections.length + 1).padStart(2, '0')}</span><span class="toc-title">✦ Deine Planeten im Detail</span></div>
  <div class="toc-item"><span class="toc-num">${String(sections.length + 2).padStart(2, '0')}</span><span class="toc-title">📋 Anhang &amp; Glossar</span></div>

  <div style="margin-top:32px;padding:16px 20px;background:#F5EDD8;border-left:4px solid #C8A96E;font-family:system-ui,sans-serif;font-size:10px;color:#6A5030;line-height:1.7;">
    Dieses Horoskop wurde individuell für <strong>${name}</strong> erstellt.
    Es umfasst ${sections.length} persönliche Kapitel, eine Planeten-Tiefenanalyse
    sowie astronomische Tabellen und ein astrologisches Glossar.
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════════
     PAGE 4: ASTROLOGICAL OVERVIEW — ASPECTS
═══════════════════════════════════════════════════════════════ -->
<div class="page-break" style="padding-top: 28px;">
  <div class="section-subtitle">Planetare Verbindungen</div>
  <div class="section-title">Wie deine Planeten miteinander sprechen</div>
  <p style="font-size:10.5px;color:#4A3000;line-height:1.75;margin-bottom:16px">
    Stell dir die Planeten als verschiedene Stimmen in dir vor — jede mit einer eigenen Energie, einem eigenen Thema. Wenn zwei Planeten in einem bestimmten Winkelabstand zueinander stehen, nennt man das einen <strong>Aspekt</strong>. Manche dieser Verbindungen fühlen sich leicht und natürlich an, andere erzeugen eine produktive Spannung, die dich wachsen lässt.
  </p>
  <div class="insight-box">
    <div class="insight-box-title">Die fünf Aspekt-Typen — was sie bedeuten</div>
    <div class="insight-item"><span class="insight-bullet" style="background:#C8ECC8;color:#1A5C1A;padding:1px 5px;border-radius:3px;font-size:9px;font-weight:700">T</span><span style="margin-left:6px"><strong>Trigon (120°)</strong> — Fließende Harmonie. Zwei Planeten unterstützen sich gegenseitig mühelos. Das sind deine natürlichen Talente und Stärken.</span></div>
    <div class="insight-item"><span class="insight-bullet" style="background:#C8DCF0;color:#1A3A6A;padding:1px 5px;border-radius:3px;font-size:9px;font-weight:700">S</span><span style="margin-left:6px"><strong>Sextil (60°)</strong> — Gelegenheit &amp; Fluss. Eine einladende Verbindung, die Potenziale öffnet, wenn du aktiv darauf zugehst.</span></div>
    <div class="insight-item"><span class="insight-bullet" style="background:#F0C8C8;color:#6A1A1A;padding:1px 5px;border-radius:3px;font-size:9px;font-weight:700">Q</span><span style="margin-left:6px"><strong>Quadrat (90°)</strong> — Produktive Spannung. Zwei Energien, die sich reiben — das erzeugt inneren Antrieb, fordert dich heraus und ist oft der Motor hinter deinen größten Leistungen.</span></div>
    <div class="insight-item"><span class="insight-bullet" style="background:#F5B8B8;color:#8A0000;padding:1px 5px;border-radius:3px;font-size:9px;font-weight:700">O</span><span style="margin-left:6px"><strong>Opposition (180°)</strong> — Polarität &amp; Integration. Zwei gegensätzliche Kräfte suchen Balance. Oft spiegelst du in Beziehungen genau das wider, was du in dir noch integrieren kannst.</span></div>
    <div class="insight-item"><span class="insight-bullet" style="background:#F0ECC0;color:#5A4A00;padding:1px 5px;border-radius:3px;font-size:9px;font-weight:700">K</span><span style="margin-left:6px"><strong>Konjunktion (0°)</strong> — Verschmelzung. Zwei Planeten stehen nahezu am gleichen Punkt — ihre Energien verstärken sich gegenseitig, was diese Kombination zu einem besonders prägenden Thema in deinem Leben macht.</span></div>
  </div>

  <div class="section-title" style="margin-top: 28px;">Deine Aspekte im Überblick</div>
  <table>
    <thead><tr><th>Aspekt-Typ</th><th>Anzahl</th><th>Was das für dich bedeutet</th></tr></thead>
    <tbody>${aspectOverviewRows}</tbody>
  </table>

  <div class="section-title" style="margin-top: 32px;">Aspekte-Matrix — Referenztabelle</div>
  <p style="font-size:10px;color:#6A5030;margin-bottom:10px;line-height:1.7">
    Diese Tabelle zeigt auf einen Blick, welche deiner Planeten miteinander verbunden sind. Jede farbige Zelle steht für eine Verbindung (Aspekt) zwischen zwei Planeten — du kannst sie als Nachschlagewerk nutzen.
  </p>
  <p style="font-size:9px;color:#8A7250;margin-bottom:12px">
    Legende:
    <span style="background:#C8ECC8;color:#1A5C1A;font-weight:700;padding:1px 5px;border-radius:3px">T</span> Trigon (Harmonie) ·
    <span style="background:#C8DCF0;color:#1A3A6A;font-weight:700;padding:1px 5px;border-radius:3px">S</span> Sextil (Gelegenheit) ·
    <span style="background:#F0C8C8;color:#6A1A1A;font-weight:700;padding:1px 5px;border-radius:3px">Q</span> Quadrat (Spannung) ·
    <span style="background:#F5B8B8;color:#8A0000;font-weight:700;padding:1px 5px;border-radius:3px">O</span> Opposition (Polarität) ·
    <span style="background:#F0ECC0;color:#5A4A00;font-weight:700;padding:1px 5px;border-radius:3px">K</span> Konjunktion (Verschmelzung)
  </p>
  <div style="overflow-x:auto;">
    <table>
      ${matrixHeader}
      ${matrixRows}
    </table>
  </div>

  ${chart.houses && chart.houses.length > 0 ? `
  <div class="section-title" style="margin-top: 36px;">Die 12 Häuser</div>
  <p style="font-size:10px;color:#6A5030;margin-bottom:10px;">Häuser beschreiben die Lebensbereiche, in denen sich die Planetenenergien entfalten.</p>
  <table>
    <thead><tr><th style="text-align:center;width:36px">H</th><th>Dein Zeichen</th><th>Lebensbereich</th></tr></thead>
    <tbody>${houseTableRows}</tbody>
  </table>
  ` : ''}
</div>

<!-- ═══════════════════════════════════════════════════════════════
     PAGES 5–16: 12 KAPITEL
═══════════════════════════════════════════════════════════════ -->
${chaptersHtml}

<!-- ═══════════════════════════════════════════════════════════════
     PLANETEN IM DETAIL
═══════════════════════════════════════════════════════════════ -->
${planetDeepDivesHtml}

<!-- ═══════════════════════════════════════════════════════════════
     ANHANG
═══════════════════════════════════════════════════════════════ -->
<div class="page-break" style="padding-top: 28px;">
  <div class="section-subtitle">Referenz &amp; Glossar</div>
  <div class="section-title">Anhang</div>

  <div class="section-title" style="margin-top: 28px;">Glossar der Tierkreiszeichen</div>
  <table>
    <thead><tr><th>Zeichen</th><th>Datum</th><th>Element / Qualität</th><th>Kernthemen</th></tr></thead>
    <tbody>${zodiacRows}</tbody>
  </table>

  <div class="section-title" style="margin-top: 36px;">Über dieses Horoskop</div>
  <p>Dieses persönliche Horoskop wurde von <strong>Maia's Voice</strong> auf Basis der von dir angegebenen Geburtsdaten erstellt. Die Planetenpositionen wurden astronomisch berechnet und durch künstliche Intelligenz zu einem persönlichen Deutungstext verarbeitet.</p>
  <p style="margin-top: 10px;">Astrologie ist eine symbolische Sprache zur Selbstreflexion — kein Schicksal, keine Vorhersage. Dieses Horoskop zeigt Muster und Potenziale, die du frei interpretieren und annehmen oder ablehnen kannst.</p>

  <div class="section-ornament" style="margin-top: 48px;">✦ · · · ✦</div>
  <p style="font-family:system-ui,sans-serif;font-size:9px;color:#8A7250;text-align:center;letter-spacing:1.5px;text-transform:uppercase;">
    Erstellt mit Maia's Voice · ${currentYear} · maias-voice.app
  </p>
</div>

</body>
</html>`;
}

// ─── PDF export ───────────────────────────────────────────────────────────────

async function exportPDF(
  name: string,
  sections: InterpretationSection[],
  planetSections: { name: string; content: string }[],
  chart: AstrologyChart,
  birthCity: string,
  birthDate: string,
) {
  try {
    const Print = await import('expo-print');
    const Sharing = await import('expo-sharing');
    const html = generateHtml(name, sections, planetSections, chart, birthCity, birthDate);
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Dein Horoskop als PDF',
        UTI: 'com.adobe.pdf',
      });
    }
  } catch {
    if (typeof window !== 'undefined') {
      const html = generateHtml(name, sections, planetSections, chart, birthCity, birthDate);
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
        win.print();
      }
    }
  }
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function AstrologyReadingScreen() {
  const supabase = useSupabase();
  const params = useLocalSearchParams<{
    type: string;
    birthDate: string;
    birthTime: string;
    birthLat: string;
    birthLng: string;
    birthTimezone: string;
    birthCity: string;
    questionnaire?: string;
    question?: string;
    fromProfile?: string;
  }>();

  const [loading, setLoading]   = useState(true);
  const [chart, setChart]       = useState<AstrologyChart | null>(null);
  const [sections, setSections] = useState<InterpretationSection[]>([]);
  const [planetSections, setPlanetSections] = useState<{ name: string; content: string }[]>([]);
  const [error, setError]       = useState('');
  const [showPlanets, setShowPlanets] = useState(false);
  const [pdfLoading, setPdfLoading]   = useState(false);
  const [resolvedName, setResolvedName] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const questionnaire: QuestionnaireAnswers = (() => {
    try {
      return params.questionnaire ? JSON.parse(params.questionnaire) : {};
    } catch {
      return {};
    }
  })();

  const displayName = resolvedName || questionnaire.name || 'Dein Horoskop';
  const formattedDate = formatBirthDate(params.birthDate ?? '');

  useEffect(() => { fetchReading(); }, []);

  async function fetchReading() {
    setLoading(true);
    setError('');
    try {
      // If coming from stored profile, load personal_profile from user_profiles
      let enrichedQuestionnaire = { ...questionnaire };
      if (params.fromProfile === '1') {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('personal_profile, preferred_language')
              .eq('id', session.user.id)
              .single();
            if (profile?.personal_profile) {
              const pp = profile.personal_profile as any;
              enrichedQuestionnaire = {
                outputLanguage: profile.preferred_language ?? 'de',
                name: pp.displayName,
                pronouns: pp.pronouns,
                relationshipStatus: pp.relationshipStatus,
                currentFocus: pp.lifeFocus,
                areasOfInterest: pp.areasOfInterest,
                characterDescription: pp.characterDesc,
                conflictStyle: pp.conflictStyle,
                specificQuestion: params.question || pp.openQuestion,
              };
            }
          }
        } catch { /* use empty questionnaire if profile load fails */ }
      }

      const { data, error: fnError } = await supabase.functions.invoke('astrology-chart', {
        body: {
          readingType: params.type ?? 'natal_chart',
          birthData: {
            birthDate: params.birthDate,
            birthTime: params.birthTime || undefined,
            birthLat: parseFloat(params.birthLat),
            birthLng: parseFloat(params.birthLng),
            birthTimezone: params.birthTimezone,
          },
          questionnaire: enrichedQuestionnaire,
          language: enrichedQuestionnaire.outputLanguage ?? 'de',
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data) throw new Error('Keine Daten vom Server');

      setChart(data.chart);
      setSections(data.sections ?? []);
      setPlanetSections(data.planetSections ?? []);
      if (enrichedQuestionnaire.name) setResolvedName(enrichedQuestionnaire.name);

      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }

  async function handleExportPDF() {
    if (!chart || sections.length === 0) return;
    setPdfLoading(true);
    try {
      await exportPDF(
        displayName,
        sections,
        planetSections,
        chart,
        params.birthCity ?? '',
        params.birthDate ?? '',
      );
    } catch {
      // Silent — platform may not support it
    } finally {
      setPdfLoading(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return <LoadingScreen birthDate={params.birthDate ?? ''} />;
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={{ fontSize: 36 }}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchReading}>
          <Text style={styles.retryText}>Erneut versuchen</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/astrology')} style={{ marginTop: 12 }}>
          <Text style={{ color: C.textMuted, fontSize: 13 }}>Zurück zur Startseite</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.outerContainer}>
      <Animated.ScrollView
        style={[styles.scroll, { opacity: fadeAnim }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover header card */}
        <View style={styles.coverHeader}>
          <Text style={styles.coverStars}>✦ ✧ ✦</Text>
          <Text style={styles.coverName}>
            {questionnaire.name || 'Dein Horoskop'}
          </Text>
          <Text style={styles.coverSubtitle}>
            Persönliches Horoskop
            {params.birthCity ? ` · ${params.birthCity}` : ''}
            {formattedDate ? ` · ${formattedDate}` : ''}
          </Text>

          {/* Big Three pills */}
          {chart && (
            <View style={styles.bigThreeRow}>
              <View style={styles.bigThreePill}>
                <Text style={styles.pillIcon}>☀️</Text>
                <Text style={styles.pillText}>{chart.sunSign}</Text>
              </View>
              <Text style={styles.pillSep}>·</Text>
              <View style={styles.bigThreePill}>
                <Text style={styles.pillIcon}>🌙</Text>
                <Text style={styles.pillText}>{chart.moonSign}</Text>
              </View>
              <Text style={styles.pillSep}>·</Text>
              <View style={styles.bigThreePill}>
                <Text style={styles.pillIcon}>↑</Text>
                <Text style={styles.pillText}>{chart.risingSign ?? '—'}</Text>
              </View>
            </View>
          )}

          {/* North Node */}
          {chart?.northNodeSign ? (
            <Text style={styles.nodeText}>☊ Weg: {chart.northNodeSign}</Text>
          ) : null}
        </View>

        {/* 12 section cards */}
        {sections.map((section, index) => (
          <SectionCard key={section.id} section={section} index={index} />
        ))}

        {/* Planet table — collapsible */}
        {chart && (
          <View style={styles.planetsSection}>
            <TouchableOpacity
              style={styles.planetsToggle}
              onPress={() => setShowPlanets(!showPlanets)}
            >
              <Text style={styles.planetsToggleText}>
                {showPlanets ? '▲' : '▼'} Planetenpositionen ({chart.planets.length})
              </Text>
            </TouchableOpacity>

            {showPlanets && (
              <View style={styles.planetsTable}>
                {chart.planets.map((p) => (
                  <View key={p.name} style={styles.planetRow}>
                    <Text style={styles.planetName}>{p.name}</Text>
                    <Text style={styles.planetPos}>
                      {p.degree.toFixed(1)}° {p.sign}{p.retrograde ? ' ℞' : ''}{p.house ? ` · H${p.house}` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Neue Deutung button */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => router.replace('/astrology')}
            activeOpacity={0.85}
          >
            <Text style={styles.newBtnText}>Neue Deutung ✦</Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>

      {/* ── Floating PDF button — always visible ── */}
      <View style={styles.floatingPdfContainer}>
        <TouchableOpacity
          style={[styles.floatingPdfBtn, pdfLoading && styles.btnOff]}
          onPress={handleExportPDF}
          disabled={pdfLoading}
          activeOpacity={0.85}
        >
          <Text style={styles.floatingPdfIcon}>📄</Text>
          <Text style={styles.floatingPdfText}>
            {pdfLoading ? 'PDF wird erstellt…' : 'Als PDF speichern'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: C.bg },
  scroll:   { flex: 1 },
  content:  { padding: 20, gap: 16, paddingBottom: 120 },

  // Loading
  loadingContainer: {
    flex: 1, backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center',
    padding: 32, gap: 16,
  },
  loadingStarRow:   { fontSize: 18, color: C.gold, letterSpacing: 6, marginBottom: 8 },
  loadingTitle:     { fontSize: 20, color: C.gold, fontWeight: '800', textAlign: 'center' },
  loadingBirthdate: { fontSize: 13, color: C.textMuted, textAlign: 'center' },
  loadingMsg:       { fontSize: 14, color: C.textSec, textAlign: 'center', lineHeight: 22, marginTop: 8 },
  loadingNote: {
    fontSize: 12, color: C.textMuted, textAlign: 'center', lineHeight: 18,
    marginTop: 8, paddingHorizontal: 16,
  },

  // Error
  errorContainer: {
    flex: 1, backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center',
    padding: 24, gap: 12,
  },
  errorText: { color: C.error, fontSize: 14, textAlign: 'center', lineHeight: 21 },
  retryBtn:  { marginTop: 8, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10, backgroundColor: C.surface },
  retryText: { color: C.gold, fontWeight: '700', fontSize: 14 },

  // Cover header card
  coverHeader: {
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  coverStars:    { fontSize: 16, color: C.gold, letterSpacing: 10 },
  coverName:     { fontSize: 26, color: C.white, fontWeight: '800', textAlign: 'center' },
  coverSubtitle: { fontSize: 11, color: C.textMuted, letterSpacing: 0.5, textAlign: 'center' },

  // Big Three pills
  bigThreeRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, marginTop: 6,
    flexWrap: 'wrap', justifyContent: 'center',
  },
  bigThreePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.bg, borderRadius: 20,
    paddingVertical: 5, paddingHorizontal: 12,
    borderWidth: 1, borderColor: C.border,
  },
  pillIcon: { fontSize: 14 },
  pillText: { fontSize: 13, color: C.gold, fontWeight: '700' },
  pillSep:  { fontSize: 14, color: C.textMuted },

  // North node
  nodeText: { fontSize: 12, color: C.textMuted, marginTop: 2 },

  // Section cards
  sectionCard: {
    backgroundColor: C.surface, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    padding: 18, gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  sectionIcon:    { fontSize: 18 },
  sectionTitle:   { flex: 1, fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  sectionChevron: { fontSize: 11, fontWeight: '700' },
  sectionBody:    { color: C.textSec, fontSize: 15, lineHeight: 25 },

  // Planet table
  planetsSection: {
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  planetsToggle:     { padding: 14 },
  planetsToggleText: { color: C.textSec, fontSize: 13, fontWeight: '600' },
  planetsTable:      { borderTopWidth: 1, borderTopColor: C.border },
  planetRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border + '55',
  },
  planetName: { color: C.textSec, fontSize: 13 },
  planetPos:  { color: C.gold, fontSize: 13, fontWeight: '600' },

  // Actions row
  actionsRow: { gap: 10, marginTop: 8 },
  newBtn: {
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.border,
    paddingVertical: 16, alignItems: 'center',
  },
  newBtnText: { color: C.gold, fontSize: 15, fontWeight: '800' },
  btnOff: { opacity: 0.5 },

  // Floating PDF button
  floatingPdfContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 12,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  floatingPdfBtn: {
    backgroundColor: C.gold,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingPdfIcon: { fontSize: 20 },
  floatingPdfText: {
    color: C.bg, fontSize: 17, fontWeight: '800', letterSpacing: 0.4,
  },
});
