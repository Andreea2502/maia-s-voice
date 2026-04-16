/**
 * Onboarding: Persönliches Profil
 * Schritt nach dem Erstes-Gespräch-Onboarding.
 * Sammelt Geburtsdaten + persönliches Profil mit ausdrücklicher Einwilligung.
 * Speichert alles in user_profiles.
 *
 * Route: /onboarding/profile-setup
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Animated, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { C } from '@/lib/colors';
import { useSupabase } from '@/hooks/useSupabase';

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 'consent' | 'birth' | 'profile' | 'prefs' | 'saving';

interface FormData {
  // Birth
  birthDate: string;
  birthTime: string;
  birthTimeKnown: boolean;
  birthCity: string;
  birthCountry: string;
  birthLat: number | null;
  birthLng: number | null;
  birthTimezone: string;

  // Personal
  displayName: string;
  pronouns: string;
  relationshipStatus: string;
  lifeFocus: string;
  areasOfInterest: string[];
  characterDesc: string;
  conflictStyle: string;
  openQuestion: string;

  // Prefs
  dailyHoroscope: boolean;
  weeklyHoroscope: boolean;
  language: string;
}

const DEFAULT: FormData = {
  birthDate: '', birthTime: '', birthTimeKnown: true,
  birthCity: '', birthCountry: '', birthLat: null, birthLng: null, birthTimezone: '',
  displayName: '', pronouns: '', relationshipStatus: '', lifeFocus: '',
  areasOfInterest: [], characterDesc: '', conflictStyle: '', openQuestion: '',
  dailyHoroscope: false, weeklyHoroscope: false, language: 'de',
};

// ─── Chip Button ──────────────────────────────────────────────────────────────
function Chip({
  label, selected, onPress,
}: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipOn]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step }: { step: Step }) {
  const steps: Step[] = ['consent', 'birth', 'profile', 'prefs'];
  const idx = steps.indexOf(step);
  const pct = idx < 0 ? 100 : ((idx + 1) / steps.length) * 100;
  return (
    <View style={styles.progressWrap}>
      <View style={[styles.progressBar, { width: `${pct}%` as any }]} />
    </View>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function ProfileSetupScreen() {
  const supabase = useSupabase();
  const [step, setStep] = useState<Step>('consent');
  const [form, setForm] = useState<FormData>(DEFAULT);
  const [error, setError] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  function patch(partial: Partial<FormData>) {
    setForm((f) => ({ ...f, ...partial }));
  }

  function toggleArea(area: string) {
    patch({
      areasOfInterest: form.areasOfInterest.includes(area)
        ? form.areasOfInterest.filter((a) => a !== area)
        : [...form.areasOfInterest, area],
    });
  }

  function animateNext(next: Step) {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    setError('');
    setStep(next);
  }

  // ── Geocode ────────────────────────────────────────────────────────────────
  async function geocodeCity() {
    if (!form.birthCity.trim()) return { lat: null, lng: null, tz: '' };
    setGeocoding(true);
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(form.birthCity)}&count=1&language=de&format=json`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.results?.length) throw new Error('Stadt nicht gefunden');
      const r = data.results[0];
      patch({ birthLat: r.latitude, birthLng: r.longitude, birthTimezone: r.timezone });
      return { lat: r.latitude as number, lng: r.longitude as number, tz: r.timezone as string };
    } finally {
      setGeocoding(false);
    }
  }

  // Convert DD.MM.YYYY → YYYY-MM-DD (for internal storage)
  function toIsoDate(input: string): string | null {
    const m = input.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (!m) return null;
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
  }

  // ── Validate birth step ────────────────────────────────────────────────────
  async function validateBirth() {
    // Accept both DD.MM.YYYY and YYYY-MM-DD
    const iso = toIsoDate(form.birthDate) ?? (form.birthDate.match(/^\d{4}-\d{2}-\d{2}$/) ? form.birthDate : null);
    if (!iso) {
      setError('Geburtsdatum im Format TT.MM.JJJJ eingeben (z.B. 25.03.1990)');
      return false;
    }
    // Normalise to ISO in form state so downstream code is consistent
    patch({ birthDate: iso });
    if (form.birthTimeKnown && form.birthTime && !form.birthTime.match(/^\d{2}:\d{2}$/)) {
      setError('Uhrzeit im Format HH:MM eingeben');
      return false;
    }
    if (!form.birthCity.trim()) {
      setError('Bitte gib deinen Geburtsort ein');
      return false;
    }
    try {
      await geocodeCity();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ort nicht gefunden');
      return false;
    }
  }

  // ── Save everything ────────────────────────────────────────────────────────
  async function saveProfile() {
    setStep('saving');
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Nicht eingeloggt');
      const uid = session.user.id;

      // Resolve geocode if not done yet
      let lat = form.birthLat;
      let lng = form.birthLng;
      let tz  = form.birthTimezone;
      if (!lat && form.birthCity) {
        const geo = await geocodeCity();
        lat = geo.lat; lng = geo.lng; tz = geo.tz;
      }

      const personalProfile = {
        displayName:        form.displayName,
        pronouns:           form.pronouns,
        relationshipStatus: form.relationshipStatus,
        lifeFocus:          form.lifeFocus,
        areasOfInterest:    form.areasOfInterest,
        characterDesc:      form.characterDesc,
        conflictStyle:      form.conflictStyle,
        openQuestion:       form.openQuestion,
      };

      // Update user_profiles
      const { error: profileErr } = await supabase.from('user_profiles').update({
        // Birth data
        birth_date:         form.birthDate || null,
        birth_time:         (form.birthTimeKnown && form.birthTime) ? form.birthTime : null,
        birth_time_known:   form.birthTimeKnown && !!form.birthTime,
        birth_city:         form.birthCity || null,
        birth_country:      form.birthCountry || null,
        birth_lat:          lat,
        birth_lng:          lng,
        birth_timezone:     tz || null,
        birth_data_consent: true,
        birth_data_consent_at: new Date().toISOString(),
        // Personal profile
        personal_profile:   personalProfile,
        profile_completed:  true,
        profile_consent:    true,
        profile_consent_at: new Date().toISOString(),
        // Prefs
        daily_horoscope_enabled:  form.dailyHoroscope,
        weekly_horoscope_enabled: form.weeklyHoroscope,
      }).eq('id', uid);
      if (profileErr) throw profileErr;

      // Also upsert birth_data table
      await supabase.from('birth_data').upsert({
        user_id:         uid,
        birth_date:      form.birthDate,
        birth_time:      (form.birthTimeKnown && form.birthTime) ? form.birthTime : null,
        birth_time_known: form.birthTimeKnown && !!form.birthTime,
        birth_city:      form.birthCity || null,
        birth_country:   form.birthCountry || null,
        birth_lat:       lat,
        birth_lng:       lng,
        birth_timezone:  tz || null,
        consent_given:   true,
        consent_at:      new Date().toISOString(),
      }, { onConflict: 'user_id' });

      router.replace('/(tabs)/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
      setStep('prefs');
    }
  }

  // ── Render steps ───────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      {/* Progress */}
      {step !== 'saving' && <ProgressBar step={step} />}

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {step === 'consent'  && <ConsentStep  onAccept={() => animateNext('birth')} onSkip={() => router.replace('/(tabs)/')} />}
        {step === 'birth'    && <BirthStep form={form} patch={patch} error={error} geocoding={geocoding} onNext={async () => { const ok = await validateBirth(); if (ok) animateNext('profile'); }} />}
        {step === 'profile'  && <ProfileStep form={form} patch={patch} toggleArea={toggleArea} error={error} onNext={() => animateNext('prefs')} onBack={() => animateNext('birth')} />}
        {step === 'prefs'    && <PrefsStep form={form} patch={patch} error={error} onSave={saveProfile} onBack={() => animateNext('profile')} />}
        {step === 'saving'   && <SavingStep />}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

// ─── Step: Consent ────────────────────────────────────────────────────────────
function ConsentStep({ onAccept, onSkip }: { onAccept: () => void; onSkip: () => void }) {
  const BENEFITS = [
    { icon: '🌟', text: 'Personalisierte Horoskope — kein generischer Text, dein echtes Profil.' },
    { icon: '🃏', text: 'Tarot-Deutungen, die deine Lebenssituation wirklich kennen.' },
    { icon: '📅', text: 'Automatisches Tages- & Wochenhoroskop (für Abonnenten).' },
    { icon: '🔒', text: 'Deine Daten gehören dir — jederzeit löschbar in den Einstellungen.' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.stepContent}>
      {/* Header */}
      <View style={styles.consentHeader}>
        <Text style={styles.consentEmoji}>✦</Text>
        <Text style={styles.consentTitle}>Dein persönliches Profil</Text>
        <Text style={styles.consentSub}>
          Maia kann dich viel besser begleiten, wenn sie ein paar Dinge über dich weiß.
          Das ist freiwillig — du kannst es jederzeit ändern oder löschen.
        </Text>
      </View>

      {/* What gets collected */}
      <View style={styles.consentCard}>
        <Text style={styles.consentCardTitle}>Was wird gespeichert?</Text>
        <Text style={styles.consentItem}>📅  Dein Geburtsdatum & -ort (für Horoskope)</Text>
        <Text style={styles.consentItem}>👤  Name, Pronomen, Lebenssituation (optional)</Text>
        <Text style={styles.consentItem}>💬  Themen, die dir wichtig sind</Text>
        <Text style={styles.consentItem}>🔔  Einstellungen für automatische Deutungen</Text>
      </View>

      {/* Benefits */}
      <View style={styles.benefitsCard}>
        <Text style={styles.consentCardTitle}>Warum lohnt es sich?</Text>
        {BENEFITS.map((b, i) => (
          <View key={i} style={styles.benefitRow}>
            <Text style={styles.benefitIcon}>{b.icon}</Text>
            <Text style={styles.benefitText}>{b.text}</Text>
          </View>
        ))}
      </View>

      {/* Data note */}
      <Text style={styles.dataNote}>
        🔒 Deine Daten werden verschlüsselt gespeichert und nie an Dritte weitergegeben.
        Du kannst sie jederzeit in den Einstellungen einsehen oder löschen.
      </Text>

      {/* Actions */}
      <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} activeOpacity={0.85}>
        <Text style={styles.acceptBtnText}>Ja, Profil anlegen ✦</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.skipBtn} onPress={onSkip} activeOpacity={0.8}>
        <Text style={styles.skipBtnText}>Jetzt überspringen</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Step: Birth Data ─────────────────────────────────────────────────────────
function BirthStep({
  form, patch, error, geocoding, onNext,
}: {
  form: FormData; patch: (p: Partial<FormData>) => void;
  error: string; geocoding: boolean; onNext: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  async function handleNext() {
    setLoading(true);
    await onNext();
    setLoading(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepTitle}>🌍 Geburtsdaten</Text>
      <Text style={styles.stepSub}>
        Dein Geburtsort und -datum sind die Grundlage für dein genaues Horoskop.
      </Text>

      <Field label="Geburtsdatum *">
        <TextInput
          style={styles.input}
          value={form.birthDate}
          onChangeText={(v) => patch({ birthDate: v })}
          placeholder="TT.MM.JJJJ  (z.B. 25.03.1990)"
          placeholderTextColor={C.textMuted}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
      </Field>

      <Field label="Geburtszeit (optional)">
        <TextInput
          style={[styles.input, !form.birthTimeKnown && styles.inputDim]}
          value={form.birthTime}
          onChangeText={(v) => patch({ birthTime: v })}
          placeholder="HH:MM  (z.B. 14:30)"
          placeholderTextColor={C.textMuted}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          editable={form.birthTimeKnown}
        />
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => patch({ birthTimeKnown: !form.birthTimeKnown, birthTime: '' })}
        >
          <View style={[styles.checkBox, !form.birthTimeKnown && styles.checkBoxOn]}>
            {!form.birthTimeKnown && <Text style={styles.checkMark}>✓</Text>}
          </View>
          <Text style={styles.checkLabel}>Geburtszeit unbekannt</Text>
        </TouchableOpacity>
      </Field>

      <Field label="Geburtsort *">
        <TextInput
          style={styles.input}
          value={form.birthCity}
          onChangeText={(v) => patch({ birthCity: v })}
          placeholder="Stadt (z.B. Wien)"
          placeholderTextColor={C.textMuted}
        />
      </Field>

      <Field label="Land (optional)">
        <TextInput
          style={styles.input}
          value={form.birthCountry}
          onChangeText={(v) => patch({ birthCountry: v })}
          placeholder="Land (z.B. Österreich)"
          placeholderTextColor={C.textMuted}
        />
      </Field>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.nextBtn, (loading || geocoding) && styles.btnOff]}
        onPress={handleNext}
        disabled={loading || geocoding}
        activeOpacity={0.85}
      >
        {(loading || geocoding)
          ? <ActivityIndicator color={C.bg} />
          : <Text style={styles.nextBtnText}>Weiter →</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Step: Personal Profile ───────────────────────────────────────────────────
const PRONOUNS       = ['sie/ihr', 'er/ihm', 'they/them', 'keine Angabe'];
const REL_STATUS     = ['Single', 'In einer Beziehung', 'Verheiratet', 'Kompliziert', 'Getrennt', 'Verwitwet'];
const AREAS          = ['Liebe & Partnerschaft', 'Karriere & Beruf', 'Familie', 'Gesundheit', 'Finanzen', 'Spiritualität', 'Persönliches Wachstum', 'Kreativität', 'Freundschaft', 'Neuanfang'];
const CONFLICT_STYLE = ['Sachlich & direkt', 'Emotional & offen', 'Zurückgezogen', 'Vermeidend', 'Kompromissorientiert'];

function ProfileStep({
  form, patch, toggleArea, error, onNext, onBack,
}: {
  form: FormData; patch: (p: Partial<FormData>) => void;
  toggleArea: (a: string) => void; error: string;
  onNext: () => void; onBack: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepTitle}>👤 Persönliches Profil</Text>
      <Text style={styles.stepSub}>
        Alles freiwillig — je mehr du teilst, desto persönlicher wird deine Deutung.
      </Text>

      <Field label="Wie darf Maia dich nennen?">
        <TextInput
          style={styles.input}
          value={form.displayName}
          onChangeText={(v) => patch({ displayName: v })}
          placeholder="Dein Name oder Spitzname"
          placeholderTextColor={C.textMuted}
          maxLength={40}
        />
      </Field>

      <Field label="Pronomen">
        <View style={styles.chips}>
          {PRONOUNS.map((p) => (
            <Chip key={p} label={p} selected={form.pronouns === p} onPress={() => patch({ pronouns: form.pronouns === p ? '' : p })} />
          ))}
        </View>
      </Field>

      <Field label="Beziehungsstatus">
        <View style={styles.chips}>
          {REL_STATUS.map((s) => (
            <Chip key={s} label={s} selected={form.relationshipStatus === s} onPress={() => patch({ relationshipStatus: form.relationshipStatus === s ? '' : s })} />
          ))}
        </View>
      </Field>

      <Field label="Was beschäftigt dich gerade am meisten?">
        <TextInput
          style={[styles.input, styles.textarea]}
          value={form.lifeFocus}
          onChangeText={(v) => patch({ lifeFocus: v })}
          placeholder="z.B. Beruflicher Wandel, Beziehungsfrage, persönliche Entwicklung..."
          placeholderTextColor={C.textMuted}
          multiline
          maxLength={300}
        />
      </Field>

      <Field label="Welche Bereiche sind dir wichtig? (mehrere möglich)">
        <View style={styles.chips}>
          {AREAS.map((a) => (
            <Chip key={a} label={a} selected={form.areasOfInterest.includes(a)} onPress={() => toggleArea(a)} />
          ))}
        </View>
      </Field>

      <Field label="Wie würdest du dich selbst beschreiben?">
        <TextInput
          style={[styles.input, styles.textarea]}
          value={form.characterDesc}
          onChangeText={(v) => patch({ characterDesc: v })}
          placeholder="z.B. Introvertiert, neugierig, manchmal zu selbstkritisch..."
          placeholderTextColor={C.textMuted}
          multiline
          maxLength={300}
        />
      </Field>

      <Field label="Wie gehst du mit Konflikten um?">
        <View style={styles.chips}>
          {CONFLICT_STYLE.map((s) => (
            <Chip key={s} label={s} selected={form.conflictStyle === s} onPress={() => patch({ conflictStyle: form.conflictStyle === s ? '' : s })} />
          ))}
        </View>
      </Field>

      <Field label="Gibt es eine Frage, die dich gerade wirklich beschäftigt?">
        <TextInput
          style={[styles.input, styles.textarea]}
          value={form.openQuestion}
          onChangeText={(v) => patch({ openQuestion: v })}
          placeholder="Optional — wird für deine erste Deutung verwendet"
          placeholderTextColor={C.textMuted}
          multiline
          maxLength={400}
        />
      </Field>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Zurück</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.nextBtn, styles.nextBtnFlex]} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>Weiter →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Step: Preferences ────────────────────────────────────────────────────────
function PrefsStep({
  form, patch, error, onSave, onBack,
}: {
  form: FormData; patch: (p: Partial<FormData>) => void;
  error: string; onSave: () => void; onBack: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepTitle}>🔔 Deine Einstellungen</Text>
      <Text style={styles.stepSub}>
        Möchtest du automatische Deutungen? Diese können jederzeit in den Einstellungen geändert werden.
      </Text>

      {/* Daily horoscope */}
      <TouchableOpacity
        style={[styles.prefCard, form.dailyHoroscope && styles.prefCardOn]}
        onPress={() => patch({ dailyHoroscope: !form.dailyHoroscope })}
        activeOpacity={0.8}
      >
        <View style={styles.prefRow}>
          <Text style={styles.prefIcon}>🌅</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.prefTitle}>Tageshoroskop</Text>
            <Text style={styles.prefDesc}>Jeden Morgen eine persönliche Deutung — basierend auf deinem Geburtshoroskop und den aktuellen Planetenständen.</Text>
          </View>
          <View style={[styles.toggle, form.dailyHoroscope && styles.toggleOn]}>
            <Text style={styles.toggleText}>{form.dailyHoroscope ? '✓' : ''}</Text>
          </View>
        </View>
        {form.dailyHoroscope && (
          <View style={styles.prefNote}>
            <Text style={styles.prefNoteText}>✨ Für Abonnenten — du erhältst morgens eine Push-Benachrichtigung</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Weekly horoscope */}
      <TouchableOpacity
        style={[styles.prefCard, form.weeklyHoroscope && styles.prefCardOn]}
        onPress={() => patch({ weeklyHoroscope: !form.weeklyHoroscope })}
        activeOpacity={0.8}
      >
        <View style={styles.prefRow}>
          <Text style={styles.prefIcon}>📅</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.prefTitle}>Wochenhoroskop (Montag)</Text>
            <Text style={styles.prefDesc}>Jeden Montag eine ausführliche Vorschau auf deine Woche mit Schwerpunkten und Hinweisen.</Text>
          </View>
          <View style={[styles.toggle, form.weeklyHoroscope && styles.toggleOn]}>
            <Text style={styles.toggleText}>{form.weeklyHoroscope ? '✓' : ''}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Zusammenfassung</Text>
        <Text style={styles.summaryItem}>📅  {form.birthDate || '—'} · {form.birthCity || '—'}</Text>
        {form.displayName ? <Text style={styles.summaryItem}>👤  {form.displayName}</Text> : null}
        {form.areasOfInterest.length > 0 && (
          <Text style={styles.summaryItem}>💫  {form.areasOfInterest.slice(0, 3).join(', ')}{form.areasOfInterest.length > 3 ? ' …' : ''}</Text>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Zurück</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.saveBtn, styles.nextBtnFlex]} onPress={onSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Profil speichern ✦</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Step: Saving ─────────────────────────────────────────────────────────────
function SavingStep() {
  return (
    <View style={styles.centerScreen}>
      <ActivityIndicator size="large" color={C.gold} />
      <Text style={styles.savingTitle}>Dein Profil wird angelegt...</Text>
      <Text style={styles.savingDesc}>Maia freut sich, dich besser kennenzulernen ✦</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  progressWrap: {
    height: 3, backgroundColor: C.border, margin: 0,
  },
  progressBar: {
    height: 3, backgroundColor: C.gold,
  },

  stepContent: { padding: 22, gap: 20, paddingBottom: 60 },

  stepTitle: { fontSize: 20, fontWeight: '800', color: C.white, letterSpacing: 0.2 },
  stepSub:   { fontSize: 14, color: C.textSec, lineHeight: 21, marginTop: -8 },

  field:      { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.textSec },

  input: {
    backgroundColor: C.surface, borderRadius: 12, borderWidth: 1.5,
    borderColor: C.border, color: C.white, fontSize: 15,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  inputDim:  { opacity: 0.35 },
  textarea:  { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },

  checkRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  checkBox:  { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  checkBoxOn: { backgroundColor: C.gold, borderColor: C.gold },
  checkMark: { color: C.bg, fontSize: 12, fontWeight: '900' },
  checkLabel:{ fontSize: 13, color: C.textSec },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:  {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.surface,
  },
  chipOn:     { borderColor: C.gold, backgroundColor: C.gold + '22' },
  chipText:   { fontSize: 13, color: C.textSec, fontWeight: '600' },
  chipTextOn: { color: C.gold },

  errorText: { color: C.error, fontSize: 13, lineHeight: 20 },

  nextBtn: {
    backgroundColor: C.gold, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  nextBtnFlex: { flex: 1 },
  nextBtnText: { color: C.bg, fontSize: 15, fontWeight: '800' },
  btnOff: { opacity: 0.5 },

  saveBtn:     { backgroundColor: C.gold, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { color: C.bg, fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },

  navRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  backBtn: {
    paddingVertical: 16, paddingHorizontal: 18,
    borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.surface, alignItems: 'center',
  },
  backBtnText: { color: C.textSec, fontSize: 14, fontWeight: '600' },

  // Consent
  consentHeader: { alignItems: 'center', gap: 10, paddingTop: 8 },
  consentEmoji:  { fontSize: 44, color: C.gold },
  consentTitle:  { fontSize: 22, fontWeight: '800', color: C.white, textAlign: 'center' },
  consentSub:    { fontSize: 14, color: C.textSec, textAlign: 'center', lineHeight: 22 },

  consentCard: {
    backgroundColor: C.surface, borderRadius: 16,
    borderWidth: 1.5, borderColor: C.border, padding: 18, gap: 10,
  },
  benefitsCard: {
    backgroundColor: C.surface, borderRadius: 16,
    borderWidth: 1.5, borderColor: C.gold + '33', padding: 18, gap: 10,
  },
  consentCardTitle: { fontSize: 14, fontWeight: '700', color: C.white, marginBottom: 4 },
  consentItem: { fontSize: 13, color: C.textSec, lineHeight: 20 },

  benefitRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  benefitIcon: { fontSize: 18, marginTop: 1 },
  benefitText: { flex: 1, fontSize: 13, color: C.textSec, lineHeight: 20 },

  dataNote: {
    fontSize: 12, color: C.textMuted, textAlign: 'center', lineHeight: 18,
    paddingHorizontal: 4,
  },

  acceptBtn: {
    backgroundColor: C.gold, borderRadius: 16, paddingVertical: 18, alignItems: 'center',
  },
  acceptBtnText: { color: C.bg, fontSize: 16, fontWeight: '800' },
  skipBtn:  { alignItems: 'center', paddingVertical: 14 },
  skipBtnText: { color: C.textMuted, fontSize: 14 },

  // Prefs
  prefCard: {
    backgroundColor: C.surface, borderRadius: 16,
    borderWidth: 1.5, borderColor: C.border, padding: 18, gap: 10,
  },
  prefCardOn: { borderColor: C.gold, backgroundColor: C.gold + '11' },
  prefRow:    { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  prefIcon:   { fontSize: 24, marginTop: 2 },
  prefTitle:  { fontSize: 15, fontWeight: '700', color: C.white, marginBottom: 4 },
  prefDesc:   { fontSize: 13, color: C.textSec, lineHeight: 19 },
  toggle: {
    width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg,
  },
  toggleOn:   { backgroundColor: C.gold, borderColor: C.gold },
  toggleText: { color: C.bg, fontWeight: '900', fontSize: 14 },
  prefNote:   { backgroundColor: C.gold + '22', borderRadius: 10, padding: 10 },
  prefNoteText: { fontSize: 12, color: C.gold, fontWeight: '600' },

  summaryCard: {
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, padding: 16, gap: 8,
  },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: C.textSec, marginBottom: 4 },
  summaryItem:  { fontSize: 14, color: C.white },

  // Saving
  centerScreen: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 16, padding: 32,
  },
  savingTitle: { fontSize: 18, fontWeight: '700', color: C.white, textAlign: 'center' },
  savingDesc:  { fontSize: 14, color: C.textSec, textAlign: 'center' },
});
