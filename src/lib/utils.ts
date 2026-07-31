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
