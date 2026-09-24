import { createClient } from "npm:@supabase/supabase-js@2.75.0";
import {
  buildAuditDispatchRequest,
  BUILD_TIMEOUT_MS,
  MAX_ARTICLE_HTML_BYTES,
  SITE_BASE_URL,
  isBuildTimedOut,
  mapWithConcurrency,
  readLimitedText,
  secureEqual,
  validateArticleHtml,
  validateBuildManifest,
  validateRemovalResponse,
  type DeployChange,
} from "../_shared/site-deploy.ts";

const INDEXNOW_KEY_PATTERN = /^[A-Za-z0-9-]{8,128}$/;
const DEPLOY_HOOK_PATH_PREFIX = "/v1/integrations/deploy/";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  },
});

const parseDeployHook = (value: string | undefined) => {
  if (!value || value.length > 1000) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:"
      || url.hostname !== "api.vercel.com"
      || !url.pathname.startsWith(DEPLOY_HOOK_PATH_PREFIX)
      || url.username
      || url.password
    ) return null;
    return url;
  } catch {
    return null;
  }
};

const fetchWithTimeout = (url: string | URL, init: RequestInit, timeoutMs = 10_000) =>
  fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });

const parseSitemapUrls = (xml: string) => new Set(
  [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]),
);

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  if ((Deno.env.get("SUPABASE_URL") || "").includes("kong:")) {
    return json({ error: "External deployment is disabled in the local environment" }, 503);
  }
  const configuredSecret = Deno.env.get("CONTENT_DEPLOY_WORKER_SECRET") || "";
  const suppliedSecret = request.headers.get("x-foihk-worker-secret") || "";
  if (configuredSecret.length < 32 || !(await secureEqual(configuredSecret, suppliedSecret))) {
    return json({ error: "Authentication required" }, 401);
  }

  let body: Record<string, unknown>;
  try {
    const rawBody = await request.text();
    if (rawBody.length > 200) return json({ error: "Request too large" }, 413);
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (Object.keys(body).length !== 1 || body.source !== "cron") {
    return json({ error: "Invalid worker request" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Worker is not configured" }, 503);
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const failDeploy = async (revision: number, message: string) => {
    const { error } = await supabase.rpc("site_deploy_worker_fail", {
      _revision: revision,
      _error: message.slice(0, 500),
    });
    if (error) console.error("Unable to record deploy failure", error.message);
  };

  const submitPendingIndexNow = async () => {
    const { data, error } = await supabase.rpc("site_deploy_worker_pending_indexnow");
    if (error) throw new Error(`Unable to load IndexNow queue: ${error.message}`);
    const urls = Array.isArray(data?.urls)
      ? data.urls.filter((url: unknown): url is string => typeof url === "string")
      : [];
    if (urls.length === 0) return { submitted: 0 };

    const indexNowKey = Deno.env.get("INDEXNOW_KEY") || "";
    let success = false;
    let failure = "IndexNow is not configured";
    if (INDEXNOW_KEY_PATTERN.test(indexNowKey)) {
      try {
        const response = await fetchWithTimeout("https://api.indexnow.org/indexnow", {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            host: "www.foihk.org",
            key: indexNowKey,
            keyLocation: `${SITE_BASE_URL}/${indexNowKey}.txt`,
            urlList: urls,
          }),
          redirect: "error",
        });
        await readLimitedText(response, 32_000);
        success = response.status === 200 || response.status === 202;
        failure = `IndexNow returned ${response.status}`;
      } catch (error) {
        failure = error instanceof Error ? error.message : "IndexNow request failed";
      }
    }

    const { error: resultError } = await supabase.rpc("site_deploy_worker_indexnow_result", {
      _urls: urls,
      _success: success,
      _error: success ? null : failure,
    });
    if (resultError) throw new Error(`Unable to update IndexNow queue: ${resultError.message}`);
    return { submitted: success ? urls.length : 0, indexNowError: success ? null : failure };
  };

  const dispatchWebsiteAudit = async (completedRevision: number) => {
    const request = buildAuditDispatchRequest(
      completedRevision,
      Deno.env.get("GITHUB_AUDIT_TOKEN") || "",
    );
    if (!request) return { auditDispatched: false, auditDispatchError: "GitHub audit dispatch is not configured" };
    try {
      const response = await fetchWithTimeout(request.url, request.init);
      await readLimitedText(response, 32_000);
      if (response.status !== 204) throw new Error(`GitHub dispatch returned ${response.status}`);
      return { auditDispatched: true, auditDispatchError: null };
    } catch (error) {
      return {
        auditDispatched: false,
        auditDispatchError: error instanceof Error ? error.message : "GitHub audit dispatch failed",
      };
    }
  };

  const { data: next, error: nextError } = await supabase.rpc("site_deploy_worker_next");
  if (nextError) return json({ error: "Unable to claim deploy work" }, 500);
  const action = typeof next?.action === "string" ? next.action : "invalid";
  const revision = Number(next?.revision);

  if (action === "trigger") {
    const deployHook = parseDeployHook(Deno.env.get("VERCEL_DEPLOY_HOOK_URL"));
    if (!deployHook || !Number.isSafeInteger(revision)) {
      if (Number.isSafeInteger(revision)) await failDeploy(revision, "Deploy Hook is not configured");
      return json({ error: "Deploy Hook is not configured" }, 503);
    }
    try {
      const response = await fetchWithTimeout(deployHook, {
        method: "POST",
        redirect: "manual",
      });
      await readLimitedText(response, 32_000);
      if (!response.ok) throw new Error(`Deploy Hook returned ${response.status}`);
      const { error } = await supabase.rpc("site_deploy_worker_hook_accepted", {
        _revision: revision,
      });
      if (error) throw new Error(`Unable to record Deploy Hook acceptance: ${error.message}`);
      return json({ ok: true, status: "building", revision }, 202);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Deploy Hook request failed";
      await failDeploy(revision, message);
      return json({ error: "Unable to trigger deployment", retryable: true }, 502);
    }
  }

  if (action === "reconcile" && Number.isSafeInteger(revision)) {
    let manifestResponse: Response;
    try {
      manifestResponse = await fetchWithTimeout(
        `${SITE_BASE_URL}/content-build.json?revision=${revision}`,
        { method: "GET", redirect: "error", headers: { "Cache-Control": "no-cache" } },
      );
    } catch (error) {
      if (isBuildTimedOut(next.triggeredAt, Date.now(), BUILD_TIMEOUT_MS)) {
        await failDeploy(revision, error instanceof Error ? error.message : "Build manifest unavailable");
        return json({ error: "Deployment verification timed out", retryable: true }, 502);
      }
      return json({ ok: true, status: "building", revision }, 202);
    }

    let manifest = null;
    try {
      manifest = validateBuildManifest(JSON.parse(await readLimitedText(manifestResponse, 1_000_000)));
    } catch {
      manifest = null;
    }
    if (!manifestResponse.ok || !manifest || manifest.revision < revision) {
      if (isBuildTimedOut(next.triggeredAt, Date.now(), BUILD_TIMEOUT_MS)) {
        await failDeploy(revision, "Production manifest did not reach the requested revision");
        return json({ error: "Deployment verification timed out", retryable: true }, 502);
      }
      return json({ ok: true, status: "building", revision }, 202);
    }

    const { data: payload, error: payloadError } = await supabase.rpc(
      "site_deploy_worker_payload",
      { _revision: revision },
    );
    if (payloadError) {
      await failDeploy(revision, payloadError.message);
      return json({ error: "Unable to load deploy payload" }, 500);
    }
    const payloadValue = payload && typeof payload === "object"
      ? payload as Record<string, unknown>
      : null;
    const changes: DeployChange[] = Array.isArray(payloadValue?.changes)
      ? payloadValue.changes.filter((change: unknown): change is DeployChange => {
        if (!change || typeof change !== "object") return false;
        const value = change as Record<string, unknown>;
        return typeof value.url === "string" && (value.kind === "upsert" || value.kind === "remove");
      })
      : [];

    try {
      const sitemapResponse = await fetchWithTimeout(
        `${SITE_BASE_URL}/sitemap.xml?revision=${revision}`,
        { method: "GET", redirect: "error", headers: { "Cache-Control": "no-cache" } },
      );
      if (!sitemapResponse.ok) throw new Error(`Sitemap returned ${sitemapResponse.status}`);
      const sitemapUrls = parseSitemapUrls(await readLimitedText(sitemapResponse, 2_000_000));
      const manifestUrls = new Set(manifest.publicUrls);
      const indexableUrls = new Set(manifest.urls);

      const validationErrors = (await mapWithConcurrency(changes, 6, async (change) => {
        const expectedLive = manifestUrls.has(change.url);
        if (indexableUrls.has(change.url) !== sitemapUrls.has(change.url)) {
          return `${change.url}: sitemap and build manifest disagree`;
        }
        const response = await fetchWithTimeout(change.url, {
          method: "GET",
          redirect: "manual",
          headers: { "Cache-Control": "no-cache" },
        });
        if (!expectedLive) {
          const removalError = validateRemovalResponse(response.status, response.headers.get("Location"));
          return removalError ? `${change.url}: ${removalError}` : null;
        }
        if (response.status !== 200) return `${change.url}: expected 200, received ${response.status}`;
        const contentType = response.headers.get("Content-Type") || "";
        if (!contentType.toLowerCase().includes("text/html")) {
          return `${change.url}: production response is not HTML`;
        }
        const html = await readLimitedText(response, MAX_ARTICLE_HTML_BYTES);
        const errors = validateArticleHtml(html, change.url, indexableUrls.has(change.url), manifest.revision);
        return errors.length > 0 ? `${change.url}: ${errors.join(", ")}` : null;
      })).filter((error): error is string => Boolean(error));

      if (validationErrors.length > 0) throw new Error(validationErrors.slice(0, 3).join("; "));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Production verification failed";
      await failDeploy(revision, message);
      return json({ error: "Production verification failed", retryable: true }, 502);
    }

    const { error: completeError } = await supabase.rpc("site_deploy_worker_complete", {
      _revision: revision,
    });
    if (completeError) return json({ error: "Unable to complete deployment" }, 500);
    const [indexNow, auditDispatch] = await Promise.all([
      submitPendingIndexNow(),
      dispatchWebsiteAudit(revision),
    ]);
    return json({ ok: true, status: "live", revision, ...indexNow, ...auditDispatch });
  }

  try {
    const indexNow = await submitPendingIndexNow();
    return json({ ok: true, status: action, ...indexNow });
  } catch {
    return json({ ok: true, status: action, indexNowError: "IndexNow retry failed" });
  }
});
