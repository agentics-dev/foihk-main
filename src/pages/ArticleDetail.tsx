import { useEffect, useState } from "react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DOMPurify from "dompurify";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, Calendar, ExternalLink, History, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import {
  getArticleCategoryPath,
  getStrictLocalizedField,
  normalizeArticleSlug,
  optimizeArticleImageUrl,
  parseArticleCategory,
} from "@/lib/utils";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Autoplay from "embla-carousel-autoplay";
import { ORGANIZATION_URL } from "@/lib/schema";
import { sanitizeArticleHtml } from "@/lib/articleHtml";
import { getModifiedDate, getPublishedDate } from "@/lib/articles";
import {
  buildArticleStructuredData,
  getArticleImageAlt,
  getArticleMetaDescription,
  getArticleSeoTitle,
  type LocalizedFaqItem,
} from "@/lib/articleSeo";

const META_DESCRIPTION_MAX_LENGTH = 160;
const DEFAULT_ARTICLE_IMAGE = `${ORGANIZATION_URL}/og-image.png`;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RESEARCH_BATCH_DATE = "2026-08-03";
interface ArticleFAQ {
  question: string;
  answer: string;
}

const ARTICLE_META_LABELS: Record<Language, {
  author: string;
  published: string;
  updated: string;
  editorialPolicy: string;
}> = {
  en: {
    author: "By the FOIHK Editorial Team",
    published: "Published",
    updated: "Updated",
    editorialPolicy: "Editorial policy",
  },
  "zh-hk": {
    author: "機構署名：FOIHK 編輯團隊",
    published: "發布",
    updated: "更新",
    editorialPolicy: "編輯政策",
  },
  "zh-cn": {
    author: "机构署名：FOIHK 编辑团队",
    published: "发布",
    updated: "更新",
    editorialPolicy: "编辑政策",
  },
};

type ArticleRow = Tables<"articles"> & {
  faq?: ArticleFAQ[];
  faq_zhtw?: ArticleFAQ[];
  faq_zhcn?: ArticleFAQ[];
  static_content?: boolean;
  experience_date?: string;
  experience_location?: string;
  experience_location_zhtw?: string;
  experience_location_zhcn?: string;
  experience_opening?: string;
  experience_opening_zhtw?: string;
  experience_opening_zhcn?: string;
  experience_insight?: string;
  experience_insight_zhtw?: string;
  experience_insight_zhcn?: string;
  experience_source_url?: string;
  experience_source_label?: string;
  experience_source_label_zhtw?: string;
  experience_source_label_zhcn?: string;
};

const EXPERIENCE_LABELS: Record<Language, {
  scene: string;
  insight: string;
  source: string;
  boundary: string;
}> = {
  en: {
    scene: "Documented scene",
    insight: "Institutional insight",
    source: "Primary source",
    boundary: "Evidence boundary: this opening is based on an official institutional record and does not claim a personal first-hand account.",
  },
  "zh-hk": {
    scene: "有據可查的場景",
    insight: "機構觀察",
    source: "第一手來源",
    boundary: "證據界線：本開場以官方機構紀錄為依據，不聲稱是任何個人的第一身經歷。",
  },
  "zh-cn": {
    scene: "有据可查的场景",
    insight: "机构观察",
    source: "第一手来源",
    boundary: "证据界线：本开场以官方机构记录为依据，不声称是任何个人的第一人称经历。",
  },
};

const prepareArticleHtml = (content: string, imageAlt: string) => {
  return sanitizeArticleHtml(content, imageAlt);
};

const getCitationUrls = (content: string) => {
  const documentFragment = new DOMParser().parseFromString(content, "text/html");
  return [...new Set(
    [...documentFragment.querySelectorAll<HTMLAnchorElement>('a[href^="http"]')]
      .map((link) => link.href)
      .filter((url) => !url.startsWith(ORGANIZATION_URL))
  )];
};

const getLocalizedExperienceField = (
  article: ArticleRow,
  field: "experience_location" | "experience_opening" | "experience_insight" | "experience_source_label",
  language: Language
) => {
  const suffix = language === "zh-hk" ? "_zhtw" : language === "zh-cn" ? "_zhcn" : "";
  return article[`${field}${suffix}` as keyof ArticleRow] as string | undefined || article[field] || "";
};

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
  const [faqItems, setFaqItems] = useState<Tables<"article_faq_items">[] | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      const validCategory = parseArticleCategory(category);
      if (!articleKey || !validCategory) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setFaqItems(null);
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
        if (data) {
          const faqResult = await supabase
            .from("article_faq_items")
            .select("*")
            .eq("article_id", data.id)
            .eq("enabled", true)
            .order("position", { ascending: true });
          if (!faqResult.error) {
            setFaqItems(faqResult.data || []);
          } else if (faqResult.error.code !== "42P01" && faqResult.error.code !== "PGRST205") {
            console.error("Error fetching article FAQ:", faqResult.error);
          }
        }
        if (data && UUID_PATTERN.test(articleKey) && data.slug) {
          navigate(`/${language}/articles/${getArticleCategoryPath(data.category)}/${normalizeArticleSlug(data.slug)}`, { replace: true });
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
        <main className="container mx-auto px-4 py-12">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-40 mb-8" />
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </main>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <SEO
          title="Article Not Found"
          description="The requested FOIHK article could not be found. Browse FOIHK education, news, philanthropy, media coverage, and family office resources from Hong Kong."
          noindex
        />
        <Navigation />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The article you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/">Return to Home</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const localizedTitle = (getStrictLocalizedField(article, "title", language) || article.title)
    .replace(/\s+/g, " ")
    .trim();
  const localizedExcerpt = getStrictLocalizedField(article, "excerpt", language);
  const localizedContent = getStrictLocalizedField(article, "content", language);
  const renderedContent = prepareArticleHtml(localizedContent, localizedTitle);
  const experienceDate = article.experience_date || "";
  const experienceLocation = getLocalizedExperienceField(article, "experience_location", language);
  const experienceOpening = getLocalizedExperienceField(article, "experience_opening", language);
  const experienceInsight = getLocalizedExperienceField(article, "experience_insight", language);
  const experienceSourceLabel = getLocalizedExperienceField(article, "experience_source_label", language);
  const experienceSourceUrl = article.experience_source_url || "";
  const hasExperienceOpening = Boolean(
    experienceDate
    && experienceLocation
    && experienceOpening
    && experienceInsight
    && experienceSourceLabel
    && experienceSourceUrl
  );
  const plainContent = DOMPurify.sanitize(renderedContent, { ALLOWED_TAGS: [] }).replace(/\s+/g, " ").trim();
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
  const categoryPath = getArticleCategoryPath(article.category);
  const articleUrl = `${ORGANIZATION_URL}/${language}/articles/${categoryPath}/${canonicalSlug}`;
  const publishedDate = getPublishedDate(article);
  const updatedDate = getModifiedDate(article);
  const isResearchBatchArticle = article.category === "education_research" && publishedDate.startsWith(RESEARCH_BATCH_DATE);
  const configuredDescription = getArticleMetaDescription(article, language);
  const description = configuredDescription
    || buildArticleMetaDescription(localizedTitle, localizedExcerpt, article.category, language);
  const seoTitle = getArticleSeoTitle(article, language) || localizedTitle;
  const primaryImage = article.image_urls?.[0]
    ? new URL(optimizeArticleImageUrl(article.image_urls[0], 1600), ORGANIZATION_URL).href
    : DEFAULT_ARTICLE_IMAGE;
  const citationUrls = [...new Set([
    ...getCitationUrls(renderedContent),
    ...(hasExperienceOpening ? [experienceSourceUrl] : []),
  ])];
  const tableFaq = (faqItems || []).flatMap<LocalizedFaqItem>((item) => {
    const question = language === "zh-hk" ? item.question_zhtw : language === "zh-cn" ? item.question_zhcn : item.question;
    const answer = language === "zh-hk" ? item.answer_zhtw : language === "zh-cn" ? item.answer_zhcn : item.answer;
    return question.trim() && answer.trim()
      ? [{ question: question.trim(), answer: sanitizeArticleHtml(answer, question) }]
      : [];
  });
  const legacyFaq = language === "zh-hk"
    ? article.faq_zhtw || []
    : language === "zh-cn"
      ? article.faq_zhcn || []
      : article.faq || [];
  const localizedFaq = faqItems !== null
    ? tableFaq
    : legacyFaq
      .filter((item) => item.question?.trim() && item.answer?.trim())
      .map((item) => ({ question: item.question.trim(), answer: sanitizeArticleHtml(item.answer, item.question) }));
  const { articleSchema, faqSchema } = buildArticleStructuredData({
    article,
    language,
    headline: localizedTitle,
    description,
    articleSection: getCategoryTitle(article.category),
    image: primaryImage,
    plainContent,
    citations: citationUrls,
    faq: localizedFaq,
  });
  const homeLabel = language === "en" ? "Home" : language === "zh-hk" ? "首頁" : "首页";
  const metaLabels = ARTICLE_META_LABELS[language];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seoTitle}
        description={description}
        canonicalUrl={articleUrl}
        ogType="article"
        ogImage={primaryImage}
        noindex={noindex}
        alternateLanguages={indexableLanguages}
        structuredData={faqSchema ? [articleSchema, faqSchema] : articleSchema}
      />
      <Navigation />
      
      <main>
      <article className={`container mx-auto px-4 py-8 sm:py-12 ${isResearchBatchArticle ? "max-w-5xl" : "max-w-4xl"}`}>
        <Breadcrumbs
          items={[
            { label: homeLabel, to: "/" },
            { label: getCategoryTitle(article.category), to: `/articles/${categoryPath}` },
            { label: localizedTitle },
          ]}
        />
        {/* Back Button */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/${language}/articles/${categoryPath}`)}
            className="group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            {t("articles.backToList")}
          </Button>
        </div>

        {/* Article Header */}
        <header className={isResearchBatchArticle ? "mb-10 border-b border-border pb-8" : "mb-8"}>
          <div className="flex flex-wrap items-center gap-4 mb-6 text-muted-foreground">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
              {article.category === "education_research" ? t("nav.educationResearch") : article.category === "philanthropy" ? t("nav.philanthropy") : t("nav.newsEvents")}
            </Badge>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <time dateTime={publishedDate}>
                {metaLabels.published}{" "}
                {new Date(publishedDate).toLocaleDateString(language, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            </div>
          </div>
          
          <h1 className="break-words text-3xl font-bold leading-tight text-foreground mb-4 sm:text-4xl lg:text-5xl">
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
              <span>{metaLabels.author}</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <History className="h-4 w-4" />
              {metaLabels.updated}{" "}
              <time dateTime={updatedDate}>
                {new Date(updatedDate).toLocaleDateString(language, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </span>
          </div>
        </header>

        {hasExperienceOpening && (
          <blockquote
            data-experience-opening
            className="mb-10 mt-8 border-l-4 border-primary bg-secondary/30 py-6 pl-5 pr-14 text-foreground sm:px-7"
          >
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              {EXPERIENCE_LABELS[language].scene} · <time dateTime={experienceDate}>{experienceDate}</time> · <span data-experience-location>{experienceLocation}</span>
            </p>
            <p className="mt-4 text-lg leading-8">{experienceOpening}</p>
            <p data-experience-insight className="mt-4 leading-7">
              <strong>{EXPERIENCE_LABELS[language].insight}:</strong> {experienceInsight}
            </p>
            <div className="mt-5 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
              <a
                data-experience-source
                href={experienceSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline"
              >
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                {EXPERIENCE_LABELS[language].source}: {experienceSourceLabel}
              </a>
              <span data-experience-boundary className="max-w-xl text-muted-foreground">{EXPERIENCE_LABELS[language].boundary}</span>
            </div>
          </blockquote>
        )}

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
                      src={primaryImage}
                      alt={getArticleImageAlt(article, article.image_urls[0], language, localizedTitle)}
                      width="1600"
                      height="900"
                      decoding="async"
                      fetchpriority="high"
                      onError={(event) => { event.currentTarget.src = "/og-image.png"; }}
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
                      src={optimizeArticleImageUrl(article.image_urls[0], 2000)}
                      alt={getArticleImageAlt(article, article.image_urls[0], language, localizedTitle)}
                      width="2000"
                      height="1125"
                      decoding="async"
                      onError={(event) => { event.currentTarget.src = "/og-image.png"; }}
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
                              src={optimizeArticleImageUrl(url, 1600)}
                              alt={getArticleImageAlt(article, url, language, `${localizedTitle} - ${index + 1}`)}
                              width="1600"
                              height="900"
                              loading={index === 0 ? "eager" : "lazy"}
                              decoding="async"
                              onError={(event) => { event.currentTarget.src = "/og-image.png"; }}
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
                              src={optimizeArticleImageUrl(url, 2000)}
                              alt={getArticleImageAlt(article, url, language, `${localizedTitle} - ${index + 1}`)}
                              width="2000"
                              height="1125"
                              decoding="async"
                              onError={(event) => { event.currentTarget.src = "/og-image.png"; }}
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
        <div className={`prose max-w-none ${isResearchBatchArticle ? "prose-lg prose-headings:scroll-mt-24 prose-h2:mt-14 prose-h2:mb-5 prose-h2:border-t prose-h2:border-border prose-h2:pt-10 prose-h3:mt-9 prose-p:my-6 prose-p:leading-8 prose-li:my-2 prose-table:my-8" : "prose-lg"}`}>
          <div className="text-foreground leading-relaxed overflow-x-auto" dangerouslySetInnerHTML={{ __html: renderedContent }} />
        </div>

        {article.category === "education_research" && (
	          <aside aria-labelledby="related-guides" className="mt-12 border-t border-border pt-8">
	            <h2 id="related-guides" className="mb-4 text-2xl font-bold">
	              {language === "en" ? "Related family office guides" : language === "zh-hk" ? "相關家族辦公室指南" : "相关家族办公室指南"}
	            </h2>
	            <ul className="grid gap-3 sm:grid-cols-2">
	              <li><Link className="text-primary underline-offset-4 hover:underline" to="/articles/education-research">{language === "en" ? "Education and research articles" : language === "zh-hk" ? "教育與研究文章" : "教育与研究文章"}</Link></li>
	              <li><Link className="text-primary underline-offset-4 hover:underline" to="/faq">{language === "en" ? "Family office FAQ" : language === "zh-hk" ? "家族辦公室常見問題" : "家族办公室常见问题"}</Link></li>
	            </ul>
	          </aside>
        )}

        {localizedFaq.length > 0 && (
          <section aria-labelledby="article-questions" className="mt-12 border-t border-border pt-8">
            <h2 id="article-questions" className="mb-6 text-2xl font-bold">
              {language === "en" ? "Questions about this guide" : language === "zh-hk" ? "本指南相關問題" : "本指南相关问题"}
            </h2>
            <Accordion type="multiple" className="border-y border-border">
              {localizedFaq.map((item, index) => (
                <AccordionItem key={`${item.question}-${index}`} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left text-lg">{item.question}</AccordionTrigger>
                  <AccordionContent>
                    <div
                      className="prose max-w-none text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: item.answer }}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}

        {/* Back to List Button */}
        <div className="mt-12 pt-8 border-t border-border">
          <Button
            asChild
            variant="outline"
          >
            <Link to={`/articles/${categoryPath}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("articles.backToList")}
            </Link>
          </Button>
        </div>
      </article>
      </main>

      <Footer lastUpdated={updatedDate} />
    </div>
  );
};

export default ArticleDetail;
