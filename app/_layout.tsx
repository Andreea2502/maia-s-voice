import '@/lib/i18n';
import React, { useEffect, useState } from 'react';
import { Stack, useRootNavigationState, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { supabase } from '@/lib/supabase';
import { warmGuestCache } from '@/lib/guest';
import { setAppLanguage } from '@/lib/i18n';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from '@/lib/colors';

SplashScreen.preventAutoHideAsync();

function NavigationGuard() {
  const router = useRouter();
  const navState = useRootNavigationState();

  useEffect(() => {
    if (!navState?.key) return; // navigator not yet mounted

    async function init() {
      try {
        const [savedLang, guestMode] = await Promise.all([
          AsyncStorage.getItem('app_language'),
          warmGuestCache(),
        ]);

        if (savedLang) setAppLanguage(savedLang as any);

        if (guestMode) {
          SplashScreen.hideAsync();
          if (!savedLang) {
            router.replace('/(auth)/language-select');
          } else {
            router.replace('/(tabs)/');
          }
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();

        if (!savedLang) {
          router.replace('/(auth)/language-select');
        } else if (!session) {
          router.replace('/(auth)/login');
        } else {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('onboarding_completed')
            .eq('id', session.user.id)
            .single();

          if (!profile?.onboarding_completed) {
            router.replace('/(auth)/onboarding-consent');
          } else {
            router.replace('/(tabs)/');
          }
        }
      } catch {
        router.replace('/(auth)/language-select');
      } finally {
        SplashScreen.hideAsync();
      }
    }

    init();
  }, [navState?.key]);

  return null;
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={C.bg} />
      <NavigationGuard />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: C.bg },
          headerTintColor: C.white,
          headerTitleStyle: { fontWeight: '700', fontSize: 16, color: C.white },
          contentStyle: { backgroundColor: C.bg },
          headerShadowVisible: false,
        }}
      >
        {/* Auth */}
        <Stack.Screen name="(auth)/language-select"    options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login"              options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/onboarding-consent" options={{ title: 'Einwilligung', headerBackVisible: false }} />
        <Stack.Screen name="(auth)/mode-select"        options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/index"          options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/profile-setup"  options={{ title: 'Persönliches Profil', headerBackVisible: false }} />
        <Stack.Screen name="(auth)/terms"              options={{ title: 'Nutzungsbedingungen' }} />
        <Stack.Screen name="(auth)/privacy"            options={{ title: 'Datenschutz' }} />

        {/* Main tabs */}
        <Stack.Screen name="(tabs)"                    options={{ headerShown: false }} />

        {/* Module: Tarot */}
        <Stack.Screen name="tarot/index"               options={{ headerShown: false }} />
        <Stack.Screen name="tarot/persona-select"      options={{ title: 'Leserin wählen' }} />
        <Stack.Screen name="tarot/onboarding"          options={{ title: 'Vorgespräch', headerBackVisible: false }} />
        <Stack.Screen name="tarot/spread-select"       options={{ title: 'Legestil' }} />
        <Stack.Screen name="tarot/draw"                options={{ title: 'Karten ziehen' }} />
        <Stack.Screen name="tarot/reading"             options={{ title: 'Deutung', headerBackVisible: false }} />

        {/* Module: Astrology */}
        <Stack.Screen name="astrology/index"           options={{ headerShown: false }} />
        <Stack.Screen name="astrology/birth-data"      options={{ title: 'Geburtsdaten' }} />
        <Stack.Screen name="astrology/questionnaire"   options={{ title: 'Persönliches Profil' }} />
        <Stack.Screen name="astrology/reading"         options={{ title: 'Dein Horoskop ✧', headerBackVisible: false }} />

        {/* Admin */}
        <Stack.Screen name="admin/index"               options={{ headerShown: false }} />

        {/* Settings */}
        <Stack.Screen name="settings/language"         options={{ title: 'Sprache' }} />
        <Stack.Screen name="settings/persona"          options={{ title: 'Leserin wählen' }} />
        <Stack.Screen name="settings/privacy"          options={{ title: 'Datenschutz' }} />
        <Stack.Screen name="settings/subscription"     options={{ title: 'Abonnement' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
