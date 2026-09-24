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

const manifest = JSON.parse(readFileSync(join(DIST, "content-build.json"), "utf8"));
if (manifest.formatVersion !== 2) throw new Error("Public route manifest v2 required");
const snapshot = JSON.parse(readFileSync(join(DIST, "published-articles.json"), "utf8"));
const publicRoutes = manifest.publicUrls.map((url) => new URL(url).pathname);
const routeFilter = process.env.PRERENDER_ROUTE;
const routes = routeFilter ? publicRoutes.filter((route) => route === routeFilter) : publicRoutes;
const adminSpaRoutes = ["/admin", "/admin-login", "/admin/dashboard"];

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

const launchBrowser = () => puppeteer.launch({
  headless: true,
  args: ["--disable-dev-shm-usage", "--no-sandbox"],
});

const withTimeout = (promise, timeoutMs, label) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(label)), timeoutMs)),
]);

const closeWithTimeout = async (closePromise) => {
  try {
    await Promise.race([
      closePromise,
      new Promise((resolveClose) => setTimeout(resolveClose, 5_000)),
    ]);
  } catch {
    // Closing can occasionally race with aborted asset requests during prerender.
  }
};

const openPageWithRetry = async (route) => {
  try {
    return await withTimeout(browser.newPage(), 10_000, `${route}: opening a new prerender page timed out`);
  } catch {
    if (browser) await closeWithTimeout(browser.close());
    browser = await launchBrowser();
    return withTimeout(browser.newPage(), 10_000, `${route}: opening a new prerender page timed out after browser restart`);
  }
};

for (let index = 0; index < routes.length; index += 1) {
  if (index % 20 === 0) {
    if (browser) await closeWithTimeout(browser.close());
    browser = await launchBrowser();
  }

  const route = routes[index];
  if (browser) {
    let page;
    try {
      page = await openPageWithRetry(route);
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        const url = new URL(request.url());
        if (url.pathname === "/rest/v1/articles") {
          const category = url.searchParams.get("category")?.replace(/^eq\./, "");
          return request.respond({status: 200, contentType: "application/json", headers: {"access-control-allow-origin":"*","access-control-allow-headers":"*","access-control-allow-methods":"GET,OPTIONS"},
            body: JSON.stringify(snapshot.filter((article) => !category || article.category === category))});
        }
        if (url.pathname === "/rest/v1/article_faq_items" || url.pathname === "/rest/v1/article_slug_history") {
          const articleId = url.searchParams.get("article_id")?.replace(/^eq\./, "");
          const rows = url.pathname.endsWith("article_faq_items")
            ? snapshot.filter((article) => article.id === articleId).flatMap((article) => article.faq_items || [])
            : snapshot.flatMap((article) => (article.previous_slugs || []).map((old) => ({article_id: article.id, old_slug: old.slug})));
          return request.respond({status: 200, contentType: "application/json", headers: {"access-control-allow-origin":"*","access-control-allow-headers":"*","access-control-allow-methods":"GET,OPTIONS"},body:JSON.stringify(rows)});
        }
        if (["font", "image", "media"].includes(request.resourceType())) {
          request.abort();
        } else {
          request.continue();
        }
      });
      await page.goto(`${origin}${route}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await page.waitForSelector("h1", { timeout: 15_000 });
      await page.waitForFunction(
        (expectedCanonical) =>
          document.querySelector('link[rel="canonical"]')?.href === expectedCanonical
          && Boolean(document.querySelector('meta[name="description"]')?.getAttribute("content")),
        { timeout: 15_000 },
        `${BASE_URL}${route}`
      );
      if (/\/articles\/(?:education-research|news-events|philanthropy)\/.+/.test(route)) {
        await page.waitForFunction(
          () => {
            if (document.title.startsWith("Loading...")) return false;
            return [...document.querySelectorAll('script[type="application/ld+json"]')].some((script) => {
              try {
                const value = JSON.parse(script.textContent || "{}");
                return value["@type"] === "Article" || value["@type"] === "NewsArticle";
              } catch {
                return false;
              }
            });
          },
          { timeout: 30_000 }
        );
      }
      if (/\/articles\/(?:education-research|news-events|philanthropy)$/.test(route)) {
        await page.waitForSelector('main[data-content-ready="true"]', { timeout: 30_000 });
      }
      await page.waitForFunction(() => !document.querySelector("main[data-content-ready]") || document.querySelector("main[data-content-ready]").getAttribute("data-content-ready") === "true");
      const html = (await page.content()).replace("</head>", `<meta name="foihk-content-revision" content="${manifest.revision}"></head>`);
      const outputDir = join(DIST, route.replace(/^\/+/, ""));
      mkdirSync(outputDir, { recursive: true });
      writeFileSync(join(outputDir, "index.html"), html);
      process.stdout.write(".");
    } catch (error) {
      failures.push(`${route}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      if (page) await closeWithTimeout(page.close());
    }
  }
}

if (browser && !routeFilter) {
  const notFoundPage = await browser.newPage();
  try {
    await notFoundPage.goto(`${origin}/en/seo-audit-not-found`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await notFoundPage.waitForSelector("h1", { timeout: 15_000 });
    await notFoundPage.waitForFunction(
      () => document.querySelector('meta[name="robots"]')?.content.includes("noindex"),
      { timeout: 15_000 }
    );
    writeFileSync(join(DIST, "404.html"), await notFoundPage.content());
  } catch (error) {
    failures.push(`/404.html: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    await closeWithTimeout(notFoundPage.close());
  }
}

if (browser) await closeWithTimeout(browser.close());
server.close();

if (failures.length > 0) {
  console.error(`\nPrerender failed for ${failures.length} route(s):\n${failures.join("\n")}`);
  process.exit(1);
}

if (!routeFilter) {
  const appShell = readFileSync(join(DIST, "index.html"), "utf8");
  adminSpaRoutes.forEach((route) => {
    const outputDir = join(DIST, route.replace(/^\/+/, ""));
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(join(outputDir, "index.html"), appShell);
  });
}

console.log(`\nPrerendered ${routes.length} routes from the v2 public route manifest`);
