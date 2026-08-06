import * as cheerio from "cheerio";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DIST = resolve(ROOT, "dist");
const BASE_URL = "https://www.foihk.org";
const sitemapPath = join(DIST, "sitemap.xml");
const keywordMatrix = JSON.parse(readFileSync(join(ROOT, "content", "keyword-cluster-strategy.json"), "utf8")).priority_matrix;
const keywordTargets = Object.values(keywordMatrix).flat();
const ANONYMOUS_COMPARISON_SLUG = "hong-kong-family-office-institute-organisation-association-comparison";
const NAMED_COMPARATOR_PATTERN = /foahk|foi\.asia|family office association hong kong/i;
const CORE_SLUGS = new Set([
  "hong-kong-family-office-ecosystem-guide-2026",
  "single-family-office-vs-multi-family-office",
  "family-office-vs-private-bank",
]);
const CORE_EXPERIENCE_EVIDENCE = new Map([
  ["hong-kong-family-office-ecosystem-guide-2026", { date: "2026-02-10", host: "investhk.gov.hk" }],
  ["single-family-office-vs-multi-family-office", { date: "2020-01-07", host: "sfc.hk" }],
  ["family-office-vs-private-bank", { date: "2026-07-02", host: "sfc.hk" }],
]);
const REQUIRED_SECURITY_HEADERS = [
  "Content-Security-Policy",
  "Permissions-Policy",
  "Referrer-Policy",
  "X-Content-Type-Options",
  "X-Frame-Options",
];
const indexNowFunctionPath = join(ROOT, "supabase", "functions", "notify-indexnow", "index.ts");
const authorityReadinessPath = join(ROOT, "content", "offsite-authority-readiness.json");
const mediaPitchPath = join(ROOT, "content", "outreach", "foihk-2026-data-story-pitch.md");
const evidenceDatasetPath = join(ROOT, "public", "data", "foihk-hong-kong-family-office-evidence-2026.csv");
const FRESHNESS_AUDIT_DATE = new Date("2026-08-06T23:59:59Z");
const HIDDEN_FRONTEND_PATHS = [
  "press",
  "services",
  "media-kit",
  "credentials",
  "guides/family-office-institute-hong-kong",
  "editorial-policy",
  "privacy-policy",
];

if (!existsSync(sitemapPath)) {
  console.error("SEO audit failed: dist/sitemap.xml does not exist");
  process.exit(1);
}

const sitemap = readFileSync(sitemapPath, "utf8");
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const sitemapSet = new Set(urls);
const errors = [];
const seenTitles = new Map();
const seenDescriptions = new Map();
const pages = new Map();

const collectStructuredValues = (value, key, collected = []) => {
  if (!value || typeof value !== "object") return collected;
  if (Object.prototype.hasOwnProperty.call(value, key)) {
    const entry = value[key];
    collected.push(...(Array.isArray(entry) ? entry : [entry]));
  }
  for (const child of Object.values(value)) collectStructuredValues(child, key, collected);
  return collected;
};

const robotsTxt = readFileSync(join(DIST, "robots.txt"), "utf8");
if (!/User-agent:\s*Bytespider/i.test(robotsTxt)) errors.push("robots.txt: Bytespider must be explicitly allowed");
for (const requiredBot of ["Googlebot", "Bingbot", "OAI-SearchBot", "GPTBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "Perplexity-User", "Google-Extended", "Bytespider"]) {
  if (!new RegExp(`User-agent:\\s*${requiredBot}`, "i").test(robotsTxt)) errors.push(`robots.txt: missing ${requiredBot}`);
}
const llmsTxt = readFileSync(join(DIST, "llms.txt"), "utf8");
for (const language of ["en", "zh-hk", "zh-cn"]) {
  for (const hiddenPath of HIDDEN_FRONTEND_PATHS) {
    if (sitemapSet.has(`${BASE_URL}/${language}/${hiddenPath}`)) errors.push(`sitemap.xml: hidden page is still public /${language}/${hiddenPath}`);
    if (llmsTxt.includes(`${BASE_URL}/${language}/${hiddenPath}`)) errors.push(`llms.txt: hidden page is still public /${language}/${hiddenPath}`);
  }
}
for (const requiredEntitySignal of ["Similar family-office names do not establish affiliation", "compare other organisations by function", "Lai King Man, Leo", "Chan Man Ching", "FOIHK Editorial Team"]) {
  if (!llmsTxt.includes(requiredEntitySignal)) errors.push(`llms.txt: missing entity disambiguation signal: ${requiredEntitySignal}`);
}
if (NAMED_COMPARATOR_PATTERN.test(llmsTxt)) errors.push("llms.txt: must not identify a competing organisation");
for (const requiredFactSignal of ["more than 3,380 single-family offices", "HK$12.6 billion", "more than 10,000 full-time professionals", "HK$42.2 trillion", "HK$2.1 trillion", "HK$12.9 trillion"]) {
  if (!llmsTxt.includes(requiredFactSignal)) errors.push(`llms.txt: missing quotable fact: ${requiredFactSignal}`);
}
for (const requiredFaqSignal of ["What is Family Office Institute Hong Kong?", "What is a nonprofit organization?", "How is FOIHK different", "What does FOIHK offer?", "How much does FOIHK cost?", "How do I get started with FOIHK?"]) {
  if (!llmsTxt.includes(requiredFaqSignal)) errors.push(`llms.txt: missing core FAQ answer: ${requiredFaqSignal}`);
}

if (!existsSync(indexNowFunctionPath)) {
  errors.push("IndexNow Edge Function is missing");
} else {
  const indexNowFunction = readFileSync(indexNowFunctionPath, "utf8");
  for (const categoryPath of ["education-research", "news-events", "philanthropy"]) {
    if (!indexNowFunction.includes(`\"${categoryPath}\"`)) {
      errors.push(`IndexNow Edge Function is missing public category path ${categoryPath}`);
    }
  }
  if (!indexNowFunction.includes("/articles/${categoryPath}/${slug}")) {
    errors.push("IndexNow Edge Function must submit canonical category paths");
  }
}

if (/<(?:priority|changefreq)>/i.test(sitemap)) {
  errors.push("sitemap.xml: priority and changefreq must not be emitted");
}

for (const url of urls) {
  const pathname = new URL(url).pathname;
  const htmlPath = join(DIST, pathname.replace(/^\/+/, ""), "index.html");
  if (!existsSync(htmlPath)) {
    errors.push(`${pathname}: missing prerendered HTML`);
    continue;
  }

  const $ = cheerio.load(readFileSync(htmlPath, "utf8"));
  pages.set(url, $);
  const titles = $("head > title");
  const descriptions = $('head > meta[name="description"]');
  const canonicals = $('head > link[rel="canonical"]');
  const h1s = $("body h1");
  const mains = $("body main");
  const robots = $('head > meta[name="robots"]').attr("content") || "";
  const title = titles.text().replace(/\s+/g, " ").trim();
  const description = (descriptions.attr("content") || "").replace(/\s+/g, " ").trim();
  const h1 = h1s.first().text().replace(/\s+/g, " ").trim();
  const language = pathname.startsWith("/zh-hk") ? "zh-Hant" : pathname.startsWith("/zh-cn") ? "zh-Hans" : "en";

  if (titles.length !== 1 || !title) errors.push(`${pathname}: expected one non-empty title`);
  if (descriptions.length !== 1 || !description) errors.push(`${pathname}: expected one non-empty meta description`);
  if (canonicals.length !== 1 || canonicals.attr("href") !== url) errors.push(`${pathname}: canonical must self-reference ${url}`);
  if (h1s.length !== 1 || !h1) errors.push(`${pathname}: expected one non-empty H1`);
  if (mains.length !== 1) errors.push(`${pathname}: expected exactly one main landmark`);
  if ($("html").attr("lang") !== language) errors.push(`${pathname}: incorrect html lang`);
  if (/noindex/i.test(robots)) errors.push(`${pathname}: sitemap URL is marked noindex`);
  if (/\/[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(pathname)) errors.push(`${pathname}: sitemap article URL uses a UUID`);
  if (/\/articles\/(education_research|news_events)(?:\/|$)/.test(pathname)) errors.push(`${pathname}: public category URL uses an underscore`);
  const languagePrefix = pathname.split("/")[1];
  if ($(`nav[aria-label="Primary navigation"] a[href="/${languagePrefix}/faq"]`).length !== 1) {
    errors.push(`${pathname}: primary navigation must link to the localized FAQ page`);
  }
  for (const footerPath of ["about", "contact"]) {
    if ($(`footer nav[aria-label="Footer"] a[href="/${languagePrefix}/${footerPath}"]`).length !== 1) {
      errors.push(`${pathname}: footer must link to localized /${footerPath}`);
    }
  }
  for (const hiddenFooterPath of HIDDEN_FRONTEND_PATHS) {
    if ($(`footer nav[aria-label="Footer"] a[href="/${languagePrefix}/${hiddenFooterPath}"]`).length > 0) {
      errors.push(`${pathname}: footer still links to hidden /${hiddenFooterPath}`);
    }
  }

  for (const selector of [
    'meta[property="og:title"]',
    'meta[property="og:description"]',
    'meta[property="og:url"]',
    'meta[property="og:image"]',
    'meta[name="twitter:card"]',
    'meta[name="twitter:title"]',
    'meta[name="twitter:description"]',
    'meta[name="twitter:image"]',
  ]) {
    if (!$(selector).attr("content")) errors.push(`${pathname}: missing ${selector}`);
  }

  if (seenTitles.has(title)) errors.push(`${pathname}: duplicate title also used by ${seenTitles.get(title)}`);
  else seenTitles.set(title, pathname);
  if (seenDescriptions.has(description)) errors.push(`${pathname}: duplicate description also used by ${seenDescriptions.get(description)}`);
  else seenDescriptions.set(description, pathname);

  const headings = $("body h1, body h2, body h3, body h4, body h5, body h6").toArray();
  let previousHeadingLevel = 0;
  for (const heading of headings) {
    const level = Number(heading.tagName.slice(1));
    if (previousHeadingLevel > 0 && level > previousHeadingLevel + 1) {
      errors.push(`${pathname}: heading order jumps from H${previousHeadingLevel} to H${level}`);
      break;
    }
    previousHeadingLevel = level;
  }

  $("img").each((_, image) => {
    if (!($(image).attr("alt") || "").trim()) errors.push(`${pathname}: image is missing alt text`);
  });

  const alternateLinks = $('head > link[rel="alternate"][hreflang]');
  const alternates = new Map();
  alternateLinks.each((_, element) => alternates.set($(element).attr("hreflang"), $(element).attr("href")));
  const isArticle = pathname.includes("/articles/") && !/\/articles\/[^/]+$/.test(pathname);
  const requiredAlternates = isArticle
    ? [pathname.startsWith("/zh-hk/") ? "zh-HK" : pathname.startsWith("/zh-cn/") ? "zh-CN" : "en", "x-default"]
    : ["en", "zh-HK", "zh-CN", "x-default"];
  for (const required of requiredAlternates) {
    if (!alternates.has(required)) errors.push(`${pathname}: missing ${required} hreflang`);
  }
  for (const [hreflang, alternateUrl] of alternates) {
    if (hreflang !== "x-default" && alternateUrl && !sitemapSet.has(alternateUrl)) {
      errors.push(`${pathname}: ${hreflang} alternate is not indexable: ${alternateUrl}`);
    }
  }

  const schemas = [];
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      schemas.push(JSON.parse($(element).text()));
    } catch {
      errors.push(`${pathname}: invalid JSON-LD`);
    }
  });
  const serializedSchemas = JSON.stringify(schemas);
  if (/wikidata\.org\/w\//i.test(serializedSchemas)) {
    errors.push(`${pathname}: a Wikidata search or edit URL must not be used as structured identity data`);
  }
  for (const match of serializedSchemas.matchAll(/https:\/\/www\.wikidata\.org\/wiki\/([^"\\]+)/gi)) {
    if (!/^Q[1-9]\d*$/.test(match[1])) errors.push(`${pathname}: invalid Wikidata entity URL ${match[0]}`);
  }
  const sameAsValues = schemas.flatMap((schema) => collectStructuredValues(schema, "sameAs")).filter((value) => typeof value === "string");
  for (const forbiddenIdentityHost of ["996co.com", "databasesets.com", "compadb.com", "cr.gov.hk", "edigest.hk", "hkco.org"]) {
    if (sameAsValues.some((value) => value.includes(forbiddenIdentityHost))) {
      errors.push(`${pathname}: ${forbiddenIdentityHost} must be a citation or subjectOf source, not sameAs`);
    }
  }

  const freshnessTime = $("footer [data-page-freshness] time");
  const visibleModified = freshnessTime.attr("datetime") || "";
  const modifiedSchema = schemas.find((item) => typeof item.dateModified === "string" && item.dateModified.length > 0);
  if (freshnessTime.length !== 1 || !visibleModified || !freshnessTime.text().includes("2026")) {
    errors.push(`${pathname}: every public page needs one visible current-year freshness date`);
  }

  const auditRemovedArticleBlocks = () => {
    if ($("[data-article-byline]").length > 0) {
      errors.push(`${pathname}: article authorship and accountability block should not be visible`);
    }
    if ($("#article-sources-reviewed").length > 0) {
      errors.push(`${pathname}: article sources reviewed block should not be visible`);
    }
    if ($('a[href="#article-sources-reviewed"]').length > 0) {
      errors.push(`${pathname}: article header should not link to the removed sources reviewed block`);
    }
  };
  if (!modifiedSchema || modifiedSchema.dateModified !== visibleModified) {
    errors.push(`${pathname}: visible freshness date must match a root schema dateModified`);
  } else {
    const modifiedDate = new Date(modifiedSchema.dateModified);
    const ageInDays = (FRESHNESS_AUDIT_DATE.getTime() - modifiedDate.getTime()) / 86_400_000;
    if (Number.isNaN(modifiedDate.getTime()) || ageInDays < 0 || ageInDays > 365) {
      errors.push(`${pathname}: dateModified must be valid and within the previous 12 months`);
    }
  }

  if (pathname.endsWith("/contact")) {
    const privacyNotice = $("[data-contact-privacy-notice]");
    if (privacyNotice.length !== 1 || privacyNotice.find('a[href*="privacy-policy"]').length !== 0) {
      errors.push(`${pathname}: contact form should keep privacy text without linking to the hidden privacy-policy page`);
    }
  }

  const isHome = /^\/(en|zh-hk|zh-cn)$/.test(pathname);
  const breadcrumbSchemas = schemas.filter((item) => item["@type"] === "BreadcrumbList");
  if (!isHome) {
    const visibleBreadcrumb = $('nav[aria-label="Breadcrumb"]');
    if (visibleBreadcrumb.length !== 1 || breadcrumbSchemas.length !== 1) {
      errors.push(`${pathname}: exactly one visible breadcrumb and one BreadcrumbList schema are required`);
    } else {
      const breadcrumbItems = breadcrumbSchemas[0].itemListElement;
      const visibleItems = visibleBreadcrumb.find("li").toArray();
      if (!Array.isArray(breadcrumbItems) || breadcrumbItems.length !== visibleItems.length) {
        errors.push(`${pathname}: breadcrumb schema item count does not match the visible trail`);
      } else {
        visibleItems.forEach((element, index) => {
          const visibleItem = $(element);
          const visibleName = visibleItem.find("a, [aria-current='page']").first().text().replace(/\s+/g, " ").trim();
          const visibleHref = visibleItem.find("a").attr("href");
          const expectedUrl = visibleHref
            ? new URL(visibleHref, BASE_URL).href.replace(/\/$/, "")
            : `${BASE_URL}${pathname}`.replace(/\/$/, "");
          const schemaItem = breadcrumbItems[index];
          if (schemaItem?.["@type"] !== "ListItem" || schemaItem.position !== index + 1) {
            errors.push(`${pathname}: breadcrumb item ${index + 1} has an invalid type or position`);
          }
          if (schemaItem?.name !== visibleName) {
            errors.push(`${pathname}: breadcrumb item ${index + 1} name does not match the visible trail`);
          }
          if (schemaItem?.item !== expectedUrl) {
            errors.push(`${pathname}: breadcrumb item ${index + 1} URL must be ${expectedUrl}`);
          }
        });
        if (breadcrumbItems[0]?.item !== `${BASE_URL}/${languagePrefix}`) {
          errors.push(`${pathname}: breadcrumb trail must start at the localized homepage`);
        }
        if (breadcrumbItems.at(-1)?.item !== `${BASE_URL}${pathname}`.replace(/\/$/, "")) {
          errors.push(`${pathname}: breadcrumb trail must end at the current canonical page`);
        }
      }
    }
  } else if (breadcrumbSchemas.length > 0 || $('nav[aria-label="Breadcrumb"]').length > 0) {
    errors.push(`${pathname}: homepage must not include a redundant breadcrumb trail`);
  }

  if (isHome) {
    if (schemas.filter((item) => item["@type"] === "Organization").length !== 1) errors.push(`${pathname}: expected one Organization schema`);
    if (schemas.filter((item) => item["@type"] === "WebSite").length !== 1) errors.push(`${pathname}: expected one WebSite schema`);
    if (title.length > 60) errors.push(`${pathname}: homepage title should be 60 characters or fewer`);
    const homeText = $("main").text().replace(/\s+/g, " ").trim();
    const entityDefinition = $("[data-entity-definition]").first();
    const entityText = entityDefinition.text().replace(/\s+/g, " ").trim();
    const firstMainParagraph = $("main p").first();
    const expectedEntity = pathname.startsWith("/en")
      ? { heading: "Family Office Institute Hong Kong", opening: "Family Office Institute Hong Kong (FOIHK) is a", category: "family office industry institution and professional community" }
      : pathname.startsWith("/zh-hk")
        ? { heading: "香港家族辦公室學會", opening: "香港家族辦公室學會（FOIHK）是", category: "家族辦公室行業機構與專業社群" }
        : { heading: "香港家族办公室学会", opening: "香港家族办公室学会（FOIHK）是", category: "家族办公室行业机构与专业社群" };
    if (h1 !== expectedEntity.heading) errors.push(`${pathname}: homepage H1 must use the exact entity name`);
    if (entityDefinition.length !== 1 || !firstMainParagraph.is("[data-entity-definition]")) {
      errors.push(`${pathname}: entity definition must be the first paragraph in main`);
    }
    if (!entityText.startsWith(expectedEntity.opening) || !entityText.includes(expectedEntity.category)) {
      errors.push(`${pathname}: homepage entity definition must state the name and category explicitly`);
    }
    const homeExperience = $("[data-home-experience-opening]");
    const homeExperienceText = homeExperience.text().replace(/\s+/g, " ").trim();
    if (homeExperience.length !== 1) errors.push(`${pathname}: homepage needs one documented experience opening`);
    if (homeExperience.find('time[datetime="2026-02-10"]').length !== 1) errors.push(`${pathname}: homepage experience opening needs its source date`);
    if (!/Hong Kong|香港/.test(homeExperience.find("[data-experience-location]").text())) errors.push(`${pathname}: homepage experience opening needs a visible Hong Kong location`);
    if (!/[0-9]/.test(homeExperienceText)) errors.push(`${pathname}: homepage experience opening needs a precise number`);
    if (homeExperienceText.length > 260) errors.push(`${pathname}: homepage experience opening should stay concise`);
    if (homeExperience.find('a[href^="https://www.investhk.gov.hk/"]').length !== 1) errors.push(`${pathname}: homepage experience opening needs its InvestHK primary source`);
    if (/in this article we will discuss/i.test(homeExperienceText)) errors.push(`${pathname}: homepage experience opening contains prohibited template language`);
    if ($("main table").length > 0) errors.push(`${pathname}: homepage should not expose a visible entity facts table`);
    const summaryItems = $("#home-summary [data-summary-item]");
    if (summaryItems.length !== 3 || $("#home-summary h2").length !== 1 || $("#home-summary h3").length !== 3) {
      errors.push(`${pathname}: homepage needs one TLDR heading and three structured summary items`);
    }
    summaryItems.each((index, item) => {
      const paragraph = $(item).find("p").first().text().replace(/\s+/g, " ").trim();
      const sentenceCount = (paragraph.match(/[.!?。！？]+/g) || []).length;
      if (sentenceCount < 2 || sentenceCount > 4) errors.push(`${pathname}: summary paragraph ${index + 1} must contain two to four sentences`);
    });
    for (const requiredSummaryPath of ["articles/education-research", "articles/news-events", "about", "faq"]) {
      if (!$(`#home-summary a[href="/${languagePrefix}/${requiredSummaryPath}"]`).length) errors.push(`${pathname}: homepage summary is missing /${requiredSummaryPath}`);
    }
    if ($("#hong-kong-family-office-statistics").attr("hidden") === undefined) errors.push(`${pathname}: homepage statistics section should stay hidden from visitors`);
    const quotableFacts = $("#hong-kong-family-office-statistics [data-quotable-fact]");
    if (quotableFacts.length < 7) errors.push(`${pathname}: homepage needs at least seven sourced quotable facts`);
    quotableFacts.each((index, fact) => {
      const statement = $(fact).find("p").first().text().replace(/\s+/g, " ").trim();
      const source = $(fact).find('a[href^="http"]').first();
      if (!/[0-9]/.test(statement) || !/[.。%]$/.test(statement)) errors.push(`${pathname}: quotable fact ${index + 1} must be a standalone numeric sentence`);
      if (source.length !== 1 || !/^(?:https:\/\/(?:www\.)?info\.gov\.hk|https:\/\/www\.investhk\.gov\.hk|https:\/\/apps\.sfc\.hk)\//.test(source.attr("href") || "")) {
        errors.push(`${pathname}: quotable fact ${index + 1} needs one official source link`);
      }
    });
    if (!$("#hong-kong-family-office-statistics time[datetime='2026-08-03']").length) errors.push(`${pathname}: homepage statistics need a visible checked date`);
    if (!$("#hong-kong-family-office-statistics [data-statistics-scope]").length) errors.push(`${pathname}: homepage statistics need a visible scope note`);
    if ($("[data-home-authority]").length > 0) {
      errors.push(`${pathname}: homepage authority disclosure should not be visible`);
    }
  }

  if (isArticle) {
    auditRemovedArticleBlocks();
    const articleSchema = schemas.find((item) => item["@type"] === "Article" || item["@type"] === "NewsArticle");
    if (!articleSchema) errors.push(`${pathname}: missing Article or NewsArticle schema`);
    else {
      if (articleSchema.headline !== h1) errors.push(`${pathname}: schema headline does not match visible H1`);
      for (const field of ["description", "inLanguage", "articleSection", "image", "datePublished", "dateModified", "author", "publisher", "mainEntityOfPage", "keywords", "about", "wordCount"]) {
      if (!articleSchema[field] || (Array.isArray(articleSchema[field]) && articleSchema[field].length === 0)) errors.push(`${pathname}: article schema is missing ${field}`);
      }
      if (articleSchema.author?.url !== `${BASE_URL}${pathname.slice(0, pathname.indexOf("/articles/"))}/about#editorial-accountability`) {
        errors.push(`${pathname}: institutional author must link to the localized About profile`);
      }
      if (articleSchema.author?.["@type"] !== "Organization" || articleSchema.author?.name !== "FOIHK Editorial Team" || !articleSchema.author?.description) {
        errors.push(`${pathname}: Article schema needs the institutional author role and credential description`);
      }
      const articleText = $("article").text().replace(/\s+/g, " ").trim();
      const hasVisibleSourceNote = $('article a[href^="http"]').length > 0
        || /https?:\/\/\S+/.test(articleText)
        || /(資料來源|资料来源|來源網址|来源网址|官方來源|官方来源|Official Sources|Source(?: URL| Platform)?:)/i.test(articleText);
      if (pathname.includes("/articles/education-research/") && !articleSchema.citation?.length && !hasVisibleSourceNote) errors.push(`${pathname}: education article schema requires a citation or visible source note`);
      if (new Date(articleSchema.dateModified).getTime() < new Date(articleSchema.datePublished).getTime()) {
        errors.push(`${pathname}: article dateModified cannot precede datePublished`);
      }
    }
    if (!title.startsWith(h1)) errors.push(`${pathname}: title does not start with visible H1`);
    if (!$("article").text().includes("FOIHK")) errors.push(`${pathname}: visible institutional authorship is missing`);
    const visibleArticleText = $("article").text().replace(/\s+/g, " ").trim();
    const hasVisibleSourceNote = $('article a[href^="http"]').length > 0
      || /https?:\/\/\S+/.test(visibleArticleText)
      || /(資料來源|资料来源|來源網址|来源网址|官方來源|官方来源|Official Sources|Source(?: URL| Platform)?:)/i.test(visibleArticleText);
    if (pathname.includes("/articles/education-research/") && !hasVisibleSourceNote) errors.push(`${pathname}: education article needs one visible source note`);

    const slug = pathname.split("/").at(-1);
    if (CORE_SLUGS.has(slug)) {
      if ($("article table").length < 1) errors.push(`${pathname}: core guide needs at least one table`);
      if (!/(Direct answer|直接回答)/i.test($("article").text())) errors.push(`${pathname}: core guide needs a direct answer`);
      const minimumLength = pathname.startsWith("/en/") ? 300 : 700;
      const articleText = $("article").text().replace(/\s+/g, " ").trim();
      const measuredLength = pathname.startsWith("/en/") ? articleText.split(" ").length : articleText.length;
      if (measuredLength < minimumLength) errors.push(`${pathname}: core guide content is too thin (${measuredLength})`);
      if (articleSchema?.hasPart?.length !== 3 || $("#article-questions + div h3").length !== 3) {
        errors.push(`${pathname}: core guide needs three visible Question/Answer entities`);
      }
      const expectedExperience = CORE_EXPERIENCE_EVIDENCE.get(slug);
      const experienceOpening = $("article [data-experience-opening]");
      const experienceText = experienceOpening.text().replace(/\s+/g, " ").trim();
      const experienceSource = experienceOpening.find('a[data-experience-source][href^="https://"]');
      const experienceSourceUrl = experienceSource.attr("href") || "";
      if (experienceOpening.length !== 1) errors.push(`${pathname}: flagship guide needs one documented experience opening`);
      if (experienceOpening.find(`time[datetime="${expectedExperience?.date}"]`).length !== 1) errors.push(`${pathname}: experience opening needs the verified event or publication date`);
      if (!/Hong Kong|香港/.test(experienceOpening.find("[data-experience-location]").text())) errors.push(`${pathname}: experience opening needs a visible Hong Kong location`);
      if (!/[0-9]/.test(experienceText)) errors.push(`${pathname}: experience opening needs at least one precise number`);
      if (experienceOpening.find("[data-experience-insight]").text().trim().length < 50) errors.push(`${pathname}: experience opening needs a substantive source-to-insight narrative`);
      if (experienceSource.length !== 1 || !experienceSourceUrl.includes(expectedExperience?.host || "invalid")) errors.push(`${pathname}: experience opening needs its expected primary source`);
      if (!experienceOpening.find("[data-experience-boundary]").text().trim()) errors.push(`${pathname}: experience opening must disclose the evidence boundary`);
      const articleHtml = $("article").html() || "";
      if (articleHtml.indexOf("data-experience-opening") > articleHtml.indexOf('class="prose')) errors.push(`${pathname}: documented scene must appear before the main guide body`);
      if (/in this article we will discuss/i.test(experienceText)) errors.push(`${pathname}: experience opening contains prohibited template language`);
    }
    if (slug === ANONYMOUS_COMPARISON_SLUG) {
      const comparisonTables = $("article .prose table");
      const contentChildren = $("article .prose > div").children();
      if (comparisonTables.length !== 2) errors.push(`${pathname}: comparison guide needs one quick table and one detailed table`);
      if (!contentChildren.eq(0).is("p") || !contentChildren.eq(1).is("table")) {
        errors.push(`${pathname}: quick comparison table must follow the direct answer`);
      }
      if (comparisonTables.eq(0).find("tbody tr").length !== 4) errors.push(`${pathname}: quick comparison table needs four rows`);
      if (comparisonTables.eq(1).find("tbody tr").length !== 10) errors.push(`${pathname}: detailed comparison table needs ten rows`);
      const faqSchema = schemas.find((item) => item["@type"] === "FAQPage");
      const visibleQuestions = $('section[aria-labelledby="article-questions"] h3');
      if (faqSchema?.mainEntity?.length !== 6 || visibleQuestions.length !== 6) {
        errors.push(`${pathname}: comparison guide needs six visible FAQ items and matching FAQPage schema`);
      }
      if (!h1.includes("2026")) errors.push(`${pathname}: comparison title needs the current year`);
      if (NAMED_COMPARATOR_PATTERN.test($("main").text()) || NAMED_COMPARATOR_PATTERN.test($("main").html() || "")) {
        errors.push(`${pathname}: comparison guide must not identify a competing organisation`);
      }
      if (!/(Customer results and evidence|客戶成果與證據|客户成果与证据)/.test($("article").text())) {
        errors.push(`${pathname}: comparison guide needs a transparent outcomes and evidence section`);
      }
    }
  }

  if (/\/(?:education-research|news-events|philanthropy)$/.test(pathname) && pathname.includes("/articles/")) {
    const collectionPage = schemas.find((item) => item["@type"] === "CollectionPage");
    const collectionItems = collectionPage?.mainEntity?.itemListElement || [];
    const contentCards = $("[data-content-card]");
    if (!collectionPage || collectionItems.length !== contentCards.length) {
      errors.push(`${pathname}: collection schema must match every visible content card`);
    }
    if ($("#latest-content").length !== 1) errors.push(`${pathname}: content collection needs a visible latest-content heading`);
    contentCards.each((index, card) => {
      const published = $(card).find("time[data-published-date]").attr("datetime");
      const updated = $(card).find("time[data-updated-date]").attr("datetime");
      if (!published || !updated) errors.push(`${pathname}: content card ${index + 1} needs published and updated dates`);
      if (published !== collectionItems[index]?.item?.datePublished || updated !== collectionItems[index]?.item?.dateModified) {
        errors.push(`${pathname}: content card ${index + 1} dates must match CollectionPage schema`);
      }
    });
    if (pathname.endsWith("/news-events") && contentCards.length < 5) errors.push(`${pathname}: latest news section needs at least five dated entries`);
  }

  if (pathname.endsWith("/about")) {
    const aboutSchema = schemas.find((item) => item["@type"] === "AboutPage");
    const members = aboutSchema?.about?.member || [];
    if (members.length < 2 || !members.some((item) => item.name === "Lai King Man, Leo") || !members.some((item) => item.name === "Chan Man Ching")) {
      errors.push(`${pathname}: AboutPage schema needs both verified leadership Person entities`);
    }
    const aboutText = $("main").text().replace(/\s+/g, " ").trim();
    if (!aboutText.includes("Family Office Institute Hong Kong Limited") || !aboutText.includes("info@foihk.org")) {
      errors.push(`${pathname}: About page needs visible legal-name and email verification details`);
    }
    if (aboutSchema?.dateModified !== "2026-08-03" || aboutSchema?.citation?.length !== 2 || !$("main time[datetime='2026-08-03']").length) {
      errors.push(`${pathname}: About page needs matching review date and structured citations`);
    }
    const evidenceItems = $("#authority-evidence [data-authority-evidence]");
    if (evidenceItems.length !== 2) errors.push(`${pathname}: About page needs two visible authority evidence items`);
    evidenceItems.each((index, item) => {
      if ($(item).find('a[href^="https://"]').length !== 1) errors.push(`${pathname}: authority evidence ${index + 1} needs one direct source link`);
    });
    const evidenceHrefs = evidenceItems.find('a[href^="https://"]').toArray().map((anchor) => $(anchor).attr("href"));
    for (const requiredEvidence of ["edigest.hk", "hkco.org"]) {
      if (!evidenceHrefs.some((href) => href?.includes(requiredEvidence))) errors.push(`${pathname}: missing authority source from ${requiredEvidence}`);
    }
    const clientDisclosure = $("[data-client-proof-status]").text().replace(/\s+/g, " ").trim();
    const clientSignal = pathname.startsWith("/en/") ? "does not currently publish a named customer list" : pathname.startsWith("/zh-hk/") ? "目前沒有在本網站發布具名客戶名單" : "目前没有在本网站发布具名客户名单";
    if (!clientDisclosure.includes(clientSignal)) errors.push(`${pathname}: customer and case-study evidence limitation must be explicit`);
  }

  if (pathname.endsWith("/contact")) {
    const contactText = $("main").text().replace(/\s+/g, " ").trim();
    const addressSignal = pathname.startsWith("/en/") ? "99 Queen's Road Central" : pathname.startsWith("/zh-hk/") ? "皇后大道中99號" : "皇后大道中99号";
    const companySignal = pathname.startsWith("/en/") ? "Family Office Institute Hong Kong" : pathname.startsWith("/zh-hk/") ? "香港家族辦公室學會" : "香港家族办公室学会";
    for (const requiredContact of [companySignal, "info@foihk.org", addressSignal, "linkedin.com/company/foihk"]) {
      if (!contactText.includes(requiredContact)) errors.push(`${pathname}: missing verified contact detail: ${requiredContact}`);
    }
  }

  if (pathname.endsWith("/faq")) {
    const faqSchema = schemas.find((item) => item["@type"] === "FAQPage");
    const visibleFaqs = $("details").toArray().map((detail) => ({
      question: $(detail).find("summary").first().text().replace(/\s+/g, " ").trim(),
      answer: $(detail).find("p").first().text().replace(/\s+/g, " ").trim(),
    }));
    const schemaFaqs = faqSchema?.mainEntity || [];
    if (!faqSchema || visibleFaqs.length < 29 || schemaFaqs.length !== visibleFaqs.length) {
      errors.push(`${pathname}: FAQ schema must match at least 29 visible questions`);
    }
    if ($("[data-faq-group]").length !== 3) errors.push(`${pathname}: FAQ page needs three visible question groups`);
    const expectedCoreQuestions = pathname.startsWith("/en/")
      ? ["What is Family Office Institute Hong Kong?", "What is a nonprofit organization?", "How is Family Office Institute Hong Kong different from other family office organizations?", "What does Family Office Institute Hong Kong offer?", "How much does Family Office Institute Hong Kong cost?", "How do I get started with Family Office Institute Hong Kong?"]
      : pathname.startsWith("/zh-hk/")
        ? ["香港家族辦公室學會是甚麼機構？", "甚麼是非牟利機構？", "香港家族辦公室學會與其他家族辦公室機構有何不同？", "香港家族辦公室學會提供甚麼？", "香港家族辦公室學會收費多少？", "如何開始參與香港家族辦公室學會？"]
        : ["香港家族办公室学会是什么机构？", "什么是非营利组织？", "香港家族办公室学会与其他家族办公室机构有何不同？", "香港家族办公室学会提供什么？", "香港家族办公室学会收费多少？", "如何开始参与香港家族办公室学会？"];
    expectedCoreQuestions.forEach((question, index) => {
      if (visibleFaqs[index]?.question !== question) errors.push(`${pathname}: missing core FAQ question ${index + 1}: ${question}`);
    });
    visibleFaqs.forEach((faq, index) => {
      if (faq.answer.length < 45) errors.push(`${pathname}: FAQ answer ${index + 1} is too short to be complete`);
      if (schemaFaqs[index]?.name !== faq.question || schemaFaqs[index]?.acceptedAnswer?.text !== faq.answer) {
        errors.push(`${pathname}: FAQ schema item ${index + 1} does not match visible content`);
      }
    });
    const coreQuestionText = expectedCoreQuestions.join(" ");
    if (!/(What|甚麼|什么)/.test(coreQuestionText) || !/(How|如何)/.test(coreQuestionText) || !/(different|不同)/.test(coreQuestionText)) {
      errors.push(`${pathname}: core FAQ questions must cover what, how, and comparison intent`);
    }
    if (!faqSchema?.dateModified || !$("main time").attr("datetime")) {
      errors.push(`${pathname}: FAQ needs visible and schema dateModified`);
    }
  }

  if (pathname.endsWith("/services")) {
    const serviceList = schemas.find((item) => item["@type"] === "ItemList");
    const serviceItems = serviceList?.itemListElement || [];
    if (serviceItems.length !== 6 || serviceItems.some((item) => item.item?.["@type"] !== "Service")) {
      errors.push(`${pathname}: services page needs six visible and structured Service items`);
    }
    if ($("#services-offerings article").length !== 6) errors.push(`${pathname}: services page needs six visible offering details`);
    const offeringTable = $("table[data-offering-comparison]");
    if (offeringTable.length !== 1 || offeringTable.find("thead th").length !== 4 || offeringTable.find("tbody tr").length !== 3) {
      errors.push(`${pathname}: services page needs a three-row, four-column offering comparison table`);
    }
    offeringTable.find("th, td").each((_, cell) => {
      if (!$(cell).text().trim()) errors.push(`${pathname}: offering comparison table contains an empty cell`);
    });
    const servicesText = $("main").text().replace(/\s+/g, " ").trim();
    const boundarySignal = pathname.startsWith("/en/") ? "No management, custody, or control of family assets" : pathname.startsWith("/zh-hk/") ? "不管理、託管或控制家族資產" : "不管理、托管或控制家族资产";
    if (!servicesText.includes(boundarySignal)) errors.push(`${pathname}: regulated-service boundary is missing`);
  }

  if (pathname.endsWith("/credentials")) {
    const credentialPage = schemas.find((item) => item["@type"] === "WebPage");
    if (!credentialPage?.about || credentialPage.about.legalName !== "Family Office Institute Hong Kong Limited") {
      errors.push(`${pathname}: credentials schema needs the verified legal organization identity`);
    }
    if (schemas.some((item) => item["@type"] === "EducationalOccupationalCredential")) {
      errors.push(`${pathname}: unverified EducationalOccupationalCredential schema must not be emitted`);
    }
    const credentialText = $("main").text().replace(/\s+/g, " ").trim();
    for (const signal of ["Family Office Institute Hong Kong Limited", "Lai King Man, Leo", "Chan Man Ching"]) {
      if (!credentialText.includes(signal)) errors.push(`${pathname}: credentials page is missing ${signal}`);
    }
    const noCertificationSignal = pathname.startsWith("/en/") ? "does not currently list an accredited professional qualification" : pathname.startsWith("/zh-hk/") ? "目前沒有在本網站列出可報讀或頒授的認可專業資格" : "目前没有在本网站列出可报读或颁授的认可专业资格";
    if (!credentialText.includes(noCertificationSignal)) errors.push(`${pathname}: current certification limitation is missing`);
    if (!credentialText.includes("SDG-ESG") || !credentialText.includes("SDG World Records") || !$('main a[href*="news-release-family-office-institute-hong-kong-awarded-sdg-esg-certified-impact-activity-center-accreditation-by-sdg-world-records"]').length) {
      errors.push(`${pathname}: credentials page needs the SDG-ESG institutional accreditation note and news-release link`);
    }
    for (const requiredSource of ["edigest.hk"]) {
      if (!$(`main a[href*="${requiredSource}"]`).length) errors.push(`${pathname}: credentials page needs direct evidence from ${requiredSource}`);
    }
    const wikidataSameAs = (credentialPage?.about?.sameAs || []).filter((value) => typeof value === "string" && value.includes("wikidata.org"));
    if (wikidataSameAs.length > 1 || wikidataSameAs.some((value) => !/^https:\/\/www\.wikidata\.org\/wiki\/Q[1-9]\d*$/.test(value))) {
      errors.push(`${pathname}: Wikidata sameAs must contain at most one valid entity URL`);
    }
  }

  if (pathname.endsWith("/guides/family-office-institute-hong-kong")) {
    auditRemovedArticleBlocks();
    const guideSchema = schemas.find((item) => item["@type"] === "Article");
    if (!guideSchema || guideSchema.headline !== h1 || guideSchema.citation?.length !== 4) {
      errors.push(`${pathname}: definitive guide needs matching Article schema and four citations`);
    }
    if (guideSchema?.author?.url !== `${BASE_URL}/${pathname.split("/")[1]}/about#editorial-accountability`) {
      errors.push(`${pathname}: definitive guide needs localized institutional author profile`);
    }
    if (guideSchema?.author?.name !== "FOIHK Editorial Team" || !guideSchema?.author?.description) {
      errors.push(`${pathname}: definitive guide needs a complete institutional author description`);
    }
    if ($("article table").length !== 1 || $("#guide-questions h3").length !== 5) {
      errors.push(`${pathname}: definitive guide needs its comparison table and five visible questions`);
    }
    if ($('article a[href^="http"]').length < 4) errors.push(`${pathname}: definitive guide needs four visible primary sources`);
  }

  if (pathname.endsWith("/privacy-policy")) {
    const privacySchema = schemas.find((item) => item["@type"] === "PrivacyPolicy");
    if (!privacySchema) errors.push(`${pathname}: missing PrivacyPolicy schema`);
    else {
      if (privacySchema.name !== h1) errors.push(`${pathname}: PrivacyPolicy schema name does not match visible H1`);
      for (const field of ["description", "url", "datePublished", "dateModified", "inLanguage", "publisher"]) {
        if (!privacySchema[field]) errors.push(`${pathname}: PrivacyPolicy schema is missing ${field}`);
      }
    }
    if (!$("main time").attr("datetime")) errors.push(`${pathname}: privacy policy needs a visible update date`);
  }

  if (pathname.endsWith("/media-kit")) {
    const mediaWebPage = schemas.find((item) => item["@type"] === "WebPage" && item["@id"] === `${url}#webpage`);
    const datasetSchema = schemas.find((item) => item["@type"] === "Dataset");
    if (!mediaWebPage || mediaWebPage.dateModified !== "2026-08-04" || mediaWebPage.name !== h1) {
      errors.push(`${pathname}: media kit needs matching WebPage schema and review date`);
    }
    if (!datasetSchema || datasetSchema.dateModified !== "2026-08-04") {
      errors.push(`${pathname}: media kit needs current Dataset schema`);
    } else {
      if (datasetSchema.distribution?.["@type"] !== "DataDownload" || datasetSchema.distribution?.encodingFormat !== "text/csv" || datasetSchema.distribution?.contentUrl !== `${BASE_URL}/data/foihk-hong-kong-family-office-evidence-2026.csv`) {
        errors.push(`${pathname}: Dataset distribution must identify the public CSV download`);
      }
      if (!Array.isArray(datasetSchema.citation) || datasetSchema.citation.length < 3) {
        errors.push(`${pathname}: Dataset schema needs at least three primary citations`);
      }
    }
    if ($("[data-identity-record]").length < 8) errors.push(`${pathname}: media kit needs complete organization identity fields`);
    const mediaText = $("main").text().replace(/\s+/g, " ").trim();
    for (const identitySignal of ["Family Office Institute Hong Kong Limited", "info@foihk.org", "32/F, The Center", "Lai King Man, Leo", "Chan Man Ching"]) {
      if (!mediaText.includes(identitySignal)) errors.push(`${pathname}: media kit is missing ${identitySignal}`);
    }
    if ($("[data-media-leader]").length !== 2 || $("[data-media-leader] img").length !== 2) {
      errors.push(`${pathname}: media kit needs two named leadership profiles with photographs`);
    }
    const factRows = $("table[data-media-dataset] [data-dataset-fact]");
    if (factRows.length < 7) errors.push(`${pathname}: public evidence table needs at least seven sourced facts`);
    for (const sourceHost of ["investhk.gov.hk", "sfc.hk", "aof.org.hk"]) {
      if (!$(`table[data-media-dataset] a[href*="${sourceHost}"]`).length) errors.push(`${pathname}: dataset table is missing ${sourceHost}`);
    }
    if ($("[data-offsite-evidence]").length !== 2) errors.push(`${pathname}: media kit needs two distinct public evidence records`);
    if (!$(`main a[href="/data/foihk-hong-kong-family-office-evidence-2026.csv"][download]`).length) {
      errors.push(`${pathname}: media kit needs a downloadable public-source CSV`);
    }
    if (!$('main a[href="mailto:info@foihk.org"]').length) errors.push(`${pathname}: media kit needs a public media contact`);
  }

  $("a[href]").each((_, anchor) => {
    const href = $(anchor).attr("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    if ($(anchor).attr("download") !== undefined) return;
    const linked = new URL(href, BASE_URL);
    if (linked.origin !== BASE_URL || linked.pathname.startsWith("/admin")) return;
    const linkedUrl = `${BASE_URL}${linked.pathname.replace(/\/+$/, "") || "/"}`;
    if (!sitemapSet.has(linkedUrl)) errors.push(`${pathname}: internal link is not indexable: ${linked.pathname}`);
  });
}

for (const [url, $] of pages) {
  $('head > link[rel="alternate"][hreflang]').each((_, element) => {
    const hreflang = $(element).attr("hreflang");
    const alternateUrl = $(element).attr("href");
    if (!alternateUrl || hreflang === "x-default" || !pages.has(alternateUrl)) return;
    const reciprocal = pages.get(alternateUrl)('head > link[rel="alternate"]').toArray().some((link) => pages.get(alternateUrl)(link).attr("href") === url);
    if (!reciprocal) errors.push(`${new URL(url).pathname}: hreflang is not reciprocal with ${new URL(alternateUrl).pathname}`);
  });
}

const activeKeywordTargets = keywordTargets.filter((target) =>
  sitemapSet.has(`${BASE_URL}${target.canonical_path}`)
);
for (const target of activeKeywordTargets) {
  const englishUrl = `${BASE_URL}${target.canonical_path}`;
  const englishPage = pages.get(englishUrl);
  if (!englishPage) {
    continue;
  }

  const mainText = englishPage("main").text().replace(/\s+/g, " ").trim().toLowerCase();
  if (!mainText.includes(target.keyword.toLowerCase())) {
    errors.push(`keyword matrix: ${target.keyword} is not visible in ${target.canonical_path}`);
  }

  const schemas = [];
  englishPage('script[type="application/ld+json"]').each((_, element) => {
    try {
      schemas.push(JSON.parse(englishPage(element).text()));
    } catch {
      // Invalid JSON-LD is reported during the page-level audit.
    }
  });
  const articleSchema = schemas.find((item) => item["@type"] === "Article" || item["@type"] === "NewsArticle");
  if (!String(articleSchema?.keywords || "").toLowerCase().includes(target.keyword.toLowerCase())) {
    errors.push(`keyword matrix: Article schema is missing ${target.keyword}`);
  }

  for (const language of ["en", "zh-hk", "zh-cn"]) {
    const localizedPath = target.canonical_path.replace(/^\/en\//, `/${language}/`);
    const localizedUrl = `${BASE_URL}${localizedPath}`;
    if (!sitemapSet.has(localizedUrl) || !pages.has(localizedUrl)) {
      errors.push(`keyword matrix: ${target.keyword} is missing crawlable ${language} URL ${localizedPath}`);
    }
    if (!llmsTxt.includes(localizedUrl)) {
      errors.push(`llms.txt: missing keyword target ${localizedUrl}`);
    }
    const hasIncomingLink = [...pages.entries()].some(([sourceUrl, sourcePage]) =>
      sourceUrl !== localizedUrl && sourcePage(`a[href="${localizedPath}"]`).length > 0);
    if (!hasIncomingLink) {
      errors.push(`keyword matrix: ${localizedPath} has no incoming internal link`);
    }
  }
}

const notFoundPath = join(DIST, "404.html");
if (!existsSync(notFoundPath)) errors.push("404.html: missing static 404 document");
else {
  const $404 = cheerio.load(readFileSync(notFoundPath, "utf8"));
  if (!$404('meta[name="robots"]').attr("content")?.includes("noindex")) errors.push("404.html: must be noindex");
  if ($404("h1").length !== 1) errors.push("404.html: expected one H1");
}

const vercel = JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8"));
if (vercel.rewrites?.some((rewrite) => rewrite.source === "/(.*)" || rewrite.source === "/:path*")) errors.push("vercel.json: global SPA fallback creates soft 404s");
const configuredHeaders = new Set((vercel.headers || []).flatMap((rule) => (rule.headers || []).map((header) => header.key)));
for (const header of REQUIRED_SECURITY_HEADERS) if (!configuredHeaders.has(header)) errors.push(`vercel.json: missing ${header}`);

const snapshot = JSON.parse(readFileSync(join(ROOT, "public", "published-articles.json"), "utf8"));
const redirectSources = new Set((vercel.redirects || []).map((redirect) => redirect.source));
for (const article of snapshot) {
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(article.id)) continue;
  const expected = [
    `/articles/${article.category}/${article.id}`,
    `/en/articles/${article.category}/${article.id}`,
    `/zh-hk/articles/${article.category}/${article.id}`,
    `/zh-cn/articles/${article.category}/${article.id}`,
  ];
  for (const source of expected) if (!redirectSources.has(source)) errors.push(`vercel.json: missing legacy redirect ${source}`);
}

if (!existsSync(authorityReadinessPath)) {
  errors.push("off-site authority readiness file is missing");
} else {
  const readiness = JSON.parse(readFileSync(authorityReadinessPath, "utf8"));
  if (readiness.canonical_profile?.legal_name !== "Family Office Institute Hong Kong Limited" || readiness.canonical_profile?.business_registration_number !== "78655051") {
    errors.push("off-site authority readiness file needs the verified legal identity");
  }
  if (readiness.canonical_profile?.phone !== "[needs source]") errors.push("unverified telephone data must remain flagged [needs source]");
  if (readiness.wikimedia?.wikipedia_status !== "deferred" || readiness.wikimedia?.wikidata_status !== "deferred") {
    errors.push("Wikipedia and Wikidata must remain deferred until independent notability evidence exists");
  }
  const footprint = readiness.verified_footprint || [];
  for (const surface of ["Hong Kong Companies Registry", "LinkedIn", "Economic Digest", "996co", "Hong Kong Company List Dataset", "CompaDB"]) {
    if (!footprint.some((item) => item.surface === surface && /^https:\/\//.test(item.url))) errors.push(`off-site authority readiness file is missing ${surface}`);
  }
  if (!footprint.some((item) => item.status === "automatic_directory_listing_detected_category_correction_needed" && item.correction)) {
    errors.push("directory readiness file needs the detected category correction package");
  }
}

if (!existsSync(mediaPitchPath)) {
  errors.push("media data-story pitch is missing");
} else {
  const pitch = readFileSync(mediaPitchPath, "utf8");
  for (const signal of ["Status: prepared, not sent", "FOIHK did not conduct the underlying surveys", "Confirm a named FOIHK spokesperson", "InvestHK source:", "SFC source:", "HKIMR source:"]) {
    if (!pitch.includes(signal)) errors.push(`media pitch is missing publication gate or evidence signal: ${signal}`);
  }
}

if (!existsSync(evidenceDatasetPath)) {
  errors.push("public-source evidence CSV is missing");
} else {
  const csv = readFileSync(evidenceDatasetPath, "utf8").trim();
  const rows = csv.split(/\r?\n/);
  for (const header of ["metric_id", "figure", "period", "population_or_sample", "publisher", "source_url", "limitation"]) {
    if (!rows[0]?.includes(`\"${header}\"`)) errors.push(`public-source evidence CSV is missing ${header}`);
  }
  if (rows.length < 9) errors.push("public-source evidence CSV needs at least eight sourced records");
  if (/\[needs source\]/i.test(csv)) errors.push("public-source evidence CSV contains an unresolved source marker");
  for (const sourceHost of ["investhk.gov.hk", "sfc.hk", "aof.org.hk"]) {
    if (!csv.includes(sourceHost)) errors.push(`public-source evidence CSV is missing ${sourceHost}`);
  }
}

if (errors.length > 0) {
  console.error(`SEO audit failed with ${errors.length} issue(s):\n${errors.map((error) => `- ${error}`).join("\n")}`);
  process.exit(1);
}

console.log(`SEO audit passed for ${urls.length} sitemap URLs, ${seenTitles.size} unique titles, and ${seenDescriptions.size} unique descriptions`);
