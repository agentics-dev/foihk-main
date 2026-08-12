import type { Language } from "@/contexts/LanguageContext";
import type { Tables } from "@/integrations/supabase/types";
import { getModifiedDate, getPublishedDate } from "@/lib/articles";
import { getArticleCategoryPath, getStrictLocalizedField, normalizeArticleSlug } from "@/lib/utils";
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
    "author": {
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

  const faqSchema = faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    "url": url,
    "inLanguage": schemaLanguage,
    "mainEntity": faq.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": { "@type": "Answer", "text": item.answer },
    })),
  } : null;

  return { articleSchema, faqSchema, url, publishedDate, updatedDate };
};
