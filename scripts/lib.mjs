import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(__dirname, '..');
export const ARTICLES_DIR = join(ROOT, 'content', 'articles');
export const SERVICES_DIR = join(ROOT, 'content', 'services');
export const PAGES_DIR = join(ROOT, 'content', 'pages');
export const PUBLIC_DIR = join(ROOT, 'public');
export const SITEMAP_PATH = join(PUBLIC_DIR, 'sitemap.xml');

export const SITE_CONFIG = {
  phone: '0543 251 54 38',
  phoneTel: '+905432515438',
  areaServed: 'Adana',
  address: 'Kayalıbağ Mahallesi, Çolakoğlu İş Merkezi Kat: 2 No: 1, Seyhan / Adana',
  serviceCategory: 'Gayrimenkul ve Miras Hukuku',
  defaultCta:
    'Dosyanızın hukuki durumunun değerlendirilmesi için Sümer Hukuk Bürosu ile iletişime geçebilirsiniz.',
  logoPath: '/images/brand/sumer-hukuk-burosu-logo.png',
  /** Kurumsal entity @id sabitleri (site köküne bağlı) */
  entityIds: {
    organization: '#organization',
    legalService: '#legalservice',
    person: '#ceren-sumer-cilli',
    website: '#website',
  },
  /** Doğrulanmış dış dijital profiller — Organization/LegalService sameAs */
  sameAs: [
    'https://yandex.com.tr/maps/org/adana_tapu_gayrimenkul_miras_ve_ortakligin_giderilmesi_avukati_sumer_hukuk/111348760653/?ll=35.330767%2C36.989510&z=16',
    'https://www.facebook.com/SumerHukukBurosuAdana/',
  ],
  yandexMapsUrl:
    'https://yandex.com.tr/maps/org/adana_tapu_gayrimenkul_miras_ve_ortakligin_giderilmesi_avukati_sumer_hukuk/111348760653/?ll=35.330767%2C36.989510&z=16',
  facebookUrl: 'https://www.facebook.com/SumerHukukBurosuAdana/',
  knowsAbout: [
    'Gayrimenkul Hukuku',
    'Tapu Hukuku',
    'Miras Hukuku',
    'Ortaklığın Giderilmesi',
    'Taşınmaz Uyuşmazlıkları',
  ],
  /** İkincil profesyonel entity — profil URL’si sitede yok */
  lawyer: {
    name: 'Avukat Ceren Sümer Cilli',
    jobTitle: 'Avukat',
  },
  mapsEmbedSrc:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12747.41170045247!2d35.311796087158214!3d36.98944369999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x15288f9873af45f1%3A0xc06d0b3a21f42fe7!2sAdana%20Tapu%20Gayrimenkul%20Miras%20ve%20Ortakl%C4%B1%C4%9F%C4%B1n%20Giderilmesi%20Avukat%C4%B1%20-%20S%C3%BCmer%20Hukuk!5e0!3m2!1str!2str!4v1783936721804!5m2!1str!2str',
  mapsDirectionsUrl:
    'https://www.google.com/maps/dir/?api=1&destination=Kayal%C4%B1ba%C4%9F%20Mahallesi%2C%20%C3%87olako%C4%9Flu%20%C4%B0%C5%9F%20Merkezi%20Kat%3A%202%20No%3A%201%2C%20Seyhan%20%2F%20Adana',
};

/** Ana sayfa kartları — Adana avukat hizmet sayfaları */
export const ADANA_LAWYER_SERVICES = [
  {
    slug: 'adana-gayrimenkul-avukati',
    label: 'Adana Gayrimenkul Avukatı',
    icon: '/images/services/gayrimenkul-hukuku.svg',
    image: '/images/services/adana-gayrimenkul-avukati.webp',
    imageAlt: 'Adana gayrimenkul avukatı ve taşınmaz hukuku',
    summary:
      'Gayrimenkul, taşınmaz, mülkiyet, ecrimisil ve diğer gayrimenkul uyuşmazlıklarına ilişkin hukuki süreçler.',
  },
  {
    slug: 'adana-miras-avukati',
    label: 'Adana Miras Avukatı',
    icon: '/images/services/miras-hukuku.svg',
    image: '/images/services/adana-miras-avukati.webp',
    imageAlt: 'Adana miras avukatı ve miras paylaşımı',
    summary:
      'Miras paylaşımı, tereke, muris muvazaası, tenkis ve miras kalan taşınmazlara ilişkin hukuki süreçler.',
  },
  {
    slug: 'adana-ortakligin-giderilmesi-avukati',
    label: 'Adana Ortaklığın Giderilmesi Avukatı',
    icon: '/images/services/ortakligin-giderilmesi.svg',
    image: '/images/services/adana-ortakligin-giderilmesi-avukati.webp',
    imageAlt: 'Adana ortaklığın giderilmesi avukatı',
    summary:
      'Hisseli taşınmazlarda aynen taksim veya satış yoluyla ortaklığın giderilmesine ilişkin süreçler.',
  },
  {
    slug: 'adana-tapu-avukati',
    label: 'Adana Tapu Avukatı',
    icon: '/images/services/tapu-hukuku.svg',
    image: '/images/services/adana-tapu-avukati.webp',
    imageAlt: 'Adana tapu avukatı ve tapu uyuşmazlıkları',
    summary:
      'Tapu iptal ve tescil, yolsuz tescil ve taşınmaz kayıtlarından doğan uyuşmazlıklara ilişkin süreçler.',
  },
];

export const SERVICE_LINKS = [
  ...ADANA_LAWYER_SERVICES,
  {
    slug: 'ortakligin-giderilmesi-davasi',
    label: 'Ortaklığın Giderilmesi Davası',
    icon: '/images/services/ortakligin-giderilmesi.svg',
    summary: 'Paydaşlar arasında aynen taksim veya satış yoluyla ortaklığın sona erdirilmesi.',
  },
  {
    slug: 'izale-i-suyu-davasi',
    label: 'İzale-i Şuyu Davası',
    icon: '/images/services/izale-i-suyu.svg',
    summary: 'Paylı mülkiyette izale-i şuyu ve satış yoluyla paylaşım süreçleri.',
  },
  {
    slug: 'tapu-iptal-ve-tescil-davasi',
    label: 'Tapu İptal ve Tescil Davası',
    icon: '/images/services/tapu-iptal-tescil.svg',
    summary: 'Hatalı veya geçersiz tapu kayıtlarının iptali ve yeniden tescili.',
  },
];

export const LEGAL_DISCLAIMER =
  'Bu sayfadaki bilgiler genel niteliktedir; somut olayın özelliklerine göre hukuki değerlendirme yapılmalıdır.';

/** Kategori → placeholder görsel eşlemesi */
export const CATEGORY_IMAGE_MAP = [
  {
    match: /gayrimenkul/i,
    image: '/images/placeholders/gayrimenkul-hukuku.svg',
    imageAlt: 'Gayrimenkul hukuku ve tapu uyuşmazlıkları hakkında bilgilendirici görsel',
  },
  {
    match: /tapu/i,
    image: '/images/placeholders/tapu-hukuku.svg',
    imageAlt: 'Tapu hukuku ve tapu kayıt süreçleri hakkında bilgilendirici görsel',
  },
  {
    match: /miras/i,
    image: '/images/placeholders/miras-hukuku.svg',
    imageAlt: 'Miras hukuku ve miras kalan taşınmazlar hakkında bilgilendirici görsel',
  },
  {
    match: /ortakl[iı][gğ][iı]n giderilmesi|izale/i,
    image: '/images/placeholders/ortakligin-giderilmesi.svg',
    imageAlt: 'Ortaklığın giderilmesi ve paylı mülkiyet hakkında bilgilendirici görsel',
  },
  {
    match: /mal payla[sş]|mal rejimi/i,
    image: '/images/placeholders/mal-paylasimi.svg',
    imageAlt: 'Boşanmada mal paylaşımı hakkında bilgilendirici görsel',
  },
  {
    match: /aile|bo[sş]anma/i,
    image: '/images/placeholders/aile-hukuku.svg',
    imageAlt: 'Aile hukuku hakkında bilgilendirici görsel',
  },
];

export const DEFAULT_ARTICLE_IMAGE = {
  image: '/images/placeholders/hukuk-genel.svg',
  imageAlt: 'Hukuki bilgilendirme görseli',
};

export const HERO_IMAGE = {
  webp: '/images/hero/hero-gayrimenkul-miras-hukuku.webp',
  svg: '/images/hero/hero-gayrimenkul-miras-hukuku.svg',
  alt: 'Adana gayrimenkul, tapu ve miras hukuku danışmanlığı görseli',
  width: 640,
  height: 360,
};

/** SVG yolunun WebP karşılığını döndürür */
export function svgToWebpPath(urlPath) {
  if (!urlPath || typeof urlPath !== 'string') return urlPath;
  return urlPath.replace(/\.svg$/i, '.webp');
}

/**
 * Aynı isimli WebP dosyası varsa onu, yoksa orijinal yolu (genelde SVG) döndürür.
 * SVG fallback sistemi korunur.
 */
export function preferWebpAsset(urlPath) {
  if (!urlPath || typeof urlPath !== 'string') return urlPath;
  if (urlPath.endsWith('.webp')) {
    return publicAssetExists(urlPath) ? urlPath : svgToWebpPath(urlPath).replace(/\.webp$/i, '.svg');
  }
  const webpPath = svgToWebpPath(urlPath);
  if (publicAssetExists(webpPath)) return webpPath;
  return urlPath;
}

/**
 * public/ altındaki bir görsel yolu (URL path) mevcut mu?
 * Eksik dosya build'i kırmaz; false döner.
 */
export function publicAssetExists(urlPath) {
  if (!urlPath || typeof urlPath !== 'string') return false;
  const normalized = urlPath.replace(/^\//, '');
  return existsSync(join(PUBLIC_DIR, ...normalized.split('/')));
}

/** Hero: WebP varsa onu, yoksa SVG fallback */
export function resolveHeroImage() {
  if (publicAssetExists(HERO_IMAGE.webp)) {
    return {
      src: HERO_IMAGE.webp,
      alt: HERO_IMAGE.alt,
      width: HERO_IMAGE.width,
      height: HERO_IMAGE.height,
    };
  }
  return {
    src: HERO_IMAGE.svg,
    alt: HERO_IMAGE.alt,
    width: 640,
    height: 480,
  };
}

/** Kategoriye göre placeholder görsel (WebP varsa öncelikli) */
export function getCategoryImage(category = '') {
  const cat = String(category || '');
  for (const entry of CATEGORY_IMAGE_MAP) {
    if (entry.match.test(cat)) {
      return { image: preferWebpAsset(entry.image), imageAlt: entry.imageAlt };
    }
  }
  return { image: preferWebpAsset(DEFAULT_ARTICLE_IMAGE.image), imageAlt: DEFAULT_ARTICLE_IMAGE.imageAlt };
}

/**
 * Makale görseli: article.image veya kategori fallback.
 * WebP varsa SVG yerine WebP kullanılır. Eksik dosya build'i kırmaz.
 */
/** Hizmet sayfası görseli: service.image veya kategori SVG fallback */
export function resolveServiceImage(service) {
  const fallbackIcon =
    ADANA_LAWYER_SERVICES.find((s) => s.slug === service?.slug)?.icon ||
    '/images/placeholders/hukuk-genel.svg';
  const custom = service?.image?.trim();
  const alt =
    service?.imageAlt?.trim() ||
    ADANA_LAWYER_SERVICES.find((s) => s.slug === service?.slug)?.imageAlt ||
    `${service?.h1 || service?.title || 'Hizmet'} görseli`;

  if (custom) {
    const resolved = preferWebpAsset(custom);
    if (publicAssetExists(resolved)) {
      return { src: resolved, alt };
    }
  }

  const fallback = preferWebpAsset(
    ADANA_LAWYER_SERVICES.find((s) => s.slug === service?.slug)?.image || fallbackIcon
  );
  return { src: publicAssetExists(fallback) ? fallback : fallbackIcon, alt };
}

export function resolveArticleImage(article) {
  const fallback = getCategoryImage(article?.category);
  const custom = article?.image?.trim();
  const alt =
    article?.imageAlt?.trim() ||
    fallback.imageAlt ||
    (article?.title ? `${article.title} görseli` : 'Hukuki bilgilendirme görseli');

  if (custom) {
    const resolvedCustom = preferWebpAsset(custom);
    if (publicAssetExists(resolvedCustom)) {
      return { src: resolvedCustom, alt };
    }
  }

  return { src: fallback.image, alt };
}

/** Yeni makale üretiminde kategoriye göre image alanları (SVG taban yolu) */
export function assignArticleImageFields(article) {
  const cat = String(article.category || article.pillar || '');
  for (const entry of CATEGORY_IMAGE_MAP) {
    if (entry.match.test(cat)) {
      if (!article.image) article.image = entry.image;
      if (!article.imageAlt) article.imageAlt = entry.imageAlt;
      return article;
    }
  }
  if (!article.image) article.image = DEFAULT_ARTICLE_IMAGE.image;
  if (!article.imageAlt) article.imageAlt = DEFAULT_ARTICLE_IMAGE.imageAlt;
  return article;
}

export function loadEnv() {
  const envPath = join(ROOT, '.env');
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }

  return {
    geminiApiKey: process.env.GEMINI_API_KEY?.trim() || '',
    siteUrl: (process.env.SITE_URL || 'https://sumerhukuk.com').replace(/\/$/, ''),
    siteName: process.env.SITE_NAME || 'Sümer Hukuk Bürosu',
    siteDomain: process.env.SITE_DOMAIN || 'sumerhukuk.com',
    defaultLanguage: process.env.DEFAULT_LANGUAGE || 'tr',
    articleAuthor: process.env.ARTICLE_AUTHOR || 'Sümer Hukuk Bürosu',
  };
}

export function slugify(text) {
  const map = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', İ: 'i', Ö: 'o', Ş: 's', Ü: 'u' };
  return text
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function ensureDirs() {
  mkdirSync(ARTICLES_DIR, { recursive: true });
  mkdirSync(SERVICES_DIR, { recursive: true });
  mkdirSync(PAGES_DIR, { recursive: true });
  mkdirSync(PUBLIC_DIR, { recursive: true });
}

function readJsonDir(dir) {
  ensureDirs();
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf-8')));
}

export function readArticles() {
  return readJsonDir(ARTICLES_DIR).sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function readServices() {
  return readJsonDir(SERVICES_DIR);
}

export function readPages() {
  return readJsonDir(PAGES_DIR);
}

export function writeArticle(article) {
  ensureDirs();
  const filePath = join(ARTICLES_DIR, `${article.slug}.json`);
  writeFileSync(filePath, JSON.stringify(article, null, 2) + '\n', 'utf-8');
  return filePath;
}

export function updateSitemap(siteUrl, articles, services = [], pages = []) {
  ensureDirs();
  const today = new Date().toISOString().split('T')[0];

  // Prefer trailing slash on homepage to match live Google canonical (https://sumerhukuk.com/)
  const staticPages = [
    { loc: `${siteUrl}/`, changefreq: 'weekly', priority: '1.0', lastmod: today },
    { loc: `${siteUrl}/makaleler/`, changefreq: 'daily', priority: '0.9', lastmod: today },
    ...pages.map((p) => ({
      loc: `${siteUrl}/${p.slug}/`,
      changefreq: 'monthly',
      priority: '0.7',
      lastmod: p.date || today,
    })),
    ...services.map((s) => ({
      loc: `${siteUrl}/${s.slug}/`,
      changefreq: 'monthly',
      priority: '0.9',
      lastmod: s.date || today,
    })),
  ];

  const articlePages = articles.map((a) => ({
    loc: `${siteUrl}/makaleler/${a.slug}/`,
    changefreq: 'monthly',
    priority: '0.8',
    lastmod: a.date || today,
  }));

  const urls = [...staticPages, ...articlePages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  writeFileSync(SITEMAP_PATH, xml, 'utf-8');
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function markdownToHtml(markdown) {
  let html = markdown
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
      const safeHref = String(href);
      const isExternal = /^https?:\/\//i.test(safeHref);
      const attrs = isExternal
        ? ` href="${safeHref}" target="_blank" rel="noopener noreferrer"`
        : ` href="${safeHref}"`;
      return `<a${attrs}>${label}</a>`;
    });

  const blocks = html.split(/\n\n+/);
  return blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h')) return trimmed;
      if (trimmed.startsWith('<ul>') || trimmed.startsWith('<ol>')) return trimmed;
      if (/^[-*] /.test(trimmed)) {
        const items = trimmed
          .split('\n')
          .filter((l) => /^[-*] /.test(l))
          .map((l) => `<li>${l.replace(/^[-*] /, '')}</li>`)
          .join('');
        return `<ul>${items}</ul>`;
      }
      if (trimmed.startsWith('<')) return trimmed;
      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}

export function findArticlesBySlugs(articles, slugs = []) {
  const map = new Map(articles.map((a) => [a.slug, a]));
  return slugs.map((s) => map.get(s)).filter(Boolean);
}

export function findServicesBySlugs(services, slugs = []) {
  const map = new Map(services.map((s) => [s.slug, s]));
  return slugs.map((s) => map.get(s)).filter(Boolean);
}
