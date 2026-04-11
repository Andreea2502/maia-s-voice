import '@/lib/i18n';
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { supabase } from '@/lib/supabase';
import { warmGuestCache } from '@/lib/guest';
import { setAppLanguage } from '@/lib/i18n';
import { Session } from '@supabase/supabase-js';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from '@/lib/colors';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const [savedLang, guestMode] = await Promise.all([
          AsyncStorage.getItem('app_language'),
          warmGuestCache(),
        ]);

        if (savedLang) setAppLanguage(savedLang as any);

        if (guestMode) {
          // Guest: skip auth entirely
          setReady(true);
          SplashScreen.hideAsync();
          if (!savedLang) {
            router.replace('/(auth)/language-select');
          } else {
            router.replace('/(tabs)/');
          }
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

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
        setReady(true);
        SplashScreen.hideAsync();
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={C.bg} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: C.bg },
          headerTintColor: C.white,
          headerTitleStyle: { fontWeight: '700', fontSize: 16, color: C.white },
          contentStyle: { backgroundColor: C.bg },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(auth)/language-select" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login"            options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/onboarding-consent" options={{ title: 'Einwilligung', headerBackVisible: false }} />
        <Stack.Screen name="(auth)/terms"   options={{ title: 'Nutzungsbedingungen' }} />
        <Stack.Screen name="(auth)/privacy" options={{ title: 'Datenschutz' }} />
        <Stack.Screen name="(tabs)"         options={{ headerShown: false }} />
        <Stack.Screen name="reading/onboarding"      options={{ title: 'Vorgespräch', headerBackVisible: false }} />
        <Stack.Screen name="reading/choose-spread"   options={{ title: 'Lege-Art' }} />
        <Stack.Screen name="reading/question"        options={{ title: 'Deine Frage' }} />
        <Stack.Screen name="reading/draw-cards"      options={{ title: 'Karten ziehen' }} />
        <Stack.Screen name="reading/interpretation"  options={{ title: 'Deutung', headerBackVisible: false }} />
        <Stack.Screen name="reading/feedback"        options={{ title: 'Feedback', headerBackVisible: false }} />
        <Stack.Screen name="settings/language"       options={{ title: 'Sprache' }} />
        <Stack.Screen name="settings/persona"        options={{ title: 'Leserin wählen' }} />
        <Stack.Screen name="settings/privacy"        options={{ title: 'Datenschutz' }} />
        <Stack.Screen name="settings/subscription"   options={{ title: 'Abonnement' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
