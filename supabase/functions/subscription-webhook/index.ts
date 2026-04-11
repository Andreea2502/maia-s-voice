import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
    const authHeader = req.headers.get('Authorization');

    if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const event = body.event;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const appUserId = event?.app_user_id;
    const productId = event?.product_id as string | undefined;

    const PRODUCT_TO_TIER: Record<string, string> = {
      monthly_basic:   'basic',
      monthly_premium: 'premium',
      monthly_unlimited: 'unlimited',
    };

    const tier = productId ? (PRODUCT_TO_TIER[productId] ?? 'free') : 'free';

    switch (event?.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
        await supabase.from('user_profiles')
          .update({ subscription_tier: tier })
          .eq('id', appUserId);
        await supabase.from('user_subscriptions').upsert({
          user_id: appUserId,
          revenuecat_customer_id: event.id,
          product_id: productId,
          status: 'active',
          current_period_start: event.purchased_at_ms
            ? new Date(event.purchased_at_ms).toISOString() : null,
          current_period_end: event.expiration_at_ms
            ? new Date(event.expiration_at_ms).toISOString() : null,
        });
        break;

      case 'CANCELLATION':
      case 'EXPIRATION':
        await supabase.from('user_profiles')
          .update({ subscription_tier: 'free' })
          .eq('id', appUserId);
        await supabase.from('user_subscriptions')
          .update({ status: event.type === 'CANCELLATION' ? 'cancelled' : 'expired' })
          .eq('user_id', appUserId)
          .eq('product_id', productId);
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
