import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const LANGUAGES = ["en", "zh-hk", "zh-cn"];
const STATIC_PATHS = [
  "about",
  "philanthropy",
  "contact",
  "faq",
  "articles/education-research",
  "articles/news-events",
  "articles/philanthropy",
];

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

const articles = JSON.parse(readFileSync(resolve("public", "published-articles.json"), "utf8"));
const getCategoryPath = (category) => category.replaceAll("_", "-");
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REMOVED_STATIC_EDUCATION_SLUGS = [
  "hong-kong-family-office-ecosystem-guide-2026",
  "single-family-office-vs-multi-family-office",
  "family-office-vs-private-bank",
  "hong-kong-family-office-services",
  "hong-kong-family-office-trends",
  "what-is-family-office-institute-hong-kong",
  "role-of-family-office-institute",
  "how-to-choose-family-office-institute-and-services-hong-kong",
  "hong-kong-family-office-trends-2026",
  "hong-kong-non-profit-organization",
  "hong-kong-family-office-institute-organisation-association-comparison",
];
const ARTICLE_REDIRECT_DESTINATION_OVERRIDES = new Map([
  [
    "89e5e9cb-658f-4356-8cc5-1405dffcfd05",
    {
      en: "/en/articles/news-events",
      "zh-hk": "/zh-hk/articles/news-events",
      "zh-cn": "/zh-cn/articles/news-events",
    },
  ],
]);

const redirects = [
  {
    source: "/:path*",
    has: [{ type: "host", value: "foihk.org" }],
    destination: "https://www.foihk.org/:path*",
    permanent: true,
  },
  {
    source: "/",
    destination: "/en",
    permanent: true,
  },
  {
    source: "/lander",
    destination: "/en",
    permanent: true,
  },
  ...STATIC_PATHS.map((path) => ({
    source: `/${path}`,
    destination: `/en/${path}`,
    permanent: true,
  })),
];

const netlifyRedirects = [
  "# Generated legacy redirects. Regenerate with npm run generate:redirects.",
  "https://foihk.org/*  https://www.foihk.org/:splat  301!",
  "/  /en  301!",
  "/lander  /en  301!",
  ...STATIC_PATHS.map((path) => `/${path}  /en/${path}  301!`),
];

for (const slug of REMOVED_STATIC_EDUCATION_SLUGS) {
  for (const categoryPath of ["education-research", "education_research"]) {
    redirects.push({
      source: `/articles/${categoryPath}/${slug}`,
      destination: "/en/articles/education-research",
      permanent: true,
    });
    netlifyRedirects.push(`/articles/${categoryPath}/${slug}  /en/articles/education-research  301!`);

    for (const language of LANGUAGES) {
      redirects.push({
        source: `/${language}/articles/${categoryPath}/${slug}`,
        destination: `/${language}/articles/education-research`,
        permanent: true,
      });
      netlifyRedirects.push(
        `/${language}/articles/${categoryPath}/${slug}  /${language}/articles/education-research  301!`
      );
    }
  }
}

for (const article of articles) {
  const slug = normalizeSlug(article.slug);
  const categoryPath = getCategoryPath(article.category);
  const redirectOverride = ARTICLE_REDIRECT_DESTINATION_OVERRIDES.get(article.id);
  if (UUID_PATTERN.test(article.id)) {
    const destination = redirectOverride?.en ?? `/en/articles/${categoryPath}/${slug}`;
    redirects.push({
      source: `/articles/${article.category}/${article.id}`,
      destination,
      permanent: true,
    });
    netlifyRedirects.push(
      `/articles/${article.category}/${article.id}  ${destination}  301!`
    );
  }
  for (const language of LANGUAGES) {
    if (UUID_PATTERN.test(article.id)) {
      const destination = redirectOverride?.[language] ?? `/${language}/articles/${categoryPath}/${slug}`;
      redirects.push({
        source: `/${language}/articles/${article.category}/${article.id}`,
        destination,
        permanent: true,
      });
      netlifyRedirects.push(
        `/${language}/articles/${article.category}/${article.id}  ${destination}  301!`
      );
    }
    if (categoryPath !== article.category) {
      redirects.push({
        source: `/${language}/articles/${article.category}/${slug}`,
        destination: `/${language}/articles/${categoryPath}/${slug}`,
        permanent: true,
      });
      netlifyRedirects.push(
        `/${language}/articles/${article.category}/${slug}  /${language}/articles/${categoryPath}/${slug}  301!`
      );
    }
  }

  for (const previous of article.previous_slugs || []) {
    const previousSlug = normalizeSlug(previous.slug || "");
    const previousCategory = previous.category || article.category;
    const previousCategoryPath = getCategoryPath(previousCategory);
    if (!previousSlug || (previousSlug === slug && previousCategoryPath === categoryPath)) continue;
    for (const language of LANGUAGES) {
      const destination = `/${language}/articles/${categoryPath}/${slug}`;
      for (const legacyPath of new Set([previousCategory, previousCategoryPath])) {
        redirects.push({
          source: `/${language}/articles/${legacyPath}/${previousSlug}`,
          destination,
          permanent: true,
        });
        netlifyRedirects.push(
          `/${language}/articles/${legacyPath}/${previousSlug}  ${destination}  301!`
        );
      }
    }
  }
}

for (const legacyCategory of ["education_research", "news_events"]) {
  const categoryPath = getCategoryPath(legacyCategory);
  redirects.push({ source: `/articles/${legacyCategory}`, destination: `/en/articles/${categoryPath}`, permanent: true });
  netlifyRedirects.push(`/articles/${legacyCategory}  /en/articles/${categoryPath}  301!`);
  for (const language of LANGUAGES) {
    redirects.push({ source: `/${language}/articles/${legacyCategory}`, destination: `/${language}/articles/${categoryPath}`, permanent: true });
    netlifyRedirects.push(`/${language}/articles/${legacyCategory}  /${language}/articles/${categoryPath}  301!`);
  }
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: "default-src 'self'; base-uri 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://region1.google-analytics.com; font-src 'self' data:; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: blob: https:; object-src 'none'; script-src 'self' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; upgrade-insecure-requests" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
];
const noStoreHeaders = [{ key: "Cache-Control", value: "no-store, max-age=0" }];

const vercelConfig = {
  cleanUrls: true,
  trailingSlash: false,
  redirects,
  rewrites: [
    { source: "/admin", destination: "/index.html" },
    { source: "/admin-login", destination: "/index.html" },
    { source: "/admin/:path*", destination: "/index.html" },
  ],
  headers: [
    { source: "/admin-login", headers: noStoreHeaders },
    { source: "/admin", headers: noStoreHeaders },
    { source: "/admin/:path*", headers: noStoreHeaders },
    { source: "/(.*)", headers: securityHeaders },
    { source: "/assets/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
  ],
};

writeFileSync(resolve("vercel.json"), `${JSON.stringify(vercelConfig, null, 2)}\n`);
netlifyRedirects.push("/admin  /index.html  200", "/admin-login  /index.html  200", "/admin/*  /index.html  200");
writeFileSync(resolve("public", "_redirects"), `${netlifyRedirects.join("\n")}\n`);
writeFileSync(
  resolve("public", "_headers"),
  `/*\n${securityHeaders.map(({ key, value }) => `  ${key}: ${value}`).join("\n")}\n\n/admin-login\n  Cache-Control: no-store, max-age=0\n\n/admin\n  Cache-Control: no-store, max-age=0\n\n/admin/*\n  Cache-Control: no-store, max-age=0\n\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n`
);
console.log(`Generated ${redirects.length} permanent redirects`);
