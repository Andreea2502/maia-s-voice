import '@/lib/i18n'; // Initialize i18n
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { supabase } from '@/lib/supabase';
import { setAppLanguage } from '@/lib/i18n';
import { Session } from '@supabase/supabase-js';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        // Restore saved language
        const savedLang = await AsyncStorage.getItem('app_language');
        if (savedLang) {
          setAppLanguage(savedLang as any);
        }

        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        if (!savedLang) {
          // No language set yet — go to language select first
          router.replace('/(auth)/language-select');
        } else if (!session) {
          router.replace('/(auth)/login');
        } else {
          // Check if onboarding is complete
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
      } catch (e) {
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
      <StatusBar style="light" backgroundColor="#0D0A1E" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0D0A1E' },
          headerTintColor: '#F5E6D0',
          headerTitleStyle: { fontWeight: '700', fontSize: 16 },
          contentStyle: { backgroundColor: '#0D0A1E' },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(auth)/language-select" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/onboarding-consent" options={{ title: 'Einwilligung', headerBackVisible: false }} />
        <Stack.Screen name="(auth)/terms" options={{ title: 'Nutzungsbedingungen' }} />
        <Stack.Screen name="(auth)/privacy" options={{ title: 'Datenschutz' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="reading/onboarding" options={{ title: 'Vorgespräch', headerBackVisible: false }} />
        <Stack.Screen name="reading/choose-spread" options={{ title: 'Lege-Art' }} />
        <Stack.Screen name="reading/question" options={{ title: 'Deine Frage' }} />
        <Stack.Screen name="reading/draw-cards" options={{ title: 'Karten ziehen' }} />
        <Stack.Screen name="reading/interpretation" options={{ title: 'Deutung', headerBackVisible: false }} />
        <Stack.Screen name="reading/feedback" options={{ title: 'Feedback', headerBackVisible: false }} />
        <Stack.Screen name="settings/language" options={{ title: 'Sprache' }} />
        <Stack.Screen name="settings/persona" options={{ title: 'Leserin wählen' }} />
        <Stack.Screen name="settings/privacy" options={{ title: 'Datenschutz' }} />
        <Stack.Screen name="settings/subscription" options={{ title: 'Abonnement' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
