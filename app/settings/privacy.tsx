import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSupabase } from '@/hooks/useSupabase';
import { useLanguage } from '@/hooks/useLanguage';

export default function PrivacyScreen() {
  const supabase = useSupabase();
  const { t } = useLanguage();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('gdpr-export');
      if (error) throw error;
      Alert.alert('Export', 'Daten wurden exportiert. (In Produktion: Download starten)');
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    Alert.alert(
      t('settings.delete_data'),
      t('settings.delete_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const { error } = await supabase.functions.invoke('gdpr-delete', { method: 'DELETE' });
              if (error) throw error;
              await supabase.auth.signOut();
              router.replace('/(auth)/login');
            } catch (err: any) {
              Alert.alert(t('common.error'), err.message);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('settings.privacy_title')}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DSGVO / GDPR</Text>

        <TouchableOpacity style={styles.row} onPress={handleExport} disabled={exporting}>
          <Text style={styles.rowText}>{t('settings.export_data')}</Text>
          {exporting ? <ActivityIndicator size="small" color="#C9956A" /> : <Text style={styles.rowArrow}>→</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.row, styles.rowDanger]} onPress={handleDelete} disabled={deleting}>
          <Text style={styles.rowTextDanger}>{t('settings.delete_data')}</Text>
          {deleting ? <ActivityIndicator size="small" color="#ff6666" /> : <Text style={styles.rowArrowDanger}>→</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Alle Daten werden auf EU-Servern (Frankfurt) gespeichert. Du hast das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17) und Datenübertragbarkeit (Art. 20) nach der DSGVO.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0A1E', padding: 24, gap: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#F5E6D0' },
  section: { gap: 8 },
  sectionTitle: { color: '#666', fontSize: 11, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#ffffff08', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#ffffff11',
  },
  rowDanger: { borderColor: '#ff666622' },
  rowText: { color: '#F5E6D0', fontSize: 15 },
  rowTextDanger: { color: '#ff6666', fontSize: 15 },
  rowArrow: { color: '#888', fontSize: 16 },
  rowArrowDanger: { color: '#ff6666', fontSize: 16 },
  infoBox: { backgroundColor: '#ffffff06', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#ffffff11' },
  infoText: { color: '#666', fontSize: 12, lineHeight: 18 },
});
