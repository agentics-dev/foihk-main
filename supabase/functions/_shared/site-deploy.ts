export const SITE_BASE_URL = "https://www.foihk.org";
export const BUILD_TIMEOUT_MS = 10 * 60 * 1000;
export const MAX_ARTICLE_HTML_BYTES = 1_500_000;

export type DeployChange = {
  url: string;
  kind: "upsert" | "remove";
  articleId: string | null;
};

export type BuildManifest = {
  formatVersion: 2;
  publicUrls: string[];
  revision: number;
  generatedAt: string;
  urls: string[];
};

export const isBuildTimedOut = (
  triggeredAt: string | null | undefined,
  now = Date.now(),
  timeoutMs = BUILD_TIMEOUT_MS,
) => {
  const started = triggeredAt ? Date.parse(triggeredAt) : Number.NaN;
  return Number.isFinite(started) && now - started >= timeoutMs;
};

export const validateBuildManifest = (value: unknown): BuildManifest | null => {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (!Number.isSafeInteger(candidate.revision) || Number(candidate.revision) < 1) return null;
  if (typeof candidate.generatedAt !== "string" || !Number.isFinite(Date.parse(candidate.generatedAt))) {
    return null;
  }
  if (candidate.formatVersion !== 2 || !Array.isArray(candidate.publicUrls)) return null;
  if (!Array.isArray(candidate.urls) || candidate.urls.length > 5000) return null;
  if (candidate.publicUrls.length > 5000 || candidate.urls.some((url) => !(candidate.publicUrls as unknown[]).includes(url))) return null;
  if ([...candidate.urls, ...candidate.publicUrls].some((url) => {
    if (typeof url !== "string" || url.length > 500) return true;
    try {
      const parsed = new URL(url);
      return parsed.origin !== SITE_BASE_URL || parsed.username !== "" || parsed.password !== "";
    } catch {
      return true;
    }
  })) return null;
  return candidate as BuildManifest;
};

export const validateArticleHtml = (html: string, expectedUrl: string, indexable = true, revision?: number) => {
  const errors: string[] = [];
  const robotTags = html.match(/<meta\b[^>]*>/gi) || [];
  const noindex = robotTags.some((tag) => /\bname=["']robots["']/i.test(tag) && /noindex/i.test(tag));
  if (indexable === noindex) errors.push(indexable ? "indexable page marked noindex" : "non-indexable page missing noindex");
  if (revision !== undefined && !robotTags.some((tag) => tag.includes('name="foihk-content-revision"') && tag.includes(`content="${revision}"`))) errors.push("page revision mismatch");
  if (!/<h1(?:\s|>)/i.test(html)) errors.push("missing H1");

  const linkTags = html.match(/<link\b[^>]*>/gi) || [];
  const hasCanonical = linkTags.some((tag) =>
    /\brel=["']canonical["']/i.test(tag)
    && tag.includes(`href="${expectedUrl}"`)
  );
  if (!hasCanonical) errors.push("missing canonical");

  const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
  const hasDescription = metaTags.some((tag) =>
    /\bname=["']description["']/i.test(tag)
    && /\bcontent=["'][^"']+["']/i.test(tag)
  );
  if (!hasDescription) errors.push("missing meta description");
  if (!/"@type"\s*:\s*"(?:Article|NewsArticle)"/i.test(html)) {
    errors.push("missing Article JSON-LD");
  }
  return errors;
};

export const validateRemovalResponse = (status: number, location: string | null) => {
  if (status === 404 || status === 410) return null;
  if (![301, 308].includes(status) || !location) return `unexpected removal status ${status}`;
  try {
    const destination = new URL(location, SITE_BASE_URL);
    return destination.origin === SITE_BASE_URL ? null : "removal redirect leaves FOIHK";
  } catch {
    return "invalid removal redirect";
  }
};

export const mapWithConcurrency = async <Input, Output>(
  values: Input[],
  concurrency: number,
  mapper: (value: Input) => Promise<Output>,
) => {
  const results = new Array<Output>(values.length);
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index]);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(Math.max(concurrency, 1), values.length) }, worker),
  );
  return results;
};

export const readLimitedText = async (response: Response, maxBytes: number) => {
  const declaredLength = Number(response.headers.get("Content-Length") || "0");
  if (declaredLength > maxBytes) throw new Error("Response exceeds size limit");
  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let output = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel();
      throw new Error("Response exceeds size limit");
    }
    output += decoder.decode(value, { stream: true });
  }
  output += decoder.decode();
  return output;
};

export const secureEqual = async (left: string, right: string) => {
  const encoder = new TextEncoder();
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let difference = left.length ^ right.length;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }
  return difference === 0;
};
