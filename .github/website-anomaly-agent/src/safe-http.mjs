import dns from "node:dns/promises";
import net from "node:net";

const blockedV4 = [
  /^0\./, /^10\./, /^127\./, /^169\.254\./, /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./, /^224\./, /^24[0-9]\./, /^25[0-5]\./,
];

function isPublicAddress(address) {
  if (net.isIPv4(address)) return !blockedV4.some((pattern) => pattern.test(address));
  if (net.isIPv6(address)) {
    const normalized = address.toLowerCase();
    return normalized !== "::1" && normalized !== "::" && !normalized.startsWith("fc")
      && !normalized.startsWith("fd") && !normalized.startsWith("fe8")
      && !normalized.startsWith("fe9") && !normalized.startsWith("fea")
      && !normalized.startsWith("feb");
  }
  return false;
}

export async function assertAllowedUrl(value, config) {
  const url = new URL(value, config.baseUrl);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("只允许 HTTP(S) URL。");
  if (url.username || url.password || url.hash) throw new Error("URL 不允许包含认证信息或片段。");
  if (url.port && !["80", "443"].includes(url.port)) throw new Error("只允许标准 HTTP(S) 端口。");
  if (!config.allowedHosts.includes(url.hostname)) throw new Error(`主机不在允许清单：${url.hostname}`);
  const addresses = net.isIP(url.hostname)
    ? [{ address: url.hostname }]
    : await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some((item) => !isPublicAddress(item.address))) {
    throw new Error("目标解析到非公网地址。");
  }
  return url;
}

export async function fetchLimited(value, config, options = {}) {
  let url = await assertAllowedUrl(value, config);
  const maxBytes = options.maxBytes || 2_000_000;
  let response;
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    response = await fetch(url, {
      method: options.method || "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(options.timeoutMs || config.requestTimeoutMs),
      headers: {
        "User-Agent": "WebsiteAnomalyAgent/1.0 ReadOnlyMonitor",
        "Cache-Control": "no-cache",
        Accept: options.accept || "text/html,application/json,application/xml;q=0.9,*/*;q=0.2",
      },
    });
    if (options.redirect === "manual" || response.status < 300 || response.status >= 400 || !response.headers.get("location")) break;
    if (redirects === 3) throw new Error("重定向次数超过限制。");
    url = await assertAllowedUrl(new URL(response.headers.get("location"), url).toString(), config);
  }
  const declared = Number(response.headers.get("content-length") || "0");
  if (declared > maxBytes) throw new Error(`响应超过 ${maxBytes} 字节限制。`);
  if (options.method === "HEAD") return { response, text: "", url: response.url };
  if (!response.body) return { response, text: "", url: response.url };
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value: chunk } = await reader.read();
    if (done) break;
    total += chunk.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error(`响应超过 ${maxBytes} 字节限制。`);
    }
    chunks.push(chunk);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
  return { response, text: new TextDecoder().decode(merged), url: response.url };
}
