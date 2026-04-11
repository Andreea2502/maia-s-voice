import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useSupabase } from '@/hooks/useSupabase';
import { useLanguage } from '@/hooks/useLanguage';

export default function OnboardingConsentScreen() {
  const supabase = useSupabase();
  const { t } = useLanguage();

  const [voiceConsent, setVoiceConsent] = useState(false);
  const [dataConsent, setDataConsent] = useState(false);
  const [sensitiveConsent, setSensitiveConsent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [retentionMonths, setRetentionMonths] = useState(6);
  const [loading, setLoading] = useState(false);

  const allRequired = termsAccepted && voiceConsent;

  async function handleAccept() {
    if (!allRequired) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase.from('user_profiles').update({
        voice_consent: voiceConsent,
        data_retention_consent: dataConsent,
        data_retention_months: retentionMonths,
      }).eq('id', user.id);

      const consents = [
        { type: 'voice_recording', granted: voiceConsent },
        { type: 'data_retention', granted: dataConsent },
        { type: 'sensitive_data_processing', granted: sensitiveConsent },
        { type: 'terms_of_service', granted: termsAccepted },
        { type: 'privacy_policy', granted: termsAccepted },
      ];

      await supabase.from('consent_log').insert(
        consents.map((c) => ({
          user_id: user.id,
          consent_type: c.type,
          granted: c.granted,
          consent_text_version: '1.0',
        }))
      );

      router.replace('/reading/onboarding');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.symbol}>🔒</Text>
        <Text style={styles.title}>{t('consent.title')}</Text>
        <Text style={styles.subtitle}>{t('consent.subtitle')}</Text>
      </View>

      {/* Voice Consent – REQUIRED */}
      <ConsentRow
        title={t('consent.voice_title')}
        description={t('consent.voice_desc')}
        value={voiceConsent}
        onChange={setVoiceConsent}
        required
      />

      {/* Data Retention */}
      <ConsentRow
        title={t('consent.data_title')}
        description={t('consent.data_desc')}
        value={dataConsent}
        onChange={setDataConsent}
      />

      {dataConsent && (
        <View style={styles.retentionRow}>
          <Text style={styles.retentionLabel}>{t('consent.retention_label')}</Text>
          <View style={styles.retentionBtns}>
            {[3, 6, 12].map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.retentionBtn, retentionMonths === m && styles.retentionBtnActive]}
                onPress={() => setRetentionMonths(m)}
              >
                <Text style={[styles.retentionBtnText, retentionMonths === m && styles.retentionBtnTextActive]}>
                  {m === 3 ? t('consent.retention_3m') : m === 6 ? t('consent.retention_6m') : t('consent.retention_12m')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Sensitive Data */}
      <ConsentRow
        title={t('consent.sensitive_title')}
        description={t('consent.sensitive_desc')}
        value={sensitiveConsent}
        onChange={setSensitiveConsent}
      />

      {/* Terms */}
      <ConsentRow
        title={t('consent.terms_link') + ' & ' + t('consent.privacy_link')}
        description=""
        value={termsAccepted}
        onChange={setTermsAccepted}
        required
      />

      <Text style={styles.requiredNote}>{t('consent.required_note')}</Text>

      <TouchableOpacity
        style={[styles.acceptBtn, !allRequired && styles.acceptBtnDisabled]}
        onPress={handleAccept}
        disabled={!allRequired || loading}
      >
        {loading ? (
          <ActivityIndicator color="#1a0a2e" />
        ) : (
          <Text style={styles.acceptBtnText}>{t('consent.accept_all')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

function ConsentRow({
  title, description, value, onChange, required,
}: {
  title: string; description: string; value: boolean; onChange: (v: boolean) => void; required?: boolean;
}) {
  return (
    <View style={styles.consentRow}>
      <View style={styles.consentInfo}>
        <Text style={styles.consentTitle}>
          {title}
          {required && <Text style={styles.requiredStar}> *</Text>}
        </Text>
        {description ? <Text style={styles.consentDesc}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#333', true: '#C9956A' }}
        thumbColor={value ? '#F5E6D0' : '#888'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0A1E',
  },
  content: {
    padding: 24,
    gap: 20,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  symbol: {
    fontSize: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F5E6D0',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#ffffff08',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffffff11',
  },
  consentInfo: {
    flex: 1,
    gap: 4,
  },
  consentTitle: {
    color: '#F5E6D0',
    fontSize: 15,
    fontWeight: '600',
  },
  requiredStar: {
    color: '#C9956A',
  },
  consentDesc: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
  },
  retentionRow: {
    gap: 10,
    paddingHorizontal: 4,
  },
  retentionLabel: {
    color: '#aaa',
    fontSize: 13,
  },
  retentionBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  retentionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffffff22',
    backgroundColor: '#ffffff0a',
  },
  retentionBtnActive: {
    backgroundColor: '#C9956A22',
    borderColor: '#C9956A',
  },
  retentionBtnText: {
    color: '#888',
    fontSize: 13,
  },
  retentionBtnTextActive: {
    color: '#C9956A',
    fontWeight: '600',
  },
  requiredNote: {
    color: '#555',
    fontSize: 12,
    textAlign: 'center',
  },
  acceptBtn: {
    backgroundColor: '#C9956A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  acceptBtnDisabled: {
    opacity: 0.4,
  },
  acceptBtnText: {
    color: '#1a0a2e',
    fontSize: 16,
    fontWeight: '700',
  },
});
