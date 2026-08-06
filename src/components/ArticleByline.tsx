import { ExternalLink, ShieldCheck, UserRoundCheck } from "lucide-react";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { ORGANIZATION_EMAIL, ORGANIZATION_MEDIA_MENTION_URL } from "@/lib/schema";

const COPY: Record<Language, {
  heading: string;
  authorRole: string;
  authorName: string;
  authorCredential: string;
  leadershipLabel: string;
  leaderName: string;
  leaderTitle: string;
  leaderCredential: string;
  boundary: string;
  authorProfile: string;
  editorialPolicy: string;
  privacyPolicy: string;
  correction: string;
}> = {
  en: {
    heading: "Authorship and accountability",
    authorRole: "Institutional author",
    authorName: "FOIHK Editorial Team",
    authorCredential: "The editorial unit of Family Office Institute Hong Kong Limited publishes source-led content under documented dating, correction, and independence standards.",
    leadershipLabel: "Public leadership profile",
    leaderName: "Lai King Man, Leo",
    leaderTitle: "Founding Chairman",
    leaderCredential: "Verified FOIHK founding role; named contributor in Economic Digest's March 2026 family-office coverage.",
    boundary: "This leadership profile provides institutional context. It does not claim that the named person wrote or reviewed this article unless the article explicitly says so.",
    authorProfile: "Author and leadership profiles",
    editorialPolicy: "Editorial policy",
    privacyPolicy: "Privacy policy",
    correction: "Request a correction",
  },
  "zh-hk": {
    heading: "作者與問責",
    authorRole: "機構作者",
    authorName: "FOIHK 編輯團隊",
    authorCredential: "Family Office Institute Hong Kong Limited 的編輯單位，按照已公布的日期、來源、更正及獨立性準則發布以來源為本的內容。",
    leadershipLabel: "公開領導資料",
    leaderName: "Lai King Man, Leo（賴敬文）",
    leaderTitle: "創會主席",
    leaderCredential: "已核實的 FOIHK 創會職務；《經濟一週》在 2026 年 3 月家族辦公室報道中具名引述的人士。",
    boundary: "此領導資料提供機構背景；除非文章明確列明，否則不代表該人士親自撰寫或審閱本文。",
    authorProfile: "作者與領導資料",
    editorialPolicy: "編輯政策",
    privacyPolicy: "私隱政策",
    correction: "提出更正",
  },
  "zh-cn": {
    heading: "作者与问责",
    authorRole: "机构作者",
    authorName: "FOIHK 编辑团队",
    authorCredential: "Family Office Institute Hong Kong Limited 的编辑单位，按照已公布的日期、来源、更正及独立性准则发布以来源为本的内容。",
    leadershipLabel: "公开领导资料",
    leaderName: "Lai King Man, Leo（赖敬文）",
    leaderTitle: "创会主席",
    leaderCredential: "已核实的 FOIHK 创会职务；《经济一周》在 2026 年 3 月家族办公室报道中具名引用的人士。",
    boundary: "此领导资料提供机构背景；除非文章明确列明，否则不代表该人士亲自撰写或审阅本文。",
    authorProfile: "作者与领导资料",
    editorialPolicy: "编辑政策",
    privacyPolicy: "隐私政策",
    correction: "提出更正",
  },
};

export const ArticleByline = () => {
  const { language } = useLanguage();
  const copy = COPY[language];

  return (
    <section data-article-byline aria-labelledby="article-byline-heading" className="border-y border-border bg-secondary/20 py-7">
      <div className="container mx-auto max-w-5xl px-4">
        <h2 id="article-byline-heading" className="mb-6 text-2xl font-bold text-foreground">{copy.heading}</h2>
        <div className="grid gap-x-12 gap-y-7 md:grid-cols-2">
          <div data-institutional-author itemScope itemType="https://schema.org/Organization" className="flex items-start gap-4">
            <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p data-author-role className="text-sm font-semibold uppercase tracking-normal text-primary">{copy.authorRole}</p>
              <Link data-author-name itemProp="url" to="/about#editorial-accountability" rel="author" className="mt-1 inline-flex text-lg font-bold text-foreground underline-offset-4 hover:text-primary hover:underline"><span itemProp="name">{copy.authorName}</span></Link>
              <p data-author-credential itemProp="description" className="mt-2 leading-7 text-muted-foreground">{copy.authorCredential}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <UserRoundCheck className="mt-1 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-primary">{copy.leadershipLabel}</p>
              <p className="mt-1 text-lg font-bold text-foreground"><Link data-leadership-name to="/about#leadership" className="underline-offset-4 hover:text-primary hover:underline">{copy.leaderName}</Link> <span data-leadership-title className="font-medium text-muted-foreground">- {copy.leaderTitle}</span></p>
              <p data-leadership-credential className="mt-2 leading-7 text-muted-foreground">{copy.leaderCredential} <a href={ORGANIZATION_MEDIA_MENTION_URL} target="_blank" rel="noopener noreferrer" aria-label={copy.leaderCredential} className="inline-flex align-middle text-primary hover:underline"><ExternalLink className="h-4 w-4" aria-hidden="true" /></a></p>
            </div>
          </div>
        </div>
        <p data-authorship-boundary className="mt-6 text-sm leading-6 text-muted-foreground">{copy.boundary}</p>
        <nav aria-label={copy.heading} className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
          <Link to="/about#editorial-accountability" className="text-primary underline-offset-4 hover:underline">{copy.authorProfile}</Link>
          <a href={`mailto:${ORGANIZATION_EMAIL}?subject=Content%20correction`} className="text-primary underline-offset-4 hover:underline">{copy.correction}</a>
        </nav>
      </div>
    </section>
  );
};
