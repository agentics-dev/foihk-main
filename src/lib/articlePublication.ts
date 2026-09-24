// Publication rules shared by the editor, public reader and build tools.
export const articleText = (value: string | null | undefined) => (value || "")
  .replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/gi, " ").trim();

type PublicationContent = {
  title: string; title_zhtw?: string | null; title_zhcn?: string | null;
  content?: string | null; content_zhtw?: string | null; content_zhcn?: string | null;
  image_urls?: string[] | null;
};
export const canPublishArticle = (article: PublicationContent) => {
  const images = Boolean(article.image_urls?.some((url) => /^https?:\/\//.test(url)));
  return (["", "_zhtw", "_zhcn"] as const).some((suffix) =>
    Boolean(articleText(article[`title${suffix}`])) && (images
      || Boolean(articleText(article[`content${suffix}`]))
      || /<img\b[^>]*\bsrc=["']https?:\/\//i.test(article[`content${suffix}`] || "")));
};
export const isArticleVisible = (article: PublicationContent & { published: boolean }, language?: string) => {
  const title = language === "zh-hk" ? article.title_zhtw : language === "zh-cn" ? article.title_zhcn : article.title;
  return article.published && Boolean(title?.trim());
};
export const comparePublication = (left: { id: string; published_at: string | null; created_at: string }, right: { id: string; published_at: string | null; created_at: string }) =>
  Date.parse(right.published_at || right.created_at) - Date.parse(left.published_at || left.created_at) || left.id.localeCompare(right.id);
