import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import purposeBg from "@/assets/purpose-bg.jpg";
import visionBg from "@/assets/vision-bg.jpg";
import missionBg from "@/assets/mission-bg.jpg";
import foundingChairman from "@/assets/founding-chairman.png";
import foundingSecretary from "@/assets/founding-secretary.png";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import {
  ORGANIZATION_ADDRESS,
  ORGANIZATION_ALTERNATE_NAMES,
  ORGANIZATION_ENGLISH_NAME,
  ORGANIZATION_FOUNDING_DATE,
  ORGANIZATION_LEGAL_NAME,
  ORGANIZATION_URL,
} from "@/lib/schema";

const About = () => {
  const { t, language } = useLanguage();
  const homeLabel = language === "en" ? "Home" : language === "zh-hk" ? "首頁" : "首页";
  const meta = language === "en"
    ? { title: "About FOIHK", description: "Learn about FOIHK's purpose, mission, leadership, and role as a Hong Kong family office industry institution and professional community." }
    : language === "zh-hk"
      ? { title: "關於香港家族辦公室學會", description: "了解 FOIHK 的宗旨、使命、領導團隊，以及作為香港家族辦公室行業機構與專業社群的角色。" }
      : { title: "关于香港家族办公室学会", description: "了解 FOIHK 的宗旨、使命、领导团队，以及作为香港家族办公室行业机构与专业社群的角色。" };
  
  // Scroll animations for each section
  const titleAnim = useScrollAnimation(0.3);
  const purposeAnim = useScrollAnimation(0.3);
  const visionAnim = useScrollAnimation(0.3);
  const missionAnim = useScrollAnimation(0.3);
  const leadershipHeaderAnim = useScrollAnimation(0.3);
  const leadershipCard1Anim = useScrollAnimation(0.3);
  const leadershipCard2Anim = useScrollAnimation(0.3);
  return <div className="min-h-screen bg-background">
      <SEO
        title={meta.title}
        description={meta.description}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": t("about.title"),
          "description": meta.description,
          "url": `${ORGANIZATION_URL}/${language}/about`,
          "inLanguage": language === "en" ? "en" : language === "zh-hk" ? "zh-Hant" : "zh-Hans",
          "about": {
            "@type": "Organization",
            "name": ORGANIZATION_ENGLISH_NAME,
            "alternateName": ORGANIZATION_ALTERNATE_NAMES,
            "legalName": ORGANIZATION_LEGAL_NAME,
            "url": ORGANIZATION_URL,
            "description": meta.description,
            "foundingDate": ORGANIZATION_FOUNDING_DATE,
            "address": ORGANIZATION_ADDRESS,
            "areaServed": {
              "@type": "Place",
              "name": "Hong Kong"
            }
          }
        }}
        breadcrumbs={[
          { name: homeLabel, url: `${ORGANIZATION_URL}/${language}` },
          { name: t("about.title"), url: `${ORGANIZATION_URL}/${language}/about` },
        ]}
      />
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs items={[{ label: homeLabel, to: "/" }, { label: t("about.title") }]} />
          <h1 
            ref={titleAnim.elementRef}
            className={`text-4xl font-bold text-foreground mb-8 font-arial ${
              titleAnim.isVisible 
                ? 'animate-in slide-in-from-top-8 fade-in duration-300' 
                : ''
            }`}
          >
            {t("about.title")}
          </h1>
          
          <Card 
            ref={purposeAnim.elementRef}
            className={`mb-8 shadow-elegant overflow-hidden ${
              purposeAnim.isVisible 
                ? 'animate-in slide-in-from-left-8 fade-in duration-300' 
                : ''
            }`}
          >
            <div className="relative h-48 w-full overflow-hidden">
              <img src={purposeBg} alt="FOIHK Purpose - Family Office Institute Hong Kong" className="w-full h-full object-cover" />
            </div>
            <CardHeader>
              <CardTitle className="font-arial">{t("about.purpose")}</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p className="font-arial">{t("about.purposeText")}</p>
            </CardContent>
          </Card>

          <Card 
            ref={visionAnim.elementRef}
            className={`mb-8 shadow-elegant overflow-hidden ${
              visionAnim.isVisible 
                ? 'animate-in slide-in-from-right-8 fade-in duration-300' 
                : ''
            }`}
          >
            <div className="relative h-48 w-full overflow-hidden">
              <img src={visionBg} alt="FOIHK Vision - Family Office Institute Hong Kong" className="w-full h-full object-cover" />
            </div>
            <CardHeader>
              <CardTitle className="font-arial">{t("about.vision")}</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <ul className="space-y-2">
                <li className="font-arial">{t("about.visionText")}</li>
              </ul>
            </CardContent>
          </Card>

          <Card 
            ref={missionAnim.elementRef}
            className={`shadow-elegant overflow-hidden ${
              missionAnim.isVisible 
                ? 'animate-in zoom-in-95 fade-in duration-300' 
                : ''
            }`}
          >
            <div className="relative h-48 w-full overflow-hidden">
              <img src={missionBg} alt="FOIHK Mission - Family Office Institute Hong Kong" className="w-full h-full object-cover" />
            </div>
            <CardHeader>
              <CardTitle className="font-arial">{t("about.mission")}</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <ul className="list-disc pl-6 space-y-3">
                {t("about.missionText").split('•').filter(item => item.trim()).map((item, index) => (
                  <li key={index} className="font-arial">{item.trim()}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Leadership Team Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div 
            ref={leadershipHeaderAnim.elementRef}
            className={`text-center mb-12 ${
              leadershipHeaderAnim.isVisible 
                ? 'animate-in slide-in-from-bottom-8 fade-in duration-300' 
                : ''
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-arial">
              {t("home.leadershipTitle")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-arial">
              {t("home.leadershipDesc")}
            </p>
          </div>
          
          {/* First Row - 2 members */}
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-8">
            <Card 
              ref={leadershipCard1Anim.elementRef}
              className={`border-border/50 shadow-elegant hover:shadow-glow transition-all duration-300 hover:-translate-y-1 ${
                leadershipCard1Anim.isVisible 
                  ? 'animate-in fade-in zoom-in-95 duration-300' 
                  : ''
              }`}
            >
              <CardContent className="pt-6 text-center">
                <div className="w-64 h-80 mx-auto mb-4 rounded-lg overflow-hidden">
                  <img src={foundingChairman} alt="Lai King Man, Leo" className="w-full h-full object-cover object-top" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-1 font-arial">{t("home.chairmanName")}</h3>
                <p className="text-sm text-muted-foreground font-arial">{t("home.foundingChairman")}</p>
              </CardContent>
            </Card>

            <Card 
              ref={leadershipCard2Anim.elementRef}
              className={`border-border/50 shadow-elegant hover:shadow-glow transition-all duration-300 hover:-translate-y-1 ${
                leadershipCard2Anim.isVisible 
                  ? 'animate-in fade-in zoom-in-95 duration-300 delay-100' 
                  : ''
              }`}
            >
              <CardContent className="pt-6 text-center">
                <div className="w-64 h-80 mx-auto mb-4 rounded-lg overflow-hidden">
                  <img src={foundingSecretary} alt="Chan Man Ching" className="w-full h-full object-cover object-top" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-1 font-arial">{t("home.secretaryName")}</h3>
                <p className="text-sm text-muted-foreground font-arial">{t("home.foundingSecretary")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>;
};
export default About;
