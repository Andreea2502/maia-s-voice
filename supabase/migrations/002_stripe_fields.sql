-- Migration 002: Stripe-Felder für Abonnements
-- Ersetzt RevenueCat durch Stripe

-- stripe_customer_id zum User-Profil
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Stripe-spezifische Felder zur Subscriptions-Tabelle
ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_stripe
  ON public.user_subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
