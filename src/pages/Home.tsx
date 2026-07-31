import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowRight, BookOpen, Calendar, ExternalLink, Users } from "lucide-react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Skeleton } from "@/components/ui/skeleton";
import heroImage from "@/assets/hero-hong-kong.jpg";
import educationBg from "@/assets/education-research-bg.jpg";
import eventsBg from "@/assets/news-events-bg.jpg";
import communityBg from "@/assets/community-bg.jpg";
import foundingChairman from "@/assets/founding-chairman.png";
import foundingSecretary from "@/assets/founding-secretary.png";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { getLocalizedField, normalizeArticleSlug } from "@/lib/utils";
import { SEO } from "@/components/SEO";
import {
  ORGANIZATION_ADDRESS,
  ORGANIZATION_ALTERNATE_NAMES,
  ORGANIZATION_CONTACT_POINT,
  ORGANIZATION_ENGLISH_NAME,
  ORGANIZATION_FOUNDING_DATE,
  ORGANIZATION_LEGAL_NAME,
  ORGANIZATION_LOGO,
  ORGANIZATION_URL,
} from "@/lib/schema";
import type { Tables } from "@/integrations/supabase/types";

type ArticleRow = Tables<"articles">;

const ECOSYSTEM_COPY = {
  en: {
    title: "Hong Kong family office ecosystem at a glance",
    summary: "Official Hong Kong Government data shows a large and economically significant single-family office ecosystem in the city.",
    labels: ["Single-family offices", "Annual operating contribution", "Jobs supported"],
    values: ["Over 3,380", "About HK$12.6B", "Over 10,000"],
    source: "Source: Invest Hong Kong, published 10 February 2026",
  },
  "zh-hk": {
    title: "香港家族辦公室生態概覽",
    summary: "香港政府官方數據顯示，本港已形成具規模並帶來顯著經濟貢獻的單一家族辦公室生態。",
    labels: ["單一家族辦公室", "每年營運貢獻", "支持職位"],
    values: ["超過 3,380 間", "約 126 億港元", "超過 10,000 個"],
    source: "資料來源：投資推廣署，2026 年 2 月 10 日發布",
  },
  "zh-cn": {
    title: "香港家族办公室生态概览",
    summary: "香港政府官方数据显示，本港已形成具规模并带来显著经济贡献的单一家族办公室生态。",
    labels: ["单一家族办公室", "每年运营贡献", "支持职位"],
    values: ["超过 3,380 家", "约 126 亿港元", "超过 10,000 个"],
    source: "资料来源：投资推广署，2026 年 2 月 10 日发布",
  },
} as const;

const HOME_META = {
  en: {
    title: "FOIHK | Hong Kong Family Office Institute & Professional Community",
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
      
      // Fetch Education & Research articles
      const { data: educationData } = await supabase
        .from("articles")
        .select("*")
        .eq("category", "education_research")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch News & Events articles
      const { data: newsData } = await supabase
        .from("articles")
        .select("*")
        .eq("category", "news_events")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(5);

      setEducationArticles(educationData || []);
      setNewsArticles(newsData || []);
      setLoading(false);
    };

    fetchArticles();
  }, []);
  const ecosystem = ECOSYSTEM_COPY[language];
  const homeMeta = HOME_META[language];

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
            "sameAs": ["https://www.linkedin.com/company/foihk"]
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${ORGANIZATION_URL}/#website`,
            "name": ORGANIZATION_ENGLISH_NAME,
            "url": `${ORGANIZATION_URL}/${language}`,
            "publisher": { "@id": `${ORGANIZATION_URL}/#organization` },
            "inLanguage": language === "en" ? "en" : language === "zh-hk" ? "zh-Hant" : "zh-Hans",
          },
        ]}
      />
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${heroImage})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 pl-12 md:pl-16 text-left text-primary-foreground">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {t("home.heroTitle")}
            {language === 'en' && (
              <>
                <br />
                {t("home.heroSubtitle")}
              </>
            )}
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            {t("home.heroDescription")}
          </p>
          <Button 
            asChild 
            size="lg" 
            variant="hero"
            className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300"
          >
            <Link to="/articles/education_research">
              {t("home.exploreResources")} <ArrowRight className="ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="border-b border-border bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">{ecosystem.title}</h2>
            <p className="max-w-3xl text-lg leading-8 text-muted-foreground">{ecosystem.summary}</p>
            <div className="my-10 grid gap-8 border-y border-border py-8 sm:grid-cols-3">
              {ecosystem.values.map((value, index) => (
                <div key={value}>
                  <p className="text-3xl font-bold text-primary">{value}</p>
                  <p className="mt-2 text-sm font-medium text-muted-foreground">{ecosystem.labels[index]}</p>
                </div>
              ))}
            </div>
            <a
              href="https://www.investhk.gov.hk/en/news/hong-kongs-single-family-offices-total-surpasses-3-380-injecting-over-10-billion-annually-into-local-economy/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              {ecosystem.source}
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
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
                  <Link to="/articles/education_research">
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
                  <Link to="/articles/news_events">
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
                    <Link to={`/articles/${article.category}/${normalizeArticleSlug(article.slug)}`}>
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
                          <div className="flex items-center gap-2 text-sm text-white/50">
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
                  to={`/articles/${article.category}/${normalizeArticleSlug(article.slug)}`}
                  className="block"
                >
                  <Card className="border-border/50 shadow-sm hover:shadow-glow transition-all duration-300 hover:-translate-y-1">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-foreground mb-2">{getLocalizedField(article, 'title', language)}</h3>
                      {getLocalizedField(article, 'excerpt', language) && (
                        <p className="text-muted-foreground mb-3 line-clamp-2">{getLocalizedField(article, 'excerpt', language)}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {new Date(article.created_at).toLocaleDateString(language, {
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
                  <img src={foundingChairman} alt="Lai King Man, Leo" className="w-full h-full object-cover object-top" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-1">{t("home.chairmanName")}</h3>
                <p className="text-sm text-muted-foreground">{t("home.foundingChairman")}</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-elegant hover:shadow-glow transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6 text-center">
                <div className="w-64 h-80 mx-auto mb-4 rounded-lg overflow-hidden">
                  <img src={foundingSecretary} alt="Chan Man Ching" className="w-full h-full object-cover object-top" />
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

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
