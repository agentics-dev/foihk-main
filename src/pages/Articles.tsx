import { useEffect, useState } from "react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CroppedImage } from "@/components/CroppedImage";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar, Search } from "lucide-react";
import { getLocalizedField, normalizeArticleSlug } from "@/lib/utils";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import type { Tables } from "@/integrations/supabase/types";

type ArticleRow = Tables<"articles">;

const Articles = () => {
  const { t, language } = useLanguage();
  const { category } = useParams<{ category: "education_research" | "news_events" | "philanthropy" }>();
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
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("category", category)
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching articles:", error);
      }
      
      setArticles(data || []);
      setLoading(false);
    };

    fetchArticles();
  }, [category]);

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
      <SEO
        title={seoTitle}
        description={description}
        breadcrumbs={[
          { name: language === "en" ? "Home" : language === "zh-hk" ? "首頁" : "首页", url: `https://www.foihk.org/${language}` },
          { name: title, url: `https://www.foihk.org/${language}/articles/${category}` },
        ]}
      />
      <Navigation />
      
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <Link 
                key={article.id}
                to={`/articles/${category}/${normalizeArticleSlug(article.slug)}`}
                className="block h-full"
              >
                <Card 
                  className="h-full flex flex-col shadow-elegant hover:shadow-glow transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                >
                  {article.image_urls && article.image_urls.length > 0 ? (
                    <CroppedImage
                      src={article.image_urls[0]}
                      alt={getLocalizedField(article, 'title', language)}
                      metadata={article.image_metadata?.[article.image_urls[0]]}
                      containerClassName="aspect-video w-full rounded-t-lg flex-shrink-0"
                      className="transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="aspect-video w-full flex-shrink-0 rounded-t-lg bg-secondary/30 flex items-center justify-center">
                      <Calendar className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  <CardHeader className="flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
                      <Calendar className="h-4 w-4" />
                      <time dateTime={article.published_at || article.created_at}>
                        {new Date(article.published_at || article.created_at).toLocaleDateString(language, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </time>
                    </div>
                    <h2 className="text-xl font-bold line-clamp-2 hover:text-primary transition-colors mt-2 h-14 flex-shrink-0">
                      {getLocalizedField(article, 'title', language)}
                    </h2>
                    <p className="text-sm text-muted-foreground line-clamp-3 mt-2 h-[3.75rem] flex-shrink-0">
                      {getLocalizedField(article, 'excerpt', language) || '\u00A0'}
                    </p>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Articles;
