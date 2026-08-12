import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Language } from "@/contexts/LanguageContext";

interface SchemaPreviewProps {
  language: Language;
  articleSchema: Record<string, unknown>;
  faqSchema: Record<string, unknown> | null;
  breadcrumbSchema: Record<string, unknown>;
  warnings: string[];
}

const JsonBlock = ({ value }: { value: unknown }) => (
  <pre className="max-h-[520px] overflow-auto border border-border bg-muted/30 p-4 text-xs leading-5">
    {JSON.stringify(value, null, 2)}
  </pre>
);

export const SchemaPreview = ({ language, articleSchema, faqSchema, breadcrumbSchema, warnings }: SchemaPreviewProps) => {
  const allSchemas = faqSchema ? [articleSchema, faqSchema, breadcrumbSchema] : [articleSchema, breadcrumbSchema];
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Schema preview ({language})</h2>
        <p className="text-sm text-muted-foreground">Read-only JSON-LD generated from public article fields. It is not displayed visually on the public page.</p>
      </div>
      {warnings.length > 0 ? (
        <div className="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Publishing checks</strong>
          <ul className="mt-2 list-disc space-y-1 pl-5">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
        </div>
      ) : (
        <div className="border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">No Schema or GEO warnings for this language.</div>
      )}
      <Tabs defaultValue="article">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="article">Article</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="breadcrumb">Breadcrumb</TabsTrigger>
          <TabsTrigger value="all">All JSON-LD</TabsTrigger>
        </TabsList>
        <TabsContent value="article"><JsonBlock value={articleSchema} /></TabsContent>
        <TabsContent value="faq">{faqSchema ? <JsonBlock value={faqSchema} /> : <p className="border border-dashed p-5 text-sm text-muted-foreground">No enabled and translated FAQ items for this language.</p>}</TabsContent>
        <TabsContent value="breadcrumb"><JsonBlock value={breadcrumbSchema} /></TabsContent>
        <TabsContent value="all"><JsonBlock value={allSchemas} /></TabsContent>
      </Tabs>
    </div>
  );
};
