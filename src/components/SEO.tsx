import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { useLanguage, Language } from "@/contexts/LanguageContext";

type StructuredData = Record<string, unknown>;

interface SEOProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  noindex?: boolean;
  structuredData?: StructuredData | StructuredData[];
  breadcrumbs?: { name: string; url: string }[];
  alternateLanguages?: Language[];
}

const SITE_NAME = "Family Office Institute Hong Kong";
const BASE_URL = "https://www.foihk.org";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;
const LANGUAGES: Language[] = ["en", "zh-hk", "zh-cn"];

export const SEO = ({
  title,
  description,
  canonicalUrl,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  noindex = false,
  structuredData,
  breadcrumbs,
  alternateLanguages = LANGUAGES,
}: SEOProps) => {
  const { language } = useLanguage();
  const location = useLocation();

  const fullTitle = title.includes("FOIHK") ? title : `${title} | FOIHK`;
  const currentPath = location.pathname.replace(/\/+$/, "") || "/";
  const requestedCanonical = canonicalUrl
    ? new URL(canonicalUrl, BASE_URL).pathname.replace(/\/+$/, "") || "/"
    : currentPath;
  const canonicalPath = requestedCanonical.startsWith(`/${language}`)
    ? requestedCanonical
    : currentPath.startsWith(`/${language}`)
      ? currentPath
      : `/${language}${requestedCanonical === "/" ? "" : requestedCanonical}`;
  const url = `${BASE_URL}${canonicalPath}`;

  const getAlternateUrl = (lang: Language) => {
    const localePattern = new RegExp(`^/(${LANGUAGES.join("|")})(?=/|$)`);
    if (localePattern.test(canonicalPath)) {
      return `${BASE_URL}${canonicalPath.replace(localePattern, `/${lang}`)}`;
    }
    return `${BASE_URL}/${lang}${canonicalPath === "/" ? "" : canonicalPath}`;
  };

  const breadcrumbLD = breadcrumbs
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((b, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "name": b.name,
          "item": b.url,
        })),
      }
    : null;

  const structuredDataItems = structuredData
    ? Array.isArray(structuredData)
      ? structuredData
      : [structuredData]
    : [];

  const htmlLang = language === "zh-hk" ? "zh-Hant" : language === "zh-cn" ? "zh-Hans" : "en";
  const ogLocale = language === "zh-hk" ? "zh_HK" : language === "zh-cn" ? "zh_CN" : "en_US";
  const ogLocaleAlternates = ["en_US", "zh_HK", "zh_CN"].filter((locale) => locale !== ogLocale);

  return (
    <Helmet>
      <html lang={htmlLang} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {!noindex && alternateLanguages.includes("en") && <link rel="alternate" hrefLang="en" href={getAlternateUrl("en")} />}
      {!noindex && alternateLanguages.includes("zh-hk") && <link rel="alternate" hrefLang="zh-HK" href={getAlternateUrl("zh-hk")} />}
      {!noindex && alternateLanguages.includes("zh-cn") && <link rel="alternate" hrefLang="zh-CN" href={getAlternateUrl("zh-cn")} />}
      {!noindex && alternateLanguages.length > 0 && (
        <link
          rel="alternate"
          hrefLang="x-default"
          href={getAlternateUrl(alternateLanguages.includes("en") ? "en" : alternateLanguages[0])}
        />
      )}
      <meta name="robots" content={noindex ? "noindex, follow" : "index, follow"} />

      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={ogLocale} />
      {ogLocaleAlternates.map((locale) => (
        <meta key={locale} property="og:locale:alternate" content={locale} />
      ))}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {structuredDataItems.map((item, index) => (
        <script key={`structured-data-${index}`} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}

      {breadcrumbLD && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbLD)}
        </script>
      )}
    </Helmet>
  );
};
