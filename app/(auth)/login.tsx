import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSupabase } from '@/hooks/useSupabase';
import { useLanguage } from '@/hooks/useLanguage';

export default function LoginScreen() {
  const supabase = useSupabase();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  async function handleAuth() {
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      let result;
      if (mode === 'signup') {
        result = await supabase.auth.signUp({ email, password });
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
      }
      if (result.error) throw result.error;

      // Check if onboarding is completed
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('id', result.data.user!.id)
        .single();

      if (!profile?.onboarding_completed) {
        router.replace('/(auth)/onboarding-consent');
      } else {
        router.replace('/(tabs)/');
      }
    } catch (err: any) {
      setError(err.message ?? t('errors.network'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.symbol}>✦</Text>
          <Text style={styles.title}>{t('auth.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder={t('auth.email_label')}
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder={t('auth.password_label')}
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#1a0a2e" />
            ) : (
              <Text style={styles.btnText}>
                {mode === 'signup' ? t('auth.signup_button') : t('auth.login_button')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            <Text style={styles.switchText}>
              {mode === 'login' ? t('auth.no_account') : t('auth.already_have_account')}{' '}
              <Text style={styles.switchLink}>
                {mode === 'login' ? t('auth.signup_button') : t('auth.login_button')}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0A1E',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 28,
    gap: 40,
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  symbol: {
    fontSize: 48,
    color: '#C9956A',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F5E6D0',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#888888',
    letterSpacing: 0.3,
  },
  form: {
    gap: 14,
  },
  input: {
    backgroundColor: '#ffffff0d',
    borderWidth: 1,
    borderColor: '#ffffff22',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F5E6D0',
    fontSize: 16,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 13,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: '#C9956A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#1a0a2e',
    fontSize: 16,
    fontWeight: '700',
  },
  switchText: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  switchLink: {
    color: '#C9956A',
    fontWeight: '600',
  },
});
