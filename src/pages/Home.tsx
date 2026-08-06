import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowRight, BookOpen, Calendar, ExternalLink, Users } from "lucide-react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { useState, useEffect } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Skeleton } from "@/components/ui/skeleton";
import heroImage from "@/assets/hero-hong-kong.webp";
import educationBg from "@/assets/education-research-bg.webp";
import eventsBg from "@/assets/news-events-bg.webp";
import communityBg from "@/assets/community-bg.webp";
import foundingChairman from "@/assets/founding-chairman.webp";
import foundingSecretary from "@/assets/founding-secretary.webp";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { getArticleCategoryPath, getLocalizedField, normalizeArticleSlug } from "@/lib/utils";
import { getModifiedDate, loadPublishedArticles } from "@/lib/articles";
import { SEO } from "@/components/SEO";
import {
  ORGANIZATION_ADDRESS,
  ORGANIZATION_ALTERNATE_NAMES,
  ORGANIZATION_CONTACT_POINT,
  ORGANIZATION_ENGLISH_NAME,
  ORGANIZATION_FOUNDING_DATE,
  ORGANIZATION_LEGAL_NAME,
  ORGANIZATION_LOGO,
  ORGANIZATION_SAME_AS,
  ORGANIZATION_URL,
} from "@/lib/schema";
import type { Tables } from "@/integrations/supabase/types";

type ArticleRow = Tables<"articles">;

const ECOSYSTEM_COPY = {
  en: {
    eyebrow: "By the numbers",
    title: "Hong Kong family offices by the numbers",
    summary: "Seven sourced market facts: four commissioned estimates reported by the Hong Kong Government and three measurements from the SFC's 1,316-firm survey.",
    checked: "Facts checked: 3 August 2026",
    scope: "Scope note: the first four figures are Deloitte estimates from an InvestHK-commissioned study; the public release does not disclose the latest model, sample or confidence interval. The final three cover Hong Kong's wider asset and wealth management business; the SFC survey included 1,316 firms but excluded self-managed entities, including single-family offices that may not require an SFC licence.",
    facts: [
      {
        statement: "InvestHK reported that more than 3,380 single-family offices were operating in Hong Kong at the end of 2025.",
        source: "InvestHK-commissioned Deloitte estimate, reported by the HKSAR Government on 10 February 2026",
        href: "https://www.info.gov.hk/gia/general/202602/10/P2026021000234.htm",
      },
      {
        statement: "The number of Hong Kong single-family offices increased by about 680 in two years, a rise of more than 25%, according to InvestHK.",
        source: "InvestHK-commissioned Deloitte estimate, reported by the HKSAR Government on 10 February 2026",
        href: "https://www.info.gov.hk/gia/general/202602/10/P2026021000234.htm",
      },
      {
        statement: "InvestHK estimates that Hong Kong single-family offices contribute approximately HK$12.6 billion each year through operating expenditure alone.",
        source: "InvestHK-commissioned Deloitte estimate, reported by the HKSAR Government on 10 February 2026",
        href: "https://www.info.gov.hk/gia/general/202602/10/P2026021000234.htm",
      },
      {
        statement: "InvestHK estimates that Hong Kong single-family offices directly employ more than 10,000 full-time professionals.",
        source: "InvestHK-commissioned Deloitte estimate, reported by the HKSAR Government on 10 February 2026",
        href: "https://www.info.gov.hk/gia/general/202602/10/P2026021000234.htm",
      },
      {
        statement: "The SFC reported that Hong Kong's asset and wealth management business held a record HK$42.2 trillion in assets under management at the end of 2025, up 20% year on year.",
        source: "SFC 2025 survey of 1,316 firms, published 2 July 2026",
        href: "https://apps.sfc.hk/edistributionWeb/gateway/EN/news-and-announcements/news/corporate-news/doc?refNo=26PR103",
      },
      {
        statement: "The SFC recorded HK$2.1 trillion in net fund inflows during 2025, a 193% year-on-year increase and the third consecutive annual rise.",
        source: "SFC 2025 survey of 1,316 firms, published 2 July 2026",
        href: "https://apps.sfc.hk/edistributionWeb/gateway/EN/news-and-announcements/news/corporate-news/doc?refNo=26PR103",
      },
      {
        statement: "The SFC reported HK$12.9 trillion in private banking and private wealth management assets at the end of 2025, up 24% year on year.",
        source: "SFC 2025 survey of 1,316 firms, published 2 July 2026",
        href: "https://apps.sfc.hk/edistributionWeb/gateway/EN/news-and-announcements/news/corporate-news/doc?refNo=26PR103",
      },
    ],
  },
  "zh-hk": {
    eyebrow: "數字概覽",
    title: "香港家族辦公室關鍵數據",
    summary: "以下七項市場事實包括香港政府公布的四項委託研究估算，以及證監會 1,316 家機構調查的三項結果。",
    checked: "資料核對日期：2026 年 8 月 3 日",
    scope: "統計口徑：首四項為投資推廣署委託 Deloitte 進行的估算，公開新聞稿未披露最新模型、樣本或置信區間。最後三項涵蓋香港整體資產及財富管理業務；證監會調查包括 1,316 家機構，但不包括可能毋須領牌的自管資產機構，例如單一家族辦公室。",
    facts: [
      {
        statement: "投資推廣署公布，截至 2025 年底，香港有超過 3,380 間單一家族辦公室正在營運。",
        source: "投資推廣署委託 Deloitte 估算；香港政府於 2026 年 2 月 10 日公布",
        href: "https://www.info.gov.hk/gia/general/202602/10/P2026021000234.htm",
      },
      {
        statement: "投資推廣署指出，香港單一家族辦公室數目在兩年間增加約 680 間，增幅超過 25%。",
        source: "投資推廣署委託 Deloitte 估算；香港政府於 2026 年 2 月 10 日公布",
        href: "https://www.info.gov.hk/gia/general/202602/10/P2026021000234.htm",
      },
      {
        statement: "投資推廣署估算，香港單一家族辦公室單計營運開支，每年為本地經濟帶來約 126 億港元貢獻。",
        source: "投資推廣署委託 Deloitte 估算；香港政府於 2026 年 2 月 10 日公布",
        href: "https://www.info.gov.hk/gia/general/202602/10/P2026021000234.htm",
      },
      {
        statement: "投資推廣署估算，香港單一家族辦公室在其營運中直接聘用超過 10,000 名全職專業人員。",
        source: "投資推廣署委託 Deloitte 估算；香港政府於 2026 年 2 月 10 日公布",
        href: "https://www.info.gov.hk/gia/general/202602/10/P2026021000234.htm",
      },
      {
        statement: "證監會公布，截至 2025 年底，香港資產及財富管理業務的管理資產總值創新高，達 42.2 萬億港元，按年上升 20%。",
        source: "證監會 1,316 家機構調查，2026 年 7 月 2 日發布",
        href: "https://apps.sfc.hk/edistributionWeb/api/news/list-content?lang=TC&refNo=26PR103",
      },
      {
        statement: "證監會錄得 2025 年淨資金流入 2.1 萬億港元，按年急升 193%，並連續第三年上升。",
        source: "證監會 1,316 家機構調查，2026 年 7 月 2 日發布",
        href: "https://apps.sfc.hk/edistributionWeb/api/news/list-content?lang=TC&refNo=26PR103",
      },
      {
        statement: "證監會公布，截至 2025 年底，私人銀行及私人財富管理業務的管理資產達 12.9 萬億港元，按年上升 24%。",
        source: "證監會 1,316 家機構調查，2026 年 7 月 2 日發布",
        href: "https://apps.sfc.hk/edistributionWeb/api/news/list-content?lang=TC&refNo=26PR103",
      },
    ],
  },
  "zh-cn": {
    eyebrow: "数字概览",
    title: "香港家族办公室关键数据",
    summary: "以下七项市场事实包括香港政府公布的四项委托研究估算，以及证监会 1,316 家机构调查的三项结果。",
    checked: "资料核对日期：2026 年 8 月 3 日",
    scope: "统计口径：前四项为投资推广署委托 Deloitte 进行的估算，公开新闻稿未披露最新模型、样本或置信区间。最后三项涵盖香港整体资产及财富管理业务；证监会调查包括 1,316 家机构，但不包括可能无需领牌的自管资产机构，例如单一家族办公室。",
    facts: [
      {
        statement: "投资推广署公布，截至 2025 年底，香港有超过 3,380 家单一家族办公室正在运营。",
        source: "投资推广署委托 Deloitte 估算；香港政府于 2026 年 2 月 10 日公布",
        href: "https://www.info.gov.hk/gia/general/202602/10/P2026021000234.htm",
      },
      {
        statement: "投资推广署指出，香港单一家族办公室数量在两年内增加约 680 家，增幅超过 25%。",
        source: "投资推广署委托 Deloitte 估算；香港政府于 2026 年 2 月 10 日公布",
        href: "https://www.info.gov.hk/gia/general/202602/10/P2026021000234.htm",
      },
      {
        statement: "投资推广署估算，香港单一家族办公室仅计算运营支出，每年为本地经济带来约 126 亿港元贡献。",
        source: "投资推广署委托 Deloitte 估算；香港政府于 2026 年 2 月 10 日公布",
        href: "https://www.info.gov.hk/gia/general/202602/10/P2026021000234.htm",
      },
      {
        statement: "投资推广署估算，香港单一家族办公室在其运营中直接雇用超过 10,000 名全职专业人员。",
        source: "投资推广署委托 Deloitte 估算；香港政府于 2026 年 2 月 10 日公布",
        href: "https://www.info.gov.hk/gia/general/202602/10/P2026021000234.htm",
      },
      {
        statement: "证监会公布，截至 2025 年底，香港资产及财富管理业务的管理资产总值创历史新高，达到 42.2 万亿港元，同比增长 20%。",
        source: "证监会 1,316 家机构调查，2026 年 7 月 2 日发布",
        href: "https://apps.sfc.hk/edistributionWeb/api/news/list-content?lang=TC&refNo=26PR103",
      },
      {
        statement: "证监会录得 2025 年净资金流入 2.1 万亿港元，同比增长 193%，并连续第三年增长。",
        source: "证监会 1,316 家机构调查，2026 年 7 月 2 日发布",
        href: "https://apps.sfc.hk/edistributionWeb/api/news/list-content?lang=TC&refNo=26PR103",
      },
      {
        statement: "证监会公布，截至 2025 年底，私人银行及私人财富管理业务的管理资产达到 12.9 万亿港元，同比增长 24%。",
        source: "证监会 1,316 家机构调查，2026 年 7 月 2 日发布",
        href: "https://apps.sfc.hk/edistributionWeb/api/news/list-content?lang=TC&refNo=26PR103",
      },
    ],
  },
} as const;

const SUMMARY_COPY = {
  en: {
    eyebrow: "TL;DR",
    title: "FOIHK in brief",
    items: [
      {
        title: "1. Core services and resources",
        body: "FOIHK publishes education, source-led research, and practical family office guides. It does not provide asset management, custody, financial products, or regulated professional advice through this website.",
        links: [{ label: "Education and research", to: "/articles/education-research" }, { label: "Read the FAQ", to: "/faq" }],
      },
      {
        title: "2. News and updates",
        body: "FOIHK uses its News and Events pages to publish event notices, institutional updates, and activity records. Each item should be read with its visible publication and update dates.",
        links: [{ label: "News and events", to: "/articles/news-events" }],
      },
      {
        title: "3. About and community",
        body: "FOIHK is a Hong Kong family office industry institution and professional community. The About and FAQ pages explain its identity, people, scope, and ways to participate.",
        links: [{ label: "About FOIHK", to: "/about" }, { label: "Read the FAQ", to: "/faq" }],
      },
    ],
  },
  "zh-hk": {
    eyebrow: "TL;DR",
    title: "FOIHK 摘要",
    items: [
      {
        title: "1. 核心服務與資源",
        body: "FOIHK 發布教育內容、以來源為本的研究和實用家辦指南。本網站不提供資產管理、託管、金融產品或受規管專業意見。",
        links: [{ label: "教育與研究", to: "/articles/education-research" }, { label: "閱讀常見問題", to: "/faq" }],
      },
      {
        title: "2. 新聞與更新",
        body: "FOIHK 透過新聞與活動頁發布活動通知、機構更新和活動紀錄。閱讀時應同時查看每項內容列明的發布及更新日期。",
        links: [{ label: "新聞與活動", to: "/articles/news-events" }],
      },
      {
        title: "3. 關於與社群",
        body: "FOIHK 是香港家族辦公室行業機構與專業社群。關於我們及常見問題頁說明其身份、人員、範圍和參與方式。",
        links: [{ label: "關於 FOIHK", to: "/about" }, { label: "閱讀常見問題", to: "/faq" }],
      },
    ],
  },
  "zh-cn": {
    eyebrow: "TL;DR",
    title: "FOIHK 摘要",
    items: [
      {
        title: "1. 核心服务与资源",
        body: "FOIHK 发布教育内容、以来源为本的研究和实用家办指南。本网站不提供资产管理、托管、金融产品或受监管专业意见。",
        links: [{ label: "教育与研究", to: "/articles/education-research" }, { label: "阅读常见问题", to: "/faq" }],
      },
      {
        title: "2. 新闻与更新",
        body: "FOIHK 通过新闻与活动页面发布活动通知、机构更新和活动记录。阅读时应同时查看每项内容列明的发布及更新日期。",
        links: [{ label: "新闻与活动", to: "/articles/news-events" }],
      },
      {
        title: "3. 关于与社群",
        body: "FOIHK 是香港家族办公室行业机构与专业社群。关于我们及常见问题页面说明其身份、人员、范围和参与方式。",
        links: [{ label: "关于 FOIHK", to: "/about" }, { label: "阅读常见问题", to: "/faq" }],
      },
    ],
  },
} as const;

const HOME_META = {
  en: {
    title: "FOIHK | Hong Kong Family Office Institute",
    description: "FOIHK is a Hong Kong family office industry institution and professional community for research, education, philanthropy, events, and cross-sector exchange.",
  },
  "zh-hk": {
    title: "FOIHK | 香港家族辦公室行業機構與專業社群",
    description: "香港家族辦公室學會是立足香港的家族辦公室行業機構與專業社群，推動研究、教育、慈善、活動及跨界交流。",
  },
  "zh-cn": {
    title: "FOIHK | 香港家族办公室行业机构与专业社群",
    description: "香港家族办公室学会是立足香港的家族办公室行业机构与专业社群，推动研究、教育、慈善、活动及跨界交流。",
  },
} as const;

const EXPERIENCE_COPY = {
  en: {
    date: "10 February 2026",
    scene: "Hong Kong had more than 3,380 single-family offices at the end of 2025.",
    insight: "",
    source: "Official government source",
  },
  "zh-hk": {
    date: "2026 年 2 月 10 日",
    scene: "截至 2025 年底，香港有超過 3,380 間單一家族辦公室。",
    insight: "",
    source: "政府官方來源",
  },
  "zh-cn": {
    date: "2026 年 2 月 10 日",
    scene: "截至 2025 年底，香港有超过 3,380 家单一家族办公室。",
    insight: "",
    source: "政府官方来源",
  },
} as const;

const HOME_UPDATED_DATE = "2026-08-04";

const Home = () => {
  const { t, language } = useLanguage();
  const [educationArticles, setEducationArticles] = useState<ArticleRow[]>([]);
  const [newsArticles, setNewsArticles] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Scroll animations for the three feature cards
  const card1 = useScrollAnimation(0.3);
  const card2 = useScrollAnimation(0.3);
  const card3 = useScrollAnimation(0.3);
  
  // Scroll animations for Education & Research section
  const educationHeader = useScrollAnimation(0.3);
  const educationCarousel = useScrollAnimation(0.3);
  
  // Scroll animations for News & Events section
  const newsHeader = useScrollAnimation(0.3);
  const newsList = useScrollAnimation(0.3);
  
  // Scroll animations for Leadership section
  const leadershipHeader = useScrollAnimation(0.3);
  const leadershipCards = useScrollAnimation(0.3);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      
      try {
        const [educationData, newsData] = await Promise.all([
          loadPublishedArticles("education_research", language),
          loadPublishedArticles("news_events", language),
        ]);
        setEducationArticles(educationData.slice(0, 5));
        setNewsArticles(newsData.slice(0, 5));
      } catch (error) {
        console.error("Error fetching home articles:", error);
      }
      setLoading(false);
    };

    fetchArticles();
  }, [language]);
  const ecosystem = ECOSYSTEM_COPY[language];
  const summary = SUMMARY_COPY[language];
  const homeMeta = HOME_META[language];
  const experience = EXPERIENCE_COPY[language];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={homeMeta.title}
        description={homeMeta.description}
        ogType="website"
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": `${ORGANIZATION_URL}/#organization`,
            "name": ORGANIZATION_ENGLISH_NAME,
            "alternateName": ORGANIZATION_ALTERNATE_NAMES,
            "legalName": ORGANIZATION_LEGAL_NAME,
            "url": ORGANIZATION_URL,
            "logo": {
              "@type": "ImageObject",
              "url": ORGANIZATION_LOGO,
            },
            "description": homeMeta.description,
            "foundingDate": ORGANIZATION_FOUNDING_DATE,
            "address": ORGANIZATION_ADDRESS,
            "areaServed": {
              "@type": "Place",
              "name": "Hong Kong"
            },
            "knowsLanguage": ["en", "zh-Hant", "zh-Hans"],
            "contactPoint": [ORGANIZATION_CONTACT_POINT],
            "sameAs": ORGANIZATION_SAME_AS
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${ORGANIZATION_URL}/#website`,
            "name": ORGANIZATION_ENGLISH_NAME,
            "url": `${ORGANIZATION_URL}/${language}`,
            "dateModified": HOME_UPDATED_DATE,
            "publisher": { "@id": `${ORGANIZATION_URL}/#organization` },
            "inLanguage": language === "en" ? "en" : language === "zh-hk" ? "zh-Hant" : "zh-Hans",
          },
        ]}
      />
      <Navigation />
      <main>
      
      {/* Hero Section */}
      <section className="relative flex h-[720px] items-center justify-center overflow-hidden sm:h-[600px]">
        <img
          src={heroImage}
          alt="Hong Kong skyline and Victoria Harbour"
          width="1920"
          height="1080"
          fetchpriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
        
        <div className="container relative z-10 mx-auto px-6 text-left text-primary-foreground sm:pl-12 md:pl-16">
          <h1 className="mb-4 text-4xl font-bold leading-tight animate-in fade-in slide-in-from-bottom-4 duration-1000 sm:mb-6 sm:text-5xl md:text-6xl">
            {t("home.heroTitle")}
          </h1>
          <div data-home-experience-opening className="mb-5 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 sm:mb-7">
            <p data-entity-definition className="text-lg leading-7 sm:text-xl sm:leading-8 md:text-2xl">
              {t("home.heroDescription")}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-primary-foreground/90 sm:mt-4 sm:text-base sm:leading-7 md:text-lg">
              <span data-experience-location="Hong Kong">
                <time dateTime="2026-02-10">{experience.date}</time>{language === "en" ? ". " : "，"}{experience.scene}
              </span>
              {experience.insight ? <> <span data-experience-insight>{experience.insight}</span></> : null}{" "}
              <a
                href="https://www.investhk.gov.hk/en/news/hong-kongs-single-family-offices-total-surpasses-3-380-injecting-over-10-billion-annually-into-local-economy/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold underline underline-offset-4"
              >
                {experience.source}<ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </p>
          </div>
          <Button 
            asChild 
            size="lg" 
            variant="hero"
            className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300"
          >
            <Link to="/articles/education-research">
              {t("home.exploreResources")} <ArrowRight className="ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <section hidden aria-hidden="true" id="home-summary" aria-labelledby="home-summary-title" className="border-b border-border bg-secondary/20 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <h2 id="home-summary-title" className="text-3xl font-bold text-foreground">{summary.title}</h2>
            <ol className="mt-8 grid border-y border-border lg:grid-cols-3">
              {summary.items.map((item, index) => (
                <li
                  key={item.title}
                  data-summary-item
                  className={`py-7 lg:px-8 ${index < summary.items.length - 1 ? "border-b lg:border-b-0 lg:border-r" : ""} ${index === 0 ? "lg:pl-0" : ""} ${index === summary.items.length - 1 ? "lg:pr-0" : ""} border-border`}
                >
                  <h3 className="mb-3 text-xl font-bold text-foreground">{item.title}</h3>
                  <p className="leading-7 text-muted-foreground">{item.body}</p>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                    {item.links.map((link) => (
                      <Link key={link.to} to={link.to} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                        {link.label}<ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section hidden id="hong-kong-family-office-statistics" aria-labelledby="ecosystem-statistics-title" className="border-b border-border bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-normal text-primary">{ecosystem.eyebrow}</p>
            <h2 id="ecosystem-statistics-title" className="mb-4 text-3xl font-bold text-foreground md:text-4xl">{ecosystem.title}</h2>
            <p className="max-w-3xl text-lg leading-8 text-muted-foreground">{ecosystem.summary}</p>
            <time dateTime="2026-08-03" className="mt-3 block text-sm font-medium text-foreground">{ecosystem.checked}</time>

            <ol className="mt-10 grid border-y border-border md:grid-cols-2">
              {ecosystem.facts.map((fact, index) => (
                <li
                  key={fact.statement}
                  data-quotable-fact
                  className={`py-7 md:px-8 ${index % 2 === 0 ? "md:border-r md:pl-0" : "md:pr-0"} ${index < ecosystem.facts.length - 2 ? "border-b" : index === ecosystem.facts.length - 2 ? "border-b md:border-b-0" : ""} border-border`}
                >
                  <p className="text-lg font-medium leading-8 text-foreground">{fact.statement}</p>
                  <a
                    href={fact.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-start gap-2 text-sm font-medium leading-6 text-primary hover:underline"
                  >
                    <span>{fact.source}</span>
                    <ExternalLink className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ol>

            <p data-statistics-scope className="mt-6 max-w-4xl text-sm leading-6 text-muted-foreground">{ecosystem.scope}</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t("home.whatWeOffer")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("home.whatWeOfferDesc")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card 
              ref={card1.elementRef}
              className={`border-border/50 shadow-elegant hover:shadow-glow transition-all duration-500 hover:-translate-y-2 overflow-hidden relative group ${
                card1.isVisible 
                  ? 'animate-in slide-in-from-bottom-8 fade-in duration-300' 
                  : 'opacity-0 translate-y-8'
              }`}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${educationBg})` }}
              >
                <div className="absolute inset-0 bg-background/85 group-hover:bg-background/80 transition-colors duration-500" />
              </div>
              <CardHeader className="relative z-10">
                <BookOpen className="h-12 w-12 text-accent mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6" />
                <CardTitle>{t("home.educationTitle")}</CardTitle>
                <CardDescription>
                  {t("home.educationDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <Button asChild variant="link" className="p-0 group/link">
                  <Link to="/articles/education-research">
                    {t("home.learnMore")} <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card 
              ref={card2.elementRef}
              className={`border-border/50 shadow-elegant hover:shadow-glow transition-all duration-500 hover:-translate-y-2 overflow-hidden relative group ${
                card2.isVisible 
                  ? 'animate-in slide-in-from-bottom-8 fade-in duration-300 delay-100' 
                  : 'opacity-0 translate-y-8'
              }`}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${eventsBg})` }}
              >
                <div className="absolute inset-0 bg-background/85 group-hover:bg-background/80 transition-colors duration-500" />
              </div>
              <CardHeader className="relative z-10">
                <Calendar className="h-12 w-12 text-accent mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6" />
                <CardTitle>{t("home.newsTitle")}</CardTitle>
                <CardDescription>
                  {t("home.newsDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <Button asChild variant="link" className="p-0 group/link">
                  <Link to="/articles/news-events">
                    {t("home.viewUpdates")} <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card 
              ref={card3.elementRef}
              className={`border-border/50 shadow-elegant hover:shadow-glow transition-all duration-500 hover:-translate-y-2 overflow-hidden relative group ${
                card3.isVisible 
                  ? 'animate-in slide-in-from-bottom-8 fade-in duration-300 delay-200' 
                  : 'opacity-0 translate-y-8'
              }`}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${communityBg})` }}
              >
                <div className="absolute inset-0 bg-background/85 group-hover:bg-background/80 transition-colors duration-500" />
              </div>
              <CardHeader className="relative z-10">
                <Users className="h-12 w-12 text-accent mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6" />
                <CardTitle>{t("home.communityTitle")}</CardTitle>
                <CardDescription>
                  {t("home.communityDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <Button asChild variant="link" className="p-0 group/link">
                  <Link to="/about">
                    {t("nav.about")} <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Education & Research Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4">
          <div 
            ref={educationHeader.elementRef}
            className={`text-center mb-12 ${
              educationHeader.isVisible 
                ? 'animate-in slide-in-from-left-8 fade-in duration-300' 
                : 'opacity-0 translate-x-[-2rem]'
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t("home.educationTitle")}
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              {t("home.educationDesc")}
            </p>
          </div>

          {loading ? (
            <div className="max-w-5xl mx-auto">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : educationArticles.length > 0 ? (
            <div
              ref={educationCarousel.elementRef}
              className={educationCarousel.isVisible 
                ? 'animate-in slide-in-from-right-8 fade-in duration-300' 
                : ''
              }
            >
              <Carousel 
                className="max-w-5xl mx-auto"
                plugins={[
                  Autoplay({
                    delay: 5000,
                  })
                ]}
              >
              <CarouselContent>
                {educationArticles.map((article) => (
                  <CarouselItem key={article.id}>
                    <Link to={`/articles/${getArticleCategoryPath(article.category)}/${normalizeArticleSlug(article.slug)}`}>
                      <Card className="border-white/20 bg-white/10 backdrop-blur hover:bg-white/20 hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-accent">
                        <CardContent className="p-8">
                          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-accent bg-accent/10 px-3 py-1 rounded-full mb-4">
                            {t("home.educationTitle")}
                          </span>
                          <h3 className="text-2xl font-bold text-white mb-4 leading-tight">
                            {getLocalizedField(article, 'title', language)}
                          </h3>
                          {getLocalizedField(article, 'excerpt', language) && (
                            <p className="text-white/75 mb-6 line-clamp-4 leading-relaxed">
                              {getLocalizedField(article, 'excerpt', language)}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-sm text-white/75">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(article.created_at).toLocaleDateString(language, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
                <CarouselPrevious className="text-white border-white/20 hover:bg-white/20" />
                <CarouselNext className="text-white border-white/20 hover:bg-white/20" />
              </Carousel>
            </div>
          ) : (
            <p className="text-center text-white/60">No articles available</p>
          )}
        </div>
      </section>

      {/* News & Events Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div 
            ref={newsHeader.elementRef}
            className={`text-center mb-12 ${
              newsHeader.isVisible 
                ? 'animate-in slide-in-from-top-8 fade-in duration-300' 
                : 'opacity-0 translate-y-[-2rem]'
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t("home.newsTitle")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("home.newsDesc")}
            </p>
          </div>

          {loading ? (
            <div className="max-w-4xl mx-auto space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : newsArticles.length > 0 ? (
            <div 
              ref={newsList.elementRef}
              className={`max-w-4xl mx-auto space-y-4 max-h-[600px] overflow-y-auto ${
                newsList.isVisible 
                  ? 'animate-in fade-in zoom-in-95 duration-300' 
                  : ''
              }`}
            >
              {newsArticles.map((article) => (
                <Link 
                  key={article.id} 
                  to={`/articles/${getArticleCategoryPath(article.category)}/${normalizeArticleSlug(article.slug)}`}
                  className="block"
                >
                  <Card className="border-border/50 shadow-sm hover:shadow-glow transition-all duration-300 hover:-translate-y-1">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-foreground mb-2">{getLocalizedField(article, 'title', language)}</h3>
                      {getLocalizedField(article, 'excerpt', language) && (
                        <p className="text-muted-foreground mb-3 line-clamp-2">{getLocalizedField(article, 'excerpt', language)}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {new Date(getModifiedDate(article)).toLocaleDateString(language, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No articles available</p>
          )}
        </div>
      </section>

      {/* Leadership Team Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div 
            ref={leadershipHeader.elementRef}
            className={`text-center mb-12 ${
              leadershipHeader.isVisible 
                ? 'animate-in slide-in-from-right-8 fade-in duration-300' 
                : 'opacity-0 translate-x-[2rem]'
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t("home.leadershipTitle")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("home.leadershipDesc")}
            </p>
          </div>
          
          {/* First Row - 2 members */}
          <div 
            ref={leadershipCards.elementRef}
            className={`grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-8 ${
              leadershipCards.isVisible 
                ? 'animate-in zoom-in-95 fade-in duration-300' 
                : 'opacity-0 scale-95'
            }`}
          >
            <Card className="border-border/50 shadow-elegant hover:shadow-glow transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6 text-center">
                <div className="w-64 h-80 mx-auto mb-4 rounded-lg overflow-hidden">
                  <img src={foundingChairman} alt="Lai King Man, Leo" width="256" height="320" loading="lazy" decoding="async" className="w-full h-full object-cover object-top" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-1">{t("home.chairmanName")}</h3>
                <p className="text-sm text-muted-foreground">{t("home.foundingChairman")}</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-elegant hover:shadow-glow transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6 text-center">
                <div className="w-64 h-80 mx-auto mb-4 rounded-lg overflow-hidden">
                  <img src={foundingSecretary} alt="Chan Man Ching" width="256" height="320" loading="lazy" decoding="async" className="w-full h-full object-cover object-top" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-1">{t("home.secretaryName")}</h3>
                <p className="text-sm text-muted-foreground">{t("home.foundingSecretary")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--accent)/0.08),transparent_50%)]" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("home.ctaTitle")}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t("home.ctaDesc")}
          </p>
          <Button asChild size="lg" variant="hero" className="shadow-elegant hover:shadow-glow transition-shadow duration-300">
            <Link to="/contact">{t("home.contactToday")}</Link>
          </Button>
        </div>
      </section>
      </main>

      {/* Footer */}
      <Footer lastUpdated={HOME_UPDATED_DATE} />
    </div>
  );
};

export default Home;
