import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { Home, Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const NotFound = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={`${t("notFound.title")} | FOIHK`}
        description={t("notFound.description")}
        noindex
      />
      <Navigation />
      
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-8xl md:text-9xl font-bold text-primary/20 mb-4">404</h1>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("notFound.heading")}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
            {t("notFound.message")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="default" size="lg">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                {t("notFound.returnHome")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/articles/education_research">
                <Search className="mr-2 h-4 w-4" />
                {t("notFound.browseResources")}
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
