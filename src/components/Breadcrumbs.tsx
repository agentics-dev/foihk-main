import { ChevronRight } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { LocalizedLink } from "@/components/LocalizedLink";
import { useLanguage } from "@/contexts/LanguageContext";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const BASE_URL = "https://www.foihk.org";

export const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  const { language } = useLanguage();
  const { pathname } = useLocation();

  const toLocalizedPath = (to?: string) => {
    if (!to) return pathname;
    if (/^https?:\/\//.test(to)) return new URL(to).pathname;
    if (to === "/") return `/${language}`;
    if (to.startsWith(`/${language}/`) || to === `/${language}`) return to;
    return `/${language}${to.startsWith("/") ? to : `/${to}`}`;
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": `${BASE_URL}${toLocalizedPath(item.to).replace(/\/+$/, "") || "/"}`,
    })),
  };

  return (
    <>
      <Helmet>
        <script data-breadcrumb-schema type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden text-sm text-muted-foreground sm:flex-wrap">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={`${item.label}-${index}`} className={`flex min-w-0 max-w-full items-center gap-1 ${isLast ? "flex-1" : "shrink-0"}`}>
                {index > 0 && <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0" />}
                {item.to && !isLast ? (
                  <LocalizedLink to={item.to} className="break-words hover:text-foreground">
                    {item.label}
                  </LocalizedLink>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={`min-w-0 ${isLast ? "truncate text-foreground sm:whitespace-normal sm:break-words" : "break-words"}`}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};
