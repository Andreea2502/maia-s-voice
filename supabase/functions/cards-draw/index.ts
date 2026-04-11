import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getAuthenticatedUser } from '../_shared/auth.ts';

// Major Arcana IDs
const ALL_CARD_IDS = [
  'major_00_fool','major_01_magician','major_02_high_priestess','major_03_empress',
  'major_04_emperor','major_05_hierophant','major_06_lovers','major_07_chariot',
  'major_08_strength','major_09_hermit','major_10_wheel','major_11_justice',
  'major_12_hanged_man','major_13_death','major_14_temperance','major_15_devil',
  'major_16_tower','major_17_star','major_18_moon','major_19_sun',
  'major_20_judgement','major_21_world',
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    await getAuthenticatedUser(req);
    const body = await req.json();
    const { count = 3 } = body;

    const shuffled = shuffle(ALL_CARD_IDS);
    const drawn = shuffled.slice(0, Math.min(count, 10)).map((id, position) => ({
      position,
      card_id: id,
      orientation: Math.random() > 0.25 ? 'upright' : 'reversed',
      recognized_from_photo: false,
    }));

    return new Response(JSON.stringify({ cards: drawn }), {
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
