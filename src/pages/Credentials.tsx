import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  FileCheck2,
  Search,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import missionBackground from "@/assets/mission-bg.webp";
import {
  ORGANIZATION_EMAIL,
  ORGANIZATION_ENGLISH_NAME,
  ORGANIZATION_FOUNDING_DATE,
  ORGANIZATION_LEGAL_NAME,
  ORGANIZATION_SAME_AS,
  ORGANIZATION_MEDIA_MENTION_URL,
  ORGANIZATION_URL,
  ORGANIZATION_WIKIDATA_ENTITY_ID,
  ORGANIZATION_WIKIDATA_URL,
} from "@/lib/schema";

interface CredentialCopy {
  title: string;
  description: string;
  intro: string;
  heroAlt: string;
  home: string;
  updatedLabel: string;
  updated: string;
  statusHeading: string;
  statusBody: string;
  noCertification: string;
  impactHeading: string;
  impactTitle: string;
  impactBody: string;
  impactCta: string;
  verifiedHeading: string;
  verifiedItems: Array<{ title: string; value: string; detail: string; href?: string; linkLabel?: string }>;
  leadersHeading: string;
  leadersIntro: string;
  leaders: Array<{ name: string; alternateName: string; role: string; evidence: string; href?: string; linkLabel?: string }>;
  notCredentialHeading: string;
  notCredentialIntro: string;
  notCredentials: string[];
  futureHeading: string;
  futureIntro: string;
  futureRequirements: string[];
  verifyHeading: string;
  verifySteps: Array<{ title: string; body: string }>;
  legalStatusHeading: string;
  legalStatusBody: string;
  correctionHeading: string;
  correctionBody: string;
  contactCta: string;
  guideCta: string;
}

const UPDATED_ISO = "2026-08-04";
const SDG_ACCREDITATION_SLUG = "news-release-family-office-institute-hong-kong-awarded-sdg-esg-certified-impact-activity-center-accreditation-by-sdg-world-records";

const COPY: Record<Language, CredentialCopy> = {
  en: {
    title: "Credentials and Certification Information",
    description: "Verify FOIHK's legal identity, leadership roles, public evidence, certification status, and standards for any future credential or qualification claim.",
    intro: "This page separates verifiable FOIHK institutional facts from professional qualifications and certification claims. FOIHK publishes only credentials that can be tied to an identifiable issuer, person, standard, and current source.",
    heroAlt: "FOIHK institutional purpose and credential verification",
    home: "Home",
    updatedLabel: "Last updated",
    updated: "4 August 2026",
    statusHeading: "Current certification status",
    statusBody: "FOIHK does not currently list an accredited professional qualification, designation, licence, or certification available for enrolment or award on this website. Its public offerings are education, research, events, philanthropy, and professional exchange.",
    noCertification: "Event attendance, speaking, collaboration, media coverage, and community participation must not be represented as an accredited FOIHK certification.",
    impactHeading: "Institutional accreditation note",
    impactTitle: "Family Office Institute Hong Kong Awarded SDG-ESG Certified Impact Activity Center Accreditation by SDG World Records",
    impactBody: "FOIHK's 11 June 2026 news release states that the institute was awarded SDG-ESG Certified Impact Activity Center accreditation by SDG World Records. This is presented as an institutional activity-center accreditation and should not be described as an FOIHK professional qualification, licence, or enrolment-based certification.",
    impactCta: "Read the news release",
    verifiedHeading: "Publicly verifiable institutional information",
    verifiedItems: [
      { title: "Legal identity", value: ORGANIZATION_LEGAL_NAME, detail: "FOIHK publishes its legal name and incorporation date as part of its public institutional profile." },
      { title: "Leadership public mention", value: "Lai King Man, Leo", detail: "Economic Digest publicly named FOIHK's Founding Chairman in March 2026 coverage. FOIHK treats this as evidence of public identification, not as a credential, endorsement, or outcome claim.", href: ORGANIZATION_MEDIA_MENTION_URL, linkLabel: "View the independent source" },
      { title: "Public identity", value: ORGANIZATION_ENGLISH_NAME, detail: "The public institutional name used with the abbreviation FOIHK and official domain foihk.org." },
      { title: "Established", value: "20 August 2025", detail: "The founding date consistently published by FOIHK. Independent register checks should be used where legal reliance is required." },
      { title: "Accountability channel", value: ORGANIZATION_EMAIL, detail: "The public address for identity questions, source checks, corrections, and institutional enquiries." },
    ],
    leadersHeading: "Publicly identified founding office holders",
    leadersIntro: "Roles are shown only where FOIHK identifies the person and role. Matching names found elsewhere are not used to infer degrees, licences, employers, or professional qualifications.",
    leaders: [
      { name: "Lai King Man, Leo", alternateName: "賴敬文", role: "Founding Chairman", evidence: "Lai King Man, Leo serves as FOIHK's Founding Chairman, helping convene family-office practitioners and support education, philanthropy, cultural exchange, and professional dialogue." },
      { name: "Chan Man Ching", alternateName: "陳文清", role: "Founding Secretary General", evidence: "Chan Man Ching serves as FOIHK's Founding Secretary General, supporting governance, member communication, programme coordination, and day-to-day institutional development." },
    ],
    notCredentialHeading: "What does not prove a credential",
    notCredentialIntro: "A credential claim needs more than association with an organization. The following signals can provide context but do not, by themselves, prove competence, authorization, or certification.",
    notCredentials: ["Attendance at an event or seminar", "A speaker, moderator, sponsor, partner, or member label", "A photograph, social post, media mention, or award", "Use of family-office terminology in a job title or company name", "A logo displayed without the issuer's verification record"],
    futureHeading: "Standard for any future FOIHK credential",
    futureIntro: "Before any future certificate, micro-credential, or professional designation is promoted, its public page should disclose all of the following.",
    futureRequirements: ["Issuing legal entity and accountable contact", "Learning outcomes and target audience", "Entry requirements and required study hours", "Assessment method, passing standard, and reassessment rules", "Instructor and reviewer identities with verified qualifications", "Accreditation or recognition body, including a direct verification link", "Issue date, expiry or continuing-education rules, and revocation process", "Unique credential identifier and a privacy-respecting verification method", "Fees, refund terms, complaints, appeals, and conflicts of interest"],
    verifyHeading: "How to verify a credential or qualification",
    verifySteps: [
      { title: "1. Identify the exact claim", body: "Record the credential name, holder, issuer, issue date, identifier, and claimed status." },
      { title: "2. Check the issuer", body: "Use the issuer's official domain or register rather than a screenshot, forwarded PDF, or social profile." },
      { title: "3. Check recognition", body: "Confirm whether a named accreditor or regulator actually recognizes the program, issuer, activity, or individual." },
      { title: "4. Match the scope", body: "A course completion certificate does not establish a licence to perform regulated, legal, tax, accounting, or trust work." },
      { title: "5. Confirm current status", body: "Check expiry, continuing requirements, suspension, revocation, and whether the credential belongs to the same person or entity." },
    ],
    legalStatusHeading: "Legal and nonprofit-status clarification",
    legalStatusBody: "FOIHK's published legal name includes “Limited”. This page does not claim that FOIHK is a registered charity, tax-exempt body, statutory body, regulator, university, or accredited awarding organization. Any such status must be supported by the relevant official register or authorizing body before publication.",
    correctionHeading: "Report an inaccurate credential claim",
    correctionBody: "Send the page, exact wording, relevant person or organization, and a primary verification source to FOIHK. Confirmed material errors will be reviewed under the editorial policy.",
    contactCta: "Request verification",
    guideCta: "Read the definitive institute guide",
  },
  "zh-hk": {
    title: "資歷與認證資料",
    description: "核實 FOIHK 的法定身份、領導職務、公開證據、認證狀態，以及未來任何證書或資格陳述應遵守的標準。",
    intro: "本頁區分可核實的 FOIHK 機構事實、個人專業資格與認證陳述。FOIHK 只會發布可連結至明確頒發者、人士、標準和現行來源的資歷資料。",
    heroAlt: "FOIHK 機構宗旨與資歷核實",
    home: "首頁",
    updatedLabel: "最後更新",
    updated: "2026 年 8 月 4 日",
    statusHeading: "目前認證狀態",
    statusBody: "FOIHK 目前沒有在本網站列出可報讀或頒授的認可專業資格、名銜、牌照或證書。其公開工作屬教育、研究、活動、慈善和專業交流。",
    noCertification: "出席活動、擔任講者、合作、媒體報道和社群參與，不得被表述為獲得 FOIHK 認可專業證書。",
    impactHeading: "機構認證說明",
    impactTitle: "香港家族辦公室學會榮獲 SDG World Records 頒授 SDG-ESG Certified Impact Activity Center Accreditation",
    impactBody: "FOIHK 於 2026 年 6 月 11 日發布新聞公告，列明學會獲 SDG World Records 頒授 SDG-ESG Certified Impact Activity Center accreditation。此項資料屬機構活動中心認證說明，不應被描述為 FOIHK 個人專業資格、牌照或可報讀證書。",
    impactCta: "閱讀新聞公告",
    verifiedHeading: "可公開核實的機構資料",
    verifiedItems: [
      { title: "法定身份", value: ORGANIZATION_LEGAL_NAME, detail: "FOIHK 在公開機構資料中列出其法定名稱及成立日期。" },
      { title: "領導角色公開提及", value: "賴敬文", detail: "《經濟一週》於 2026 年 3 月公開具名提及 FOIHK 創會主席。FOIHK 僅把此視為公開識別證據，不視為資歷、推薦或成果陳述。", href: ORGANIZATION_MEDIA_MENTION_URL, linkLabel: "查看獨立來源" },
      { title: "公開身份", value: ORGANIZATION_ENGLISH_NAME, detail: "使用 FOIHK 縮寫及官方網域 foihk.org 的公開機構名稱。" },
      { title: "成立日期", value: "2025 年 8 月 20 日", detail: "FOIHK 一致公布的成立日期；涉及法律依賴時，應另行查閱獨立官方登記。" },
      { title: "問責渠道", value: ORGANIZATION_EMAIL, detail: "用於身份查詢、來源核實、更正及機構查詢的公開電郵。" },
    ],
    leadersHeading: "公開確認的創會職務負責人",
    leadersIntro: "只有 FOIHK 已確認的人士與職務才會列出。不會利用其他地方的同名人士，推斷學歷、牌照、僱主或專業資格。",
    leaders: [
      { name: "Lai King Man, Leo", alternateName: "賴敬文", role: "創會主席", evidence: "賴敬文擔任 FOIHK 創會主席，參與凝聚家族辦公室專業人士，並支持教育、慈善、文化交流及專業對話。" },
      { name: "Chan Man Ching", alternateName: "陳文清", role: "創會秘書長", evidence: "陳文清擔任 FOIHK 創會秘書長，支援學會治理、會員溝通、項目協調及日常機構發展。" },
    ],
    notCredentialHeading: "哪些資料不能證明資歷",
    notCredentialIntro: "資歷陳述不能只建基於與某機構的關聯。以下資料可提供背景，但本身不能證明能力、授權或認證。",
    notCredentials: ["出席活動或研討會", "講者、主持、贊助、伙伴或會員標籤", "照片、社交帖文、媒體提及或獎項", "在職銜或公司名稱中使用家族辦公室用語", "展示標誌但沒有頒發者核實紀錄"],
    futureHeading: "未來 FOIHK 資歷的公開標準",
    futureIntro: "未來如推廣任何證書、微證書或專業名銜，其公開頁面應披露以下全部資料。",
    futureRequirements: ["頒發法律實體與問責聯絡方式", "學習成果與目標對象", "入讀要求與必修時數", "評核方式、合格標準與重考規則", "導師與審閱者身份及已核實資格", "認證或承認機構及直接核實連結", "簽發日期、到期或持續進修要求與撤銷程序", "獨有資歷編號及保障私隱的核實方式", "費用、退款、投訴、上訴及利益衝突"],
    verifyHeading: "如何核實資歷或資格",
    verifySteps: [
      { title: "1. 識別準確陳述", body: "記錄資歷名稱、持有人、頒發者、日期、編號和所聲稱狀態。" },
      { title: "2. 核實頒發者", body: "使用頒發者官方網域或登記，不依賴截圖、轉寄 PDF 或社交帳戶。" },
      { title: "3. 核實承認狀態", body: "確認所指認證機構或監管機構，是否真的承認相關課程、頒發者、活動或人士。" },
      { title: "4. 配對資格範圍", body: "完成課程的證書，不代表獲准進行受規管、法律、稅務、會計或信託工作。" },
      { title: "5. 確認現行狀態", body: "查核到期、持續要求、暫停、撤銷，以及資歷是否屬於同一人士或實體。" },
    ],
    legalStatusHeading: "法律與非牟利身份釐清",
    legalStatusBody: "FOIHK 公布的法定名稱包含「Limited」。本頁不聲稱 FOIHK 是註冊慈善機構、獲稅務豁免機構、法定機構、監管機構、大學或認可頒授機構。發布任何此類身份前，必須有相關官方登記或授權機構支持。",
    correctionHeading: "舉報不準確的資歷陳述",
    correctionBody: "請向 FOIHK 提交相關頁面、準確字句、涉及人士或機構，以及第一手核實來源。已確認的重要錯誤會按編輯政策處理。",
    contactCta: "要求核實",
    guideCta: "閱讀香港行業學會權威指南",
  },
  "zh-cn": {
    title: "资历与认证资料",
    description: "核实 FOIHK 的法定身份、领导职务、公开证据、认证状态，以及未来任何证书或资格陈述应遵守的标准。",
    intro: "本页区分可核实的 FOIHK 机构事实、个人专业资格与认证陈述。FOIHK 只会发布可链接至明确颁发者、人士、标准和现行来源的资历资料。",
    heroAlt: "FOIHK 机构宗旨与资历核实",
    home: "首页",
    updatedLabel: "最后更新",
    updated: "2026 年 8 月 4 日",
    statusHeading: "目前认证状态",
    statusBody: "FOIHK 目前没有在本网站列出可报读或颁授的认可专业资格、名衔、牌照或证书。其公开工作属教育、研究、活动、慈善和专业交流。",
    noCertification: "出席活动、担任讲者、合作、媒体报道和社群参与，不得被表述为获得 FOIHK 认可专业证书。",
    impactHeading: "机构认证说明",
    impactTitle: "香港家族办公室学会荣获 SDG World Records 颁授 SDG-ESG Certified Impact Activity Center Accreditation",
    impactBody: "FOIHK 于 2026 年 6 月 11 日发布新闻公告，列明学会获 SDG World Records 颁授 SDG-ESG Certified Impact Activity Center accreditation。此项资料属机构活动中心认证说明，不应被描述为 FOIHK 个人专业资格、牌照或可报读证书。",
    impactCta: "阅读新闻公告",
    verifiedHeading: "可公开核实的机构资料",
    verifiedItems: [
      { title: "法定身份", value: ORGANIZATION_LEGAL_NAME, detail: "FOIHK 在公开机构资料中列出其法定名称及成立日期。" },
      { title: "领导角色公开提及", value: "赖敬文", detail: "《经济一周》于 2026 年 3 月公开具名提及 FOIHK 创会主席。FOIHK 仅把此视为公开识别证据，不视为资历、推荐或成果陈述。", href: ORGANIZATION_MEDIA_MENTION_URL, linkLabel: "查看独立来源" },
      { title: "公开身份", value: ORGANIZATION_ENGLISH_NAME, detail: "使用 FOIHK 缩写及官方域名 foihk.org 的公开机构名称。" },
      { title: "成立日期", value: "2025 年 8 月 20 日", detail: "FOIHK 一致公布的成立日期；涉及法律依赖时，应另行查阅独立官方登记。" },
      { title: "问责渠道", value: ORGANIZATION_EMAIL, detail: "用于身份查询、来源核实、更正及机构查询的公开邮箱。" },
    ],
    leadersHeading: "公开确认的创会职务负责人",
    leadersIntro: "只有 FOIHK 已确认的人士与职务才会列出。不会利用其他地方的同名人士，推断学历、牌照、雇主或专业资格。",
    leaders: [
      { name: "Lai King Man, Leo", alternateName: "賴敬文", role: "创会主席", evidence: "赖敬文担任 FOIHK 创会主席，参与凝聚家族办公室专业人士，并支持教育、慈善、文化交流及专业对话。" },
      { name: "Chan Man Ching", alternateName: "陳文清", role: "创会秘书长", evidence: "陈文清担任 FOIHK 创会秘书长，支持学会治理、会员沟通、项目协调及日常机构发展。" },
    ],
    notCredentialHeading: "哪些资料不能证明资历",
    notCredentialIntro: "资历陈述不能只基于与某机构的关联。以下资料可提供背景，但本身不能证明能力、授权或认证。",
    notCredentials: ["出席活动或研讨会", "讲者、主持、赞助、伙伴或会员标签", "照片、社交帖子、媒体提及或奖项", "在职衔或公司名称中使用家族办公室用语", "展示标志但没有颁发者核实记录"],
    futureHeading: "未来 FOIHK 资历的公开标准",
    futureIntro: "未来如推广任何证书、微证书或专业名衔，其公开页面应披露以下全部资料。",
    futureRequirements: ["颁发法律实体与问责联系方式", "学习成果与目标对象", "入读要求与必修时数", "考核方式、合格标准与重考规则", "导师与审阅者身份及已核实资格", "认证或承认机构及直接核实链接", "签发日期、到期或持续进修要求与撤销程序", "独有资历编号及保障隐私的核实方式", "费用、退款、投诉、上诉及利益冲突"],
    verifyHeading: "如何核实资历或资格",
    verifySteps: [
      { title: "1. 识别准确陈述", body: "记录资历名称、持有人、颁发者、日期、编号和所声称状态。" },
      { title: "2. 核实颁发者", body: "使用颁发者官方网站或登记，不依赖截图、转发 PDF 或社交账户。" },
      { title: "3. 核实承认状态", body: "确认所指认证机构或监管机构，是否真的承认相关课程、颁发者、活动或人士。" },
      { title: "4. 匹配资格范围", body: "完成课程的证书，不代表获准进行受监管、法律、税务、会计或信托工作。" },
      { title: "5. 确认现行状态", body: "查核到期、持续要求、暂停、撤销，以及资历是否属于同一人士或实体。" },
    ],
    legalStatusHeading: "法律与非营利身份厘清",
    legalStatusBody: "FOIHK 公布的法定名称包含“Limited”。本页不声称 FOIHK 是注册慈善机构、获税务豁免机构、法定机构、监管机构、大学或认可颁发机构。发布任何此类身份前，必须有相关官方登记或授权机构支持。",
    correctionHeading: "举报不准确的资历陈述",
    correctionBody: "请向 FOIHK 提交相关页面、准确字句、涉及人士或机构，以及第一手核实来源。已确认的重要错误会按编辑政策处理。",
    contactCta: "要求核实",
    guideCta: "阅读香港行业学会权威指南",
  },
};

const Credentials = () => {
  const { language } = useLanguage();
  const copy = COPY[language];
  const canonical = `${ORGANIZATION_URL}/${language}/credentials`;
  const sdgAccreditationPath = `/articles/news-events/${SDG_ACCREDITATION_SLUG}`;
  const sdgAccreditationCanonical = `${ORGANIZATION_URL}/${language}${sdgAccreditationPath}`;
  const inLanguage = language === "en" ? "en" : language === "zh-hk" ? "zh-Hant" : "zh-Hans";
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": copy.title,
    "description": copy.description,
    "url": canonical,
    "dateModified": UPDATED_ISO,
    "citation": [ORGANIZATION_MEDIA_MENTION_URL, sdgAccreditationCanonical],
    "inLanguage": inLanguage,
    "about": {
      "@type": "Organization",
      "@id": `${ORGANIZATION_URL}/#organization`,
      "name": ORGANIZATION_ENGLISH_NAME,
      "legalName": ORGANIZATION_LEGAL_NAME,
      "url": ORGANIZATION_URL,
      "foundingDate": ORGANIZATION_FOUNDING_DATE,
      "identifier": ORGANIZATION_WIKIDATA_ENTITY_ID ? [{
          "@type": "PropertyValue",
          "propertyID": "Wikidata",
          "value": ORGANIZATION_WIKIDATA_ENTITY_ID,
          "url": ORGANIZATION_WIKIDATA_URL,
        }] : undefined,
      "email": ORGANIZATION_EMAIL,
      "sameAs": ORGANIZATION_SAME_AS,
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={copy.title}
        description={copy.description}
        structuredData={pageSchema}
      />
      <Navigation />
      <main>
        <section className="relative isolate min-h-[360px] overflow-hidden bg-foreground text-background">
          <img src={missionBackground} alt={copy.heroAlt} className="absolute inset-0 h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-black/60" />
          <div className="container relative mx-auto px-4 py-12">
            <Breadcrumbs items={[{ label: copy.home, to: "/" }, { label: copy.title }]} />
            <div className="max-w-4xl py-8">
              <h1 className="mb-5 text-4xl font-bold text-white sm:text-5xl">{copy.title}</h1>
              <p className="max-w-3xl text-lg leading-8 text-white/90">{copy.intro}</p>
            </div>
          </div>
        </section>

        <section id="credential-status" className="scroll-mt-24 border-b border-border py-14">
          <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <BadgeCheck className="mb-5 h-9 w-9 text-primary" aria-hidden="true" />
              <h2 className="text-3xl font-bold text-foreground">{copy.statusHeading}</h2>
            </div>
            <div className="border-l-4 border-primary pl-6">
              <p className="text-lg leading-8 text-foreground">{copy.statusBody}</p>
              <p className="mt-4 leading-7 text-muted-foreground">{copy.noCertification}</p>
              <aside data-sdg-impact-accreditation className="mt-7 border-t border-border pt-5">
                <p className="text-sm font-semibold uppercase tracking-normal text-primary">{copy.impactHeading}</p>
                <h3 className="mt-2 text-xl font-bold leading-7 text-foreground">{copy.impactTitle}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">{copy.impactBody}</p>
                <Link to={sdgAccreditationPath} className="mt-4 inline-flex font-semibold text-primary underline-offset-4 hover:underline">
                  {copy.impactCta}
                </Link>
              </aside>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-8 text-3xl font-bold text-foreground">{copy.verifiedHeading}</h2>
            <dl className="grid gap-x-10 gap-y-8 md:grid-cols-2">
              {copy.verifiedItems.map((item, index) => {
                const Icon = [Building2, UserRoundCheck, ShieldCheck, FileCheck2, CheckCircle2][index] ?? CheckCircle2;
                const isWikidata = item.href?.startsWith("https://www.wikidata.org/");
                return <div key={item.title} data-identity-source={isWikidata ? "wikidata" : undefined} className="border-t border-border pt-5"><dt className="flex items-center gap-3 font-semibold text-foreground"><Icon className="h-5 w-5 text-primary" aria-hidden="true" />{item.title}</dt><dd className="mt-3 break-words text-lg font-semibold text-foreground">{item.value}</dd><dd className="mt-2 leading-7 text-muted-foreground">{item.detail}</dd>{item.href && <dd className="mt-3"><a href={item.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline">{item.linkLabel}<ExternalLink className="h-4 w-4" aria-hidden="true" /></a></dd>}</div>;
              })}
            </dl>
          </div>
        </section>

        <section id="credential-leadership" className="scroll-mt-24 border-y border-border bg-secondary/25 py-16">
          <div className="container mx-auto px-4">
            <div className="mb-9 max-w-3xl">
              <h2 className="mb-4 text-3xl font-bold text-foreground">{copy.leadersHeading}</h2>
              <p className="leading-8 text-muted-foreground">{copy.leadersIntro}</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {copy.leaders.map((leader) => <article key={leader.name} className="rounded-lg border border-border bg-background p-6"><UserRoundCheck className="mb-4 h-7 w-7 text-primary" aria-hidden="true" /><h3 className="text-xl font-semibold text-foreground">{leader.name} <span className="font-normal text-muted-foreground">({leader.alternateName})</span></h3><p className="mt-2 font-medium text-primary">{leader.role}</p><p className="mt-4 leading-7 text-muted-foreground">{leader.evidence}</p>{leader.href && <a href={leader.href} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline">{leader.linkLabel}<ExternalLink className="h-4 w-4" aria-hidden="true" /></a>}</article>)}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-2">
            <div>
              <CircleAlert className="mb-5 h-8 w-8 text-destructive" aria-hidden="true" />
              <h2 className="mb-4 text-3xl font-bold text-foreground">{copy.notCredentialHeading}</h2>
              <p className="mb-6 leading-8 text-muted-foreground">{copy.notCredentialIntro}</p>
              <ul className="space-y-3">
                {copy.notCredentials.map((item) => <li key={item} className="border-l-2 border-destructive/60 pl-4 leading-7 text-muted-foreground">{item}</li>)}
              </ul>
            </div>
            <div>
              <FileCheck2 className="mb-5 h-8 w-8 text-primary" aria-hidden="true" />
              <h2 className="mb-4 text-3xl font-bold text-foreground">{copy.futureHeading}</h2>
              <p className="mb-6 leading-8 text-muted-foreground">{copy.futureIntro}</p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {copy.futureRequirements.map((item) => <li key={item} className="border-t border-border pt-3 leading-7 text-muted-foreground">{item}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-secondary/25 py-16">
          <div className="container mx-auto px-4">
            <div className="mb-9 flex items-center gap-4"><Search className="h-8 w-8 text-primary" aria-hidden="true" /><h2 className="text-3xl font-bold text-foreground">{copy.verifyHeading}</h2></div>
            <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
              {copy.verifySteps.map((step) => <li key={step.title}><h3 className="font-semibold text-foreground">{step.title}</h3><p className="mt-2 leading-7 text-muted-foreground">{step.body}</p></li>)}
            </ol>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 className="mb-4 text-3xl font-bold text-foreground">{copy.legalStatusHeading}</h2>
              <p className="leading-8 text-muted-foreground">{copy.legalStatusBody}</p>
            </div>
            <aside className="border-t-4 border-primary bg-secondary/30 p-7">
              <h2 className="mb-3 text-2xl font-bold text-foreground">{copy.correctionHeading}</h2>
              <p className="mb-6 leading-7 text-muted-foreground">{copy.correctionBody}</p>
              <div className="flex flex-col gap-3">
                <Link to="/contact" className="inline-flex min-h-11 items-center justify-center bg-primary px-5 py-3 font-semibold text-primary-foreground hover:bg-primary/90">{copy.contactCta}</Link>
                <Link to="/guides/family-office-institute-hong-kong" className="inline-flex min-h-11 items-center justify-center border border-border px-5 py-3 font-semibold text-foreground hover:bg-secondary">{copy.guideCta}</Link>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer lastUpdated={UPDATED_ISO} />
    </div>
  );
};

export default Credentials;
