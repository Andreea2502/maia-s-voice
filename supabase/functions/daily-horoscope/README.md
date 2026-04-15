# daily-horoscope Edge Function

Triggered daily at 05:00 UTC to generate personalized daily horoscopes.

## Deployment
npx supabase functions deploy daily-horoscope --no-verify-jwt

## Supabase Cron Setup (run in SQL editor)
SELECT cron.schedule(
  'daily-horoscope-morning',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url := 'https://tardqwkjjlvppwvtrqmf.supabase.co/functions/v1/daily-horoscope',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.cron_secret', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

## Secrets needed
- CRON_SECRET (set in Supabase dashboard)
- GEMINI_API_KEY (already set)
- SUPABASE_SERVICE_ROLE_KEY (auto-available in edge functions)
