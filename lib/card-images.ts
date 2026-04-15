/**
 * Static require map for all 78 tarot card images.
 * React Native requires static requires — no dynamic paths allowed.
 *
 * PUT YOUR MIDJOURNEY IMAGES IN:
 *   assets/tarot/major/00-the-fool.jpg
 *   assets/tarot/minor/cups/01-ace-of-cups.jpg
 *   etc.
 *
 * Until you have the real images, a placeholder is used automatically.
 */

// Placeholder shown when a card image is not yet available
// Using the app icon as stand-in until real card images are added
const PLACEHOLDER = require('@/assets/icon.png');

function safe(requireFn: () => any): any {
  try { return requireFn(); } catch { return PLACEHOLDER; }
}

export const CARD_IMAGES: Record<string, any> = {
  // ─── Major Arcana ──────────────────────────────────────────────────────────
  major_00: safe(() => require('@/assets/tarot/major/00-the-fool.jpg')),
  major_01: safe(() => require('@/assets/tarot/major/01-the-magician.jpg')),
  major_02: safe(() => require('@/assets/tarot/major/02-the-high-priestess.jpg')),
  major_03: safe(() => require('@/assets/tarot/major/03-the-empress.jpg')),
  major_04: safe(() => require('@/assets/tarot/major/04-the-emperor.jpg')),
  major_05: safe(() => require('@/assets/tarot/major/05-the-hierophant.jpg')),
  major_06: safe(() => require('@/assets/tarot/major/06-the-lovers.jpg')),
  major_07: safe(() => require('@/assets/tarot/major/07-the-chariot.jpg')),
  major_08: safe(() => require('@/assets/tarot/major/08-strength.jpg')),
  major_09: safe(() => require('@/assets/tarot/major/09-the-hermit.jpg')),
  major_10: safe(() => require('@/assets/tarot/major/10-wheel-of-fortune.jpg')),
  major_11: safe(() => require('@/assets/tarot/major/11-justice.jpg')),
  major_12: safe(() => require('@/assets/tarot/major/12-the-hanged-man.jpg')),
  major_13: safe(() => require('@/assets/tarot/major/13-death.jpg')),
  major_14: safe(() => require('@/assets/tarot/major/14-temperance.jpg')),
  major_15: safe(() => require('@/assets/tarot/major/15-the-devil.jpg')),
  major_16: safe(() => require('@/assets/tarot/major/16-the-tower.jpg')),
  major_17: safe(() => require('@/assets/tarot/major/17-the-star.jpg')),
  major_18: safe(() => require('@/assets/tarot/major/18-the-moon.jpg')),
  major_19: safe(() => require('@/assets/tarot/major/19-the-sun.jpg')),
  major_20: safe(() => require('@/assets/tarot/major/20-judgement.jpg')),
  major_21: safe(() => require('@/assets/tarot/major/21-the-world.jpg')),

  // ─── Cups ──────────────────────────────────────────────────────────────────
  cups_01: safe(() => require('@/assets/tarot/minor/cups/01-ace-of-cups.jpg')),
  cups_02: safe(() => require('@/assets/tarot/minor/cups/02-two-of-cups.jpg')),
  cups_03: safe(() => require('@/assets/tarot/minor/cups/03-three-of-cups.jpg')),
  cups_04: safe(() => require('@/assets/tarot/minor/cups/04-four-of-cups.jpg')),
  cups_05: safe(() => require('@/assets/tarot/minor/cups/05-five-of-cups.jpg')),
  cups_06: safe(() => require('@/assets/tarot/minor/cups/06-six-of-cups.jpg')),
  cups_07: safe(() => require('@/assets/tarot/minor/cups/07-seven-of-cups.jpg')),
  cups_08: safe(() => require('@/assets/tarot/minor/cups/08-eight-of-cups.jpg')),
  cups_09: safe(() => require('@/assets/tarot/minor/cups/09-nine-of-cups.jpg')),
  cups_10: safe(() => require('@/assets/tarot/minor/cups/10-ten-of-cups.jpg')),
  cups_11: safe(() => require('@/assets/tarot/minor/cups/11-page-of-cups.jpg')),
  cups_12: safe(() => require('@/assets/tarot/minor/cups/12-knight-of-cups.jpg')),
  cups_13: safe(() => require('@/assets/tarot/minor/cups/13-queen-of-cups.jpg')),
  cups_14: safe(() => require('@/assets/tarot/minor/cups/14-king-of-cups.jpg')),

  // ─── Wands ─────────────────────────────────────────────────────────────────
  wands_01: safe(() => require('@/assets/tarot/minor/wands/01-ace-of-wands.jpg')),
  wands_02: safe(() => require('@/assets/tarot/minor/wands/02-two-of-wands.jpg')),
  wands_03: safe(() => require('@/assets/tarot/minor/wands/03-three-of-wands.jpg')),
  wands_04: safe(() => require('@/assets/tarot/minor/wands/04-four-of-wands.jpg')),
  wands_05: safe(() => require('@/assets/tarot/minor/wands/05-five-of-wands.jpg')),
  wands_06: safe(() => require('@/assets/tarot/minor/wands/06-six-of-wands.jpg')),
  wands_07: safe(() => require('@/assets/tarot/minor/wands/07-seven-of-wands.jpg')),
  wands_08: safe(() => require('@/assets/tarot/minor/wands/08-eight-of-wands.jpg')),
  wands_09: safe(() => require('@/assets/tarot/minor/wands/09-nine-of-wands.jpg')),
  wands_10: safe(() => require('@/assets/tarot/minor/wands/10-ten-of-wands.jpg')),
  wands_11: safe(() => require('@/assets/tarot/minor/wands/11-page-of-wands.jpg')),
  wands_12: safe(() => require('@/assets/tarot/minor/wands/12-knight-of-wands.jpg')),
  wands_13: safe(() => require('@/assets/tarot/minor/wands/13-queen-of-wands.jpg')),
  wands_14: safe(() => require('@/assets/tarot/minor/wands/14-king-of-wands.jpg')),

  // ─── Swords ────────────────────────────────────────────────────────────────
  swords_01: safe(() => require('@/assets/tarot/minor/swords/01-ace-of-swords.jpg')),
  swords_02: safe(() => require('@/assets/tarot/minor/swords/02-two-of-swords.jpg')),
  swords_03: safe(() => require('@/assets/tarot/minor/swords/03-three-of-swords.jpg')),
  swords_04: safe(() => require('@/assets/tarot/minor/swords/04-four-of-swords.jpg')),
  swords_05: safe(() => require('@/assets/tarot/minor/swords/05-five-of-swords.jpg')),
  swords_06: safe(() => require('@/assets/tarot/minor/swords/06-six-of-swords.jpg')),
  swords_07: safe(() => require('@/assets/tarot/minor/swords/07-seven-of-swords.jpg')),
  swords_08: safe(() => require('@/assets/tarot/minor/swords/08-eight-of-swords.jpg')),
  swords_09: safe(() => require('@/assets/tarot/minor/swords/09-nine-of-swords.jpg')),
  swords_10: safe(() => require('@/assets/tarot/minor/swords/10-ten-of-swords.jpg')),
  swords_11: safe(() => require('@/assets/tarot/minor/swords/11-page-of-swords.jpg')),
  swords_12: safe(() => require('@/assets/tarot/minor/swords/12-knight-of-swords.jpg')),
  swords_13: safe(() => require('@/assets/tarot/minor/swords/13-queen-of-swords.jpg')),
  swords_14: safe(() => require('@/assets/tarot/minor/swords/14-king-of-swords.jpg')),

  // ─── Pentacles ─────────────────────────────────────────────────────────────
  pentacles_01: safe(() => require('@/assets/tarot/minor/pentacles/01-ace-of-pentacles.jpg')),
  pentacles_02: safe(() => require('@/assets/tarot/minor/pentacles/02-two-of-pentacles.jpg')),
  pentacles_03: safe(() => require('@/assets/tarot/minor/pentacles/03-three-of-pentacles.jpg')),
  pentacles_04: safe(() => require('@/assets/tarot/minor/pentacles/04-four-of-pentacles.jpg')),
  pentacles_05: safe(() => require('@/assets/tarot/minor/pentacles/05-five-of-pentacles.jpg')),
  pentacles_06: safe(() => require('@/assets/tarot/minor/pentacles/06-six-of-pentacles.jpg')),
  pentacles_07: safe(() => require('@/assets/tarot/minor/pentacles/07-seven-of-pentacles.jpg')),
  pentacles_08: safe(() => require('@/assets/tarot/minor/pentacles/08-eight-of-pentacles.jpg')),
  pentacles_09: safe(() => require('@/assets/tarot/minor/pentacles/09-nine-of-pentacles.jpg')),
  pentacles_10: safe(() => require('@/assets/tarot/minor/pentacles/10-ten-of-pentacles.jpg')),
  pentacles_11: safe(() => require('@/assets/tarot/minor/pentacles/11-page-of-pentacles.jpg')),
  pentacles_12: safe(() => require('@/assets/tarot/minor/pentacles/12-knight-of-pentacles.jpg')),
  pentacles_13: safe(() => require('@/assets/tarot/minor/pentacles/13-queen-of-pentacles.jpg')),
  pentacles_14: safe(() => require('@/assets/tarot/minor/pentacles/14-king-of-pentacles.jpg')),

  // ─── Card back ─────────────────────────────────────────────────────────────
  back: safe(() => require('@/assets/tarot/back/card-back.jpg')),
};

export function getCardImage(cardId: string): any {
  return CARD_IMAGES[cardId] ?? PLACEHOLDER;
}
