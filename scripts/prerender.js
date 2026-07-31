import puppeteer from "puppeteer";
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DIST = resolve(ROOT, "dist");
const BASE_URL = "https://www.foihk.org";
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8",
};

const sitemap = readFileSync(join(DIST, "sitemap.xml"), "utf8");
const sitemapRoutes = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)]
  .map((match) => new URL(match[1]).pathname);
const routeFilter = process.env.PRERENDER_ROUTE;
const routes = routeFilter ? sitemapRoutes.filter((route) => route === routeFilter) : sitemapRoutes;

const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url || "/", "http://localhost").pathname);
  const safePath = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "");
  let filePath = join(DIST, safePath);
  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, "index.html");
  }
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    filePath = join(DIST, "index.html");
  }
  response.setHeader("Content-Type", MIME_TYPES[extname(filePath)] || "application/octet-stream");
  response.end(readFileSync(filePath));
});

await new Promise((resolveListening) => server.listen(0, "127.0.0.1", resolveListening));
const address = server.address();
if (!address || typeof address === "string") {
  throw new Error("Unable to start prerender server");
}
const origin = `http://127.0.0.1:${address.port}`;

const failures = [];
let browser;

for (let index = 0; index < routes.length; index += 1) {
  if (index % 20 === 0) {
    if (browser) await browser.close();
    browser = await puppeteer.launch({
      headless: true,
      args: ["--disable-dev-shm-usage", "--no-sandbox"],
    });
  }

  const route = routes[index];
  if (browser) {
    const page = await browser.newPage();
    try {
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        if (["font", "image", "media"].includes(request.resourceType())) {
          request.abort();
        } else {
          request.continue();
        }
      });
      await page.goto(`${origin}${route}`, { waitUntil: "networkidle2", timeout: 45_000 });
      await page.waitForSelector("h1", { timeout: 15_000 });
      await page.waitForFunction(
        (expectedCanonical) =>
          document.querySelector('link[rel="canonical"]')?.href === expectedCanonical
          && Boolean(document.querySelector('meta[name="description"]')?.getAttribute("content")),
        { timeout: 15_000 },
        `${BASE_URL}${route}`
      );
      const html = await page.content();
      const outputDir = join(DIST, route.replace(/^\/+/, ""));
      mkdirSync(outputDir, { recursive: true });
      writeFileSync(join(outputDir, "index.html"), html);
      process.stdout.write(".");
    } catch (error) {
      failures.push(`${route}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      await page.close();
    }
  }
}

if (browser) await browser.close();
server.close();
const fallbackHtml = readFileSync(join(DIST, "index.html"), "utf8").replace(
  "</title>",
  "</title><meta name=\"description\" content=\"FOIHK public website fallback page for Hong Kong family office research, education, philanthropy, events, and professional exchange.\" />"
);
writeFileSync(join(DIST, "200.html"), fallbackHtml);

if (failures.length > 0) {
  console.error(`\nPrerender failed for ${failures.length} route(s):\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`\nPrerendered ${routes.length} routes from ${BASE_URL}/sitemap.xml`);
