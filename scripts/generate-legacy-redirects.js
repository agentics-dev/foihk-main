import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const LANGUAGES = ["en", "zh-hk", "zh-cn"];
const STATIC_PATHS = [
  "about",
  "philanthropy",
  "press",
  "contact",
  "faq",
  "editorial-policy",
  "articles/education_research",
  "articles/news_events",
  "articles/philanthropy",
];

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY");
  process.exit(1);
}

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

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});
const { data: articles, error } = await supabase
  .from("articles")
  .select("id, slug, category")
  .eq("published", true);

if (error) {
  console.error(`Unable to generate redirects: ${error.message}`);
  process.exit(1);
}

const redirects = [
  {
    source: "/:path*",
    has: [{ type: "host", value: "foihk.org" }],
    destination: "https://www.foihk.org/:path*",
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
  ...STATIC_PATHS.map((path) => `/${path}  /en/${path}  301!`),
];

for (const article of articles || []) {
  const slug = normalizeSlug(article.slug);
  redirects.push({
    source: `/articles/${article.category}/${article.id}`,
    destination: `/en/articles/${article.category}/${slug}`,
    permanent: true,
  });
  netlifyRedirects.push(
    `/articles/${article.category}/${article.id}  /en/articles/${article.category}/${slug}  301!`
  );
  for (const language of LANGUAGES) {
    redirects.push({
      source: `/${language}/articles/${article.category}/${article.id}`,
      destination: `/${language}/articles/${article.category}/${slug}`,
      permanent: true,
    });
    netlifyRedirects.push(
      `/${language}/articles/${article.category}/${article.id}  /${language}/articles/${article.category}/${slug}  301!`
    );
  }
}

const vercelConfig = {
  cleanUrls: true,
  trailingSlash: false,
  redirects,
  rewrites: [{ source: "/(.*)", destination: "/200.html" }],
};

writeFileSync(resolve("vercel.json"), `${JSON.stringify(vercelConfig, null, 2)}\n`);
netlifyRedirects.push("/*  /index.html  200");
writeFileSync(resolve("public", "_redirects"), `${netlifyRedirects.join("\n")}\n`);
console.log(`Generated ${redirects.length} permanent redirects`);
