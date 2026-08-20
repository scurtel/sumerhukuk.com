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
  ADANA_LAWYER_SERVICES,
  SITE_CONFIG,
  LEGAL_DISCLAIMER,
  findArticlesBySlugs,
  findServicesBySlugs,
  resolveHeroImage,
  resolveArticleImage,
  resolveServiceImage,
  publicAssetExists,
  preferWebpAsset,
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

function renderArticleThumbnail(article, { className = 'article-thumb', width = 120, height = 80 } = {}) {
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
  const iconMarkup = hasFile
    ? renderImg({
        src: iconPath,
        width: 32,
        height: 32,
        className: 'service-icon',
        loading: 'lazy',
        ariaHidden: true,
      })
    : `<span class="service-icon service-icon-fallback" aria-hidden="true">
    <svg viewBox="0 0 40 40" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="8" width="20" height="26" rx="2" stroke="currentColor" stroke-width="1.5"/>
      <path d="M11 15h10M11 20h10M11 25h6" stroke="currentColor" stroke-width="1.25"/>
      <circle cx="30" cy="28" r="5" stroke="var(--color-accent, #c9a227)" stroke-width="1.5"/>
    </svg>
  </span>`;

  return `<span class="service-icon-wrap">${iconMarkup}</span>`;
}

function renderIntroCardVisual(imagePath, imageAlt) {
  const src = preferWebpAsset(imagePath);
  return `<div class="intro-card-media">
    ${renderImg({
      src,
      alt: imageAlt,
      width: 400,
      height: 225,
      className: 'intro-card-img',
      loading: 'lazy',
    })}
  </div>`;
}

const HOME_INTRO_BLOCKS = [
  {
    title: 'Gayrimenkul ve Tapu Hukuku',
    image: '/images/placeholders/gayrimenkul-hukuku.svg',
    imageAlt: 'Gayrimenkul hukuku ve tapu uyuşmazlıkları hakkında bilgilendirici görsel',
    body:
      'Hisseli tapu, tapu kayıt düzeltme, tapu iptal ve tescil davaları gibi taşınmaz mülkiyetine ilişkin uyuşmazlıklarda hukuki süreçlerin doğru yönetilmesi önem taşır. <a href="/adana-gayrimenkul-avukati/">Adana gayrimenkul avukatı</a> ve <a href="/adana-tapu-avukati/">tapu avukatı</a> hizmet sayfalarımızdan detaylı bilgi alabilirsiniz.',
  },
  {
    title: 'Miras Hukuku',
    image: '/images/placeholders/miras-hukuku.svg',
    imageAlt: 'Miras hukuku ve miras kalan taşınmazlar hakkında bilgilendirici görsel',
    body:
      'Mirasın taksimi, mirasçılar arasında taşınmaz paylaşımı ve miras kalan gayrimenkulün devri konularında miras hukukunun özel kuralları uygulanır. <a href="/adana-miras-avukati/">Adana miras avukatı</a> sayfamızda süreçlere ilişkin genel bilgiler yer almaktadır.',
  },
  {
    title: 'Ortaklığın Giderilmesi ve İzale-i Şuyu',
    image: '/images/placeholders/ortakligin-giderilmesi.svg',
    imageAlt: 'Ortaklığın giderilmesi ve paylı mülkiyet hakkında bilgilendirici görsel',
    body:
      'Paydaşlar arasında anlaşma sağlanamadığında <a href="/adana-ortakligin-giderilmesi-avukati/">Adana ortaklığın giderilmesi avukatı</a> sayfamız ve <a href="/ortakligin-giderilmesi-davasi/">ortaklığın giderilmesi davası</a> içeriklerimiz süreç hakkında genel bilgi sunar. Aynen taksim veya satış yoluyla giderilme seçenekleri taşınmazın niteliğine göre değerlendirilir.',
  },
];

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

/**
 * Hakkımızda / İletişim sayfaları için tutarlı kurumsal entity grafiği.
 * Primary: Sümer Hukuk Bürosu (Organization + LegalService)
 * Secondary: Avukat Ceren Sümer Cilli (Person · worksFor)
 */
function entityId(siteUrl, fragment) {
  const id = fragment.startsWith('#') ? fragment : `#${fragment}`;
  const base = String(siteUrl).replace(/\/$/, '');
  return `${base}/${id}`;
}

function postalAddressSchema() {
  return {
    '@type': 'PostalAddress',
    streetAddress: SITE_CONFIG.address,
    addressLocality: SITE_CONFIG.areaServed,
    addressCountry: 'TR',
  };
}

function logoSchema(siteUrl) {
  const logoPath = SITE_CONFIG.logoPath;
  if (!logoPath || !publicAssetExists(logoPath)) return undefined;
  return {
    '@type': 'ImageObject',
    url: `${siteUrl}${logoPath}`,
  };
}

/**
 * @param {'about'|'contact'} pageKind
 * @param {{ name: string, description: string, url: string }} pageMeta
 */
function corporateEntityGraph(env, pageKind, pageMeta) {
  const siteUrl = env.siteUrl;
  const orgId = entityId(siteUrl, SITE_CONFIG.entityIds.organization);
  const legalId = entityId(siteUrl, SITE_CONFIG.entityIds.legalService);
  const personId = entityId(siteUrl, SITE_CONFIG.entityIds.person);
  const websiteId = entityId(siteUrl, SITE_CONFIG.entityIds.website);
  const pageId =
    pageKind === 'about'
      ? `${siteUrl}/hakkimizda/#webpage`
      : `${siteUrl}/iletisim/#webpage`;

  const address = postalAddressSchema();
  const logo = logoSchema(siteUrl);
  const sameAs = [...SITE_CONFIG.sameAs];

  const organization = {
    '@type': 'Organization',
    '@id': orgId,
    name: env.siteName,
    url: `${siteUrl}/`,
    telephone: SITE_CONFIG.phoneTel,
    address,
    sameAs,
    employee: { '@id': personId },
  };
  if (logo) organization.logo = logo;

  const legalService = {
    '@type': 'LegalService',
    '@id': legalId,
    name: env.siteName,
    url: `${siteUrl}/`,
    telephone: SITE_CONFIG.phoneTel,
    address,
    areaServed: { '@type': 'City', name: SITE_CONFIG.areaServed },
    knowsAbout: [...SITE_CONFIG.knowsAbout],
    parentOrganization: { '@id': orgId },
    employee: { '@id': personId },
  };
  if (logo) legalService.image = logo.url;

  const person = {
    '@type': 'Person',
    '@id': personId,
    name: SITE_CONFIG.lawyer.name,
    jobTitle: SITE_CONFIG.lawyer.jobTitle,
    worksFor: { '@id': orgId },
  };

  const website = {
    '@type': 'WebSite',
    '@id': websiteId,
    name: env.siteName,
    url: `${siteUrl}/`,
    publisher: { '@id': orgId },
  };

  const pageNode =
    pageKind === 'about'
      ? {
          '@type': 'AboutPage',
          '@id': pageId,
          url: pageMeta.url,
          name: pageMeta.name,
          description: pageMeta.description,
          isPartOf: { '@id': websiteId },
          about: { '@id': orgId },
          mainEntity: { '@id': orgId },
        }
      : {
          '@type': 'ContactPage',
          '@id': pageId,
          url: pageMeta.url,
          name: pageMeta.name,
          description: pageMeta.description,
          isPartOf: { '@id': websiteId },
          about: { '@id': orgId },
          mainEntity: { '@id': orgId },
        };

  return {
    '@context': 'https://schema.org',
    '@graph': [organization, legalService, person, website, pageNode],
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

function renderServiceCardVisual(serviceLink) {
  const imagePath = serviceLink.image || serviceLink.icon;
  const src = preferWebpAsset(imagePath);
  if (publicAssetExists(src)) {
    return `<div class="service-card-media">
      ${renderImg({
        src,
        alt: serviceLink.imageAlt || serviceLink.label,
        width: 400,
        height: 400,
        className: 'service-card-img',
        loading: 'lazy',
      })}
    </div>`;
  }
  return renderServiceIcon(serviceLink);
}

function renderSocialMeta({ title, description, url, image, siteName }) {
  const imageUrl = image?.startsWith('http') ? image : image ? new URL(image, url).href : '';
  const tags = [
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${escapeHtml(siteName)}">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${escapeHtml(url)}">`,
    imageUrl ? `<meta property="og:image" content="${escapeHtml(imageUrl)}">` : '',
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    imageUrl ? `<meta name="twitter:image" content="${escapeHtml(imageUrl)}">` : '',
  ].filter(Boolean);
  return tags.join('\n  ');
}

function legalServiceSchema(service, env, imageSrc) {
  const pageUrl = `${env.siteUrl}/${service.slug}/`;
  const imageUrl = imageSrc ? `${env.siteUrl}${imageSrc}` : undefined;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    name: service.h1 || service.title,
    description: service.description,
    url: pageUrl,
    serviceType: service.serviceType || service.category || SITE_CONFIG.serviceCategory,
    areaServed: { '@type': 'City', name: SITE_CONFIG.areaServed },
    provider: {
      '@type': 'Organization',
      name: env.siteName,
      url: `${env.siteUrl}/`,
      telephone: SITE_CONFIG.phoneTel,
      areaServed: SITE_CONFIG.areaServed,
    },
  };
  if (imageUrl) schema.image = imageUrl;
  return [schema];
}

function homeGraphSchema(env, homeFaq) {
  const homeUrl = `${env.siteUrl}/`;
  const orgId = `${homeUrl}#organization`;
  const legalId = `${homeUrl}#legalservice`;
  const postalAddress = {
    '@type': 'PostalAddress',
    streetAddress: 'Kayalıbağ Mahallesi, Çolakoğlu İş Merkezi Kat: 2 No: 1',
    addressLocality: 'Seyhan',
    addressRegion: 'Adana',
    addressCountry: 'TR',
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': orgId,
        name: env.siteName,
        url: homeUrl,
        telephone: SITE_CONFIG.phoneTel,
        address: postalAddress,
        areaServed: { '@type': 'City', name: SITE_CONFIG.areaServed },
      },
      {
        '@type': 'LegalService',
        '@id': legalId,
        name: env.siteName,
        url: homeUrl,
        telephone: SITE_CONFIG.phoneTel,
        address: postalAddress,
        areaServed: { '@type': 'City', name: SITE_CONFIG.areaServed },
        serviceType: SITE_CONFIG.serviceCategory,
        provider: { '@id': orgId },
      },
      {
        '@type': 'FAQPage',
        '@id': `${homeUrl}#faq`,
        mainEntity: homeFaq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ],
  };
}

function render404Page(env) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sayfa Bulunamadı | ${escapeHtml(env.siteName)}</title>
  <meta name="robots" content="noindex, follow">
  <meta name="description" content="Aradığınız sayfa bulunamadı.">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <header class="site-header">
    <div class="container header-inner">
      <a href="/" class="logo">${escapeHtml(env.siteName)}</a>
      <nav class="main-nav">
        <a href="/">Ana Sayfa</a>
        <a href="/makaleler/">Makaleler</a>
        <a href="/hakkimizda/">Hakkımızda</a>
        <a href="/iletisim/">İletişim</a>
      </nav>
    </div>
  </header>
  <main class="container main-content">
    <section class="page-header">
      <h1>Sayfa Bulunamadı</h1>
      <p>Aradığınız sayfa taşınmış veya hiç var olmamış olabilir.</p>
      <p><a href="/" class="btn">Ana Sayfaya Dön</a> <a href="/makaleler/" class="btn btn-outline">Makalelere Git</a></p>
    </section>
  </main>
  <footer class="site-footer">
    <div class="container footer-bottom">
      <p>&copy; ${new Date().getFullYear()} ${escapeHtml(env.siteName)}. Tüm hakları saklıdır.</p>
    </div>
  </footer>
</body>
</html>`;
}

function renderCtaActions() {
  return `<div class="cta-actions">
      <a href="/iletisim/" class="btn">İletişime Geç</a>
      <a href="tel:${SITE_CONFIG.phoneTel}" class="btn btn-outline">Telefonla Ara</a>
    </div>`;
}

function renderCta(text, { showRelatedLink = false } = {}) {
  return `
    <section class="cta-box">
      <p>${escapeHtml(text || SITE_CONFIG.defaultCta)}</p>
      ${renderCtaActions()}
      ${showRelatedLink ? '<p class="cta-related"><a href="/#hizmetler">İlgili Hizmetleri İncele</a></p>' : ''}
    </section>`;
}

function renderLocationSection({ showExternalProfiles = false } = {}) {
  const contactRow = showExternalProfiles
    ? `
          <p class="location-phone">
            <span class="location-address-label">Telefon</span>
            <a href="tel:${escapeHtml(SITE_CONFIG.phoneTel)}">${escapeHtml(SITE_CONFIG.phone)}</a>
          </p>`
    : '';
  const externalProfiles = showExternalProfiles
    ? `
          <p class="location-actions location-actions-profiles">
            <a
              class="btn btn-outline location-directions-btn"
              href="${escapeHtml(SITE_CONFIG.yandexMapsUrl)}"
              target="_blank"
              rel="noopener noreferrer"
            >Yandex Haritalar'da görüntüle</a>
            <a
              class="btn btn-outline location-directions-btn"
              href="${escapeHtml(SITE_CONFIG.facebookUrl)}"
              target="_blank"
              rel="noopener noreferrer"
            >Sümer Hukuk Bürosu Facebook sayfası</a>
          </p>`
    : '';

  return `
    <section class="location-section" id="konum" aria-labelledby="location-heading">
      <div class="location-grid">
        <div class="location-info">
          <h2 id="location-heading">Sümer Hukuk Bürosu'na Nasıl Ulaşabilirsiniz?</h2>
          <p class="location-lead">Adana Seyhan'daki Sümer Hukuk Bürosu'nu ziyaret etmek veya yol tarifi almak için aşağıdaki haritayı kullanabilirsiniz.</p>
          <p class="location-org-name"><strong>${escapeHtml('Sümer Hukuk Bürosu')}</strong></p>
          <address class="location-address">
            <span class="location-address-label">Adres</span>
            ${escapeHtml(SITE_CONFIG.address)}
          </address>
          ${contactRow}
          <p class="location-actions">
            <a
              class="btn location-directions-btn"
              href="${escapeHtml(SITE_CONFIG.mapsDirectionsUrl)}"
              target="_blank"
              rel="noopener noreferrer"
            >Google Maps'te Yol Tarifi Al</a>
          </p>
          ${externalProfiles}
        </div>
        <div class="location-map-wrap">
          <iframe
            class="location-map"
            src="${escapeHtml(SITE_CONFIG.mapsEmbedSrc)}"
            title="Sümer Hukuk Bürosu Google Maps Konumu"
            width="600"
            height="450"
            style="border:0;"
            allowfullscreen=""
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </section>`;
}

function renderBreadcrumbHtml(items) {
  const parts = items.map((item, i) => {
    if (i === items.length - 1) return `<span>${escapeHtml(item.name)}</span>`;
    return `<a href="${item.url}">${escapeHtml(item.name)}</a>`;
  });
  return `<nav class="breadcrumb" aria-label="Breadcrumb">${parts.join(' &rsaquo; ')}</nav>`;
}

function layout({ pageTitle, description, siteName, siteUrl, body, extraHead = '', ogImage }) {
  const socialMeta = renderSocialMeta({
    title: pageTitle,
    description,
    url: siteUrl,
    image: ogImage,
    siteName,
  });
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(siteUrl)}">
  ${socialMeta}
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
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
    ...(service.category
      ? [{ name: service.category, url: '/#hizmetler' }]
      : []),
    { name: service.h1 || service.title, url: `/${service.slug}/` },
  ];
  const featured = resolveServiceImage(service);
  const pageUrl = `${env.siteUrl}/${service.slug}/`;
  const schemas = [
    breadcrumbSchema(crumbs, env.siteUrl),
    ...legalServiceSchema(service, env, featured.src),
    faqSchema(service.faq),
  ];
  const extraHead = schemas
    .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join('\n  ');

  const body = `
    ${renderBreadcrumbHtml(crumbs)}
    <article class="service-page">
      <header class="service-hero">
        <div class="service-hero-text">
          <p class="service-category">${escapeHtml(service.category || SITE_CONFIG.serviceCategory)}</p>
          <h1>${escapeHtml(service.h1)}</h1>
          <p class="lead">${escapeHtml(service.intro)}</p>
        </div>
        <figure class="service-hero-media">
          ${renderImg({
            src: featured.src,
            alt: featured.alt,
            width: 600,
            height: 600,
            className: 'service-hero-img',
            loading: 'eager',
            fetchpriority: 'high',
          })}
        </figure>
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
      ${renderCta(service.cta || SITE_CONFIG.defaultCta, { showRelatedLink: true })}
      <p class="legal-note service-disclaimer"><em>Bu sayfadaki bilgiler genel bilgilendirme amacı taşır; her uyuşmazlık kendi somut koşullarına göre ayrıca değerlendirilmelidir.</em></p>
    </article>`;

  const pageTitle =
    service.pageTitle ||
    (service.metaTitle?.includes(env.siteName)
      ? service.metaTitle
      : `${service.metaTitle || service.title} | ${env.siteName}`);

  return layout({
    pageTitle,
    description: service.description,
    siteName: env.siteName,
    siteUrl: pageUrl,
    body,
    extraHead,
    ogImage: featured.src,
  });
}

function renderStaticPage(page, { env }) {
  const crumbs = [
    { name: 'Ana Sayfa', url: '/' },
    { name: page.title, url: `/${page.slug}/` },
  ];
  const pageUrl = `${env.siteUrl}/${page.slug}/`;
  const pageTitle =
    page.pageTitle ||
    (page.metaTitle?.includes('|')
      ? page.metaTitle
      : `${page.metaTitle || page.title} | ${env.siteName}`);

  const schemaBlocks = [];
  if (page.slug === 'hakkimizda') {
    schemaBlocks.push(
      corporateEntityGraph(env, 'about', {
        name: page.h1 || page.title,
        description: page.description,
        url: pageUrl,
      })
    );
  } else if (page.slug === 'iletisim') {
    schemaBlocks.push(
      corporateEntityGraph(env, 'contact', {
        name: page.h1 || page.title,
        description: page.description,
        url: pageUrl,
      })
    );
  }
  if (page.faq) schemaBlocks.push(faqSchema(page.faq));
  schemaBlocks.push(breadcrumbSchema(crumbs, env.siteUrl));

  const extraHead = schemaBlocks
    .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join('\n  ');

  const faqBlock = page.faq
    ? `<section class="faq-section"><h2>Sıkça Sorulan Sorular</h2>${renderFaqHtml(page.faq)}</section>`
    : '';
  const locationBlock =
    page.slug === 'iletisim' ? renderLocationSection({ showExternalProfiles: true }) : '';

  const body = `
    ${renderBreadcrumbHtml(crumbs)}
    <article class="${page.slug === 'hakkimizda' || page.slug === 'iletisim' ? 'entity-page' : ''}">
      <header class="page-header"><h1>${escapeHtml(page.h1 || page.title)}</h1></header>
      <div class="article-body">${markdownToHtml(page.body)}</div>
      <p class="legal-note"><em>${escapeHtml(LEGAL_DISCLAIMER)}</em></p>
      ${faqBlock}
      ${locationBlock}
      ${page.cta ? renderCta(page.cta) : ''}
    </article>`;

  return layout({
    pageTitle,
    description: page.description,
    siteName: env.siteName,
    siteUrl: pageUrl,
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

  const serviceCards = ADANA_LAWYER_SERVICES.map(
    (s) => `
    <li class="service-card">
      <a href="/${s.slug}/">
        ${renderServiceCardVisual(s)}
        <h3>${escapeHtml(s.label)}</h3>
        <p class="service-summary">${escapeHtml(s.summary || '')}</p>
        <span class="read-more">Detaylı Bilgi &rarr;</span>
      </a>
    </li>`
  ).join('');

  const otherServices = SERVICE_LINKS.filter(
    (s) => !ADANA_LAWYER_SERVICES.some((a) => a.slug === s.slug)
  );
  const otherServiceLinks = otherServices
    .map((s) => `<li><a href="/${s.slug}/">${escapeHtml(s.label)}</a></li>`)
    .join('');

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
          className: 'hero-img',
          fetchpriority: 'high',
        })}
      </div>
    </section>

    <section class="intro-blocks">
      ${HOME_INTRO_BLOCKS.map(
        (block) => `
      <article class="intro-card">
        ${renderIntroCardVisual(block.image, block.imageAlt)}
        <div class="intro-card-body">
          <h2>${escapeHtml(block.title)}</h2>
          <p>${block.body}</p>
        </div>
      </article>`
      ).join('')}
    </section>

    <section class="services" id="hizmetler">
      <h2>Hizmet Alanlarımız</h2>
      <p class="section-lead">Adana'da gayrimenkul, miras, ortaklığın giderilmesi ve tapu uyuşmazlıklarına ilişkin bilgilendirici hukuki destek.</p>
      <ul class="service-grid service-grid-primary">${serviceCards}</ul>
      ${
        otherServiceLinks
          ? `<div class="other-services">
        <p class="other-services-label">Diğer hizmet konuları:</p>
        <ul class="other-services-list">${otherServiceLinks}</ul>
      </div>`
          : ''
      }
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

    ${renderCta('Sümer Hukuk Bürosu, Adana\'da gayrimenkul, tapu, miras ve ortaklığın giderilmesi süreçlerinde hukuki danışmanlık ve dava takibi hizmeti sunar.')}

    ${renderLocationSection()}`;

  const heroPreload =
    heroImg.src.endsWith('.webp')
      ? `<link rel="preload" as="image" href="${escapeHtml(heroImg.src)}" fetchpriority="high">`
      : '';

  return layout({
    pageTitle: `Adana Gayrimenkul, Tapu ve Miras Avukatı | ${env.siteName}`,
    description:
      'Sümer Hukuk Bürosu, Adana\'da gayrimenkul hukuku, tapu davaları, miras hukuku, ortaklığın giderilmesi ve izale-i şuyu davalarında hukuki danışmanlık ve avukatlık hizmeti sunar.',
    siteName: env.siteName,
    siteUrl: `${env.siteUrl}/`,
    body,
    extraHead: `${heroPreload}${heroPreload ? '\n  ' : ''}<script type="application/ld+json">${JSON.stringify(homeGraphSchema(env, homeFaq))}</script>`,
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
  writeFileSync(join(DIST, '404.html'), render404Page(env), 'utf-8');

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

  for (const name of [
    'favicon.ico',
    'favicon.png',
    'favicon-16x16.png',
    'favicon-32x32.png',
    'apple-touch-icon.png',
  ]) {
    const src = join(PUBLIC_DIR, name);
    if (existsSync(src)) {
      cpSync(src, join(DIST, name));
    }
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
