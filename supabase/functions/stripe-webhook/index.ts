/**
 * POST /stripe-webhook
 * Empfängt Stripe-Events und aktualisiert den Abo-Status in der DB.
 *
 * Relevante Events:
 * - checkout.session.completed        → Kauf/Abo aktiviert
 * - customer.subscription.updated     → Abo geändert
 * - customer.subscription.deleted     → Abo gekündigt
 * - invoice.payment_failed            → Zahlung fehlgeschlagen
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PRODUCT_TO_TIER: Record<string, string> = {
  monthly_basic:     'basic',
  monthly_premium:   'premium',
  monthly_unlimited: 'unlimited',
  single_reading:    'free',    // Einzelkauf → kein Tier-Upgrade
};

// Stripe Signatur-Verifikation (Timing-safe)
async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string
): Promise<boolean> {
  const parts = sigHeader.split(',').reduce((acc: Record<string, string>, part) => {
    const [k, v] = part.split('=');
    if (k && v) acc[k] = v;
    return acc;
  }, {});

  const timestamp = parts['t'];
  const signature = parts['v1'];
  if (!timestamp || !signature) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const data = new TextEncoder().encode(`${timestamp}.${payload}`);
  const computed = await crypto.subtle.sign('HMAC', key, data);
  const hex = Array.from(new Uint8Array(computed))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hex === signature;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
  const sigHeader = req.headers.get('stripe-signature') ?? '';
  const payload = await req.text();

  const valid = await verifyStripeSignature(payload, sigHeader, webhookSecret);
  if (!valid) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const event = JSON.parse(payload);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    switch (event.type) {

      // ── Checkout abgeschlossen ─────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id ?? session.metadata?.user_id;
        const productId = session.metadata?.product_id;
        if (!userId) break;

        const tier = productId ? (PRODUCT_TO_TIER[productId] ?? 'free') : 'free';
        const stripeCustomerId = session.customer;

        await supabase.from('user_profiles').update({
          subscription_tier: tier === 'free' ? undefined : tier,  // single_reading ändert kein Tier
          stripe_customer_id: stripeCustomerId,
        }).eq('id', userId);

        if (tier !== 'free') {
          await supabase.from('user_subscriptions').upsert({
            user_id: userId,
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: session.subscription,
            product_id: productId,
            status: 'active',
          });
        }

        // Für single_reading: ein Einmal-Lesung-Guthaben vergeben
        if (productId === 'single_reading') {
          const { data: prof } = await supabase
            .from('user_profiles')
            .select('readings_this_month')
            .eq('id', userId)
            .single();
          await supabase.from('user_profiles').update({
            readings_this_month: Math.max(0, (prof?.readings_this_month ?? 0) - 1),
          }).eq('id', userId);
        }
        break;
      }

      // ── Abo aktiv / verlängert ─────────────────────────────────────
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const { data: userSub } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', sub.id)
          .single();
        if (!userSub) break;

        const status = sub.status === 'active' ? 'active'
          : sub.status === 'past_due' ? 'grace_period'
          : 'expired';

        await supabase.from('user_subscriptions').update({
          status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end:   new Date(sub.current_period_end   * 1000).toISOString(),
        }).eq('stripe_subscription_id', sub.id);
        break;
      }

      // ── Abo gekündigt ──────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const { data: userSub } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', sub.id)
          .single();
        if (!userSub) break;

        await Promise.all([
          supabase.from('user_profiles')
            .update({ subscription_tier: 'free' })
            .eq('id', userSub.user_id),
          supabase.from('user_subscriptions')
            .update({ status: 'cancelled' })
            .eq('stripe_subscription_id', sub.id),
        ]);
        break;
      }

      // ── Zahlung fehlgeschlagen ─────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const { data: userSub } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', invoice.subscription)
          .single();
        if (userSub) {
          await supabase.from('user_subscriptions')
            .update({ status: 'grace_period' })
            .eq('stripe_subscription_id', invoice.subscription);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('Stripe webhook error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
