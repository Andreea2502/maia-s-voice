import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSupabase } from '@/hooks/useSupabase';
import { useLanguage } from '@/hooks/useLanguage';
import { getPersonaById } from '@/lib/personas';
import { PersonaId, SubscriptionTier } from '@/types/user';

export default function ProfileScreen() {
  const supabase = useSupabase();
  const { t, languageLabels, language } = useLanguage();
  const [displayName, setDisplayName] = useState('');
  const [personaId, setPersonaId] = useState<PersonaId>('mystic_elena');
  const [tier, setTier] = useState<SubscriptionTier>('free');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
    if (data) {
      setDisplayName(data.display_name ?? '');
      setPersonaId(data.preferred_persona as PersonaId);
      setTier(data.subscription_tier as SubscriptionTier);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  }

  const persona = getPersonaById(personaId);
  const tierLabels: Record<SubscriptionTier, string> = {
    free: t('settings.free_plan'),
    basic: t('settings.basic_plan'),
    premium: t('settings.premium_plan'),
    unlimited: t('settings.unlimited_plan'),
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('profile.title')}</Text>

      {displayName ? <Text style={styles.name}>{displayName}</Text> : null}

      <View style={styles.rows}>
        <ProfileRow
          label={t('profile.persona_label')}
          value={persona.name[language] ?? persona.name['de']}
          onPress={() => router.push('/settings/persona')}
        />
        <ProfileRow
          label={t('profile.language_label')}
          value={languageLabels[language]}
          onPress={() => router.push('/settings/language')}
        />
        <ProfileRow
          label={t('profile.subscription_label')}
          value={tierLabels[tier]}
          onPress={() => router.push('/settings/subscription')}
        />
        <ProfileRow
          label={t('profile.privacy_label')}
          value=""
          onPress={() => router.push('/settings/privacy')}
        />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>{t('profile.logout')}</Text>
      </TouchableOpacity>
    </View>
  );
}

function ProfileRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        <Text style={styles.rowArrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0A1E', padding: 24, gap: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#F5E6D0' },
  name: { fontSize: 16, color: '#aaa' },
  rows: { gap: 2 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff11',
  },
  rowLabel: { color: '#F5E6D0', fontSize: 15 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowValue: { color: '#888', fontSize: 14 },
  rowArrow: { color: '#555', fontSize: 18 },
  logoutBtn: {
    borderWidth: 1,
    borderColor: '#ff666633',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 'auto',
  },
  logoutText: { color: '#ff6666', fontWeight: '600' },
});
