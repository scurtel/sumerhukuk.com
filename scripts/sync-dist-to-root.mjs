/**
 * Hostinger'da main branch + npm run build kullanılıyorsa,
 * build çıktısı dist/ içinde kalır ve kök dizinde index.html olmaz → 403.
 * Bu script dist/ içeriğini çalışma dizinine kopyalar (yalnızca Hostinger deploy için).
 */
import { cpSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');

const SKIP = new Set([
  'node_modules',
  '.git',
  'dist',
  'content',
  'scripts',
  'data',
  'src',
  '.github',
  '.env',
  '.env.example',
]);

function copyDistToRoot() {
  if (!existsSync(DIST)) {
    console.error('Hata: dist/ bulunamadı. Önce npm run build çalıştırın.');
    process.exit(1);
  }

  const entries = readdirSync(DIST);
  for (const entry of entries) {
    const src = join(DIST, entry);
    const dest = join(ROOT, entry);
    cpSync(src, dest, { recursive: true, force: true });
    console.log(`Kopyalandı: ${entry}`);
  }

  console.log('dist/ içeriği site köküne senkronize edildi (Hostinger public_html).');
}

copyDistToRoot();
