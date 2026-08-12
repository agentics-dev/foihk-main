import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const BASE_URL = "https://www.foihk.org";
const LANGUAGES = ["en", "zh-hk", "zh-cn"];
const STATIC_PATHS = [
  "",
  "/about",
  "/philanthropy",
  "/contact",
  "/faq",
  "/articles/education-research",
  "/articles/news-events",
  "/articles/philanthropy",
];
const STATIC_LAST_MODIFIED = "2026-08-03";
const STATIC_LAST_MODIFIED_BY_PATH = new Map([
  ["", "2026-08-04"],
]);
const SNAPSHOT_PATH = resolve(ROOT, "public", "published-articles.json");

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const stripHtml = (value) =>
  (value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const xmlEscape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const getLocalizedValue = (article, field, language) => {
  const suffix = language === "zh-hk" ? "_zhtw" : language === "zh-cn" ? "_zhcn" : "";
  return article[`${field}${suffix}`] || "";
};

const normalizeSlug = (value) => {
  const normalized = value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  if (normalized) return normalized;
  if (value.includes("經濟一週")) return "foihk-economic-digest-art-investment-interview";
  return "article";
};

const getCategoryPath = (category) => category.replaceAll("_", "-");
const CONTENT_FIELDS = ["content", "content_zhtw", "content_zhcn"];
const SOURCE_LABELS = {
  content: "Source",
  content_zhtw: "資料來源",
  content_zhcn: "资料来源",
};
const AUTHORITATIVE_SOURCE_BY_SLUG = new Map([
  [
    "over-200-family-offices-hong-kong",
    "https://www.familyofficehk.gov.hk/en/news/fstb-and-investhk-jointly-attract-over-200-family-offices-to-hong-kong-and-achieve-early-completion-of-kpi/index.html",
  ],
  [
    "new-individual-income-tax-rules-for-offshore-trusts-take-effect-tax-transparency-and-mandatory-compliance-become-the-trend",
    "https://kpmg.com/cn/en/insights/2026/07/china-tax-alert-05.html",
  ],
]);

const getExternalUrls = (value) => [...new Set(
  [...(value || "").matchAll(/https?:\/\/[^\s"'<>]+/g)]
    .map((match) => match[0].replace(/[),.;，。]+$/, ""))
    .filter((url) => !url.startsWith(BASE_URL))
)];

const hasSourceNote = (value) =>
  /(資料來源|资料来源|來源網址|来源网址|官方來源|官方来源|Official Sources|Source(?: URL| Platform)?:)/i.test(value || "")
  || /<a\b[^>]*href=["']https?:\/\//i.test(value || "");

const dedupeUrlsByHost = (urls) => {
  const byHost = new Map();
  for (const url of urls) {
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      if (!byHost.has(host)) byHost.set(host, url);
    } catch {
      // Ignore malformed source URLs from CMS copy.
    }
  }
  return [...byHost.entries()].map(([host, url]) => ({ host, url }));
};

const addSingleSourceNoteWhenMissing = (article) => {
  if (article.category !== "education_research") return article;
  const urls = getExternalUrls(CONTENT_FIELDS.map((field) => article[field] || "").join(" "));
  const authoritativeSource = AUTHORITATIVE_SOURCE_BY_SLUG.get(normalizeSlug(article.slug));
  if (authoritativeSource) urls.push(authoritativeSource);
  const sources = dedupeUrlsByHost(urls);
  if (sources.length === 0) return article;

  const enriched = { ...article };
  for (const field of CONTENT_FIELDS) {
    if (!enriched[field] || hasSourceNote(enriched[field])) continue;
    const links = sources
      .map(({ host, url }) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${host}</a>`)
      .join(", ");
    enriched[field] += `<p>${SOURCE_LABELS[field]}: ${links}</p>`;
  }
  return enriched;
};

const normalizePublicUpdatedAt = (article) => ({
  ...article,
  public_updated_at: Object.prototype.hasOwnProperty.call(article, "public_updated_at")
    ? article.public_updated_at
    : article.updated_at || article.published_at || article.created_at,
});

const fetchOptionalRows = async (table, query) => {
  const { data, error } = await query(supabase.from(table).select("*"));
  if (!error) return data || [];
  if (error.code === "42P01" || error.code === "PGRST205") {
    console.warn(`${table} is not available yet; continuing without its generated data`);
    return [];
  }
  throw new Error(`Failed to fetch ${table}: ${error.message}`);
};

const attachSeoRelations = (articles, faqRows, slugHistoryRows) => {
  const faqByArticle = new Map();
  for (const item of faqRows) {
    const current = faqByArticle.get(item.article_id) || [];
    current.push(item);
    faqByArticle.set(item.article_id, current);
  }
  const historyByArticle = new Map();
  for (const item of slugHistoryRows) {
    const current = historyByArticle.get(item.article_id) || [];
    current.push({ slug: item.old_slug, category: item.category });
    historyByArticle.set(item.article_id, current);
  }

  return articles.map((article) => {
    const items = faqByArticle.get(article.id) || [];
    const getFaq = (questionField, answerField) => items.flatMap((item) => {
      const question = item[questionField]?.trim();
      const answer = item[answerField]?.trim();
      return question && answer ? [{ question, answer }] : [];
    });
    return {
      ...article,
      faq: getFaq("question", "answer"),
      faq_zhtw: getFaq("question_zhtw", "answer_zhtw"),
      faq_zhcn: getFaq("question_zhcn", "answer_zhcn"),
      previous_slugs: historyByArticle.get(article.id) || [],
    };
  });
};

const isIndexable = (article, language) =>
  stripHtml(getLocalizedValue(article, "title", language)).length > 0
  && stripHtml(getLocalizedValue(article, "content", language)).length >= 80;

const hreflangCode = (language) =>
  language === "zh-hk" ? "zh-HK" : language === "zh-cn" ? "zh-CN" : "en";

const renderUrl = ({ loc, lastmod, alternates }) => {
  const alternateLinks = alternates
    .map(({ language, loc: alternateLoc }) =>
      `    <xhtml:link rel="alternate" hreflang="${hreflangCode(language)}" href="${xmlEscape(`${BASE_URL}${alternateLoc}`)}" />`)
    .join("\n");
  const defaultAlternate = alternates.find((item) => item.language === "en") || alternates[0];
  return `  <url>
    <loc>${xmlEscape(`${BASE_URL}${loc}`)}</loc>
    <lastmod>${lastmod}</lastmod>
${alternateLinks}
    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(`${BASE_URL}${defaultAlternate.loc}`)}" />
  </url>`;
};

async function generateSitemap() {
  const { data: remoteArticles, error } = await supabase
    .from("articles")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false, nullsFirst: false });

  let cmsArticles = remoteArticles || [];
  if (error) {
    if (!existsSync(SNAPSHOT_PATH)) {
      console.error(`Failed to fetch articles and no local snapshot is available: ${error.message}`);
      process.exit(1);
    }
    console.warn(`Supabase fetch failed; using the committed article snapshot: ${error.message}`);
    cmsArticles = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8")).filter((article) => !article.static_content);
  }

  let articles;
  if (error) {
    articles = cmsArticles.map(normalizePublicUpdatedAt).map(addSingleSourceNoteWhenMissing);
  } else {
    const [faqRows, slugHistoryRows] = await Promise.all([
      fetchOptionalRows("article_faq_items", (query) => query.eq("enabled", true).order("position", { ascending: true })),
      fetchOptionalRows("article_slug_history", (query) => query.order("created_at", { ascending: true })),
    ]);
    articles = attachSeoRelations(cmsArticles, faqRows, slugHistoryRows)
      .map(normalizePublicUpdatedAt)
      .map(addSingleSourceNoteWhenMissing);
  }

  const urls = [];
  for (const path of STATIC_PATHS) {
    const alternates = LANGUAGES.map((language) => ({
      language,
      loc: `/${language}${path}`,
    }));
    for (const alternate of alternates) {
      urls.push({
        loc: alternate.loc,
        lastmod: STATIC_LAST_MODIFIED_BY_PATH.get(path) || STATIC_LAST_MODIFIED,
        alternates,
      });
    }
  }

  const routeManifest = [];
  for (const article of articles) {
    const slug = normalizeSlug(article.slug);
    const categoryPath = getCategoryPath(article.category);
    const availableLanguages = LANGUAGES.filter((language) => isIndexable(article, language));
    if (availableLanguages.length === 0) continue;
    const alternates = availableLanguages.map((language) => ({
      language,
      loc: `/${language}/articles/${categoryPath}/${slug}`,
    }));
    const lastmod = (article.public_updated_at || article.published_at || article.created_at).split("T")[0];
    for (const alternate of alternates) {
      urls.push({ loc: alternate.loc, lastmod, alternates });
    }
    routeManifest.push({
      id: article.id,
      slug,
      category: article.category,
      languages: availableLanguages,
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map(renderUrl).join("\n")}
</urlset>
`;

  const publicPath = resolve(ROOT, "public");
  const generatedPath = resolve(ROOT, "scripts", "generated");
  mkdirSync(generatedPath, { recursive: true });
  writeFileSync(resolve(publicPath, "sitemap.xml"), xml);
  writeFileSync(
    resolve(publicPath, "published-articles.json"),
    `${JSON.stringify(articles)}\n`
  );
  writeFileSync(
    resolve(generatedPath, "article-routes.json"),
    `${JSON.stringify(routeManifest, null, 2)}\n`
  );
  console.log(`Generated sitemap with ${urls.length} indexable URLs and ${routeManifest.length} article records`);
}

generateSitemap();
