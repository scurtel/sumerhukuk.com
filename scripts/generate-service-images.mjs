/**
 * Adana avukat hizmet sayfaları için kare WebP görselleri üretir.
 * Build'e bağlı değildir: npm run generate:service-images
 */
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';
import { loadEnv, PUBLIC_DIR } from './lib.mjs';

const STYLE_BASE = `Professional Turkish law firm visual for Sümer Hukuk Bürosu.
Color palette: dark navy (#1a365d), cream white, muted gold (#c9a227).
Clean, corporate, premium, trustworthy. No text, no logos, no watermarks, no phone numbers.
No human faces. No realistic court documents with readable text. No fake title deeds.
Square 1:1 composition, centered subject, soft studio lighting.`;

const SERVICE_TARGETS = [
  {
    path: '/images/services/adana-gayrimenkul-avukati.webp',
    prompt: `Real estate law concept image. Scales of justice beside modern building silhouette and property keys on a premium law desk. Subtle architectural lines suggesting property law. ${STYLE_BASE} Theme: Adana real estate attorney, property ownership.`,
  },
  {
    path: '/images/services/adana-miras-avukati.webp',
    prompt: `Inheritance law concept image. Scales of justice with elegant family estate documents folder and property deed stack suggesting inheritance division. Warm, dignified, not dramatic or death-themed. ${STYLE_BASE} Theme: inheritance sharing, estate planning documents abstract.`,
  },
  {
    path: '/images/services/adana-ortakligin-giderilmesi-avukati.webp',
    prompt: `Co-ownership partition law concept. Property survey plan with divided land parcels, shared ownership paperwork, keys arranged in sections suggesting partition and sale. ${STYLE_BASE} Theme: partition of co-owned real estate, shareholder division.`,
  },
  {
    path: '/images/services/adana-tapu-avukati.webp',
    prompt: `Title deed (tapu) law concept. Abstract property registry documents, building outline, keys and official stamp impression without readable text. Suggests ownership records and land registry. ${STYLE_BASE} Theme: tapu disputes, property registration.`,
  },
];

const ARGS = new Set(process.argv.slice(2));
const FORCE = ARGS.has('--force');
const DRY_RUN = ARGS.has('--dry-run');

function publicPathFromUrl(urlPath) {
  return join(PUBLIC_DIR, ...urlPath.replace(/^\//, '').split('/'));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function generateImageBytes(ai, prompt, model) {
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { responseModalities: ['IMAGE', 'TEXT'] },
  });
  const parts = response?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inlineData?.data);
  if (!imagePart) {
    throw new Error(parts.find((p) => p.text)?.text || 'Görsel verisi döndürülmedi.');
  }
  return Buffer.from(imagePart.inlineData.data, 'base64');
}

async function main() {
  const env = loadEnv();
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
  const missing = SERVICE_TARGETS.filter((t) => FORCE || !existsSync(publicPathFromUrl(t.path)));

  if (!missing.length) {
    console.log('Tüm hizmet görselleri mevcut. --force ile yeniden üretin.');
    return;
  }

  if (!env.geminiApiKey) {
    console.error('GEMINI_API_KEY tanımlı değil. SVG/placeholder fallback kullanılacak.');
    process.exit(1);
  }

  if (DRY_RUN) {
    for (const t of missing) console.log(`[dry-run] ${t.path}`);
    return;
  }

  const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });
  for (const target of missing) {
    try {
      console.log(`Üretiliyor: ${target.path}`);
      const raw = await generateImageBytes(ai, target.prompt, model);
      const dest = publicPathFromUrl(target.path);
      mkdirSync(dirname(dest), { recursive: true });
      const webp = await sharp(raw)
        .resize(1200, 1200, { fit: 'cover', position: 'centre' })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();
      writeFileSync(dest, webp);
      console.log(`  Kaydedildi (${(webp.length / 1024).toFixed(1)} KB)`);
      await sleep(2500);
    } catch (err) {
      console.warn(`  Hata (${target.path}): ${err.message}`);
    }
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
