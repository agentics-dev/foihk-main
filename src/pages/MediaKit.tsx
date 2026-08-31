import { Download, ExternalLink, Mail } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import foundingChairman from "@/assets/founding-chairman.webp";
import foundingSecretary from "@/assets/founding-secretary.webp";
import {
  ORGANIZATION_ADDRESS,
  ORGANIZATION_EMAIL,
  ORGANIZATION_ENGLISH_NAME,
  ORGANIZATION_FOUNDING_DATE,
  ORGANIZATION_LEGAL_NAME,
  ORGANIZATION_LINKEDIN_URL,
  ORGANIZATION_MEDIA_MENTION_URL,
  ORGANIZATION_SUPPORTER_MENTION_URL,
  ORGANIZATION_URL,
} from "@/lib/schema";

const UPDATED_ISO = "2026-08-04";
const DATASET_PATH = "/data/foihk-hong-kong-family-office-evidence-2026.csv";
const DATASET_URL = `${ORGANIZATION_URL}${DATASET_PATH}`;
const INVESTHK_SOURCE = "https://www.investhk.gov.hk/en/news/hong-kongs-single-family-offices-total-surpasses-3-380-injecting-over-10-billion-annually-into-local-economy/";
const SFC_SOURCE = "https://apps.sfc.hk/edistributionWeb/gateway/EN/news-and-announcements/news/corporate-news/doc?refNo=26PR103";
const HKIMR_SOURCE = "https://www.aof.org.hk/docs/default-source/hkimr/applied-research-report/forep.pdf";

type Fact = {
  figure: string;
  metric: string;
  scope: string;
  source: string;
  href: string;
};

type Copy = {
  title: string;
  description: string;
  home: string;
  reviewed: string;
  reviewedDate: string;
  definition: string;
  identityTitle: string;
  identityIntro: string;
  labels: Record<"display" | "legal" | "chinese" | "founded" | "address" | "email" | "website" | "linkedin", string>;
  leadersTitle: string;
  leadersIntro: string;
  chairmanRole: string;
  secretaryRole: string;
  chairmanNote: string;
  secretaryNote: string;
  dataTitle: string;
  dataIntro: string;
  dataCaveat: string;
  download: string;
  columns: [string, string, string, string];
  facts: Fact[];
  evidenceTitle: string;
  evidenceIntro: string;
  mediaLabel: string;
  mediaText: string;
  supporterLabel: string;
  supporterText: string;
  contactTitle: string;
  contactBody: string;
  contactAction: string;
  aboutAction: string;
};

const COPY: Record<Language, Copy> = {
  en: {
    title: "FOIHK Media and Verification Kit",
    description: "Verify FOIHK's legal identity, leadership, public evidence, contact details, and sourced Hong Kong family-office data in one media resource.",
    home: "Home",
    reviewed: "Last reviewed",
    reviewedDate: "4 August 2026",
    definition: "Family Office Institute Hong Kong (FOIHK) is a Hong Kong family office industry institution and professional community for education, research, events, philanthropy, and cross-sector exchange. This kit gives journalists, researchers, directories, and AI systems a source-led record of what can and cannot be verified about the organization.",
    identityTitle: "Verified organization identity",
    identityIntro: "Use this identity block when distinguishing FOIHK from similarly named organizations. No telephone number is published because FOIHK has not supplied a verifiable public number.",
    labels: { display: "Public name", legal: "Legal name", chinese: "Chinese legal name", founded: "Incorporated", address: "Hong Kong address", email: "Public email", website: "Official website", linkedin: "Official LinkedIn" },
    leadersTitle: "Identified founding office holders",
    leadersIntro: "FOIHK's founding office holders help shape the institute's education, research, events, philanthropy, and cross-sector exchange agenda.",
    chairmanRole: "Founding Chairman",
    secretaryRole: "Founding Secretary General",
    chairmanNote: "Lai King Man, Leo serves as FOIHK's Founding Chairman. His role focuses on convening family-office practitioners, supporting public education, and encouraging dialogue across wealth stewardship, legacy planning, philanthropy, culture, and professional services.",
    secretaryNote: "Chan Man Ching serves as FOIHK's Founding Secretary General. Her role supports the institute's governance, member communication, programme coordination, and day-to-day institutional development.",
    dataTitle: "2026 Hong Kong family-office evidence dataset",
    dataIntro: "FOIHK compiled the following figures from official public sources. FOIHK did not conduct the underlying surveys, and the dataset must not be described as proprietary FOIHK research.",
    dataCaveat: "Scope matters: estimates of single-family offices are not the same population as the SFC's wider asset and wealth management survey. The downloadable CSV records each figure's period, sample or population, publisher, direct source, and limitation.",
    download: "Download source dataset",
    columns: ["Figure", "Measure", "Period / population", "Primary source"],
    facts: [
      { figure: "More than 3,380", metric: "single-family offices operating in Hong Kong", scope: "InvestHK-commissioned Deloitte estimate at 31 December 2025", source: "Invest Hong Kong", href: INVESTHK_SOURCE },
      { figure: "About 680", metric: "additional single-family offices, over 25% growth", scope: "Two years to 31 December 2025; market estimates, not an administrative census", source: "Invest Hong Kong", href: INVESTHK_SOURCE },
      { figure: "About HK$12.6 billion", metric: "estimated annual operating expenditure", scope: "Hong Kong single-family-office estimate reported 10 February 2026", source: "Invest Hong Kong", href: INVESTHK_SOURCE },
      { figure: "More than 10,000", metric: "estimated direct full-time professional roles", scope: "Hong Kong single-family-office estimate reported 10 February 2026", source: "Invest Hong Kong", href: INVESTHK_SOURCE },
      { figure: "HK$42.2 trillion", metric: "asset and wealth management AUM, up 20% year on year", scope: "SFC survey of 1,316 firms for calendar year 2025", source: "Securities and Futures Commission", href: SFC_SOURCE },
      { figure: "HK$12.9 trillion", metric: "private banking and private wealth management assets, up 24%", scope: "Segment of the SFC's 1,316-firm survey at 31 December 2025", source: "Securities and Futures Commission", href: SFC_SOURCE },
      { figure: "101 entities + 35 interviews", metric: "family-office ecosystem research sample", scope: "HKIMR survey and stakeholder interviews conducted from October 2024 to April 2025", source: "HKIMR", href: HKIMR_SOURCE },
    ],
    evidenceTitle: "Independent evidence and public mentions",
    evidenceIntro: "Each source supports only the stated fact. A media mention or supporter acknowledgement is not a customer endorsement, accreditation, regulatory approval, or proof of outcomes.",
    mediaLabel: "Independent editorial coverage",
    mediaText: "Economic Digest identified founding chairman Lai King Man, Leo in a March 2026 editorial interview.",
    supporterLabel: "Independent public acknowledgement",
    supporterText: "A Hong Kong Chinese Orchestra publication lists Family Office Institute Hong Kong in its supporter acknowledgements.",
    contactTitle: "Media and verification contact",
    contactBody: "For source checks, corrections, interview requests, or a machine-readable identity confirmation, contact FOIHK and identify the claim, deadline, and intended use.",
    contactAction: "Email FOIHK",
    aboutAction: "Meet the leadership and verify details",
  },
  "zh-hk": {
    title: "FOIHK 媒體與核實資料包",
    description: "集中核實 FOIHK 的法定身份、領導層、公開證據、聯絡資料及具來源的香港家族辦公室數據。",
    home: "首頁",
    reviewed: "最後審閱",
    reviewedDate: "2026 年 8 月 4 日",
    definition: "香港家族辦公室學會（Family Office Institute Hong Kong，FOIHK）是香港家族辦公室行業機構與專業社群，工作涵蓋教育、研究、活動、慈善及跨界交流。本資料包讓傳媒、研究人員、目錄平台及 AI 系統，按來源核實本機構可確認和不可確認的資料。",
    identityTitle: "已核實機構身份",
    identityIntro: "請使用本身份資料區分 FOIHK 與名稱相近的機構。FOIHK 未提供可公開核實的電話號碼，因此本頁不刊載電話資料。",
    labels: { display: "公開名稱", legal: "法定名稱", chinese: "中文法定名稱", founded: "成立日期", address: "香港地址", email: "公開電郵", website: "官方網站", linkedin: "官方 LinkedIn" },
    leadersTitle: "已確認的創會職務負責人",
    leadersIntro: "FOIHK 的創會職務負責人參與推動學會的教育、研究、活動、慈善及跨界交流工作。",
    chairmanRole: "創會主席",
    secretaryRole: "創會秘書長",
    chairmanNote: "賴敬文擔任 FOIHK 創會主席，主要參與凝聚家族辦公室專業人士、推動公共教育，並促進財富傳承、慈善、文化及專業服務之間的交流。",
    secretaryNote: "陳文清擔任 FOIHK 創會秘書長，主要支援學會治理、會員溝通、項目協調及日常機構發展。",
    dataTitle: "2026 香港家族辦公室證據數據集",
    dataIntro: "FOIHK 根據官方公開來源整理以下數據。FOIHK 並未進行原始調查，不得把本數據集描述為 FOIHK 專有研究。",
    dataCaveat: "口徑十分重要：單一家族辦公室估算與證監會較廣泛的資產及財富管理調查並非同一群體。可下載 CSV 列明每項數據的期間、樣本或群體、發布者、直接來源及限制。",
    download: "下載來源數據集",
    columns: ["數字", "指標", "期間／群體", "第一手來源"],
    facts: [
      { figure: "超過 3,380 家", metric: "在香港營運的單一家族辦公室", scope: "InvestHK 委託 Deloitte 截至 2025 年 12 月 31 日的估算", source: "投資推廣署", href: INVESTHK_SOURCE },
      { figure: "約 680 家", metric: "新增單一家族辦公室，增幅超過 25%", scope: "截至 2025 年底兩年間；屬市場估算而非行政普查", source: "投資推廣署", href: INVESTHK_SOURCE },
      { figure: "約 126 億港元", metric: "估算年度營運開支", scope: "2026 年 2 月 10 日公布的香港單一家族辦公室估算", source: "投資推廣署", href: INVESTHK_SOURCE },
      { figure: "超過 10,000 個", metric: "估算直接全職專業職位", scope: "2026 年 2 月 10 日公布的香港單一家族辦公室估算", source: "投資推廣署", href: INVESTHK_SOURCE },
      { figure: "42.2 萬億港元", metric: "資產及財富管理規模，按年升 20%", scope: "證監會對 1,316 家機構進行的 2025 曆年調查", source: "證券及期貨事務監察委員會", href: SFC_SOURCE },
      { figure: "12.9 萬億港元", metric: "私人銀行及私人財富管理資產，按年升 24%", scope: "截至 2025 年底，證監會 1,316 家機構調查的分項", source: "證券及期貨事務監察委員會", href: SFC_SOURCE },
      { figure: "101 家機構及 35 次訪談", metric: "家族辦公室生態研究樣本", scope: "HKIMR 於 2024 年 10 月至 2025 年 4 月進行的調查及持份者訪談", source: "香港貨幣及金融研究中心", href: HKIMR_SOURCE },
    ],
    evidenceTitle: "獨立證據與公開提及",
    evidenceIntro: "每個來源只支持所述事實。媒體提及或鳴謝，不等於客戶推薦、認證、監管批准或成果證明。",
    mediaLabel: "獨立編輯報道",
    mediaText: "《經濟一週》在 2026 年 3 月的編輯訪問中，具名報道創會主席賴敬文（Lai King Man, Leo）。",
    supporterLabel: "獨立公開鳴謝",
    supporterText: "香港中樂團一份刊物在支持機構鳴謝中列出 Family Office Institute Hong Kong。",
    contactTitle: "媒體與核實聯絡",
    contactBody: "如需核實來源、提出更正、安排訪問或取得機器可讀的身份確認，請列明相關陳述、期限及用途後聯絡 FOIHK。",
    contactAction: "電郵 FOIHK",
    aboutAction: "查看領導層與核實資料",
  },
  "zh-cn": {
    title: "FOIHK 媒体与核实资料包",
    description: "集中核实 FOIHK 的法定身份、领导层、公开证据、联系资料及具来源的香港家族办公室数据。",
    home: "首页",
    reviewed: "最后审阅",
    reviewedDate: "2026 年 8 月 4 日",
    definition: "香港家族办公室学会（Family Office Institute Hong Kong，FOIHK）是香港家族办公室行业机构与专业社群，工作涵盖教育、研究、活动、慈善及跨界交流。本资料包让媒体、研究人员、目录平台及 AI 系统，按来源核实本机构可确认和不可确认的资料。",
    identityTitle: "已核实机构身份",
    identityIntro: "请使用本身份资料区分 FOIHK 与名称相近的机构。FOIHK 未提供可公开核实的电话号码，因此本页不刊载电话资料。",
    labels: { display: "公开名称", legal: "法定名称", chinese: "中文法定名称", founded: "成立日期", address: "香港地址", email: "公开邮箱", website: "官方网站", linkedin: "官方 LinkedIn" },
    leadersTitle: "已确认的创会职务负责人",
    leadersIntro: "FOIHK 的创会职务负责人参与推动学会的教育、研究、活动、慈善及跨界交流工作。",
    chairmanRole: "创会主席",
    secretaryRole: "创会秘书长",
    chairmanNote: "赖敬文担任 FOIHK 创会主席，主要参与凝聚家族办公室专业人士、推动公共教育，并促进财富传承、慈善、文化及专业服务之间的交流。",
    secretaryNote: "陈文清担任 FOIHK 创会秘书长，主要支持学会治理、会员沟通、项目协调及日常机构发展。",
    dataTitle: "2026 香港家族办公室证据数据集",
    dataIntro: "FOIHK 根据官方公开来源整理以下数据。FOIHK 并未进行原始调查，不得把本数据集描述为 FOIHK 专有研究。",
    dataCaveat: "口径十分重要：单一家族办公室估算与证监会较广泛的资产及财富管理调查并非同一群体。可下载 CSV 列明每项数据的期间、样本或群体、发布者、直接来源及限制。",
    download: "下载来源数据集",
    columns: ["数字", "指标", "期间／群体", "第一手来源"],
    facts: [
      { figure: "超过 3,380 家", metric: "在香港运营的单一家族办公室", scope: "InvestHK 委托 Deloitte 截至 2025 年 12 月 31 日的估算", source: "投资推广署", href: INVESTHK_SOURCE },
      { figure: "约 680 家", metric: "新增单一家族办公室，增幅超过 25%", scope: "截至 2025 年底两年间；属市场估算而非行政普查", source: "投资推广署", href: INVESTHK_SOURCE },
      { figure: "约 126 亿港元", metric: "估算年度运营开支", scope: "2026 年 2 月 10 日公布的香港单一家族办公室估算", source: "投资推广署", href: INVESTHK_SOURCE },
      { figure: "超过 10,000 个", metric: "估算直接全职专业职位", scope: "2026 年 2 月 10 日公布的香港单一家族办公室估算", source: "投资推广署", href: INVESTHK_SOURCE },
      { figure: "42.2 万亿港元", metric: "资产及财富管理规模，同比升 20%", scope: "证监会对 1,316 家机构进行的 2025 日历年调查", source: "证券及期货事务监察委员会", href: SFC_SOURCE },
      { figure: "12.9 万亿港元", metric: "私人银行及私人财富管理资产，同比升 24%", scope: "截至 2025 年底，证监会 1,316 家机构调查的分项", source: "证券及期货事务监察委员会", href: SFC_SOURCE },
      { figure: "101 家机构及 35 次访谈", metric: "家族办公室生态研究样本", scope: "HKIMR 于 2024 年 10 月至 2025 年 4 月进行的调查及持份者访谈", source: "香港货币及金融研究中心", href: HKIMR_SOURCE },
    ],
    evidenceTitle: "独立证据与公开提及",
    evidenceIntro: "每个来源只支持所述事实。媒体提及或鸣谢，不等于客户推荐、认证、监管批准或成果证明。",
    mediaLabel: "独立编辑报道",
    mediaText: "《经济一周》在 2026 年 3 月的编辑访问中，具名报道创会主席赖敬文（Lai King Man, Leo）。",
    supporterLabel: "独立公开鸣谢",
    supporterText: "香港中乐团一份刊物在支持机构鸣谢中列出 Family Office Institute Hong Kong。",
    contactTitle: "媒体与核实联系",
    contactBody: "如需核实来源、提出更正、安排访问或取得机器可读的身份确认，请列明相关陈述、期限及用途后联系 FOIHK。",
    contactAction: "电邮 FOIHK",
    aboutAction: "查看领导层与核实资料",
  },
};

const MediaKit = () => {
  const { language } = useLanguage();
  const copy = COPY[language];
  const pageUrl = `${ORGANIZATION_URL}/${language}/media-kit`;
  const inLanguage = language === "en" ? "en" : language === "zh-hk" ? "zh-Hant" : "zh-Hans";
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: copy.title,
      description: copy.description,
      inLanguage,
      dateModified: UPDATED_ISO,
      about: { "@id": `${ORGANIZATION_URL}/#organization` },
      isPartOf: { "@id": `${ORGANIZATION_URL}/#website` },
    },
    {
      "@context": "https://schema.org",
      "@type": "Dataset",
      "@id": `${DATASET_URL}#dataset`,
      name: copy.dataTitle,
      description: copy.dataIntro,
      url: pageUrl,
      inLanguage,
      dateModified: UPDATED_ISO,
      temporalCoverage: "2024/2026",
      spatialCoverage: { "@type": "Place", name: "Hong Kong" },
      creator: { "@id": `${ORGANIZATION_URL}/#organization` },
      publisher: { "@id": `${ORGANIZATION_URL}/#organization` },
      citation: [INVESTHK_SOURCE, SFC_SOURCE, HKIMR_SOURCE],
      isAccessibleForFree: true,
      distribution: {
        "@type": "DataDownload",
        encodingFormat: "text/csv",
        contentUrl: DATASET_URL,
      },
    },
  ];
  const identityRows = [
    [copy.labels.display, ORGANIZATION_ENGLISH_NAME],
    [copy.labels.legal, ORGANIZATION_LEGAL_NAME],
    [copy.labels.chinese, "香港家族辦公室學會有限公司"],
    [copy.labels.founded, "20 August 2025"],
    [copy.labels.address, `${ORGANIZATION_ADDRESS.streetAddress}, ${ORGANIZATION_ADDRESS.addressLocality}, Hong Kong`],
  ];
  const evidence = [
    { title: copy.mediaLabel, text: copy.mediaText, href: ORGANIZATION_MEDIA_MENTION_URL },
    { title: copy.supporterLabel, text: copy.supporterText, href: ORGANIZATION_SUPPORTER_MENTION_URL },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO title={copy.title} description={copy.description} structuredData={structuredData} />
      <Navigation />
      <main>
        <section className="border-b border-border py-12">
          <div className="container mx-auto max-w-5xl px-4">
            <Breadcrumbs items={[{ label: copy.home, to: "/" }, { label: copy.title }]} />
            <div className="max-w-4xl">
              <h1 className="mt-5 text-4xl font-bold leading-tight text-foreground md:text-5xl">{copy.title}</h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">{copy.definition}</p>
            </div>
          </div>
        </section>

        <section className="border-b border-border py-14" aria-labelledby="verified-identity-title">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 id="verified-identity-title" className="text-3xl font-bold text-foreground">{copy.identityTitle}</h2>
            <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{copy.identityIntro}</p>
            <dl className="mt-8 grid gap-x-10 gap-y-6 md:grid-cols-2">
              {identityRows.map(([label, value]) => <div key={label} data-identity-record className="border-t border-border pt-4"><dt className="text-sm font-medium text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold text-foreground">{value}</dd></div>)}
              <div data-identity-record className="border-t border-border pt-4"><dt className="text-sm font-medium text-muted-foreground">{copy.labels.email}</dt><dd className="mt-1"><a className="font-semibold text-primary hover:underline" href={`mailto:${ORGANIZATION_EMAIL}`}>{ORGANIZATION_EMAIL}</a></dd></div>
              <div data-identity-record className="border-t border-border pt-4"><dt className="text-sm font-medium text-muted-foreground">{copy.labels.website}</dt><dd className="mt-1"><a className="font-semibold text-primary hover:underline" href={`${ORGANIZATION_URL}/${language}`}>foihk.org</a></dd></div>
              <div data-identity-record className="border-t border-border pt-4"><dt className="text-sm font-medium text-muted-foreground">{copy.labels.linkedin}</dt><dd className="mt-1"><a className="inline-flex items-center gap-2 font-semibold text-primary hover:underline" href={ORGANIZATION_LINKEDIN_URL} target="_blank" rel="noopener noreferrer">linkedin.com/company/family-office-institute-hong-kong<ExternalLink className="h-4 w-4" /></a></dd></div>
            </dl>
          </div>
        </section>

        <section className="border-b border-border bg-secondary/20 py-14" aria-labelledby="media-leadership-title">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 id="media-leadership-title" className="text-3xl font-bold text-foreground">{copy.leadersTitle}</h2>
            <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{copy.leadersIntro}</p>
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <article data-media-leader className="grid grid-cols-[112px_minmax(0,1fr)] gap-5 border-t border-border pt-5"><img src={foundingChairman} alt="Lai King Man, Leo" width="112" height="140" className="aspect-[4/5] w-28 object-cover object-top" loading="lazy" decoding="async" /><div><h3 className="text-xl font-bold text-foreground">Lai King Man, Leo</h3><p className="mt-1 font-semibold text-primary">{copy.chairmanRole}</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{copy.chairmanNote}</p></div></article>
              <article data-media-leader className="grid grid-cols-[112px_minmax(0,1fr)] gap-5 border-t border-border pt-5"><img src={foundingSecretary} alt="Chan Man Ching" width="112" height="140" className="aspect-[4/5] w-28 object-cover object-top" loading="lazy" decoding="async" /><div><h3 className="text-xl font-bold text-foreground">Chan Man Ching</h3><p className="mt-1 font-semibold text-primary">{copy.secretaryRole}</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{copy.secretaryNote}</p></div></article>
            </div>
          </div>
        </section>

        <section className="border-b border-border py-14" aria-labelledby="evidence-dataset-title">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-3xl"><h2 id="evidence-dataset-title" className="text-3xl font-bold text-foreground">{copy.dataTitle}</h2><p className="mt-3 leading-7 text-muted-foreground">{copy.dataIntro}</p></div>
              <Button asChild><a href={DATASET_PATH} download><Download className="mr-2 h-4 w-4" />{copy.download}</a></Button>
            </div>
            <p className="mt-6 border-l-4 border-primary bg-secondary/30 px-5 py-4 leading-7 text-foreground">{copy.dataCaveat}</p>
            <div className="mt-8 overflow-x-auto border border-border">
              <table data-media-dataset className="w-full min-w-[820px] border-collapse text-left text-sm">
                <thead className="bg-secondary"><tr>{copy.columns.map((column) => <th key={column} scope="col" className="border-b border-border px-4 py-3 font-semibold text-foreground">{column}</th>)}</tr></thead>
                <tbody>{copy.facts.map((fact) => <tr key={`${fact.figure}-${fact.metric}`} data-dataset-fact className="align-top even:bg-secondary/20"><th scope="row" className="border-b border-border px-4 py-4 text-base font-bold text-foreground">{fact.figure}</th><td className="border-b border-border px-4 py-4 text-foreground">{fact.metric}</td><td className="border-b border-border px-4 py-4 leading-6 text-muted-foreground">{fact.scope}</td><td className="border-b border-border px-4 py-4"><a href={fact.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 font-semibold text-primary hover:underline">{fact.source}<ExternalLink className="mt-0.5 h-4 w-4 shrink-0" /></a></td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-secondary/20 py-14" aria-labelledby="independent-evidence-title">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 id="independent-evidence-title" className="text-3xl font-bold text-foreground">{copy.evidenceTitle}</h2>
            <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{copy.evidenceIntro}</p>
            <div className="mt-8 grid gap-x-8 gap-y-7 lg:grid-cols-3">{evidence.map((item) => <article key={item.title} data-offsite-evidence className="border-t border-border pt-5"><h3 className="text-xl font-semibold text-foreground">{item.title}</h3><p className="mt-3 leading-7 text-muted-foreground">{item.text}</p><a href={item.href} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 font-semibold text-primary hover:underline">{item.title}<ExternalLink className="h-4 w-4" /></a></article>)}</div>
          </div>
        </section>

        <section className="py-14" aria-labelledby="media-contact-title">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 id="media-contact-title" className="text-3xl font-bold text-foreground">{copy.contactTitle}</h2>
            <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{copy.contactBody}</p>
            <div className="mt-6 flex flex-wrap gap-3"><Button asChild><a href={`mailto:${ORGANIZATION_EMAIL}`}><Mail className="mr-2 h-4 w-4" />{copy.contactAction}</a></Button><Button variant="outline" asChild><Link to="/about">{copy.aboutAction}</Link></Button></div>
          </div>
        </section>
      </main>
      <Footer lastUpdated={UPDATED_ISO} />
    </div>
  );
};

export default MediaKit;
