import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Datenschutzerklärung{'\n'}Privacy Policy</Text>
        <Text style={styles.version}>Version 1.0 — April 2026 | DSGVO / GDPR konform</Text>

        <Section title="1. Verantwortliche Stelle / Data Controller">
          <Text style={styles.body}>
            DE: Verantwortlich für die Datenverarbeitung ist der Betreiber von Maia's Voice.{'\n'}
            Kontakt: support@maiasvoice.app{'\n\n'}
            EN: The data controller is the operator of Maia's Voice.{'\n'}
            Contact: support@maiasvoice.app
          </Text>
        </Section>

        <Section title="2. Welche Daten wir erheben / Data We Collect">
          <Text style={styles.body}>
            <Text style={styles.bold}>DE:{'\n'}</Text>
            • E-Mail-Adresse (für Anmeldung){'\n'}
            • Sprachaufnahmen (nur während aktiver Sitzung, mit deiner Einwilligung){'\n'}
            • Gesprächsverläufe (wenn Gedächtnis aktiviert, mit deiner Einwilligung){'\n'}
            • App-Sprache und Einstellungen{'\n'}
            • Anonyme Nutzungsstatistiken (keine personenbezogenen Daten)
          </Text>
          <Text style={styles.body}>
            <Text style={styles.bold}>EN:{'\n'}</Text>
            • Email address (for account creation){'\n'}
            • Voice recordings (only during active sessions, with your consent){'\n'}
            • Conversation history (if memory is enabled, with your consent){'\n'}
            • App language and settings{'\n'}
            • Anonymous usage statistics (no personal data)
          </Text>
        </Section>

        <Section title="3. Zweck der Verarbeitung / Purpose of Processing">
          <Text style={styles.body}>
            DE: Deine Daten werden ausschließlich für die Bereitstellung des App-Dienstes verwendet — insbesondere für KI-Antworten, personalisierten Service und die Verbesserung der App.{'\n\n'}
            EN: Your data is used solely to provide the app service — in particular for AI responses, personalised service, and app improvement.
          </Text>
        </Section>

        <Section title="4. Aufbewahrungsdauer / Retention Period">
          <Text style={styles.body}>
            DE: Sprachaufnahmen werden nach jeder Sitzung gelöscht. Gesprächsverläufe werden so lange gespeichert, wie du es in den Einstellungen festgelegt hast (3, 6 oder 12 Monate). Accountdaten werden nach Kontolöschung innerhalb von 30 Tagen gelöscht.{'\n\n'}
            EN: Voice recordings are deleted after each session. Conversation history is stored for as long as you set in settings (3, 6 or 12 months). Account data is deleted within 30 days of account deletion.
          </Text>
        </Section>

        <Section title="5. Weitergabe an Dritte / Third Party Sharing">
          <Text style={styles.body}>
            DE: Wir geben deine Daten nicht an Dritte zu Werbezwecken weiter. Für die App-Funktionen nutzen wir:{'\n'}
            • Supabase (Datenbankdienste, EU-Server){'\n'}
            • Google Gemini (KI-Verarbeitung){'\n'}
            • ElevenLabs (Sprachsynthese){'\n\n'}
            EN: We do not share your data with third parties for advertising. For app functionality we use:{'\n'}
            • Supabase (database services, EU servers){'\n'}
            • Google Gemini (AI processing){'\n'}
            • ElevenLabs (voice synthesis)
          </Text>
        </Section>

        <Section title="6. Deine Rechte / Your Rights (DSGVO / GDPR)">
          <Text style={styles.body}>
            DE: Du hast das Recht auf:{'\n'}
            • Auskunft über deine gespeicherten Daten{'\n'}
            • Berichtigung unrichtiger Daten{'\n'}
            • Löschung deiner Daten ("Recht auf Vergessenwerden"){'\n'}
            • Einschränkung der Verarbeitung{'\n'}
            • Datenübertragbarkeit{'\n'}
            • Widerspruch gegen die Verarbeitung{'\n\n'}
            EN: You have the right to:{'\n'}
            • Access your stored data{'\n'}
            • Correct inaccurate data{'\n'}
            • Deletion of your data ("right to be forgotten"){'\n'}
            • Restriction of processing{'\n'}
            • Data portability{'\n'}
            • Object to processing
          </Text>
          <Text style={styles.body}>
            DE: Zur Ausübung deiner Rechte wende dich an: support@maiasvoice.app{'\n'}
            EN: To exercise your rights, contact: support@maiasvoice.app
          </Text>
        </Section>

        <Section title="7. Cookies & lokale Daten / Cookies & Local Storage">
          <Text style={styles.body}>
            DE: Wir verwenden minimale lokale Speicherung (Sprach-Einstellung, Sitzungs-Token). Keine Tracking-Cookies, keine Werbecookies.{'\n\n'}
            EN: We use minimal local storage (language setting, session token). No tracking cookies, no advertising cookies.
          </Text>
        </Section>

        <Section title="8. Sicherheit / Security">
          <Text style={styles.body}>
            DE: Deine Daten werden verschlüsselt übertragen (HTTPS/TLS) und sicher gespeichert. Sitzungstokens werden auf deinem Gerät gesichert gespeichert.{'\n\n'}
            EN: Your data is transmitted encrypted (HTTPS/TLS) and stored securely. Session tokens are stored securely on your device.
          </Text>
        </Section>

        <Section title="9. Beschwerderecht / Right to Lodge a Complaint">
          <Text style={styles.body}>
            DE: Du hast das Recht, eine Beschwerde bei der zuständigen Datenschutzbehörde einzureichen (in Österreich: Datenschutzbehörde, dsb.gv.at).{'\n\n'}
            EN: You have the right to lodge a complaint with the relevant data protection authority (in Austria: Datenschutzbehörde, dsb.gv.at).
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
