import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { ArticleCategory } from "@/lib/utils";
import type { Language } from "@/contexts/LanguageContext";

export type PublishedArticle = Tables<"articles"> & { static_content?: boolean };

export const getPublishedDate = (article: Pick<PublishedArticle, "published_at" | "created_at">) =>
  article.published_at || article.created_at;

export const getModifiedDate = (article: Pick<PublishedArticle, "published_at" | "updated_at" | "created_at">) => {
  const published = getPublishedDate(article);
  const updated = article.updated_at || published;
  return new Date(updated).getTime() >= new Date(published).getTime() ? updated : published;
};

const byNewest = (left: PublishedArticle, right: PublishedArticle) => {
  const leftDate = getModifiedDate(left);
  const rightDate = getModifiedDate(right);
  return new Date(rightDate).getTime() - new Date(leftDate).getTime();
};

const stripHtml = (value: string | null | undefined) => (value || "")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/gi, " ")
  .replace(/\s+/g, " ")
  .trim();

export const isArticleIndexable = (article: PublishedArticle, language: Language) => {
  const suffix = language === "zh-hk" ? "_zhtw" : language === "zh-cn" ? "_zhcn" : "";
  const record = article as unknown as Record<string, string | null | undefined>;
  return stripHtml(record[`title${suffix}`]).length > 0
    && stripHtml(record[`content${suffix}`]).length >= 80;
};

export const loadPublishedArticles = async (category?: ArticleCategory, language?: Language): Promise<PublishedArticle[]> => {
  let snapshot: PublishedArticle[] = [];
  try {
    const response = await fetch("/published-articles.json");
    if (response.ok) snapshot = await response.json() as PublishedArticle[];
  } catch {
    // The live query below remains available when a static snapshot cannot be read.
  }

  let query = supabase.from("articles").select("*").eq("published", true);
  if (category) query = query.eq("category", category);
  const { data: liveArticles, error } = await query.order("created_at", { ascending: false });

  if (error && snapshot.length === 0) throw error;

  const merged = new Map<string, PublishedArticle>();
  for (const article of snapshot) {
    if (!category || article.category === category) merged.set(article.slug, article);
  }
  for (const article of liveArticles || []) merged.set(article.slug, article);

  const articles = [...merged.values()];
  return (language ? articles.filter((article) => isArticleIndexable(article, language)) : articles).sort(byNewest);
};
