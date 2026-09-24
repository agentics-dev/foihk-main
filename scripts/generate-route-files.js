import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DIST = resolve(ROOT, "dist");
const BASE_URL = "https://www.foihk.org";
const adminSpaRoutes = ["/admin", "/admin-login", "/admin/dashboard"];

const indexPath = join(DIST, "index.html");
const sitemapPath = join(DIST, "sitemap.xml");

if (!existsSync(indexPath)) {
  throw new Error("dist/index.html does not exist. Run vite build before generating route files.");
}

if (!existsSync(sitemapPath)) {
  throw new Error("dist/sitemap.xml does not exist. Run prebuild before generating route files.");
}

const appShell = readFileSync(indexPath, "utf8");
const manifest = JSON.parse(readFileSync(join(DIST, "content-build.json"), "utf8"));
if (manifest.formatVersion !== 2 || !Array.isArray(manifest.publicUrls)) throw new Error("Public route manifest v2 required");
const routes = [...new Set([...manifest.publicUrls.map((url) => new URL(url).pathname), ...adminSpaRoutes])];

for (const route of routes) {
  const outputDir = join(DIST, route.replace(/^\/+/, ""));
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, "index.html"), appShell);
}

const notFoundHtml = appShell
  .replace(
    "<head>",
    '<head><meta name="robots" content="noindex, follow">'
  )
  .replace(/<title>.*?<\/title>/, "<title>404 Page Not Found | FOIHK</title>");
writeFileSync(join(DIST, "404.html"), notFoundHtml);

console.log(`Generated static entry files for ${routes.length} routes from the public route manifest`);
