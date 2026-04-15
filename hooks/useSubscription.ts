import { useState, useEffect } from 'react';
import { SubscriptionTier } from '@/types/user';
import { useSupabase } from './useSupabase';
import { TIERS, canUsePersona, hasReadingsLeft } from '@/lib/subscription-tiers';
import { PersonaId } from '@/lib/personas';

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
    hasReadingsLeft: () => hasReadingsLeft(tier, readingsThisMonth),
  };
}
