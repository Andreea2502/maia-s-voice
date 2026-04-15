import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from '@/lib/colors';
import { CosmicBackground } from '@/components/ui/CosmicBackground';

type Mode = 'voice' | 'text';

export default function ModeSelectScreen() {
  const [selected, setSelected] = useState<Mode | null>(null);

  async function handleContinue() {
    if (!selected) return;
    await AsyncStorage.setItem('input_mode', selected);
    router.replace('/onboarding');
  }

  return (
    <CosmicBackground starCount={40} style={styles.safe}>
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>

        <View style={styles.header}>
          <Text style={styles.appName}>✦ MYSTIC</Text>
          <Text style={styles.title}>Wie möchtest du sprechen?</Text>
          <Text style={styles.sub}>
            Du kannst das jederzeit in den Einstellungen ändern.
          </Text>
        </View>

        <View style={styles.cards}>
          <ModeCard
            mode="voice"
            icon="🎙"
            title="Gespräch"
            desc="Sprich direkt mit der Überstimme. Natürlich, warm, persönlich — wie ein echtes Gespräch."
            tag="Empfohlen"
            tagColor={C.gold}
            selected={selected === 'voice'}
            onPress={() => setSelected('voice')}
          />
          <ModeCard
            mode="text"
            icon="✍️"
            title="Tippen"
            desc="Schreibe deine Antworten. Kein Mikrofon nötig. Gleiche Tiefe, gleicher Preis."
            selected={selected === 'text'}
            onPress={() => setSelected('text')}
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.btn, !selected && styles.btnOff]}
            onPress={handleContinue}
            disabled={!selected}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Weiter →</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            Beide Modi führen dasselbe einfühlsame Gespräch.{'\n'}
            Der gleiche Preis gilt für beide.
          </Text>
        </View>

      </View>
    </SafeAreaView>
    </CosmicBackground>
  );
}

function ModeCard({
  icon, title, desc, tag, tagColor, selected, onPress,
}: {
  mode: Mode;
  icon: string;
  title: string;
  desc: string;
  tag?: string;
  tagColor?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {tag && (
        <View style={[styles.tag, { backgroundColor: (tagColor ?? C.gold) + '22', borderColor: tagColor ?? C.gold }]}>
          <Text style={[styles.tagText, { color: tagColor ?? C.gold }]}>{tag}</Text>
        </View>
      )}

      <Text style={styles.cardIcon}>{icon}</Text>
      <Text style={[styles.cardTitle, selected && { color: C.gold }]}>{title}</Text>
      <Text style={styles.cardDesc}>{desc}</Text>

      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1 },
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },

  header: { gap: 8, paddingTop: 16 },
  appName: { fontSize: 11, fontWeight: '800', color: C.gold, letterSpacing: 4 },
  title:   { fontSize: 26, fontWeight: '800', color: C.white },
  sub:     { fontSize: 14, color: C.textSec },

  cards: { gap: 14 },

  card: {
    backgroundColor: '#FFFFFF08',
    borderRadius: 20, borderWidth: 1.5, borderColor: '#FFFFFF14',
    padding: 24, gap: 10, position: 'relative',
  },
  cardSelected: {
    borderColor: C.gold,
    backgroundColor: C.gold + '12',
  },
  tag: {
    alignSelf: 'flex-start',
    borderRadius: 8, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  tagText:   { fontSize: 11, fontWeight: '700' },
  cardIcon:  { fontSize: 36 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: C.white },
  cardDesc:  { fontSize: 14, color: C.textSec, lineHeight: 21 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
    position: 'absolute', top: 20, right: 20,
  },
  radioSelected: { borderColor: C.gold },
  radioDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: C.gold,
  },

  footer: { gap: 14 },
  btn: {
    backgroundColor: C.gold,
    borderRadius: 14, paddingVertical: 18,
    alignItems: 'center',
  },
  btnOff:  { opacity: 0.3 },
  btnText: { color: C.bg, fontSize: 16, fontWeight: '800' },
  hint:    { color: C.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
