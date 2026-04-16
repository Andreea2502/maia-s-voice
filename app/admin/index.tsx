/**
 * Admin Panel — User Management & Statistics
 * Only accessible to users with is_admin = true
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useSupabase } from '@/hooks/useSupabase';
import { C } from '@/lib/colors';

// ─── Types ───────────────────────────────────────────────────
interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  subscription_tier: string;
  is_admin: boolean;
  credits_balance: number;
  credits_purchased: number;
  readings_this_month: number;
  total_readings: number;
  preferred_language: string;
  created_at: string;
}

interface Stats {
  total_users: number;
  total_readings: number;
  admins: number;
  by_tier: { free: number; basic: number; premium: number; unlimited: number };
}

// ─── Tier colors ─────────────────────────────────────────────
const TIER_COLOR: Record<string, string> = {
  free:      '#888',
  basic:     '#4FC3F7',
  premium:   '#FFD700',
  unlimited: '#FF6EC7',
};

const TIER_LABELS = ['free', 'basic', 'premium', 'unlimited'];

// ─── Stat card ────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <View style={s.statCard}>
      <Text style={[s.statValue, color ? { color } : {}]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ─── User edit modal ─────────────────────────────────────────
function UserEditModal({
  user,
  visible,
  onClose,
  onSave,
}: {
  user: AdminUser | null;
  visible: boolean;
  onClose: () => void;
  onSave: (tier: string, credits: number, isAdmin: boolean) => void;
}) {
  const [tier, setTier] = useState(user?.subscription_tier ?? 'free');
  const [creditAmt, setCreditAmt] = useState('10');
  const [isAdmin, setIsAdmin] = useState(user?.is_admin ?? false);

  useEffect(() => {
    if (user) {
      setTier(user.subscription_tier);
      setIsAdmin(user.is_admin);
      setCreditAmt('10');
    }
  }, [user]);

  if (!user) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalSheet}>
          {/* Handle */}
          <View style={s.modalHandle} />

          <Text style={s.modalTitle} numberOfLines={1}>{user.email}</Text>
          <Text style={s.modalSub}>
            {user.total_readings} Readings gesamt · {user.readings_this_month} diesen Monat
          </Text>
          <Text style={s.modalSub}>Credits: {user.credits_balance} verfügbar</Text>

          {/* Tier selector */}
          <Text style={s.modalSection}>ABO-STUFE</Text>
          <View style={s.tierRow}>
            {TIER_LABELS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[s.tierBtn, tier === t && { borderColor: TIER_COLOR[t], backgroundColor: TIER_COLOR[t] + '22' }]}
                onPress={() => setTier(t)}
                activeOpacity={0.75}
              >
                <Text style={[s.tierBtnText, tier === t && { color: TIER_COLOR[t] }]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Credits */}
          <Text style={s.modalSection}>CREDITS HINZUFÜGEN</Text>
          <View style={s.creditRow}>
            {['5', '10', '25', '50', '100'].map((amt) => (
              <TouchableOpacity
                key={amt}
                style={[s.creditBtn, creditAmt === amt && s.creditBtnActive]}
                onPress={() => setCreditAmt(amt)}
                activeOpacity={0.75}
              >
                <Text style={[s.creditBtnText, creditAmt === amt && s.creditBtnTextActive]}>+{amt}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.creditCustomRow}>
            <TextInput
              style={s.creditInput}
              value={creditAmt}
              onChangeText={(v) => setCreditAmt(v.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              placeholder="Betrag"
              placeholderTextColor={C.textMuted}
            />
            <Text style={s.creditInputLabel}>Credits</Text>
          </View>

          {/* Admin toggle */}
          <Text style={s.modalSection}>BERECHTIGUNGEN</Text>
          <TouchableOpacity
            style={[s.adminToggle, isAdmin && s.adminToggleOn]}
            onPress={() => setIsAdmin(!isAdmin)}
            activeOpacity={0.8}
          >
            <Text style={[s.adminToggleText, isAdmin && s.adminToggleTextOn]}>
              {isAdmin ? '🔧 Admin-Zugang aktiv' : '○ Kein Admin-Zugang'}
            </Text>
          </TouchableOpacity>

          {/* Actions */}
          <TouchableOpacity
            style={s.saveBtn}
            onPress={() => onSave(tier, parseInt(creditAmt || '0', 10), isAdmin)}
            activeOpacity={0.85}
          >
            <Text style={s.saveBtnText}>Änderungen speichern</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.cancelBtn} onPress={onClose} activeOpacity={0.75}>
            <Text style={s.cancelBtnText}>Abbrechen</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────
export default function AdminPanel() {
  const supabase = useSupabase();
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefresh]  = useState(false);
  const [users, setUsers]         = useState<AdminUser[]>([]);
  const [stats, setStats]         = useState<Stats | null>(null);
  const [search, setSearch]       = useState('');
  const [filterTier, setFilter]   = useState<string | null>(null);
  const [editUser, setEditUser]   = useState<AdminUser | null>(null);
  const [saving, setSaving]       = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefresh(true);
    else setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'list_users' },
      });
      if (error) throw error;
      setUsers(data.users ?? []);
      setStats(data.stats ?? null);
    } catch (err) {
      Alert.alert('Fehler', err instanceof Error ? err.message : 'Laden fehlgeschlagen');
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  async function handleSave(tier: string, credits: number, isAdmin: boolean) {
    if (!editUser) return;
    setSaving(true);
    try {
      // Update tier
      if (tier !== editUser.subscription_tier) {
        await supabase.functions.invoke('admin-users', {
          body: { action: 'update_tier', target_id: editUser.id, tier },
        });
      }
      // Add credits
      if (credits > 0) {
        await supabase.functions.invoke('admin-users', {
          body: { action: 'add_credits', target_id: editUser.id, amount: credits },
        });
      }
      // Admin toggle
      if (isAdmin !== editUser.is_admin) {
        await supabase.functions.invoke('admin-users', {
          body: { action: 'set_admin', target_id: editUser.id, is_admin: isAdmin },
        });
      }
      setEditUser(null);
      await load(true);
    } catch (err) {
      Alert.alert('Fehler', err instanceof Error ? err.message : 'Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  }

  // Filter users
  const filtered = users.filter((u) => {
    const matchSearch = !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.display_name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchTier = !filterTier || u.subscription_tier === filterTier;
    return matchSearch && matchTier;
  });

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={C.gold} size="large" />
        <Text style={s.loadingText}>Admin-Panel lädt…</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={C.gold}
          />
        }
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={s.backBtn}>← Zurück</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>🔧 Admin Panel</Text>
        </View>

        {/* Stats */}
        {stats && (
          <View style={s.statsGrid}>
            <StatCard label="User gesamt" value={stats.total_users} color={C.gold} />
            <StatCard label="Readings gesamt" value={stats.total_readings} />
            <StatCard label="Free" value={stats.by_tier.free} color={TIER_COLOR.free} />
            <StatCard label="Basic" value={stats.by_tier.basic} color={TIER_COLOR.basic} />
            <StatCard label="Premium" value={stats.by_tier.premium} color={TIER_COLOR.premium} />
            <StatCard label="Unlimited" value={stats.by_tier.unlimited} color={TIER_COLOR.unlimited} />
          </View>
        )}

        {/* Search */}
        <View style={s.searchWrap}>
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="E-Mail oder Name suchen…"
            placeholderTextColor={C.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} style={s.searchClear}>
              <Text style={s.searchClearText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Tier filter chips */}
        <View style={s.filterRow}>
          <TouchableOpacity
            style={[s.filterChip, !filterTier && s.filterChipActive]}
            onPress={() => setFilter(null)}
          >
            <Text style={[s.filterChipText, !filterTier && s.filterChipTextActive]}>Alle</Text>
          </TouchableOpacity>
          {TIER_LABELS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[s.filterChip, filterTier === t && { borderColor: TIER_COLOR[t], backgroundColor: TIER_COLOR[t] + '22' }]}
              onPress={() => setFilter(filterTier === t ? null : t)}
            >
              <Text style={[s.filterChipText, filterTier === t && { color: TIER_COLOR[t] }]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* User count */}
        <Text style={s.resultCount}>
          {filtered.length} {filtered.length === 1 ? 'User' : 'User'} angezeigt
        </Text>

        {/* User list */}
        {filtered.map((u) => (
          <TouchableOpacity
            key={u.id}
            style={s.userCard}
            onPress={() => setEditUser(u)}
            activeOpacity={0.8}
          >
            {/* Row 1: email + tier badge */}
            <View style={s.userCardTop}>
              <View style={{ flex: 1 }}>
                <Text style={s.userEmail} numberOfLines={1}>{u.email}</Text>
                {u.display_name ? (
                  <Text style={s.userDisplayName}>{u.display_name}</Text>
                ) : null}
              </View>
              <View style={[s.tierBadge, { backgroundColor: TIER_COLOR[u.subscription_tier] + '22', borderColor: TIER_COLOR[u.subscription_tier] + '77' }]}>
                <Text style={[s.tierBadgeText, { color: TIER_COLOR[u.subscription_tier] }]}>
                  {u.subscription_tier}
                </Text>
              </View>
            </View>
            {/* Row 2: stats */}
            <View style={s.userCardStats}>
              <Text style={s.userStat}>📖 {u.total_readings} Readings</Text>
              <Text style={s.userStat}>🗓 {u.readings_this_month} diesen Monat</Text>
              <Text style={s.userStat}>💳 {u.credits_balance} Credits</Text>
              {u.is_admin ? <Text style={s.adminBadge}>🔧 Admin</Text> : null}
            </View>
            {/* Joined */}
            <Text style={s.userJoined}>
              Registriert: {new Date(u.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
              {u.preferred_language ? ` · ${u.preferred_language.toUpperCase()}` : ''}
            </Text>
          </TouchableOpacity>
        ))}

        {filtered.length === 0 && (
          <View style={s.emptyWrap}>
            <Text style={s.emptyText}>Keine User gefunden</Text>
          </View>
        )}
      </ScrollView>

      {/* Edit modal */}
      <UserEditModal
        user={editUser}
        visible={!!editUser}
        onClose={() => setEditUser(null)}
        onSave={handleSave}
      />

      {/* Saving overlay */}
      {saving && (
        <View style={s.savingOverlay}>
          <ActivityIndicator color={C.gold} />
          <Text style={s.savingText}>Speichert…</Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  center:  { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  content: { padding: 16, gap: 12, paddingBottom: 60 },
  loadingText: { color: C.textSec, fontSize: 14 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 4 },
  backBtn: { color: C.textMuted, fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.white },

  // Stats grid — 3 columns
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  statCard: {
    flex: 1, minWidth: '30%',
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    paddingVertical: 12, paddingHorizontal: 10,
    alignItems: 'center', gap: 3,
  },
  statValue: { fontSize: 22, fontWeight: '900', color: C.white },
  statLabel: { fontSize: 10, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8 },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1, color: C.white, fontSize: 15,
    paddingVertical: 12,
  },
  searchClear: { padding: 4 },
  searchClearText: { color: C.textMuted, fontSize: 16 },

  // Tier filter
  filterRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.surface,
  },
  filterChipActive:      { borderColor: C.gold, backgroundColor: C.gold + '22' },
  filterChipText:        { fontSize: 12, fontWeight: '700', color: C.textMuted },
  filterChipTextActive:  { color: C.gold },

  resultCount: { fontSize: 12, color: C.textMuted, marginLeft: 2 },

  // User card
  userCard: {
    backgroundColor: C.surface, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    padding: 14, gap: 6,
  },
  userCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  userEmail:       { fontSize: 14, fontWeight: '700', color: C.white },
  userDisplayName: { fontSize: 12, color: C.textSec, marginTop: 1 },
  tierBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start',
  },
  tierBadgeText: { fontSize: 11, fontWeight: '800' },
  userCardStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  userStat:    { fontSize: 12, color: C.textSec },
  adminBadge:  { fontSize: 12, color: '#FF6EC7', fontWeight: '700' },
  userJoined:  { fontSize: 11, color: C.textMuted, marginTop: 2 },

  emptyWrap: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: C.textMuted, fontSize: 15 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0F1628',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, gap: 10,
    borderTopWidth: 1, borderColor: C.border,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.border, alignSelf: 'center', marginBottom: 4,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: C.white },
  modalSub:   { fontSize: 13, color: C.textSec },
  modalSection: {
    fontSize: 10, fontWeight: '800', color: C.textMuted,
    letterSpacing: 1.5, marginTop: 6,
  },

  tierRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tierBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.surface,
  },
  tierBtnText: { fontSize: 13, fontWeight: '700', color: C.textMuted },

  creditRow: { flexDirection: 'row', gap: 8 },
  creditBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.surface, alignItems: 'center',
  },
  creditBtnActive:    { borderColor: C.gold, backgroundColor: C.gold + '22' },
  creditBtnText:      { fontSize: 13, fontWeight: '700', color: C.textMuted },
  creditBtnTextActive:{ color: C.gold },
  creditCustomRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.surface, borderRadius: 10, borderWidth: 1.5,
    borderColor: C.border, paddingHorizontal: 14, paddingVertical: 4,
  },
  creditInput: { flex: 1, color: C.white, fontSize: 15, paddingVertical: 8 },
  creditInputLabel: { color: C.textMuted, fontSize: 14 },

  adminToggle: {
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface,
    alignItems: 'center',
  },
  adminToggleOn:     { borderColor: '#FF6EC7', backgroundColor: '#FF6EC722' },
  adminToggleText:   { fontSize: 14, color: C.textMuted, fontWeight: '700' },
  adminToggleTextOn: { color: '#FF6EC7' },

  saveBtn: {
    backgroundColor: C.gold, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 4,
  },
  saveBtnText: { color: '#060E1E', fontSize: 16, fontWeight: '800' },

  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelBtnText: { color: C.textMuted, fontSize: 14 },

  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  savingText: { color: C.white, fontSize: 15, fontWeight: '700' },
});
