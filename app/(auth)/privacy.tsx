import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { C } from '@/lib/colors';

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Datenschutzerklärung{'\n'}Privacy Policy</Text>
        <Text style={s.version}>Version 1.0 — April 2026 | DSGVO / GDPR</Text>

        <Section title="1. Verantwortliche / Data Controller">
          <Text style={s.body}>
            Betreiber von Maia's Voice{'\n'}support@maiasvoice.app
          </Text>
        </Section>

        <Section title="2. Erhobene Daten / Data Collected">
          <Text style={s.body}>
            <Text style={s.bold}>DE: </Text>
            • E-Mail-Adresse{'\n'}
            • Sprachaufnahmen (Sitzung, mit Einwilligung){'\n'}
            • Gesprächsverläufe (opt-in, mit Einwilligung){'\n'}
            • App-Sprache und Einstellungen{'\n'}
            • Anonyme Nutzungsstatistiken
          </Text>
          <Text style={s.body}>
            <Text style={s.bold}>EN: </Text>
            • Email address{'\n'}
            • Voice recordings (session only, with consent){'\n'}
            • Conversation history (opt-in, with consent){'\n'}
            • App language and settings{'\n'}
            • Anonymous usage statistics
          </Text>
        </Section>

        <Section title="3. Aufbewahrung / Retention">
          <Text style={s.body}>
            DE: Sprachaufnahmen → nach Sitzungsende gelöscht. Gesprächsverläufe → 3/6/12 Monate (deine Wahl). Accountdaten → nach Löschung innerhalb 30 Tagen entfernt.{'\n\n'}
            EN: Voice recordings → deleted after session. Conversation history → 3/6/12 months (your choice). Account data → removed within 30 days of deletion.
          </Text>
        </Section>

        <Section title="4. Drittanbieter / Third Parties">
          <Text style={s.body}>
            DE: Keine Weitergabe zu Werbezwecken. Dienste:{'\n'}
            • Supabase (Datenbank, EU){'\n'}
            • Google Gemini (KI){'\n'}
            • ElevenLabs (Sprache){'\n\n'}
            EN: No sharing for advertising. Services used:{'\n'}
            • Supabase (database, EU){'\n'}
            • Google Gemini (AI){'\n'}
            • ElevenLabs (voice)
          </Text>
        </Section>

        <Section title="5. Deine Rechte / Your Rights (DSGVO/GDPR)">
          <Text style={s.body}>
            DE: Auskunft · Berichtigung · Löschung · Einschränkung · Datenübertragbarkeit · Widerspruch{'\n\n'}
            EN: Access · Correction · Deletion · Restriction · Portability · Objection{'\n\n'}
            Kontakt / Contact: support@maiasvoice.app
          </Text>
        </Section>

        <Section title="6. Sicherheit / Security">
          <Text style={s.body}>
            DE: Verschlüsselte Übertragung (HTTPS/TLS). Keine Tracking-Cookies.{'\n\n'}
            EN: Encrypted transmission (HTTPS/TLS). No tracking cookies.
          </Text>
        </Section>

        <Section title="7. Beschwerderecht / Complaints">
          <Text style={s.body}>
            DE: Österreich: Datenschutzbehörde (dsb.gv.at){'\n'}
            EN: Austria: Datenschutzbehörde (dsb.gv.at)
          </Text>
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
