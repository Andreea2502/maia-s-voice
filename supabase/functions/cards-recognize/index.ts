/**
 * POST /cards-recognize
 * Erkennt Tarot-Karten auf einem Foto via Gemini Vision (gemini-2.5-flash).
 * Kein separater Google Cloud Vision Key nötig – gleicher GEMINI_API_KEY.
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getAuthenticatedUser } from '../_shared/auth.ts';
import { analyzeImage } from '../_shared/gemini-client.ts';

const CARD_RECOGNITION_PROMPT = `Du bist ein Tarot-Experte. Analysiere dieses Bild und erkenne alle sichtbaren Tarot-Karten.

Für jede erkannte Karte, gib zurück:
- "card_name": englischer Kartenname (z.B. "The Fool", "The Moon", "Ace of Cups")
- "orientation": "upright" oder "reversed"
- "confidence": Zahl zwischen 0.0 und 1.0 (wie sicher bist du?)
- "position": "single", "left", "center", "right", oder "top"/"bottom" bei mehreren Karten

Antworte NUR mit einem JSON-Array. Beispiel:
[
  {"card_name": "The Moon", "orientation": "upright", "confidence": 0.95, "position": "center"},
  {"card_name": "The Star", "orientation": "reversed", "confidence": 0.87, "position": "left"}
]

Wenn keine Tarot-Karte erkennbar ist, antworte mit: []`;

// Mapping: Englische Kartennamen → unsere internen IDs
const NAME_TO_ID: Record<string, string> = {
  'the fool':            'major_00_fool',
  'the magician':        'major_01_magician',
  'the high priestess':  'major_02_high_priestess',
  'the empress':         'major_03_empress',
  'the emperor':         'major_04_emperor',
  'the hierophant':      'major_05_hierophant',
  'the lovers':          'major_06_lovers',
  'the chariot':         'major_07_chariot',
  'strength':            'major_08_strength',
  'the hermit':          'major_09_hermit',
  'wheel of fortune':    'major_10_wheel',
  'justice':             'major_11_justice',
  'the hanged man':      'major_12_hanged_man',
  'death':               'major_13_death',
  'temperance':          'major_14_temperance',
  'the devil':           'major_15_devil',
  'the tower':           'major_16_tower',
  'the star':            'major_17_star',
  'the moon':            'major_18_moon',
  'the sun':             'major_19_sun',
  'judgement':           'major_20_judgement',
  'judgment':            'major_20_judgement',
  'the world':           'major_21_world',
};

function mapCardNameToId(name: string): string {
  const normalized = name.toLowerCase().trim();
  return NAME_TO_ID[normalized] ?? normalized.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { supabase, userId } = await getAuthenticatedUser(req);

    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    if (!file) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Bild zu base64 konvertieren
    const bytes = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));

    // Bild in Supabase Storage speichern
    const fileName = `${userId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('card_photos')
      .upload(fileName, file, { contentType: file.type });

    if (uploadError) {
      console.warn('Storage upload failed (non-fatal):', uploadError.message);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('card_photos')
      .getPublicUrl(fileName);

    // Gemini Vision aufrufen
    let rawResult = '';
    try {
      rawResult = await analyzeImage({
        imageBase64: base64,
        mimeType: file.type || 'image/jpeg',
        prompt: CARD_RECOGNITION_PROMPT,
      });
    } catch (visionErr) {
      console.error('Gemini Vision failed:', visionErr);
      return new Response(
        JSON.stringify({ error: 'Card recognition failed', recognized_cards: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // JSON aus der Antwort parsen (Gemini kann manchmal ```json ... ``` Wrapper machen)
    let recognized: any[] = [];
    try {
      const jsonMatch = rawResult.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recognized = JSON.parse(jsonMatch[0]);
      }
    } catch (_) {
      recognized = [];
    }

    // Kartennamen auf interne IDs mappen
    const mappedCards = recognized.map((card: any) => ({
      card_id: mapCardNameToId(card.card_name ?? ''),
      card_name: card.card_name,
      orientation: card.orientation === 'reversed' ? 'reversed' : 'upright',
      confidence: typeof card.confidence === 'number' ? card.confidence : 0.8,
      position: card.position ?? 'single',
    }));

    return new Response(
      JSON.stringify({
        recognized_cards: mappedCards,
        image_url: publicUrl,
        model_used: 'gemini-2.5-flash',
      }),
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
