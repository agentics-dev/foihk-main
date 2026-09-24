import path from "node:path";
import fs from "node:fs/promises";
import { load } from "cheerio";
import puppeteer from "puppeteer";
import { fetchLimited } from "./safe-http.mjs";
import { finding, hash } from "./model.mjs";

const normalizeUrl = (value) => {
  const url = new URL(value);
  url.hash = "";
  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString();
};

const urlsFromSitemap = (xml) => [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
  .map((match) => match[1].replaceAll("&amp;", "&").trim())
  .filter(Boolean);

const localeFromPath = (pathname, locales) => locales.find((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));

function jsonLdObjects($) {
  const objects = [];
  $('script[type="application/ld+json"]').each((_index, element) => {
    try {
      const value = JSON.parse($(element).text());
      objects.push(...(Array.isArray(value) ? value : [value]));
    } catch {
      objects.push({ __invalid: true });
    }
  });
  return objects.flatMap((value) => Array.isArray(value?.["@graph"]) ? value["@graph"] : [value]);
}

export function inspectHtml({ html, requestedUrl, finalUrl, status, headers, config, sitemapSet, manifest }) {
  const findings = [];
  const url = new URL(requestedUrl);
  if (status !== 200) {
    findings.push(finding({ ruleId: "http-status", severity: "P1", category: "页面可用性", title: `页面返回 HTTP ${status}`, location: requestedUrl, evidence: `最终地址：${finalUrl}`, impact: "访客或搜索引擎无法正常读取页面。", remediation: "修复路由、部署或上游服务后重新检查。" }));
    return { findings, links: [], images: [], surface: { url: requestedUrl, status, finalUrl } };
  }
  const contentType = headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("text/html")) {
    findings.push(finding({ ruleId: "content-type", severity: "P1", category: "页面可用性", title: "公开页面未返回 HTML", location: requestedUrl, evidence: contentType, remediation: "检查路由和 CDN 响应类型。" }));
    return { findings, links: [], images: [], surface: { url: requestedUrl, status, finalUrl, contentType } };
  }
  const $ = load(html);
  const title = $("title").first().text().trim();
  const h1 = $("h1").map((_index, element) => $(element).text().replace(/\s+/g, " ").trim()).get().filter(Boolean);
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const canonical = $('link[rel="canonical"]').attr("href") || "";
  const robots = $('meta[name="robots"]').attr("content") || "";
  const htmlLang = $("html").attr("lang") || "";
  const expectedLocale = localeFromPath(url.pathname, config.locales);
  const expectedHtmlLang = config.htmlLangByLocale?.[expectedLocale] || expectedLocale;
  const isArticle = config.articleRegex.test(url.pathname);
  const isIndexable = sitemapSet.has(normalizeUrl(requestedUrl));
  const revision = $('meta[name="foihk-content-revision"]').attr("content") || "";

  if (!title) findings.push(finding({ ruleId: "missing-title", severity: "P2", category: "技术 SEO", title: "页面缺少 title", location: requestedUrl, evidence: "<title> 为空", remediation: "为页面提供唯一、可读的标题。" }));
  if (h1.length !== 1) findings.push(finding({ ruleId: "h1-count", severity: "P3", category: "页面结构", title: "页面 H1 数量异常", location: requestedUrl, evidence: `H1 数量：${h1.length}`, remediation: "保留一个描述页面主题的主标题。" }));
  if (/\b(?:not found|page unavailable)\b|找不到頁面|页面不存在/i.test(bodyText.slice(0, 1200))) {
    findings.push(finding({ ruleId: "soft-404", severity: "P1", category: "页面可用性", title: "页面可能是返回 200 的软 404", location: requestedUrl, evidence: bodyText.slice(0, 180), remediation: "不存在的内容应返回 404/410，正常页面应呈现真实内容。" }));
  }
  if (!canonical) findings.push(finding({ ruleId: "missing-canonical", severity: "P2", category: "技术 SEO", title: "页面缺少 canonical", location: requestedUrl, evidence: "未发现 rel=canonical", remediation: "输出当前页面的规范 URL。" }));
  else {
    try {
      if (normalizeUrl(new URL(canonical, requestedUrl).toString()) !== normalizeUrl(requestedUrl)) {
        findings.push(finding({ ruleId: "canonical-mismatch", severity: "P2", category: "技术 SEO", title: "canonical 与公开 URL 不一致", location: requestedUrl, evidence: canonical, remediation: "核对规范 URL、旧地址转址和多语言路径。" }));
      }
    } catch {
      findings.push(finding({ ruleId: "canonical-invalid", severity: "P2", category: "技术 SEO", title: "canonical URL 无效", location: requestedUrl, evidence: canonical, remediation: "输出合法的绝对 HTTPS URL。" }));
    }
  }
  if (isIndexable && /noindex/i.test(robots)) findings.push(finding({ ruleId: "sitemap-noindex", severity: "P1", category: "文章发布", title: "站点地图中的页面被标记 noindex", location: requestedUrl, evidence: robots, remediation: "从 sitemap 移除该 URL，或恢复页面的可索引状态。" }));
  if (!isIndexable && manifest?.publicUrls?.includes(normalizeUrl(requestedUrl)) && !/noindex/i.test(robots)) findings.push(finding({ ruleId: "public-missing-noindex", severity: "P2", category: "文章发布", title: "非索引公开页面缺少 noindex", location: requestedUrl, evidence: robots || "未设置 robots meta", remediation: "明确添加 noindex 或把页面加入 sitemap。" }));
  if (expectedHtmlLang && htmlLang && htmlLang.toLowerCase() !== expectedHtmlLang.toLowerCase()) findings.push(finding({ ruleId: "html-lang", severity: "P2", category: "多语言", title: "HTML lang 与 URL 语言不一致", location: requestedUrl, evidence: `URL=${expectedLocale}, 预期=${expectedHtmlLang}, lang=${htmlLang}`, remediation: "让根元素语言与当前页面语言一致。" }));

  const structured = jsonLdObjects($);
  if (structured.some((value) => value?.__invalid)) findings.push(finding({ ruleId: "invalid-jsonld", severity: "P2", category: "结构化数据", title: "JSON-LD 无法解析", location: requestedUrl, evidence: "至少一个 application/ld+json 不是合法 JSON", remediation: "修复结构化数据序列化。" }));
  if (isArticle) {
    const article = structured.find((value) => ["Article", "NewsArticle", "BlogPosting"].includes(value?.["@type"]));
    if (!article) findings.push(finding({ ruleId: "article-jsonld", severity: "P2", category: "文章发布", title: "文章缺少 Article 结构化数据", location: requestedUrl, evidence: "未找到 Article、NewsArticle 或 BlogPosting", remediation: "输出与可见文章一致的 JSON-LD。" }));
    else {
      if (!article.headline || !article.datePublished) findings.push(finding({ ruleId: "article-jsonld-fields", severity: "P3", category: "文章发布", title: "Article 结构化数据关键字段不完整", location: requestedUrl, evidence: `headline=${Boolean(article.headline)}, datePublished=${Boolean(article.datePublished)}`, remediation: "补充 headline 与带时区的 datePublished。" }));
      const visibleDate = $("article time[datetime], main time[datetime]").first().attr("datetime");
      if (article.datePublished && !Number.isFinite(Date.parse(article.datePublished))) findings.push(finding({ ruleId: "article-date-invalid", severity: "P2", category: "文章发布", title: "文章发布日期格式无效", location: requestedUrl, evidence: String(article.datePublished), remediation: "使用带时区的 ISO 8601 日期。" }));
      if (visibleDate && article.datePublished && Number.isFinite(Date.parse(visibleDate)) && Number.isFinite(Date.parse(article.datePublished)) && Math.abs(Date.parse(visibleDate) - Date.parse(article.datePublished)) >= 86_400_000) findings.push(finding({ ruleId: "article-date-mismatch", severity: "P2", category: "文章发布", title: "可见发布日期与结构化数据不一致", location: requestedUrl, evidence: `页面=${visibleDate}，JSON-LD=${article.datePublished}`, remediation: "统一数据库、页面和结构化数据的真实发布日期。" }));
    }
    if (manifest?.revision && revision !== String(manifest.revision)) findings.push(finding({ ruleId: "content-revision", severity: "P1", category: "文章发布", title: "文章静态 HTML 与内容版本不一致", location: requestedUrl, evidence: `页面 revision=${revision || "缺失"}，清单 revision=${manifest.revision}`, remediation: "重新构建并确认部署使用同一内容快照。" }));
  }

  const links = [];
  $("a[href]").each((_index, element) => {
    const href = ($(element).attr("href") || "").trim();
    const label = $(element).text().replace(/\s+/g, " ").trim().slice(0, 100);
    if (!href || href === "#" || /^javascript:/i.test(href)) {
      findings.push(finding({ ruleId: "dead-cta", severity: "P2", category: "CTA 与链接", title: "可见链接没有有效目标", location: requestedUrl, evidence: `${label || "未命名链接"}: ${href || "空 href"}`, remediation: "提供真实目标或移除无功能控件。" }));
      return;
    }
    try {
      const target = new URL(href, requestedUrl);
      if (["http:", "https:"].includes(target.protocol) && config.allowedHosts.includes(target.hostname)) links.push(normalizeUrl(target.toString()));
    } catch { /* invalid link is reported below */ }
  });
  const images = [];
  $("img[src]").each((_index, element) => {
    const src = $(element).attr("src");
    if (!src) return;
    try {
      const target = new URL(src, requestedUrl);
      if (["http:", "https:"].includes(target.protocol)) images.push(target.toString());
    } catch { /* malformed images are ignored here */ }
    if (!($(element).attr("alt") || "").trim()) findings.push(finding({ ruleId: "image-alt", severity: "P3", category: "无障碍", title: "内容图片缺少 alt", location: requestedUrl, evidence: src.slice(0, 180), remediation: "为有信息含义的图片提供本地化替代文本。" }));
  });
  const surface = {
    url: requestedUrl,
    status,
    finalUrl,
    title,
    h1,
    canonical,
    robots,
    htmlLang,
    revision,
    internalLinks: [...new Set(links)].sort(),
    resourceHosts: [...new Set(images.map((value) => new URL(value).hostname))].sort(),
  };
  surface.signature = hash(JSON.stringify(surface));
  return { findings, links, images, surface };
}

async function runPool(values, concurrency, task) {
  const results = new Array(values.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < values.length) {
      const index = cursor++;
      results[index] = await task(values[index], index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker));
  return results;
}

async function inspectRedirects(config) {
  const findings = [];
  for (const check of config.redirectChecks) {
    const source = new URL(check.from, config.baseUrl).toString();
    const expected = normalizeUrl(new URL(check.to, config.baseUrl).toString());
    try {
      const first = await fetchLimited(source, config, { redirect: "manual", maxBytes: 10_000 });
      const location = first.response.headers.get("location");
      const actual = location ? normalizeUrl(new URL(location, source).toString()) : "";
      if (![301, 308].includes(first.response.status) || actual !== expected) findings.push(finding({ ruleId: "legacy-redirect", severity: "P1", category: "文章发布", title: "历史文章地址未永久转到预期页面", location: source, evidence: `HTTP ${first.response.status}，Location=${location || "缺失"}`, remediation: `配置 301/308 到 ${expected}。` }));
    } catch (error) {
      findings.push(finding({ ruleId: "legacy-redirect-check", severity: "P1", category: "文章发布", title: "历史文章转址检查失败", location: source, evidence: error.message, remediation: "检查 DNS、TLS、路由和部署状态后重试。" }));
    }
  }
  return findings;
}

async function inspectBrowser(config, outputDir) {
  const findings = [];
  const surfaces = [];
  const screenshotDir = path.join(outputDir, "screenshots");
  await fs.mkdir(screenshotDir, { recursive: true });
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    for (const route of config.browserRoutes) {
      for (const viewport of [{ name: "desktop", width: 1440, height: 900 }, { name: "mobile", width: 375, height: 812, isMobile: true }]) {
        const page = await browser.newPage();
        await page.setViewport(viewport);
        const consoleErrors = [];
        const pageErrors = [];
        const failedRequests = [];
        const badResponses = [];
        page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text().slice(0, 300)); });
        page.on("pageerror", (error) => pageErrors.push(error.message.slice(0, 300)));
        page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || "failed"}`.slice(0, 400)));
        page.on("response", (response) => { if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`.slice(0, 400)); });
        const target = new URL(route, config.baseUrl).toString();
        try {
          await page.goto(target, { waitUntil: "networkidle2", timeout: config.browserTimeoutMs });
          await page.evaluate(async () => {
            const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
            const step = Math.max(400, Math.floor(window.innerHeight * 0.8));
            for (let top = 0; top < document.documentElement.scrollHeight; top += step) {
              window.scrollTo(0, top);
              await pause(60);
            }
            window.scrollTo(0, document.documentElement.scrollHeight);
            await pause(300);
            window.scrollTo(0, 0);
            await pause(200);
          });
          const filename = `${route.replace(/^\//, "").replace(/[^a-z0-9-]+/gi, "-") || "root"}-${viewport.name}.png`;
          await page.screenshot({ path: path.join(screenshotDir, filename), fullPage: true });
          const rendered = await page.evaluate(() => ({
            title: document.title,
            h1: [...document.querySelectorAll("h1")].map((element) => element.textContent?.trim()).filter(Boolean),
            overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
            emptyButtons: [...document.querySelectorAll("button")].filter((element) => {
              const style = getComputedStyle(element);
              const label = element.getAttribute("aria-label") || element.textContent || "";
              return style.display !== "none" && style.visibility !== "hidden" && !label.trim();
            }).length,
          }));
          if (rendered.overflow) findings.push(finding({ ruleId: `overflow-${viewport.name}`, severity: "P2", category: "响应式", title: `${viewport.name === "mobile" ? "手机" : "桌面"}页面出现横向溢出`, location: target, evidence: filename, remediation: "检查超宽容器、固定宽度和未换行文本。" }));
          if (rendered.emptyButtons > 0) findings.push(finding({ ruleId: `empty-button-${viewport.name}`, severity: "P2", category: "无障碍", title: "页面存在无可访问名称的按钮", location: target, evidence: `数量：${rendered.emptyButtons}`, remediation: "为图标按钮增加可见文本或 aria-label。" }));
          const uniqueErrors = [...new Set([...pageErrors, ...failedRequests, ...badResponses, ...consoleErrors])];
          if (uniqueErrors.length > 0) findings.push(finding({ ruleId: `browser-errors-${viewport.name}`, severity: "P2", category: "浏览器运行", title: `${viewport.name === "mobile" ? "手机" : "桌面"}页面出现控制台或资源错误`, location: target, evidence: uniqueErrors.slice(0, 8).join(" | "), details: uniqueErrors.slice(0, 20), remediation: "修复运行时异常和失败资源，并在同一视口复验。" }));
          const surface = { url: target, viewport: viewport.name, ...rendered, errors: uniqueErrors.sort() };
          surface.signature = hash(JSON.stringify(surface));
          surfaces.push(surface);
        } catch (error) {
          findings.push(finding({ ruleId: `browser-navigation-${viewport.name}`, severity: "P1", category: "浏览器运行", title: "浏览器无法完成页面加载", location: target, evidence: error.message, remediation: "检查线上可用性、客户端异常和第三方阻塞资源。" }));
        } finally {
          await page.close();
        }
      }
    }
    return { findings, surfaces, completed: true };
  } catch (error) {
    return { findings: [finding({ ruleId: "browser-stage", severity: "P1", category: "检查完整性", title: "浏览器检查未完成", location: config.baseUrl, evidence: error.message, remediation: "安装兼容的 Chromium 后重跑。" })], surfaces, completed: false };
  } finally {
    if (browser) await browser.close();
  }
}

export async function auditWebsite(config, outputDir) {
  const stages = [];
  const findings = [];
  let sitemap = [];
  let manifest = null;
  try {
    const [sitemapResult, manifestResult] = await Promise.all([
      fetchLimited(new URL(config.sitemapPath, config.baseUrl).toString(), config, { maxBytes: 3_000_000 }),
      fetchLimited(new URL(config.manifestPath, config.baseUrl).toString(), config, { maxBytes: 3_000_000 }),
    ]);
    if (!sitemapResult.response.ok) throw new Error(`sitemap 返回 HTTP ${sitemapResult.response.status}`);
    if (!manifestResult.response.ok) throw new Error(`内容清单返回 HTTP ${manifestResult.response.status}`);
    sitemap = urlsFromSitemap(sitemapResult.text).map(normalizeUrl);
    manifest = JSON.parse(manifestResult.text);
    if (!Array.isArray(manifest.publicUrls) || !Array.isArray(manifest.urls) || !Number.isSafeInteger(manifest.revision)) throw new Error("内容清单格式无效");
    manifest.publicUrls = manifest.publicUrls.map(normalizeUrl);
    manifest.urls = manifest.urls.map(normalizeUrl);
    stages.push({ id: "discovery", name: "站点地图与内容清单", status: "completed", required: true, detail: `${sitemap.length} 个 sitemap URL，${manifest.publicUrls.length} 个公开 URL，revision ${manifest.revision}` });
  } catch (error) {
    stages.push({ id: "discovery", name: "站点地图与内容清单", status: "failed", required: true, detail: error.message });
    findings.push(finding({ ruleId: "discovery-stage", severity: "P1", category: "检查完整性", title: "无法读取站点地图或内容清单", location: config.baseUrl, evidence: error.message, remediation: "恢复公开发现文件后重新运行；本次不能判定通过。" }));
  }

  const sitemapSet = new Set(sitemap);
  if (manifest) {
    const manifestIndexSet = new Set(manifest.urls);
    for (const url of sitemapSet) if (!manifestIndexSet.has(url)) findings.push(finding({ ruleId: "sitemap-manifest-extra", severity: "P1", category: "文章发布", title: "sitemap 与内容清单不一致", location: url, evidence: "URL 只存在于 sitemap", remediation: "使用同一内容快照生成 sitemap 和内容清单。" }));
    for (const url of manifestIndexSet) if (!sitemapSet.has(url)) findings.push(finding({ ruleId: "manifest-sitemap-missing", severity: "P1", category: "文章发布", title: "可索引 URL 未进入 sitemap", location: url, evidence: "URL 只存在于内容清单 urls", remediation: "重新生成并部署 sitemap。" }));
  }

  const candidateUrls = new Set([
    ...config.keyRoutes.map((route) => new URL(route, config.baseUrl).toString()),
    ...config.expectedArticleUrls.map((url) => new URL(url, config.baseUrl).toString()),
    ...(manifest?.publicUrls || []),
    ...sitemap,
  ].map(normalizeUrl));
  for (const expected of config.expectedArticleUrls.map((url) => normalizeUrl(new URL(url, config.baseUrl).toString()))) {
    if (!candidateUrls.has(expected) || (manifest && !manifest.publicUrls.includes(expected))) findings.push(finding({ ruleId: "expected-article-missing", severity: "P1", category: "文章发布", title: "预期文章未进入公开内容清单", location: expected, evidence: "expectedArticleUrls 已声明，但 publicUrls 中不存在", remediation: "检查发布状态、语言内容和部署同步。" }));
  }
  const pageUrls = [...candidateUrls].slice(0, config.maxPages);
  if (candidateUrls.size > config.maxPages) findings.push(finding({ ruleId: "page-limit", severity: "P2", category: "检查完整性", title: "公开页面数量超过本次检查上限", location: config.baseUrl, evidence: `${candidateUrls.size} 个候选，检查上限 ${config.maxPages}`, remediation: "提高 maxPages 或拆分站点范围后重跑。" }));

  const pageResults = await runPool(pageUrls, 6, async (url) => {
    try {
      const result = await fetchLimited(url, config, { maxBytes: 3_000_000 });
      return inspectHtml({ html: result.text, requestedUrl: url, finalUrl: result.url, status: result.response.status, headers: result.response.headers, config, sitemapSet, manifest });
    } catch (error) {
      return { findings: [finding({ ruleId: "page-fetch", severity: "P1", category: "页面可用性", title: "页面读取失败", location: url, evidence: error.message, remediation: "检查 DNS、TLS、部署或上游服务后重试。" })], links: [], images: [], surface: { url, error: error.message, signature: hash(error.message) } };
    }
  });
  findings.push(...pageResults.flatMap((result) => result.findings));
  const pageByUrl = new Map(pageResults.map((result) => [normalizeUrl(result.surface.url), result]));
  for (const articleUrl of (manifest?.publicUrls || []).filter((url) => config.articleRegex.test(new URL(url).pathname))) {
    const parsed = new URL(articleUrl);
    const collectionUrl = normalizeUrl(`${parsed.origin}${parsed.pathname.split("/").slice(0, -1).join("/")}`);
    const collection = pageByUrl.get(collectionUrl);
    if (collection && !collection.links.includes(normalizeUrl(articleUrl))) findings.push(finding({ ruleId: "article-list-detail", severity: "P1", category: "文章发布", title: "公开文章未出现在对应文章列表", location: articleUrl, evidence: `列表：${collectionUrl}`, remediation: "核对发布过滤、语言字段、分类和列表查询。" }));
  }
  findings.push(...await inspectRedirects(config));
  stages.push({ id: "http", name: "公开页面与文章", status: "completed", required: true, detail: `检查 ${pageUrls.length} 个公开 URL 和 ${config.redirectChecks.length} 个历史转址` });

  const discoveredLinks = [...new Set(pageResults.flatMap((result) => result.links))]
    .filter((url) => !candidateUrls.has(url)).slice(0, config.linkCheckLimit);
  const linkResults = await runPool(discoveredLinks, 8, async (url) => {
    try {
      const result = await fetchLimited(url, config, { method: "HEAD", maxBytes: 10_000 });
      return result.response.status >= 400 ? finding({ ruleId: "internal-link-status", severity: "P2", category: "CTA 与链接", title: "站内链接不可用", location: url, evidence: `HTTP ${result.response.status}`, remediation: "修复链接目标或设置适当转址。" }) : null;
    } catch (error) {
      return finding({ ruleId: "internal-link-fetch", severity: "P2", category: "CTA 与链接", title: "站内链接检查失败", location: url, evidence: error.message, remediation: "检查链接地址、DNS 和 TLS。" });
    }
  });
  findings.push(...linkResults.filter(Boolean));
  stages.push({ id: "links", name: "站内链接", status: "completed", required: true, detail: `补充检查 ${discoveredLinks.length} 个站内链接` });

  const home = pageResults[0];
  try {
    const response = (await fetchLimited(config.baseUrl, config, { method: "HEAD", maxBytes: 10_000 })).response;
    const required = ["content-security-policy", "strict-transport-security", "x-content-type-options", "referrer-policy", "permissions-policy"];
    const missing = required.filter((header) => !response.headers.get(header));
    if (!response.headers.get("x-frame-options") && !String(response.headers.get("content-security-policy") || "").includes("frame-ancestors")) missing.push("x-frame-options/frame-ancestors");
    if (missing.length) findings.push(finding({ ruleId: "security-headers", severity: "P2", category: "线上安全", title: "线上缺少关键安全响应头", location: config.baseUrl, evidence: missing.join(", "), remediation: "在 CDN 或应用全局响应中补齐并验证安全头。" }));
    stages.push({ id: "headers", name: "安全响应头", status: "completed", required: true, detail: missing.length ? `缺少 ${missing.length} 项` : "关键安全头齐全" });
  } catch (error) {
    stages.push({ id: "headers", name: "安全响应头", status: "failed", required: true, detail: error.message });
    findings.push(finding({ ruleId: "header-stage", severity: "P1", category: "检查完整性", title: "安全响应头检查失败", location: config.baseUrl, evidence: error.message, remediation: "恢复访问后重跑。" }));
  }
  void home;

  const browserResult = await inspectBrowser(config, outputDir);
  findings.push(...browserResult.findings);
  stages.push({ id: "browser", name: "桌面与手机浏览器", status: browserResult.completed ? "completed" : "failed", required: true, detail: `检查 ${config.browserRoutes.length} 条关键路由的桌面和手机视口` });
  return {
    findings,
    stages,
    manifest,
    surfaces: [...pageResults.map((result) => result.surface), ...browserResult.surfaces],
    testedUrls: pageUrls,
  };
}
