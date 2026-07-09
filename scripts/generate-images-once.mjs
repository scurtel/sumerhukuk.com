/**
 * Manuel WebP görsel üretimi — Gemini Image API.
 *
 * Build sürecine BAĞLI DEĞİLDİR.
 *   npm run generate:images
 *   npm run generate:images -- --hero-only
 *   npm run generate:images -- --placeholders-only
 *   npm run generate:images -- --dry-run
 *   npm run generate:images -- --force
 *
 * SVG fallback dosyaları korunur; WebP yalnızca kalite katmanıdır.
 */
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';
import { loadEnv, PUBLIC_DIR, HERO_IMAGE } from './lib.mjs';

const STYLE_BASE = `Photorealistic, professional, modern Turkish law firm website aesthetic.
Color palette: dark navy (#1a365d), cream, gold (#c9a227), warm gray.
Clean, corporate, premium, trustworthy composition.
No visible human faces. No logos, no text, no watermarks.
Avoid plastic AI look and cheesy stock-photo feel.
Gavel only in deep background if at all, never as main subject.`;

const HERO_TARGET = {
  path: HERO_IMAGE.webp,
  width: 1600,
  height: 900,
  aspectHint: '16:9 wide hero composition with negative space for text overlay on the left',
  prompt: `Premium hero image for a law firm website in Adana, Turkey specializing in real estate, inheritance, title deed (tapu), and family law.

Composition: Modern law firm desk with open title deed documents, elegant pen, architectural plan or property paperwork suggesting real estate law. Warm but restrained Adana city atmosphere in soft background bokeh — Mediterranean light, subtle urban warmth, not touristy.

Style: ${STYLE_BASE}
Mood: Corporate, confident, refined, serious but welcoming.
Technical: ${'16:9'} aspect ratio, high quality, suitable for website hero with text overlay space on left third.
No people, no faces.`,
};

const PLACEHOLDER_TARGETS = [
  {
    path: '/images/placeholders/gayrimenkul-hukuku.webp',
    width: 1200,
    height: 800,
    prompt: `Real estate law category image for Turkish law firm.
Title deed documents, architectural floor plan, subtle building/property paperwork on a premium law desk.
${STYLE_BASE}
Theme: property law, land registry, corporate legal consultation.`,
  },
  {
    path: '/images/placeholders/tapu-hukuku.webp',
    width: 1200,
    height: 800,
    prompt: `Title deed (tapu) law category image for Turkish law firm.
Official property deed document, signature area, stamp impression, registry paperwork suggesting ownership transfer.
${STYLE_BASE}
Theme: tapu registration, property title, legal documentation.`,
  },
  {
    path: '/images/placeholders/miras-hukuku.webp',
    width: 1200,
    height: 800,
    prompt: `Inheritance law category image for Turkish law firm.
Aged but clean legal documents, family estate file, property inheritance folder on a dignified desk.
${STYLE_BASE}
Theme: inheritance, estate transfer, respectful and serious atmosphere.`,
  },
  {
    path: '/images/placeholders/ortakligin-giderilmesi.webp',
    width: 1200,
    height: 800,
    prompt: `Partition of co-ownership (ortaklığın giderilmesi) law category image.
Property survey plan with divided parcels, co-ownership paperwork, legal solution theme.
${STYLE_BASE}
Theme: shared property division, partitioned land plot, legal resolution.`,
  },
  {
    path: '/images/placeholders/mal-paylasimi.webp',
    width: 1200,
    height: 800,
    prompt: `Marital property division law category image for Turkish law firm.
Neat legal files, property and financial documents on a simple premium law desk.
${STYLE_BASE}
Theme: divorce asset division, marital property settlement, discreet and professional.`,
  },
  {
    path: '/images/placeholders/aile-hukuku.webp',
    width: 1200,
    height: 800,
    prompt: `Family law category image for Turkish law firm.
Elegant family law case file, delicate and sensitive atmosphere — suggest childcare/custody through toys or documents only, never show faces.
${STYLE_BASE}
Theme: family law, custody documents, gentle and trustworthy mood.`,
  },
  {
    path: '/images/placeholders/hukuk-genel.webp',
    width: 1200,
    height: 800,
    prompt: `General legal consultation category image for Turkish law firm.
Law books, case files, premium law office desk, corporate trust atmosphere.
${STYLE_BASE}
Theme: general legal advice, law office, professional consultation.`,
  },
];

const ARGS = new Set(process.argv.slice(2));
const DRY_RUN = ARGS.has('--dry-run');
const FORCE = ARGS.has('--force');
const HERO_ONLY = ARGS.has('--hero-only');
const PLACEHOLDERS_ONLY = ARGS.has('--placeholders-only');

function publicPathFromUrl(urlPath) {
  const normalized = urlPath.replace(/^\//, '');
  return join(PUBLIC_DIR, ...normalized.split('/'));
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateImageBytes(ai, prompt, model) {
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseModalities: ['IMAGE', 'TEXT'],
    },
  });

  const parts = response?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inlineData?.data);
  if (!imagePart) {
    const textParts = parts.filter((p) => p.text).map((p) => p.text);
    throw new Error(textParts.join(' ') || 'Görsel verisi döndürülmedi.');
  }

  return Buffer.from(imagePart.inlineData.data, 'base64');
}

async function saveAsWebp(rawBuffer, destPath, { width, height }) {
  mkdirSync(dirname(destPath), { recursive: true });

  const webpBuffer = await sharp(rawBuffer)
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();

  writeFileSync(destPath, webpBuffer);
  return webpBuffer.length;
}

async function processTarget(ai, target, model) {
  const destPath = publicPathFromUrl(target.path);
  const exists = existsSync(destPath);

  if (exists && !FORCE) {
    console.log(`Atlandı (mevcut): ${target.path}`);
    return { path: target.path, status: 'skipped' };
  }

  if (DRY_RUN) {
    console.log(`[dry-run] ${target.path}`);
    console.log(`  Prompt: ${target.prompt.slice(0, 120)}…\n`);
    return { path: target.path, status: 'dry-run' };
  }

  console.log(`Üretiliyor: ${target.path}`);
  const raw = await generateImageBytes(ai, target.prompt, model);
  const bytes = await saveAsWebp(raw, destPath, {
    width: target.width,
    height: target.height,
  });
  console.log(`  Kaydedildi: ${destPath} (${formatBytes(bytes)})\n`);
  return { path: target.path, status: 'created', bytes };
}

async function main() {
  const env = loadEnv();
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

  let targets = [];
  if (!PLACEHOLDERS_ONLY) targets.push(HERO_TARGET);
  if (!HERO_ONLY) targets = targets.concat(PLACEHOLDER_TARGETS);

  const missing = targets.filter((t) => FORCE || !existsSync(publicPathFromUrl(t.path)));

  if (!missing.length) {
    console.log('Tüm WebP hedefleri mevcut. Yeniden üretmek için --force kullanın.');
    return;
  }

  console.log(`Hedef: ${missing.length} görsel (${model})\n`);

  if (!env.geminiApiKey) {
    console.log('Bilgi: GEMINI_API_KEY tanımlı değil. Otomatik üretim yapılamıyor.');
    console.log('SVG fallback sistemi çalışmaya devam eder.\n');
    for (const item of missing) {
      console.log(`— ${item.path}`);
    }
    return;
  }

  if (DRY_RUN) {
    for (const item of missing) {
      await processTarget(null, item, model);
    }
    return;
  }

  const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });
  const results = [];

  for (const target of missing) {
    try {
      const result = await processTarget(ai, target, model);
      results.push(result);
      await sleep(2500);
    } catch (err) {
      console.warn(`  Hata (${target.path}): ${err.message}\n`);
      results.push({ path: target.path, status: 'failed', error: err.message });
    }
  }

  const created = results.filter((r) => r.status === 'created');
  const failed = results.filter((r) => r.status === 'failed');

  console.log('—'.repeat(48));
  console.log(`Tamamlandı: ${created.length} üretildi, ${failed.length} başarısız, ${results.filter((r) => r.status === 'skipped').length} atlandı`);
  if (created.length) {
    console.log('\nÜretilen dosyalar:');
    for (const r of created) {
      console.log(`  ${r.path} (${formatBytes(r.bytes)})`);
    }
  }
  if (failed.length) {
    console.log('\nBaşarısız:');
    for (const r of failed) {
      console.log(`  ${r.path}: ${r.error}`);
    }
    console.log('\nSVG fallback dosyaları korunuyor; site çalışmaya devam eder.');
  }
}

main().catch((err) => {
  console.error('Beklenmeyen hata:', err.message);
  process.exit(1);
});
