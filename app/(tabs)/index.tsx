import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { isGuestMode } from '@/lib/guest';
import { C } from '@/lib/colors';

const DEMO_CARD = { name: 'Der Stern', symbol: '⭐', keywords: 'Hoffnung · Erneuerung · Heilung' };

export default function HomeScreen() {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [guest, setGuest] = useState(false);

  useEffect(() => {
    async function load() {
      const guestMode = await isGuestMode();
      setGuest(guestMode);
      if (guestMode) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/(auth)/login'); return; }

      const { data: profile } = await supabase
        .from('user_profiles').select('display_name').eq('id', user.id).single();
      setDisplayName(profile?.display_name ?? null);
    }
    load();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Guest banner */}
      {guest && (
        <TouchableOpacity style={styles.guestBanner} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.guestBannerText}>
            🔍 Testmodus · <Text style={styles.guestBannerLink}>Jetzt Konto erstellen →</Text>
          </Text>
        </TouchableOpacity>
      )}

      {/* Greeting */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {greeting}{displayName ? `, ${displayName}` : ''}
        </Text>
        <Text style={styles.sub}>Was möchtest du heute erkunden?</Text>
      </View>

      {/* Start reading CTA */}
      <TouchableOpacity
        style={styles.ctaCard}
        onPress={() => router.push('/reading/onboarding')}
        activeOpacity={0.85}
      >
        <Text style={styles.ctaIcon}>✦</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.ctaTitle}>Neue Legung</Text>
          <Text style={styles.ctaSub}>Lass Maia für dich legen</Text>
        </View>
        <Text style={styles.ctaArrow}>→</Text>
      </TouchableOpacity>

      {/* Karte des Tages */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>KARTE DES TAGES</Text>
        <View style={styles.dailyCard}>
          <Text style={styles.dailySymbol}>{DEMO_CARD.symbol}</Text>
          <Text style={styles.dailyName}>{DEMO_CARD.name}</Text>
          <Text style={styles.dailyKeywords}>{DEMO_CARD.keywords}</Text>
          <TouchableOpacity style={styles.dailyBtn}>
            <Text style={styles.dailyBtnText}>Mehr erfahren  →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SCHNELLZUGRIFF</Text>
        <View style={styles.quickGrid}>
          {[
            { icon: '☕', label: 'Kaffeesatz' },
            { icon: '📅', label: 'Wochenlegung' },
            { icon: '❤️', label: 'Liebe' },
            { icon: '💼', label: 'Karriere' },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={styles.quickBtn}>
              <Text style={styles.quickIcon}>{item.icon}</Text>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content:   { padding: 20, gap: 24, paddingBottom: 60 },

  guestBanner: {
    backgroundColor: C.surface,
    borderRadius: 12, borderWidth: 1.5, borderColor: C.border,
    padding: 12, alignItems: 'center',
  },
  guestBannerText: { color: C.textMuted, fontSize: 13 },
  guestBannerLink: { color: C.gold, fontWeight: '700' },

  header:   { gap: 4 },
  greeting: { fontSize: 24, fontWeight: '800', color: C.white },
  sub:      { fontSize: 14, color: C.textSec },

  ctaCard: {
    backgroundColor: C.surfaceUp,
    borderRadius: 20, padding: 22,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1.5, borderColor: C.gold + '66',
  },
  ctaIcon:  { fontSize: 28, color: C.gold },
  ctaTitle: { fontSize: 18, fontWeight: '800', color: C.white },
  ctaSub:   { fontSize: 13, color: C.textSec, marginTop: 2 },
  ctaArrow: { fontSize: 22, color: C.gold },

  section:      { gap: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1.8 },

  dailyCard: {
    backgroundColor: C.surface, borderRadius: 18,
    padding: 24, alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: C.border,
  },
  dailySymbol:   { fontSize: 36 },
  dailyName:     { fontSize: 20, fontWeight: '800', color: C.white },
  dailyKeywords: { fontSize: 13, color: C.textSec },
  dailyBtn:      { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: C.gold },
  dailyBtnText:  { color: C.gold, fontSize: 13, fontWeight: '700' },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickBtn:  {
    width: '47%', backgroundColor: C.surface,
    borderRadius: 16, padding: 18,
    alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: C.border,
  },
  quickIcon:  { fontSize: 28 },
  quickLabel: { fontSize: 13, fontWeight: '700', color: C.textSec },
});
