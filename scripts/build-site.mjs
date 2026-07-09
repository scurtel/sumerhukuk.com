import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import {
  ROOT,
  loadEnv,
  readArticles,
  readServices,
  readPages,
  markdownToHtml,
  updateSitemap,
  PUBLIC_DIR,
  SERVICE_LINKS,
  LEGAL_DISCLAIMER,
  findArticlesBySlugs,
  findServicesBySlugs,
  resolveHeroImage,
  resolveArticleImage,
  publicAssetExists,
} from './lib.mjs';

const DIST = join(ROOT, 'dist');
const STYLES = join(ROOT, 'src', 'styles.css');

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderImg({ src, alt, width, height, className, loading, fetchpriority, ariaHidden = false }) {
  const parts = [
    className ? `class="${className}"` : '',
    `src="${escapeHtml(src)}"`,
    ariaHidden ? 'alt="" aria-hidden="true"' : `alt="${escapeHtml(alt)}"`,
    width ? `width="${width}"` : '',
    height ? `height="${height}"` : '',
    loading ? `loading="${loading}"` : '',
    fetchpriority ? `fetchpriority="${fetchpriority}"` : '',
    'decoding="async"',
  ].filter(Boolean);
  return `<img\n      ${parts.join('\n      ')}\n    >`;
}

function renderArticleThumbnail(article, { className = 'article-thumb', width = 96, height = 72 } = {}) {
  const img = resolveArticleImage(article);
  return renderImg({
    src: img.src,
    alt: img.alt,
    width,
    height,
    className,
    loading: 'lazy',
  });
}

function renderServiceIcon(serviceLink) {
  const iconPath = serviceLink.icon;
  const hasFile = publicAssetExists(iconPath);
  if (hasFile) {
    return renderImg({
      src: iconPath,
      width: 40,
      height: 40,
      className: 'service-icon',
      loading: 'lazy',
      ariaHidden: true,
    });
  }
  // CSS/SVG inline fallback — minimal line icon
  return `<span class="service-icon service-icon-fallback" aria-hidden="true">
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="8" width="20" height="26" rx="2" stroke="currentColor" stroke-width="1.5"/>
      <path d="M11 15h10M11 20h10M11 25h6" stroke="currentColor" stroke-width="1.25"/>
      <circle cx="30" cy="28" r="5" stroke="var(--color-accent, #c9a227)" stroke-width="1.5"/>
    </svg>
  </span>`;
}

function breadcrumbSchema(items, siteUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url ? `${siteUrl}${item.url}` : undefined,
    })),
  };
}

function faqSchema(faq) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

function renderFaqHtml(faq) {
  return faq
    .map(
      (item) => `
    <details class="faq-item">
      <summary>${escapeHtml(item.question)}</summary>
      <p>${escapeHtml(item.answer)}</p>
    </details>`
    )
    .join('');
}

function renderRelatedLinks({ services, articles, serviceSlugs = [], articleSlugs = [] }) {
  const relServices = findServicesBySlugs(services, serviceSlugs);
  const relArticles = findArticlesBySlugs(articles, articleSlugs);
  if (!relServices.length && !relArticles.length) return '';

  let html = '<section class="related-links"><h2>İlgili Sayfalar</h2>';
  if (relServices.length) {
    html += '<h3>Hizmetler</h3><ul class="link-list">';
    html += relServices.map((s) => `<li><a href="/${s.slug}/">${escapeHtml(s.h1 || s.title)}</a></li>`).join('');
    html += '</ul>';
  }
  if (relArticles.length) {
    html += '<h3>Makaleler</h3><ul class="link-list">';
    html += relArticles
      .map((a) => `<li><a href="/makaleler/${a.slug}/">${escapeHtml(a.title)}</a></li>`)
      .join('');
    html += '</ul>';
  }
  html += '</section>';
  return html;
}

function renderCta(text) {
  return `
    <section class="cta-box">
      <p>${escapeHtml(text)}</p>
      <p><a href="/iletisim/" class="btn">İletişime Geçin</a></p>
    </section>`;
}

function renderBreadcrumbHtml(items) {
  const parts = items.map((item, i) => {
    if (i === items.length - 1) return `<span>${escapeHtml(item.name)}</span>`;
    return `<a href="${item.url}">${escapeHtml(item.name)}</a>`;
  });
  return `<nav class="breadcrumb" aria-label="Breadcrumb">${parts.join(' &rsaquo; ')}</nav>`;
}

function layout({ pageTitle, description, siteName, siteUrl, body, extraHead = '' }) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(siteUrl)}">
  <link rel="stylesheet" href="/styles.css">
  ${extraHead}
</head>
<body>
  <header class="site-header">
    <div class="container header-inner">
      <a href="/" class="logo">${escapeHtml(siteName)}</a>
      <nav class="main-nav">
        <a href="/">Ana Sayfa</a>
        <a href="/makaleler/">Makaleler</a>
        <a href="/hakkimizda/">Hakkımızda</a>
        <a href="/iletisim/">İletişim</a>
      </nav>
    </div>
  </header>
  <main class="container main-content">
    ${body}
  </main>
  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <p class="footer-brand">${escapeHtml(siteName)}</p>
        <p class="disclaimer">${escapeHtml(LEGAL_DISCLAIMER)}</p>
      </div>
      <div>
        <p class="footer-heading">Hizmetler</p>
        <ul class="footer-links">
          ${SERVICE_LINKS.map((s) => `<li><a href="/${s.slug}/">${escapeHtml(s.label)}</a></li>`).join('')}
        </ul>
      </div>
      <div>
        <p class="footer-heading">Kurumsal</p>
        <ul class="footer-links">
          <li><a href="/hakkimizda/">Hakkımızda</a></li>
          <li><a href="/iletisim/">İletişim</a></li>
          <li><a href="/makaleler/">Makaleler</a></li>
        </ul>
      </div>
    </div>
    <div class="container footer-bottom">
      <p>&copy; ${new Date().getFullYear()} ${escapeHtml(siteName)}. Tüm hakları saklıdır.</p>
    </div>
  </footer>
</body>
</html>`;
}

function renderServicePage(service, { articles, services, env }) {
  const crumbs = [
    { name: 'Ana Sayfa', url: '/' },
    { name: service.h1 || service.title, url: `/${service.slug}/` },
  ];
  const extraHead = `
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema(crumbs, env.siteUrl))}</script>
  <script type="application/ld+json">${JSON.stringify(faqSchema(service.faq))}</script>`;

  const body = `
    ${renderBreadcrumbHtml(crumbs)}
    <article class="service-page">
      <header class="page-header">
        <h1>${escapeHtml(service.h1)}</h1>
        <p class="lead">${escapeHtml(service.intro)}</p>
      </header>
      <div class="article-body">${markdownToHtml(service.body)}</div>
      <p class="legal-note"><em>${escapeHtml(LEGAL_DISCLAIMER)}</em></p>
      <section class="faq-section">
        <h2>Sıkça Sorulan Sorular</h2>
        ${renderFaqHtml(service.faq)}
      </section>
      ${renderRelatedLinks({
        services,
        articles,
        serviceSlugs: service.relatedServices,
        articleSlugs: service.relatedArticles,
      })}
      ${renderCta(service.cta)}
    </article>`;

  return layout({
    pageTitle: `${service.metaTitle || service.title} | ${env.siteName}`,
    description: service.description,
    siteName: env.siteName,
    siteUrl: `${env.siteUrl}/${service.slug}/`,
    body,
    extraHead,
  });
}

function renderStaticPage(page, { env }) {
  const crumbs = [
    { name: 'Ana Sayfa', url: '/' },
    { name: page.title, url: `/${page.slug}/` },
  ];
  const extraHead = page.faq
    ? `<script type="application/ld+json">${JSON.stringify(faqSchema(page.faq))}</script>`
    : '';
  const faqBlock = page.faq
    ? `<section class="faq-section"><h2>Sıkça Sorulan Sorular</h2>${renderFaqHtml(page.faq)}</section>`
    : '';

  const body = `
    ${renderBreadcrumbHtml(crumbs)}
    <article>
      <header class="page-header"><h1>${escapeHtml(page.h1 || page.title)}</h1></header>
      <div class="article-body">${markdownToHtml(page.body)}</div>
      <p class="legal-note"><em>${escapeHtml(LEGAL_DISCLAIMER)}</em></p>
      ${faqBlock}
      ${page.cta ? renderCta(page.cta) : ''}
    </article>`;

  return layout({
    pageTitle: `${page.metaTitle || page.title} | ${env.siteName}`,
    description: page.description,
    siteName: env.siteName,
    siteUrl: `${env.siteUrl}/${page.slug}/`,
    body,
    extraHead,
  });
}

function renderArticlePage(article, { articles, services, env }) {
  const crumbs = [
    { name: 'Ana Sayfa', url: '/' },
    { name: 'Makaleler', url: '/makaleler/' },
    { name: article.title, url: `/makaleler/${article.slug}/` },
  ];

  const featured = resolveArticleImage(article);

  const extraHead = `
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: `${env.siteUrl}${featured.src}`,
    datePublished: article.date,
    author: { '@type': 'Organization', name: article.author || env.articleAuthor },
    publisher: { '@type': 'Organization', name: env.siteName },
  })}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema(crumbs, env.siteUrl))}</script>
  <script type="application/ld+json">${JSON.stringify(faqSchema(article.faq))}</script>`;

  const tags = article.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('');

  const body = `
    ${renderBreadcrumbHtml(crumbs)}
    <article class="article">
      <header class="article-header">
        <p class="article-meta">
          <span class="category">${escapeHtml(article.category)}</span>
          <time datetime="${article.date}">${article.date}</time>
        </p>
        <h1>${escapeHtml(article.title)}</h1>
        <p class="article-description">${escapeHtml(article.description)}</p>
        <figure class="article-featured">
          ${renderImg({
            src: featured.src,
            alt: featured.alt,
            width: 720,
            height: 405,
            loading: 'eager',
            fetchpriority: 'high',
          })}
        </figure>
        <div class="tags">${tags}</div>
      </header>
      <div class="article-body">${markdownToHtml(article.body)}</div>
      <p class="legal-note"><em>${escapeHtml(LEGAL_DISCLAIMER)}</em></p>
      <section class="faq-section">
        <h2>Sıkça Sorulan Sorular</h2>
        ${renderFaqHtml(article.faq)}
      </section>
      ${renderRelatedLinks({
        services,
        articles,
        serviceSlugs: article.relatedServices,
        articleSlugs: article.relatedArticles,
      })}
      ${renderCta(
        'Sümer Hukuk Bürosu, Adana\'da gayrimenkul, tapu, miras ve ortaklığın giderilmesi süreçlerinde hukuki danışmanlık ve dava takibi hizmeti sunar.'
      )}
    </article>
    <p class="back-link"><a href="/makaleler/">&larr; Tüm makalelere dön</a></p>`;

  return layout({
    pageTitle: `${article.title} | ${env.siteName}`,
    description: article.description,
    siteName: env.siteName,
    siteUrl: `${env.siteUrl}/makaleler/${article.slug}/`,
    body,
    extraHead,
  });
}

function renderHomePage(articles, services, env) {
  const latest = articles.slice(0, 6);
  const heroImg = resolveHeroImage();
  const articleList = latest
    .map(
      (a) => `
    <li class="article-list-item">
      <a href="/makaleler/${escapeHtml(a.slug)}/" class="article-list-link">
        ${renderArticleThumbnail(a)}
        <span class="article-list-text">
          <span class="article-list-title">${escapeHtml(a.title)}</span>
          <span class="meta">${escapeHtml(a.category)} &middot; ${a.date}</span>
        </span>
      </a>
    </li>`
    )
    .join('');

  const serviceCards = SERVICE_LINKS.map(
    (s) => `
    <li class="service-card">
      <a href="/${s.slug}/">
        ${renderServiceIcon(s)}
        <h3>${escapeHtml(s.label)}</h3>
        <p class="service-summary">${escapeHtml(s.summary || '')}</p>
        <span class="read-more">Detaylı bilgi &rarr;</span>
      </a>
    </li>`
  ).join('');

  const homeFaq = [
    {
      question: 'Adana\'da ortaklığın giderilmesi davası ne kadar sürer?',
      answer:
        'Davanın süresi; taşınmazın niteliği, paydaş sayısı, bilirkişi incelemesi ve satış usulü gibi unsurlara göre değişir. Somut dosyanın özelliklerine göre süre değerlendirmesi yapılmalıdır.',
    },
    {
      question: 'Miras kalan taşınmaz satılabilir mi?',
      answer:
        'Miras ortaklığı devam ederken tüm mirasçıların uygun şekilde temsil edilmesi veya mirasın taksimi gibi hukuki süreçler tamamlanmadan tek başına satış genellikle mümkün değildir.',
    },
    {
      question: 'Tapu iptal ve tescil davası hangi mahkemede görülür?',
      answer:
        'Taşınmazın bulunduğu yer gözetilerek genellikle asliye hukuk mahkemelerinde görülür. Dosyanın niteliğine göre görev ve yetki kuralları değişebilir.',
    },
    {
      question: 'İzale-i şuyu ile ortaklığın giderilmesi aynı mıdır?',
      answer:
        'Günlük kullanımda benzer anlamda kullanılsa da hukuki süreçler ve sonuçlar açısından farklılıklar bulunabilir. Uyuşmazlığın türüne göre uygun dava yolu belirlenmelidir.',
    },
    {
      question: 'Hukuki danışmanlık için nasıl iletişime geçilir?',
      answer:
        'İletişim sayfamız üzerinden büromuza ulaşabilirsiniz. İlk görüşmede dosyanızın genel çerçevesi değerlendirilir.',
    },
  ];

  const body = `
    <section class="hero">
      <div class="hero-content">
        <h1>Adana Gayrimenkul, Tapu ve Miras Hukuku Avukatı</h1>
        <p class="lead">Sümer Hukuk Bürosu; Adana ve çevresinde gayrimenkul hukuku, tapu uyuşmazlıkları, miras davaları, ortaklığın giderilmesi ve izale-i şuyu süreçlerinde bilgilendirici hukuki destek sunar.</p>
        <p class="hero-cta"><a href="/iletisim/" class="btn">Hukuki Danışmanlık İçin İletişim</a></p>
      </div>
      <div class="hero-visual">
        ${renderImg({
          src: heroImg.src,
          alt: heroImg.alt,
          width: heroImg.width,
          height: heroImg.height,
          fetchpriority: 'high',
        })}
      </div>
    </section>

    <section class="intro-blocks">
      <div class="intro-card">
        <h2>Gayrimenkul ve Tapu Hukuku</h2>
        <p>Hisseli tapu, tapu kayıt düzeltme, tapu iptal ve tescil davaları gibi taşınmaz mülkiyetine ilişkin uyuşmazlıklarda hukuki süreçlerin doğru yönetilmesi önem taşır. <a href="/adana-gayrimenkul-avukati/">Adana gayrimenkul avukatı</a> ve <a href="/adana-tapu-avukati/">tapu avukatı</a> hizmet sayfalarımızdan detaylı bilgi alabilirsiniz.</p>
      </div>
      <div class="intro-card">
        <h2>Miras Hukuku</h2>
        <p>Mirasın taksimi, mirasçılar arasında taşınmaz paylaşımı ve miras kalan gayrimenkulün devri konularında miras hukukunun özel kuralları uygulanır. <a href="/adana-miras-avukati/">Adana miras avukatı</a> sayfamızda süreçlere ilişkin genel bilgiler yer almaktadır.</p>
      </div>
      <div class="intro-card">
        <h2>Ortaklığın Giderilmesi ve İzale-i Şuyu</h2>
        <p>Paydaşlar arasında anlaşma sağlanamadığında <a href="/ortakligin-giderilmesi-davasi/">ortaklığın giderilmesi davası</a> veya <a href="/izale-i-suyu-davasi/">izale-i şuyu davası</a> yoluyla paylı mülkiyetin sona erdirilmesi talep edilebilir. Süreçler taşınmazın aynen taksimi veya satış yoluyla giderilmesi seçeneklerini içerebilir.</p>
      </div>
    </section>

    <section class="services">
      <h2>Hizmet Alanlarımız</h2>
      <ul class="service-grid">${serviceCards}</ul>
    </section>

    <section class="latest-articles">
      <h2>Son Makaleler</h2>
      ${articles.length ? `<ul class="article-list">${articleList}</ul>` : '<p>Henüz makale bulunmuyor.</p>'}
      <p><a href="/makaleler/" class="btn btn-outline">Tüm Makaleleri Görüntüle</a></p>
    </section>

    <section class="faq-section home-faq">
      <h2>Sıkça Sorulan Sorular</h2>
      ${renderFaqHtml(homeFaq)}
    </section>

    ${renderCta('Sümer Hukuk Bürosu, Adana\'da gayrimenkul, tapu, miras ve ortaklığın giderilmesi süreçlerinde hukuki danışmanlık ve dava takibi hizmeti sunar.')}`;

  const heroPreload =
    heroImg.src.endsWith('.webp')
      ? `<link rel="preload" as="image" href="${escapeHtml(heroImg.src)}" fetchpriority="high">`
      : '';

  return layout({
    pageTitle: `Adana Gayrimenkul, Tapu ve Miras Avukatı | ${env.siteName}`,
    description:
      'Sümer Hukuk Bürosu, Adana\'da gayrimenkul hukuku, tapu davaları, miras hukuku, ortaklığın giderilmesi ve izale-i şuyu davalarında hukuki danışmanlık ve avukatlık hizmeti sunar.',
    siteName: env.siteName,
    siteUrl: env.siteUrl,
    body,
    extraHead: `${heroPreload}${heroPreload ? '\n  ' : ''}<script type="application/ld+json">${JSON.stringify(faqSchema(homeFaq))}</script>`,
  });
}

function renderArticlesIndex(articles, env) {
  const list = articles
    .map((a) => {
      const thumb = resolveArticleImage(a);
      return `
    <li class="article-card">
      <a href="/makaleler/${escapeHtml(a.slug)}/" class="article-card-link">
        ${renderImg({
          src: thumb.src,
          alt: thumb.alt,
          width: 120,
          height: 90,
          className: 'article-card-thumb',
          loading: 'lazy',
        })}
        <span class="article-card-body">
          <h2>${escapeHtml(a.title)}</h2>
          <p>${escapeHtml(a.description)}</p>
          <span class="meta">${escapeHtml(a.category)} &middot; ${a.date}</span>
        </span>
      </a>
    </li>`;
    })
    .join('');

  const body = `
    ${renderBreadcrumbHtml([
      { name: 'Ana Sayfa', url: '/' },
      { name: 'Makaleler', url: '/makaleler/' },
    ])}
    <section class="page-header">
      <h1>Hukuk Makaleleri</h1>
      <p>Adana gayrimenkul hukuku, tapu davaları, miras hukuku ve ortaklığın giderilmesi konularında bilgilendirici yazılar.</p>
    </section>
    ${articles.length ? `<ul class="article-grid">${list}</ul>` : '<p class="empty-state">Henüz makale bulunmuyor.</p>'}`;

  return layout({
    pageTitle: `Hukuk Makaleleri | ${env.siteName}`,
    description:
      'Gayrimenkul hukuku, tapu davaları, miras hukuku ve ortaklığın giderilmesi konularında bilgilendirici makaleler.',
    siteName: env.siteName,
    siteUrl: `${env.siteUrl}/makaleler/`,
    body,
  });
}

function writePage(relativePath, html) {
  const fullPath = join(DIST, relativePath);
  mkdirSync(join(fullPath, '..'), { recursive: true });
  writeFileSync(fullPath, html, 'utf-8');
}

function main() {
  const env = loadEnv();
  const articles = readArticles();
  const services = readServices();
  const pages = readPages();
  const ctx = { articles, services, env };

  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });

  writePage('index.html', renderHomePage(articles, services, env));
  writePage(join('makaleler', 'index.html'), renderArticlesIndex(articles, env));

  for (const service of services) {
    writePage(join(service.slug, 'index.html'), renderServicePage(service, ctx));
  }

  for (const page of pages) {
    writePage(join(page.slug, 'index.html'), renderStaticPage(page, { env }));
  }

  for (const article of articles) {
    writePage(join('makaleler', article.slug, 'index.html'), renderArticlePage(article, ctx));
  }

  writeFileSync(join(DIST, 'styles.css'), readFileSync(STYLES, 'utf-8'), 'utf-8');

  if (existsSync(join(PUBLIC_DIR, 'robots.txt'))) {
    cpSync(join(PUBLIC_DIR, 'robots.txt'), join(DIST, 'robots.txt'));
  }

  if (existsSync(join(PUBLIC_DIR, '.htaccess'))) {
    cpSync(join(PUBLIC_DIR, '.htaccess'), join(DIST, '.htaccess'));
  }

  const imagesDir = join(PUBLIC_DIR, 'images');
  if (existsSync(imagesDir)) {
    cpSync(imagesDir, join(DIST, 'images'), { recursive: true });
  }

  updateSitemap(env.siteUrl, articles, services, pages);
  if (existsSync(join(PUBLIC_DIR, 'sitemap.xml'))) {
    cpSync(join(PUBLIC_DIR, 'sitemap.xml'), join(DIST, 'sitemap.xml'));
  }

  console.log(
    `Build tamamlandı: ${services.length} hizmet, ${pages.length} sayfa, ${articles.length} makale → dist/`
  );
}

main();
