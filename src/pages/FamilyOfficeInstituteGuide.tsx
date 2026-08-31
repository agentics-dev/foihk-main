import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  ExternalLink,
  Scale,
  SearchCheck,
  UsersRound,
} from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ArticleByline } from "@/components/ArticleByline";
import { Footer } from "@/components/Footer";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import educationBackground from "@/assets/education-research-bg.webp";
import {
  ORGANIZATION_CONTACT_POINT,
  ORGANIZATION_EMAIL,
  ORGANIZATION_ENGLISH_NAME,
  ORGANIZATION_LEGAL_NAME,
  ORGANIZATION_SAME_AS,
  ORGANIZATION_URL,
} from "@/lib/schema";

interface GuideCopy {
  title: string;
  description: string;
  directAnswer: string;
  heroAlt: string;
  home: string;
  guides: string;
  publishedLabel: string;
  updatedLabel: string;
  date: string;
  author: string;
  definitionHeading: string;
  definitionBody: string;
  distinctionHeading: string;
  distinctionIntro: string;
  distinctions: Array<{ type: string; purpose: string; verify: string }>;
  roleHeading: string;
  roles: Array<{ title: string; body: string }>;
  useHeading: string;
  useCases: string[];
  evaluateHeading: string;
  evaluateIntro: string;
  checks: Array<{ title: string; body: string }>;
  contextHeading: string;
  contextBody: string;
  stats: Array<{ value: string; label: string; note: string }>;
  regulationHeading: string;
  regulationBody: string;
  taxBody: string;
  nonprofitHeading: string;
  nonprofitBody: string;
  foihkHeading: string;
  foihkBody: string;
  foihkPoints: string[];
  sourcesHeading: string;
  sourcesIntro: string;
  relatedHeading: string;
  related: Array<{ label: string; to: string }>;
  questionsHeading: string;
  questions: Array<{ question: string; answer: string }>;
}

const DATE_ISO = "2026-08-03";
const SOURCES = [
  "https://www.info.gov.hk/gia/general/202602/10/P2026021000234.htm",
  "https://www.sfc.hk/en/faqs/intermediaries/licensing/Family-Offices",
  "https://www.ird.gov.hk/eng/tax/bus_fihv.htm",
  "https://www.familyofficehk.gov.hk/en/network-of-family-office-service-providers/",
];

const COPY: Record<Language, GuideCopy> = {
  en: {
    title: "Family Office Institute Hong Kong: Definitive Guide",
    description: "The definitive Family Office Institute Hong Kong guide covering Hong Kong family office institute roles, services, verification, regulation, credentials, and selection.",
    directAnswer: "Family Office Institute Hong Kong (FOIHK) is a Hong Kong family office industry institution and professional community. For readers searching for a Hong Kong Family Office Institute, this guide explains the role of an institute and distinguishes it from a family office, service provider, association, regulator, university, charity, or accredited certification body.",
    heroAlt: "FOIHK education and research for Hong Kong family offices",
    home: "Home",
    guides: "Guides",
    publishedLabel: "Published",
    updatedLabel: "Last updated",
    date: "3 August 2026",
    author: "FOIHK Editorial Team",
    definitionHeading: "What is a family office institute?",
    definitionBody: "A family office institute organizes knowledge and professional exchange around the needs of family enterprises, family offices, advisers, researchers, and related institutions. Common subjects include family governance, investment oversight, succession, philanthropy, risk, technology, talent, and public policy. The word “institute” describes an institutional role; it does not, by itself, prove legal status, regulatory authorization, academic degree-awarding power, charitable status, or accreditation.",
    distinctionHeading: "Institute, family office, association, and provider compared",
    distinctionIntro: "Similar terminology can hide materially different purposes. Identify the organization type before relying on its content, joining a program, or appointing a provider.",
    distinctions: [
      { type: "Industry institute or professional community", purpose: "Education, research, dialogue, and sector development", verify: "Identity, leadership, sources, editorial standards, programs, and boundaries" },
      { type: "Industry association", purpose: "Membership representation, networking, and policy dialogue", verify: "Membership rules, board, governance, funding, and represented interests" },
      { type: "Single-family office", purpose: "Coordinate the affairs of one family", verify: "Ownership, served entities, activities, decision rights, and relevant licences" },
      { type: "Multi-family office or adviser", purpose: "Provide commercial services to several families", verify: "Contracting entity, mandate, fees, conflicts, qualifications, custody, and licences" },
      { type: "Private bank", purpose: "Banking, custody, financing, investment products, and advice", verify: "Regulatory entity, account terms, product scope, remuneration, and suitability process" },
      { type: "Government or regulator", purpose: "Policy, supervision, administration, and public services", verify: "Official government domain, statutory authority, register, and published remit" },
    ],
    roleHeading: "Six useful roles of an institute",
    roles: [
      { title: "Define the field", body: "Explain terminology, operating models, stakeholder roles, and important boundaries in language that non-specialists can use." },
      { title: "Organize evidence", body: "Connect public data, regulatory material, academic research, and attributable industry sources without presenting synthesis as primary evidence." },
      { title: "Convene dialogue", body: "Create structured exchange among families, practitioners, institutions, researchers, and community organizations." },
      { title: "Build capability", body: "Provide education and practical frameworks for governance, succession, philanthropy, risk, technology, and provider selection." },
      { title: "Clarify accountability", body: "Publish authorship, dates, sources, corrections, organizational identity, and the limits of educational material." },
      { title: "Connect public purpose", body: "Support informed discussion of philanthropy, stewardship, next-generation participation, and responsible sector development." },
    ],
    useHeading: "When should someone use an institute?",
    useCases: ["To learn the vocabulary and structure of the family office ecosystem", "To prepare questions before appointing legal, tax, investment, trust, or technology providers", "To compare single-family, multi-family, private-bank, and hybrid models", "To monitor policy, regulation, tax, governance, philanthropy, and sector trends", "To join education, research, events, or cross-sector dialogue", "To find primary sources and understand where specialist advice is still required"],
    evaluateHeading: "Ten checks before relying on an institute",
    evaluateIntro: "An impressive name is not evidence. Use the same verification discipline for an institute that a family would use for any important institution.",
    checks: [
      { title: "1. Legal identity", body: "Find the legal name, official domain, location, contact details, and contracting entity." },
      { title: "2. People", body: "Look for named leaders, authors, reviewers, and clearly sourced credentials." },
      { title: "3. Purpose", body: "Confirm what the organization actually does and what it explicitly does not do." },
      { title: "4. Evidence", body: "Material claims should link to current primary or authoritative sources." },
      { title: "5. Dates", body: "Policy, statistics, regulations, and program availability need publication and update dates." },
      { title: "6. Editorial standards", body: "Check authorship, corrections, review principles, independence, and conflicts." },
      { title: "7. Service boundaries", body: "Education and networking must not be confused with regulated or professional advice." },
      { title: "8. Credential status", body: "Verify the issuer, assessment, recognition, expiry, and public record of any certificate." },
      { title: "9. Commercial terms", body: "Understand fees, sponsorship, referrals, data use, cancellations, and complaints." },
      { title: "10. Independent verification", body: "Use regulator, government, professional-body, or issuer records for claims that require legal reliance." },
    ],
    contextHeading: "Hong Kong family office context",
    contextBody: "Hong Kong's family office ecosystem includes families, single- and multi-family offices, private banks, asset managers, trustees, legal and tax advisers, accountants, technology providers, philanthropic organizations, universities, regulators, and government support teams. An institute sits within this ecosystem as a knowledge and convening organization, not above it as an authority over every participant.",
    stats: [
      { value: ">3,380", label: "single-family offices", note: "Estimated in operation at the end of 2025" },
      { value: "HK$12.6B", label: "annual operating contribution", note: "Estimated operating expenditure in Hong Kong" },
      { value: ">10,000", label: "direct full-time roles", note: "Estimated direct employment within operations" },
    ],
    regulationHeading: "Regulation and tax are activity- and fact-specific",
    regulationBody: "The Securities and Futures Commission states that Hong Kong has no licensing obligation triggered solely by the family-office name. Licensing depends on whether regulated services are provided, whether they are carried on as a business, and whether the business is carried on in Hong Kong. An institute's educational activity does not authorize it or its participants to perform regulated work.",
    taxBody: "Hong Kong's family-owned investment holding vehicle regime can provide a 0% concessionary profits tax rate for qualifying assessable profits, but only where statutory requirements are met. The Inland Revenue Department describes ownership, eligible single-family-office management, asset, substantial-activity, employee, expenditure, transaction, and record-keeping conditions. A guide cannot determine eligibility for a particular family.",
    nonprofitHeading: "Does “institute” mean nonprofit or charity?",
    nonprofitBody: "No. The name, the use of “Limited”, educational activity, or a public-interest purpose does not by itself prove registered-charity, tax-exempt, nonprofit, statutory, academic, or accreditation status. A Hong Kong organization should publish the precise status it claims and link to the relevant official register or authorizing body. FOIHK does not make an unverified charity or accreditation claim on this page.",
    foihkHeading: "How FOIHK defines its own role",
    foihkBody: "Family Office Institute Hong Kong (FOIHK) identifies itself as a Hong Kong family office industry institution and professional community. Its public role centres on education, research, events, philanthropy, and cross-sector exchange.",
    foihkPoints: ["Legal name: Family Office Institute Hong Kong Limited", "Established: 20 August 2025", "Official domain: foihk.org", "Institutional author: FOIHK Editorial Team", "Public accountability: About, Contact, Editorial Policy, Privacy Policy, and correction channel", "Not represented as a family office, financial institution, regulator, government agency, charity, university, or accredited awarding body"],
    sourcesHeading: "Primary sources reviewed",
    sourcesIntro: "These sources support the Hong Kong market, regulatory, tax, and service-network statements in this guide. Their own dates and terms remain authoritative.",
    relatedHeading: "Continue your research",
	    related: [
	      { label: "FOIHK services and offerings", to: "/services" },
	      { label: "Credentials and certification information", to: "/credentials" },
	      { label: "Education and research articles", to: "/articles/education-research" },
	      { label: "Frequently asked questions", to: "/faq" },
	      { label: "About FOIHK", to: "/about" },
	    ],
    questionsHeading: "Questions about family office institutes",
    questions: [
      { question: "Can an institute manage family assets?", answer: "Only if the relevant legal entity actually offers that service and satisfies every applicable authorization, licensing, mandate, and professional requirement. The institute name alone establishes none of those conditions." },
      { question: "Can an institute issue a professional certification?", answer: "It may issue a certificate of its own program, but recognition or accreditation must be separately evidenced. The issuer, assessment, standard, status, expiry, and verification method should be public." },
      { question: "Is institute membership a professional qualification?", answer: "Not unless an authorized body explicitly defines it that way. Membership usually indicates participation or eligibility under membership rules, not regulatory authority or assessed competence." },
      { question: "How should similar organization names be checked?", answer: "Match the exact legal and public name, abbreviation, official domain, people, address, and contact details. Do not infer affiliation from shared family-office terminology." },
      { question: "What is the best first step for a family?", answer: "Define the decision to be made. Use institute resources for education and preparation, then appoint appropriately qualified and, where required, regulated advisers for the family's specific facts." },
    ],
  },
  "zh-hk": {
    title: "香港家族辦公室行業學會權威指南",
    description: "全面解釋香港家族辦公室行業學會的角色、界線、服務、核實、監管、資歷與選擇標準。",
    directAnswer: "香港的家族辦公室行業學會，是從事行業教育、研究、交流或專業社群工作的機構。它可以協助家族和業界理解生態，但不會自動成為家族辦公室、服務供應商、協會、監管機構、大學、慈善機構或認可發證機構。",
    heroAlt: "FOIHK 香港家族辦公室教育與研究",
    home: "首頁",
    guides: "指南",
    publishedLabel: "發布日期",
    updatedLabel: "最後更新",
    date: "2026 年 8 月 3 日",
    author: "FOIHK 編輯團隊",
    definitionHeading: "什麼是家族辦公室行業學會？",
    definitionBody: "家族辦公室行業學會圍繞家族企業、家族辦公室、顧問、研究人員及相關機構的需要，整理知識和促進專業交流。常見議題包括家族治理、投資監督、傳承、慈善、風險、科技、人才和公共政策。「學會」一詞描述機構角色，本身不證明法律身份、監管授權、學位頒授權、慈善身份或認證資格。",
    distinctionHeading: "學會、家辦、協會與服務供應商比較",
    distinctionIntro: "相近術語可能代表完全不同的目的。依賴內容、參加項目或委聘供應商前，應先確認機構類型。",
    distinctions: [
      { type: "行業學會或專業社群", purpose: "教育、研究、對話和行業發展", verify: "身份、領導人、來源、編輯標準、項目和界線" },
      { type: "行業協會", purpose: "會員代表、聯繫和政策對話", verify: "會員規則、董事會、治理、資金和所代表利益" },
      { type: "單一家族辦公室", purpose: "協調一個家族的事務", verify: "擁有權、服務實體、活動、決策權和相關牌照" },
      { type: "聯合家辦或顧問", purpose: "向多個家族提供商業服務", verify: "簽約實體、授權、費用、利益衝突、資格、託管和牌照" },
      { type: "私人銀行", purpose: "銀行、託管、融資、投資產品和意見", verify: "受規管實體、帳戶條款、產品範圍、報酬和合適性程序" },
      { type: "政府或監管機構", purpose: "政策、監管、行政和公共服務", verify: "官方政府網域、法定權力、登記和公開職權" },
    ],
    roleHeading: "行業學會的六項實用角色",
    roles: [
      { title: "界定行業", body: "以非專家可使用的語言解釋術語、營運模式、持份者角色和重要界線。" },
      { title: "整理證據", body: "連接公共數據、監管資料、學術研究和可歸屬行業來源，不把綜合分析當作原始證據。" },
      { title: "促進對話", body: "為家族、專業人士、機構、研究人員和社群組織建立有結構的交流。" },
      { title: "建立能力", body: "就治理、傳承、慈善、風險、科技和供應商選擇提供教育與實用框架。" },
      { title: "清晰問責", body: "公開署名、日期、來源、更正、機構身份及教育資料的限制。" },
      { title: "連接公共目的", body: "促進對慈善、財富責任、下一代參與和負責任行業發展的知情討論。" },
    ],
    useHeading: "何時適合使用行業學會？",
    useCases: ["學習家族辦公室生態的詞彙與架構", "委聘法律、稅務、投資、信託或科技供應商前準備問題", "比較單一家辦、聯合家辦、私人銀行和混合模式", "監察政策、監管、稅務、治理、慈善和行業趨勢", "參與教育、研究、活動或跨界對話", "尋找第一手來源並了解何處仍需專業意見"],
    evaluateHeading: "依賴行業學會前的十項檢查",
    evaluateIntro: "具吸引力的名稱不等於證據。家族應以審查任何重要機構的方式核實行業學會。",
    checks: [
      { title: "1. 法律身份", body: "查找法定名稱、官方網域、地點、聯絡資料和簽約實體。" },
      { title: "2. 人員", body: "查找具名領導人、作者、審閱者及有清晰來源的資歷。" },
      { title: "3. 宗旨", body: "確認機構實際進行什麼，以及明確不進行什麼。" },
      { title: "4. 證據", body: "重要陳述應連結至現行第一手或權威來源。" },
      { title: "5. 日期", body: "政策、數據、規例和項目供應情況須列出發布與更新日期。" },
      { title: "6. 編輯標準", body: "查核署名、更正、審閱原則、獨立性和利益衝突。" },
      { title: "7. 服務界線", body: "教育與聯繫不應與受規管或專業意見混淆。" },
      { title: "8. 資歷狀態", body: "核實任何證書的頒發者、評核、承認、到期和公開紀錄。" },
      { title: "9. 商業條款", body: "了解費用、贊助、轉介、數據用途、取消和投訴。" },
      { title: "10. 獨立核實", body: "需要法律依賴的陳述，須使用監管、政府、專業團體或頒發者紀錄。" },
    ],
    contextHeading: "香港家族辦公室背景",
    contextBody: "香港家族辦公室生態包括家族、單一及聯合家辦、私人銀行、資產管理人、受託人、法律與稅務顧問、會計師、科技供應商、慈善機構、院校、監管機構和政府支援團隊。行業學會在生態中扮演知識與交流角色，而不是凌駕所有參與者的權威。",
    stats: [
      { value: ">3,380", label: "間單一家族辦公室", note: "截至 2025 年底的估算營運數目" },
      { value: "126 億港元", label: "每年營運貢獻", note: "在香港的估算營運開支" },
      { value: ">10,000", label: "個直接全職職位", note: "營運內的估算直接就業" },
    ],
    regulationHeading: "監管與稅務取決於活動及事實",
    regulationBody: "證監會指出，香港不會單因家族辦公室名稱而觸發牌照。發牌取決於是否提供受規管服務、是否以業務形式進行，以及業務是否在香港進行。行業學會的教育活動，不會授權機構或參與者進行受規管工作。",
    taxBody: "香港家族投資控權工具制度可就合資格應評稅利潤提供 0% 優惠稅率，但必須符合法定條件。稅務局列出的要求涉及擁有權、合資格單一家辦管理、資產、實質活動、員工、開支、交易和紀錄。指南不能判斷個別家族是否合資格。",
    nonprofitHeading: "「學會」是否代表非牟利或慈善機構？",
    nonprofitBody: "不是。名稱、使用「Limited」、教育活動或公共利益宗旨，本身不證明註冊慈善、稅務豁免、非牟利、法定、學術或認證身份。香港機構應公開其準確身份，並連結相關官方登記或授權機構。FOIHK 不會在本頁作出未經核實的慈善或認證陳述。",
    foihkHeading: "FOIHK 如何界定自身角色",
    foihkBody: "香港家族辦公室學會（FOIHK）把自身定位為香港家族辦公室行業機構與專業社群，公開工作以教育、研究、活動、慈善和跨界交流為核心。",
    foihkPoints: ["法定名稱：Family Office Institute Hong Kong Limited", "成立日期：2025 年 8 月 20 日", "官方網域：foihk.org", "機構作者：FOIHK 編輯團隊", "公開問責：關於我們、聯絡、編輯政策、私隱政策和更正渠道", "不表述為家族辦公室、金融機構、監管機構、政府部門、慈善機構、大學或認可頒發機構"],
    sourcesHeading: "已覆核第一手來源",
    sourcesIntro: "以下來源支持本指南所述香港市場、監管、稅務和服務網絡資料，其原有日期與條款仍是權威依據。",
    relatedHeading: "繼續研究",
	    related: [
	      { label: "FOIHK 服務與項目", to: "/services" },
	      { label: "資歷與認證資料", to: "/credentials" },
	      { label: "教育與研究文章", to: "/articles/education-research" },
	      { label: "常見問題", to: "/faq" },
	      { label: "關於 FOIHK", to: "/about" },
	    ],
    questionsHeading: "家族辦公室行業學會常見問題",
    questions: [
      { question: "行業學會能否管理家族資產？", answer: "只有實際提供服務的法律實體符合所有適用授權、發牌、委聘和專業要求時才可以；學會名稱本身不能證明任何一項。" },
      { question: "行業學會能否頒發專業證書？", answer: "它可以為自身課程頒發完成證書，但承認或認證必須另有證據，並公開頒發者、評核、標準、狀態、到期和核實方式。" },
      { question: "學會會員是否專業資格？", answer: "除非獲授權機構明確如此界定，否則不是。會員通常代表符合會員規則的參與身份，不代表監管權限或經評核能力。" },
      { question: "如何核實名稱相近的機構？", answer: "配對準確法定與公開名稱、縮寫、官方網域、人員、地址和聯絡資料，不應從共用家辦用語推斷關聯。" },
      { question: "家族的最佳第一步是什麼？", answer: "先界定要作出的決定。利用行業學會資源學習和準備，再按家族具體情況委聘合資格及在需要時受規管的顧問。" },
    ],
  },
  "zh-cn": {
    title: "香港家族办公室行业学会权威指南",
    description: "全面解释香港家族办公室行业学会的角色、界线、服务、核实、监管、资历与选择标准。",
    directAnswer: "香港的家族办公室行业学会，是从事行业教育、研究、交流或专业社群工作的机构。它可以协助家族和业内理解生态，但不会自动成为家族办公室、服务供应商、协会、监管机构、大学、慈善机构或认可发证机构。",
    heroAlt: "FOIHK 香港家族办公室教育与研究",
    home: "首页",
    guides: "指南",
    publishedLabel: "发布日期",
    updatedLabel: "最后更新",
    date: "2026 年 8 月 3 日",
    author: "FOIHK 编辑团队",
    definitionHeading: "什么是家族办公室行业学会？",
    definitionBody: "家族办公室行业学会围绕家族企业、家族办公室、顾问、研究人员及相关机构的需要，整理知识和促进专业交流。常见议题包括家族治理、投资监督、传承、慈善、风险、科技、人才和公共政策。“学会”一词描述机构角色，本身不证明法律身份、监管授权、学位颁发权、慈善身份或认证资格。",
    distinctionHeading: "学会、家办、协会与服务供应商比较",
    distinctionIntro: "相近术语可能代表完全不同的目的。依赖内容、参加项目或委聘供应商前，应先确认机构类型。",
    distinctions: [
      { type: "行业学会或专业社群", purpose: "教育、研究、对话和行业发展", verify: "身份、领导人、来源、编辑标准、项目和界线" },
      { type: "行业协会", purpose: "会员代表、联系和政策对话", verify: "会员规则、董事会、治理、资金和所代表利益" },
      { type: "单一家族办公室", purpose: "协调一个家族的事务", verify: "所有权、服务实体、活动、决策权和相关牌照" },
      { type: "联合家办或顾问", purpose: "向多个家族提供商业服务", verify: "签约实体、授权、费用、利益冲突、资格、托管和牌照" },
      { type: "私人银行", purpose: "银行、托管、融资、投资产品和意见", verify: "受监管实体、账户条款、产品范围、报酬和适合性程序" },
      { type: "政府或监管机构", purpose: "政策、监管、行政和公共服务", verify: "官方政府域名、法定权力、登记和公开职权" },
    ],
    roleHeading: "行业学会的六项实用角色",
    roles: [
      { title: "界定行业", body: "以非专家可使用的语言解释术语、运营模式、持份者角色和重要界线。" },
      { title: "整理证据", body: "连接公共数据、监管资料、学术研究和可归属行业来源，不把综合分析当作原始证据。" },
      { title: "促进对话", body: "为家族、专业人士、机构、研究人员和社群组织建立有结构的交流。" },
      { title: "建立能力", body: "就治理、传承、慈善、风险、科技和供应商选择提供教育与实用框架。" },
      { title: "清晰问责", body: "公开署名、日期、来源、更正、机构身份及教育资料的限制。" },
      { title: "连接公共目的", body: "促进对慈善、财富责任、下一代参与和负责任行业发展的知情讨论。" },
    ],
    useHeading: "何时适合使用行业学会？",
    useCases: ["学习家族办公室生态的词汇与架构", "委聘法律、税务、投资、信托或科技供应商前准备问题", "比较单一家办、联合家办、私人银行和混合模式", "监察政策、监管、税务、治理、慈善和行业趋势", "参与教育、研究、活动或跨界对话", "寻找第一手来源并了解何处仍需专业意见"],
    evaluateHeading: "依赖行业学会前的十项检查",
    evaluateIntro: "具吸引力的名称不等于证据。家族应以审查任何重要机构的方式核实行业学会。",
    checks: [
      { title: "1. 法律身份", body: "查找法定名称、官方域名、地点、联系资料和签约实体。" },
      { title: "2. 人员", body: "查找具名领导人、作者、审阅者及有清晰来源的资历。" },
      { title: "3. 宗旨", body: "确认机构实际进行什么，以及明确不进行什么。" },
      { title: "4. 证据", body: "重要陈述应链接至现行第一手或权威来源。" },
      { title: "5. 日期", body: "政策、数据、规则和项目供应情况须列出发布与更新日期。" },
      { title: "6. 编辑标准", body: "查核署名、更正、审阅原则、独立性和利益冲突。" },
      { title: "7. 服务界线", body: "教育与联系不应与受监管或专业意见混淆。" },
      { title: "8. 资历状态", body: "核实任何证书的颁发者、考核、承认、到期和公开记录。" },
      { title: "9. 商业条款", body: "了解费用、赞助、转介、数据用途、取消和投诉。" },
      { title: "10. 独立核实", body: "需要法律依赖的陈述，须使用监管、政府、专业团体或颁发者记录。" },
    ],
    contextHeading: "香港家族办公室背景",
    contextBody: "香港家族办公室生态包括家族、单一及联合家办、私人银行、资产管理人、受托人、法律与税务顾问、会计师、科技供应商、慈善机构、院校、监管机构和政府支持团队。行业学会在生态中扮演知识与交流角色，而不是凌驾所有参与者的权威。",
    stats: [
      { value: ">3,380", label: "家单一家族办公室", note: "截至 2025 年底的估算运营数目" },
      { value: "126 亿港元", label: "每年运营贡献", note: "在香港的估算运营开支" },
      { value: ">10,000", label: "个直接全职职位", note: "运营内的估算直接就业" },
    ],
    regulationHeading: "监管与税务取决于活动及事实",
    regulationBody: "证监会指出，香港不会单因家族办公室名称而触发牌照。牌照取决于是否提供受监管服务、是否以业务形式进行，以及业务是否在香港进行。行业学会的教育活动，不会授权机构或参与者进行受监管工作。",
    taxBody: "香港家族投资控权工具制度可就合资格应评税利润提供 0% 优惠税率，但必须符合法定条件。税务局列出的要求涉及所有权、合资格单一家办管理、资产、实质活动、员工、开支、交易和记录。指南不能判断个别家族是否合资格。",
    nonprofitHeading: "“学会”是否代表非营利或慈善机构？",
    nonprofitBody: "不是。名称、使用“Limited”、教育活动或公共利益宗旨，本身不证明注册慈善、税务豁免、非营利、法定、学术或认证身份。香港机构应公开其准确身份，并链接相关官方登记或授权机构。FOIHK 不会在本页作出未经核实的慈善或认证陈述。",
    foihkHeading: "FOIHK 如何界定自身角色",
    foihkBody: "香港家族办公室学会（FOIHK）把自身定位为香港家族办公室行业机构与专业社群，公开工作以教育、研究、活动、慈善和跨界交流为核心。",
    foihkPoints: ["法定名称：Family Office Institute Hong Kong Limited", "成立日期：2025 年 8 月 20 日", "官方域名：foihk.org", "机构作者：FOIHK 编辑团队", "公开问责：关于我们、联系、编辑政策、隐私政策和更正渠道", "不表述为家族办公室、金融机构、监管机构、政府部门、慈善机构、大学或认可颁发机构"],
    sourcesHeading: "已复核第一手来源",
    sourcesIntro: "以下来源支持本指南所述香港市场、监管、税务和服务网络资料，其原有日期与条款仍是权威依据。",
    relatedHeading: "继续研究",
	    related: [
	      { label: "FOIHK 服务与项目", to: "/services" },
	      { label: "资历与认证资料", to: "/credentials" },
	      { label: "教育与研究文章", to: "/articles/education-research" },
	      { label: "常见问题", to: "/faq" },
	      { label: "关于 FOIHK", to: "/about" },
	    ],
    questionsHeading: "家族办公室行业学会常见问题",
    questions: [
      { question: "行业学会能否管理家族资产？", answer: "只有实际提供服务的法律实体符合所有适用授权、牌照、委聘和专业要求时才可以；学会名称本身不能证明任何一项。" },
      { question: "行业学会能否颁发专业证书？", answer: "它可以为自身课程颁发完成证书，但承认或认证必须另有证据，并公开颁发者、考核、标准、状态、到期和核实方式。" },
      { question: "学会会员是否专业资格？", answer: "除非获授权机构明确如此界定，否则不是。会员通常代表符合会员规则的参与身份，不代表监管权限或经考核能力。" },
      { question: "如何核实名称相近的机构？", answer: "匹配准确法定与公开名称、缩写、官方域名、人员、地址和联系资料，不应从共用家办用语推断关联。" },
      { question: "家族的最佳第一步是什么？", answer: "先界定要作出的决定。利用行业学会资源学习和准备，再按家族具体情况委聘合资格及在需要时受监管的顾问。" },
    ],
  },
};

const sourceLabels: Record<Language, string[]> = {
  en: ["Hong Kong Government: single-family offices surpass 3,380", "SFC: Family Offices licensing FAQ", "IRD: family-owned investment holding vehicle tax concessions", "FamilyOfficeHK: Network of Family Office Service Providers"],
  "zh-hk": ["香港政府：單一家族辦公室超過 3,380 間", "證監會：家族辦公室發牌常見問題", "稅務局：家族投資控權工具稅務寬減", "FamilyOfficeHK：家族辦公室服務提供者網絡"],
  "zh-cn": ["香港政府：单一家族办公室超过 3,380 家", "证监会：家族办公室牌照常见问题", "税务局：家族投资控权工具税务宽减", "FamilyOfficeHK：家族办公室服务提供者网络"],
};

const FamilyOfficeInstituteGuide = () => {
  const { language } = useLanguage();
  const copy = COPY[language];
  const canonical = `${ORGANIZATION_URL}/${language}/guides/family-office-institute-hong-kong`;
  const inLanguage = language === "en" ? "en" : language === "zh-hk" ? "zh-Hant" : "zh-Hans";
  const wordCount = language === "en"
    ? JSON.stringify(copy).replace(/[^A-Za-z0-9'’-]+/g, " ").trim().split(/\s+/).length
    : JSON.stringify(copy).replace(/[\s\p{P}\p{S}]/gu, "").length;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": copy.title,
    "description": copy.description,
    "url": canonical,
    "mainEntityOfPage": canonical,
    "datePublished": DATE_ISO,
    "dateModified": DATE_ISO,
    "inLanguage": inLanguage,
    "articleSection": "Education and Research",
    "keywords": "Family Office Institute Hong Kong, Hong Kong Family Office Institute, FOIHK, family office institute, Hong Kong family office guide, family office services, family office credentials",
    "wordCount": wordCount,
    "citation": SOURCES,
    "about": [
      { "@type": "Thing", "name": "Family office institute" },
      { "@type": "Place", "name": "Hong Kong" },
      { "@type": "Organization", "name": ORGANIZATION_ENGLISH_NAME },
    ],
    "author": {
      "@type": "Organization",
      "@id": `${ORGANIZATION_URL}/#editorial-team`,
      "name": "FOIHK Editorial Team",
      "url": `${ORGANIZATION_URL}/${language}/about#editorial-accountability`,
      "description": "The institutional editorial unit of Family Office Institute Hong Kong Limited.",
      "email": ORGANIZATION_EMAIL,
      "publishingPrinciples": `${ORGANIZATION_URL}/${language}/editorial-policy`,
      "parentOrganization": { "@id": `${ORGANIZATION_URL}/#organization` },
    },
    "publisher": {
      "@type": "Organization",
      "@id": `${ORGANIZATION_URL}/#organization`,
      "name": ORGANIZATION_ENGLISH_NAME,
      "legalName": ORGANIZATION_LEGAL_NAME,
      "url": ORGANIZATION_URL,
      "contactPoint": ORGANIZATION_CONTACT_POINT,
      "sameAs": ORGANIZATION_SAME_AS,
    },
    "image": `${ORGANIZATION_URL}/og-image.png`,
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={copy.title}
        description={copy.description}
        ogType="article"
        structuredData={articleSchema}
      />
      <Navigation />
      <main>
        <article>
          <header className="relative isolate min-h-[440px] overflow-hidden bg-foreground text-background">
            <img src={educationBackground} alt={copy.heroAlt} className="absolute inset-0 h-full w-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-black/65" />
            <div className="container relative mx-auto px-4 py-12">
              <Breadcrumbs items={[{ label: copy.home, to: "/" }, { label: copy.guides, to: "/articles/education-research" }, { label: copy.title }]} />
              <div className="max-w-5xl py-8">
                <h1 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl">{copy.title}</h1>
                <p className="max-w-4xl text-lg leading-8 text-white/90">{copy.directAnswer}</p>
                <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/75">
                  <span>{copy.publishedLabel}: <time dateTime={DATE_ISO}>{copy.date}</time></span>
                  <Link to="/about#editorial-accountability" rel="author" className="underline underline-offset-4 hover:text-white">{copy.author}</Link>
                </div>
              </div>
            </div>
          </header>

          <ArticleByline />

          <section className="py-16">
            <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-[0.75fr_1.25fr]">
              <div><BookOpen className="mb-5 h-9 w-9 text-primary" aria-hidden="true" /><h2 className="text-3xl font-bold text-foreground">{copy.definitionHeading}</h2></div>
              <p className="text-lg leading-9 text-muted-foreground">{copy.definitionBody}</p>
            </div>
          </section>

          <section className="border-y border-border bg-secondary/25 py-16">
            <div className="container mx-auto px-4">
              <h2 className="mb-4 text-3xl font-bold text-foreground">{copy.distinctionHeading}</h2>
              <p className="mb-8 max-w-4xl leading-8 text-muted-foreground">{copy.distinctionIntro}</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead><tr className="border-b-2 border-foreground"><th className="p-4">{language === "en" ? "Organization type" : language === "zh-hk" ? "機構類型" : "机构类型"}</th><th className="p-4">{language === "en" ? "Typical purpose" : language === "zh-hk" ? "常見目的" : "常见目的"}</th><th className="p-4">{language === "en" ? "What to verify" : language === "zh-hk" ? "需要核實" : "需要核实"}</th></tr></thead>
                  <tbody>{copy.distinctions.map((row) => <tr key={row.type} className="border-b border-border align-top"><th className="p-4 font-semibold text-foreground">{row.type}</th><td className="p-4 leading-7 text-muted-foreground">{row.purpose}</td><td className="p-4 leading-7 text-muted-foreground">{row.verify}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="mb-9 flex items-center gap-4"><UsersRound className="h-9 w-9 text-primary" aria-hidden="true" /><h2 className="text-3xl font-bold text-foreground">{copy.roleHeading}</h2></div>
              <div className="grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
                {copy.roles.map((role) => <section key={role.title} className="border-t border-border pt-5"><h3 className="text-xl font-semibold text-foreground">{role.title}</h3><p className="mt-3 leading-7 text-muted-foreground">{role.body}</p></section>)}
              </div>
            </div>
          </section>

          <section className="border-y border-border bg-secondary/25 py-16">
            <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-2">
              <div>
                <h2 className="mb-6 text-3xl font-bold text-foreground">{copy.useHeading}</h2>
                <ul className="space-y-4">{copy.useCases.map((item) => <li key={item} className="flex gap-3 leading-7 text-muted-foreground"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" /><span>{item}</span></li>)}</ul>
              </div>
              <div>
                <SearchCheck className="mb-5 h-8 w-8 text-primary" aria-hidden="true" />
                <h2 className="mb-4 text-3xl font-bold text-foreground">{copy.evaluateHeading}</h2>
                <p className="mb-7 leading-8 text-muted-foreground">{copy.evaluateIntro}</p>
                <ol className="grid gap-5 sm:grid-cols-2">{copy.checks.map((check) => <li key={check.title}><h3 className="font-semibold text-foreground">{check.title}</h3><p className="mt-1 leading-7 text-muted-foreground">{check.body}</p></li>)}</ol>
              </div>
            </div>
          </section>

          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="mb-10 max-w-4xl"><h2 className="mb-4 text-3xl font-bold text-foreground">{copy.contextHeading}</h2><p className="leading-8 text-muted-foreground">{copy.contextBody}</p></div>
              <div className="grid gap-6 md:grid-cols-3">{copy.stats.map((stat) => <div key={stat.label} className="border-t-4 border-primary pt-5"><p className="text-4xl font-bold text-foreground">{stat.value}</p><h3 className="mt-2 font-semibold text-foreground">{stat.label}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{stat.note}</p></div>)}</div>
            </div>
          </section>

          <section className="border-y border-border bg-secondary/25 py-16">
            <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-2">
              <div><Scale className="mb-5 h-8 w-8 text-primary" aria-hidden="true" /><h2 className="mb-4 text-3xl font-bold text-foreground">{copy.regulationHeading}</h2><p className="leading-8 text-muted-foreground">{copy.regulationBody}</p><p className="mt-5 leading-8 text-muted-foreground">{copy.taxBody}</p></div>
              <div><Building2 className="mb-5 h-8 w-8 text-primary" aria-hidden="true" /><h2 className="mb-4 text-3xl font-bold text-foreground">{copy.nonprofitHeading}</h2><p className="leading-8 text-muted-foreground">{copy.nonprofitBody}</p></div>
            </div>
          </section>

          <section className="py-16">
            <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[0.85fr_1.15fr]">
              <div><h2 className="mb-4 text-3xl font-bold text-foreground">{copy.foihkHeading}</h2><p className="leading-8 text-muted-foreground">{copy.foihkBody}</p></div>
              <ul className="grid gap-3 sm:grid-cols-2">{copy.foihkPoints.map((point) => <li key={point} className="border-t border-border pt-4 leading-7 text-muted-foreground">{point}</li>)}</ul>
            </div>
          </section>

          <section className="border-y border-border bg-secondary/25 py-16">
            <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-2">
              <div>
                <h2 className="mb-4 text-3xl font-bold text-foreground">{copy.sourcesHeading}</h2>
                <p className="mb-6 leading-8 text-muted-foreground">{copy.sourcesIntro}</p>
                <ul className="space-y-4">{SOURCES.map((source, index) => <li key={source}><a href={source} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-2 text-primary underline-offset-4 hover:underline"><ExternalLink className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /><span>{sourceLabels[language][index]}</span></a></li>)}</ul>
              </div>
              <div>
                <h2 className="mb-6 text-3xl font-bold text-foreground">{copy.relatedHeading}</h2>
                <ul className="grid gap-3 sm:grid-cols-2">{copy.related.map((item) => <li key={item.to}><Link to={item.to} className="flex h-full items-center justify-between gap-3 border border-border bg-background p-4 font-medium text-foreground hover:border-primary hover:text-primary"><span>{item.label}</span><ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></Link></li>)}</ul>
              </div>
            </div>
          </section>

          <section id="guide-questions" className="scroll-mt-24 py-16">
            <div className="container mx-auto max-w-5xl px-4">
              <h2 className="mb-8 text-3xl font-bold text-foreground">{copy.questionsHeading}</h2>
              <div className="divide-y divide-border border-y border-border">{copy.questions.map((item) => <section key={item.question} className="py-6"><h3 className="text-xl font-semibold text-foreground">{item.question}</h3><p className="mt-3 leading-8 text-muted-foreground">{item.answer}</p></section>)}</div>
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default FamilyOfficeInstituteGuide;
