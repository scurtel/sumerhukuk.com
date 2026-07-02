import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  loadEnv,
  readArticles,
  writeArticle,
  updateSitemap,
  slugify,
} from './lib.mjs';

const TOPIC_POOL = [
  "Adana'da ortaklığın giderilmesi davası nasıl açılır?",
  'Tapu iptal ve tescil davası hangi durumlarda açılır?',
  'Miras kalan taşınmazın satışı nasıl yapılır?',
  'Hisseli tapuda ortaklığın giderilmesi',
  'İzale-i şuyu davasında satış süreci',
  'Muris muvazaası nedeniyle tapu iptal davası',
  'Adana gayrimenkul avukatı hangi davalara bakar?',
  'Tapu kayıtlarında hata varsa ne yapılır?',
  'Mirasçılar arasında taşınmaz paylaşımı',
  'Paylı mülkiyet ve elbirliği mülkiyeti arasındaki fark',
  'Hisseli taşınmazda satışa itiraz edilebilir mi?',
  'Miras kalan evde oturan mirasçının hukuki durumu',
  'Tapuda isim yanlışlığı nasıl düzeltilir?',
  'Ortaklığın giderilmesi davasında açık artırma süreci',
  "Adana'da tapu ve miras uyuşmazlıklarında dava süreci",
];

const PROHIBITED_PHRASES = [
  'en iyi avukat',
  'garantili sonuç',
  'kesin kazanılır',
  'kesin kazanır',
  '%100 başarı',
  'mutlaka kazanırsınız',
];

function normalizeTopic(text) {
  return text
    .toLowerCase()
    .replace(/[''"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getUsedTopics(articles) {
  const used = new Set();
  for (const article of articles) {
    if (article.sourceTopic) {
      used.add(normalizeTopic(article.sourceTopic));
    }
    used.add(normalizeTopic(article.title));
    if (article.slug) {
      used.add(normalizeTopic(article.slug.replace(/-/g, ' ')));
    }
  }
  return used;
}

function pickNextTopic(articles) {
  const used = getUsedTopics(articles);
  const available = TOPIC_POOL.filter((topic) => !used.has(normalizeTopic(topic)));

  if (available.length === 0) {
    console.error('Hata: Tüm konu havuzu kullanıldı. Yeni konu eklenmeden makale üretilemez.');
    process.exit(1);
  }

  const index = Math.floor(Math.random() * available.length);
  return available[index];
}

function buildPrompt(topic, env) {
  return `Sen Türkiye'de gayrimenkul ve miras hukuku alanında uzman bir hukuk içerik yazarısın.
"${env.siteName}" web sitesi için SEO uyumlu, bilgilendirici bir Türkçe hukuk makalesi yaz.

KONU: ${topic}

KURALLAR:
- Makale tamamen Türkçe olmalı.
- Avukatlık reklam yasağına uygun, bilgilendirici ve tarafsız bir dil kullan.
- Şu ifadeleri ve benzerlerini ASLA kullanma: "en iyi avukat", "garantili sonuç", "kesin kazanılır", "kesin kazanır", "%100 başarı".
- Hukuki süreçleri açıkla; kişiye özel hukuki tavsiye verme.
- Adana ve çevresi gayrimenkul hukuku bağlamına uygun örnekler verebilirsin.
- Makale 800-1200 kelime civarında olsun.
- body alanı Markdown formatında olsun (## ve ### başlıklar, paragraflar).
- En az 4, en fazla 6 FAQ sorusu ekle.
- category: gayrimenkul hukuku, miras hukuku, tapu davaları veya ortaklığın giderilmesi gibi uygun bir kategori seç.
- tags: 4-6 adet SEO uyumlu etiket.
- slug: URL dostu, Türkçe karakter içermeyen, tire ile ayrılmış.

Yanıtını YALNIZCA geçerli JSON olarak ver. Başka metin, açıklama veya markdown code fence ekleme.

JSON şeması:
{
  "title": "SEO uyumlu makale başlığı",
  "slug": "url-dostu-slug",
  "description": "150-160 karakter meta açıklama",
  "category": "Kategori adı",
  "tags": ["etiket1", "etiket2"],
  "body": "Markdown makale içeriği",
  "faq": [
    { "question": "Soru?", "answer": "Cevap." }
  ]
}`;
}

function parseGeminiJson(text) {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  return JSON.parse(cleaned);
}

function validateArticle(data, topic) {
  const required = ['title', 'slug', 'description', 'category', 'tags', 'body', 'faq'];
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`Gemini yanıtında eksik alan: ${field}`);
    }
  }

  if (!Array.isArray(data.tags) || data.tags.length === 0) {
    throw new Error('tags alanı geçerli bir dizi olmalı.');
  }

  if (!Array.isArray(data.faq) || data.faq.length === 0) {
    throw new Error('faq alanı geçerli bir dizi olmalı.');
  }

  const combined = `${data.title} ${data.description} ${data.body}`.toLowerCase();
  for (const phrase of PROHIBITED_PHRASES) {
    if (combined.includes(phrase)) {
      throw new Error(`Yasaklı ifade tespit edildi: "${phrase}"`);
    }
  }

  data.slug = slugify(data.slug || data.title);
  data.sourceTopic = topic;
  data.date = new Date().toISOString().split('T')[0];

  return data;
}

async function generateWithGemini(apiKey, prompt) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseGeminiJson(text);
}

async function main() {
  const env = loadEnv();

  if (!env.geminiApiKey) {
    console.error(
      'Hata: GEMINI_API_KEY bulunamadı.\n' +
        'Lütfen proje kökünde .env dosyası oluşturup GEMINI_API_KEY değerini ekleyin.\n' +
        'Örnek için .env.example dosyasına bakın.'
    );
    process.exit(1);
  }

  const existingArticles = readArticles();
  const topic = pickNextTopic(existingArticles);

  console.log(`Seçilen konu: ${topic}`);
  console.log('Gemini API ile makale üretiliyor...');

  let article;
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const raw = await generateWithGemini(env.geminiApiKey, buildPrompt(topic, env));
      article = validateArticle(raw, topic);

      const duplicate = existingArticles.some((a) => a.slug === article.slug);
      if (duplicate) {
        article.slug = `${article.slug}-${Date.now()}`;
      }

      break;
    } catch (err) {
      lastError = err;
      console.warn(`Deneme ${attempt}/3 başarısız: ${err.message}`);
    }
  }

  if (!article) {
    console.error(`Makale üretilemedi: ${lastError?.message}`);
    process.exit(1);
  }

  article.author = env.articleAuthor;

  const filePath = writeArticle(article);
  console.log(`Makale kaydedildi: ${filePath}`);

  const allArticles = readArticles();
  updateSitemap(env.siteUrl, allArticles);
  console.log('sitemap.xml güncellendi.');

  console.log(`\nBaşlık: ${article.title}`);
  console.log(`Slug: ${article.slug}`);
  console.log(`Kategori: ${article.category}`);
}

main().catch((err) => {
  console.error('Beklenmeyen hata:', err.message);
  process.exit(1);
});
