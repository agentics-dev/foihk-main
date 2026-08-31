import type { LucideIcon } from "lucide-react";
import {
  BookOpenCheck,
  CalendarDays,
  HandHeart,
  MessagesSquare,
  Newspaper,
  SearchCheck,
} from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import communityBackground from "@/assets/community-bg.webp";
import {
  ORGANIZATION_ENGLISH_NAME,
  ORGANIZATION_LEGAL_NAME,
  ORGANIZATION_URL,
} from "@/lib/schema";

interface Offering {
  title: string;
  description: string;
  outputs: string[];
}

interface ServicesCopy {
  title: string;
  description: string;
  intro: string;
  heroAlt: string;
  home: string;
  updatedLabel: string;
  updated: string;
  offeringHeading: string;
  offeringIntro: string;
  outputLabel: string;
  offerings: Offering[];
  comparisonHeading: string;
  comparisonIntro: string;
  comparisonHeaders: string[];
  comparisonRows: string[][];
  audienceHeading: string;
  audiences: string[];
  processHeading: string;
  process: Array<{ title: string; body: string }>;
  boundariesHeading: string;
  boundariesIntro: string;
  boundaries: string[];
  certificationNote: string;
  contactHeading: string;
  contactBody: string;
  contactCta: string;
  credentialsCta: string;
}

const UPDATED_ISO = "2026-08-03";
const ICONS: LucideIcon[] = [BookOpenCheck, SearchCheck, CalendarDays, HandHeart, MessagesSquare, Newspaper];

const COPY: Record<Language, ServicesCopy> = {
  en: {
    title: "Services and Offerings",
    description: "Explore FOIHK education, research, events, philanthropy, institutional collaboration, and media offerings, with clear scope and service boundaries.",
    intro: "FOIHK provides education, research, convening, philanthropy, and professional-exchange activities for Hong Kong's family office ecosystem. Availability is confirmed for each initiative; this page does not advertise regulated financial or professional advisory services.",
    heroAlt: "FOIHK professional community and institutional exchange",
    home: "Home",
    updatedLabel: "Last updated",
    updated: "3 August 2026",
    offeringHeading: "FOIHK offerings",
    offeringIntro: "Each offering has a defined educational or community purpose. Specific dates, eligibility, contributors, deliverables, and participation terms are confirmed in the relevant announcement or written scope.",
    outputLabel: "Typical formats",
    offerings: [
      { title: "Education and practical guides", description: "Plain-language resources explaining family office models, governance, succession, philanthropy, professional services, and Hong Kong context.", outputs: ["Pillar guides and explainers", "Definition and comparison resources", "Frequently asked questions"] },
      { title: "Research and evidence synthesis", description: "Source-led reviews of public policy, regulatory guidance, ecosystem data, and material sector developments.", outputs: ["Research articles", "Official-source summaries", "Trend and policy monitoring"] },
      { title: "Events and professional dialogue", description: "Convening opportunities that bring together families, practitioners, institutions, academics, and community participants around defined themes.", outputs: ["Roundtables and forums", "Educational sessions", "Cross-sector discussions"] },
      { title: "Philanthropy and purpose", description: "Educational exchange on responsible giving, impact, family values, governance, and next-generation participation.", outputs: ["Philanthropy resources", "Community initiatives", "Purpose-led dialogue"] },
      { title: "Institutional collaboration", description: "Scoped collaboration with academic institutions, professional bodies, nonprofits, and ecosystem organizations on relevant public-interest work.", outputs: ["Co-developed research", "Knowledge partnerships", "Joint educational initiatives"] },
      { title: "Media and research enquiries", description: "Institutional information, attributable background, and source navigation for journalists, researchers, and public-interest enquiries.", outputs: ["Institutional facts", "Source references", "Interview or comment requests"] },
    ],
    comparisonHeading: "Compare offering areas",
    comparisonIntro: "This table compares purpose, format, and access. It does not imply that every format is continuously available.",
    comparisonHeaders: ["Offering area", "Primary purpose", "Typical formats", "Access and terms"],
    comparisonRows: [
      ["Education and research", "Explain family office structures, governance, policy, and market evidence", "Guides, research articles, FAQs", "Public resources are accessible online; project scope and any terms are confirmed separately"],
      ["Events and community", "Convene families, practitioners, institutions, and community participants", "Forums, roundtables, educational sessions", "Dates, eligibility, capacity, fees, and cancellation terms depend on the event announcement"],
      ["Collaboration and enquiries", "Support defined institutional, academic, philanthropic, media, or research work", "Joint research, knowledge partnerships, source navigation", "Fit, responsibilities, deliverables, attribution, timing, and any fees are agreed before work begins"],
    ],
    audienceHeading: "Who these offerings are for",
    audiences: ["Family principals and family office teams", "Professional advisers and financial institutions", "Academic and research organizations", "Philanthropic and nonprofit practitioners", "Students and emerging professionals", "Media and public-interest researchers"],
    processHeading: "How an enquiry is handled",
    process: [
      { title: "1. Define the purpose", body: "State the topic, intended audience, preferred format, timing, and organization involved." },
      { title: "2. Confirm fit and scope", body: "FOIHK checks whether the request aligns with its institutional role and whether relevant capacity is available." },
      { title: "3. Document responsibilities", body: "Contributors, evidence standards, communications, deliverables, attribution, and participation terms are agreed in writing where appropriate." },
      { title: "4. Publish or deliver transparently", body: "Public outputs identify sources, dates, authorship, partners, and limitations that are material to readers." },
    ],
    boundariesHeading: "Important service boundaries",
    boundariesIntro: "FOIHK is an industry institution and professional community. Its website and public activities should not be mistaken for a family office mandate or regulated advisory engagement.",
    boundaries: ["No management, custody, or control of family assets", "No sale or recommendation of financial products", "No investment, legal, tax, accounting, trust, or immigration advice", "No guarantee of event access, introductions, commercial outcomes, funding, or media coverage", "No endorsement created solely by membership, participation, collaboration, or mention"],
    certificationNote: "FOIHK does not currently list an accredited professional certification or qualification available for enrolment or award on this website.",
    contactHeading: "Discuss a defined enquiry",
    contactBody: "Send the objective, audience, proposed timing, evidence or speakers involved, and your organization's details. FOIHK will confirm whether the request fits its role and current capacity.",
    contactCta: "Contact FOIHK",
    credentialsCta: "Credentials and certification information",
  },
  "zh-hk": {
    title: "服務與項目",
    description: "了解 FOIHK 的教育、研究、活動、慈善、機構合作及媒體工作，並查閱清晰的服務範圍與界線。",
    intro: "FOIHK 為香港家族辦公室生態提供教育、研究、交流、慈善及專業對話活動。每項工作的實際安排須個別確認；本頁不宣傳受規管金融服務或專業顧問服務。",
    heroAlt: "FOIHK 專業社群與機構交流",
    home: "首頁",
    updatedLabel: "最後更新",
    updated: "2026 年 8 月 3 日",
    offeringHeading: "FOIHK 服務與項目",
    offeringIntro: "每項工作均有明確的教育或社群目的。日期、資格、參與者、成果及參與條款，會在相關公布或書面範圍中確認。",
    outputLabel: "常見形式",
    offerings: [
      { title: "教育與實用指南", description: "以清晰語言解釋家辦模式、治理、傳承、慈善、專業服務和香港情況。", outputs: ["支柱指南與解說", "定義與比較資源", "常見問題"] },
      { title: "研究與證據整理", description: "以來源為本，整理公共政策、監管指引、生態數據及重要行業發展。", outputs: ["研究文章", "官方來源摘要", "趨勢與政策監察"] },
      { title: "活動與專業對話", description: "圍繞明確議題，連接家族、專業人士、機構、學者及社群參與者。", outputs: ["圓桌與論壇", "教育環節", "跨界討論"] },
      { title: "慈善與宗旨", description: "交流責任捐贈、影響力、家族價值、治理和下一代參與。", outputs: ["慈善資源", "社群項目", "宗旨導向對話"] },
      { title: "機構合作", description: "與院校、專業團體、非牟利機構及生態組織，就相關公共利益工作訂立合作範圍。", outputs: ["共同研究", "知識伙伴關係", "聯合教育項目"] },
      { title: "媒體與研究查詢", description: "為記者、研究人員和公共利益查詢提供機構資料、可歸屬背景及來源指引。", outputs: ["機構事實", "來源參考", "訪問或評論要求"] },
    ],
    comparisonHeading: "比較服務範疇",
    comparisonIntro: "下表比較目的、形式和參與方式，並不表示所有形式均持續提供。",
    comparisonHeaders: ["服務範疇", "主要目的", "常見形式", "參與與條款"],
    comparisonRows: [
      ["教育與研究", "解釋家辦架構、治理、政策和市場證據", "指南、研究文章、常見問題", "公開資源可在網上查閱；項目範圍及任何條款會個別確認"],
      ["活動與社群", "連接家族、專業人士、機構和社群參與者", "論壇、圓桌、教育環節", "日期、資格、名額、費用及取消條款視活動公布而定"],
      ["合作與查詢", "支援具體的機構、學術、慈善、媒體或研究工作", "聯合研究、知識伙伴關係、來源指引", "開始前確認是否合適、責任、成果、署名、時間及任何費用"],
    ],
    audienceHeading: "服務對象",
    audiences: ["家族成員與家辦團隊", "專業顧問與金融機構", "院校與研究機構", "慈善與非牟利工作者", "學生與新晉專業人士", "媒體與公共利益研究人員"],
    processHeading: "查詢處理流程",
    process: [
      { title: "1. 界定目的", body: "說明題目、目標受眾、建議形式、時間和參與機構。" },
      { title: "2. 確認是否合適", body: "FOIHK 會檢視要求是否符合機構角色，以及目前是否具備相關能力。" },
      { title: "3. 記錄責任", body: "在適當情況下，以書面確認參與者、證據標準、溝通、成果、署名和參與條款。" },
      { title: "4. 透明發布或交付", body: "公共成果會列明對讀者重要的來源、日期、署名、伙伴和限制。" },
    ],
    boundariesHeading: "重要服務界線",
    boundariesIntro: "FOIHK 是行業機構與專業社群，其網站和公開活動不應被理解為家族辦公室授權或受規管顧問委聘。",
    boundaries: ["不管理、託管或控制家族資產", "不銷售或推薦金融產品", "不提供投資、法律、稅務、會計、信託或移民意見", "不保證活動名額、引薦、商業成果、資金或媒體報道", "會員、參與、合作或提及本身不構成背書"],
    certificationNote: "FOIHK 目前沒有在本網站列出可報讀或頒授的認可專業證書或資格。",
    contactHeading: "商討具體查詢",
    contactBody: "請提供目的、受眾、建議時間、涉及證據或講者，以及機構資料。FOIHK 會確認要求是否符合其角色及目前能力。",
    contactCta: "聯絡 FOIHK",
    credentialsCta: "資歷與認證資料",
  },
  "zh-cn": {
    title: "服务与项目",
    description: "了解 FOIHK 的教育、研究、活动、慈善、机构合作及媒体工作，并查阅清晰的服务范围与界线。",
    intro: "FOIHK 为香港家族办公室生态提供教育、研究、交流、慈善及专业对话活动。每项工作的实际安排须个别确认；本页不宣传受监管金融服务或专业顾问服务。",
    heroAlt: "FOIHK 专业社群与机构交流",
    home: "首页",
    updatedLabel: "最后更新",
    updated: "2026 年 8 月 3 日",
    offeringHeading: "FOIHK 服务与项目",
    offeringIntro: "每项工作均有明确的教育或社群目的。日期、资格、参与者、成果及参与条款，会在相关公布或书面范围中确认。",
    outputLabel: "常见形式",
    offerings: [
      { title: "教育与实用指南", description: "以清晰语言解释家办模式、治理、传承、慈善、专业服务和香港情况。", outputs: ["支柱指南与解说", "定义与比较资源", "常见问题"] },
      { title: "研究与证据整理", description: "以来源为本，整理公共政策、监管指引、生态数据及重要行业发展。", outputs: ["研究文章", "官方来源摘要", "趋势与政策监察"] },
      { title: "活动与专业对话", description: "围绕明确议题，连接家族、专业人士、机构、学者及社群参与者。", outputs: ["圆桌与论坛", "教育环节", "跨界讨论"] },
      { title: "慈善与宗旨", description: "交流责任捐赠、影响力、家族价值、治理和下一代参与。", outputs: ["慈善资源", "社群项目", "宗旨导向对话"] },
      { title: "机构合作", description: "与院校、专业团体、非营利机构及生态组织，就相关公共利益工作订立合作范围。", outputs: ["共同研究", "知识伙伴关系", "联合教育项目"] },
      { title: "媒体与研究查询", description: "为记者、研究人员和公共利益查询提供机构资料、可归属背景及来源指引。", outputs: ["机构事实", "来源参考", "访问或评论要求"] },
    ],
    comparisonHeading: "比较服务范围",
    comparisonIntro: "下表比较目的、形式和参与方式，并不表示所有形式均持续提供。",
    comparisonHeaders: ["服务范围", "主要目的", "常见形式", "参与与条款"],
    comparisonRows: [
      ["教育与研究", "解释家办架构、治理、政策和市场证据", "指南、研究文章、常见问题", "公开资源可在线查阅；项目范围及任何条款会单独确认"],
      ["活动与社群", "连接家族、专业人士、机构和社群参与者", "论坛、圆桌、教育环节", "日期、资格、名额、费用及取消条款视活动公告而定"],
      ["合作与查询", "支持具体的机构、学术、慈善、媒体或研究工作", "联合研究、知识伙伴关系、来源指引", "开始前确认是否合适、责任、成果、署名、时间及任何费用"],
    ],
    audienceHeading: "服务对象",
    audiences: ["家族成员与家办团队", "专业顾问与金融机构", "院校与研究机构", "慈善与非营利工作者", "学生与新晋专业人士", "媒体与公共利益研究人员"],
    processHeading: "查询处理流程",
    process: [
      { title: "1. 界定目的", body: "说明题目、目标受众、建议形式、时间和参与机构。" },
      { title: "2. 确认是否合适", body: "FOIHK 会检视要求是否符合机构角色，以及目前是否具备相关能力。" },
      { title: "3. 记录责任", body: "在适当情况下，以书面确认参与者、证据标准、沟通、成果、署名和参与条款。" },
      { title: "4. 透明发布或交付", body: "公共成果会列明对读者重要的来源、日期、署名、伙伴和限制。" },
    ],
    boundariesHeading: "重要服务界线",
    boundariesIntro: "FOIHK 是行业机构与专业社群，其网站和公开活动不应被理解为家族办公室授权或受监管顾问委聘。",
    boundaries: ["不管理、托管或控制家族资产", "不销售或推荐金融产品", "不提供投资、法律、税务、会计、信托或移民意见", "不保证活动名额、引荐、商业成果、资金或媒体报道", "会员、参与、合作或提及本身不构成背书"],
    certificationNote: "FOIHK 目前没有在本网站列出可报读或颁授的认可专业证书或资格。",
    contactHeading: "商讨具体查询",
    contactBody: "请提供目的、受众、建议时间、涉及证据或讲者，以及机构资料。FOIHK 会确认要求是否符合其角色及目前能力。",
    contactCta: "联系 FOIHK",
    credentialsCta: "资历与认证资料",
  },
};

const Services = () => {
  const { language } = useLanguage();
  const copy = COPY[language];
  const canonical = `${ORGANIZATION_URL}/${language}/services`;
  const serviceList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": copy.offeringHeading,
    "numberOfItems": copy.offerings.length,
    "itemListElement": copy.offerings.map((offering, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Service",
        "name": offering.title,
        "description": offering.description,
        "serviceType": "Family office industry education and professional exchange",
        "areaServed": { "@type": "AdministrativeArea", "name": "Hong Kong" },
        "provider": {
          "@type": "Organization",
          "@id": `${ORGANIZATION_URL}/#organization`,
          "name": ORGANIZATION_ENGLISH_NAME,
          "legalName": ORGANIZATION_LEGAL_NAME,
          "url": ORGANIZATION_URL,
        },
      },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={copy.title}
        description={copy.description}
        structuredData={serviceList}
      />
      <Navigation />
      <main>
        <section className="relative isolate min-h-[360px] overflow-hidden bg-foreground text-background">
          <img src={communityBackground} alt={copy.heroAlt} className="absolute inset-0 h-full w-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-black/55" />
          <div className="container relative mx-auto px-4 py-12">
            <Breadcrumbs items={[{ label: copy.home, to: "/" }, { label: copy.title }]} />
            <div className="max-w-4xl py-8">
              <h1 className="mb-5 text-4xl font-bold text-white sm:text-5xl">{copy.title}</h1>
              <p className="max-w-3xl text-lg leading-8 text-white/90">{copy.intro}</p>
            </div>
          </div>
        </section>

        <section id="services-offerings" className="scroll-mt-24 py-16">
          <div className="container mx-auto px-4">
            <div className="mb-10 max-w-3xl">
              <h2 className="mb-4 text-3xl font-bold text-foreground">{copy.offeringHeading}</h2>
              <p className="leading-8 text-muted-foreground">{copy.offeringIntro}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {copy.offerings.map((offering, index) => {
                const Icon = ICONS[index];
                return (
                  <article key={offering.title} className="rounded-lg border border-border bg-card p-6">
                    <Icon aria-hidden="true" className="mb-5 h-7 w-7 text-primary" />
                    <h3 className="mb-3 text-xl font-semibold text-foreground">{offering.title}</h3>
                    <p className="mb-5 leading-7 text-muted-foreground">{offering.description}</p>
                    <p className="mb-2 text-sm font-semibold text-foreground">{copy.outputLabel}</p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {offering.outputs.map((output) => <li key={output}>• {output}</li>)}
                    </ul>
                  </article>
                );
              })}
            </div>

            <div className="mt-14">
              <h3 className="mb-3 text-2xl font-bold text-foreground">{copy.comparisonHeading}</h3>
              <p className="mb-6 max-w-3xl leading-7 text-muted-foreground">{copy.comparisonIntro}</p>
              <div role="region" aria-label={copy.comparisonHeading} tabIndex={0} className="overflow-x-auto border-y border-border focus:outline-none focus:ring-2 focus:ring-primary">
                <table data-offering-comparison className="w-full min-w-[820px] border-collapse text-left">
                  <thead>
                    <tr className="bg-secondary/40">
                      {copy.comparisonHeaders.map((header) => <th key={header} scope="col" className="border-b border-border px-4 py-4 text-sm font-semibold text-foreground">{header}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {copy.comparisonRows.map((row) => (
                      <tr key={row[0]} className="border-b border-border last:border-b-0">
                        {row.map((cell, index) => index === 0
                          ? <th key={cell} scope="row" className="px-4 py-5 align-top font-semibold text-foreground">{cell}</th>
                          : <td key={cell} className="px-4 py-5 align-top leading-7 text-muted-foreground">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-secondary/25 py-16">
          <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-bold text-foreground">{copy.audienceHeading}</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {copy.audiences.map((audience) => <li key={audience} className="border-l-2 border-primary pl-4 leading-7 text-muted-foreground">{audience}</li>)}
              </ul>
            </div>
            <div>
              <h2 className="mb-6 text-3xl font-bold text-foreground">{copy.processHeading}</h2>
              <ol className="space-y-5">
                {copy.process.map((step) => <li key={step.title}><h3 className="font-semibold text-foreground">{step.title}</h3><p className="mt-1 leading-7 text-muted-foreground">{step.body}</p></li>)}
              </ol>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h2 className="mb-4 text-3xl font-bold text-foreground">{copy.boundariesHeading}</h2>
              <p className="mb-6 leading-8 text-muted-foreground">{copy.boundariesIntro}</p>
              <ul className="space-y-3">
                {copy.boundaries.map((boundary) => <li key={boundary} className="border-l-2 border-destructive/60 pl-4 leading-7 text-muted-foreground">{boundary}</li>)}
              </ul>
              <p className="mt-6 border-l-2 border-primary pl-4 font-medium leading-7 text-foreground">{copy.certificationNote}</p>
            </div>
            <aside className="self-start border-t-4 border-primary bg-secondary/30 p-7">
              <h2 className="mb-3 text-2xl font-bold text-foreground">{copy.contactHeading}</h2>
              <p className="mb-6 leading-7 text-muted-foreground">{copy.contactBody}</p>
              <div className="flex flex-col gap-3">
                <Link to="/contact" className="inline-flex min-h-11 items-center justify-center bg-primary px-5 py-3 font-semibold text-primary-foreground hover:bg-primary/90">{copy.contactCta}</Link>
                <Link to="/credentials" className="inline-flex min-h-11 items-center justify-center border border-border px-5 py-3 font-semibold text-foreground hover:bg-secondary">{copy.credentialsCta}</Link>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Services;
