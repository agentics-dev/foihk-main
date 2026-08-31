import type { Language } from "@/contexts/LanguageContext";
import type { Tables } from "@/integrations/supabase/types";
import { getModifiedDate, getPublishedDate } from "@/lib/articles";
import { getArticleCategoryPath, getStrictLocalizedField, normalizeArticleSlug } from "@/lib/utils";
import {
  buildEventSchema,
  buildFaqPageSchema,
  getLocalizedSchemaValue,
  type EventAttendanceMode,
  type EventStatus,
} from "@/lib/schemaBuilders";
import {
  ORGANIZATION_ALTERNATE_NAMES,
  ORGANIZATION_CONTACT_POINT,
  ORGANIZATION_EMAIL,
  ORGANIZATION_ENGLISH_NAME,
  ORGANIZATION_LEGAL_NAME,
  ORGANIZATION_LOGO,
  ORGANIZATION_SAME_AS,
  ORGANIZATION_URL,
} from "@/lib/schema";

export interface LocalizedFaqItem {
  question: string;
  answer: string;
}

export type ArticleSeoRow = Tables<"articles">;

const getLocalizedArray = (article: ArticleSeoRow, field: string, language: Language) => {
  const record = article as unknown as Record<string, unknown>;
  const localizedField = language === "zh-hk" ? `${field}_zhtw` : language === "zh-cn" ? `${field}_zhcn` : field;
  const value = record[localizedField];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
};

export const getArticleSeoTitle = (article: ArticleSeoRow, language: Language) =>
  getStrictLocalizedField(article, "seo_title", language).trim()
  || getStrictLocalizedField(article, "title", language).trim();

export const getArticleMetaDescription = (article: ArticleSeoRow, language: Language) =>
  getStrictLocalizedField(article, "meta_description", language).trim()
  || getStrictLocalizedField(article, "excerpt", language).trim();

export const getArticleTopicTerms = (article: ArticleSeoRow, language: Language) =>
  getLocalizedArray(article, "topic_terms", language);

export const getArticleImageAlt = (
  article: ArticleSeoRow,
  imageUrl: string,
  language: Language,
  fallback: string,
) => {
  const metadata = article.image_metadata && typeof article.image_metadata === "object" && !Array.isArray(article.image_metadata)
    ? article.image_metadata as Record<string, unknown>
    : {};
  const entry = metadata[imageUrl];
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return fallback;
  const record = entry as Record<string, unknown>;
  const key = language === "zh-hk" ? "alt_zhtw" : language === "zh-cn" ? "alt_zhcn" : "alt";
  return typeof record[key] === "string" && record[key].trim() ? record[key].trim() : fallback;
};

export const getArticleAuthor = (article: ArticleSeoRow, language: Language) => {
  const record = article as unknown as Record<string, unknown>;
  const name = getLocalizedSchemaValue(record, "author_name", language);
  if (!name) return null;
  return {
    name,
    title: getLocalizedSchemaValue(record, "author_title", language),
    credential: getLocalizedSchemaValue(record, "author_credential", language),
  };
};

const EVENT_ATTENDANCE_MODES = new Set<EventAttendanceMode>(["offline", "online", "mixed"]);
const EVENT_STATUSES = new Set<EventStatus>(["scheduled", "cancelled", "postponed", "rescheduled"]);

export const getArticleEventDetails = (article: ArticleSeoRow, language: Language) => {
  const record = article as unknown as Record<string, unknown>;
  const attendanceMode = EVENT_ATTENDANCE_MODES.has(article.event_attendance_mode as EventAttendanceMode)
    ? article.event_attendance_mode as EventAttendanceMode
    : null;
  const status = EVENT_STATUSES.has(article.event_status as EventStatus)
    ? article.event_status as EventStatus
    : null;
  return {
    enabled: article.category === "news_events" && article.event_schema_enabled === true,
    attendanceMode,
    status,
    startDate: article.event_start_date,
    startTime: article.event_start_time,
    endDate: article.event_end_date,
    endTime: article.event_end_time,
    timezone: article.event_timezone || "Asia/Hong_Kong",
    previousStartDate: article.event_previous_start_date,
    previousStartTime: article.event_previous_start_time,
    venueName: getLocalizedSchemaValue(record, "event_venue_name", language),
    address: getLocalizedSchemaValue(record, "event_address", language),
    onlineUrl: article.event_online_url?.trim() || "",
    organizerName: getLocalizedSchemaValue(record, "event_organizer_name", language),
    organizerUrl: article.event_organizer_url?.trim() || "",
  };
};

export const buildArticleStructuredData = ({
  article,
  language,
  headline,
  description,
  articleSection,
  image,
  plainContent,
  citations,
  faq,
}: {
  article: ArticleSeoRow;
  language: Language;
  headline: string;
  description: string;
  articleSection: string;
  image: string;
  plainContent: string;
  citations: string[];
  faq: LocalizedFaqItem[];
}) => {
  const categoryPath = getArticleCategoryPath(article.category);
  const slug = normalizeArticleSlug(article.slug);
  const url = `${ORGANIZATION_URL}/${language}/articles/${categoryPath}/${slug}`;
  const publishedDate = getPublishedDate(article);
  const updatedDate = getModifiedDate(article);
  const terms = getArticleTopicTerms(article, language);
  const schemaLanguage = language === "en" ? "en" : language === "zh-hk" ? "zh-Hant" : "zh-Hans";
  const author = getArticleAuthor(article, language);

  const personSchema = author
    ? {
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": `${url}#author`,
        "name": author.name,
        "inLanguage": schemaLanguage,
        "jobTitle": author.title || undefined,
        "description": author.credential || undefined,
        "worksFor": { "@id": `${ORGANIZATION_URL}/#organization` },
      }
    : null;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": article.category === "news_events" ? "NewsArticle" : "Article",
    "@id": `${url}#article`,
    "headline": headline,
    "description": description,
    "inLanguage": schemaLanguage,
    "articleSection": articleSection,
    "image": [image],
    "datePublished": publishedDate,
    "dateModified": updatedDate,
    "isAccessibleForFree": true,
    "wordCount": language === "en" ? plainContent.split(/\s+/).filter(Boolean).length : plainContent.length,
    "keywords": terms.length > 0 ? terms.join(", ") : undefined,
    "about": terms.length > 0 ? terms.map((name) => ({ "@type": "Thing", "name": name })) : undefined,
    "citation": citations.length > 0 ? citations : undefined,
    "mainEntityOfPage": { "@type": "WebPage", "@id": url },
    "author": personSchema
      ? { "@id": personSchema["@id"] }
      : {
          "@type": "Organization",
          "@id": `${ORGANIZATION_URL}/#editorial-team`,
          "name": "FOIHK Editorial Team",
          "description": "The institutional editorial unit of Family Office Institute Hong Kong Limited.",
          "email": ORGANIZATION_EMAIL,
          "parentOrganization": { "@id": `${ORGANIZATION_URL}/#organization` },
        },
    "publisher": {
      "@type": "Organization",
      "@id": `${ORGANIZATION_URL}/#organization`,
      "name": ORGANIZATION_ENGLISH_NAME,
      "legalName": ORGANIZATION_LEGAL_NAME,
      "alternateName": ORGANIZATION_ALTERNATE_NAMES,
      "url": ORGANIZATION_URL,
      "contactPoint": ORGANIZATION_CONTACT_POINT,
      "sameAs": ORGANIZATION_SAME_AS,
      "logo": { "@type": "ImageObject", "url": ORGANIZATION_LOGO },
    },
  };

  const faqSchema = buildFaqPageSchema({
    url,
    language,
    enabled: article.faq_show_on_page !== false && article.faq_include_schema !== false,
    items: faq.map((item) => ({ ...item, enabled: true })),
  });

  const event = getArticleEventDetails(article, language);
  const eventName = getLocalizedSchemaValue(article as unknown as Record<string, unknown>, "title", language);
  const eventResult = buildEventSchema({
    enabled: event.enabled,
    category: article.category,
    language,
    url,
    name: eventName,
    description,
    image,
    attendanceMode: event.attendanceMode,
    startDate: event.startDate,
    startTime: event.startTime,
    endDate: event.endDate,
    endTime: event.endTime,
    timezone: event.timezone,
    venueName: event.venueName,
    address: event.address,
    onlineUrl: event.onlineUrl,
    organizerName: event.organizerName,
    organizerUrl: event.organizerUrl,
    status: event.status,
    previousStartDate: event.previousStartDate,
    previousStartTime: event.previousStartTime,
  });

  return {
    articleSchema,
    personSchema,
    faqSchema,
    eventSchema: eventResult.schema,
    eventMissingCore: eventResult.missingCore,
    eventWarnings: eventResult.warnings,
    url,
    publishedDate,
    updatedDate,
  };
};
