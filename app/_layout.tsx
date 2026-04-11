import '@/lib/i18n'; // Initialize i18n
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setReady(true);
      SplashScreen.hideAsync();
    });

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
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/onboarding-consent" options={{ title: 'Datenschutz', headerBackVisible: false }} />
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
