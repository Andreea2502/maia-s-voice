/**
 * upload-assets.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Uploads all Mystic app images to Supabase Storage.
 *
 * SETUP
 * ─────
 * 1. Copy your Supabase SERVICE ROLE key from:
 *    Dashboard → Settings → API → service_role (secret)
 *
 * 2. Run:
 *    SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/upload-assets.mjs
 *
 *    Or add SUPABASE_SERVICE_ROLE_KEY to .env.local and run:
 *    node -r dotenv/config scripts/upload-assets.mjs
 *
 * BUCKET LAYOUT
 * ─────────────
 *   tarot-cards/
 *     major/00-the-fool.jpg ... 21-the-world.jpg
 *     minor/cups/01-ace-of-cups.jpg  ... 14-king-of-cups.jpg
 *     minor/wands/...
 *     minor/swords/...
 *     minor/pentacles/...
 *     back/card-back.jpg
 *
 *   mystic-assets/
 *     planets/sun.jpg ... north-node.jpg
 *     zodiac/aries.jpg ... pisces.jpg
 *     topics/love.jpg ... personality.jpg
 *     personas/luna.jpg  maya.jpg  zara.jpg
 *
 * LOCAL SOURCE (place Midjourney exports here before running):
 *   assets/tarot/major/
 *   assets/tarot/minor/cups|wands|swords|pentacles/
 *   assets/tarot/back/
 *   assets/planets/
 *   assets/zodiac/
 *   assets/topics/
 *   assets/personas/
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://tardqwkjjlvppwvtrqmf.supabase.co';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('❌  SUPABASE_SERVICE_ROLE_KEY not set.');
  console.error('   Run: SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/upload-assets.mjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ── Bucket definitions ───────────────────────────────────────────────────────
const BUCKETS = [
  { name: 'tarot-cards',   public: true },
  { name: 'mystic-assets', public: true },
];

// ── File map: [localPath, bucket, storagePath] ───────────────────────────────
function buildFileMap() {
  const map = [];

  function addDir(localDir, bucket, storagePrefix, exts = ['.jpg', '.jpeg', '.png', '.webp']) {
    const full = path.join(ROOT, localDir);
    if (!fs.existsSync(full)) {
      console.warn(`  ⚠️  Folder not found, skipping: ${localDir}`);
      return;
    }
    const entries = fs.readdirSync(full, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && exts.includes(path.extname(e.name).toLowerCase())) {
        map.push({
          local: path.join(full, e.name),
          bucket,
          storage: `${storagePrefix}/${e.name}`,
        });
      }
    }
  }

  // Tarot
  addDir('assets/tarot/major',            'tarot-cards', 'major');
  addDir('assets/tarot/back',             'tarot-cards', 'back');
  addDir('assets/tarot/minor/cups',       'tarot-cards', 'minor/cups');
  addDir('assets/tarot/minor/wands',      'tarot-cards', 'minor/wands');
  addDir('assets/tarot/minor/swords',     'tarot-cards', 'minor/swords');
  addDir('assets/tarot/minor/pentacles',  'tarot-cards', 'minor/pentacles');

  // Other assets
  addDir('assets/planets',  'mystic-assets', 'planets');
  addDir('assets/zodiac',   'mystic-assets', 'zodiac');
  addDir('assets/topics',   'mystic-assets', 'topics');
  addDir('assets/personas', 'mystic-assets', 'personas');

  return map;
}

// ── MIME helper ──────────────────────────────────────────────────────────────
function mime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }[ext] ?? 'application/octet-stream';
}

// ── Ensure buckets exist ─────────────────────────────────────────────────────
async function ensureBuckets() {
  const { data: existing } = await supabase.storage.listBuckets();
  const existingNames = new Set((existing ?? []).map(b => b.name));

  for (const { name, public: pub } of BUCKETS) {
    if (existingNames.has(name)) {
      console.log(`  ✓ Bucket exists: ${name}`);
    } else {
      const { error } = await supabase.storage.createBucket(name, { public: pub });
      if (error) {
        console.error(`  ❌ Failed to create bucket ${name}:`, error.message);
      } else {
        console.log(`  ✅ Created bucket: ${name} (public=${pub})`);
      }
    }
  }
}

// ── Upload files ─────────────────────────────────────────────────────────────
async function uploadFiles(files) {
  let ok = 0, skip = 0, fail = 0;

  for (const { local, bucket, storage } of files) {
    const fileData = fs.readFileSync(local);
    const contentType = mime(local);

    const { error } = await supabase.storage
      .from(bucket)
      .upload(storage, fileData, { contentType, upsert: true });

    if (error) {
      console.error(`  ❌ ${bucket}/${storage} — ${error.message}`);
      fail++;
    } else {
      const url = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${storage}`;
      console.log(`  ✅ ${bucket}/${storage}`);
      ok++;
    }
  }

  return { ok, fail };
}

// ── Print public URL summary ──────────────────────────────────────────────────
function printUrlSummary() {
  console.log('\n── Public URL pattern ──────────────────────────────────────────');
  console.log(`Tarot cards:   ${SUPABASE_URL}/storage/v1/object/public/tarot-cards/major/00-the-fool.jpg`);
  console.log(`Planets:       ${SUPABASE_URL}/storage/v1/object/public/mystic-assets/planets/sun.jpg`);
  console.log(`Zodiac:        ${SUPABASE_URL}/storage/v1/object/public/mystic-assets/zodiac/aries.jpg`);
  console.log(`Topics:        ${SUPABASE_URL}/storage/v1/object/public/mystic-assets/topics/love.jpg`);
  console.log(`Personas:      ${SUPABASE_URL}/storage/v1/object/public/mystic-assets/personas/luna.jpg`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌙 Maia\'s Voice — Asset Uploader');
  console.log('════════════════════════════════════════\n');

  console.log('Step 1/3  Checking buckets…');
  await ensureBuckets();

  console.log('\nStep 2/3  Scanning local files…');
  const files = buildFileMap();
  if (files.length === 0) {
    console.log('  ⚠️  No image files found. Place your Midjourney exports in the assets/ folders first.');
    printUrlSummary();
    return;
  }
  console.log(`  Found ${files.length} image(s) to upload.`);

  console.log('\nStep 3/3  Uploading…');
  const { ok, fail } = await uploadFiles(files);

  console.log('\n════════════════════════════════════════');
  console.log(`✅ ${ok} uploaded   ❌ ${fail} failed`);
  printUrlSummary();
}

main().catch(err => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
