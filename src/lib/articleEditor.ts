import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables } from "@/integrations/supabase/types";

export class ArticleWriteError extends Error {
  constructor(public outcome: string) {
    super(outcome === "conflict" ? "This article changed in another session. Your changes have not been saved. Keep a copy and reopen the latest article."
      : outcome === "not_found" ? "This article was deleted. Your changes have not been saved." : "Unable to save article");
  }
}
const unwrap = (value: Json) => {
  const result = value as { outcome: string; article?: Tables<"articles">; revision?: number };
  if (!["saved", "deleted"].includes(result?.outcome)) throw new ArticleWriteError(result?.outcome);
  return result;
};
export const saveArticle = async (patch: Record<string, unknown>, article?: Tables<"articles"> | null, date?: string) => {
  const { data, error } = await supabase.rpc("save_article", {
    _patch: patch as Json, _id: article?.id, _expected_version: article?.edit_version,
    _date_action: date ? "set" : "preserve", _published_at: date,
  });
  if (error) throw new Error(error.message);
  const result = unwrap(data);
  if (!result.article) throw new Error("Article save was not confirmed");
  return result.article;
};
export const deleteArticle = async (article: Tables<"articles">) => {
  const { data, error } = await supabase.rpc("delete_article", { _id: article.id, _expected_version: article.edit_version });
  if (error) throw new Error(error.message);
  return unwrap(data);
};
