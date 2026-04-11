import { useState, useEffect } from 'react';
import { SubscriptionTier } from '@/types/user';
import { useSupabase } from './useSupabase';
import { TIERS, canUsePersona, canUseSpread, hasReadingsLeft } from '@/lib/subscription-tiers';
import { PersonaId } from '@/types/user';
import { SpreadType } from '@/types/card';

export function useSubscription(userId?: string) {
  const supabase = useSupabase();
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [readingsThisMonth, setReadingsThisMonth] = useState(0);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('user_profiles')
      .select('subscription_tier, readings_this_month')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data) {
          setTier(data.subscription_tier as SubscriptionTier);
          setReadingsThisMonth(data.readings_this_month);
        }
      });
  }, [userId, supabase]);

  return {
    tier,
    readingsThisMonth,
    tierConfig: TIERS[tier],
    canUsePersona: (id: PersonaId) => canUsePersona(tier, id),
    canUseSpread: (type: SpreadType) => canUseSpread(tier, type),
    hasReadingsLeft: () => hasReadingsLeft(tier, readingsThisMonth),
  };
}
