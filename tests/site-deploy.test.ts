import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAuditDispatchRequest,
  isBuildTimedOut,
  mapWithConcurrency,
  secureEqual,
  validateArticleHtml,
  validateBuildManifest,
  validateRemovalResponse,
} from "../supabase/functions/_shared/site-deploy.ts";

const ARTICLE_URL = "https://www.foihk.org/en/articles/news-events/family-office-forum";

test("build manifest accepts only FOIHK URLs and a safe revision", () => {
  const valid = validateBuildManifest({
    formatVersion: 2,
    publicUrls: [ARTICLE_URL],
    revision: 42,
    generatedAt: "2026-08-17T01:02:03.000Z",
    urls: [ARTICLE_URL],
  });
  assert.equal(valid?.revision, 42);
  assert.equal(validateBuildManifest({ ...valid, revision: -1 }), null);
  assert.equal(validateBuildManifest({ ...valid, urls: ["https://evil.example/article"] }), null);
});

test("raw article validation rejects the SPA shell and accepts prerendered SEO HTML", () => {
  const shell = '<html><head><title>FOIHK</title></head><body><div id="root"></div></body></html>';
  assert.deepEqual(validateArticleHtml(shell, ARTICLE_URL), [
    "missing H1",
    "missing canonical",
    "missing meta description",
    "missing Article JSON-LD",
  ]);

  const prerendered = `<html><head>
    <link rel="canonical" href="${ARTICLE_URL}">
    <meta name="description" content="A complete event description.">
    <script type="application/ld+json">{"@type":"NewsArticle"}</script>
    </head><body><h1>Family Office Forum</h1></body></html>`;
  assert.deepEqual(validateArticleHtml(prerendered, ARTICLE_URL), []);
});

test("removed URLs accept 404, 410, and same-origin permanent redirects only", () => {
  assert.equal(validateRemovalResponse(404, null), null);
  assert.equal(validateRemovalResponse(410, null), null);
  assert.equal(validateRemovalResponse(301, "/en/articles/news-events"), null);
  assert.equal(validateRemovalResponse(302, "/en/articles/news-events"), "unexpected removal status 302");
  assert.equal(validateRemovalResponse(301, "https://evil.example/"), "removal redirect leaves FOIHK");
});

test("deployment timeout is deterministic", () => {
  const now = Date.parse("2026-08-17T02:10:00.000Z");
  assert.equal(isBuildTimedOut("2026-08-17T02:00:00.000Z", now), true);
  assert.equal(isBuildTimedOut("2026-08-17T02:00:01.000Z", now), false);
  assert.equal(isBuildTimedOut(null, now), false);
});

test("bounded concurrency preserves result order", async () => {
  const result = await mapWithConcurrency([3, 1, 2], 2, async (value) => {
    await new Promise((resolve) => setTimeout(resolve, value));
    return value * 2;
  });
  assert.deepEqual(result, [6, 2, 4]);
});

test("worker secret comparison rejects length and value differences", async () => {
  assert.equal(await secureEqual("a".repeat(32), "a".repeat(32)), true);
  assert.equal(await secureEqual("a".repeat(32), "b".repeat(32)), false);
  assert.equal(await secureEqual("a".repeat(32), "a".repeat(31)), false);
});

test("public noindex pages are valid, but indexing and revision mismatches fail", () => {
  const html = `<html><head><meta name="robots" content="noindex, follow"><meta name="foihk-content-revision" content="8"><meta name="description" content="Picture article"><link rel="canonical" href="${ARTICLE_URL}"><script type="application/ld+json">{"@type":"NewsArticle"}</script></head><body><h1>Picture</h1></body></html>`;
  assert.deepEqual(validateArticleHtml(html, ARTICLE_URL, false, 8), []);
  assert.ok(validateArticleHtml(html, ARTICLE_URL, true, 8).includes("indexable page marked noindex"));
  assert.ok(validateArticleHtml(html, ARTICLE_URL, false, 9).includes("page revision mismatch"));
  assert.equal(validateBuildManifest({formatVersion:2,revision:8,generatedAt:new Date().toISOString(),urls:[ARTICLE_URL],publicUrls:[]}),null);
});

test("audit dispatch is fixed to the FOIHK repository and carries only the revision", () => {
  const request = buildAuditDispatchRequest(42, "x".repeat(40));
  assert.equal(request?.url, "https://api.github.com/repos/agentics-dev/foihk-main/dispatches");
  assert.deepEqual(JSON.parse(String(request?.init.body)), {
    event_type: "site-published",
    client_payload: { revision: 42 },
  });
  assert.equal(buildAuditDispatchRequest(0, "x".repeat(40)), null);
  assert.equal(buildAuditDispatchRequest(42, "short"), null);
});
