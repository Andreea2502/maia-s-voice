import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { C } from '@/lib/colors';
import { useSupabase } from '@/hooks/useSupabase';

type ReadingType = 'natal_chart' | 'transit' | 'synastry';

export default function BirthDataScreen() {
  const { type } = useLocalSearchParams<{ type: ReadingType }>();
  const supabase = useSupabase();

  const [birthDate, setBirthDate]         = useState('');
  const [birthTime, setBirthTime]         = useState('');
  const [timeUnknown, setTimeUnknown]     = useState(false);
  const [city, setCity]                   = useState('');
  const [country, setCountry]             = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  // Minimal geocoding via open-meteo (no API key needed)
  async function geocodeCity(cityName: string, countryCode: string) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=de&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.results?.length) throw new Error('Stadt nicht gefunden');
    const r = data.results[0];
    return { lat: r.latitude, lng: r.longitude, timezone: r.timezone };
  }

  async function handleSubmit() {
    if (!birthDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setError('Geburtsdatum im Format JJJJ-MM-TT eingeben');
      return;
    }
    if (!timeUnknown && birthTime && !birthTime.match(/^\d{2}:\d{2}$/)) {
      setError('Uhrzeit im Format HH:MM eingeben');
      return;
    }
    if (!city.trim()) {
      setError('Geburtsort eingeben');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const geo = await geocodeCity(city.trim(), country.trim());

      // Save birth data
      await supabase.from('birth_data').upsert({
        birth_date: birthDate,
        birth_time: timeUnknown ? null : (birthTime || null),
        birth_time_known: !timeUnknown,
        birth_city: city.trim(),
        birth_country: country.trim(),
        birth_lat: geo.lat,
        birth_lng: geo.lng,
        birth_timezone: geo.timezone,
      });

      router.push({
        pathname: '/astrology/questionnaire',
        params: {
          type,
          birthDate,
          birthTime: timeUnknown ? '' : birthTime,
          birthLat: String(geo.lat),
          birthLng: String(geo.lng),
          birthTimezone: geo.timezone,
          birthCity: city.trim(),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden');
      setLoading(false);
    }
  }

  const readingLabels: Record<string, string> = {
    natal_chart: 'Geburtshoroskop',
    transit: 'Aktuelle Transite',
    synastry: 'Partnerhoroskop',
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Für: {readingLabels[type ?? 'natal_chart']}</Text>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Geburtsdatum</Text>
        <TextInput
          style={styles.input}
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder="JJJJ-MM-TT (z.B. 1990-03-15)"
          placeholderTextColor={C.textMuted}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Geburtszeit (optional)</Text>
        <TextInput
          style={[styles.input, timeUnknown && styles.inputDisabled]}
          value={birthTime}
          onChangeText={setBirthTime}
          placeholder="HH:MM (z.B. 14:30)"
          placeholderTextColor={C.textMuted}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          editable={!timeUnknown}
        />
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => { setTimeUnknown(!timeUnknown); setBirthTime(''); }}
        >
          <View style={[styles.checkboxBox, timeUnknown && styles.checkboxChecked]}>
            {timeUnknown && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Geburtszeit unbekannt</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Geburtsort</Text>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder="Stadt (z.B. Wien)"
          placeholderTextColor={C.textMuted}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Land (optional)</Text>
        <TextInput
          style={styles.input}
          value={country}
          onChangeText={setCountry}
          placeholder="Land (z.B. Österreich)"
          placeholderTextColor={C.textMuted}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnOff]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator color={C.bg} />
          : <Text style={styles.btnText}>Horoskop erstellen ✧</Text>
        }
      </TouchableOpacity>

      <Text style={styles.note}>
        Deine Geburtsdaten werden sicher gespeichert und nur für deine persönliche Deutung verwendet.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:   { flex: 1, backgroundColor: C.bg },
  content:  { padding: 24, gap: 20, paddingBottom: 48 },

  label: { fontSize: 13, color: C.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },

  field:      { gap: 8 },
  fieldLabel: { fontSize: 13, color: C.textSec, fontWeight: '600' },
  input: {
    backgroundColor: C.surface, borderRadius: 12, borderWidth: 1.5,
    borderColor: C.border, color: C.white, fontSize: 15,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  inputDisabled: { opacity: 0.4 },

  checkbox:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  checkboxBox:     { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: C.gold, borderColor: C.gold },
  checkmark:       { color: C.bg, fontSize: 12, fontWeight: '800' },
  checkboxLabel:   { fontSize: 13, color: C.textSec },

  error: { color: C.error, fontSize: 13 },

  btn:     { backgroundColor: C.gold, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnOff:  { opacity: 0.5 },
  btnText: { color: C.bg, fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },

  note: { fontSize: 12, color: C.textMuted, textAlign: 'center', lineHeight: 18 },
});
