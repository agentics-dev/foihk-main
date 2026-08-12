import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardHeader } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { CroppedImage } from "@/components/CroppedImage";
import { useLanguage } from "@/contexts/LanguageContext";
import { sanitizeArticleHtml } from "@/lib/articleHtml";
import type { ImageCropData } from "./ImageCropperDialog";

interface ArticlePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  excerpt: string;
  content: string;
  displayDate: Date;
  imageUrl: string | null;
  imageMetadata?: ImageCropData;
}

export const ArticlePreviewDialog = ({
  open,
  onOpenChange,
  title,
  excerpt,
  content,
  displayDate,
  imageUrl,
  imageMetadata,
}: ArticlePreviewDialogProps) => {
  const { language } = useLanguage();
  const sanitizedContent = sanitizeArticleHtml(content, title || "Article preview image");

  const card = (
    <div className="h-full">
      <Card className="h-full flex flex-col shadow-elegant hover:shadow-glow transition-all duration-300 hover:-translate-y-1 cursor-pointer">
        {imageUrl ? (
          <CroppedImage
            src={imageUrl}
            alt={title}
            metadata={imageMetadata}
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
            <time dateTime={displayDate.toISOString()}>
              {displayDate.toLocaleDateString(language, { year: 'numeric', month: 'short', day: 'numeric' })}
            </time>
          </div>
          <h2 className="text-xl font-bold line-clamp-2 hover:text-primary transition-colors mt-2 h-14 flex-shrink-0">
            {title || 'Untitled Article'}
          </h2>
          <p className="text-sm text-muted-foreground line-clamp-3 mt-2 h-[3.75rem] flex-shrink-0">
            {excerpt || '\u00A0'}
          </p>
        </CardHeader>
      </Card>
    </div>
  );

  const placeholder = (
    <div className="h-full">
      <Card className="h-full flex flex-col shadow-elegant">
        <div className="aspect-video w-full flex-shrink-0 rounded-t-lg bg-secondary/20" />
        <CardHeader className="flex-1 flex flex-col">
          <div className="h-4 w-1/3 bg-secondary/20 rounded" />
          <div className="mt-2 h-14" />
          <div className="mt-2 h-[3.75rem]" />
        </CardHeader>
      </Card>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[1100px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Card Preview — Articles Listing</DialogTitle>
        </DialogHeader>

        <div className="space-y-8 py-2">
          {/* Desktop: 3 columns (lg breakpoint) */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider px-4">
              Desktop (lg: 3 columns)
            </p>
            <div className="max-w-[1024px] mx-auto px-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {card}
                {placeholder}
                {placeholder}
              </div>
            </div>
          </div>

          {/* Tablet: 2 columns (md breakpoint) */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider px-4">
              Tablet (md: 2 columns)
            </p>
            <div className="max-w-[1024px] mx-auto px-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {card}
                {placeholder}
              </div>
            </div>
          </div>

          {/* Mobile: 1 column */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider px-4">
              Mobile (1 column)
            </p>
            <div className="max-w-[1024px] mx-auto px-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {card}
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider px-4">
              Article body
            </p>
            <div className="mx-auto max-w-3xl rounded-lg border border-border bg-background p-6">
              <div
                className="prose prose-lg max-w-none text-foreground"
                dangerouslySetInnerHTML={{ __html: sanitizedContent || "<p>&nbsp;</p>" }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
