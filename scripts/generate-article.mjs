import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  loadEnv,
  readArticles,
  readServices,
  readPages,
  writeArticle,
  updateSitemap,
  slugify,
  assignArticleImageFields,
} from './lib.mjs';
import { pickNextTopic, readAllExistingArticles } from './topic-utils.mjs';

const PROHIBITED_PHRASES = [
  'en iyi avukat',
  'garantili sonuç',
  'kesin kazanılır',
  'kesin kazanır',
  'en başarılı',
  '%100 başarı',
  'mutlaka kazanırsınız',
];

const DRY_RUN = process.argv.includes('--dry-run-topic');

function buildPrompt(topicMeta, env) {
  const wordTarget = topicMeta.isPillar ? '1500-2500' : '900-1400';
  const internalLinks = (topicMeta.internalLinks || [])
    .map((l) => `- ${l}`)
    .join('\n');

  return `Sen Türkiye'de gayrimenkul, miras, tapu ve aile hukuku alanında uzman bir hukuk içerik yazarısın.
"${env.siteName}" web sitesi için SEO uyumlu, bilgilendirici bir Türkçe hukuk makalesi yaz.

KONU BAŞLIĞI: ${topicMeta.title}
PRIMARY KEYWORD: ${topicMeta.primaryKeyword}
SECONDARY KEYWORDS: ${(topicMeta.secondaryKeywords || []).join(', ')}
PILLAR ALAN: ${topicMeta.pillar}
HEDEF KİTLE: ${topicMeta.audience || 'genel okuyucu'}
ARAMA NİYETİ: ${topicMeta.searchIntent || 'informational'}

İÇ LİNK ÖNERİLERİ (body içinde doğal şekilde kullan):
${internalLinks}

KURALLAR:
- Makale tamamen Türkçe olmalı.
- Avukatlık reklam yasağına uygun, bilgilendirici ve tarafsız bir dil kullan.
- Şu ifadeleri ve benzerlerini ASLA kullanma: "en iyi avukat", "garantili sonuç", "kesin kazanılır", "en başarılı".
- Kesin sonuç vaat etme; "Her somut olay farklıdır" uyarısını doğal şekilde ekle.
- Keyword stuffing yapma; entity bazlı, anlaşılır ve profesyonel yaz.
- Adana bağlamına uygun örnekler verebilirsin.
- Makale ${wordTarget} kelime civarında olsun.
- body Markdown formatında olsun (## ve ### başlıklar).

BODY YAPISI:
1. Kısa giriş
2. Hukuki çerçeve
3. Süreç anlatımı (H2/H3)
4. Pratik örnek
5. Sık yapılan hatalar
6. Hukuki destek neden önemlidir (abartısız, bilgilendirici)
7. Sonuç

- En az 5 FAQ sorusu ekle.
- Pillar sayfasına en az 1 iç link ver: ${topicMeta.pillarSlug || '/makaleler/'}

Yanıtını YALNIZCA geçerli JSON olarak ver. Başka metin veya markdown code fence ekleme.

JSON şeması:
{
  "title": "SEO title",
  "slug": "url-dostu-slug",
  "description": "150-160 karakter meta description",
  "excerpt": "2-3 cümle özet",
  "category": "Kategori adı",
  "tags": ["etiket1", "etiket2"],
  "body": "Markdown makale içeriği",
  "faq": [
    { "question": "Soru?", "answer": "Cevap." }
  ],
  "internalLinkSuggestions": ["/ornek-link/"]
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

function validateArticle(data, topicMeta) {
  const required = ['title', 'slug', 'description', 'category', 'tags', 'body', 'faq'];
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`Gemini yanıtında eksik alan: ${field}`);
    }
  }

  if (!Array.isArray(data.tags) || data.tags.length === 0) {
    throw new Error('tags alanı geçerli bir dizi olmalı.');
  }

  if (!Array.isArray(data.faq) || data.faq.length < 4) {
    throw new Error('faq alanı en az 4 soru içermeli.');
  }

  const combined = `${data.title} ${data.description} ${data.body}`.toLowerCase();
  for (const phrase of PROHIBITED_PHRASES) {
    if (combined.includes(phrase)) {
      throw new Error(`Yasaklı ifade tespit edildi: "${phrase}"`);
    }
  }

  data.slug = slugify(data.slug || topicMeta.suggestedSlug || data.title);
  data.sourceTopic = topicMeta.title;
  data.primaryKeyword = topicMeta.primaryKeyword;
  data.secondaryKeywords = topicMeta.secondaryKeywords || [];
  data.pillar = topicMeta.pillar;
  data.pillarSlug = topicMeta.pillarSlug;
  data.topicSimilarityKey = topicMeta.topicSimilarityKey;
  data.topicSource = topicMeta.source;
  data.searchIntent = topicMeta.searchIntent;
  data.audience = topicMeta.audience;
  data.isPillar = topicMeta.isPillar || false;
  data.date = new Date().toISOString().split('T')[0];

  if (!data.excerpt) {
    data.excerpt = data.description;
  }

  const links = new Set([...(topicMeta.internalLinks || []), ...(data.internalLinkSuggestions || [])]);
  data.internalLinks = [...links];
  data.relatedArticles = (data.internalLinkSuggestions || [])
    .filter((l) => l.startsWith('/makaleler/'))
    .map((l) => l.replace('/makaleler/', '').replace(/\/$/, ''));

  const pillarServiceMap = {
    'Gayrimenkul Hukuku': 'adana-gayrimenkul-avukati',
    'Ortaklığın Giderilmesi Davası': 'ortakligin-giderilmesi-davasi',
    'İzale-i Şuyu Davası': 'izale-i-suyu-davasi',
    'Miras Hukuku': 'adana-miras-avukati',
    'Miras Kalan Taşınmazlar': 'adana-miras-avukati',
    'Tapu İptal ve Tescil Davası': 'tapu-iptal-ve-tescil-davasi',
    'Boşanmada Mal Paylaşımı': 'adana-gayrimenkul-avukati',
    'Mal Rejiminin Tasfiyesi': 'adana-gayrimenkul-avukati',
    'Paylı Mülkiyet ve Elbirliği Mülkiyeti': 'adana-gayrimenkul-avukati',
  };
  const serviceSlug = pillarServiceMap[topicMeta.pillar];
  data.relatedServices = serviceSlug ? [serviceSlug] : [];

  assignArticleImageFields(data);

  return data;
}

async function generateWithGemini(apiKey, prompt) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const searchEnabled = process.env.GEMINI_GOOGLE_SEARCH_ENABLED === 'true';
  const model = genAI.getGenerativeModel({
    model: modelName,
    tools: searchEnabled ? [{ googleSearch: {} }] : undefined,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const data = parseGeminiJson(text);

  const gm =
    result?.response?.candidates?.[0]?.groundingMetadata ||
    result?.response?.groundingMetadata;
  if (gm?.groundingChunks?.length && data?.body) {
    const sources = gm.groundingChunks
      .map((chunk) => ({
        title: chunk.web?.title || chunk.retrievedContext?.title || null,
        url: chunk.web?.uri || chunk.retrievedContext?.uri || null,
      }))
      .filter((s) => s.url);
    if (sources.length) {
      const lines = sources.map(
        (s, i) => `- [${s.title || `Kaynak ${i + 1}`}](${s.url})`
      );
      data.body = `${String(data.body).trim()}\n\n## Kaynaklar\n\n${lines.join('\n')}\n`;
    }
  }

  return data;
}

async function main() {
  const env = loadEnv();
  const existingArticles = readAllExistingArticles();
  const topicMeta = pickNextTopic(existingArticles);

  console.log('Seçilen konu bilgileri:');
  console.log(`  title: ${topicMeta.title}`);
  console.log(`  primaryKeyword: ${topicMeta.primaryKeyword}`);
  console.log(`  pillar: ${topicMeta.pillar}`);
  console.log(`  source: ${topicMeta.source}`);

  if (DRY_RUN) {
    console.log('\nDry-run modu: API çağrısı yapılmadı.');
    return;
  }

  if (!env.geminiApiKey) {
    console.error(
      'Hata: GEMINI_API_KEY bulunamadı.\n' +
        'Lütfen proje kökünde .env dosyası oluşturup GEMINI_API_KEY değerini ekleyin.\n' +
        'GitHub Actions için secret olarak GEMINI_API_KEY tanımlayın.\n' +
        'Örnek için .env.example dosyasına bakın.'
    );
    process.exit(1);
  }

  console.log('Gemini API ile makale üretiliyor...');

  let article;
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const raw = await generateWithGemini(env.geminiApiKey, buildPrompt(topicMeta, env));
      article = validateArticle(raw, topicMeta);

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
  const services = readServices();
  const pages = readPages();
  updateSitemap(env.siteUrl, allArticles, services, pages);
  console.log('sitemap.xml güncellendi.');

  console.log(`\nBaşlık: ${article.title}`);
  console.log(`Slug: ${article.slug}`);
  console.log(`Kategori: ${article.category}`);
  console.log(`Pillar: ${article.pillar}`);
}

main().catch((err) => {
  console.error('Beklenmeyen hata:', err.message);
  process.exit(1);
});
