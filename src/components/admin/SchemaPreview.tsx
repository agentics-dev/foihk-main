import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Language } from "@/contexts/LanguageContext";

interface SchemaPreviewProps {
  language: Language;
  articleSchema: Record<string, unknown>;
  personSchema?: Record<string, unknown> | null;
  faqSchema: Record<string, unknown> | null;
  eventSchema?: Record<string, unknown> | null;
  breadcrumbSchema: Record<string, unknown>;
  breadcrumbLabels?: string[];
  pageUrl?: string;
  warnings: string[];
}

const JSON_TOKEN = /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(\btrue\b|\bfalse\b)|(\bnull\b)/g;

const JsonHighlight = ({ value }: { value: unknown }) => {
  const json = JSON.stringify(value, null, 2);
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  JSON_TOKEN.lastIndex = 0;
  while ((match = JSON_TOKEN.exec(json)) !== null) {
    if (match.index > lastIndex) parts.push(json.slice(lastIndex, match.index));
    const [, stringToken, colon, numberToken, boolToken, nullToken] = match;
    if (stringToken !== undefined) {
      parts.push(<span key={match.index} className={colon ? "text-blue-700" : "text-emerald-700"}>{stringToken}</span>);
      if (colon) parts.push(colon);
    } else if (numberToken !== undefined) {
      parts.push(<span key={match.index} className="text-amber-700">{numberToken}</span>);
    } else if (boolToken !== undefined) {
      parts.push(<span key={match.index} className="text-violet-700">{boolToken}</span>);
    } else if (nullToken !== undefined) {
      parts.push(<span key={match.index} className="text-muted-foreground">{nullToken}</span>);
    }
    lastIndex = JSON_TOKEN.lastIndex;
  }
  if (lastIndex < json.length) parts.push(json.slice(lastIndex));
  return <pre className="max-h-[320px] overflow-auto rounded-md border border-border bg-muted/30 p-4 font-mono text-xs leading-5">{parts}</pre>;
};

export const SchemaPreview = ({
  language,
  articleSchema,
  personSchema,
  faqSchema,
  eventSchema,
  breadcrumbSchema,
  breadcrumbLabels = [],
  pageUrl,
  warnings,
}: SchemaPreviewProps) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("article");
  const allSchemas = [articleSchema, ...(personSchema ? [personSchema] : []), ...(faqSchema ? [faqSchema] : []), ...(eventSchema ? [eventSchema] : []), breadcrumbSchema];
  const tabValue: Record<string, unknown> = {
    article: articleSchema,
    person: personSchema ?? { note: "No Person Schema because this language has no author name." },
    faq: faqSchema ?? { note: "No visible, enabled and translated FAQ items for this article and language." },
    event: eventSchema ?? { note: "Event Schema is disabled or missing required information for this language." },
    breadcrumb: breadcrumbSchema,
    all: allSchemas,
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(tabValue[activeTab], null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-w-0 space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Schema preview ({language})</h2>
        <p className="text-sm text-muted-foreground">Read-only JSON-LD generated from this language's current draft.</p>
      </div>

      {warnings.length > 0 ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Publishing checks</strong>
          <ul className="mt-2 list-disc space-y-1 pl-5">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
        </div>
      ) : (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">No Schema or GEO warnings for this language.</div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <Check className="mr-2 h-4 w-4 text-emerald-600" /> : <Copy className="mr-2 h-4 w-4" />}
          <span aria-live="polite">{copied ? "Copied" : "Copy JSON-LD"}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!pageUrl}
          onClick={() => pageUrl && window.open(`https://search.google.com/test/rich-results?url=${encodeURIComponent(pageUrl)}`, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink className="mr-2 h-4 w-4" /> Validate in Google
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="article">Article</TabsTrigger>
          <TabsTrigger value="person">Person</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="event">Event</TabsTrigger>
          <TabsTrigger value="breadcrumb">Breadcrumb</TabsTrigger>
          <TabsTrigger value="all">All JSON-LD</TabsTrigger>
        </TabsList>
        <TabsContent value="article"><JsonHighlight value={articleSchema} /></TabsContent>
        <TabsContent value="person">{personSchema ? <JsonHighlight value={personSchema} /> : <p className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">No Person Schema for this article and language.</p>}</TabsContent>
        <TabsContent value="faq">{faqSchema ? <JsonHighlight value={faqSchema} /> : <p className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">No FAQPage Schema for this article and language.</p>}</TabsContent>
        <TabsContent value="event">{eventSchema ? <JsonHighlight value={eventSchema} /> : <p className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">No valid Event Schema for this article and language.</p>}</TabsContent>
        <TabsContent value="breadcrumb" className="space-y-4">
          {breadcrumbLabels.length > 0 && (
            <nav aria-label="Breadcrumb preview" className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-background p-3 text-sm">
              {breadcrumbLabels.map((label, index) => (
                <span key={`${label}-${index}`} className="flex min-w-0 items-center gap-1.5">
                  {index > 0 && <span className="text-muted-foreground">›</span>}
                  <span className={index === breadcrumbLabels.length - 1 ? "break-words text-foreground" : "break-words text-blue-700"}>{label || "Untitled"}</span>
                </span>
              ))}
            </nav>
          )}
          <JsonHighlight value={breadcrumbSchema} />
        </TabsContent>
        <TabsContent value="all"><JsonHighlight value={allSchemas} /></TabsContent>
      </Tabs>
    </div>
  );
};
