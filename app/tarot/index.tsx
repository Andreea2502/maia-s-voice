// Tarot Module — Entry Screen with Profile Integration
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { C, MODULE_COLORS } from '@/lib/colors';
import { PERSONAS } from '@/lib/personas';

const mc = MODULE_COLORS.tarot;

interface PersonalProfile {
  displayName?: string;
  focus?: string;
  lifeFocus?: string;
  areasOfInterest?: string[];
  relationshipStatus?: string;
  pronouns?: string;
}

export default function TarotIndex() {
  const [profile, setProfile] = useState<PersonalProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from('user_profiles')
        .select('personal_profile, preferred_language')
        .eq('id', user.id)
        .single();

      if (data?.personal_profile) {
        setProfile(data.personal_profile as PersonalProfile);
      }
    } catch (_) {
      // non-fatal — continue without profile
    } finally {
      setLoading(false);
    }
  }

  function buildProfileSummary(p: PersonalProfile): string {
    const compact: Record<string, any> = {};
    if (p.displayName) compact.name = p.displayName;
    if (p.lifeFocus ?? p.focus) compact.focus = p.lifeFocus ?? p.focus;
    if (p.areasOfInterest?.length) compact.areas = p.areasOfInterest;
    if (p.relationshipStatus) compact.relationship = p.relationshipStatus;
    return JSON.stringify(compact);
  }

  function handlePersonaPress(personaId: string) {
    if (profile && Object.keys(profile).length > 0) {
      const profileSummary = encodeURIComponent(buildProfileSummary(profile));
      router.push(`/tarot/onboarding?persona=${personaId}&profileSummary=${profileSummary}` as any);
    } else {
      router.push(`/tarot/onboarding?persona=${personaId}` as any);
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.bg} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.icon}>✦</Text>
          <Text style={styles.title}>Tarot</Text>

          {loading ? (
            <ActivityIndicator size="small" color={mc.primary} style={{ marginTop: 8 }} />
          ) : profile?.displayName ? (
            <Text style={styles.sub}>
              Willkommen zurück, {profile.displayName} — lass die Karten sprechen
            </Text>
          ) : (
            <Text style={styles.sub}>
              Wähle deine Leserin und lass die Karten sprechen
            </Text>
          )}
        </View>

        {/* Profile chip — show if profile exists */}
        {!loading && profile?.displayName && (
          <View style={styles.profileChip}>
            <Text style={styles.profileChipText}>
              ✦ Dein Profil ist aktiv — die Lesung wird personalisiert
            </Text>
          </View>
        )}

        {/* No profile nudge */}
        {!loading && !profile?.displayName && (
          <TouchableOpacity
            style={styles.profileNudge}
            onPress={() => router.push('/onboarding/profile-setup' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.profileNudgeTitle}>Mein Profil einrichten</Text>
            <Text style={styles.profileNudgeDesc}>
              Für persönlichere Lesungen — in 2 Minuten
            </Text>
            <Text style={styles.profileNudgeArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Persona selector */}
        <Text style={styles.sectionLabel}>LESERIN WÄHLEN</Text>
        <View style={styles.personaList}>
          {PERSONAS.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.personaCard}
              onPress={() => handlePersonaPress(p.id)}
              activeOpacity={0.85}
            >
              <View style={[styles.personaAccent, { backgroundColor: p.accentColor + '33' }]}>
                <Text style={[styles.personaInitial, { color: p.accentColor }]}>
                  {p.name.de[0]}
                </Text>
              </View>
              <View style={styles.personaText}>
                <Text style={styles.personaName}>{p.name.de}</Text>
                <Text style={styles.personaTagline}>{p.tagline.de}</Text>
                <Text style={styles.personaDesc} numberOfLines={2}>
                  {p.description.de}
                </Text>
              </View>
              <Text style={[styles.personaArrow, { color: p.accentColor }]}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Phase 2 note */}
        <View style={styles.phase2Note}>
          <Text style={styles.phase2Text}>
            ✦ 3D Kartenanimation · Feuer-Hintergrund · 4 Legestile
          </Text>
          <Text style={styles.phase2Sub}>kommt in Phase 2</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: mc.bg },
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: mc.surface,
    opacity: 0.6,
  },

  content: { padding: 24, gap: 20, paddingBottom: 48 },

  header: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  icon:   { fontSize: 44, color: mc.primary },
  title:  { fontSize: 32, fontWeight: '800', color: C.white },
  sub:    { fontSize: 14, color: C.textSec, textAlign: 'center' },

  profileChip: {
    backgroundColor: mc.primary + '18',
    borderRadius: 12, borderWidth: 1, borderColor: mc.primary + '44',
    paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center',
  },
  profileChipText: { color: mc.primary, fontSize: 13, fontWeight: '600' },

  profileNudge: {
    backgroundColor: mc.surface,
    borderRadius: 16, borderWidth: 1.5, borderColor: mc.border,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  profileNudgeTitle: { fontSize: 14, fontWeight: '700', color: C.white, flex: 1 },
  profileNudgeDesc:  { fontSize: 12, color: C.textMuted, flex: 2 },
  profileNudgeArrow: { fontSize: 18, color: mc.primary, fontWeight: '700' },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1.8,
  },

  personaList: { gap: 12 },
  personaCard: {
    backgroundColor: mc.surface,
    borderRadius: 18, borderWidth: 1.5, borderColor: mc.border,
    padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  personaAccent: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  personaInitial: { fontSize: 22, fontWeight: '800' },
  personaText:   { flex: 1, gap: 2 },
  personaName:   { fontSize: 16, fontWeight: '800', color: C.white },
  personaTagline:{ fontSize: 12, color: C.textSec, fontWeight: '600' },
  personaDesc:   { fontSize: 12, color: C.textMuted, lineHeight: 17 },
  personaArrow:  { fontSize: 18, fontWeight: '700' },

  phase2Note: {
    backgroundColor: mc.surface,
    borderRadius: 14, borderWidth: 1, borderColor: mc.border,
    padding: 16, alignItems: 'center', gap: 4, marginTop: 8,
  },
  phase2Text: { color: mc.primary, fontSize: 12, fontWeight: '600' },
  phase2Sub:  { color: C.textMuted, fontSize: 11 },
});
