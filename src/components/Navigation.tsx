import { useEffect, useState } from "react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { Menu, X, FileText } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { getLocalizedField, normalizeArticleSlug } from "@/lib/utils";
import foihkLogo from "@/assets/foihk-logo.png";
import { loadPublishedArticles, type PublishedArticle } from "@/lib/articles";
export const Navigation = () => {
  const {
    t,
    language
  } = useLanguage();
  const navigate = useNavigate();
  const [educationArticles, setEducationArticles] = useState<PublishedArticle[]>([]);
  const [newsArticles, setNewsArticles] = useState<PublishedArticle[]>([]);
  const [philanthropyArticles, setPhilanthropyArticles] = useState<PublishedArticle[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const [eduData, newsData, phData] = await Promise.all([
          loadPublishedArticles("education_research", language),
          loadPublishedArticles("news_events", language),
          loadPublishedArticles("philanthropy", language),
        ]);
        setEducationArticles(eduData.slice(0, 5));
        setNewsArticles(newsData.slice(0, 5));
        setPhilanthropyArticles(phData.slice(0, 5));
      } catch (error) {
        console.error("Error fetching navigation articles:", error);
      }
    };
    fetchArticles();
  }, [language]);
  return <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-primary shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex h-24 items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src={foihkLogo} alt="FOIHK Logo" width="147" height="64" className="h-16 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Primary navigation" className="hidden xl:flex items-center space-x-6">
            <Link to="/" className="text-sm font-medium text-primary-foreground hover:text-accent transition-colors">
              {t("nav.home")}
            </Link>
            
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger 
                    className="text-primary-foreground hover:text-accent bg-transparent cursor-pointer"
                    onClick={(e: React.MouseEvent) => { e.preventDefault(); navigate(`/${language}/articles/education-research`); }}
                  >
                    {t("nav.educationResearch")}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-background border border-border shadow-lg z-[100]">
                    <ul className="grid w-[500px] gap-2 p-4">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link to="/articles/education-research" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground bg-muted/50">
                            <div className="text-sm font-bold leading-none">{t("nav.viewAll")}</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {t("nav.browseEducation")}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      {educationArticles.length > 0 && <>
                          <li className="px-3 pt-2 pb-1">
                            <div className="text-xs font-semibold text-muted-foreground uppercase">{t("nav.recentArticles")}</div>
                          </li>
                          {educationArticles.map(article => <li key={article.id}>
                              <NavigationMenuLink asChild>
                                <Link to={`/articles/education-research/${normalizeArticleSlug(article.slug)}`} className="flex items-start gap-3 select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                  <div className="text-sm font-medium leading-tight line-clamp-2">
                                    {getLocalizedField(article, 'title', language)}
                                  </div>
                                </Link>
                              </NavigationMenuLink>
                            </li>)}
                        </>}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                    <NavigationMenuTrigger 
                      className="text-primary-foreground hover:text-accent bg-transparent cursor-pointer"
                      onClick={(e: React.MouseEvent) => { e.preventDefault(); navigate(`/${language}/articles/news-events`); }}
                    >
                      {t("nav.newsEvents")}
                    </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-background border border-border shadow-lg z-[100]">
                    <ul className="grid w-[500px] gap-2 p-4">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link to="/articles/news-events" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground bg-muted/50">
                            <div className="text-sm font-bold leading-none">{t("nav.viewAllNews")}</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {t("nav.browseNews")}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      {newsArticles.length > 0 && <>
                          <li className="px-3 pt-2 pb-1">
                            <div className="text-xs font-semibold text-muted-foreground uppercase">{t("nav.recentArticles")}</div>
                          </li>
                          {newsArticles.map(article => <li key={article.id}>
                              <NavigationMenuLink asChild>
                                <Link to={`/articles/news-events/${normalizeArticleSlug(article.slug)}`} className="flex items-start gap-3 select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                  <div className="text-sm font-medium leading-tight line-clamp-2">
                                    {getLocalizedField(article, 'title', language)}
                                  </div>
                                </Link>
                              </NavigationMenuLink>
                            </li>)}
                        </>}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                    <NavigationMenuTrigger 
                      className="text-primary-foreground hover:text-accent bg-transparent cursor-pointer"
                      onClick={(e: React.MouseEvent) => { e.preventDefault(); navigate(`/${language}/philanthropy`); }}
                    >
                      {t("nav.philanthropy")}
                    </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-background border border-border shadow-lg z-[100]">
                    <ul className="grid w-[500px] gap-2 p-4">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link to="/philanthropy" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground bg-muted/50">
                            <div className="text-sm font-bold leading-none">{t("nav.viewAllPhilanthropy")}</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {t("nav.browsePhilanthropy")}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      {philanthropyArticles.length > 0 && <>
                          <li className="px-3 pt-2 pb-1">
                            <div className="text-xs font-semibold text-muted-foreground uppercase">{t("nav.recentArticles")}</div>
                          </li>
                          {philanthropyArticles.map(article => <li key={article.id}>
                              <NavigationMenuLink asChild>
                                <Link to={`/articles/philanthropy/${normalizeArticleSlug(article.slug)}`} className="flex items-start gap-3 select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                  <div className="text-sm font-medium leading-tight line-clamp-2">
                                    {getLocalizedField(article, 'title', language)}
                                  </div>
                                </Link>
                              </NavigationMenuLink>
                            </li>)}
                        </>}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <Link to="/about" className="text-sm font-medium text-primary-foreground hover:text-accent transition-colors">
              {t("nav.about")}
            </Link>
            <Link to="/faq" className="text-sm font-medium text-primary-foreground hover:text-accent transition-colors">
              {t("nav.faq")}
            </Link>
            <Link to="/contact" className="text-sm font-medium text-primary-foreground hover:text-accent transition-colors">
              {t("nav.contact")}
            </Link>
            <LanguageSelector />
          </nav>

          {/* Mobile Navigation Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden text-primary-foreground hover:text-accent"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Mobile Full-Screen Overlay Menu */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 xl:hidden">
              <div
                className="absolute inset-0 bg-background/95 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="relative z-10 flex flex-col h-full animate-in slide-in-from-right-8 duration-300">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                    <img src={foihkLogo} alt="FOIHK Logo" width="110" height="48" className="h-12 w-auto" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4">
                  <nav className="flex flex-col space-y-1">
                    <Link
                      to="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center px-4 py-3 rounded-lg text-lg font-medium hover:bg-accent/10 transition-colors"
                    >
                      {t("nav.home")}
                    </Link>

                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="education" className="border-none">
                        <AccordionTrigger
                          className="px-4 py-3 rounded-lg text-lg font-medium hover:bg-accent/10 transition-colors hover:no-underline"
                          onClick={() => navigate(`/${language}/articles/education-research`)}
                        >
                          {t("nav.educationResearch")}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="flex flex-col space-y-1 pl-6 pr-4 pb-2">
                            <Link to="/articles/education-research" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold hover:text-primary transition-colors py-2">
                              {t("nav.viewAll")}
                            </Link>
                            {educationArticles.length > 0 && (
                              <>
                                <div className="text-xs font-semibold text-muted-foreground uppercase pt-2 pb-1">
                                  {t("nav.recentArticles")}
                                </div>
                                {educationArticles.map((article) => (
                                   <Link key={article.id} to={`/articles/education-research/${normalizeArticleSlug(article.slug)}`} onClick={() => setMobileMenuOpen(false)} className="text-sm hover:text-primary transition-colors py-1 flex items-start gap-2">
                                     <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                     <span className="line-clamp-2">{getLocalizedField(article, 'title', language)}</span>
                                   </Link>
                                 ))}
                              </>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="news" className="border-none">
                        <AccordionTrigger
                          className="px-4 py-3 rounded-lg text-lg font-medium hover:bg-accent/10 transition-colors hover:no-underline"
                          onClick={() => navigate(`/${language}/articles/news-events`)}
                        >
                          {t("nav.newsEvents")}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="flex flex-col space-y-1 pl-6 pr-4 pb-2">
                            <Link to="/articles/news-events" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold hover:text-primary transition-colors py-2">
                              {t("nav.viewAllNews")}
                            </Link>
                            {newsArticles.length > 0 && (
                              <>
                                <div className="text-xs font-semibold text-muted-foreground uppercase pt-2 pb-1">
                                  {t("nav.recentArticles")}
                                </div>
                                {newsArticles.map((article) => (
                                   <Link key={article.id} to={`/articles/news-events/${normalizeArticleSlug(article.slug)}`} onClick={() => setMobileMenuOpen(false)} className="text-sm hover:text-primary transition-colors py-1 flex items-start gap-2">
                                     <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                     <span className="line-clamp-2">{getLocalizedField(article, 'title', language)}</span>
                                   </Link>
                                 ))}
                              </>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="philanthropy-mobile" className="border-none">
                        <AccordionTrigger
                          className="px-4 py-3 rounded-lg text-lg font-medium hover:bg-accent/10 transition-colors hover:no-underline"
                          onClick={() => navigate(`/${language}/philanthropy`)}
                        >
                          {t("nav.philanthropy")}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="flex flex-col space-y-1 pl-6 pr-4 pb-2">
                            <Link to="/philanthropy" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold hover:text-primary transition-colors py-2">
                              {t("nav.viewAllPhilanthropy")}
                            </Link>
                            {philanthropyArticles.length > 0 && (
                              <>
                                <div className="text-xs font-semibold text-muted-foreground uppercase pt-2 pb-1">
                                  {t("nav.recentArticles")}
                                </div>
                                {philanthropyArticles.map((article) => (
                                  <Link key={article.id} to={`/articles/philanthropy/${normalizeArticleSlug(article.slug)}`} onClick={() => setMobileMenuOpen(false)} className="text-sm hover:text-primary transition-colors py-1 flex items-start gap-2">
                                    <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span className="line-clamp-2">{getLocalizedField(article, 'title', language)}</span>
                                  </Link>
                                ))}
                              </>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <Link
                      to="/about"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center px-4 py-3 rounded-lg text-lg font-medium hover:bg-accent/10 transition-colors"
                    >
                      {t("nav.about")}
                    </Link>
                    <Link
                      to="/contact"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center px-4 py-3 rounded-lg text-lg font-medium hover:bg-accent/10 transition-colors"
                    >
                      {t("nav.contact")}
                    </Link>
                    <Link
                      to="/faq"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center px-4 py-3 rounded-lg text-lg font-medium hover:bg-accent/10 transition-colors"
                    >
                      {t("nav.faq")}
                    </Link>
                  </nav>
                </div>

                <div className="border-t border-border p-4 flex items-center justify-between">
                  <LanguageSelector />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>;
};
