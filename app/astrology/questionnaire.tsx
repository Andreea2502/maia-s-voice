import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { C } from '@/lib/colors';

// ─── Types ───────────────────────────────────────────────────────────────────

interface QuestionnaireAnswers {
  outputLanguage: string;
  name: string;
  pronouns: string;
  relationshipStatus: string;
  currentFocus: string;
  areasOfInterest: string[];
  characterDescription: string;
  conflictStyle: string;
  desiredInsight: string;
  specificQuestion: string;
}

// ─── Chip component ──────────────────────────────────────────────────────────

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.progressContainer}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressSegment,
            i < step ? styles.progressSegmentActive : styles.progressSegmentInactive,
          ]}
        />
      ))}
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function QuestionnaireScreen() {
  const params = useLocalSearchParams<{
    type: string;
    birthDate: string;
    birthTime: string;
    birthLat: string;
    birthLng: string;
    birthTimezone: string;
    birthCity: string;
  }>();

  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 5;

  // Step 1 — Language
  const [outputLanguage, setOutputLanguage] = useState('');

  // Step 2 (was Step 1)
  const [name, setName] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [relationshipStatus, setRelationshipStatus] = useState('');

  // Step 3 (was Step 2)
  const [currentFocus, setCurrentFocus] = useState('');
  const [areasOfInterest, setAreasOfInterest] = useState<string[]>([]);

  // Step 4 (was Step 3)
  const [characterDescription, setCharacterDescription] = useState('');
  const [conflictStyle, setConflictStyle] = useState('');

  // Step 5 (was Step 4)
  const [desiredInsight, setDesiredInsight] = useState('');
  const [specificQuestion, setSpecificQuestion] = useState('');

  function toggleArea(area: string) {
    setAreasOfInterest((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }

  function handleNext() {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  }

  function handleBack() {
    if (step > 1) {
      setStep(step - 1);
    }
  }

  function handleSubmit() {
    const answers: QuestionnaireAnswers = {
      outputLanguage: outputLanguage || 'de',
      name: name.trim(),
      pronouns,
      relationshipStatus,
      currentFocus: currentFocus.trim(),
      areasOfInterest,
      characterDescription,
      conflictStyle,
      desiredInsight: desiredInsight.trim(),
      specificQuestion: specificQuestion.trim(),
    };

    router.push({
      pathname: '/astrology/reading',
      params: {
        type: params.type,
        birthDate: params.birthDate,
        birthTime: params.birthTime,
        birthLat: params.birthLat,
        birthLng: params.birthLng,
        birthTimezone: params.birthTimezone,
        birthCity: params.birthCity,
        questionnaire: JSON.stringify(answers),
      },
    });
  }

  const stepLabels = ['Sprache', 'Wer bist du?', 'Dein Leben', 'Dein Charakter', 'Deine Fragen'];

  const LANGUAGES = [
    { code: 'de', label: '🇩🇪 Deutsch' },
    { code: 'en', label: '🇬🇧 English' },
    { code: 'es', label: '🇪🇸 Español' },
    { code: 'ro', label: '🇷🇴 Română' },
    { code: 'fr', label: '🇫🇷 Français' },
    { code: 'it', label: '🇮🇹 Italiano' },
    { code: 'pl', label: '🇵🇱 Polski' },
    { code: 'ru', label: '🇷🇺 Русский' },
  ];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Progress */}
      <ProgressBar step={step} total={TOTAL_STEPS} />
      <Text style={styles.stepLabel}>
        Schritt {step} von {TOTAL_STEPS} — {stepLabels[step - 1]}
      </Text>

      {/* ── Step 1 — Language ── */}
      {step === 1 && (
        <View style={styles.stepContent}>
          <Text style={styles.sectionTitle}>In welcher Sprache soll dein Horoskop erscheinen?</Text>
          <Text style={styles.sectionSubtitle}>
            Unabhängig von der App-Sprache
          </Text>

          <View style={styles.field}>
            <View style={styles.chipRow}>
              {LANGUAGES.map((lang) => (
                <Chip
                  key={lang.code}
                  label={lang.label}
                  selected={outputLanguage === lang.code}
                  onPress={() => setOutputLanguage(lang.code)}
                />
              ))}
            </View>
          </View>
        </View>
      )}

      {/* ── Step 2 — Who are you ── */}
      {step === 2 && (
        <View style={styles.stepContent}>
          <Text style={styles.sectionTitle}>Wer bist du?</Text>
          <Text style={styles.sectionSubtitle}>
            Diese Angaben helfen mir, dein Horoskop persönlich auf dich zuzuschneiden. Alles ist freiwillig.
          </Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Wie soll ich dich nennen?</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Dein Name oder Spitzname (optional)"
              placeholderTextColor={C.textMuted}
              maxLength={50}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Pronomen</Text>
            <View style={styles.chipRow}>
              {['sie/ihr', 'er/ihm', 'they/them', 'keine Angabe'].map((p) => (
                <Chip
                  key={p}
                  label={p}
                  selected={pronouns === p}
                  onPress={() => setPronouns(pronouns === p ? '' : p)}
                />
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Beziehungsstatus</Text>
            <View style={styles.chipRow}>
              {['Single', 'In einer Beziehung', 'Es ist kompliziert', 'Keine Angabe'].map((s) => (
                <Chip
                  key={s}
                  label={s}
                  selected={relationshipStatus === s}
                  onPress={() => setRelationshipStatus(relationshipStatus === s ? '' : s)}
                />
              ))}
            </View>
          </View>
        </View>
      )}

      {/* ── Step 3 — Your life ── */}
      {step === 3 && (
        <View style={styles.stepContent}>
          <Text style={styles.sectionTitle}>Dein Leben gerade</Text>
          <Text style={styles.sectionSubtitle}>
            Was bewegt dich? Damit kann ich mich auf das konzentrieren, was dir wirklich wichtig ist.
          </Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Was beschäftigt dich gerade am meisten?</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={currentFocus}
              onChangeText={(t) => setCurrentFocus(t.slice(0, 300))}
              placeholder="Erzähl mir, was dich beschäftigt…"
              placeholderTextColor={C.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.charCounter}>{currentFocus.length}/300</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Welche Bereiche möchtest du verstehen?</Text>
            <Text style={styles.fieldHint}>Mehrfachauswahl möglich</Text>
            <View style={styles.chipRow}>
              {[
                'Persönlichkeit',
                'Liebe & Partnerschaft',
                'Beruf & Berufung',
                'Familie',
                'Freundschaften',
                'Gesundheit',
                'Geld',
                'Sinn & Spiritualität',
              ].map((area) => (
                <Chip
                  key={area}
                  label={area}
                  selected={areasOfInterest.includes(area)}
                  onPress={() => toggleArea(area)}
                />
              ))}
            </View>
          </View>
        </View>
      )}

      {/* ── Step 4 — Your character ── */}
      {step === 4 && (
        <View style={styles.stepContent}>
          <Text style={styles.sectionTitle}>Dein Charakter</Text>
          <Text style={styles.sectionSubtitle}>
            Diese Eindrücke helfen mir, dein Horoskop ehrlich und treffend zu formulieren.
          </Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Wie würden dich enge Freunde beschreiben?</Text>
            <View style={styles.chipColumn}>
              {[
                'Verlässlich & fürsorglich',
                'Leidenschaftlich & direkt',
                'Kreativ & sensibel',
                'Analytisch & präzise',
                'Spontan & neugierig',
              ].map((desc) => (
                <Chip
                  key={desc}
                  label={desc}
                  selected={characterDescription === desc}
                  onPress={() => setCharacterDescription(characterDescription === desc ? '' : desc)}
                />
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Wie gehst du mit Konflikten um?</Text>
            <View style={styles.chipColumn}>
              {[
                'Ich spreche es direkt an',
                'Ich brauche Zeit, dann rede ich',
                'Ich meide Konflikte',
                'Kommt auf die Situation an',
              ].map((style) => (
                <Chip
                  key={style}
                  label={style}
                  selected={conflictStyle === style}
                  onPress={() => setConflictStyle(conflictStyle === style ? '' : style)}
                />
              ))}
            </View>
          </View>
        </View>
      )}

      {/* ── Step 5 — Your questions ── */}
      {step === 5 && (
        <View style={styles.stepContent}>
          <Text style={styles.sectionTitle}>Deine Fragen</Text>
          <Text style={styles.sectionSubtitle}>
            Was darf dieses Horoskop für dich leisten? Ich möchte wirklich nützlich sein.
          </Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Was möchtest du aus diesem Horoskop mitnehmen?</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={desiredInsight}
              onChangeText={(t) => setDesiredInsight(t.slice(0, 300))}
              placeholder="Z.B. Klarheit über eine Entscheidung, mich selbst besser verstehen…"
              placeholderTextColor={C.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.charCounter}>{desiredInsight.length}/300</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              Gibt es eine spezifische Frage, die dich beschäftigt?{' '}
              <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={specificQuestion}
              onChangeText={setSpecificQuestion}
              placeholder="Deine Frage an die Sterne…"
              placeholderTextColor={C.textMuted}
              maxLength={200}
            />
          </View>
        </View>
      )}

      {/* Navigation */}
      <View style={styles.navRow}>
        {step > 1 ? (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.75}>
            <Text style={styles.backBtnText}>← Zurück</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {step < TOTAL_STEPS ? (
          <TouchableOpacity
            style={[styles.nextBtn, step === 1 && !outputLanguage && styles.nextBtnDisabled]}
            onPress={step === 1 && !outputLanguage ? undefined : handleNext}
            activeOpacity={0.85}
          >
            <Text style={[styles.nextBtnText, step === 1 && !outputLanguage && styles.nextBtnTextDisabled]}>
              Weiter →
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
            <Text style={styles.submitBtnText}>Horoskop erstellen ✧</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.note}>
        Deine Antworten sind freiwillig und werden nur für diese Deutung verwendet.
      </Text>
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll:   { flex: 1, backgroundColor: C.bg },
  content:  { padding: 24, gap: 24, paddingBottom: 60 },

  // Progress
  progressContainer: { flexDirection: 'row', gap: 6 },
  progressSegment: {
    flex: 1, height: 4, borderRadius: 2,
  },
  progressSegmentActive:   { backgroundColor: C.gold },
  progressSegmentInactive: { backgroundColor: C.border },
  stepLabel: {
    fontSize: 12, color: C.textMuted, letterSpacing: 0.8,
    textTransform: 'uppercase', marginTop: 4,
  },

  // Step content
  stepContent: { gap: 28 },
  sectionTitle: {
    fontSize: 22, color: C.white, fontWeight: '800', letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontSize: 14, color: C.textSec, lineHeight: 21, marginTop: -16,
  },

  // Fields
  field:      { gap: 10 },
  fieldLabel: { fontSize: 14, color: C.textSec, fontWeight: '600', lineHeight: 20 },
  fieldHint:  { fontSize: 12, color: C.textMuted, marginTop: -6 },
  optional:   { color: C.textMuted, fontWeight: '400' },

  input: {
    backgroundColor: C.surface, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border,
    color: C.white, fontSize: 15,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  inputMultiline: {
    minHeight: 110, paddingTop: 12,
  },
  charCounter: {
    fontSize: 11, color: C.textMuted, textAlign: 'right', marginTop: -6,
  },

  // Chips
  chipRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  chipColumn: {
    flexDirection: 'column', gap: 8,
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: C.border, backgroundColor: C.surface,
  },
  chipSelected: {
    borderColor: C.gold, backgroundColor: C.gold + '22',
  },
  chipText: {
    fontSize: 13, color: C.textSec, fontWeight: '500',
  },
  chipTextSelected: {
    color: C.gold, fontWeight: '700',
  },

  // Navigation
  navRow: {
    flexDirection: 'row', gap: 12, marginTop: 8,
  },
  backBtn: {
    flex: 1, paddingVertical: 15, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { color: C.textSec, fontSize: 14, fontWeight: '600' },

  nextBtn: {
    flex: 2, paddingVertical: 15, borderRadius: 14,
    backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.gold,
    alignItems: 'center',
  },
  nextBtnDisabled: {
    borderColor: C.border, opacity: 0.5,
  },
  nextBtnText: { color: C.gold, fontSize: 15, fontWeight: '800' },
  nextBtnTextDisabled: { color: C.textMuted },

  submitBtn: {
    flex: 2, paddingVertical: 15, borderRadius: 14,
    backgroundColor: C.gold, alignItems: 'center',
  },
  submitBtnText: { color: C.bg, fontSize: 15, fontWeight: '800', letterSpacing: 0.4 },

  note: {
    fontSize: 12, color: C.textMuted, textAlign: 'center', lineHeight: 18,
  },
});
