import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useSupabase } from '@/hooks/useSupabase';
import { C } from '@/lib/colors';
import { Reading, ModuleReadingType } from '@/types/reading';
import { MODULE_COLORS } from '@/lib/colors';

const MODULE_LABEL: Record<ModuleReadingType, string> = {
  tarot:      'Tarot',
  astrology:  'Astrologie',
  numerology: 'Numerologie',
  coffee:     'Kaffeesatz',
  palm:       'Palmreading',
};

const MODULE_ICON: Record<ModuleReadingType, string> = {
  tarot:      '✦',
  astrology:  '✧',
  numerology: '∞',
  coffee:     '☽',
  palm:       '✿',
};

export default function ReadingsScreen() {
  const supabase = useSupabase();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ModuleReadingType | 'all'>('all');

  useEffect(() => {
    loadReadings();
  }, []);

  async function loadReadings() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('readings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setReadings(data ?? []);
    setLoading(false);
  }

  const filtered = filter === 'all'
    ? readings
    : readings.filter((r) => r.module === filter);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meine Readings</Text>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'tarot', 'astrology'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Alle' : MODULE_LABEL[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 && !loading ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>✦</Text>
          <Text style={styles.emptyText}>Noch keine Readings</Text>
          <Text style={styles.emptyHint}>Wähle ein Modul auf der Startseite</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: r }) => {
            const modColor = MODULE_COLORS[r.module]?.primary ?? C.gold;
            return (
              <View style={[styles.card, { borderColor: modColor + '44' }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.modBadge, { backgroundColor: modColor + '22' }]}>
                    <Text style={[styles.modIcon, { color: modColor }]}>
                      {MODULE_ICON[r.module]}
                    </Text>
                    <Text style={[styles.modLabel, { color: modColor }]}>
                      {MODULE_LABEL[r.module]}
                    </Text>
                  </View>
                  <Text style={styles.date}>
                    {new Date(r.createdAt).toLocaleDateString('de-DE', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </Text>
                </View>

                {r.spreadType && (
                  <Text style={styles.spreadType}>{r.spreadType}</Text>
                )}
                {r.question && (
                  <Text style={styles.question}>„{r.question}"</Text>
                )}
                {r.emotionalTone && (
                  <Text style={[styles.tone, { color: modColor }]}>{r.emotionalTone}</Text>
                )}
                {r.userRating ? (
                  <Text style={styles.rating}>{'★'.repeat(r.userRating)}</Text>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, paddingTop: 16 },

  title: {
    fontSize: 22, fontWeight: '800', color: C.white,
    paddingHorizontal: 20, marginBottom: 14,
  },

  filterRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 20, marginBottom: 16,
  },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: C.border,
  },
  filterBtnActive: { borderColor: C.gold, backgroundColor: C.gold + '22' },
  filterText:      { color: C.textMuted, fontSize: 13, fontWeight: '600' },
  filterTextActive:{ color: C.gold },

  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  emptyIcon: { fontSize: 40, color: C.textMuted, marginBottom: 4 },
  emptyText: { fontSize: 17, fontWeight: '700', color: C.textSec },
  emptyHint: { fontSize: 13, color: C.textMuted },

  list: { gap: 12, paddingHorizontal: 20, paddingBottom: 40 },

  card: {
    backgroundColor: C.surface,
    borderRadius: 16, padding: 16, gap: 6,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 4,
  },
  modBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  modIcon:  { fontSize: 14 },
  modLabel: { fontSize: 12, fontWeight: '700' },
  date:     { color: C.textMuted, fontSize: 12 },

  spreadType: { color: C.white, fontSize: 14, fontWeight: '700' },
  question:   { color: C.textSec, fontSize: 13, fontStyle: 'italic' },
  tone:       { fontSize: 12 },
  rating:     { color: C.gold, fontSize: 14 },
});
