import * as cheerio from "cheerio";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DIST = resolve(ROOT, "dist");
const BASE_URL = "https://www.foihk.org";
const sitemapPath = join(DIST, "sitemap.xml");

if (!existsSync(sitemapPath)) {
  console.error("SEO audit failed: dist/sitemap.xml does not exist");
  process.exit(1);
}

const sitemap = readFileSync(sitemapPath, "utf8");
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const sitemapSet = new Set(urls);
const errors = [];
const seenTitles = new Map();

for (const url of urls) {
  const pathname = new URL(url).pathname;
  const htmlPath = join(DIST, pathname.replace(/^\/+/, ""), "index.html");
  if (!existsSync(htmlPath)) {
    errors.push(`${pathname}: missing prerendered HTML`);
    continue;
  }

  const $ = cheerio.load(readFileSync(htmlPath, "utf8"));
  const titles = $("head > title");
  const descriptions = $('head > meta[name="description"]');
  const canonicals = $('head > link[rel="canonical"]');
  const h1s = $("body h1");
  const robots = $('head > meta[name="robots"]').attr("content") || "";
  const title = titles.text().trim();
  const h1 = h1s.first().text().replace(/\s+/g, " ").trim();

  if (titles.length !== 1 || !title) errors.push(`${pathname}: expected one non-empty title`);
  if (descriptions.length !== 1 || !(descriptions.attr("content") || "").trim()) {
    errors.push(`${pathname}: expected one non-empty meta description`);
  }
  if (canonicals.length !== 1 || canonicals.attr("href") !== url) {
    errors.push(`${pathname}: canonical must self-reference ${url}`);
  }
  if (h1s.length !== 1 || !h1) errors.push(`${pathname}: expected one non-empty H1`);
  if (/noindex/i.test(robots)) errors.push(`${pathname}: sitemap URL is marked noindex`);
  if (/\/[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(pathname)) {
    errors.push(`${pathname}: sitemap article URL uses a UUID`);
  }

  if (seenTitles.has(title)) {
    errors.push(`${pathname}: duplicate title also used by ${seenTitles.get(title)}`);
  } else {
    seenTitles.set(title, pathname);
  }

  const alternateLinks = $('head > link[rel="alternate"][hreflang]');
  const alternates = new Map();
  alternateLinks.each((_, element) => {
    alternates.set($(element).attr("hreflang"), $(element).attr("href"));
  });
  const requiredAlternates = pathname.includes("/articles/") && !/\/articles\/[^/]+$/.test(pathname)
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

  if (pathname.includes("/articles/") && !/\/articles\/[^/]+$/.test(pathname)) {
    const articleSchema = schemas.find((item) => item["@type"] === "Article" || item["@type"] === "NewsArticle");
    if (!articleSchema) {
      errors.push(`${pathname}: missing Article or NewsArticle schema`);
    } else if (articleSchema.headline !== h1) {
      errors.push(`${pathname}: schema headline does not match visible H1`);
    }
    if (!title.startsWith(h1)) errors.push(`${pathname}: title does not start with visible H1`);
  }

  if (pathname.endsWith("/faq")) {
    const faqSchema = schemas.find((item) => item["@type"] === "FAQPage");
    if (!faqSchema || faqSchema.mainEntity?.length !== 12 || $("details").length !== 12) {
      errors.push(`${pathname}: FAQ schema and 12 visible questions must match`);
    }
  }
}

if (errors.length > 0) {
  console.error(`SEO audit failed with ${errors.length} issue(s):\n${errors.map((error) => `- ${error}`).join("\n")}`);
  process.exit(1);
}

console.log(`SEO audit passed for ${urls.length} sitemap URLs`);
