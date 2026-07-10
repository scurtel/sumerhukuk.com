/**
 * Hizmet sayfası içeriklerini Gemini ile üretir (bir kerelik, statik kayıt).
 * npm run generate:service-content
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { GoogleGenAI } from '@google/genai';
import { loadEnv, SERVICES_DIR } from './lib.mjs';

const SPECS = [
  {
    slug: 'adana-gayrimenkul-avukati',
    topics:
      'gayrimenkul hukuku, taşınmaz mülkiyeti, el atmanın önlenmesi, ecrimisil, satış vaadi, hisseli taşınmaz, kat mülkiyeti, komşuluk hukuku, tapu iptal bağlantısı, dava öncesi belge incelemesi, görevli mahkeme',
  },
  {
    slug: 'adana-miras-avukati',
    topics:
      'miras hukuku, yasal mirasçılar, mirasçılık belgesi, tereke, muris muvazaası, tenkis, vasiyetname, mirasın reddi, saklı pay, miras kalan taşınmaz, ortaklığın giderilmesi bağlantısı',
  },
  {
    slug: 'adana-ortakligin-giderilmesi-avukati',
    topics:
      'ortaklığın giderilmesi, izale-i şuyu, paylı mülkiyet, elbirliği, aynen taksim, satış yoluyla giderilme, paydaşlar, muhdesat, ecrimisil ilişkisi, arabuluculuk kontrolü',
  },
  {
    slug: 'adana-tapu-avukati',
    topics:
      'tapu kayıtları, tapu iptal tescil, yolsuz tescil, muris muvazaası, vekalet kötüye kullanımı, kadastro, ihtiyati tedbir, iyi niyetli üçüncü kişi',
  },
];

const RULES = `Türkçe, kurumsal, bilgilendirici hukuk dili kullan.
1200-1800 kelime arası yaz.
Anahtar kelime doldurma yapma.
"En iyi", "garantili", "başarı oranı" gibi ifadeler kullanma.
Kanun maddesi numarası, Yargıtay kararı veya istatistik uydurma.
Kesin sonuç vaat etme.
Fiyat belirtme.
Markdown formatında şu başlıkları kullan:
## Ana Hizmet Kapsamı
## İlgili Uyuşmazlık Türleri
## Sürecin Genel Aşamaları
## Dikkat Edilmesi Gereken Noktalar
Mevcut site iç linkleri kullan (slug formatı /slug/ veya /makaleler/slug/).
Sadece body markdown döndür, başka açıklama ekleme.`;

async function main() {
  const env = loadEnv();
  if (!env.geminiApiKey) {
    console.error('GEMINI_API_KEY gerekli.');
    process.exit(1);
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });

  for (const spec of SPECS) {
    const path = join(SERVICES_DIR, `${spec.slug}.json`);
    if (!existsSync(path)) continue;
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    console.log(`Üretiliyor: ${spec.slug}`);

    const prompt = `${RULES}

Hizmet: ${data.h1}
Şehir: Adana
Büro: Sümer Hukuk Bürosu
Konular: ${spec.topics}

İlgili sayfa linkleri:
/adana-gayrimenkul-avukati/ /adana-miras-avukati/ /adana-ortakligin-giderilmesi-avukati/ /adana-tapu-avukati/
/ortakligin-giderilmesi-davasi/ /tapu-iptal-ve-tescil-davasi/ /makaleler/ altındaki ilgili makaleler`;

    const response = await ai.models.generateContent({ model, contents: prompt });
    const body = response?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('')?.trim();
    if (!body || body.length < 500) {
      console.warn(`  Atlandı: yetersiz çıktı`);
      continue;
    }
    data.body = body;
    data.date = new Date().toISOString().split('T')[0];
    writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    const words = body.split(/\s+/).length;
    console.log(`  Kaydedildi (~${words} kelime)`);
    await new Promise((r) => setTimeout(r, 2000));
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
