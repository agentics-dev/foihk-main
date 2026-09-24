import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const siteSchema = z.object({
  siteId: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  baseUrl: z.string().url(),
  sourceRoot: z.string().min(1),
  sourceRootEnv: z.string().optional(),
  allowedHosts: z.array(z.string().min(1)).min(1),
  sitemapPath: z.string().startsWith("/"),
  manifestPath: z.string().startsWith("/"),
  articlePathPattern: z.string().min(1),
  locales: z.array(z.string().min(1)).min(1),
  htmlLangByLocale: z.record(z.string(), z.string()).default({}),
  keyRoutes: z.array(z.string().startsWith("/")),
  browserRoutes: z.array(z.string().startsWith("/")),
  redirectChecks: z.array(z.object({
    from: z.string().startsWith("/"),
    to: z.string().startsWith("/"),
  })).default([]),
  expectedArticleUrls: z.array(z.string()).default([]),
  maxPages: z.number().int().min(1).max(500).default(200),
  linkCheckLimit: z.number().int().min(1).max(500).default(160),
  browserTimeoutMs: z.number().int().min(5000).max(60000).default(30000),
  requestTimeoutMs: z.number().int().min(3000).max(30000).default(12000),
  observationUntil: z.string().datetime().optional(),
  security: z.object({
    enabled: z.boolean().default(true),
    cliPath: z.string().min(1),
    excludedPaths: z.array(z.string().min(1)).default([]),
  }),
  github: z.object({
    repository: z.string().regex(/^[^/]+\/[^/]+$/),
    issueLabel: z.string().min(1),
    stateLabel: z.string().min(1),
  }).optional(),
});

export async function loadConfig(configPath) {
  const absolutePath = path.resolve(configPath);
  const raw = JSON.parse(await fs.readFile(absolutePath, "utf8"));
  const config = siteSchema.parse(raw);
  const rootFromEnvironment = config.sourceRootEnv ? process.env[config.sourceRootEnv] : undefined;
  const sourceRoot = path.resolve(rootFromEnvironment || config.sourceRoot);
  const cliPath = path.resolve(path.dirname(absolutePath), config.security.cliPath);
  const base = new URL(config.baseUrl);
  if (!config.allowedHosts.includes(base.hostname)) {
    throw new Error("baseUrl 主机必须出现在 allowedHosts 中。");
  }
  return {
    ...config,
    configPath: absolutePath,
    sourceRoot,
    security: { ...config.security, cliPath },
    articleRegex: new RegExp(config.articlePathPattern),
  };
}

export function resolveOutputPath(value, fallbackName = "runs/latest") {
  return path.resolve(value || fallbackName);
}
