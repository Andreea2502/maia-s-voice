/**
 * lib/asset-images.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase Storage URLs for all Mystic app images (planets, zodiac, topics, personas).
 * Tarot cards are handled separately in lib/card-images.ts (static requires).
 *
 * After running `node scripts/upload-assets.mjs`, all images live in Supabase Storage.
 * These URL helpers give the rest of the app a single place to get image sources.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const BASE = 'https://tardqwkjjlvppwvtrqmf.supabase.co/storage/v1/object/public';

export const PLANET_IMAGES: Record<string, string> = {
  sun:        `${BASE}/mystic-assets/planets/sun.jpg`,
  moon:       `${BASE}/mystic-assets/planets/moon.jpg`,
  mercury:    `${BASE}/mystic-assets/planets/mercury.jpg`,
  venus:      `${BASE}/mystic-assets/planets/venus.jpg`,
  mars:       `${BASE}/mystic-assets/planets/mars.jpg`,
  jupiter:    `${BASE}/mystic-assets/planets/jupiter.jpg`,
  saturn:     `${BASE}/mystic-assets/planets/saturn.jpg`,
  uranus:     `${BASE}/mystic-assets/planets/uranus.jpg`,
  neptune:    `${BASE}/mystic-assets/planets/neptune.jpg`,
  north_node: `${BASE}/mystic-assets/planets/north-node.jpg`,
};

export const ZODIAC_IMAGES: Record<string, string> = {
  aries:       `${BASE}/mystic-assets/zodiac/aries.jpg`,
  taurus:      `${BASE}/mystic-assets/zodiac/taurus.jpg`,
  gemini:      `${BASE}/mystic-assets/zodiac/gemini.jpg`,
  cancer:      `${BASE}/mystic-assets/zodiac/cancer.jpg`,
  leo:         `${BASE}/mystic-assets/zodiac/leo.jpg`,
  virgo:       `${BASE}/mystic-assets/zodiac/virgo.jpg`,
  libra:       `${BASE}/mystic-assets/zodiac/libra.jpg`,
  scorpio:     `${BASE}/mystic-assets/zodiac/scorpio.jpg`,
  sagittarius: `${BASE}/mystic-assets/zodiac/sagittarius.jpg`,
  capricorn:   `${BASE}/mystic-assets/zodiac/capricorn.jpg`,
  aquarius:    `${BASE}/mystic-assets/zodiac/aquarius.jpg`,
  pisces:      `${BASE}/mystic-assets/zodiac/pisces.jpg`,
};

export const TOPIC_IMAGES: Record<string, string> = {
  love:          `${BASE}/mystic-assets/topics/love.jpg`,
  career:        `${BASE}/mystic-assets/topics/career.jpg`,
  family:        `${BASE}/mystic-assets/topics/family.jpg`,
  finance:       `${BASE}/mystic-assets/topics/finance.jpg`,
  decision:      `${BASE}/mystic-assets/topics/decision.jpg`,
  future:        `${BASE}/mystic-assets/topics/future.jpg`,
  health:        `${BASE}/mystic-assets/topics/health.jpg`,
  spirituality:  `${BASE}/mystic-assets/topics/spirituality.jpg`,
  personality:   `${BASE}/mystic-assets/topics/personality.jpg`,
};

export const PERSONA_IMAGES: Record<string, string> = {
  luna: `${BASE}/mystic-assets/personas/luna.jpg`,
  maya: `${BASE}/mystic-assets/personas/maya.jpg`,
  zara: `${BASE}/mystic-assets/personas/zara.jpg`,
};

/** Tarot card Storage URL (use as { uri: url } for Image source) */
export function tarotCardUrl(cardId: string): string {
  // cardId format: "major_00", "cups_01", "wands_13", etc.
  const [suit, num] = cardId.split('_');
  if (suit === 'major') {
    return `${BASE}/tarot-cards/major/${num}-${majorSlug(Number(num))}.jpg`;
  }
  if (suit === 'back') {
    return `${BASE}/tarot-cards/back/card-back.jpg`;
  }
  return `${BASE}/tarot-cards/minor/${suit}/${num}-${minorSlug(suit, Number(num))}.jpg`;
}

// ── Slug helpers ─────────────────────────────────────────────────────────────

const MAJOR_SLUGS: Record<number, string> = {
  0:  'the-fool',       1:  'the-magician',    2:  'the-high-priestess',
  3:  'the-empress',    4:  'the-emperor',      5:  'the-hierophant',
  6:  'the-lovers',     7:  'the-chariot',      8:  'strength',
  9:  'the-hermit',     10: 'wheel-of-fortune', 11: 'justice',
  12: 'the-hanged-man', 13: 'death',            14: 'temperance',
  15: 'the-devil',      16: 'the-tower',        17: 'the-star',
  18: 'the-moon',       19: 'the-sun',          20: 'judgement',
  21: 'the-world',
};

const MINOR_RANK_SLUGS: Record<number, string> = {
  1:  'ace-of',   2:  'two-of',   3:  'three-of', 4:  'four-of',
  5:  'five-of',  6:  'six-of',   7:  'seven-of', 8:  'eight-of',
  9:  'nine-of',  10: 'ten-of',   11: 'page-of',  12: 'knight-of',
  13: 'queen-of', 14: 'king-of',
};

function majorSlug(n: number): string {
  return MAJOR_SLUGS[n] ?? 'unknown';
}

function minorSlug(suit: string, n: number): string {
  const rank = MINOR_RANK_SLUGS[n] ?? 'unknown-of';
  return `${rank}-${suit}`;
}
