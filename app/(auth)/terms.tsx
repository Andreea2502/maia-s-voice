import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Nutzungsbedingungen{'\n'}Terms of Service</Text>
        <Text style={styles.version}>Version 1.0 — April 2026</Text>

        <Section title="1. Unterhaltung / Entertainment only">
          <Text style={styles.body}>
            <Text style={styles.bold}>DE: </Text>
            Maia's Voice ist eine KI-gestützte Unterhaltungs-App. Alle Inhalte — einschließlich Tarot-Deutungen, Gespräche und Empfehlungen — dienen ausschließlich der Unterhaltung und persönlichen Reflexion.{'\n\n'}
            Sie ersetzen KEINE medizinische, psychologische, rechtliche oder finanzielle Beratung. Bei ernsthaften Anliegen wende dich bitte an Fachkräfte.
          </Text>
          <Text style={styles.body}>
            <Text style={styles.bold}>EN: </Text>
            Maia's Voice is an AI-powered entertainment app. All content — including tarot readings, conversations and recommendations — is for entertainment and personal reflection only.{'\n\n'}
            It is NOT a substitute for medical, psychological, legal or financial advice. For serious concerns, please consult qualified professionals.
          </Text>
        </Section>

        <Section title="2. Mindestalter / Age Requirement">
          <Text style={styles.body}>
            DE: Du musst mindestens 16 Jahre alt sein, um diese App zu nutzen.{'\n'}
            EN: You must be at least 16 years old to use this app.
          </Text>
        </Section>

        <Section title="3. Verbotene Nutzung / Prohibited Use">
          <Text style={styles.body}>
            DE: Du darfst die App nicht für illegale Zwecke, Belästigung oder zur Verbreitung schädlicher Inhalte verwenden.{'\n\n'}
            EN: You may not use the app for illegal purposes, harassment, or spreading harmful content.
          </Text>
        </Section>

        <Section title="4. Verfügbarkeit / Availability">
          <Text style={styles.body}>
            DE: Wir bemühen uns um eine zuverlässige Verfügbarkeit, können aber keine unterbrechungsfreie Nutzung garantieren. Wartungen und Updates können kurzfristig angekündigt werden.{'\n\n'}
            EN: We strive for reliable availability but cannot guarantee uninterrupted service. Maintenance and updates may be announced on short notice.
          </Text>
        </Section>

        <Section title="5. Abonnements & Abrechnung / Subscriptions">
          <Text style={styles.body}>
            DE: Kostenpflichtige Abonnements werden monatlich oder jährlich verlängert. Kündigungen müssen mindestens 24 Stunden vor dem nächsten Abrechnungszeitpunkt erfolgen.{'\n\n'}
            EN: Paid subscriptions renew monthly or annually. Cancellations must be made at least 24 hours before the next billing date.
          </Text>
        </Section>

        <Section title="6. Haftungsbeschränkung / Limitation of Liability">
          <Text style={styles.body}>
            DE: Die App-Betreiber haften nicht für Schäden, die aus der Nutzung der App entstehen, insbesondere nicht für Entscheidungen, die auf Basis von KI-generierten Inhalten getroffen werden.{'\n\n'}
            EN: The app operators are not liable for damages arising from use of the app, in particular not for decisions made based on AI-generated content.
          </Text>
        </Section>

        <Section title="7. Änderungen / Changes">
          <Text style={styles.body}>
            DE: Wir behalten uns vor, diese Bedingungen zu aktualisieren. Änderungen werden in der App bekannt gegeben.{'\n\n'}
            EN: We reserve the right to update these terms. Changes will be announced in the app.
          </Text>
        </Section>

        <Section title="8. Kontakt / Contact">
          <Text style={styles.body}>
            DE: Fragen? Schreib uns an: support@maiasvoice.app{'\n'}
            EN: Questions? Contact us at: support@maiasvoice.app
          </Text>
        </Section>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Zurück / Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.container}>
      <Text style={sectionStyles.title}>{title}</Text>
      {children}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: { gap: 8, backgroundColor: '#1A1035', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#3A2A5A' },
  title: { fontSize: 15, fontWeight: '700', color: '#C9956A' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0A1E' },
  content: { padding: 20, gap: 16, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', lineHeight: 30 },
  version: { color: '#8070A0', fontSize: 12, textAlign: 'center' },
  body: { fontSize: 14, color: '#C0B0E0', lineHeight: 22 },
  bold: { fontWeight: '700', color: '#FFFFFF' },
  backBtn: { backgroundColor: '#1A1035', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#3A2A5A', marginTop: 8 },
  backBtnText: { color: '#C9956A', fontSize: 14, fontWeight: '600' },
});
