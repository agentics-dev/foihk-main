import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { normalizeArticleSlug, type ArticleCategory } from "@/lib/utils";
import type { Language } from "@/contexts/LanguageContext";
import { isArticleVisible, comparePublication } from "@/lib/articlePublication";

export type PublishedArticle = Tables<"articles"> & { static_content?: boolean };

export const getPublishedDate = (article: Pick<PublishedArticle, "published_at" | "created_at">) =>
  article.published_at || article.created_at;

export const getPublicUpdatedCandidate = (
  article: Pick<PublishedArticle, "published_at" | "public_updated_at" | "updated_at" | "created_at">,
) => {
  if (Object.prototype.hasOwnProperty.call(article, "public_updated_at")) {
    return article.public_updated_at;
  }
  return article.updated_at;
};

export const getModifiedDate = (article: Pick<PublishedArticle, "published_at" | "public_updated_at" | "updated_at" | "created_at">) => {
  const published = getPublishedDate(article);
  const updated = getPublicUpdatedCandidate(article) || published;
  return new Date(updated).getTime() >= new Date(published).getTime() ? updated : published;
};

export const loadPublishedArticles = async (category?: ArticleCategory, language?: Language): Promise<PublishedArticle[]> => {
  let query = supabase.from("articles").select("*").eq("published", true);
  if (category) query = query.eq("category", category);
  const { data, error } = await query.abortSignal(AbortSignal.timeout(10000));
  if (error) throw error;
  return [...new Map((data || []).map((article) => [article.id, article])).values()]
    .filter((article) => isArticleVisible(article, language)).sort(comparePublication);
};

export const loadPublishedArticle = async (category: ArticleCategory, key: string, language: Language) => {
  const articles = await loadPublishedArticles(category, language);
  const direct = articles.find((article) => article.id === key || normalizeArticleSlug(article.slug) === key);
  if (direct) return direct;
  const { data, error } = await supabase.from("article_slug_history").select("article_id")
    .eq("old_slug", key).eq("category", category).abortSignal(AbortSignal.timeout(10000));
  if (error) throw error;
  return articles.find((article) => data?.some((history) => history.article_id === article.id)) || null;
};
