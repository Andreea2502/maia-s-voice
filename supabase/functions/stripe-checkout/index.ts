/**
 * POST /stripe-checkout
 * Erstellt eine Stripe Checkout Session und gibt die URL zurück.
 * Der User wird nach dem Kauf zurück zur App geleitet.
 *
 * Request:  { product_id: "monthly_basic" | "monthly_premium" | "monthly_unlimited" | "single_reading" }
 * Response: { checkout_url: string, session_id: string }
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getAuthenticatedUser } from '../_shared/auth.ts';

// Stripe Preis-IDs – nach Erstellung im Stripe Dashboard hier eintragen
// Format: price_XXXXXXXXXXXX
const STRIPE_PRICE_IDS: Record<string, string> = {
  monthly_basic:     Deno.env.get('STRIPE_PRICE_BASIC')     ?? 'price_BASIC_PLACEHOLDER',
  monthly_premium:   Deno.env.get('STRIPE_PRICE_PREMIUM')   ?? 'price_PREMIUM_PLACEHOLDER',
  monthly_unlimited: Deno.env.get('STRIPE_PRICE_UNLIMITED') ?? 'price_UNLIMITED_PLACEHOLDER',
  single_reading:    Deno.env.get('STRIPE_PRICE_SINGLE')    ?? 'price_SINGLE_PLACEHOLDER',
};

const APP_URL = Deno.env.get('APP_URL') ?? 'https://tarot-app.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { supabase, userId } = await getAuthenticatedUser(req);
    const body = await req.json();
    const { product_id } = body;

    const priceId = STRIPE_PRICE_IDS[product_id];
    if (!priceId || priceId.includes('PLACEHOLDER')) {
      return new Response(
        JSON.stringify({ error: `Unknown or unconfigured product: ${product_id}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!;
    const isSubscription = product_id !== 'single_reading';

    // Stripe Checkout Session erstellen
    const params = new URLSearchParams({
      'line_items[0][price]':    priceId,
      'line_items[0][quantity]': '1',
      'mode':                    isSubscription ? 'subscription' : 'payment',
      'success_url':             `${APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url':              `${APP_URL}/payment/cancelled`,
      'client_reference_id':     userId,       // Damit wir den User im Webhook identifizieren
      'metadata[user_id]':       userId,
      'metadata[product_id]':    product_id,
    });

    // Kundendaten vorausfüllen wenn vorhanden
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('display_name, stripe_customer_id')
      .eq('id', userId)
      .single();

    if ((profile as any)?.stripe_customer_id) {
      params.set('customer', (profile as any).stripe_customer_id);
    }

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!stripeRes.ok) {
      const err = await stripeRes.json();
      throw new Error(`Stripe error: ${err.error?.message ?? stripeRes.status}`);
    }

    const session = await stripeRes.json();

    return new Response(
      JSON.stringify({ checkout_url: session.url, session_id: session.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
