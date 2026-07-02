import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { slugify } from './lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');

const TR_MAP = {
  ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u',
  Ç: 'c', Ğ: 'g', İ: 'i', Ö: 'o', Ş: 's', Ü: 'u',
};

export function normalizeKey(text) {
  if (!text) return '';
  return String(text)
    .split('')
    .map((ch) => TR_MAP[ch] ?? ch)
    .join('')
    .toLowerCase()
    .replace(/[''"]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

export function loadManualTopics() {
  const path = join(DATA_DIR, 'article-topics.json');
  if (!existsSync(path)) return [];
  return readJson(path);
}

export function loadTaxonomy() {
  return readJson(join(DATA_DIR, 'keyword-taxonomy.json'));
}

export function loadPillars() {
  return readJson(join(DATA_DIR, 'pillars.json'));
}

function articleDirs() {
  return [
    join(ROOT, 'content', 'articles'),
    join(ROOT, 'generated-articles'),
    join(ROOT, 'public', 'articles'),
  ];
}

export function readAllExistingArticles() {
  const articles = [];
  for (const dir of articleDirs()) {
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      try {
        articles.push(JSON.parse(readFileSync(join(dir, file), 'utf-8')));
      } catch {
        // skip invalid json
      }
    }
  }
  return articles;
}

export function buildUsedKeys(articles) {
  const used = {
    slugs: new Set(),
    titles: new Set(),
    keywords: new Set(),
    similarity: new Set(),
    topics: new Set(),
  };

  for (const article of articles) {
    if (article.slug) used.slugs.add(normalizeKey(article.slug));
    if (article.title) used.titles.add(normalizeKey(article.title));
    if (article.primaryKeyword) used.keywords.add(normalizeKey(article.primaryKeyword));
    if (article.sourceTopic) used.topics.add(normalizeKey(article.sourceTopic));
    if (article.topicSimilarityKey) used.similarity.add(normalizeKey(article.topicSimilarityKey));
    if (article.suggestedSlug) used.slugs.add(normalizeKey(article.suggestedSlug));
  }

  return used;
}

function isTopicUsed(topic, used) {
  const keys = [
    normalizeKey(topic.suggestedSlug),
    normalizeKey(topic.title),
    normalizeKey(topic.primaryKeyword),
    normalizeKey(topic.topicSimilarityKey),
  ];
  return keys.some(
    (k) =>
      k &&
      (used.slugs.has(k) ||
        used.titles.has(k) ||
        used.keywords.has(k) ||
        used.similarity.has(k) ||
        used.topics.has(k))
  );
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function fillPattern(pattern, vars) {
  return pattern
    .replace('{assetType}', vars.assetType)
    .replace('{legalAction}', vars.legalAction)
    .replace('{audience}', vars.audience)
    .replace('{intentModifier}', vars.intentModifier || '');
}

function pillarForLegalAction(legalAction) {
  const la = legalAction.toLowerCase();
  if (la.includes('ortaklığın') || la.includes('izale')) return 'Ortaklığın Giderilmesi Davası';
  if (la.includes('miras') || la.includes('tenkis') || la.includes('muvazaa')) return 'Miras Hukuku';
  if (la.includes('tapu') || la.includes('kadastro')) return 'Tapu İptal ve Tescil Davası';
  if (la.includes('mal paylaşım') || la.includes('katılma') || la.includes('mal rejimi'))
    return 'Boşanmada Mal Paylaşımı';
  return 'Gayrimenkul Hukuku';
}

function buildGeneratedTopic(vars, taxonomy, pillars, suffix = '') {
  const pillarName = pillarForLegalAction(vars.legalAction);
  const pillarId = taxonomy.pillarMapping[pillarName] || 'gayrimenkul-hukuku';
  const pillar = pillars.find((p) => p.id === pillarId) || pillars[0];

  const titleBase = fillPattern(
    vars.pattern || '{assetType} için {legalAction} davası nasıl açılır?',
    vars
  );
  const title = suffix ? `${titleBase} — ${suffix}` : titleBase;
  const primaryKeyword = `${vars.assetType} ${vars.legalAction}`.trim();
  const similarity = slugify(`${pillarId}-${primaryKeyword}-${suffix || vars.intentModifier || 'gen'}`).slice(
    0,
    100
  );

  return {
    title,
    primaryKeyword,
    secondaryKeywords: [vars.legalAction, vars.assetType, vars.audience].filter(Boolean),
    pillar: pillarName,
    pillarSlug: pillar.internalLink,
    searchIntent: 'informational',
    audience: vars.audience || 'taşınmaz sahipleri',
    priority: 3,
    suggestedSlug: slugify(title).slice(0, 90),
    topicSimilarityKey: similarity,
    internalLinks: [pillar.internalLink, '/makaleler/'],
    isPillar: false,
  };
}

function generateCandidates(taxonomy, pillars) {
  const candidates = [];
  const {
    legalActions,
    assetTypes,
    audiences,
    intentModifiers,
    questionPatterns,
    lastResortModifiers,
    localSeoPrefixes,
  } = taxonomy;

  for (const pattern of questionPatterns) {
    for (const legalAction of legalActions) {
      for (const assetType of assetTypes) {
        for (const audience of audiences) {
          candidates.push(
            buildGeneratedTopic({ pattern, legalAction, assetType, audience }, taxonomy, pillars)
          );
        }
      }
    }
  }

  for (const legalAction of legalActions) {
    for (const assetType of assetTypes) {
      for (const modifier of intentModifiers) {
        candidates.push(
          buildGeneratedTopic(
            {
              pattern: '{assetType} için {legalAction} {intentModifier}',
              legalAction,
              assetType,
              audience: 'paydaşlar',
              intentModifier: modifier,
            },
            taxonomy,
            pillars,
            modifier
          )
        );
      }
    }
  }

  for (const prefix of localSeoPrefixes) {
    for (const legalAction of legalActions.slice(0, 8)) {
      for (const assetType of assetTypes.slice(0, 6)) {
        candidates.push(
          buildGeneratedTopic(
            {
              pattern: `${prefix} {assetType} {legalAction} süreci`,
              legalAction,
              assetType,
              audience: 'taşınmaz sahipleri',
            },
            taxonomy,
            pillars,
            prefix
          )
        );
      }
    }
  }

  for (const modifier of lastResortModifiers) {
    for (const legalAction of legalActions) {
      for (const assetType of assetTypes) {
        candidates.push(
          buildGeneratedTopic({ legalAction, assetType, audience: 'mirasçılar' }, taxonomy, pillars, modifier)
        );
      }
    }
  }

  return candidates;
}

export function pickNextTopic(articles = []) {
  const used = buildUsedKeys(articles);
  const manualTopics = loadManualTopics();
  const taxonomy = loadTaxonomy();
  const pillars = loadPillars();

  const availableManual = shuffle(
    manualTopics
      .filter((t) => !isTopicUsed(t, used))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
  );

  if (availableManual.length > 0) {
    return { ...availableManual[0], source: 'manual-pool' };
  }

  console.warn('Uyarı: Manuel konu havuzu tükendi. Otomatik keyword üretimine geçiliyor...');

  const generated = shuffle(generateCandidates(taxonomy, pillars));
  const availableGenerated = generated.filter((t) => !isTopicUsed(t, used));

  if (availableGenerated.length > 0) {
    return { ...availableGenerated[0], source: 'generated-keyword' };
  }

  const fallbackTitle = `Adana taşınmaz uyuşmazlıklarında hukuki süreç rehberi ${Date.now()}`;
  const fallback = {
    title: fallbackTitle,
    primaryKeyword: 'adana taşınmaz uyuşmazlığı',
    secondaryKeywords: ['gayrimenkul hukuku', 'miras hukuku'],
    pillar: 'Gayrimenkul Hukuku',
    pillarSlug: '/adana-gayrimenkul-avukati/',
    searchIntent: 'informational',
    audience: 'taşınmaz sahipleri',
    priority: 1,
    suggestedSlug: slugify(fallbackTitle),
    topicSimilarityKey: slugify(`fallback-${Date.now()}`),
    internalLinks: ['/adana-gayrimenkul-avukati/', '/makaleler/'],
    isPillar: false,
    source: 'generated-keyword',
  };

  console.warn('Uyarı: Benzersiz otomatik konu üretimi zorlandı. Son çare başlığı kullanılıyor.');
  return fallback;
}
