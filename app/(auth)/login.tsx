import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { C } from '@/lib/colors';

export default function LoginScreen() {
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
      setError(err.message ?? 'Fehler / Error');
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
        <View style={styles.header}>
          <Text style={styles.star}>✦</Text>
          <Text style={styles.title}>Maia's Voice</Text>
          <Text style={styles.subtitle}>
            {mode === 'login'
              ? 'Willkommen zurück · Welcome back'
              : 'Konto erstellen · Create account'}
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="E-Mail"
            placeholderTextColor={C.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder="Passwort · Password"
            placeholderTextColor={C.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={C.bg} />
              : <Text style={styles.btnText}>
                  {mode === 'signup' ? 'Registrieren · Sign up' : 'Anmelden · Log in'}
                </Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            <Text style={styles.switchText}>
              {mode === 'login'
                ? 'Noch kein Konto? · No account?  '
                : 'Schon ein Konto? · Have account?  '}
              <Text style={styles.switchLink}>
                {mode === 'login' ? 'Registrieren' : 'Anmelden'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  inner:     { flex: 1, justifyContent: 'center', padding: 28, gap: 40 },
  header:    { alignItems: 'center', gap: 12 },
  star:      { fontSize: 48, color: C.gold },
  title:     { fontSize: 28, fontWeight: '800', color: C.white, letterSpacing: 0.5 },
  subtitle:  { fontSize: 14, color: C.textSec },
  form:      { gap: 14 },
  input: {
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 15,
    color: C.white,
    fontSize: 16,
  },
  errorBox: {
    backgroundColor: C.errorBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.errorBorder,
    padding: 12,
  },
  errorText: { color: C.error, fontSize: 13 },
  btn: {
    backgroundColor: C.gold,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: C.bg, fontSize: 16, fontWeight: '800' },
  switchText:  { color: C.textMuted, fontSize: 14, textAlign: 'center', marginTop: 4 },
  switchLink:  { color: C.gold, fontWeight: '700' },
});
