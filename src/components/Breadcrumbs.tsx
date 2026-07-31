import { ChevronRight } from "lucide-react";
import { LocalizedLink } from "@/components/LocalizedLink";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs = ({ items }: BreadcrumbsProps) => (
  <nav aria-label="Breadcrumb" className="mb-6">
    <ol className="flex min-w-0 flex-wrap items-center gap-1 text-sm text-muted-foreground">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <li key={`${item.label}-${index}`} className="flex min-w-0 max-w-full items-center gap-1">
            {index > 0 && <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0" />}
            {item.to && !isLast ? (
              <LocalizedLink to={item.to} className="break-words hover:text-foreground">
                {item.label}
              </LocalizedLink>
            ) : (
              <span
                aria-current={isLast ? "page" : undefined}
                className={`min-w-0 break-words ${isLast ? "text-foreground" : ""}`}
              >
                {item.label}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);
