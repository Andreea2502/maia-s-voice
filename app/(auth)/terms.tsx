import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { C } from '@/lib/colors';

export default function TermsScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Nutzungsbedingungen{'\n'}Terms of Service</Text>
        <Text style={s.version}>Version 1.0 — April 2026</Text>

        <Section title="1. Unterhaltung / Entertainment only">
          <Text style={s.body}>
            <Text style={s.bold}>DE: </Text>
            Maia's Voice ist eine KI-gestützte Unterhaltungs-App. Alle Inhalte — einschließlich Tarot-Deutungen und Gespräche — dienen ausschließlich der Unterhaltung und persönlichen Reflexion.{'\n\n'}
            Sie ersetzen KEINE medizinische, psychologische, rechtliche oder finanzielle Beratung.
          </Text>
          <Text style={s.body}>
            <Text style={s.bold}>EN: </Text>
            Maia's Voice is an AI-powered entertainment app. All content is for entertainment and personal reflection only.{'\n\n'}
            It is NOT a substitute for medical, psychological, legal or financial advice.
          </Text>
        </Section>

        <Section title="2. Mindestalter / Age Requirement">
          <Text style={s.body}>
            DE: Du musst mindestens 16 Jahre alt sein.{'\n'}
            EN: You must be at least 16 years old to use this app.
          </Text>
        </Section>

        <Section title="3. Verbotene Nutzung / Prohibited Use">
          <Text style={s.body}>
            DE: Keine Nutzung für illegale Zwecke, Belästigung oder schädliche Inhalte.{'\n\n'}
            EN: No use for illegal purposes, harassment, or spreading harmful content.
          </Text>
        </Section>

        <Section title="4. Abonnements & Abrechnung / Subscriptions">
          <Text style={s.body}>
            DE: Kostenpflichtige Abonnements verlängern sich automatisch. Kündigung mindestens 24 Stunden vor dem nächsten Abrechnungsdatum.{'\n\n'}
            EN: Paid subscriptions renew automatically. Cancellations must be made at least 24 hours before the next billing date.
          </Text>
        </Section>

        <Section title="5. Haftungsbeschränkung / Limitation of Liability">
          <Text style={s.body}>
            DE: Wir haften nicht für Schäden aus der Nutzung der App, insbesondere nicht für Entscheidungen auf Basis von KI-generierten Inhalten.{'\n\n'}
            EN: We are not liable for damages arising from use of the app, particularly not for decisions based on AI-generated content.
          </Text>
        </Section>

        <Section title="6. Kontakt / Contact">
          <Text style={s.body}>support@maiasvoice.app</Text>
        </Section>

        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>← Zurück / Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sec.wrap}>
      <Text style={sec.title}>{title}</Text>
      {children}
    </View>
  );
}

const sec = StyleSheet.create({
  wrap:  { gap: 8, backgroundColor: C.surface, borderRadius: 16, padding: 18, borderWidth: 1.5, borderColor: C.border },
  title: { fontSize: 15, fontWeight: '700', color: C.gold },
});

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, gap: 14, paddingBottom: 60 },
  title:   { fontSize: 22, fontWeight: '800', color: C.white, textAlign: 'center', lineHeight: 30 },
  version: { color: C.textMuted, fontSize: 12, textAlign: 'center' },
  body:    { fontSize: 14, color: C.textSec, lineHeight: 22 },
  bold:    { fontWeight: '700', color: C.white },
  backBtn: { backgroundColor: C.surface, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: C.border, marginTop: 8 },
  backBtnText: { color: C.gold, fontSize: 14, fontWeight: '600' },
});
