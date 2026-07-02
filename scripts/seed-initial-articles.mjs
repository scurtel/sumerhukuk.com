import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ARTICLES_DIR = join(ROOT, 'content', 'articles');

mkdirSync(ARTICLES_DIR, { recursive: true });

const topics = [
  {
    title: "Adana'da Ortaklığın Giderilmesi Davası Nasıl Açılır?",
    slug: 'adanada-ortakligin-giderilmesi-davasi-nasil-acilir',
    sourceTopic: "Adana'da ortaklığın giderilmesi davası nasıl açılır?",
    category: 'Ortaklığın Giderilmesi',
    tags: ['adana ortaklığın giderilmesi', 'izale-i şuyu', 'hisseli tapu', 'paydaşlık', 'sulh hukuk mahkemesi'],
    relatedServices: ['ortakligin-giderilmesi-davasi', 'izale-i-suyu-davasi', 'adana-gayrimenkul-avukati'],
    relatedArticles: ['hisseli-tapuda-ortakligin-giderilmesi', 'izale-i-suyu-davasinda-satis-sureci'],
    date: '2026-05-01',
  },
  {
    title: 'Tapu İptal ve Tescil Davası Hangi Durumlarda Açılır?',
    slug: 'tapu-iptal-ve-tescil-davasi-hangi-durumlarda-acilir',
    sourceTopic: 'Tapu iptal ve tescil davası hangi durumlarda açılır?',
    category: 'Tapu Davaları',
    tags: ['tapu iptal', 'tescil davası', 'adana tapu avukatı', 'muris muvazaası', 'yolsuz tescil'],
    relatedServices: ['tapu-iptal-ve-tescil-davasi', 'adana-tapu-avukati', 'adana-gayrimenkul-avukati'],
    relatedArticles: ['muris-muvazaasi-nedeniyle-tapu-iptal-davasi', 'tapu-kayitlarinda-hata-varsa-ne-yapilir'],
    date: '2026-05-03',
  },
  {
    title: 'Miras Kalan Taşınmazın Satışı Nasıl Yapılır?',
    slug: 'miras-kalan-tasinmazin-satisi-nasil-yapilir',
    sourceTopic: 'Miras kalan taşınmazın satışı nasıl yapılır?',
    category: 'Miras Hukuku',
    tags: ['miras kalan taşınmaz', 'miras paylaşımı', 'elbirliği mülkiyeti', 'adana miras avukatı', 'satış işlemleri'],
    relatedServices: ['adana-miras-avukati', 'adana-gayrimenkul-avukati', 'ortakligin-giderilmesi-davasi'],
    relatedArticles: ['mirascilar-arasinda-tasinmaz-paylasimi', 'payli-mulkiyet-ve-elbirligi-mulkiyeti-arasindaki-fark'],
    date: '2026-05-05',
  },
  {
    title: 'Hisseli Tapuda Ortaklığın Giderilmesi',
    slug: 'hisseli-tapuda-ortakligin-giderilmesi',
    sourceTopic: 'Hisseli tapuda ortaklığın giderilmesi',
    category: 'Ortaklığın Giderilmesi',
    tags: ['hisseli tapu', 'paydaş', 'izale-i şuyu', 'adana ortaklığın giderilmesi avukatı', 'satış ve paylaşım'],
    relatedServices: ['ortakligin-giderilmesi-davasi', 'izale-i-suyu-davasi', 'adana-tapu-avukati'],
    relatedArticles: ['ortakligin-giderilmesi-davasinda-acik-artirma-sureci', 'hisseli-tasinmazda-satisa-itiraz-edilebilir-mi'],
    date: '2026-05-07',
  },
  {
    title: 'İzale-i Şuyu Davasında Satış Süreci',
    slug: 'izale-i-suyu-davasinda-satis-sureci',
    sourceTopic: 'İzale-i şuyu davasında satış süreci',
    category: 'İzale-i Şuyu',
    tags: ['izale-i şuyu', 'açık artırma', 'satış memurluğu', 'hisseli taşınmaz', 'adana izale-i şuyu avukatı'],
    relatedServices: ['izale-i-suyu-davasi', 'ortakligin-giderilmesi-davasi', 'adana-gayrimenkul-avukati'],
    relatedArticles: ['ortakligin-giderilmesi-davasinda-acik-artirma-sureci', 'adanada-ortakligin-giderilmesi-davasi-nasil-acilir'],
    date: '2026-05-09',
  },
  {
    title: 'Muris Muvazaası Nedeniyle Tapu İptal Davası',
    slug: 'muris-muvazaasi-nedeniyle-tapu-iptal-davasi',
    sourceTopic: 'Muris muvazaası nedeniyle tapu iptal davası',
    category: 'Tapu Davaları',
    tags: ['muris muvazaası', 'tapu iptal', 'mirasçının hakları', 'adana tapu iptal ve tescil avukatı', 'asliye hukuk'],
    relatedServices: ['tapu-iptal-ve-tescil-davasi', 'adana-miras-avukati', 'adana-tapu-avukati'],
    relatedArticles: ['tapu-iptal-ve-tescil-davasi-hangi-durumlarda-acilir', 'adanada-tapu-ve-miras-uyusmazliklarinda-dava-sureci'],
    date: '2026-05-11',
  },
  {
    title: 'Adana Gayrimenkul Avukatı Hangi Davalara Bakar?',
    slug: 'adana-gayrimenkul-avukati-hangi-davalara-bakar',
    sourceTopic: 'Adana gayrimenkul avukatı hangi davalara bakar?',
    category: 'Gayrimenkul Hukuku',
    tags: ['adana gayrimenkul avukatı', 'taşınmaz davaları', 'tapu uyuşmazlığı', 'miras taşınmaz', 'ortaklığın giderilmesi'],
    relatedServices: ['adana-gayrimenkul-avukati', 'adana-tapu-avukati', 'adana-miras-avukati'],
    relatedArticles: ['tapu-kayitlarinda-hata-varsa-ne-yapilir', 'miras-kalan-tasinmazin-satisi-nasil-yapilir'],
    date: '2026-05-13',
  },
  {
    title: 'Tapu Kayıtlarında Hata Varsa Ne Yapılır?',
    slug: 'tapu-kayitlarinda-hata-varsa-ne-yapilir',
    sourceTopic: 'Tapu kayıtlarında hata varsa ne yapılır?',
    category: 'Tapu Davaları',
    tags: ['tapu kayıt hatası', 'isim yanlışlığı', 'düzeltme davası', 'adana tapu avukatı', 'tapu sicili'],
    relatedServices: ['adana-tapu-avukati', 'tapu-iptal-ve-tescil-davasi', 'adana-gayrimenkul-avukati'],
    relatedArticles: ['tapuda-isim-yanlisligi-nasil-duzeltilir', 'tapu-iptal-ve-tescil-davasi-hangi-durumlarda-acilir'],
    date: '2026-05-15',
  },
  {
    title: 'Mirasçılar Arasında Taşınmaz Paylaşımı',
    slug: 'mirascilar-arasinda-tasinmaz-paylasimi',
    sourceTopic: 'Mirasçılar arasında taşınmaz paylaşımı',
    category: 'Miras Hukuku',
    tags: ['miras paylaşımı', 'elbirliği mülkiyeti', 'taşınmaz devri', 'adana miras avukatı', 'taksim'],
    relatedServices: ['adana-miras-avukati', 'ortakligin-giderilmesi-davasi', 'adana-gayrimenkul-avukati'],
    relatedArticles: ['miras-kalan-evde-oturan-mirascinin-hukuki-durumu', 'miras-kalan-tasinmazin-satisi-nasil-yapilir'],
    date: '2026-05-17',
  },
  {
    title: 'Paylı Mülkiyet ve Elbirliği Mülkiyeti Arasındaki Fark',
    slug: 'payli-mulkiyet-ve-elbirligi-mulkiyeti-arasindaki-fark',
    sourceTopic: 'Paylı mülkiyet ve elbirliği mülkiyeti arasındaki fark',
    category: 'Gayrimenkul Hukuku',
    tags: ['paylı mülkiyet', 'elbirliği mülkiyeti', 'miras ortaklığı', 'hisseli taşınmaz', 'adana gayrimenkul avukatı'],
    relatedServices: ['adana-gayrimenkul-avukati', 'adana-miras-avukati', 'ortakligin-giderilmesi-davasi'],
    relatedArticles: ['mirascilar-arasinda-tasinmaz-paylasimi', 'hisseli-tapuda-ortakligin-giderilmesi'],
    date: '2026-05-19',
  },
  {
    title: 'Hisseli Taşınmazda Satışa İtiraz Edilebilir mi?',
    slug: 'hisseli-tasinmazda-satisa-itiraz-edilebilir-mi',
    sourceTopic: 'Hisseli taşınmazda satışa itiraz edilebilir mi?',
    category: 'İzale-i Şuyu',
    tags: ['hisseli taşınmaz satışı', 'satışa itiraz', 'ihale süreci', 'izale-i şuyu', 'adana ortaklığın giderilmesi avukatı'],
    relatedServices: ['izale-i-suyu-davasi', 'ortakligin-giderilmesi-davasi', 'adana-tapu-avukati'],
    relatedArticles: ['izale-i-suyu-davasinda-satis-sureci', 'ortakligin-giderilmesi-davasinda-acik-artirma-sureci'],
    date: '2026-05-21',
  },
  {
    title: 'Miras Kalan Evde Oturan Mirasçının Hukuki Durumu',
    slug: 'miras-kalan-evde-oturan-mirascinin-hukuki-durumu',
    sourceTopic: 'Miras kalan evde oturan mirasçının hukuki durumu',
    category: 'Miras Hukuku',
    tags: ['miras kalan ev', 'intifa ve kullanım', 'ecrimisil', 'adana miras avukatı', 'miras uyuşmazlığı'],
    relatedServices: ['adana-miras-avukati', 'ortakligin-giderilmesi-davasi', 'adana-gayrimenkul-avukati'],
    relatedArticles: ['mirascilar-arasinda-tasinmaz-paylasimi', 'miras-kalan-tasinmazin-satisi-nasil-yapilir'],
    date: '2026-05-23',
  },
  {
    title: 'Tapuda İsim Yanlışlığı Nasıl Düzeltilir?',
    slug: 'tapuda-isim-yanlisligi-nasil-duzeltilir',
    sourceTopic: 'Tapuda isim yanlışlığı nasıl düzeltilir?',
    category: 'Tapu Davaları',
    tags: ['tapu isim yanlışlığı', 'nüfus kaydı', 'tapu düzeltme', 'adana tapu avukatı', 'sicil müdürlüğü'],
    relatedServices: ['adana-tapu-avukati', 'tapu-iptal-ve-tescil-davasi', 'adana-gayrimenkul-avukati'],
    relatedArticles: ['tapu-kayitlarinda-hata-varsa-ne-yapilir', 'tapu-iptal-ve-tescil-davasi-hangi-durumlarda-acilir'],
    date: '2026-05-25',
  },
  {
    title: 'Ortaklığın Giderilmesi Davasında Açık Artırma Süreci',
    slug: 'ortakligin-giderilmesi-davasinda-acik-artirma-sureci',
    sourceTopic: 'Ortaklığın giderilmesi davasında açık artırma süreci',
    category: 'Ortaklığın Giderilmesi',
    tags: ['açık artırma', 'satış memurluğu', 'ortaklığın giderilmesi', 'paydaş hakları', 'adana izale-i şuyu avukatı'],
    relatedServices: ['ortakligin-giderilmesi-davasi', 'izale-i-suyu-davasi', 'adana-gayrimenkul-avukati'],
    relatedArticles: ['izale-i-suyu-davasinda-satis-sureci', 'hisseli-tasinmazda-satisa-itiraz-edilebilir-mi'],
    date: '2026-05-27',
  },
  {
    title: "Adana'da Tapu ve Miras Uyuşmazlıklarında Dava Süreci",
    slug: 'adanada-tapu-ve-miras-uyusmazliklarinda-dava-sureci',
    sourceTopic: "Adana'da tapu ve miras uyuşmazlıklarında dava süreci",
    category: 'Gayrimenkul ve Miras Hukuku',
    tags: ['adana tapu avukatı', 'adana miras avukatı', 'dava süreci', 'deliller', 'mahkeme aşamaları'],
    relatedServices: ['adana-gayrimenkul-avukati', 'adana-tapu-avukati', 'adana-miras-avukati'],
    relatedArticles: ['muris-muvazaasi-nedeniyle-tapu-iptal-davasi', 'mirascilar-arasinda-tasinmaz-paylasimi'],
    date: '2026-05-29',
  },
];

const prohibited = ['en iyi avukat', 'kesin kazanılır', 'garantili sonuç', 'en başarılı'];

const serviceLinks = [
  '[Adana gayrimenkul avukatı](/adana-gayrimenkul-avukati/)',
  '[Adana tapu avukatı](/adana-tapu-avukati/)',
  '[Adana miras avukatı](/adana-miras-avukati/)',
  '[ortaklığın giderilmesi davası](/ortakligin-giderilmesi-davasi/)',
  '[izale-i şuyu davası](/izale-i-suyu-davasi/)',
  '[tapu iptal ve tescil davası](/tapu-iptal-ve-tescil-davasi/)',
];

function articleBody(topic, index) {
  const linkA = serviceLinks[index % serviceLinks.length];
  const linkB = serviceLinks[(index + 2) % serviceLinks.length];
  const linkC = serviceLinks[(index + 4) % serviceLinks.length];
  const relatedOne = topics[(index + 1) % topics.length].slug;
  const relatedTwo = topics[(index + 3) % topics.length].slug;

  return `## Konunun Hukuki Çerçevesi

${topic} başlığı, taşınmaz mülkiyeti ve miras hukukunun kesiştiği alanlarda en sık karşılaşılan uyuşmazlıklar arasında yer alır. Özellikle Adana gibi taşınmaz devirlerinin yoğun olduğu illerde, hak sahiplerinin dava açmadan önce süreci doğru planlaması önemlidir. Bu noktada usul kurallarının ve sürelerin bilinmesi, hak kaybı riskini azaltır.

Uygulamada bir uyuşmazlığın çözümü; tapu kayıtları, nüfus kayıtları, veraset belgeleri, bilirkişi incelemeleri ve gerektiğinde keşif gibi delillerle yürütülür. Dava yoluna gidilmeden önce uzlaşma seçenekleri ve idari başvuru imkanları da değerlendirilebilir. Ancak taraflar arasında anlaşma sağlanamadığında mahkeme süreci gündeme gelir.

## Dava Öncesi Hazırlık Aşaması

### Belgelerin Toplanması

Dava açılmadan önce tapu kayıt örnekleri, taşınmazın güncel takyidat bilgisi, mirasçılık belgesi, satış veya bağış işlemlerine ilişkin resmi belgeler, banka kayıtları ve tanık bilgileri gibi deliller sistemli şekilde hazırlanmalıdır. Belgelerin eksik sunulması, yargılama süresini uzatabileceği gibi ispat yükünü de zorlaştırabilir.

### Uyuşmazlık Türünün Belirlenmesi

Her dosyada talep aynı değildir. Bazı dosyalarda tescilin düzeltilmesi gerekirken, bazı dosyalarda paydaşlığın sona erdirilmesi veya miras paylarının korunması ön plandadır. Bu nedenle talebin doğru formüle edilmesi önem taşır. Benzer konuda detaylı bir değerlendirme için [ilgili makaleyi](/makaleler/${relatedOne}/) ve [devam niteliğindeki içeriği](/makaleler/${relatedTwo}/) inceleyebilirsiniz.

### Görevli ve Yetkili Mahkemenin Tespiti

Taşınmazın bulunduğu yer mahkemesi çoğu uyuşmazlıkta belirleyicidir. Bununla birlikte talebin niteliğine göre sulh hukuk veya asliye hukuk mahkemesi ayrımı yapılır. Dava dilekçesi hazırlanırken maddi vakıaların açık kronolojiyle yazılması ve delillerin ilgili iddialarla eşleştirilmesi gereklidir.

## Yargılama Sürecinin Temel Aşamaları

### Dava Dilekçesi ve İlk İnceleme

Dilekçede taraflar, talepler, hukuki dayanaklar ve deliller açıkça belirtilir. Mahkeme ilk inceleme aşamasında usul şartlarını değerlendirir. Eksik hasım, yanlış mahkeme seçimi veya belirsiz talep gibi sorunlar varsa tamamlatma veya usulden ret riski doğabilir.

### Delillerin Toplanması ve Bilirkişi İncelemesi

Uyuşmazlığın niteliğine göre bilirkişi raporu alınabilir, keşif yapılabilir ve tapu müdürlüğü ile diğer kurumlardan müzekkere cevabı beklenebilir. Raporlara süresinde itiraz edilmesi, teknik hataların düzeltilmesi bakımından önemlidir. Özellikle paylı taşınmazlarda değer tespiti, satış koşulları ve paylaşım hesabı dikkatle incelenmelidir.

### Karar ve Kanun Yolları

Mahkemenin kararı sonrasında istinaf ve gerekli şartlar varsa temyiz aşamaları gündeme gelebilir. Kesinleşme süreci tamamlanmadan bazı işlemler yapılamayabilir. Karar sonrası tapu tescili, satış bedelinin paylaştırılması veya icra işlemleri gibi uygulama adımları ayrı bir dikkat gerektirir.

## Uygulamada Sık Karşılaşılan Sorunlar

Taraflar arasında iletişim kopukluğu, eksik belge sunulması, tanıkların usulüne uygun dinlenememesi, bilirkişi raporuna geç itiraz edilmesi ve dava konusu taşınmazın hukuki durumunun yanlış değerlendirilmesi en sık rastlanan sorunlardır. Bu nedenle süreç boyunca usul takviminin yakından izlenmesi gerekir.

Bir diğer önemli husus, benzer uyuşmazlık türleri arasında doğru hukuki yolun seçilmesidir. Örneğin bazı dosyalarda ${linkA} kapsamında dava stratejisi gerekirken, başka dosyalarda ${linkB} veya ${linkC} başlıkları daha uygun olabilir. Bu ayrım, talebin kabul edilebilirliğini ve davanın süresini doğrudan etkiler.

## Değerlendirme ve Sonuç

${topic} konusunda sağlıklı bir hukuki yol haritası için, olayın başlangıcından itibaren belgelerin düzenli toplanması, dava türünün doğru seçilmesi ve yargılama sürecinin usule uygun yürütülmesi önem taşır. Her dosyada taraf ilişkileri, mülkiyet türü, işlem tarihi ve delil niteliği farklıdır.

Sümer Hukuk Bürosu, Adana merkezli uyuşmazlıklarda müvekkillerini süreç hakkında düzenli bilgilendirme yaklaşımıyla destekler. Bununla birlikte, bu yazıda yer alan açıklamalar genel bilgilendirme niteliğindedir. Somut olayın özelliklerine göre hukuki değerlendirme yapılmalıdır.

Süreçler hakkında genel çerçeveyi genişletmek için ${linkA}, ${linkB} ve ${linkC} sayfalarına göz atabilir, ayrıca [makaleler arşivimizden](/makaleler/) benzer uyuşmazlıklara ilişkin içeriklere ulaşabilirsiniz.`;
}

function faqFor(topic) {
  return [
    {
      question: `${topic} konusunda dava açmadan önce hangi belgeler gerekir?`,
      answer:
        'Dosyanın türüne göre tapu kayıtları, kimlik ve nüfus kayıtları, veraset belgeleri, sözleşmeler, resmi yazışmalar ve tanık bilgileri gibi deliller hazırlanmalıdır.',
    },
    {
      question: 'Dava süresi neye göre değişir?',
      answer:
        'Mahkemenin iş yoğunluğu, taraf sayısı, bilirkişi ve keşif süreçleri, delillerin toplanma hızı ve kanun yolu başvuruları toplam süreyi etkiler.',
    },
    {
      question: 'Uzlaşma sağlanırsa dava açmaya gerek kalır mı?',
      answer:
        'Taraflar arasında hukuka uygun bir anlaşma sağlanabilirse dava açılmadan çözüm mümkün olabilir. Ancak anlaşmanın kapsamı ve uygulanabilirliği dikkatle değerlendirilmelidir.',
    },
    {
      question: 'Karar sonrası hangi işlemler yapılır?',
      answer:
        'Kararın kesinleşmesine bağlı olarak tapu tescili, satış bedelinin paylaştırılması, icra veya infaz işlemleri gündeme gelebilir.',
    },
    {
      question: 'Bu makaledeki bilgiler kişisel hukuki danışmanlık yerine geçer mi?',
      answer:
        'Hayır. İçerik genel bilgilendirme amaçlıdır; somut olayın özelliklerine göre hukuki değerlendirme yapılmalıdır.',
    },
  ];
}

function descriptionFor(title) {
  const base = `${title} konusunda Adana uygulamasında dava şartları, deliller, yargılama aşamaları ve dikkat edilmesi gereken hukuki noktaları bilgilendirici şekilde inceleyin.`;
  return base.length > 160 ? `${base.slice(0, 157)}...` : base;
}

for (let i = 0; i < topics.length; i++) {
  const t = topics[i];
  const body = articleBody(t.title, i);
  const lower = body.toLowerCase();
  for (const bad of prohibited) {
    if (lower.includes(bad)) {
      throw new Error(`Yasaklı ifade algılandı: ${bad}`);
    }
  }

  const article = {
    title: t.title,
    slug: t.slug,
    description: descriptionFor(t.title),
    date: t.date,
    category: t.category,
    tags: t.tags,
    sourceTopic: t.sourceTopic,
    body,
    faq: faqFor(t.title),
    relatedServices: t.relatedServices,
    relatedArticles: t.relatedArticles,
    author: 'Sümer Hukuk Bürosu',
  };

  const out = join(ARTICLES_DIR, `${t.slug}.json`);
  writeFileSync(out, JSON.stringify(article, null, 2) + '\n', 'utf-8');
}

console.log(`Başlangıç makaleleri yazıldı: ${topics.length} adet`);
