/**
 * Sümer Hukuk Bürosu logosundan favicon dosyaları üretir.
 * Manuel: node scripts/generate-favicon.mjs [logo-png-yolu]
 */
import { mkdirSync, existsSync, copyFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const BRAND_DIR = join(PUBLIC, 'images', 'brand');

const DEFAULT_LOGO = join(
  PUBLIC,
  'images',
  'brand',
  'sumer-hukuk-burosu-logo.png'
);

const logoPath = process.argv[2] || DEFAULT_LOGO;

if (!existsSync(logoPath)) {
  console.error(`Logo bulunamadı: ${logoPath}`);
  process.exit(1);
}

mkdirSync(BRAND_DIR, { recursive: true });

/** Amblem alanı — metin hariç üst kare kırpım */
async function emblemPipeline() {
  const meta = await sharp(logoPath).metadata();
  const size = Math.min(meta.width, meta.height);
  const cropSize = Math.round(size * 0.62);
  const left = Math.round((size - cropSize) / 2);
  const top = Math.round(size * 0.04);

  return sharp(logoPath)
    .extract({ left, top, width: cropSize, height: cropSize })
    .flatten({ background: '#ffffff' });
}

async function main() {
  const emblem = await emblemPipeline();

  copyFileSync(logoPath, join(BRAND_DIR, 'sumer-hukuk-burosu-logo.png'));

  await emblem.clone().resize(32, 32).png({ compressionLevel: 9 }).toFile(join(PUBLIC, 'favicon-32x32.png'));
  await emblem.clone().resize(16, 16).png({ compressionLevel: 9 }).toFile(join(PUBLIC, 'favicon-16x16.png'));
  await emblem.clone().resize(180, 180).png({ compressionLevel: 9 }).toFile(join(PUBLIC, 'apple-touch-icon.png'));
  // Genel fallback — kök favicon
  await emblem.clone().resize(32, 32).png({ compressionLevel: 9 }).toFile(join(PUBLIC, 'favicon.png'));
  await emblem.clone().resize(48, 48).png({ compressionLevel: 9 }).toFile(join(PUBLIC, 'favicon.ico'));

  console.log('Favicon dosyaları oluşturuldu:');
  console.log('  public/favicon-16x16.png');
  console.log('  public/favicon-32x32.png');
  console.log('  public/favicon.png');
  console.log('  public/favicon.ico');
  console.log('  public/apple-touch-icon.png');
  console.log('  public/images/brand/sumer-hukuk-burosu-logo.png');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
