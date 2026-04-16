/**
 * sort-assets.mjs
 * ──────────────────────────────────────────────────────────────────────────────
 * Du legst deine Midjourney-Bilder (egal wie sie heißen) einfach in
 * SORTIER-Ordner. Das Script benennt sie automatisch richtig um.
 *
 * ANLEITUNG:
 * ──────────
 * 1. Erstelle Ordner unter assets/inbox/ (die sind weiter unten beschrieben)
 * 2. Lege je 1 Bild pro Slot in den richtigen Ordner
 * 3. Führe aus: node scripts/sort-assets.mjs
 *
 * Das Script verschiebt + benennt alles automatisch in die richtigen Zielordner.
 *
 * ORDNERSTRUKTUR für assets/inbox/:
 * ──────────────────────────────────
 *   tarot-major/     → 22 Ordner: 00/ 01/ 02/ ... 21/ (je 1 Bild drin)
 *   tarot-back/      → 1 Bild drin
 *   cups/            → 14 Ordner: 01/ ... 14/ (je 1 Bild)
 *   wands/           → 14 Ordner: 01/ ... 14/
 *   swords/          → 14 Ordner: 01/ ... 14/
 *   pentacles/       → 14 Ordner: 01/ ... 14/
 *   planets/         → Ordner: sun/ moon/ mercury/ venus/ mars/ jupiter/ saturn/ uranus/ neptune/ north-node/
 *   zodiac/          → Ordner: aries/ taurus/ gemini/ cancer/ leo/ virgo/ libra/ scorpio/ sagittarius/ capricorn/ aquarius/ pisces/
 *   topics/          → Ordner: love/ career/ family/ finance/ decision/ future/ health/ spirituality/ personality/
 *   personas/        → Ordner: luna/ maya/ zara/
 *
 * ALTERNATIV: Einfach alle Bilder direkt in den Zielordner legen (ohne Unterordner)
 * — dann läuft das Script im BATCH-Modus und benennt nach Reihenfolge (alphabetisch).
 * ──────────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT  = path.resolve(__dirname, '..');
const INBOX = path.join(ROOT, 'assets', 'inbox');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

// ── Target name maps ─────────────────────────────────────────────────────────

const MAJOR_NAMES = {
  '00': 'the-fool',       '01': 'the-magician',     '02': 'the-high-priestess',
  '03': 'the-empress',    '04': 'the-emperor',       '05': 'the-hierophant',
  '06': 'the-lovers',     '07': 'the-chariot',       '08': 'strength',
  '09': 'the-hermit',     '10': 'wheel-of-fortune',  '11': 'justice',
  '12': 'the-hanged-man', '13': 'death',             '14': 'temperance',
  '15': 'the-devil',      '16': 'the-tower',         '17': 'the-star',
  '18': 'the-moon',       '19': 'the-sun',           '20': 'judgement',
  '21': 'the-world',
};

const MINOR_NAMES = {
  '01': 'ace-of',   '02': 'two-of',   '03': 'three-of', '04': 'four-of',
  '05': 'five-of',  '06': 'six-of',   '07': 'seven-of', '08': 'eight-of',
  '09': 'nine-of',  '10': 'ten-of',   '11': 'page-of',  '12': 'knight-of',
  '13': 'queen-of', '14': 'king-of',
};

// Slot lists for "batch" mode (images dropped directly into category folder)
const PLANET_SLOTS  = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','north-node'];
const ZODIAC_SLOTS  = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
const TOPIC_SLOTS   = ['love','career','family','finance','decision','future','health','spirituality','personality'];
const PERSONA_SLOTS = ['luna','maya','zara'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function isImage(filename) {
  return IMAGE_EXTS.has(path.extname(filename).toLowerCase());
}

/** Get first image file in a directory, alphabetically */
function firstImageIn(dir) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter(isImage).sort();
  return files.length > 0 ? path.join(dir, files[0]) : null;
}

/** Get all image files in a directory, alphabetically */
function allImagesIn(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => isImage(f) && fs.statSync(path.join(dir, f)).isFile())
    .sort()
    .map(f => path.join(dir, f));
}

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function moveAndRename(src, destDir, targetName) {
  const ext  = path.extname(src).toLowerCase().replace('.jpeg', '.jpg');
  const dest = path.join(destDir, targetName + ext);
  ensureDir(destDir);
  fs.renameSync(src, dest);
  console.log(`  ✅  ${path.relative(ROOT, src)}  →  ${path.relative(ROOT, dest)}`);
  return dest;
}

// ── Processors ────────────────────────────────────────────────────────────────

/** Numbered subfolder mode: inbox/tarot-major/00/ → first image there */
function processNumberedSubfolders(inboxDir, destDir, nameMap) {
  if (!fs.existsSync(inboxDir)) return;
  let count = 0;
  const nums = Object.keys(nameMap).sort();
  for (const num of nums) {
    const subDir = path.join(inboxDir, num);
    const src    = firstImageIn(subDir);
    if (!src) {
      // Try batch mode: one image per slot in order
      continue;
    }
    const targetName = `${num}-${nameMap[num]}`;
    moveAndRename(src, destDir, targetName);
    count++;
  }

  // Batch mode fallback: images directly in inboxDir, named in order
  if (count === 0) {
    const imgs = allImagesIn(inboxDir);
    imgs.forEach((src, i) => {
      const num  = String(i).padStart(2, '0');
      const name = nameMap[num];
      if (!name) { console.warn(`  ⚠️  Kein Slot für Index ${i} in ${path.basename(inboxDir)}`); return; }
      moveAndRename(src, destDir, `${num}-${name}`);
    });
  }
}

function processMinorSuit(suit) {
  const inboxDir = path.join(INBOX, suit);
  const destDir  = path.join(ROOT, 'assets', 'tarot', 'minor', suit);
  if (!fs.existsSync(inboxDir)) return;
  let count = 0;

  for (const [num, rank] of Object.entries(MINOR_NAMES).sort()) {
    const subDir = path.join(inboxDir, num);
    const src    = firstImageIn(subDir);
    if (src) {
      moveAndRename(src, destDir, `${num}-${rank}-${suit}`);
      count++;
    }
  }

  if (count === 0) {
    const imgs = allImagesIn(inboxDir);
    imgs.forEach((src, i) => {
      const num  = String(i + 1).padStart(2, '0');
      const rank = MINOR_NAMES[num];
      if (!rank) { console.warn(`  ⚠️  Kein Slot für Index ${i+1} im Suit ${suit}`); return; }
      moveAndRename(src, destDir, `${num}-${rank}-${suit}`);
    });
  }
}

function processNamedSlots(inboxDir, destDir, slots) {
  if (!fs.existsSync(inboxDir)) return;
  let count = 0;

  for (const slot of slots) {
    const subDir = path.join(inboxDir, slot);
    const src    = firstImageIn(subDir);
    if (src) { moveAndRename(src, destDir, slot); count++; }
  }

  // Batch fallback
  if (count === 0) {
    const imgs = allImagesIn(inboxDir);
    imgs.forEach((src, i) => {
      const slot = slots[i];
      if (!slot) { console.warn(`  ⚠️  Zu viele Bilder in ${path.basename(inboxDir)}`); return; }
      moveAndRename(src, destDir, slot);
    });
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
function main() {
  console.log('\n🌙 Maia\'s Voice — Asset Sorter');
  console.log('════════════════════════════════════════\n');

  if (!fs.existsSync(INBOX)) {
    console.log('📁 Erstelle Inbox-Ordner...\n');
    // Create all inbox slot folders so user can see the structure
    const create = (p) => fs.mkdirSync(p, { recursive: true });

    // Major Arcana
    Object.keys(MAJOR_NAMES).forEach(n => create(path.join(INBOX, 'tarot-major', n)));
    create(path.join(INBOX, 'tarot-back'));

    // Minor suits
    ['cups','wands','swords','pentacles'].forEach(suit => {
      Object.keys(MINOR_NAMES).forEach(n => create(path.join(INBOX, suit, n)));
    });

    // Named slots
    PLANET_SLOTS.forEach(s  => create(path.join(INBOX, 'planets',  s)));
    ZODIAC_SLOTS.forEach(s  => create(path.join(INBOX, 'zodiac',   s)));
    TOPIC_SLOTS.forEach(s   => create(path.join(INBOX, 'topics',   s)));
    PERSONA_SLOTS.forEach(s => create(path.join(INBOX, 'personas', s)));

    console.log('✅ Ordner erstellt unter: assets/inbox/');
    console.log('\nJetzt:');
    console.log('  1. Lege je 1 Midjourney-Bild in den passenden Unterordner');
    console.log('     z.B. "The Fool" → assets/inbox/tarot-major/00/');
    console.log('     z.B. "Sonne" → assets/inbox/planets/sun/');
    console.log('  2. Führe nochmal aus: node scripts/sort-assets.mjs\n');
    return;
  }

  let total = 0;

  console.log('▸ Major Arcana...');
  processNumberedSubfolders(
    path.join(INBOX, 'tarot-major'),
    path.join(ROOT, 'assets', 'tarot', 'major'),
    MAJOR_NAMES
  );

  console.log('▸ Kartenrückseite...');
  const backSrc = firstImageIn(path.join(INBOX, 'tarot-back'));
  if (backSrc) moveAndRename(backSrc, path.join(ROOT, 'assets', 'tarot', 'back'), 'card-back');

  console.log('▸ Cups...');   processMinorSuit('cups');
  console.log('▸ Wands...');  processMinorSuit('wands');
  console.log('▸ Swords...'); processMinorSuit('swords');
  console.log('▸ Pentacles...'); processMinorSuit('pentacles');

  console.log('▸ Planeten...');
  processNamedSlots(path.join(INBOX, 'planets'),  path.join(ROOT, 'assets', 'planets'),  PLANET_SLOTS);

  console.log('▸ Zodiak...');
  processNamedSlots(path.join(INBOX, 'zodiac'),   path.join(ROOT, 'assets', 'zodiac'),   ZODIAC_SLOTS);

  console.log('▸ Topics...');
  processNamedSlots(path.join(INBOX, 'topics'),   path.join(ROOT, 'assets', 'topics'),   TOPIC_SLOTS);

  console.log('▸ Personas...');
  processNamedSlots(path.join(INBOX, 'personas'), path.join(ROOT, 'assets', 'personas'), PERSONA_SLOTS);

  console.log('\n════════════════════════════════════════');
  console.log('✅ Fertig! Jetzt: node scripts/upload-assets.mjs\n');
}

main();
