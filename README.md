# sumerhukuk.com

Sümer Hukuk Bürosu için statik hukuk bürosu sitesi. Node.js ile build alınır; canlıda yalnızca statik HTML/CSS dosyaları yayınlanır.

## Geliştirme

```bash
npm install
npm run build          # dist/ klasörünü oluşturur
npm run preview        # dist/ önizleme (npx serve)
npm run generate:article   # Gemini ile yeni makale (GEMINI_API_KEY gerekir)
```

Konu seçimini API olmadan test etmek için:

```bash
node scripts/generate-article.mjs --dry-run-topic
```

## Deploy mimarisi (önerilen)

```
main branch (kaynak kod)
    │
    ├─ push / workflow
    ▼
GitHub Actions: npm ci → npm run build
    │
    ▼
dist/ içeriği → hostinger-deploy branch (sadece statik dosyalar)
    │
    ▼
Hostinger Git → public_html
```

**Önemli:** `hostinger-deploy` branch'inde `dist/` klasörü yoktur. `index.html`, `styles.css` ve diğer dosyalar doğrudan branch kökündedir.

### Normal deploy

1. `main` branch'e push yapılır.
2. `.github/workflows/deploy.yml` tetiklenir.
3. Workflow `npm ci` ve `npm run build` çalıştırır.
4. `peaceiris/actions-gh-pages` ile `./dist` içeriği `hostinger-deploy` branch'ine publish edilir (`force_orphan: true`).

### Günlük otomatik makale

`.github/workflows/auto-article.yml`:

1. `npm run generate:article`
2. `npm run build`
3. `content/articles/` ve `public/sitemap.xml` → `main` branch'e commit/push
4. `dist/` → `hostinger-deploy` branch'ine publish

## Hostinger ayarları

### Önerilen (temiz yöntem)

| Ayar | Değer |
|---|---|
| Branch | `hostinger-deploy` |
| Build command | **Yok / None** |
| Output directory | **Boş** veya `/` |
| Entry file | **Boş** |
| Root directory | `public_html` veya `/` |

Hostinger'da build çalıştırmayın; build GitHub Actions'ta yapılır.

### Alternatif (main branch — önerilmez)

`main` branch kullanılacaksa:

| Ayar | Değer |
|---|---|
| Branch | `main` |
| Build command | `npm ci && npm run build:hostinger` |
| Output directory | `/` (build:hostinger dist içeriğini köke kopyalar) |

`npm run build` tek başına yeterli değildir; çıktı `dist/` içinde kalır ve kök dizinde `index.html` olmaz → **403 Forbidden**.

## GitHub Secrets

| Secret | Zorunlu | Açıklama |
|---|---|---|
| `GEMINI_API_KEY` | Evet (makale üretimi için) | Yalnızca GitHub Actions |
| `GEMINI_MODEL` | Hayır | Varsayılan: `gemini-2.5-flash` |

`.env` dosyası repoya eklenmez. FTP veya Hostinger secret gerekmez.

## Build çıktısı (dist/)

Build sonrası `dist/` içinde şunlar bulunur:

- `index.html`
- `styles.css`
- `sitemap.xml`
- `robots.txt`
- `.htaccess`
- Hizmet sayfaları, makaleler, kurumsal sayfalar

## Proje yapısı

```
content/articles/     Makale JSON dosyaları
content/services/     Hizmet sayfaları
content/pages/        Hakkımızda, İletişim
data/                 Konu havuzu ve taxonomy
scripts/              Build ve makale üretim scriptleri
public/               robots.txt, sitemap şablonu, .htaccess
dist/                 Build çıktısı (gitignore)
```
