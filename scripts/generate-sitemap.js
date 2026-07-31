import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";
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
  "/press",
  "/contact",
  "/faq",
  "/editorial-policy",
  "/articles/education_research",
  "/articles/news_events",
  "/articles/philanthropy",
];
const STATIC_LAST_MODIFIED = "2026-07-29";

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
  const { data: articles, error } = await supabase
    .from("articles")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error(`Failed to fetch articles: ${error.message}`);
    process.exit(1);
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
        lastmod: STATIC_LAST_MODIFIED,
        alternates,
      });
    }
  }

  const routeManifest = [];
  for (const article of articles || []) {
    const slug = normalizeSlug(article.slug);
    const availableLanguages = LANGUAGES.filter((language) => isIndexable(article, language));
    if (availableLanguages.length === 0) continue;
    const alternates = availableLanguages.map((language) => ({
      language,
      loc: `/${language}/articles/${article.category}/${slug}`,
    }));
    const lastmod = (article.updated_at || article.published_at || article.created_at).split("T")[0];
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
    `${JSON.stringify(articles || [])}\n`
  );
  writeFileSync(
    resolve(generatedPath, "article-routes.json"),
    `${JSON.stringify(routeManifest, null, 2)}\n`
  );
  console.log(`Generated sitemap with ${urls.length} indexable URLs and ${routeManifest.length} article records`);
}

generateSitemap();
