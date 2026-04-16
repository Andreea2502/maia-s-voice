/**
 * Astrology Module — Entry Screen
 * Wenn Geburtsdaten bereits im Profil gespeichert sind →
 * direkt zur Reading-Auswahl (nur "Was möchtest du wissen?")
 * Sonst → birth-data → questionnaire → reading
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { C, MODULE_COLORS } from '@/lib/colors';
import { useSupabase } from '@/hooks/useSupabase';

const mc = MODULE_COLORS.astrology;

interface StoredBirthData {
  birthDate: string;
  birthTime: string | null;
  birthTimeKnown: boolean;
  birthCity: string;
  birthLat: number;
  birthLng: number;
  birthTimezone: string;
  displayName?: string;
  areasOfInterest?: string[];
}

const READING_TYPES = [
  { id: 'natal_chart', icon: '✧', title: 'Geburtshoroskop', desc: 'Vollständige Deutung deiner Geburtskarte' },
  { id: 'transit',     icon: '◈', title: 'Aktuelle Transite', desc: 'Was die Planeten jetzt für dich bedeuten' },
  { id: 'synastry',    icon: '✦', title: 'Beziehungshoroskop', desc: 'Wie zwei Geburtskarten zusammenspielen' },
];

export default function AstrologyIndex() {
  const supabase = useSupabase();
  const [loading, setLoading]           = useState(true);
  const [profile, setProfile]           = useState<StoredBirthData | null>(null);
  const [selectedType, setSelectedType] = useState('natal_chart');
  const [question, setQuestion]         = useState('');
  const [isGuest, setIsGuest]           = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setIsGuest(true); setLoading(false); return; }

      const { data } = await supabase
        .from('user_profiles')
        .select('birth_date, birth_time, birth_time_known, birth_city, birth_lat, birth_lng, birth_timezone, personal_profile')
        .eq('id', session.user.id)
        .single();

      if (data?.birth_date && data?.birth_lat) {
        const pp = data.personal_profile as any ?? {};
        setProfile({
          birthDate:       data.birth_date,
          birthTime:       data.birth_time,
          birthTimeKnown:  data.birth_time_known ?? false,
          birthCity:       data.birth_city ?? '',
          birthLat:        data.birth_lat,
          birthLng:        data.birth_lng,
          birthTimezone:   data.birth_timezone ?? 'Europe/Vienna',
          displayName:     pp.displayName,
          areasOfInterest: pp.areasOfInterest,
        });
      }
    } catch {}
    setLoading(false);
  }

  function startWithProfile() {
    if (!profile) return;
    router.push({
      pathname: '/astrology/reading' as any,
      params: {
        type: selectedType,
        birthDate:     profile.birthDate,
        birthTime:     profile.birthTime ?? '',
        birthLat:      String(profile.birthLat),
        birthLng:      String(profile.birthLng),
        birthTimezone: profile.birthTimezone,
        birthCity:     profile.birthCity,
        question:      question.trim(),
        fromProfile:   '1',
      },
    });
  }

  function startFresh(type: string) {
    router.push(`/astrology/birth-data?type=${type}` as any);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={mc.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Back to home */}
        <TouchableOpacity style={{ alignSelf: 'flex-start', paddingVertical: 4 }} onPress={() => router.replace('/(tabs)/')} activeOpacity={0.7}>
          <Text style={{ color: '#888', fontSize: 14, fontWeight: '600' }}>← Hauptmenü</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.icon}>✧</Text>
          <Text style={styles.title}>Astrologie</Text>
          <Text style={styles.sub}>
            {profile ? `Willkommen zurück${profile.displayName ? ', ' + profile.displayName : ''} ✦` : 'Die Planeten kennen deinen Weg'}
          </Text>
        </View>

        {/* ── Profil vorhanden: schneller Einstieg ─────────────────────── */}
        {profile && (
          <>
            <View style={styles.profileBadge}>
              <Text style={styles.profileBadgeText}>
                📍 {profile.birthCity} · {profile.birthDate}
              </Text>
              <TouchableOpacity onPress={() => router.push('/astrology/birth-data?type=natal_chart' as any)}>
                <Text style={styles.profileBadgeEdit}>ändern</Text>
              </TouchableOpacity>
            </View>

            {/* Reading type select */}
            <Text style={styles.sectionLabel}>READING WÄHLEN</Text>
            <View style={styles.readingList}>
              {READING_TYPES.map((rt) => (
                <TouchableOpacity
                  key={rt.id}
                  style={[styles.readingCard, selectedType === rt.id && styles.readingCardOn]}
                  onPress={() => setSelectedType(rt.id)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.readingIconWrap, selectedType === rt.id && styles.readingIconWrapOn]}>
                    <Text style={styles.readingIcon}>{rt.icon}</Text>
                  </View>
                  <View style={styles.readingText}>
                    <Text style={styles.readingTitle}>{rt.title}</Text>
                    <Text style={styles.readingDesc}>{rt.desc}</Text>
                  </View>
                  {selectedType === rt.id && <Text style={styles.selectedCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>

            {/* Optional question */}
            <View style={styles.questionWrap}>
              <Text style={styles.questionLabel}>Was möchtest du wissen? (optional)</Text>
              <TextInput
                style={styles.questionInput}
                value={question}
                onChangeText={setQuestion}
                placeholder="z.B. Wie sieht meine berufliche Entwicklung aus?"
                placeholderTextColor={C.textMuted}
                multiline
                maxLength={300}
              />
            </View>

            <TouchableOpacity style={styles.startBtn} onPress={startWithProfile} activeOpacity={0.85}>
              <Text style={styles.startBtnText}>Horoskop erstellen ✧</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.newDataBtn}
              onPress={() => startFresh(selectedType)}
              activeOpacity={0.8}
            >
              <Text style={styles.newDataBtnText}>Andere Geburtsdaten verwenden</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── Kein Profil: normale Auswahl ─────────────────────────────── */}
        {!profile && (
          <>
            <Text style={styles.sectionLabel}>READING WÄHLEN</Text>
            <View style={styles.readingList}>
              {READING_TYPES.map((rt) => (
                <TouchableOpacity
                  key={rt.id}
                  style={styles.readingCard}
                  onPress={() => startFresh(rt.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.readingIconWrap}>
                    <Text style={styles.readingIcon}>{rt.icon}</Text>
                  </View>
                  <View style={styles.readingText}>
                    <Text style={styles.readingTitle}>{rt.title}</Text>
                    <Text style={styles.readingDesc}>{rt.desc}</Text>
                  </View>
                  <Text style={styles.arrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>

            {!isGuest && (
              <View style={styles.profileHint}>
                <Text style={styles.profileHintText}>
                  💡 Lege einmalig ein persönliches Profil an — dann entfällt die Dateneingabe bei jedem Reading.
                </Text>
                <TouchableOpacity onPress={() => router.push('/onboarding/profile-setup' as any)}>
                  <Text style={styles.profileHintLink}>Profil anlegen →</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: mc.bg },
  center: { flex: 1, backgroundColor: mc.bg, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 24, gap: 20, paddingBottom: 60 },

  header: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  icon:   { fontSize: 44, color: mc.primary },
  title:  { fontSize: 32, fontWeight: '800', color: C.white },
  sub:    { fontSize: 14, color: C.textSec, textAlign: 'center' },

  profileBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: mc.surface, borderRadius: 12, borderWidth: 1.5, borderColor: mc.primary + '44',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  profileBadgeText: { fontSize: 13, color: C.textSec, fontWeight: '600' },
  profileBadgeEdit: { fontSize: 13, color: mc.primary, fontWeight: '700' },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1.8 },

  readingList: { gap: 12 },
  readingCard: {
    backgroundColor: mc.surface,
    borderRadius: 18, borderWidth: 1.5, borderColor: mc.border,
    padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  readingCardOn: { borderColor: mc.primary, backgroundColor: mc.primary + '11' },
  readingIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: mc.primary + '22',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  readingIconWrapOn: { backgroundColor: mc.primary + '44' },
  readingIcon:  { fontSize: 24, color: mc.primary },
  readingText:  { flex: 1, gap: 3 },
  readingTitle: { fontSize: 15, fontWeight: '800', color: C.white },
  readingDesc:  { fontSize: 12, color: C.textSec },
  arrow:        { fontSize: 18, fontWeight: '700', color: mc.primary },
  selectedCheck: { fontSize: 16, color: mc.primary, fontWeight: '900' },

  questionWrap: { gap: 8 },
  questionLabel: { fontSize: 13, fontWeight: '600', color: C.textSec },
  questionInput: {
    backgroundColor: mc.surface, borderRadius: 12, borderWidth: 1.5,
    borderColor: mc.border, color: C.white, fontSize: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    minHeight: 72, textAlignVertical: 'top',
  },

  startBtn: {
    backgroundColor: mc.primary, borderRadius: 16, paddingVertical: 18, alignItems: 'center',
  },
  startBtnText: { color: C.bg, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  newDataBtn: { alignItems: 'center', paddingVertical: 8 },
  newDataBtnText: { color: C.textMuted, fontSize: 13 },

  profileHint: {
    backgroundColor: mc.surface, borderRadius: 14, borderWidth: 1,
    borderColor: mc.border, padding: 16, gap: 8,
  },
  profileHintText: { fontSize: 13, color: C.textSec, lineHeight: 20 },
  profileHintLink: { fontSize: 13, color: mc.primary, fontWeight: '700' },
});
