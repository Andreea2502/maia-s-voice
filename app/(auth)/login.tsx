import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Animated,
  Dimensions, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { enableGuestMode } from '@/lib/guest';
import { CosmicBackground } from '@/components/ui/CosmicBackground';

const { width: W } = Dimensions.get('window');

// Deep navy luxury palette
const D = {
  bg:         '#091428',
  gold:       '#D4AF5A',
  goldDim:    '#D4AF5A55',
  goldBorder: '#D4AF5A40',
  teal:       '#00D4FF',
  tealGlow:   '#00D4FF30',
  tealDim:    '#00D4FF18',
  white:      '#FFFFFF',
  textSec:    '#8AAAC8',
  textMuted:  '#4A6888',
  inputBg:    '#0D1E3A',
  inputLine:  '#1E3A5F',
  error:      '#FF6B6B',
};

export default function LoginScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [mode, setMode]         = useState<'login' | 'signup'>('login');
  const [emailFocused, setEmailFocused]       = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Entry animations
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const formFade  = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(30)).current;

  // Glow ring pulse
  const pulse1 = useRef(new Animated.Value(0.4)).current;
  const pulse2 = useRef(new Animated.Value(0.2)).current;
  const orbScale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    // Staggered entry
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800,  useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(formFade,  { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(formSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    }, 300);

    // Outer ring slow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse1, { toValue: 0.7,  duration: 3000, useNativeDriver: true }),
        Animated.timing(pulse1, { toValue: 0.25, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    // Inner ring faster pulse, offset
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse2, { toValue: 0.6,  duration: 2400, useNativeDriver: true }),
          Animated.timing(pulse2, { toValue: 0.15, duration: 2400, useNativeDriver: true }),
        ])
      ).start();
    }, 800);

    // Orb breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbScale, { toValue: 1.04, duration: 2800, useNativeDriver: true }),
        Animated.timing(orbScale, { toValue: 0.96, duration: 2800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

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
      setError(err.message ?? 'Fehler');
    } finally {
      setLoading(false);
    }
  }

  async function handleGuest() {
    await enableGuestMode();
    router.replace('/(tabs)/');
  }

  return (
    <CosmicBackground starCount={70}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.scroll}>

            {/* ── HERO SECTION ── */}
            <Animated.View style={[
              styles.hero,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}>
              {/* Outermost glow halo */}
              <Animated.View style={[styles.haloOuter, { opacity: pulse1 }]} />
              {/* Middle ring */}
              <Animated.View style={[styles.haloMid, { opacity: pulse2 }]} />
              {/* Core orb */}
              <Animated.View style={[styles.orbWrap, { transform: [{ scale: orbScale }] }]}>
                <View style={styles.orb}>
                  <Text style={styles.orbSymbol}>✦</Text>
                </View>
              </Animated.View>

              <Text style={styles.appName}>MAIA</Text>
              <Text style={styles.tagline}>
                {mode === 'login' ? 'Willkommen zurück' : 'Beginne deine Reise'}
              </Text>
            </Animated.View>

            {/* ── FORM SECTION ── */}
            <Animated.View style={[
              styles.form,
              { opacity: formFade, transform: [{ translateY: formSlide }] },
            ]}>

              {/* Email input */}
              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, emailFocused && styles.fieldLabelActive]}>
                  E-Mail
                </Text>
                <TextInput
                  style={[styles.fieldInput, emailFocused && styles.fieldInputActive]}
                  placeholder="deine@email.de"
                  placeholderTextColor={D.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                <View style={[styles.fieldLine, emailFocused && styles.fieldLineActive]} />
              </View>

              {/* Password input */}
              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, passwordFocused && styles.fieldLabelActive]}>
                  Passwort
                </Text>
                <TextInput
                  style={[styles.fieldInput, passwordFocused && styles.fieldInputActive]}
                  placeholder="••••••••"
                  placeholderTextColor={D.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
                <View style={[styles.fieldLine, passwordFocused && styles.fieldLineActive]} />
              </View>

              {error ? (
                <Text style={styles.errorText}>⚠️  {error}</Text>
              ) : null}

              {/* Primary CTA */}
              <TouchableOpacity
                style={[styles.btn, loading && styles.btnOff]}
                onPress={handleAuth}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading
                  ? <ActivityIndicator color={D.bg} />
                  : <Text style={styles.btnText}>
                      {mode === 'signup' ? 'Konto erstellen' : 'Anmelden'} →
                    </Text>
                }
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
                <Text style={styles.switchText}>
                  {mode === 'login' ? 'Noch kein Konto? ' : 'Schon registriert? '}
                  <Text style={styles.switchLink}>
                    {mode === 'login' ? 'Registrieren' : 'Anmelden'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* ── DIVIDER ── */}
            <Animated.View style={[styles.divider, { opacity: formFade }]}>
              <View style={styles.divLine} />
              <Text style={styles.divText}>oder</Text>
              <View style={styles.divLine} />
            </Animated.View>

            {/* ── GUEST BUTTON ── */}
            <Animated.View style={{ opacity: formFade }}>
              <TouchableOpacity style={styles.guestBtn} onPress={handleGuest} activeOpacity={0.75}>
                <View style={styles.guestIconWrap}>
                  <Text style={styles.guestIcon}>✧</Text>
                </View>
                <View style={styles.guestTextWrap}>
                  <Text style={styles.guestTitle}>Ohne Anmeldung erkunden</Text>
                  <Text style={styles.guestSub}>Alle Funktionen kostenlos testen</Text>
                </View>
                <Text style={styles.guestArrow}>›</Text>
              </TouchableOpacity>
            </Animated.View>

          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </CosmicBackground>
  );
}

const ORB = 100;
const HALO_MID = 160;
const HALO_OUTER = 230;

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 32,
    gap: 28,
    maxWidth: 440,
    alignSelf: 'center',
    width: '100%',
  },

  // ── Hero ──
  hero: {
    alignItems: 'center',
    gap: 16,
    paddingTop: 8,
  },

  haloOuter: {
    position: 'absolute',
    top: -(HALO_OUTER - ORB) / 2 + 2,
    width: HALO_OUTER,
    height: HALO_OUTER,
    borderRadius: HALO_OUTER / 2,
    borderWidth: 1.5,
    borderColor: D.teal,
    backgroundColor: D.tealDim,
    shadowColor: D.teal,
    shadowOpacity: 0.8,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  haloMid: {
    position: 'absolute',
    top: -(HALO_MID - ORB) / 2 + 2,
    width: HALO_MID,
    height: HALO_MID,
    borderRadius: HALO_MID / 2,
    borderWidth: 1,
    borderColor: D.teal,
    backgroundColor: D.tealGlow,
    shadowColor: D.teal,
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  orbWrap: {
    width: ORB,
    height: ORB,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  orb: {
    width: ORB,
    height: ORB,
    borderRadius: ORB / 2,
    backgroundColor: '#0D2048',
    borderWidth: 2,
    borderColor: D.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: D.gold,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  orbSymbol: {
    fontSize: 40,
    color: D.gold,
  },

  appName: {
    fontSize: 42,
    fontWeight: '900',
    color: D.white,
    letterSpacing: 12,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  tagline: {
    fontSize: 15,
    color: D.textSec,
    letterSpacing: 2,
  },

  // ── Form ──
  form: {
    gap: 20,
  },

  fieldWrap: {
    gap: 6,
    paddingBottom: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: D.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  fieldLabelActive: {
    color: D.gold,
  },
  fieldInput: {
    fontSize: 16,
    color: D.white,
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  fieldInputActive: {
    color: D.white,
  },
  fieldLine: {
    height: 1.5,
    backgroundColor: D.inputLine,
  },
  fieldLineActive: {
    backgroundColor: D.gold,
    shadowColor: D.gold,
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },

  errorText: {
    color: D.error,
    fontSize: 13,
    marginTop: -4,
  },

  btn: {
    backgroundColor: D.gold,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: D.gold,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  btnOff: { opacity: 0.45 },
  btnText: {
    color: '#060E1E',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },

  switchText: {
    color: D.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  switchLink: {
    color: D.gold,
    fontWeight: '700',
  },

  // ── Divider ──
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: -4,
  },
  divLine: { flex: 1, height: 1, backgroundColor: '#1E3A5F' },
  divText: { color: D.textMuted, fontSize: 12, letterSpacing: 1 },

  // ── Guest ──
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderColor: '#1E3A5F',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: '#0D1E3A88',
  },
  guestIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: D.tealDim,
    borderWidth: 1,
    borderColor: D.teal + '50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestIcon:  { fontSize: 22, color: D.teal },
  guestTextWrap: { flex: 1 },
  guestTitle: { color: D.white, fontSize: 15, fontWeight: '700' },
  guestSub:   { color: D.textMuted, fontSize: 12, marginTop: 2 },
  guestArrow: { color: D.textMuted, fontSize: 22, fontWeight: '300' },
});
