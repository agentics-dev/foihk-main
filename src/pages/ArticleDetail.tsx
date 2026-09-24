import { useEffect, useState } from "react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DOMPurify from "dompurify";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock3, ExternalLink, MapPin, RotateCcw, UserRound, Video, ZoomIn, ZoomOut } from "lucide-react";
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
import { loadPublishedArticle } from "@/lib/articles";
import { ArticleLoadError } from "@/components/ArticleLoadError";
import {
  buildArticleStructuredData,
  getArticleAuthor,
  getArticleEventDetails,
  getArticleImageAlt,
  getArticleMetaDescription,
  getArticleSeoTitle,
  type LocalizedFaqItem,
} from "@/lib/articleSeo";
import { meaningfulSchemaValue } from "@/lib/schemaBuilders";

const META_DESCRIPTION_MAX_LENGTH = 160;
const DEFAULT_ARTICLE_IMAGE = `${ORGANIZATION_URL}/og-image.png`;
const RESEARCH_BATCH_DATE = "2026-08-03";
const ARTICLE_META_LABELS: Record<Language, {
  published: string;
  updated: string;
  editorialPolicy: string;
}> = {
  en: {
    published: "Published",
    updated: "Updated",
    editorialPolicy: "Editorial policy",
  },
  "zh-hk": {
    published: "發布",
    updated: "更新",
    editorialPolicy: "編輯政策",
  },
  "zh-cn": {
    published: "发布",
    updated: "更新",
    editorialPolicy: "编辑政策",
  },
};

type ArticleRow = Tables<"articles"> & {
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

const ARTICLE_AUTHOR_LABELS: Record<Language, { by: string; credentials: string }> = {
  en: { by: "By", credentials: "Credentials" },
  "zh-hk": { by: "作者", credentials: "資歷" },
  "zh-cn": { by: "作者", credentials: "资历" },
};

const EVENT_LABELS: Record<Language, {
  title: string;
  when: string;
  previousDate: string;
  where: string;
  online: string;
  organizer: string;
  timezone: string;
  modes: Record<"offline" | "online" | "mixed", string>;
  statuses: Record<"scheduled" | "cancelled" | "postponed" | "rescheduled", string>;
}> = {
  en: {
    title: "Event details",
    when: "Date and time",
    previousDate: "Previous date",
    where: "Venue",
    online: "Join online",
    organizer: "Organizer",
    timezone: "Time zone",
    modes: { offline: "In person", online: "Online", mixed: "Hybrid" },
    statuses: { scheduled: "Scheduled", cancelled: "Cancelled", postponed: "Postponed", rescheduled: "Rescheduled" },
  },
  "zh-hk": {
    title: "活動詳情",
    when: "日期及時間",
    previousDate: "原定日期",
    where: "場地",
    online: "網上參加",
    organizer: "主辦方",
    timezone: "時區",
    modes: { offline: "線下", online: "線上", mixed: "混合" },
    statuses: { scheduled: "如期舉行", cancelled: "已取消", postponed: "已延期", rescheduled: "已改期" },
  },
  "zh-cn": {
    title: "活动详情",
    when: "日期及时间",
    previousDate: "原定日期",
    where: "场地",
    online: "在线参加",
    organizer: "主办方",
    timezone: "时区",
    modes: { offline: "线下", online: "线上", mixed: "混合" },
    statuses: { scheduled: "如期举行", cancelled: "已取消", postponed: "已延期", rescheduled: "已改期" },
  },
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

const getSafeHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
};

const formatEventDisplayDate = (date: string | null, time: string | null, language: Language) => {
  const normalizedDate = meaningfulSchemaValue(date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) return "";
  const parsedDate = new Date(`${normalizedDate}T00:00:00Z`);
  if (Number.isNaN(parsedDate.getTime())) return "";
  const dateLabel = parsedDate.toLocaleDateString(language, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  const normalizedTime = meaningfulSchemaValue(time);
  return /^\d{2}:\d{2}(?::\d{2})?$/.test(normalizedTime)
    ? `${dateLabel} · ${normalizedTime.slice(0, 5)}`
    : dateLabel;
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
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [faqItems, setFaqItems] = useState<Tables<"article_faq_items">[] | null>(null);

  useEffect(() => {
    let active = true;
    const fetchArticle = async () => {
      const validCategory = parseArticleCategory(category);
      if (!articleKey || !validCategory) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setFaqItems(null);
      setLoadError(false);
      setArticle(null);
      let data: ArticleRow | null = null;
      let fetchError: unknown = null;
      try { data = await loadPublishedArticle(validCategory, articleKey, language); }
      catch (error) { fetchError = error; }

      if (!active) return;
      if (fetchError) {
        console.error("Error fetching article:", fetchError);
        setArticle(null);
        setLoadError(true);
      } else {
        setArticle(data);
        if (data) {
          const faqResult = await supabase
            .from("article_faq_items")
            .select("*")
            .eq("article_id", data.id)
            .eq("enabled", true)
            .order("position", { ascending: true }).abortSignal(AbortSignal.timeout(10000));
          if (!active) return;
          if (!faqResult.error) {
            setFaqItems(faqResult.data || []);
          } else if (faqResult.error.code !== "42P01" && faqResult.error.code !== "PGRST205") {
            console.error("Error fetching article FAQ:", faqResult.error);
          }
        }
        if (data && articleKey !== normalizeArticleSlug(data.slug) && data.slug) {
          navigate(`/${language}/articles/${getArticleCategoryPath(data.category)}/${normalizeArticleSlug(data.slug)}`, { replace: true });
        }
      }
      
      setLoading(false);
    };

    fetchArticle();
    return () => { active = false; };
  }, [articleKey, category, language, navigate, retry]);

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

  if (loadError) return <><Navigation /><main className="container mx-auto py-12"><SEO title="Temporarily unavailable" description="Please retry loading the article." noindex /><ArticleLoadError onRetry={() => setRetry((value) => value + 1)} /></main></>;

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
  const localizedFaq = faqItems === null ? [] : tableFaq;
  const showArticleFaq = article.faq_show_on_page !== false;
  const visibleFaq = showArticleFaq ? localizedFaq : [];
  const author = getArticleAuthor(article, language);
  const eventDetails = getArticleEventDetails(article, language);
  const eventLabels = EVENT_LABELS[language];
  const eventStartLabel = formatEventDisplayDate(eventDetails.startDate, eventDetails.startTime, language);
  const eventEndLabel = formatEventDisplayDate(eventDetails.endDate, eventDetails.endTime, language);
  const previousStartLabel = eventDetails.status === "rescheduled"
    ? formatEventDisplayDate(eventDetails.previousStartDate, eventDetails.previousStartTime, language)
    : "";
  const eventOnlineUrl = getSafeHttpUrl(meaningfulSchemaValue(eventDetails.onlineUrl));
  const eventOrganizerUrl = getSafeHttpUrl(meaningfulSchemaValue(eventDetails.organizerUrl));
  const eventVenueName = meaningfulSchemaValue(eventDetails.venueName);
  const eventAddress = meaningfulSchemaValue(eventDetails.address);
  const eventOrganizerName = meaningfulSchemaValue(eventDetails.organizerName);
  const showEventDetails = eventDetails.enabled && Boolean(
    eventStartLabel
    || eventEndLabel
    || eventVenueName
    || eventAddress
    || eventOnlineUrl
    || eventOrganizerName
    || eventDetails.attendanceMode
    || eventDetails.status
  );
  const { articleSchema, personSchema, faqSchema, eventSchema } = buildArticleStructuredData({
    article,
    language,
    headline: localizedTitle,
    description,
    articleSection: getCategoryTitle(article.category),
    image: primaryImage,
    plainContent,
    citations: citationUrls,
    faq: visibleFaq,
  });
  const structuredData = [articleSchema, personSchema, faqSchema, eventSchema]
    .filter(Boolean) as Record<string, unknown>[];
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
        structuredData={structuredData}
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
                  day: 'numeric',
                  timeZone: 'Asia/Hong_Kong'
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

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            {author ? (
              <div data-article-author className="flex items-start gap-2">
                <UserRound className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                  <p><span>{ARTICLE_AUTHOR_LABELS[language].by}</span> <strong className="font-semibold text-foreground">{author.name}</strong>{author.title ? ` · ${author.title}` : ""}</p>
                  {author.credential && <p className="mt-1">{ARTICLE_AUTHOR_LABELS[language].credentials}: {author.credential}</p>}
                </div>
              </div>
            ) : null}
          </div>
        </header>

        {showEventDetails && (
          <section data-event-details aria-labelledby="article-event-details" className="mb-10 rounded-xl border border-border bg-secondary/20 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="article-event-details" className="text-2xl font-bold text-foreground">{eventLabels.title}</h2>
              <div className="flex flex-wrap gap-2">
                {eventDetails.attendanceMode && <Badge variant="secondary">{eventLabels.modes[eventDetails.attendanceMode]}</Badge>}
                {eventDetails.status && <Badge variant={eventDetails.status === "cancelled" ? "destructive" : "outline"}>{eventLabels.statuses[eventDetails.status]}</Badge>}
              </div>
            </div>

            <dl className="mt-5 grid min-w-0 gap-5 sm:grid-cols-2">
              {(eventStartLabel || eventEndLabel) && (
                <div className="flex min-w-0 gap-3">
                  <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0">
                    <dt className="font-semibold text-foreground">{eventLabels.when}</dt>
                    <dd className="mt-1 break-words text-muted-foreground">
                      {eventStartLabel}{eventEndLabel ? ` — ${eventEndLabel}` : ""}
                    </dd>
                    {meaningfulSchemaValue(eventDetails.timezone) && <dd className="mt-1 text-xs text-muted-foreground">{eventLabels.timezone}: {eventDetails.timezone}</dd>}
                    {previousStartLabel && <dd className="mt-1 text-xs text-muted-foreground">{eventLabels.previousDate}: {previousStartLabel}</dd>}
                  </div>
                </div>
              )}

              {(eventVenueName || eventAddress) && (
                <div className="flex min-w-0 gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0">
                    <dt className="font-semibold text-foreground">{eventLabels.where}</dt>
                    <dd className="mt-1 break-words text-muted-foreground">{eventVenueName}{eventVenueName && eventAddress ? ", " : ""}{eventAddress}</dd>
                  </div>
                </div>
              )}

              {eventOnlineUrl && (
                <div className="flex min-w-0 gap-3">
                  <Video className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0">
                    <dt className="font-semibold text-foreground">{eventLabels.online}</dt>
                    <dd className="mt-1 break-all">
                      <a href={eventOnlineUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-4 hover:underline">{eventOnlineUrl}</a>
                    </dd>
                  </div>
                </div>
              )}

              {(eventOrganizerName || eventOrganizerUrl) && (
                <div className="flex min-w-0 gap-3">
                  <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0">
                    <dt className="font-semibold text-foreground">{eventLabels.organizer}</dt>
                    <dd className="mt-1 break-words text-muted-foreground">
                      {eventOrganizerUrl ? <a href={eventOrganizerUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-4 hover:underline">{eventOrganizerName || eventOrganizerUrl}</a> : eventOrganizerName}
                    </dd>
                  </div>
                </div>
              )}
            </dl>
          </section>
        )}

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
                      loading="eager"
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
        <div
          className={`foihk-article-content overflow-x-auto ${isResearchBatchArticle ? "foihk-article-content-research" : ""}`}
          dangerouslySetInnerHTML={{ __html: renderedContent }}
        />

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

        {visibleFaq.length > 0 && (
          <section aria-labelledby="article-questions" className="mt-12 border-t border-border pt-8">
            <h2 id="article-questions" className="mb-6 text-2xl font-bold">
              {language === "en" ? "Questions about this guide" : language === "zh-hk" ? "本指南相關問題" : "本指南相关问题"}
            </h2>
            <Accordion type="multiple" className="border-y border-border">
              {visibleFaq.map((item, index) => (
                <AccordionItem key={`${item.question}-${index}`} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left text-lg">{item.question}</AccordionTrigger>
                  <AccordionContent>
                    <div className="foihk-article-content text-muted-foreground" dangerouslySetInnerHTML={{ __html: item.answer }} />
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
