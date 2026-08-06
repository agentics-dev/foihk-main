import { useLanguage } from "@/contexts/LanguageContext";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import foihkLogo from "@/assets/foihk-logo.png";
import { Linkedin, Mail, MapPin } from "lucide-react";
import {
  ORGANIZATION_EMAIL,
  ORGANIZATION_LEGAL_NAME,
  ORGANIZATION_LINKEDIN_URL,
  SITE_CONTENT_REVIEWED_DATE,
} from "@/lib/schema";

interface FooterProps {
  lastUpdated?: string;
}

export const Footer = ({ lastUpdated = SITE_CONTENT_REVIEWED_DATE }: FooterProps) => {
  const {
    t,
    language
  } = useLanguage();
  const faqLabel = language === "en" ? "FAQ" : language === "zh-cn" ? "常见问题" : "常見問題";
  const contactLabel = language === "en" ? "Verified contact" : language === "zh-cn" ? "已核实联系方式" : "已核實聯絡資料";
  const updatedLabel = language === "en" ? "Page content last updated" : language === "zh-cn" ? "页面内容最后更新" : "頁面內容最後更新";
  const formattedUpdatedDate = new Date(lastUpdated).toLocaleDateString(language, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Hong_Kong",
  });
  return <footer className="border-t border-border bg-secondary/20 py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-start">
          <div className="flex flex-col gap-6">
            <img src={foihkLogo} alt="FOIHK Logo" width="147" height="64" className="h-16 w-auto self-start" />
            <p className="max-w-xs text-sm font-medium text-foreground">{ORGANIZATION_LEGAL_NAME}</p>
            <p className="text-sm text-muted-foreground font-arial">{t("footer.copyright")}</p>
          </div>

          <address className="space-y-3 text-sm not-italic">
            <h2 className="font-semibold text-foreground">{contactLabel}</h2>
            <a href={`mailto:${ORGANIZATION_EMAIL}`} className="flex items-start gap-2 text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{ORGANIZATION_EMAIL}</span>
            </a>
            <p className="flex max-w-sm items-start gap-2 text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{t("contact.addressText")}</span>
            </p>
            <a href={ORGANIZATION_LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
              <Linkedin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>LinkedIn</span>
            </a>
          </address>
          
          <nav className="flex flex-col gap-3 text-left md:text-right" aria-label="Footer">
            <Link to="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {t("nav.home")}
            </Link>
            <Link to="/articles/education-research" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {t("nav.educationResearch")}
            </Link>
            <Link to="/articles/news-events" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {t("nav.newsEvents")}
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
          </nav>
        </div>
        <p data-page-freshness className="mt-8 border-t border-border pt-5 text-xs font-medium text-muted-foreground">
          {updatedLabel}: <time dateTime={lastUpdated}>{formattedUpdatedDate}</time>
        </p>
      </div>
    </footer>;
};
