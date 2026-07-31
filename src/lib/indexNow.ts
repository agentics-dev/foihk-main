import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { normalizeArticleSlug } from "@/lib/utils";

type ArticleCategory = Database["public"]["Enums"]["article_category"];

export const notifyIndexNow = async (category: ArticleCategory, slug: string) => {
  const { error } = await supabase.functions.invoke("notify-indexnow", {
    body: { category, slug: normalizeArticleSlug(slug) },
  });
  if (error) throw error;
};
