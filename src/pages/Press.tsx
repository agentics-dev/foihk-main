import { ExternalLink, Newspaper } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ORGANIZATION_ALTERNATE_NAMES,
  ORGANIZATION_ENGLISH_NAME,
  ORGANIZATION_URL,
} from "@/lib/schema";

const EDIGEST_ARTICLE_URL =
  "https://www.edigest.hk/%E6%8A%95%E8%B3%87/%E5%B0%81%E9%9D%A2%E6%95%85%E4%BA%8B-%E8%97%9D%E8%A1%93-%E5%AE%B6%E6%97%8F%E8%BE%A6%E5%85%AC%E5%AE%A4-%E6%8A%95%E8%B3%87%E8%97%9D%E8%A1%93%E5%93%81-3%E6%9C%88%E8%97%9D%E8%A1%93%E6%9C%88-1997853/";
const LINKEDIN_INTRO_URL =
  "https://www.linkedin.com/feed/update/urn:li:activity:7437801643586506752";
const LINKEDIN_EVENT_URL =
  "https://www.linkedin.com/posts/foihk-taichi-culturalexchange-ugcPost-7482278002886631424-AkDA/?utm_source=share&utm_medium=member_desktop&rcm=ACoAAB1yuYYBw8ksABJJSvdifS1QjBAYDJOzRio";
const WECHAT_EVENT_URLS = [
  "https://mp.weixin.qq.com/s/VwYFAqtyWEf2XQ8wkipPEg",
  "https://mp.weixin.qq.com/s/sPDaD5W_-QoY52eiu8pCHw",
  "https://mp.weixin.qq.com/s/FTv55slHwrx0oHeOmCDClg",
];

const organizationMention = {
  "@type": "Organization",
  "name": ORGANIZATION_ENGLISH_NAME,
  "alternateName": ORGANIZATION_ALTERNATE_NAMES,
  "url": ORGANIZATION_URL,
};

type PressItem = {
  title: string;
  description: string;
  url: string;
  source: string;
  datePublished?: string;
  structuredData: Record<string, unknown>;
};

const getPressItems = (t: (key: string) => string): PressItem[] => [
  {
    title: t("press.items.edigest.title"),
    description: t("press.items.edigest.description"),
    url: EDIGEST_ARTICLE_URL,
    source: "eDigest / 新傳媒集團",
    datePublished: "2026-03-30",
    structuredData: {
      "@type": "NewsArticle",
      "headline": t("press.items.edigest.title"),
      "description": t("press.items.edigest.description"),
      "inLanguage": "zh-HK",
      "datePublished": "2026-03-30",
      "author": {
        "@type": "Organization",
        "name": "eDigest",
      },
      "publisher": {
        "@type": "Organization",
        "name": "新傳媒集團",
        "alternateName": "New Media Group",
        "url": "https://www.edigest.hk",
      },
      "url": EDIGEST_ARTICLE_URL,
      "articleSection": "投資",
      "about": [
        {
          "@type": "Thing",
          "name": "藝術投資",
        },
        {
          "@type": "Thing",
          "name": "家族辦公室資產管理",
        },
      ],
      "mentions": [
        organizationMention,
        {
          "@type": "Person",
          "name": "賴敬文",
          "alternateName": "Leo Lai",
          "jobTitle": "創會主席",
          "worksFor": {
            "@type": "Organization",
            "name": ORGANIZATION_ENGLISH_NAME,
            "alternateName": ORGANIZATION_ALTERNATE_NAMES,
          },
        },
        {
          "@type": "Person",
          "name": "楊世衡",
          "alternateName": "Andy Yeung",
          "jobTitle": "理事",
          "worksFor": {
            "@type": "Organization",
            "name": ORGANIZATION_ENGLISH_NAME,
            "alternateName": ORGANIZATION_ALTERNATE_NAMES,
          },
        },
      ],
    },
  },
  {
    title: t("press.items.linkedinIntro.title"),
    description: t("press.items.linkedinIntro.description"),
    url: LINKEDIN_INTRO_URL,
    source: "LinkedIn",
    structuredData: {
      "@type": "SocialMediaPosting",
      "headline": t("press.items.linkedinIntro.title"),
      "description": t("press.items.linkedinIntro.description"),
      "inLanguage": "en",
      "url": LINKEDIN_INTRO_URL,
      "author": organizationMention,
      "publisher": {
        "@type": "Organization",
        "name": "LinkedIn",
        "url": "https://www.linkedin.com",
      },
      "about": [
        {
          "@type": "Thing",
          "name": "Family Office Institute Hong Kong",
        },
        {
          "@type": "Thing",
          "name": "Hong Kong SAR",
        },
      ],
      "mentions": [organizationMention],
    },
  },
  {
    title: t("press.items.taichi.title"),
    description: t("press.items.taichi.description"),
    url: LINKEDIN_EVENT_URL,
    source: "LinkedIn",
    structuredData: {
      "@type": "SocialMediaPosting",
      "headline": t("press.items.taichi.title"),
      "description": t("press.items.taichi.description"),
      "inLanguage": "en",
      "url": LINKEDIN_EVENT_URL,
      "author": organizationMention,
      "publisher": {
        "@type": "Organization",
        "name": "LinkedIn",
        "url": "https://www.linkedin.com",
      },
      "about": [
        {
          "@type": "Thing",
          "name": "Tai Chi",
        },
        {
          "@type": "Thing",
          "name": "Lions Clubs International",
        },
        {
          "@type": "Thing",
          "name": "World Record",
        },
      ],
      "mentions": [organizationMention],
    },
  },
  ...WECHAT_EVENT_URLS.map((url, index) => ({
    title: `${t("press.items.wechat.title")} ${index + 1}`,
    description: t("press.items.wechat.description"),
    url,
    source: "WeChat",
    structuredData: {
      "@type": "Article",
      "headline": `${t("press.items.wechat.title")} ${index + 1}`,
      "description": t("press.items.wechat.description"),
      "inLanguage": "zh-HK",
      "url": url,
      "publisher": {
        "@type": "Organization",
        "name": "WeChat",
        "url": "https://mp.weixin.qq.com",
      },
      "about": [
        {
          "@type": "Thing",
          "name": "Tai Chi",
        },
        {
          "@type": "Thing",
          "name": "Cultural Exchange",
        },
        {
          "@type": "Thing",
          "name": "World Record",
        },
      ],
      "mentions": [organizationMention],
    },
  })),
];

const getItemListStructuredData = (
  t: (key: string) => string,
  language: "en" | "zh-hk" | "zh-cn",
  url: string
) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": t("press.title"),
  "description": t("press.metaDescription"),
  "url": url,
  "inLanguage": language === "en" ? "en" : language === "zh-hk" ? "zh-Hant" : "zh-Hans",
  "itemListElement": getPressItems(t).map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "item": item.structuredData,
  })),
});

const Press = () => {
  const { language, t } = useLanguage();
  const pressUrl = `${ORGANIZATION_URL}/${language}/press`;
  const homeLabel = language === "en" ? "Home" : language === "zh-hk" ? "首頁" : "首页";
  const pressItems = getPressItems(t);
  const itemListStructuredData = getItemListStructuredData(t, language, pressUrl);

  const copy = {
    title: t("press.title"),
    description: t("press.description"),
    introTitle: t("press.introTitle"),
    introText: t("press.introText"),
    metaDescription: t("press.metaDescription"),
    sourceLabel: t("press.sourceLabel"),
    dateLabel: t("press.dateLabel"),
    readMore: t("press.readMore"),
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={copy.introTitle}
        description={copy.metaDescription}
        structuredData={itemListStructuredData}
        breadcrumbs={[
          { name: homeLabel, url: `${ORGANIZATION_URL}/${language}` },
          { name: copy.introTitle, url: pressUrl },
        ]}
      />
      <Navigation />

      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <Breadcrumbs items={[{ label: homeLabel, to: "/" }, { label: copy.introTitle }]} />
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Newspaper className="h-7 w-7" />
            </div>
            <h1 className="mb-4 text-4xl font-bold text-foreground">{copy.introTitle}</h1>
            <p className="mx-auto max-w-3xl text-lg text-muted-foreground">{copy.introText}</p>
          </div>

          <div className="space-y-6">
            {pressItems.map((item) => (
              <Card key={item.url} className="border-border/50 shadow-elegant">
                <CardHeader>
                  <CardTitle className="text-2xl leading-tight">{item.title}</CardTitle>
                  <CardDescription className="text-base leading-7">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                    <div>
                      <span className="font-semibold text-foreground">{copy.sourceLabel}:</span>{" "}
                      {item.source}
                    </div>
                    {item.datePublished && (
                      <div>
                        <span className="font-semibold text-foreground">{copy.dateLabel}:</span>{" "}
                        {item.datePublished}
                      </div>
                    )}
                  </div>

                  <p className="leading-7 text-foreground">{item.description}</p>

                  <Button asChild>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      {copy.readMore}
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Press;
