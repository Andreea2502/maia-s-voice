/**
 * POST /daily-horoscope
 * Cron-triggered edge function (05:00 UTC daily).
 * Generates personalized daily horoscopes for opted-in users.
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { generateText } from '../_shared/gemini-client.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// ─── Sun sign by date ────────────────────────────────────────────────────────
function getTodaySunSign(month: number, day: number): string {
  const dates: [number, number, string][] = [
    [3, 21, 'Widder'],   [4, 20, 'Stier'],      [5, 21, 'Zwillinge'],
    [6, 21, 'Krebs'],    [7, 23, 'Löwe'],        [8, 23, 'Jungfrau'],
    [9, 23, 'Waage'],    [10, 23, 'Skorpion'],   [11, 22, 'Schütze'],
    [12, 22, 'Steinbock'], [1, 20, 'Wassermann'], [2, 19, 'Fische'],
  ];
  for (let i = 0; i < dates.length; i++) {
    const [m, d] = dates[i];
    const [nm, nd] = dates[(i + 1) % dates.length];
    if ((month === m && day >= d) || (month === nm && day < nd)) {
      return dates[i][2];
    }
  }
  return 'Widder';
}

// ─── Approximate Moon sign via Julian Day Number ─────────────────────────────
// Moon moves ~13.176° per day, full cycle ≈ 27.32 days (12 signs × 2.277 days each)
function getTodayMoonSign(year: number, month: number, day: number): string {
  const signs = [
    'Widder', 'Stier', 'Zwillinge', 'Krebs', 'Löwe', 'Jungfrau',
    'Waage', 'Skorpion', 'Schütze', 'Steinbock', 'Wassermann', 'Fische',
  ];
  // Simple Julian Day Number
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4)
    - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  // Known Moon reference: Jan 1 2000 (JDN 2451545) Moon was in Pisces (index 11)
  const daysSince = jdn - 2451545;
  // Moon sign index cycles every ~27.32 days (2.277 days per sign)
  const signIndex = Math.floor(((daysSince % 27.32) + 27.32) % 27.32 / 2.277) % 12;
  return signs[signIndex];
}

// ─── Mercury sign (approximate — changes every ~14-21 days) ─────────────────
function getTodayMercurySign(month: number, day: number): string {
  // Mercury is always within ~28° of the Sun — approximate as same or adjacent sign
  const sunSign = getTodaySunSign(month, day);
  return sunSign; // simplified: same as sun for prompt purposes
}

// ─── Build natal sun sign from birth date string ─────────────────────────────
function getNatalSunSign(birthDate: string): string {
  const d = new Date(birthDate);
  return getTodaySunSign(d.getUTCMonth() + 1, d.getUTCDate());
}

// ─── Generate horoscope via Gemini ──────────────────────────────────────────
async function generateHoroscope(params: {
  natalSunSign: string;
  todaySunSign: string;
  todayMoonSign: string;
  todayMercurySign: string;
  personalProfile: Record<string, any>;
  language: string;
  todayDate: string;
  readingType: 'daily' | 'weekly';
}): Promise<string> {
  const pp = params.personalProfile ?? {};
  const lang = params.language === 'en' ? 'English' : 'Deutsch';
  const isWeekly = params.readingType === 'weekly';

  const areasNote = pp.areasOfInterest?.length
    ? `Die Person interessiert sich besonders für: ${(pp.areasOfInterest as string[]).join(', ')}.`
    : '';
  const focusNote = pp.lifeFocus ? `Ihr aktueller Lebensfokus: ${pp.lifeFocus}.` : '';
  const nameNote  = pp.displayName ? `Name: ${pp.displayName}.` : '';

  const systemPrompt = isWeekly
    ? `Du bist eine einfühlsame, warmherzige astrologische Begleiterin.
Schreibe ein persönliches Wochenhoroskop für die Woche ab ${params.todayDate}.

Astrologischer Kontext:
- Geburtszeichen der Person (Sonne): ${params.natalSunSign}
- Aktuelle Sonnenposition: ${params.todaySunSign}
- Mondstand zu Wochenbeginn: ${params.todayMoonSign}

Persönliche Informationen:
${nameNote}${focusNote}${areasNote}

Schreibe das Horoskop auf ${lang}.

Struktur (genau diese drei Abschnitte):
## Deine Woche im Überblick
(2-3 Absätze — allgemeine Energie der Woche, Schwerpunkte)

## Chancen & Herausforderungen
(2-3 Absätze — was diese Woche möglich macht, was Aufmerksamkeit braucht)

## Dein Fokus diese Woche
(2-3 Absätze — konkrete Empfehlung, innere Ausrichtung, was du kultivieren kannst)

Regeln: Kein Fachjargon, persönlich ("du"), 500-600 Wörter, keine Versprechen — nur Anregungen.`
    : `Du bist eine einfühlsame, warmherzige astrologische Begleiterin.
Schreibe ein persönliches Tageshoroskop für heute (${params.todayDate}).

Astrologischer Kontext:
- Geburtszeichen der Person (Sonne): ${params.natalSunSign}
- Heutige Sonnenposition: ${params.todaySunSign}
- Heutiger Mondstand: ${params.todayMoonSign}
- Heutiger Merkur: ${params.todayMercurySign}

Persönliche Informationen:
${nameNote}${focusNote}${areasNote}

Schreibe das Horoskop auf ${lang}.

Struktur (genau diese drei Abschnitte):
## Dein heutiger Tag
(2-3 kurze Absätze — allgemeine Energie, wie sie sich auf diese Person auswirkt)

## Worauf du achten kannst
(2-3 kurze Absätze — konkrete Hinweise, Chancen, mögliche Herausforderungen)

## Deine Energie heute
(2-3 kurze Absätze — innere Stimmung, Empfehlung für den Tag)

Regeln: Kein Fachjargon, persönlich ("du"), 400-500 Wörter, keine Versprechen — nur Anregungen.`;

  return generateText({
    systemPrompt,
    userMessage: isWeekly ? 'Bitte schreibe das Wochenhoroskop.' : 'Bitte schreibe das Tageshoroskop.',
    maxOutputTokens: isWeekly ? 900 : 700,
  });
}

// ─── Main handler ────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Verify caller — accept either the anon key or service role key
  const authHeader = req.headers.get('Authorization') ?? '';
  const anonKey    = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const token      = authHeader.replace('Bearer ', '');
  if (!token || (token !== anonKey && token !== serviceKey)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Parse optional reading_type from body (default: 'daily', can be 'weekly')
  let bodyData: Record<string, any> = {};
  try { bodyData = await req.json(); } catch { /* empty body ok */ }
  const readingType: string = bodyData.reading_type === 'weekly' ? 'weekly' : 'daily';
  const enabledField = readingType === 'weekly' ? 'weekly_horoscope_enabled' : 'daily_horoscope_enabled';

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const todayMonth = now.getUTCMonth() + 1;
  const todayDay = now.getUTCDate();
  const todayYear = now.getUTCFullYear();

  const todaySunSign = getTodaySunSign(todayMonth, todayDay);
  const todayMoonSign = getTodayMoonSign(todayYear, todayMonth, todayDay);
  const todayMercurySign = getTodayMercurySign(todayMonth, todayDay);

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // Load eligible users based on reading type preference
    const { data: users, error: usersError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, birth_date, birth_lat, birth_timezone, preferred_language, personal_profile')
      .eq(enabledField, true)
      .not('birth_date', 'is', null)
      .not('birth_lat', 'is', null)
      .limit(50);

    if (usersError) throw usersError;
    if (!users?.length) {
      return new Response(
        JSON.stringify({ processed: 0, skipped: 0, errors: 0, message: 'No eligible users' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check which users already have a horoscope for today
    const userIds = users.map((u: any) => u.id);
    const { data: existingReadings } = await supabaseAdmin
      .from('daily_readings')
      .select('user_id')
      .in('user_id', userIds)
      .eq('reading_date', todayStr)
      .eq('reading_type', readingType);

    const alreadyDoneIds = new Set((existingReadings ?? []).map((r: any) => r.user_id));

    // Process each eligible user
    for (const user of users) {
      if (alreadyDoneIds.has(user.id)) {
        skipped++;
        continue;
      }

      try {
        const natalSunSign = getNatalSunSign(user.birth_date);
        const personalProfile = (user.personal_profile as Record<string, any>) ?? {};
        const language = user.preferred_language ?? 'de';

        const horoscope = await generateHoroscope({
          natalSunSign,
          todaySunSign,
          todayMoonSign,
          todayMercurySign,
          personalProfile,
          language,
          todayDate: todayStr,
          readingType: readingType as 'daily' | 'weekly',
        });

        await supabaseAdmin.from('daily_readings').insert({
          user_id: user.id,
          reading_date: todayStr,
          reading_type: readingType,
          raw_text: horoscope,
          natal_sun_sign: natalSunSign,
          delivered_at: now.toISOString(),
        });

        processed++;
      } catch (userErr) {
        console.error(`Error processing user ${user.id}:`, userErr);
        errors++;
      }
    }

    return new Response(
      JSON.stringify({ processed, skipped, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return new Response(JSON.stringify({ error: message, processed, skipped, errors }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
