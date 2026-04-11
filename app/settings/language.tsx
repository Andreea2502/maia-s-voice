import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useLanguage } from '@/hooks/useLanguage';
import { SupportedLanguage } from '@/types/user';

export default function LanguageScreen() {
  const { t, language, changeLanguage, supportedLanguages, languageLabels } = useLanguage();

  async function handleSelect(lang: SupportedLanguage) {
    await changeLanguage(lang);
    router.back();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('settings.language_title')}</Text>
      {supportedLanguages.map((lang) => (
        <TouchableOpacity
          key={lang}
          style={[styles.row, lang === language && styles.rowSelected]}
          onPress={() => handleSelect(lang)}
        >
          <Text style={[styles.label, lang === language && styles.labelSelected]}>
            {languageLabels[lang]}
          </Text>
          {lang === language && <Text style={styles.check}>✓</Text>}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0A1E' },
  content: { padding: 24, gap: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#F5E6D0', marginBottom: 8 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#ffffff08', borderRadius: 12, paddingVertical: 14,
    paddingHorizontal: 16, borderWidth: 1, borderColor: '#ffffff11',
  },
  rowSelected: { borderColor: '#C9956A', backgroundColor: '#C9956A11' },
  label: { color: '#F5E6D0', fontSize: 16 },
  labelSelected: { color: '#C9956A', fontWeight: '700' },
  check: { color: '#C9956A', fontSize: 16, fontWeight: '700' },
});
