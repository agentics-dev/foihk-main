import { useEffect, useState } from "react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { useParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CroppedImage } from "@/components/CroppedImage";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar, Search } from "lucide-react";
import { getArticleCategoryPath, getLocalizedField, normalizeArticleSlug, parseArticleCategory } from "@/lib/utils";
import { getModifiedDate, getPublishedDate, loadPublishedArticles } from "@/lib/articles";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ORGANIZATION_URL, SITE_CONTENT_REVIEWED_DATE } from "@/lib/schema";
import type { Tables } from "@/integrations/supabase/types";

type ArticleRow = Tables<"articles">;

const RESEARCH_BATCH_DATE = "2026-08-03";

const Articles = () => {
  const { t, language } = useLanguage();
  const { category: categoryParam } = useParams<{ category: string }>();
  const category = parseArticleCategory(categoryParam);
  const categoryPath = category ? getArticleCategoryPath(category) : "";
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchArticles = async () => {
      if (!category) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        setArticles(await loadPublishedArticles(category, language));
      } catch (error) {
        console.error("Error fetching articles:", error);
        setArticles([]);
      }
      setLoading(false);
    };

    fetchArticles();
  }, [category, language]);

  const title = category === "education_research" 
    ? t("articles.educationTitle")
    : category === "philanthropy"
    ? t("articles.philanthropyTitle")
    : t("articles.newsTitle");

  const seoTitles = {
    en: {
      education_research: "Hong Kong Family Office Education & Research",
      philanthropy: "Family Office Philanthropy & Impact",
      news_events: "Hong Kong Family Office News & Events",
    },
    "zh-hk": {
      education_research: "香港家族辦公室教育與研究",
      philanthropy: "家族慈善與影響力",
      news_events: "香港家族辦公室新聞與活動",
    },
    "zh-cn": {
      education_research: "香港家族办公室教育与研究",
      philanthropy: "家族慈善与影响力",
      news_events: "香港家族办公室新闻与活动",
    },
  } as const;
  const validCategory = category || "news_events";
  const seoTitle = seoTitles[language][validCategory];

  const description = category === "education_research"
    ? t("articles.educationPageDesc")
    : category === "philanthropy"
    ? t("articles.philanthropyPageDesc")
    : t("articles.newsPageDesc");

  const filteredArticles = articles.filter((article) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      article.title?.toLowerCase().includes(query) ||
      article.title_zhtw?.toLowerCase().includes(query) ||
      article.title_zhcn?.toLowerCase().includes(query) ||
      article.excerpt?.toLowerCase().includes(query) ||
      article.excerpt_zhtw?.toLowerCase().includes(query) ||
      article.excerpt_zhcn?.toLowerCase().includes(query)
    );
  });
  const collectionUrl = `${ORGANIZATION_URL}/${language}/articles/${categoryPath}`;
  const collectionBaselineDate = category === "education_research"
    ? "2026-08-04T00:00:00+08:00"
    : SITE_CONTENT_REVIEWED_DATE;
  const latestModified = articles.reduce((latest, article) => {
    const modified = getModifiedDate(article);
    return new Date(modified).getTime() > new Date(latest).getTime() ? modified : latest;
  }, collectionBaselineDate);
  const dateCopy = language === "en"
    ? { updated: "Page last updated", published: "Published", modified: "Updated" }
    : language === "zh-hk"
      ? { updated: "頁面最後更新", published: "發布", modified: "更新" }
      : { updated: "页面最后更新", published: "发布", modified: "更新" };
  const latestHeading = category === "news_events"
    ? language === "en" ? "Latest news and events" : language === "zh-hk" ? "最新新聞與活動" : "最新新闻与活动"
    : category === "education_research"
      ? language === "en" ? "Latest education and research" : language === "zh-hk" ? "最新教育與研究" : "最新教育与研究"
      : language === "en" ? "Latest philanthropy articles" : language === "zh-hk" ? "最新慈善內容" : "最新慈善内容";
  const formatDate = (date: string) => new Date(date).toLocaleDateString(language, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Hong_Kong",
  });
  const isEducationResearch = category === "education_research";
  const researchCardCopy = language === "en"
    ? { label: "Research guide", reading: "FOIHK education and research" }
    : language === "zh-hk"
      ? { label: "研究指南", reading: "FOIHK 教育與研究" }
      : { label: "研究指南", reading: "FOIHK 教育与研究" };
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": title,
    "description": description,
    "url": collectionUrl,
    "inLanguage": language === "en" ? "en" : language === "zh-hk" ? "zh-Hant" : "zh-Hans",
    "dateModified": latestModified,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": articles.length,
      "itemListElement": articles.map((article, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": article.category === "news_events" ? "NewsArticle" : "Article",
          "headline": getLocalizedField(article, "title", language),
          "url": `${collectionUrl}/${normalizeArticleSlug(article.slug)}`,
          "datePublished": getPublishedDate(article),
          "dateModified": getModifiedDate(article),
        },
      })),
    },
  };
  const freshnessSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${collectionUrl}#webpage`,
    "name": title,
    "description": description,
    "url": collectionUrl,
    "inLanguage": language === "en" ? "en" : language === "zh-hk" ? "zh-Hant" : "zh-Hans",
    "dateModified": latestModified,
  };

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <p className="text-center text-muted-foreground">{t("articles.invalidCategory")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {!loading && (
        <SEO
          title={seoTitle}
          description={description}
          structuredData={freshnessSchema}
        />
      )}
      <Navigation />
      <main data-content-ready={loading ? "false" : "true"}>
      <script data-collection-schema type="application/ld+json">{JSON.stringify(collectionSchema)}</script>

      {/* Page Title Section */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumbs
            items={[
              { label: language === "en" ? "Home" : language === "zh-hk" ? "首頁" : "首页", to: "/" },
              { label: title },
            ]}
          />
          <h1 className="text-4xl font-bold text-foreground mb-2">{title}</h1>
          <p className="text-lg text-muted-foreground">{description}</p>
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            {dateCopy.updated}: <time dateTime={latestModified}>{formatDate(latestModified)}</time>
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("articles.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <h2 id="latest-content" className="mb-7 text-2xl font-bold text-foreground">{latestHeading}</h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">{t("articles.loading")}</p>
          </div>
        ) : articles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">{t("articles.noArticles")}</p>
            </CardContent>
          </Card>
        ) : filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t("articles.noMatch")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article) => {
              const isResearchBatchArticle = isEducationResearch && getPublishedDate(article).startsWith(RESEARCH_BATCH_DATE);
              const hasImage = Boolean(article.image_urls && article.image_urls.length > 0);
              const isFoihkLogoCover = article.image_urls?.[0] === "/foihk-logo.png";
              const localizedArticleTitle = getLocalizedField(article, "title", language);
              const localizedArticleExcerpt = getLocalizedField(article, "excerpt", language);

              return (
              <Link 
                key={article.id}
                to={`/articles/${categoryPath}/${normalizeArticleSlug(article.slug)}`}
                className="block h-full"
              >
                <article data-content-card className="h-full">
                <Card className={`h-full flex flex-col overflow-hidden border-border/70 shadow-elegant transition-all duration-300 hover:-translate-y-1 hover:shadow-glow ${isResearchBatchArticle ? "bg-background" : ""} cursor-pointer`}>
                  {hasImage ? (
                    <CroppedImage
                      src={article.image_urls[0]}
                      alt={localizedArticleTitle}
                      metadata={article.image_metadata?.[article.image_urls[0]]}
                      containerClassName={`aspect-video w-full rounded-t-lg flex-shrink-0 ${isFoihkLogoCover ? "bg-white p-8" : ""}`}
                      className={`${isFoihkLogoCover ? "object-contain" : ""} transition-transform duration-300 hover:scale-105`}
                    />
                  ) : isResearchBatchArticle ? (
                    <div className="border-b border-border bg-secondary/25 px-7 py-5 sm:px-8">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs font-semibold uppercase tracking-normal text-primary">
                          {researchCardCopy.label}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">
                          {researchCardCopy.reading}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video w-full flex-shrink-0 rounded-t-lg bg-secondary/30 flex items-center justify-center">
                      <Calendar className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  <CardHeader className={`flex-1 flex flex-col ${isResearchBatchArticle ? "p-7 sm:p-8" : ""}`}>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground flex-shrink-0">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" aria-hidden="true" />
                        {dateCopy.published}: <time data-published-date dateTime={getPublishedDate(article)}>{formatDate(getPublishedDate(article))}</time>
                      </span>
                      <span>
                        {dateCopy.modified}: <time data-updated-date dateTime={getModifiedDate(article)}>{formatDate(getModifiedDate(article))}</time>
                      </span>
                    </div>
                    <h3 className={`${isResearchBatchArticle ? "mt-4 min-h-[4.5rem] text-2xl leading-tight line-clamp-3" : "mt-2 h-14 text-xl line-clamp-2"} font-bold transition-colors hover:text-primary flex-shrink-0`}>
                      {localizedArticleTitle}
                    </h3>
                    <p className={`${isResearchBatchArticle ? "mt-4 min-h-[7rem] text-base leading-7 line-clamp-4" : "mt-2 h-[3.75rem] text-sm line-clamp-3"} text-muted-foreground flex-shrink-0`}>
                      {localizedArticleExcerpt || '\u00A0'}
                    </p>
                  </CardHeader>
                </Card>
                </article>
              </Link>
              );
            })}
          </div>
        )}
      </div>
      </main>

      <Footer lastUpdated={latestModified} />
    </div>
  );
};

export default Articles;
