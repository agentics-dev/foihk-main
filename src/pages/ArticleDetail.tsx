import { useEffect, useState } from "react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DOMPurify from "dompurify";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, Calendar, History, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { getStrictLocalizedField, normalizeArticleSlug } from "@/lib/utils";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import type { Tables } from "@/integrations/supabase/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Autoplay from "embla-carousel-autoplay";
import {
  ORGANIZATION_ALTERNATE_NAMES,
  ORGANIZATION_ENGLISH_NAME,
  ORGANIZATION_LEGAL_NAME,
  ORGANIZATION_LOGO,
  ORGANIZATION_URL,
} from "@/lib/schema";

const META_DESCRIPTION_MAX_LENGTH = 160;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type ArticleRow = Tables<"articles">;

const buildArticleMetaDescription = (
  title: string,
  excerpt: string,
  category: string | undefined,
  language: string
) => {
  const normalizedTitle = title.replace(/\s+/g, " ").trim();
  const normalizedExcerpt = excerpt.replace(/\s+/g, " ").trim();
  const fallbacks = language === "en"
    ? {
        philanthropy: "FOIHK philanthropy and community impact update from Hong Kong.",
        news_events: "FOIHK event and family office industry update from Hong Kong.",
        education_research: "FOIHK education and research insight for the Hong Kong family office sector.",
      }
    : language === "zh-hk"
      ? {
          philanthropy: "FOIHK 香港慈善與社區影響資訊。",
          news_events: "FOIHK 香港活動與家族辦公室行業資訊。",
          education_research: "FOIHK 香港家族辦公室教育與研究資訊。",
        }
      : {
          philanthropy: "FOIHK 香港慈善与社区影响信息。",
          news_events: "FOIHK 香港活动与家族办公室行业信息。",
          education_research: "FOIHK 香港家族办公室教育与研究信息。",
        };
  const categoryKey = category === "philanthropy" || category === "news_events"
    ? category
    : "education_research";
  let description = normalizedExcerpt || `${normalizedTitle}. ${fallbacks[categoryKey]}`;

  if (description.length > META_DESCRIPTION_MAX_LENGTH) {
    const trimmed = description.slice(0, META_DESCRIPTION_MAX_LENGTH - 3);
    const safeTrimmed = trimmed.includes(" ")
      ? trimmed.slice(0, trimmed.lastIndexOf(" "))
      : trimmed;
    description = `${safeTrimmed.trim()}...`;
  }

  return description;
};

const ArticleDetail = () => {
  const { category, articleKey } = useParams<{ category: string; articleKey: string }>();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [article, setArticle] = useState<ArticleRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    const fetchArticle = async () => {
      const validCategory: ArticleRow["category"] | null =
        category === "education_research" || category === "news_events" || category === "philanthropy"
          ? category
          : null;
      if (!articleKey || !validCategory) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const lookupColumn = UUID_PATTERN.test(articleKey) ? "id" : "slug";
      let data: ArticleRow | null = null;
      let fetchError: Error | null = null;

      try {
        const response = await fetch("/published-articles.json");
        if (response.ok) {
          const publishedArticles = await response.json() as ArticleRow[];
          data = publishedArticles.find((candidate) =>
            candidate.category === validCategory
            && (lookupColumn === "id"
              ? candidate.id === articleKey
              : normalizeArticleSlug(candidate.slug) === articleKey)
          ) || null;
        }
      } catch {
        // The live Supabase query below remains the runtime fallback.
      }

      if (!data) {
        const liveResult = await supabase
          .from("articles")
          .select("*")
          .eq("category", validCategory)
          .eq("published", true);
        fetchError = liveResult.error;
        data = liveResult.data?.find((candidate) =>
          lookupColumn === "id"
            ? candidate.id === articleKey
            : normalizeArticleSlug(candidate.slug) === articleKey
        ) || null;
      }

      if (fetchError) {
        console.error("Error fetching article:", fetchError);
        setArticle(null);
      } else {
        setArticle(data);
        if (data && UUID_PATTERN.test(articleKey) && data.slug) {
          navigate(`/${language}/articles/${data.category}/${data.slug}`, { replace: true });
        }
      }
      
      setLoading(false);
    };

    fetchArticle();
  }, [articleKey, category, language, navigate]);

  const getCategoryTitle = (cat: string) => {
    return cat === "education_research"
      ? t("nav.educationResearch")
      : cat === "philanthropy"
        ? t("nav.philanthropy")
        : t("nav.newsEvents");
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const handleZoomReset = () => setZoomLevel(1);

  const resetZoom = () => {
    setZoomLevel(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Loading..." description="Loading article" />
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-40 mb-8" />
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <SEO
          title="Article Not Found"
          description="The requested FOIHK article could not be found. Browse FOIHK education, news, philanthropy, media coverage, and family office resources from Hong Kong."
        />
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The article you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/">Return to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const localizedTitle = (getStrictLocalizedField(article, "title", language) || article.title)
    .replace(/\s+/g, " ")
    .trim();
  const localizedExcerpt = getStrictLocalizedField(article, "excerpt", language);
  const localizedContent = getStrictLocalizedField(article, "content", language);
  const plainContent = DOMPurify.sanitize(localizedContent, { ALLOWED_TAGS: [] }).replace(/\s+/g, " ").trim();
  const noindex = !getStrictLocalizedField(article, "title", language) || plainContent.length < 80;
  const indexableLanguages = (["en", "zh-hk", "zh-cn"] as Language[]).filter((candidateLanguage) => {
    const candidateTitle = getStrictLocalizedField(article, "title", candidateLanguage);
    const candidateContent = DOMPurify
      .sanitize(getStrictLocalizedField(article, "content", candidateLanguage), { ALLOWED_TAGS: [] })
      .replace(/\s+/g, " ")
      .trim();
    return Boolean(candidateTitle) && candidateContent.length >= 80;
  });
  const canonicalSlug = normalizeArticleSlug(article.slug);
  const articleUrl = `${ORGANIZATION_URL}/${language}/articles/${article.category}/${canonicalSlug}`;
  const publishedDate = article.published_at || article.created_at;
  const description = buildArticleMetaDescription(localizedTitle, localizedExcerpt, category, language);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": article.category === "news_events" ? "NewsArticle" : "Article",
    "headline": localizedTitle,
    "description": description,
    "inLanguage": language === "en" ? "en" : language === "zh-hk" ? "zh-Hant" : "zh-Hans",
    "articleSection": getCategoryTitle(article.category),
    "image": article.image_urls?.[0] ? [article.image_urls[0]] : undefined,
    "datePublished": publishedDate,
    "dateModified": article.updated_at,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    "author": {
      "@type": "Organization",
      "name": ORGANIZATION_ENGLISH_NAME,
      "legalName": ORGANIZATION_LEGAL_NAME,
      "alternateName": ORGANIZATION_ALTERNATE_NAMES,
      "url": ORGANIZATION_URL,
    },
    "publisher": {
      "@type": "Organization",
      "name": ORGANIZATION_ENGLISH_NAME,
      "legalName": ORGANIZATION_LEGAL_NAME,
      "alternateName": ORGANIZATION_ALTERNATE_NAMES,
      "url": ORGANIZATION_URL,
      "logo": {
        "@type": "ImageObject",
        "url": ORGANIZATION_LOGO,
      },
    },
  };
  const homeLabel = language === "en" ? "Home" : language === "zh-hk" ? "首頁" : "首页";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={localizedTitle}
        description={description}
        canonicalUrl={articleUrl}
        ogType="article"
        ogImage={article.image_urls?.[0]}
        noindex={noindex}
        alternateLanguages={indexableLanguages}
        structuredData={structuredData}
        breadcrumbs={[
          { name: homeLabel, url: `${ORGANIZATION_URL}/${language}` },
          { name: getCategoryTitle(article.category), url: `${ORGANIZATION_URL}/${language}/articles/${article.category}` },
          { name: localizedTitle, url: articleUrl },
        ]}
      />
      <Navigation />
      
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        <Breadcrumbs
          items={[
            { label: homeLabel, to: "/" },
            { label: getCategoryTitle(article.category), to: `/articles/${article.category}` },
            { label: localizedTitle },
          ]}
        />
        {/* Back Button */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/${language}/articles/${category}`)}
            className="group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            {t("articles.backToList")}
          </Button>
        </div>

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-4 mb-6 text-muted-foreground">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
              {category === "education_research" ? t("nav.educationResearch") : category === "philanthropy" ? t("nav.philanthropy") : t("nav.newsEvents")}
            </Badge>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <time dateTime={publishedDate}>
                {new Date(publishedDate).toLocaleDateString(language, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {localizedTitle}
          </h1>
          
          {localizedExcerpt && (
            <p className="text-xl text-muted-foreground mb-4">
              {localizedExcerpt}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {language === "en" ? "By FOIHK" : language === "zh-hk" ? "機構署名：FOIHK" : "机构署名：FOIHK"}
            </span>
            {article.updated_at !== publishedDate && (
              <span className="inline-flex items-center gap-2">
                <History className="h-4 w-4" />
                {language === "en" ? "Updated" : language === "zh-hk" ? "更新" : "更新"}{" "}
                <time dateTime={article.updated_at}>
                  {new Date(article.updated_at).toLocaleDateString(language, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </span>
            )}
          </div>
        </header>

        {/* Article Images Carousel */}
        {article.image_urls && article.image_urls.length > 0 && (
          <div className="mb-8">
            {article.image_urls.length === 1 ? (
              <Dialog open={selectedImage === article.image_urls[0]} onOpenChange={(open) => {
                if (!open) {
                  setSelectedImage(null);
                  resetZoom();
                }
              }}>
                <DialogTrigger asChild>
                  <div className="rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setSelectedImage(article.image_urls[0])}>
                    <img
                      src={article.image_urls[0]}
                      alt={localizedTitle}
                      className="w-full max-h-[600px] object-contain bg-muted rounded-lg"
                    />
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
                  <div className="absolute top-4 right-16 z-50 flex gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={handleZoomIn}
                      className="h-8 w-8"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={handleZoomOut}
                      className="h-8 w-8"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={handleZoomReset}
                      className="h-8 w-8"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                  <ScrollArea className="h-[90vh] w-full">
                    <img
                      src={article.image_urls[0]}
                      alt={localizedTitle}
                      className="w-full h-auto object-contain transition-transform duration-200"
                      style={{ transform: `scale(${zoomLevel})` }}
                    />
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            ) : (
              <Carousel 
                className="w-full"
                plugins={[
                  Autoplay({
                    delay: 3000,
                  }),
                ]}
              >
                <CarouselContent>
                  {article.image_urls.map((url: string, index: number) => (
                    <CarouselItem key={index}>
                      <Dialog open={selectedImage === url} onOpenChange={(open) => {
                        if (!open) {
                          setSelectedImage(null);
                          resetZoom();
                        }
                      }}>
                        <DialogTrigger asChild>
                          <div className="rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setSelectedImage(url)}>
                            <img
                              src={url}
                              alt={`${localizedTitle} - ${index + 1}`}
                              className="w-full max-h-[600px] object-contain bg-muted rounded-lg"
                            />
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
                          <div className="absolute top-4 right-16 z-50 flex gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-2">
                            <Button
                              size="icon"
                              variant="secondary"
                              onClick={handleZoomIn}
                              className="h-8 w-8"
                            >
                              <ZoomIn className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="secondary"
                              onClick={handleZoomOut}
                              className="h-8 w-8"
                            >
                              <ZoomOut className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="secondary"
                              onClick={handleZoomReset}
                              className="h-8 w-8"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </div>
                          <ScrollArea className="h-[90vh] w-full">
                            <img
                              src={url}
                              alt={`${localizedTitle} - ${index + 1}`}
                              className="w-full h-auto object-contain transition-transform duration-200"
                              style={{ transform: `scale(${zoomLevel})` }}
                            />
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </Carousel>
            )}
          </div>
        )}

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          <div className="text-foreground leading-relaxed overflow-x-auto" dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(localizedContent, {
              ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
              ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],
              ALLOW_DATA_ATTR: false
            })
          }} />
        </div>

        {/* Back to List Button */}
        <div className="mt-12 pt-8 border-t border-border">
          <Button
            asChild
            variant="outline"
          >
            <Link to={`/articles/${category || article.category}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("articles.backToList")}
            </Link>
          </Button>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default ArticleDetail;
