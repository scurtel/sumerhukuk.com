import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { slugify } from './lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');

const pillars = JSON.parse(readFileSync(join(DATA_DIR, 'pillars.json'), 'utf-8'));
const pillarById = Object.fromEntries(pillars.map((p) => [p.id, p]));

function pillarMeta(pillarName) {
  const id = JSON.parse(readFileSync(join(DATA_DIR, 'keyword-taxonomy.json'), 'utf-8')).pillarMapping[
    pillarName
  ];
  const p = pillarById[id] || pillarById['gayrimenkul-hukuku'];
  return { pillar: pillarName, pillarSlug: p.internalLink, pillarId: p.id };
}

function topic(keyword, pillarName, audience = 'taşınmaz sahipleri', priority = 5, titleOverride = null) {
  const title = titleOverride || keyword.charAt(0).toUpperCase() + keyword.slice(1);
  const meta = pillarMeta(pillarName);
  const slug = slugify(title);
  const similarity = slugify(`${meta.pillarId}-${keyword}`).slice(0, 80);
  return {
    title,
    primaryKeyword: keyword,
    secondaryKeywords: [pillarName, audience],
    pillar: meta.pillar,
    pillarSlug: meta.pillarSlug,
    searchIntent: 'informational',
    audience,
    priority,
    suggestedSlug: slug,
    topicSimilarityKey: similarity,
    internalLinks: [meta.pillarSlug, '/makaleler/'],
    isPillar: false,
  };
}

const gayrimenkul = [
  'gayrimenkul hukuku nedir',
  'gayrimenkul avukatı ne iş yapar',
  'gayrimenkul davası nasıl açılır',
  'tapu davası nasıl açılır',
  'tapu iptal ve tescil davası',
  'tapu iptal davası ne kadar sürer',
  'tapuda hisse devri nasıl yapılır',
  'hisseli tapu satışı',
  'hisseli tapuda anlaşmazlık',
  'hisseli tapu nasıl satılır',
  'aile içinde tapu devri',
  'taşınmaz satış vaadi sözleşmesi',
  'tapu kaydının düzeltilmesi davası',
  'kadastro tespitine itiraz',
  'arsa payı uyuşmazlığı',
  'arsa tapusu sorunları',
  'taşınmazın tahliyesi',
  'ecrimisil davası',
  'haksız işgal tazminatı',
  'gayrimenkul alım satımında hukuki riskler',
].map((k) => topic(k, 'Gayrimenkul Hukuku'));

const ortaklik = [
  'ortaklığın giderilmesi davası nedir',
  'izale-i şuyu davası nedir',
  'ortaklığın giderilmesi davası nasıl açılır',
  'ortaklığın giderilmesi davasını kim açabilir',
  'ortaklığın giderilmesi davası ne kadar sürer',
  'ortaklığın giderilmesi davasında satış nasıl yapılır',
  'ortaklığın giderilmesi davasında açık artırma',
  'ortaklığın giderilmesi davasında masraflar',
  'ortaklığın giderilmesi davasında avukatlık ücreti',
  'ortaklığın giderilmesi davasında bilirkişi',
  'ortaklığın giderilmesi davasında kıymet takdiri',
  'ortaklığın giderilmesi davasında istinaf',
  'ortaklığın giderilmesi davasında karar sonrası süreç',
  'ortaklığın giderilmesi davasında satış bedeli nasıl paylaşılır',
  'ortaklığın giderilmesi davasında paydaşlardan biri almak isterse',
  'ortaklığın giderilmesi davasında aynen taksim',
  'ortaklığın giderilmesi davasında satış suretiyle paylaşım',
  'hisseli taşınmazda ortaklığın giderilmesi',
  'hisseli evde ortaklığın giderilmesi',
  'hisseli arsada ortaklığın giderilmesi',
  'hisseli tarlada ortaklığın giderilmesi',
  'miras kalan evde ortaklığın giderilmesi',
  'miras kalan arsada ortaklığın giderilmesi',
  'miras kalan tarlada ortaklığın giderilmesi',
  'kardeşler arasında ortaklığın giderilmesi',
  'mirasçılar arasında izale-i şuyu',
  'paylı mülkiyette ortaklığın giderilmesi',
  'elbirliği mülkiyetinde ortaklığın giderilmesi',
  'ortaklığın giderilmesi davasında anlaşma mümkün mü',
  'ortaklığın giderilmesi davası açılmadan satış yapılabilir mi',
].map((k) => topic(k, 'Ortaklığın Giderilmesi Davası', 'paydaşlar', 7));

const miras = [
  'miras hukuku nedir',
  'miras paylaşımı nasıl yapılır',
  'miras kalan ev nasıl paylaşılır',
  'miras kalan arsa nasıl paylaşılır',
  'miras kalan tarla nasıl paylaşılır',
  'mirasçılar anlaşamazsa ne olur',
  'miras kalan taşınmaz nasıl satılır',
  'miras kalan ev satılabilir mi',
  'miras kalan taşınmazda hissedarların hakları',
  'miras ortaklığı nasıl sona erer',
  'miras ortaklığının giderilmesi',
  'mirasçılar arasında mal paylaşımı',
  'kardeşler arasında miras anlaşmazlığı',
  'miras paylaşım davası',
  'miras kalan malın satışı',
  'miras kalan taşınmazda ecrimisil',
  'mirasçının taşınmazı kullanması',
  'miras kalan evde oturan mirasçı',
  'miras kalan evden kira alınması',
  'miras kalan taşınmazın değer tespiti',
  'muris muvazaası davası',
  'mirastan mal kaçırma',
  'saklı pay davası',
  'tenkis davası',
  'vasiyetnamenin iptali davası',
  'mirasın reddi',
  'mirasçılık belgesi nasıl alınır',
  'veraset ilamı nedir',
  'intikal işlemleri nasıl yapılır',
  'tapuda miras intikali',
].map((k) => topic(k, 'Miras Hukuku', 'mirasçılar', 7));

const malPaylasimi = [
  'boşanmada mal paylaşımı nasıl yapılır',
  'boşanmada ev paylaşımı',
  'boşanmada araba paylaşımı',
  'boşanmada arsa paylaşımı',
  'boşanmada şirket hissesi paylaşımı',
  'boşanmada banka hesabı paylaşımı',
  'boşanmada ziynet eşyası',
  'mal rejiminin tasfiyesi davası',
  'katılma alacağı davası',
  'değer artış payı alacağı',
  'katkı payı alacağı',
  'edinilmiş mal nedir',
  'kişisel mal nedir',
  'evlilikten önce alınan ev paylaşılır mı',
  'evlilik içinde alınan ev kime ait olur',
  'krediyle alınan ev boşanmada nasıl paylaşılır',
  'eş adına kayıtlı evde diğer eşin hakkı',
  'boşanmada tapu kimin üzerindeyse ev onun mu',
  'boşanmada mal kaçırma',
  'boşanmadan önce mal devri',
  'boşanma davası devam ederken mal satışı',
  'anlaşmalı boşanmada mal paylaşımı',
  'çekişmeli boşanmada mal paylaşımı',
  'mal paylaşımı davası ne zaman açılır',
  'mal paylaşımı davası ne kadar sürer',
  'mal paylaşımı davasında zamanaşımı',
  'boşanmada miras kalan mal paylaşılır mı',
  'boşanmada aileden kalan ev paylaşılır mı',
  'boşanmada şirket malları paylaşılır mı',
  'boşanmada emekli ikramiyesi paylaşılır mı',
].map((k) => topic(k, 'Boşanmada Mal Paylaşımı', 'eşler', 6));

const localSeo = [
  ['Adana gayrimenkul avukatı', 'Gayrimenkul Hukuku'],
  ['Adana ortaklığın giderilmesi avukatı', 'Ortaklığın Giderilmesi Davası'],
  ['Adana izale-i şuyu avukatı', 'İzale-i Şuyu Davası'],
  ['Adana miras avukatı', 'Miras Hukuku'],
  ['Adana mal paylaşımı avukatı', 'Boşanmada Mal Paylaşımı'],
  ['Adana tapu davası avukatı', 'Tapu İptal ve Tescil Davası'],
  ['Adana miras kalan taşınmaz davası', 'Miras Kalan Taşınmazlar'],
  ['Adana hisseli tapu davası', 'Gayrimenkul Hukuku'],
  ['Adana boşanmada mal paylaşımı', 'Boşanmada Mal Paylaşımı'],
  ['Adana gayrimenkul miras avukatı', 'Miras Hukuku'],
].map(([k, p]) => topic(k, p, 'taşınmaz sahipleri', 8));

const pillarTopics = pillars.map((p) => ({
  title: p.title,
  primaryKeyword: p.primaryKeyword,
  secondaryKeywords: [p.pillar, p.category],
  pillar: p.pillar,
  pillarSlug: p.internalLink,
  searchIntent: 'informational',
  audience: 'taşınmaz sahipleri',
  priority: p.priority,
  suggestedSlug: p.suggestedSlug,
  topicSimilarityKey: slugify(`pillar-${p.id}`),
  internalLinks: [p.internalLink, '/makaleler/'],
  isPillar: true,
}));

const allTopics = [...pillarTopics, ...gayrimenkul, ...ortaklik, ...miras, ...malPaylasimi, ...localSeo];

const seen = new Set();
const unique = [];
for (const t of allTopics) {
  const key = t.topicSimilarityKey;
  if (seen.has(key)) continue;
  seen.add(key);
  unique.push(t);
}

mkdirSync(DATA_DIR, { recursive: true });
writeFileSync(join(DATA_DIR, 'article-topics.json'), JSON.stringify(unique, null, 2) + '\n', 'utf-8');
console.log(`article-topics.json oluşturuldu: ${unique.length} konu`);
