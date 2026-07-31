import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { useLanguage, type Language } from "@/contexts/LanguageContext";

interface PolicyCopy {
  title: string;
  description: string;
  home: string;
  updatedLabel: string;
  updated: string;
  intro: string;
  sections: Array<{ heading: string; body: string }>;
}

const COPY: Record<Language, PolicyCopy> = {
  en: {
    title: "Editorial Policy",
    description: "FOIHK's editorial standards for organizational authorship, primary sources, publication dates, updates, review, corrections, and independence.",
    home: "Home",
    updatedLabel: "Last updated",
    updated: "29 July 2026",
    intro: "This policy explains how Family Office Institute Hong Kong Limited prepares and maintains public educational, research, news, and philanthropy content.",
    sections: [
      { heading: "Authorship and accountability", body: "Unless a named individual author or reviewer is confirmed on the page, content is attributed to FOIHK as an organization. Organizational authorship does not imply personal endorsement by every officer or member." },
      { heading: "Source priority", body: "We prioritize Hong Kong Government, regulators, statutory bodies, official registers, original research, academic institutions, and first-party organizational records. Secondary sources may provide context but should not replace an available primary source for material claims." },
      { heading: "Dates and updates", body: "Articles display a publication date and, when changed after publication, a last-updated date. Structured data must use the same dates shown to readers. Substantive revisions should improve accuracy, context, sources, or clarity." },
      { heading: "Review principles", body: "We review factual accuracy, source relevance, language parity, conflicts between visible content and metadata, and whether statements could be mistaken for regulated professional advice. Three language versions should communicate equivalent material information." },
      { heading: "Independence and limitations", body: "Educational content is not investment, legal, tax, accounting, or other regulated advice. Partnerships, event participation, or references to third parties do not by themselves constitute endorsement." },
      { heading: "Corrections", body: "Correction requests can be sent to info@foihk.org. Please identify the page, disputed statement, and supporting source. Verified material errors will be corrected and the update date revised where appropriate." },
    ],
  },
  "zh-hk": {
    title: "編輯政策",
    description: "FOIHK 有關機構署名、第一手來源、發布與更新日期、審核、更正及編輯獨立性的準則。",
    home: "首頁",
    updatedLabel: "最後更新",
    updated: "2026 年 7 月 29 日",
    intro: "本政策說明 Family Office Institute Hong Kong Limited 如何製作及維護公開的教育、研究、新聞和慈善內容。",
    sections: [
      { heading: "署名與責任", body: "除非頁面已確認具名個人作者或審閱者，內容均由 FOIHK 以機構名義署名。機構署名不代表每位職員或會員均作出個人背書。" },
      { heading: "來源優先次序", body: "我們優先採用香港政府、監管機構、法定機構、官方登記、原始研究、院校及第一手機構紀錄。次級來源可補充背景，但重要陳述如有第一手來源，不應以次級來源取代。" },
      { heading: "發布與更新日期", body: "文章會顯示發布日期；發布後如有修改，亦會顯示最後更新日期。結構化資料所載日期必須與讀者所見一致。實質修訂應改善準確性、背景、來源或表述。" },
      { heading: "審核原則", body: "我們審核事實準確性、來源相關性、三語資訊對等、可見內容與元數據是否衝突，以及陳述會否被誤解為受規管專業意見。" },
      { heading: "獨立性與限制", body: "教育內容不構成投資、法律、稅務、會計或其他受規管意見。合作、活動參與或提及第三方，本身不代表背書。" },
      { heading: "更正機制", body: "更正要求可發送至 info@foihk.org，請列明相關頁面、具爭議的陳述及支持來源。經核實的重要錯誤會予以更正，並在適當時更新頁面日期。" },
    ],
  },
  "zh-cn": {
    title: "编辑政策",
    description: "FOIHK 有关机构署名、第一手来源、发布与更新日期、审核、更正及编辑独立性的准则。",
    home: "首页",
    updatedLabel: "最后更新",
    updated: "2026 年 7 月 29 日",
    intro: "本政策说明 Family Office Institute Hong Kong Limited 如何制作及维护公开的教育、研究、新闻和慈善内容。",
    sections: [
      { heading: "署名与责任", body: "除非页面已确认具名个人作者或审阅者，内容均由 FOIHK 以机构名义署名。机构署名不代表每位职员或会员均作出个人背书。" },
      { heading: "来源优先顺序", body: "我们优先采用香港政府、监管机构、法定机构、官方登记、原始研究、院校及第一手机构记录。次级来源可补充背景，但重要陈述如有第一手来源，不应以次级来源取代。" },
      { heading: "发布与更新日期", body: "文章会显示发布日期；发布后如有修改，也会显示最后更新日期。结构化数据所载日期必须与读者所见一致。实质修订应改善准确性、背景、来源或表述。" },
      { heading: "审核原则", body: "我们审核事实准确性、来源相关性、三语信息对等、可见内容与元数据是否冲突，以及陈述会否被误解为受监管专业意见。" },
      { heading: "独立性与限制", body: "教育内容不构成投资、法律、税务、会计或其他受监管意见。合作、活动参与或提及第三方，本身不代表背书。" },
      { heading: "更正机制", body: "更正要求可发送至 info@foihk.org，请列明相关页面、有争议的陈述及支持来源。经核实的重要错误会予以更正，并在适当时更新页面日期。" },
    ],
  },
};

const EditorialPolicy = () => {
  const { language } = useLanguage();
  const copy = COPY[language];
  const canonical = `https://www.foihk.org/${language}/editorial-policy`;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={copy.title}
        description={copy.description}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": copy.title,
          "description": copy.description,
          "url": canonical,
          "dateModified": "2026-07-29",
          "inLanguage": language === "en" ? "en" : language === "zh-hk" ? "zh-Hant" : "zh-Hans",
        }}
        breadcrumbs={[
          { name: copy.home, url: `https://www.foihk.org/${language}` },
          { name: copy.title, url: canonical },
        ]}
      />
      <Navigation />
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <Breadcrumbs items={[{ label: copy.home, to: "/" }, { label: copy.title }]} />
        <header className="mb-10 border-b border-border pb-8">
          <h1 className="mb-4 text-4xl font-bold text-foreground">{copy.title}</h1>
          <p className="mb-4 text-lg leading-8 text-muted-foreground">{copy.intro}</p>
          <p className="text-sm text-muted-foreground">{copy.updatedLabel}: <time dateTime="2026-07-29">{copy.updated}</time></p>
        </header>
        <div className="space-y-10">
          {copy.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-3 text-2xl font-semibold text-foreground">{section.heading}</h2>
              <p className="leading-8 text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EditorialPolicy;
