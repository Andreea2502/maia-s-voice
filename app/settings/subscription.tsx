/**
 * Subscription Screen – mit Stripe Checkout (kein RevenueCat)
 * Öffnet Stripe Checkout-URL im Browser/WebView
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Linking, Alert } from 'react-native';
import { useLanguage } from '@/hooks/useLanguage';
import { useSupabase } from '@/hooks/useSupabase';
import { TIERS } from '@/lib/subscription-tiers';
import { SubscriptionTier } from '@/types/user';

const TIER_ORDER: SubscriptionTier[] = ['basic', 'premium', 'unlimited'];
const PRODUCT_IDS: Record<SubscriptionTier, string> = {
  free:      '',
  basic:     'monthly_basic',
  premium:   'monthly_premium',
  unlimited: 'monthly_unlimited',
};

export default function SubscriptionScreen() {
  const { t } = useLanguage();
  const supabase = useSupabase();
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState<SubscriptionTier | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('user_profiles').select('subscription_tier').eq('id', user.id).single()
        .then(({ data }) => { if (data) setCurrentTier(data.subscription_tier as SubscriptionTier); });
    });
  }, []);

  async function handleUpgrade(tier: SubscriptionTier) {
    const productId = PRODUCT_IDS[tier];
    if (!productId) return;

    setLoading(tier);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { product_id: productId },
      });

      if (error) throw new Error(error.message);

      if (data?.checkout_url) {
        // Öffnet Stripe Checkout im Browser
        await Linking.openURL(data.checkout_url);
      }
    } catch (err: any) {
      Alert.alert('Fehler', err.message ?? 'Zahlung konnte nicht gestartet werden.');
    } finally {
      setLoading(null);
    }
  }

  async function handleSingleReading() {
    setLoading('free'); // Missbrauche 'free' als Loading-Indikator für Single
    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { product_id: 'single_reading' },
      });
      if (error) throw new Error(error.message);
      if (data?.checkout_url) await Linking.openURL(data.checkout_url);
    } catch (err: any) {
      Alert.alert('Fehler', err.message);
    } finally {
      setLoading(null);
    }
  }

  const tierLabels: Record<SubscriptionTier, string> = {
    free: t('settings.free_plan'),
    basic: t('settings.basic_plan'),
    premium: t('settings.premium_plan'),
    unlimited: t('settings.unlimited_plan'),
  };

  const tierDescriptions: Record<SubscriptionTier, string> = {
    free: '2 Legungen/Monat · Elena',
    basic: '10 Legungen/Monat · Elena & Amira · Fotos',
    premium: '30 Legungen · Alle Leserinnen · Vorlesen · Fotos',
    unlimited: 'Unbegrenzt · Alles inklusive',
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('settings.subscription_title')}</Text>

      {/* Aktueller Plan */}
      <View style={styles.currentPlan}>
        <Text style={styles.currentPlanLabel}>Dein Plan</Text>
        <Text style={styles.currentPlanName}>{tierLabels[currentTier]}</Text>
      </View>

      {/* Abo-Optionen */}
      {TIER_ORDER.map((tier) => {
        const config = TIERS[tier];
        const price = (config as any).priceMonthlyEur;
        const isCurrent = tier === currentTier;
        const isLoading = loading === tier;
        const isPro = tier === 'premium';

        return (
          <View key={tier} style={[styles.card, isPro && styles.cardPro, isCurrent && styles.cardCurrent]}>
            {isPro && <View style={styles.badge}><Text style={styles.badgeText}>Beliebt</Text></View>}

            <View style={styles.cardHeader}>
              <View>
                <Text style={[styles.tierName, isPro && styles.tierNamePro]}>{tierLabels[tier]}</Text>
                <Text style={styles.tierDesc}>{tierDescriptions[tier]}</Text>
              </View>
              <Text style={styles.price}>{price}€<Text style={styles.priceMonth}>/Mo</Text></Text>
            </View>

            <View style={styles.featureList}>
              <Feature text={`${config.readingsPerMonth === -1 ? '∞' : config.readingsPerMonth} Legungen / Monat`} />
              {config.voiceOnboarding && <Feature text="Sprach-Vorgespräch mit Leserin" />}
              {config.voiceInterpretation && <Feature text="Deutung wird vorgelesen (Gemini TTS)" />}
              {config.photoUpload && <Feature text="Echte Karten fotografieren" />}
              {config.sessionMemory && <Feature text="Erinnerungen über Sessions hinweg" />}
              <Feature text={config.personas === 'all' ? 'Alle 3 Leserinnen' : `${(config.personas as string[]).length} Leserin${(config.personas as string[]).length > 1 ? 'nen' : ''}`} />
            </View>

            {!isCurrent ? (
              <TouchableOpacity
                style={[styles.buyBtn, isPro && styles.buyBtnPro]}
                onPress={() => handleUpgrade(tier)}
                disabled={isLoading}
              >
                {isLoading
                  ? <ActivityIndicator color={isPro ? '#1a0a2e' : '#C9956A'} />
                  : <Text style={[styles.buyBtnText, isPro && styles.buyBtnTextPro]}>
                      {t('settings.upgrade')} → {price}€/Mo
                    </Text>}
              </TouchableOpacity>
            ) : (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>✓ Dein aktueller Plan</Text>
              </View>
            )}
          </View>
        );
      })}

      {/* Einzelkauf */}
      <TouchableOpacity style={styles.singleCard} onPress={handleSingleReading} disabled={loading === 'free'}>
        <View>
          <Text style={styles.singleTitle}>Einzelne Legung</Text>
          <Text style={styles.singleDesc}>Mit Sprache & Foto · Einmalzahlung</Text>
        </View>
        {loading === 'free'
          ? <ActivityIndicator color="#C9956A" />
          : <Text style={styles.singlePrice}>1,99€</Text>}
      </TouchableOpacity>

      {/* Stripe Hinweis */}
      <View style={styles.stripeNote}>
        <Text style={styles.stripeNoteText}>
          🔒 Sichere Zahlung via Stripe · SEPA, Kreditkarte, Apple Pay · Jederzeit kündbar
        </Text>
      </View>
    </ScrollView>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <View style={styles.feature}>
      <Text style={styles.featureCheck}>✓</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0A1E' },
  content: { padding: 24, gap: 14, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '700', color: '#F5E6D0' },

  currentPlan: {
    backgroundColor: '#C9956A15',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C9956A44',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentPlanLabel: { color: '#888', fontSize: 13 },
  currentPlanName: { color: '#C9956A', fontSize: 15, fontWeight: '700' },

  card: {
    backgroundColor: '#ffffff08',
    borderRadius: 18,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: '#ffffff11',
    position: 'relative',
  },
  cardPro: { borderColor: '#C9956A', backgroundColor: '#C9956A0a' },
  cardCurrent: { borderColor: '#4CAF5066' },

  badge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#C9956A',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: { color: '#1a0a2e', fontSize: 11, fontWeight: '700' },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tierName: { fontSize: 18, fontWeight: '700', color: '#F5E6D0' },
  tierNamePro: { color: '#C9956A' },
  tierDesc: { color: '#666', fontSize: 12, marginTop: 2 },
  price: { fontSize: 22, fontWeight: '700', color: '#F5E6D0' },
  priceMonth: { fontSize: 13, color: '#888', fontWeight: '400' },

  featureList: { gap: 8 },
  feature: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  featureCheck: { color: '#C9956A', fontSize: 12 },
  featureText: { color: '#aaa', fontSize: 13 },

  buyBtn: {
    backgroundColor: '#ffffff15',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C9956A66',
  },
  buyBtnPro: { backgroundColor: '#C9956A', borderColor: '#C9956A' },
  buyBtnText: { color: '#C9956A', fontWeight: '700', fontSize: 14 },
  buyBtnTextPro: { color: '#1a0a2e' },

  currentBadge: {
    backgroundColor: '#4CAF5015',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF5033',
  },
  currentBadgeText: { color: '#4CAF50', fontSize: 13, fontWeight: '600' },

  singleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff08',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffffff22',
    borderStyle: 'dashed',
  },
  singleTitle: { color: '#F5E6D0', fontSize: 15, fontWeight: '600' },
  singleDesc: { color: '#666', fontSize: 12, marginTop: 2 },
  singlePrice: { color: '#C9956A', fontSize: 18, fontWeight: '700' },

  stripeNote: {
    backgroundColor: '#ffffff06',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  stripeNoteText: { color: '#555', fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
