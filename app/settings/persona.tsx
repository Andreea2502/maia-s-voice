import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { PERSONAS } from '@/lib/personas';
import { PersonaAvatar } from '@/components/ui/PersonaAvatar';
import { useSupabase } from '@/hooks/useSupabase';
import { useLanguage } from '@/hooks/useLanguage';
import { PersonaId } from '@/lib/personas';

export default function PersonaScreen() {
  const supabase = useSupabase();
  const { t, language } = useLanguage();
  const [selected, setSelected] = useState<PersonaId>('luna');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('user_profiles').select('preferred_persona').eq('id', user.id).single().then(({ data }) => {
        if (data?.preferred_persona) setSelected(data.preferred_persona as PersonaId);
      });
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_profiles').update({ preferred_persona: selected }).eq('id', user.id);
    }
    setSaving(false);
    router.back();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('settings.persona_title')}</Text>

      {PERSONAS.map((p) => (
        <View key={p.id} style={styles.personaBlock}>
          <PersonaAvatar
            persona={p}
            selected={selected === p.id}
            onPress={() => setSelected(p.id)}
            size="large"
            showInfo
          />
          <Text style={styles.description} numberOfLines={4}>
            {p.description[language] ?? p.description['de']}
          </Text>
          <View style={[styles.quote, { borderLeftColor: p.accentColor }]}>
            <Text style={[styles.quoteText, { color: p.accentColor + 'bb' }]}>
              "{p.introText[language] ?? p.introText['de']}"
            </Text>
          </View>
          <View style={styles.personalityRow}>
            <Text style={styles.personalityLabel}>Persönlichkeit: </Text>
            <Text style={styles.personalityValue}>
              {p.personality[language] ?? p.personality['de']}
            </Text>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#1a0a2e" /> : <Text style={styles.saveBtnText}>{t('common.save')}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0A1E' },
  content: { padding: 24, gap: 20, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '700', color: '#F5E6D0' },
  personaBlock: {
    gap: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff08',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ffffff11',
  },
  description: { color: '#aaa', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  quote: { borderLeftWidth: 3, paddingLeft: 12, alignSelf: 'stretch' },
  quoteText: { fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  personalityRow: { flexDirection: 'row', flexWrap: 'wrap' },
  personalityLabel: { color: '#666', fontSize: 12 },
  personalityValue: { color: '#aaa', fontSize: 12 },
  saveBtn: { backgroundColor: '#C9956A', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { color: '#1a0a2e', fontSize: 16, fontWeight: '700' },
});
