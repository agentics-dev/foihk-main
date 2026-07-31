import { useLanguage } from "@/contexts/LanguageContext";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import foihkLogo from "@/assets/foihk-logo.png";
export const Footer = () => {
  const {
    t,
    language
  } = useLanguage();
  const pressLabel = language === "en" ? "Media Coverage" : language === "zh-cn" ? "媒体报道" : "媒體報導";
  const faqLabel = language === "en" ? "FAQ" : language === "zh-cn" ? "常见问题" : "常見問題";
  const policyLabel = language === "en" ? "Editorial Policy" : language === "zh-cn" ? "编辑政策" : "編輯政策";
  return <footer className="border-t border-border bg-secondary/20 py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
          <div className="flex flex-col gap-6">
            <img src={foihkLogo} alt="FOIHK Logo" className="h-16 w-40 " />
            <p className="text-sm text-muted-foreground font-arial">{t("footer.copyright")}</p>
          </div>
          
          <nav className="flex flex-col gap-3 text-right">
            <Link to="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {t("nav.home")}
            </Link>
            <Link to="/articles/education_research" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {t("nav.educationResearch")}
            </Link>
            <Link to="/articles/news_events" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {t("nav.newsEvents")}
            </Link>
            <Link to="/press" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {pressLabel}
            </Link>
            <Link to="/about" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {t("nav.about")}
            </Link>
            <Link to="/contact" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {t("nav.contact")}
            </Link>
            <Link to="/faq" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {faqLabel}
            </Link>
            <Link to="/editorial-policy" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {policyLabel}
            </Link>
          </nav>
        </div>
      </div>
    </footer>;
};
