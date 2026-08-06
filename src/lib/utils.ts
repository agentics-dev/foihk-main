import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLocalizedField<T = string>(
  article: object | null,
  field: string,
  language: string
): T {
  if (!article) return "" as T;
  const record = article as Record<string, unknown>;
  if (language === "zh-hk" && record[`${field}_zhtw`]) {
    return record[`${field}_zhtw`] as T;
  }
  if (language === "zh-cn" && record[`${field}_zhcn`]) {
    return record[`${field}_zhcn`] as T;
  }
  return (record[field] ?? "") as T;
}

export function getStrictLocalizedField(
  article: object | null,
  field: string,
  language: string
): string {
  if (!article) return "";
  const record = article as Record<string, unknown>;
  const localizedField = language === "zh-hk"
    ? `${field}_zhtw`
    : language === "zh-cn"
      ? `${field}_zhcn`
      : field;
  const value = record[localizedField];
  return typeof value === "string" ? value : "";
}

export function normalizeArticleSlug(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  if (normalized) return normalized;
  if (value.includes("經濟一週")) return "foihk-economic-digest-art-investment-interview";
  return "article";
}

export type ArticleCategory = "education_research" | "news_events" | "philanthropy";

export function getArticleCategoryPath(category: ArticleCategory | string): string {
  return category.replace(/_/g, "-");
}

export function parseArticleCategory(value: string | undefined): ArticleCategory | null {
  const normalized = value?.replace(/-/g, "_");
  return normalized === "education_research" || normalized === "news_events" || normalized === "philanthropy"
    ? normalized
    : null;
}

export function optimizeArticleImageUrl(url: string, width = 1200): string {
  if (!url.includes(".supabase.co/storage/v1/object/public/")) return url;
  const optimized = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
  const separator = optimized.includes("?") ? "&" : "?";
  return `${optimized}${separator}width=${width}&quality=80&resize=contain`;
}
