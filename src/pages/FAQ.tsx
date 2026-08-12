import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import {
  ORGANIZATION_ALTERNATE_NAMES,
  ORGANIZATION_ENGLISH_NAME,
  ORGANIZATION_LEGAL_NAME,
  ORGANIZATION_URL,
} from "@/lib/schema";

interface FAQItem {
  question: string;
  answer: string;
  hidden?: boolean;
}

interface FAQCopy {
  title: string;
  description: string;
  intro: string;
  home: string;
  generalTitle: string;
  servicesTitle: string;
  moreTitle: string;
  updatedLabel: string;
  updated: string;
  items: FAQItem[];
}

const UPDATED_ISO = "2026-08-03";

const COPY: Record<Language, FAQCopy> = {
  en: {
    title: "FOIHK FAQ: Identity and General Questions",
    description: "Direct answers to common identity and family office sector questions about Family Office Institute Hong Kong.",
    intro: "Direct answers to common questions about FOIHK's identity, role, and Hong Kong's family office sector.",
    home: "Home",
    generalTitle: "General questions",
    servicesTitle: "Services and pricing",
    moreTitle: "More questions",
    updatedLabel: "Last updated",
    updated: "3 August 2026",
    items: [
      { question: "What is Family Office Institute Hong Kong?", answer: "Family Office Institute Hong Kong (FOIHK) is a Hong Kong family office industry institution and professional community for education, research, responsible philanthropy, events, and cross-sector exchange." },
      { question: "What is a nonprofit organization?", answer: "A nonprofit organization is established to pursue a public, community, professional, educational, charitable, or other stated purpose rather than distribute profits to owners." },
      { question: "How is Family Office Institute Hong Kong different from other family office organizations?", answer: "FOIHK is distinguished by its own legal identity and stated role as an industry institution and professional community. It is not a government body, regulator, bank, asset manager, multi-family office, or accredited awarding body." },
      { question: "What does Family Office Institute Hong Kong offer?", answer: "FOIHK offers education and practical guides, source-led research, events and professional dialogue, philanthropy and purpose initiatives, institutional collaboration, and responses to media or research enquiries. The scope and availability of each initiative are confirmed separately.", hidden: true },
      { question: "How much does Family Office Institute Hong Kong cost?", answer: "FOIHK does not publish one universal membership, programme, event, or service price on this website. Public content can be read without a stated fee; where an activity has eligibility requirements or charges, FOIHK should confirm the scope, amount, terms, and cancellation arrangements before a participant commits.", hidden: true },
      { question: "How do I get started with Family Office Institute Hong Kong?", answer: "Start by reviewing the Services and Offerings page, Education and Research hub, and News and Events page. Then send your objective, intended audience, timing, and organization details through the Contact page or to info@foihk.org so FOIHK can confirm fit, availability, and next steps.", hidden: true },
      { question: "Who does FOIHK serve?", answer: "FOIHK serves family office professionals, family principals, advisers, researchers, philanthropic practitioners, financial institutions, and other organizations working with the family office ecosystem." },
      { question: "What is a family office?", answer: "A family office is an organization established to coordinate a family's financial and non-financial affairs. Its scope can include investment oversight, governance, succession, tax and legal coordination, philanthropy, risk management, and family education." },
      { question: "What is the difference between a single-family office and a multi-family office?", answer: "A single-family office serves one family and is designed around that family's governance and control needs. A multi-family office provides shared professional services to several families, usually with a broader platform and shared operating resources." },
      { question: "Why is Hong Kong important to family offices?", answer: "Hong Kong combines deep capital markets, international connectivity, professional services, and access to Asian opportunities. Government data published in February 2026 identified more than 3,380 single-family offices in the city." },
      { question: "Does FOIHK provide investment, legal, or tax advice?", answer: "FOIHK publishes educational and industry information. Website content is general information and is not investment, legal, tax, accounting, or other regulated professional advice.", hidden: true },
      { question: "How can I attend FOIHK events?", answer: "Public events and participation details are announced through FOIHK news and event pages. Availability, eligibility, and registration arrangements depend on each event.", hidden: true },
      { question: "Can organizations collaborate with FOIHK?", answer: "Yes. Academic institutions, professional bodies, service providers, philanthropic organizations, and other ecosystem participants may contact FOIHK to discuss research, education, events, and community initiatives.", hidden: true },
      { question: "What research does FOIHK publish?", answer: "FOIHK's education and research hub covers family office structures, governance, succession, philanthropy, policy developments, and Hong Kong's family office ecosystem. Sources and update dates are shown where available.", hidden: true },
      { question: "How does FOIHK approach philanthropy?", answer: "FOIHK promotes informed, responsible, and impact-aware giving through education, dialogue, and community initiatives. It does not claim that one philanthropic structure is suitable for every family.", hidden: true },
      { question: "How does FOIHK check published information?", answer: "FOIHK prioritizes official government, regulatory, statutory, academic, and primary organizational sources. Material claims should be attributable, dated, and reviewed under the published editorial policy.", hidden: true },
      { question: "How can I request a correction or contact FOIHK?", answer: "Send correction requests, source questions, partnership enquiries, or general messages to info@foihk.org or use the website contact page. Please identify the relevant page and the information to be reviewed." },
      { question: "Is FOIHK a government body or financial regulator?", answer: "No. FOIHK is an independent Hong Kong industry institution and professional community. Government policy and regulatory requirements should be checked with the relevant official authority." },
      { question: "Does FOIHK manage family assets or sell financial products?", answer: "No asset-management or financial-product service is offered through this website. FOIHK's public website provides institutional, educational, research, event, and community information.", hidden: true },
      { question: "Does a Hong Kong family office need an SFC licence?", answer: "There is no licence triggered solely by the family-office name. The SFC states that licensing is activity-based and depends on the regulated services performed, whether they are carried on as a business, and whether the business is conducted in Hong Kong.", hidden: true },
      { question: "Where can I compare single-family and multi-family offices?", answer: "FOIHK's education and research hub includes a neutral guide comparing service scope, control, operating model, cost structure, and the activity-based Hong Kong licensing context.", hidden: true },
      { question: "How often is FOIHK website content reviewed?", answer: "Material corrections and substantive updates should be recorded when they are made. Time-sensitive policy or regulatory content should be checked against the linked primary source before it is relied upon.", hidden: true },
      { question: "May media or researchers cite FOIHK content?", answer: "Yes, with clear attribution and a link to the specific page. Statistics and regulatory statements should preferably cite the original government, regulator, or primary source linked by FOIHK.", hidden: true },
      { question: "Which languages does the FOIHK website support?", answer: "Public institutional and core reference content is provided in English, Traditional Chinese, and Simplified Chinese. A language version without substantive content is excluded from indexing rather than being represented as complete.", hidden: true },
      { question: "How can I propose a research topic or event collaboration?", answer: "Use the contact page or email info@foihk.org with the proposed topic, intended audience, supporting evidence, suggested format, and relevant organization details." },
      { question: "Does FOIHK issue professional certifications or qualifications?", answer: "FOIHK does not currently list an accredited professional qualification, designation, licence, or certification available for enrolment or award on this website. Event attendance or participation must not be represented as accredited certification.", hidden: true },
      { question: "How can I verify FOIHK leaders or credential claims?", answer: "Start with FOIHK's About and Credentials pages, then match the exact person, role, issuer, date, and source. Do not infer qualifications from similar names, photographs, event participation, or social profiles.", hidden: true },
      { question: "How should a family choose a Hong Kong family office service provider?", answer: "Define the required outcome, verify the contracting entity and relevant licences, examine qualifications, scope, fees, conflicts, custody, data controls, reporting, and exit terms, then begin with a bounded engagement.", hidden: true },
      { question: "Is FOIHK a registered charity or accredited nonprofit organization?", answer: "FOIHK does not make that claim on this website. Its published legal name is Family Office Institute Hong Kong Limited. Charity, tax-exempt, nonprofit, statutory, academic, or accreditation status should only be stated with support from the relevant official register or authorizing body.", hidden: true },
    ],
  },
  "zh-hk": {
    title: "FOIHK 常見問題：身份與一般問題",
    description: "直接解答有關香港家族辦公室學會身份及家辦行業的一般問題。",
    intro: "直接解答有關 FOIHK 身份、角色及香港家族辦公室行業的常見問題。",
    home: "首頁",
    generalTitle: "一般問題",
    servicesTitle: "服務與費用",
    moreTitle: "更多問題",
    updatedLabel: "最後更新",
    updated: "2026 年 8 月 3 日",
    items: [
      { question: "香港家族辦公室學會是甚麼機構？", answer: "香港家族辦公室學會（FOIHK）是立足香港的行業機構與專業社群，專注家族辦公室教育、研究、責任慈善、活動及跨界交流。" },
      { question: "甚麼是非牟利機構？", answer: "非牟利機構以公共、社群、專業、教育、慈善或其他訂明宗旨成立，而非向擁有人分派利潤。" },
      { question: "香港家族辦公室學會與其他家族辦公室機構有何不同？", answer: "FOIHK 以自身法定身份，以及行業機構與專業社群的公開定位作區分。FOIHK 並非政府機構、監管機構、銀行、資產管理人、聯合家族辦公室或認可資格頒授機構。" },
      { question: "香港家族辦公室學會提供甚麼？", answer: "FOIHK 提供教育與實用指南、以來源為本的研究、活動與專業對話、慈善與宗旨項目、機構合作，以及媒體或研究查詢支援。每項工作的範圍與供應情況會個別確認。", hidden: true },
      { question: "香港家族辦公室學會收費多少？", answer: "FOIHK 沒有在本網站公布一個適用於所有會員、課程、活動或服務的統一價格。公開內容可在沒有列明費用的情況下閱讀；如個別活動設有資格要求或收費，FOIHK 應在參加者承諾前確認範圍、金額、條款和取消安排。", hidden: true },
      { question: "如何開始參與香港家族辦公室學會？", answer: "先查閱服務與項目、教育與研究，以及新聞與活動頁面，再透過聯絡頁或電郵 info@foihk.org 提供目的、目標受眾、時間和機構資料，讓 FOIHK 確認是否合適、供應情況和下一步。", hidden: true },
      { question: "FOIHK 服務哪些人士和機構？", answer: "FOIHK 面向家族辦公室專業人士、家族成員、顧問、研究人員、慈善工作者、金融機構，以及參與家族辦公室生態的其他機構。" },
      { question: "甚麼是家族辦公室？", answer: "家族辦公室是協調家族財務與非財務事務的組織，職能可包括投資監督、家族治理、傳承、稅務與法律協調、慈善、風險管理及家族教育。" },
      { question: "單一家族辦公室與聯合家族辦公室有何不同？", answer: "單一家族辦公室只服務一個家族，按該家族的治理與控制需要設計；聯合家族辦公室則以共享平台和營運資源，向多個家族提供專業服務。" },
      { question: "香港為何對家族辦公室具有重要性？", answer: "香港具備深厚資本市場、國際聯繫、專業服務和通往亞洲機遇的優勢。政府於 2026 年 2 月公布的數據顯示，香港有超過 3,380 間單一家族辦公室。" },
      { question: "FOIHK 是否提供投資、法律或稅務意見？", answer: "FOIHK 發布教育及行業資訊。網站內容只供一般參考，不構成投資、法律、稅務、會計或其他受規管的專業意見。", hidden: true },
      { question: "如何參加 FOIHK 活動？", answer: "公開活動及參與詳情會在 FOIHK 新聞與活動頁公布。名額、資格及登記安排視乎個別活動而定。", hidden: true },
      { question: "機構可以與 FOIHK 合作嗎？", answer: "可以。院校、專業團體、服務機構、慈善組織及其他生態參與者，可聯絡 FOIHK 商討研究、教育、活動和社群項目。", hidden: true },
      { question: "FOIHK 發布哪些研究內容？", answer: "教育與研究專區涵蓋家族辦公室架構、治理、傳承、慈善、政策發展及香港家辦生態；在資料可得時，內容會列明來源和更新日期。", hidden: true },
      { question: "FOIHK 如何看待家族慈善？", answer: "FOIHK 透過教育、對話和社群項目，推動知情、負責任及重視影響力的慈善實踐，並不主張單一架構適合所有家族。", hidden: true },
      { question: "FOIHK 如何核實發布資料？", answer: "FOIHK 優先採用政府、監管機構、法定機構、學術及其他第一手來源。重要陳述應可追溯、有日期，並按公開的編輯政策審核。", hidden: true },
      { question: "如何提出更正或聯絡 FOIHK？", answer: "更正、來源查詢、合作或一般查詢，可電郵 info@foihk.org 或使用網站聯絡頁。請註明相關頁面及需要覆核的資料。" },
      { question: "FOIHK 是政府機構或金融監管機構嗎？", answer: "不是。FOIHK 是獨立的香港行業機構與專業社群。政府政策及監管要求應向相關官方機構查核。" },
      { question: "FOIHK 會管理家族資產或銷售金融產品嗎？", answer: "本網站不提供資產管理或金融產品服務。FOIHK 公開網站提供機構、教育、研究、活動及社群資訊。", hidden: true },
      { question: "香港家族辦公室是否需要證監會牌照？", answer: "單憑家族辦公室名稱不會觸發牌照。證監會指出，發牌制度以活動為本，並視乎所進行的受規管服務、是否以業務形式經營，以及業務是否在香港進行。", hidden: true },
      { question: "在哪裡可以比較單一家族辦公室和聯合家族辦公室？", answer: "FOIHK 教育與研究專區設有中立指南，比較服務範圍、控制、營運模式、成本結構及香港以活動為本的發牌語境。", hidden: true },
      { question: "FOIHK 網站內容多久覆核一次？", answer: "重要更正和實質更新應在作出時記錄。涉及時效的政策或監管內容，在使用前應重新查閱所連結的第一手來源。", hidden: true },
      { question: "媒體或研究人員可以引用 FOIHK 內容嗎？", answer: "可以，但應清楚署名並連結至具體頁面。統計及監管陳述宜優先引用 FOIHK 所連結的原始政府、監管或第一手來源。", hidden: true },
      { question: "FOIHK 網站支援哪些語言？", answer: "公開機構資訊及核心參考內容提供英文、繁體中文和簡體中文。沒有實質正文的語言版本會從索引中排除，而不會被視為完整頁面。", hidden: true },
      { question: "如何建議研究題目或活動合作？", answer: "可透過聯絡頁或電郵 info@foihk.org，提供建議題目、目標受眾、支持證據、建議形式及相關機構資料。" },
      { question: "FOIHK 是否頒發專業證書或資格？", answer: "FOIHK 目前沒有在本網站列出可報讀或頒授的認可專業資格、名銜、牌照或證書。出席或參與活動不得被表述為獲得認可證書。", hidden: true },
      { question: "如何核實 FOIHK 領導人或資歷陳述？", answer: "先查閱 FOIHK 的關於我們和資歷頁面，再配對準確人士、職務、頒發者、日期與來源。不要從同名人士、照片、活動參與或社交帳戶推斷資格。", hidden: true },
      { question: "家族應如何選擇香港家族辦公室服務供應商？", answer: "先界定所需成果，再核實簽約實體與相關牌照，檢視資格、範圍、費用、利益衝突、託管、數據控制、報告及退出條款，並由有限範圍的合作開始。", hidden: true },
      { question: "FOIHK 是否註冊慈善或獲認可非牟利機構？", answer: "FOIHK 沒有在本網站作出此項聲明。其公布法定名稱為 Family Office Institute Hong Kong Limited。慈善、稅務豁免、非牟利、法定、學術或認證身份，只應在相關官方登記或授權機構支持下陳述。", hidden: true },
    ],
  },
  "zh-cn": {
    title: "FOIHK 常见问题：身份与一般问题",
    description: "直接解答有关香港家族办公室学会身份及家办行业的一般问题。",
    intro: "直接解答有关 FOIHK 身份、角色及香港家族办公室行业的常见问题。",
    home: "首页",
    generalTitle: "一般问题",
    servicesTitle: "服务与费用",
    moreTitle: "更多问题",
    updatedLabel: "最后更新",
    updated: "2026 年 8 月 3 日",
    items: [
      { question: "香港家族办公室学会是什么机构？", answer: "香港家族办公室学会（FOIHK）是立足香港的行业机构与专业社群，专注家族办公室教育、研究、责任慈善、活动及跨界交流。" },
      { question: "什么是非营利组织？", answer: "非营利组织以公共、社群、专业、教育、慈善或其他规定宗旨成立，而不是向所有者分配利润。" },
      { question: "香港家族办公室学会与其他家族办公室机构有何不同？", answer: "FOIHK 以自身法定身份，以及行业机构与专业社群的公开定位作区分。FOIHK 并非政府机构、监管机构、银行、资产管理人、联合家族办公室或认可资格颁发机构。" },
      { question: "香港家族办公室学会提供什么？", answer: "FOIHK 提供教育与实用指南、以来源为本的研究、活动与专业对话、慈善与宗旨项目、机构合作，以及媒体或研究查询支持。每项工作的范围与供应情况会单独确认。", hidden: true },
      { question: "香港家族办公室学会收费多少？", answer: "FOIHK 没有在本网站公布一个适用于所有会员、课程、活动或服务的统一价格。公开内容可在没有列明费用的情况下阅读；如个别活动设有资格要求或收费，FOIHK 应在参与者承诺前确认范围、金额、条款和取消安排。", hidden: true },
      { question: "如何开始参与香港家族办公室学会？", answer: "先查阅服务与项目、教育与研究，以及新闻与活动页面，再通过联系页或电邮 info@foihk.org 提供目的、目标受众、时间和机构资料，让 FOIHK 确认是否合适、供应情况和下一步。", hidden: true },
      { question: "FOIHK 服务哪些人士和机构？", answer: "FOIHK 面向家族办公室专业人士、家族成员、顾问、研究人员、慈善工作者、金融机构，以及参与家族办公室生态的其他机构。" },
      { question: "什么是家族办公室？", answer: "家族办公室是协调家族财务与非财务事务的组织，职能可包括投资监督、家族治理、传承、税务与法律协调、慈善、风险管理及家族教育。" },
      { question: "单一家族办公室与联合家族办公室有何不同？", answer: "单一家族办公室只服务一个家族，按该家族的治理与控制需要设计；联合家族办公室则以共享平台和运营资源，向多个家族提供专业服务。" },
      { question: "香港为何对家族办公室具有重要性？", answer: "香港具备深厚资本市场、国际联系、专业服务和通往亚洲机遇的优势。政府于 2026 年 2 月公布的数据显示，香港有超过 3,380 家单一家族办公室。" },
      { question: "FOIHK 是否提供投资、法律或税务意见？", answer: "FOIHK 发布教育及行业信息。网站内容只供一般参考，不构成投资、法律、税务、会计或其他受监管的专业意见。", hidden: true },
      { question: "如何参加 FOIHK 活动？", answer: "公开活动及参与详情会在 FOIHK 新闻与活动页公布。名额、资格及登记安排视个别活动而定。", hidden: true },
      { question: "机构可以与 FOIHK 合作吗？", answer: "可以。院校、专业团体、服务机构、慈善组织及其他生态参与者，可联系 FOIHK 商讨研究、教育、活动和社群项目。", hidden: true },
      { question: "FOIHK 发布哪些研究内容？", answer: "教育与研究专区涵盖家族办公室架构、治理、传承、慈善、政策发展及香港家办生态；在资料可得时，内容会列明来源和更新日期。", hidden: true },
      { question: "FOIHK 如何看待家族慈善？", answer: "FOIHK 通过教育、对话和社群项目，推动知情、负责任及重视影响力的慈善实践，并不主张单一架构适合所有家族。", hidden: true },
      { question: "FOIHK 如何核实发布资料？", answer: "FOIHK 优先采用政府、监管机构、法定机构、学术及其他第一手来源。重要陈述应可追溯、有日期，并按公开的编辑政策审核。", hidden: true },
      { question: "如何提出更正或联系 FOIHK？", answer: "更正、来源查询、合作或一般查询，可电邮 info@foihk.org 或使用网站联系页。请注明相关页面及需要复核的资料。" },
      { question: "FOIHK 是政府机构或金融监管机构吗？", answer: "不是。FOIHK 是独立的香港行业机构与专业社群。政府政策及监管要求应向相关官方机构核查。" },
      { question: "FOIHK 会管理家族资产或销售金融产品吗？", answer: "本网站不提供资产管理或金融产品服务。FOIHK 公开网站提供机构、教育、研究、活动及社群信息。", hidden: true },
      { question: "香港家族办公室是否需要证监会牌照？", answer: "单凭家族办公室名称不会触发牌照。证监会指出，发牌制度以活动为本，并视所进行的受监管服务、是否以业务形式经营，以及业务是否在香港进行。", hidden: true },
      { question: "在哪里可以比较单一家族办公室和联合家族办公室？", answer: "FOIHK 教育与研究专区设有中立指南，比较服务范围、控制、运营模式、成本结构及香港以活动为本的发牌语境。", hidden: true },
      { question: "FOIHK 网站内容多久复核一次？", answer: "重要更正和实质更新应在作出时记录。涉及时效的政策或监管内容，在使用前应重新查阅所链接的第一手来源。", hidden: true },
      { question: "媒体或研究人员可以引用 FOIHK 内容吗？", answer: "可以，但应清楚署名并链接至具体页面。统计及监管陈述宜优先引用 FOIHK 所链接的原始政府、监管或第一手来源。", hidden: true },
      { question: "FOIHK 网站支持哪些语言？", answer: "公开机构信息及核心参考内容提供英文、繁体中文和简体中文。没有实质正文的语言版本会从索引中排除，而不会被视为完整页面。", hidden: true },
      { question: "如何建议研究题目或活动合作？", answer: "可通过联系页或电邮 info@foihk.org，提供建议题目、目标受众、支持证据、建议形式及相关机构资料。" },
      { question: "FOIHK 是否颁发专业证书或资格？", answer: "FOIHK 目前没有在本网站列出可报读或颁授的认可专业资格、名衔、牌照或证书。出席或参与活动不得被表述为获得认可证书。", hidden: true },
      { question: "如何核实 FOIHK 领导人或资历陈述？", answer: "先查阅 FOIHK 的关于我们和资历页面，再匹配准确人士、职务、颁发者、日期与来源。不要从同名人士、照片、活动参与或社交账户推断资格。", hidden: true },
      { question: "家族应如何选择香港家族办公室服务供应商？", answer: "先界定所需成果，再核实签约实体与相关牌照，检视资格、范围、费用、利益冲突、托管、数据控制、报告及退出条款，并由有限范围的合作开始。", hidden: true },
      { question: "FOIHK 是否注册慈善或获认可非营利机构？", answer: "FOIHK 没有在本网站作出此项声明。其公布法定名称为 Family Office Institute Hong Kong Limited。慈善、税务豁免、非营利、法定、学术或认证身份，只应在相关官方登记或授权机构支持下陈述。", hidden: true },
    ],
  },
};

const FAQ = () => {
  const { language } = useLanguage();
  const copy = COPY[language];
  const canonical = `https://www.foihk.org/${language}/faq`;
  const visibleItems = copy.items.filter((item) => !item.hidden);
  const groups = [
    { id: "general-questions", title: copy.generalTitle, items: copy.items.slice(0, 3).filter((item) => !item.hidden) },
    { id: "services-and-pricing", title: copy.servicesTitle, items: copy.items.slice(3, 6).filter((item) => !item.hidden) },
    { id: "more-questions", title: copy.moreTitle, items: copy.items.slice(6).filter((item) => !item.hidden) },
  ].filter((group) => group.items.length > 0);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "name": copy.title,
    "description": copy.description,
    "url": canonical,
    "dateModified": UPDATED_ISO,
    "inLanguage": language === "en" ? "en" : language === "zh-hk" ? "zh-Hant" : "zh-Hans",
    "publisher": {
      "@type": "Organization",
      "@id": `${ORGANIZATION_URL}/#organization`,
      "name": ORGANIZATION_ENGLISH_NAME,
      "legalName": ORGANIZATION_LEGAL_NAME,
      "alternateName": ORGANIZATION_ALTERNATE_NAMES,
      "url": ORGANIZATION_URL,
    },
    "mainEntity": visibleItems.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={copy.title}
        description={copy.description}
        structuredData={faqSchema}
      />
      <Navigation />
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <Breadcrumbs items={[{ label: copy.home, to: "/" }, { label: copy.title }]} />
        <header className="mb-10">
          <h1 className="mb-4 text-4xl font-bold text-foreground">{copy.title}</h1>
          <p className="mb-4 text-lg text-muted-foreground">{copy.intro}</p>
          <p className="text-sm text-muted-foreground">
            {copy.updatedLabel}: <time dateTime={UPDATED_ISO}>{copy.updated}</time>
          </p>
        </header>
        <div className="space-y-12">
          {groups.map((group) => (
            <section key={group.id} aria-labelledby={group.id} data-faq-group>
              <h2 id={group.id} className="mb-5 text-2xl font-bold text-foreground">{group.title}</h2>
              <div className="divide-y divide-border border-y border-border">
                {group.items.map((item) => (
                  <details key={item.question} className="group py-5">
                    <summary className="cursor-pointer list-none pr-8 text-lg font-semibold text-foreground marker:content-none">
                      {item.question}
                    </summary>
                    <p className="mt-3 leading-7 text-muted-foreground">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
