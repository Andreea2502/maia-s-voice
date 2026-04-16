/**
 * Profil-Tab — Persönliches Profil, Horoskop-Einstellungen, App-Settings
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Switch, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSupabase } from '@/hooks/useSupabase';
import { useLanguage } from '@/hooks/useLanguage';
import { getPersonaById, PersonaId } from '@/lib/personas';
import { C } from '@/lib/colors';

// ─── Row Components ───────────────────────────────────────────────────────────
function SettingsRow({
  icon, label, value, onPress, destructive = false,
}: {
  icon: string; label: string; value?: string;
  onPress: () => void; destructive?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        <Text style={[styles.rowArrow, destructive && styles.rowArrowDestructive]}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

function ToggleRow({
  icon, label, desc, value, onToggle, loading = false,
}: {
  icon: string; label: string; desc?: string;
  value: boolean; onToggle: (v: boolean) => void; loading?: boolean;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {desc ? <Text style={styles.toggleDesc}>{desc}</Text> : null}
      </View>
      {loading
        ? <ActivityIndicator size="small" color={C.gold} />
        : <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: C.border, true: C.gold }}
            thumbColor={value ? C.white : C.textMuted}
          />
      }
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function Divider() {
  return <View style={styles.divider} />;
}

// ─── Profile Header ───────────────────────────────────────────────────────────
function ProfileHeader({
  name, sunSign, profileComplete, onEdit,
}: {
  name: string; sunSign?: string; profileComplete: boolean; onEdit: () => void;
}) {
  const initial = name ? name[0].toUpperCase() : '✦';
  return (
    <View style={styles.profileHeader}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.profileName}>{name || 'Mein Profil'}</Text>
        {sunSign
          ? <Text style={styles.profileSub}>☀️ {sunSign} · Profil vollständig</Text>
          : <Text style={styles.profileSubIncomplete}>Profil noch nicht angelegt</Text>
        }
      </View>
      <TouchableOpacity style={styles.editBtn} onPress={onEdit} activeOpacity={0.8}>
        <Text style={styles.editBtnText}>{profileComplete ? 'Bearbeiten' : 'Anlegen'}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Sun sign helper ──────────────────────────────────────────────────────────
function getSunSign(birthDate: string | null): string | undefined {
  if (!birthDate) return undefined;
  try {
    const d = new Date(birthDate);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const signs: [number, number, string][] = [
      [3,21,'Widder'],[4,20,'Stier'],[5,21,'Zwillinge'],[6,21,'Krebs'],
      [7,23,'Löwe'],[8,23,'Jungfrau'],[9,23,'Waage'],[10,23,'Skorpion'],
      [11,22,'Schütze'],[12,22,'Steinbock'],[1,20,'Wassermann'],[2,19,'Fische'],
    ];
    for (let i = 0; i < signs.length; i++) {
      const [sm, sd] = signs[i];
      const [nm, nd] = signs[(i + 1) % signs.length];
      if ((m === sm && day >= sd) || (m === nm && day < nd)) return signs[i][2];
    }
    return undefined;
  } catch { return undefined; }
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const supabase = useSupabase();
  const { t, languageLabels, language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState<string | null>(null);

  // Profile data
  const [displayName, setDisplayName]     = useState('');
  const [personaId, setPersonaId]         = useState<PersonaId>('luna');
  const [tier, setTier]                   = useState('free');
  const [isAdmin, setIsAdmin]             = useState(false);
  const [birthDate, setBirthDate]         = useState<string | null>(null);
  const [birthCity, setBirthCity]         = useState('');
  const [profileComplete, setProfileComplete] = useState(false);
  const [areasOfInterest, setAreasOfInterest] = useState<string[]>([]);
  const [lifeFocus, setLifeFocus]         = useState('');

  // Horoscope toggles
  const [dailyEnabled, setDailyEnabled]   = useState(false);
  const [weeklyEnabled, setWeeklyEnabled] = useState(false);

  // Reload when tab gains focus
  useFocusEffect(
    useCallback(() => { loadProfile(); }, [])
  );

  async function loadProfile() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_profiles')
        .select(`
          display_name, preferred_persona, subscription_tier, is_admin,
          birth_date, birth_city,
          profile_completed, personal_profile,
          daily_horoscope_enabled, weekly_horoscope_enabled
        `)
        .eq('id', user.id)
        .single();

      if (data) {
        const pp = (data.personal_profile as any) ?? {};
        setDisplayName(pp.displayName ?? data.display_name ?? '');
        setPersonaId((data.preferred_persona ?? 'luna') as PersonaId);
        setTier(data.subscription_tier ?? 'free');
        setIsAdmin(data.is_admin ?? false);
        setBirthDate(data.birth_date ?? null);
        setBirthCity(data.birth_city ?? '');
        setProfileComplete(data.profile_completed ?? false);
        setAreasOfInterest(pp.areasOfInterest ?? []);
        setLifeFocus(pp.lifeFocus ?? '');
        setDailyEnabled(data.daily_horoscope_enabled ?? false);
        setWeeklyEnabled(data.weekly_horoscope_enabled ?? false);
      }
    } catch { /* non-fatal */ }
    setLoading(false);
  }

  async function toggleHoroscope(type: 'daily' | 'weekly', value: boolean) {
    setSaving(type);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const field = type === 'daily' ? 'daily_horoscope_enabled' : 'weekly_horoscope_enabled';
      await supabase.from('user_profiles').update({ [field]: value }).eq('id', user.id);
      if (type === 'daily') setDailyEnabled(value);
      else setWeeklyEnabled(value);
    } catch {
      Alert.alert('Fehler', 'Einstellung konnte nicht gespeichert werden.');
    }
    setSaving(null);
  }

  async function handleLogout() {
    Alert.alert(
      'Abmelden',
      'Möchtest du dich wirklich abmelden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Abmelden',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  }

  async function handleDeleteData() {
    Alert.alert(
      'Profil löschen',
      'Dein persönliches Profil und alle Geburtsdaten werden unwiderruflich gelöscht. Dein Konto bleibt bestehen.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;
              await supabase.from('user_profiles').update({
                birth_date: null, birth_time: null, birth_city: null,
                birth_country: null, birth_lat: null, birth_lng: null,
                birth_data_consent: false, personal_profile: {},
                profile_completed: false, profile_consent: false,
                daily_horoscope_enabled: false, weekly_horoscope_enabled: false,
              }).eq('id', user.id);
              await supabase.from('birth_data').delete().eq('user_id', user.id);
              await loadProfile();
              Alert.alert('Gelöscht', 'Dein Profil wurde erfolgreich gelöscht.');
            } catch {
              Alert.alert('Fehler', 'Löschen fehlgeschlagen.');
            }
          },
        },
      ]
    );
  }

  const persona  = getPersonaById(personaId);
  const sunSign  = getSunSign(birthDate);
  const tierLabels: Record<string, string> = {
    free: 'Kostenlos',
    basic: 'Basic',
    premium: 'Premium ✦',
    unlimited: 'Unlimited ✦✦',
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={C.gold} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Profil Header ─────────────────────────────────────────────── */}
      <ProfileHeader
        name={displayName}
        sunSign={sunSign}
        profileComplete={profileComplete}
        onEdit={() => router.push('/onboarding/profile-setup' as any)}
      />

      {/* ── Persönliches Profil — Kurzübersicht ────────────────────────── */}
      {profileComplete && (
        <View style={styles.card}>
          {birthDate && (
            <View style={styles.profileDetail}>
              <Text style={styles.profileDetailIcon}>📅</Text>
              <Text style={styles.profileDetailText}>
                {new Date(birthDate).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
                {birthCity ? ` · ${birthCity}` : ''}
              </Text>
            </View>
          )}
          {lifeFocus ? (
            <View style={styles.profileDetail}>
              <Text style={styles.profileDetailIcon}>🎯</Text>
              <Text style={styles.profileDetailText} numberOfLines={2}>{lifeFocus}</Text>
            </View>
          ) : null}
          {areasOfInterest.length > 0 && (
            <View style={styles.profileDetail}>
              <Text style={styles.profileDetailIcon}>💫</Text>
              <Text style={styles.profileDetailText}>
                {areasOfInterest.slice(0, 4).join(' · ')}
                {areasOfInterest.length > 4 ? ' …' : ''}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── Horoskop-Einstellungen ────────────────────────────────────── */}
      <SectionHeader title="TÄGLICHE HOROSKOPE" />
      <View style={styles.card}>
        <ToggleRow
          icon="🌅"
          label="Tageshoroskop"
          desc={dailyEnabled
            ? 'Jeden Morgen um 07:00 Uhr bereit'
            : 'Täglich personalisierte Deutung aktivieren'}
          value={dailyEnabled}
          onToggle={(v) => toggleHoroscope('daily', v)}
          loading={saving === 'daily'}
        />
        <Divider />
        <ToggleRow
          icon="📅"
          label="Wochenhoroskop"
          desc={weeklyEnabled
            ? 'Jeden Montag früh bereit'
            : 'Wöchentliche Vorschau jeden Montag'}
          value={weeklyEnabled}
          onToggle={(v) => toggleHoroscope('weekly', v)}
          loading={saving === 'weekly'}
        />
        {!profileComplete && (
          <View style={styles.horoscopeHint}>
            <Text style={styles.horoscopeHintText}>
              ⚠️ Für automatische Horoskope bitte zuerst Geburtsdaten im Profil eintragen.
            </Text>
            <TouchableOpacity onPress={() => router.push('/onboarding/profile-setup' as any)}>
              <Text style={styles.horoscopeHintLink}>Profil anlegen →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── App-Einstellungen ─────────────────────────────────────────── */}
      <SectionHeader title="EINSTELLUNGEN" />
      <View style={styles.card}>
        <SettingsRow
          icon="🔮"
          label="Bevorzugte Leserin"
          value={persona.name.de}
          onPress={() => router.push('/settings/persona')}
        />
        <Divider />
        <SettingsRow
          icon="🌐"
          label="Sprache"
          value={languageLabels[language]}
          onPress={() => router.push('/settings/language')}
        />
        <Divider />
        <SettingsRow
          icon="⭐"
          label="Abonnement"
          value={tierLabels[tier] ?? tier}
          onPress={() => router.push('/settings/subscription')}
        />
      </View>

      {/* ── Admin Panel ───────────────────────────────────────────────── */}
      {isAdmin && (
        <>
          <SectionHeader title="ADMINISTRATION" />
          <View style={styles.card}>
            <SettingsRow
              icon="🔧"
              label="Admin Panel"
              value="User & Zugänge verwalten"
              onPress={() => router.push('/admin' as any)}
            />
          </View>
        </>
      )}

      {/* ── Datenschutz ───────────────────────────────────────────────── */}
      <SectionHeader title="DATENSCHUTZ" />
      <View style={styles.card}>
        <SettingsRow
          icon="🔒"
          label="Datenschutzeinstellungen"
          onPress={() => router.push('/settings/privacy')}
        />
        <Divider />
        <SettingsRow
          icon="🗑️"
          label="Profildaten löschen"
          onPress={handleDeleteData}
          destructive
        />
      </View>

      {/* ── Konto ─────────────────────────────────────────────────────── */}
      <SectionHeader title="KONTO" />
      <View style={styles.card}>
        <SettingsRow
          icon="🚪"
          label="Abmelden"
          onPress={handleLogout}
          destructive
        />
      </View>

      <Text style={styles.versionNote}>Maia's Voice · Version 1.0</Text>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll:        { flex: 1, backgroundColor: C.bg },
  content:       { padding: 20, gap: 14, paddingBottom: 60 },
  loadingScreen: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },

  // Profile header
  profileHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.surface, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.gold + '33', padding: 18,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: C.gold + '22', borderWidth: 2, borderColor: C.gold + '55',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:    { fontSize: 22, fontWeight: '800', color: C.gold },
  profileName:   { fontSize: 17, fontWeight: '800', color: C.white },
  profileSub:    { fontSize: 12, color: C.textSec },
  profileSubIncomplete: { fontSize: 12, color: C.textMuted },
  editBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1.5, borderColor: C.gold + '66',
    backgroundColor: C.gold + '11',
  },
  editBtnText: { color: C.gold, fontSize: 13, fontWeight: '700' },

  // Compact profile detail
  card: {
    backgroundColor: C.surface, borderRadius: 18,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  profileDetail: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 14, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  profileDetailIcon: { fontSize: 16, marginTop: 1 },
  profileDetailText: { flex: 1, fontSize: 14, color: C.textSec, lineHeight: 20 },

  sectionHeader: {
    fontSize: 11, fontWeight: '700', color: C.textMuted,
    letterSpacing: 1.8, marginTop: 4, marginLeft: 4,
  },

  // Settings rows
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 15,
  },
  rowIcon:  { fontSize: 18, width: 26, textAlign: 'center' },
  rowLabel: { flex: 1, fontSize: 15, color: C.white, fontWeight: '500' },
  rowLabelDestructive: { color: '#FF6B6B' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontSize: 14, color: C.textMuted },
  rowArrow: { fontSize: 20, color: C.textMuted, fontWeight: '300' },
  rowArrowDestructive: { color: '#FF6B6B66' },

  // Toggle rows
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  toggleDesc: { fontSize: 12, color: C.textMuted, lineHeight: 17 },

  divider: { height: 1, backgroundColor: C.border, marginLeft: 54 },

  // Horoscope hint
  horoscopeHint: {
    margin: 12, padding: 12,
    backgroundColor: C.gold + '11', borderRadius: 12,
    borderWidth: 1, borderColor: C.gold + '33', gap: 6,
  },
  horoscopeHintText: { fontSize: 13, color: C.textSec, lineHeight: 19 },
  horoscopeHintLink: { fontSize: 13, color: C.gold, fontWeight: '700' },

  versionNote: {
    textAlign: 'center', fontSize: 12,
    color: C.textMuted, marginTop: 8,
  },
});
