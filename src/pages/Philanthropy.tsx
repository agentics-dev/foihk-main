import { useEffect, useState } from "react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CroppedImage } from "@/components/CroppedImage";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { getLocalizedField, normalizeArticleSlug } from "@/lib/utils";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Heart, Handshake, BookOpen, Globe, Lightbulb, ArrowRight, Calendar, Search } from "lucide-react";
import communityBg from "@/assets/community-bg.webp";
import {
  ORGANIZATION_ENGLISH_NAME,
  ORGANIZATION_LEGAL_NAME,
  ORGANIZATION_URL,
} from "@/lib/schema";
import type { Tables } from "@/integrations/supabase/types";
import { loadPublishedArticles } from "@/lib/articles";

type ArticleRow = Tables<"articles">;

const Philanthropy = () => {
  const { t, language } = useLanguage();
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  const titleAnim = useScrollAnimation(0.3);
  const descriptionAnim = useScrollAnimation(0.3);
  const missionAnim = useScrollAnimation(0.3);
  const whatWeDoAnim = useScrollAnimation(0.3);
  const approachAnim = useScrollAnimation(0.3);
  const getInvolvedAnim = useScrollAnimation(0.3);
  const articlesAnim = useScrollAnimation(0.3);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        setArticles(await loadPublishedArticles("philanthropy", language));
      } catch (error) {
        console.error("Error fetching philanthropy articles:", error);
        setArticles([]);
      }
      setLoading(false);
    };

    fetchArticles();
  }, [language]);
  const homeLabel = language === "en" ? "Home" : language === "zh-hk" ? "首頁" : "首页";
  const meta = language === "en"
    ? { title: "Family Office Philanthropy in Hong Kong", description: "Explore FOIHK education, dialogue, and community initiatives concerning responsible family philanthropy and social impact in Hong Kong." }
    : language === "zh-hk"
      ? { title: "香港家族慈善與社會影響", description: "了解 FOIHK 有關責任家族慈善、社會影響、教育、交流及社群項目的內容。" }
      : { title: "香港家族慈善与社会影响", description: "了解 FOIHK 有关责任家族慈善、社会影响、教育、交流及社群项目的内容。" };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={meta.title}
        description={meta.description}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": t("philanthropy.title"),
          "description": meta.description,
          "url": `${ORGANIZATION_URL}/${language}/philanthropy`,
          "inLanguage": language === "en" ? "en" : language === "zh-hk" ? "zh-Hant" : "zh-Hans",
          "about": {
            "@type": "Organization",
            "name": ORGANIZATION_ENGLISH_NAME,
            "legalName": ORGANIZATION_LEGAL_NAME,
            "url": ORGANIZATION_URL
          },
        }}
      />
      <Navigation />
      <main>
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs items={[{ label: homeLabel, to: "/" }, { label: t("philanthropy.title") }]} />
          <h1 
            ref={titleAnim.elementRef}
            className={`text-4xl font-bold text-foreground mb-4 ${
              titleAnim.isVisible 
                ? 'animate-in slide-in-from-top-8 fade-in duration-300' 
                : ''
            }`}
          >
            {t("philanthropy.title")}
          </h1>
          <p 
            ref={descriptionAnim.elementRef}
            className={`text-lg text-muted-foreground mb-12 ${
              descriptionAnim.isVisible 
                ? 'animate-in slide-in-from-top-8 fade-in duration-300 delay-100' 
                : ''
            }`}
          >
            {t("philanthropy.subtitle")}
          </p>

          {/* Philanthropy Articles Section - moved to top */}
          <div 
            ref={articlesAnim.elementRef}
            className={`mb-12 ${
              articlesAnim.isVisible 
                ? 'animate-in slide-in-from-bottom-8 fade-in duration-300' 
                : ''
            }`}
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {t("philanthropy.articlesTitle")}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t("philanthropy.articlesDesc")}
            </p>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                <p className="mt-4 text-muted-foreground">{t("articles.loading")}</p>
              </div>
            ) : articles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t("articles.noArticles")}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <Link 
                    key={article.id}
                    to={`/articles/philanthropy/${normalizeArticleSlug(article.slug)}`}
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

          <Card 
            ref={missionAnim.elementRef}
            className={`mb-8 shadow-elegant overflow-hidden ${
              missionAnim.isVisible 
                ? 'animate-in slide-in-from-bottom-8 fade-in duration-300' 
                : ''
            }`}
          >
            <div className="relative h-48 w-full overflow-hidden">
              <img src={communityBg} alt="FOIHK Philanthropy - Family Office Charity Hong Kong" width="1200" height="400" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            </div>
            <CardHeader>
              <h2 className="text-2xl font-semibold leading-none">{t("philanthropy.ourMission")}</h2>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-base leading-relaxed">{t("philanthropy.missionText")}</p>
            </CardContent>
          </Card>

          <Card 
            ref={approachAnim.elementRef}
            className={`mb-8 shadow-elegant overflow-hidden ${
              approachAnim.isVisible 
                ? 'animate-in slide-in-from-right-8 fade-in duration-300' 
                : ''
            }`}
          >
            <CardHeader>
              <h2 className="text-2xl font-semibold leading-none">{t("philanthropy.approachTitle")}</h2>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-base leading-relaxed">{t("philanthropy.approachText")}</p>
            </CardContent>
          </Card>

          <Card 
            ref={whatWeDoAnim.elementRef}
            className={`mb-8 shadow-elegant ${
              whatWeDoAnim.isVisible 
                ? 'animate-in slide-in-from-left-8 fade-in duration-300' 
                : ''
            }`}
          >
            <CardHeader>
              <h2 className="text-2xl font-semibold leading-none">{t("philanthropy.whatWeDo")}</h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-4 p-4 rounded-lg bg-secondary/30">
                  <Handshake className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-foreground mb-2">{t("philanthropy.advisoryTitle")}</h3>
                    <p className="text-sm text-muted-foreground">{t("philanthropy.advisoryDesc")}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 rounded-lg bg-secondary/30">
                  <BookOpen className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-foreground mb-2">{t("philanthropy.educationTitle")}</h3>
                    <p className="text-sm text-muted-foreground">{t("philanthropy.educationDesc")}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 rounded-lg bg-secondary/30">
                  <Globe className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-foreground mb-2">{t("philanthropy.networkTitle")}</h3>
                    <p className="text-sm text-muted-foreground">{t("philanthropy.networkDesc")}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 rounded-lg bg-secondary/30">
                  <Heart className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-foreground mb-2">{t("philanthropy.initiativeTitle")}</h3>
                    <p className="text-sm text-muted-foreground">{t("philanthropy.initiativeDesc")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            ref={getInvolvedAnim.elementRef}
            className={`mb-12 shadow-elegant bg-primary text-primary-foreground ${
              getInvolvedAnim.isVisible 
                ? 'animate-in zoom-in-95 fade-in duration-300' 
                : ''
            }`}
          >
            <CardContent className="py-8 text-center">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 text-accent" />
              <h2 className="text-2xl font-bold mb-4">{t("philanthropy.getInvolved")}</h2>
              <p className="text-lg text-primary-foreground/80 mb-6">
                {t("philanthropy.getInvolvedText")}
              </p>
              <Button asChild variant="secondary" size="lg">
                <Link to="/contact">
                  {t("philanthropy.contactCta")} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </main>

      <Footer />
    </div>
  );
};

export default Philanthropy;
