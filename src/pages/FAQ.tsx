import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { useLanguage, type Language } from "@/contexts/LanguageContext";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCopy {
  title: string;
  description: string;
  intro: string;
  home: string;
  items: FAQItem[];
}

const COPY: Record<Language, FAQCopy> = {
  en: {
    title: "Frequently Asked Questions",
    description: "Answers about FOIHK, Hong Kong family offices, research, events, partnerships, philanthropy, and ways to participate.",
    intro: "Concise answers about the Family Office Institute Hong Kong and the family office sector.",
    home: "Home",
    items: [
      { question: "What is the Family Office Institute Hong Kong?", answer: "The Family Office Institute Hong Kong (FOIHK) is a Hong Kong industry institution and professional community focused on family office education, research, responsible philanthropy, events, and cross-sector exchange." },
      { question: "Who does FOIHK serve?", answer: "FOIHK serves family office professionals, family principals, advisers, researchers, philanthropic practitioners, financial institutions, and other organizations working with the family office ecosystem." },
      { question: "What is a family office?", answer: "A family office is an organization established to coordinate a family's financial and non-financial affairs. Its scope can include investment oversight, governance, succession, tax and legal coordination, philanthropy, risk management, and family education." },
      { question: "What is the difference between a single-family office and a multi-family office?", answer: "A single-family office serves one family and is designed around that family's governance and control needs. A multi-family office provides shared professional services to several families, usually with a broader platform and shared operating resources." },
      { question: "Why is Hong Kong important to family offices?", answer: "Hong Kong combines deep capital markets, international connectivity, professional services, and access to Asian opportunities. Government data published in February 2026 identified more than 3,380 single-family offices in the city." },
      { question: "Does FOIHK provide investment, legal, or tax advice?", answer: "FOIHK publishes educational and industry information. Website content is general information and is not investment, legal, tax, accounting, or other regulated professional advice." },
      { question: "How can I attend FOIHK events?", answer: "Public events and participation details are announced through FOIHK news and event pages. Availability, eligibility, and registration arrangements depend on each event." },
      { question: "Can organizations collaborate with FOIHK?", answer: "Yes. Academic institutions, professional bodies, service providers, philanthropic organizations, and other ecosystem participants may contact FOIHK to discuss research, education, events, and community initiatives." },
      { question: "What research does FOIHK publish?", answer: "FOIHK's education and research hub covers family office structures, governance, succession, philanthropy, policy developments, and Hong Kong's family office ecosystem. Sources and update dates are shown where available." },
      { question: "How does FOIHK approach philanthropy?", answer: "FOIHK promotes informed, responsible, and impact-aware giving through education, dialogue, and community initiatives. It does not claim that one philanthropic structure is suitable for every family." },
      { question: "How does FOIHK check published information?", answer: "FOIHK prioritizes official government, regulatory, statutory, academic, and primary organizational sources. Material claims should be attributable, dated, and reviewed under the published editorial policy." },
      { question: "How can I request a correction or contact FOIHK?", answer: "Send correction requests, source questions, partnership enquiries, or general messages to info@foihk.org or use the website contact page. Please identify the relevant page and the information to be reviewed." },
    ],
  },
  "zh-hk": {
    title: "常見問題",
    description: "解答有關 FOIHK、香港家族辦公室、研究、活動、合作、慈善及參與方式的常見問題。",
    intro: "關於香港家族辦公室學會及家族辦公室行業的簡明解答。",
    home: "首頁",
    items: [
      { question: "香港家族辦公室學會是甚麼機構？", answer: "香港家族辦公室學會（FOIHK）是立足香港的行業機構與專業社群，專注家族辦公室教育、研究、責任慈善、活動及跨界交流。" },
      { question: "FOIHK 服務哪些人士和機構？", answer: "FOIHK 面向家族辦公室專業人士、家族成員、顧問、研究人員、慈善工作者、金融機構，以及參與家族辦公室生態的其他機構。" },
      { question: "甚麼是家族辦公室？", answer: "家族辦公室是協調家族財務與非財務事務的組織，職能可包括投資監督、家族治理、傳承、稅務與法律協調、慈善、風險管理及家族教育。" },
      { question: "單一家族辦公室與聯合家族辦公室有何不同？", answer: "單一家族辦公室只服務一個家族，按該家族的治理與控制需要設計；聯合家族辦公室則以共享平台和營運資源，向多個家族提供專業服務。" },
      { question: "香港為何對家族辦公室具有重要性？", answer: "香港具備深厚資本市場、國際聯繫、專業服務和通往亞洲機遇的優勢。政府於 2026 年 2 月公布的數據顯示，香港有超過 3,380 間單一家族辦公室。" },
      { question: "FOIHK 是否提供投資、法律或稅務意見？", answer: "FOIHK 發布教育及行業資訊。網站內容只供一般參考，不構成投資、法律、稅務、會計或其他受規管的專業意見。" },
      { question: "如何參加 FOIHK 活動？", answer: "公開活動及參與詳情會在 FOIHK 新聞與活動頁公布。名額、資格及登記安排視乎個別活動而定。" },
      { question: "機構可以與 FOIHK 合作嗎？", answer: "可以。院校、專業團體、服務機構、慈善組織及其他生態參與者，可聯絡 FOIHK 商討研究、教育、活動和社群項目。" },
      { question: "FOIHK 發布哪些研究內容？", answer: "教育與研究專區涵蓋家族辦公室架構、治理、傳承、慈善、政策發展及香港家辦生態；在資料可得時，內容會列明來源和更新日期。" },
      { question: "FOIHK 如何看待家族慈善？", answer: "FOIHK 透過教育、對話和社群項目，推動知情、負責任及重視影響力的慈善實踐，並不主張單一架構適合所有家族。" },
      { question: "FOIHK 如何核實發布資料？", answer: "FOIHK 優先採用政府、監管機構、法定機構、學術及其他第一手來源。重要陳述應可追溯、有日期，並按公開的編輯政策審核。" },
      { question: "如何提出更正或聯絡 FOIHK？", answer: "更正、來源查詢、合作或一般查詢，可電郵 info@foihk.org 或使用網站聯絡頁。請註明相關頁面及需要覆核的資料。" },
    ],
  },
  "zh-cn": {
    title: "常见问题",
    description: "解答有关 FOIHK、香港家族办公室、研究、活动、合作、慈善及参与方式的常见问题。",
    intro: "关于香港家族办公室学会及家族办公室行业的简明解答。",
    home: "首页",
    items: [
      { question: "香港家族办公室学会是什么机构？", answer: "香港家族办公室学会（FOIHK）是立足香港的行业机构与专业社群，专注家族办公室教育、研究、责任慈善、活动及跨界交流。" },
      { question: "FOIHK 服务哪些人士和机构？", answer: "FOIHK 面向家族办公室专业人士、家族成员、顾问、研究人员、慈善工作者、金融机构，以及参与家族办公室生态的其他机构。" },
      { question: "什么是家族办公室？", answer: "家族办公室是协调家族财务与非财务事务的组织，职能可包括投资监督、家族治理、传承、税务与法律协调、慈善、风险管理及家族教育。" },
      { question: "单一家族办公室与联合家族办公室有何不同？", answer: "单一家族办公室只服务一个家族，按该家族的治理与控制需要设计；联合家族办公室则以共享平台和运营资源，向多个家族提供专业服务。" },
      { question: "香港为何对家族办公室具有重要性？", answer: "香港具备深厚资本市场、国际联系、专业服务和通往亚洲机遇的优势。政府于 2026 年 2 月公布的数据显示，香港有超过 3,380 家单一家族办公室。" },
      { question: "FOIHK 是否提供投资、法律或税务意见？", answer: "FOIHK 发布教育及行业信息。网站内容只供一般参考，不构成投资、法律、税务、会计或其他受监管的专业意见。" },
      { question: "如何参加 FOIHK 活动？", answer: "公开活动及参与详情会在 FOIHK 新闻与活动页公布。名额、资格及登记安排视个别活动而定。" },
      { question: "机构可以与 FOIHK 合作吗？", answer: "可以。院校、专业团体、服务机构、慈善组织及其他生态参与者，可联系 FOIHK 商讨研究、教育、活动和社群项目。" },
      { question: "FOIHK 发布哪些研究内容？", answer: "教育与研究专区涵盖家族办公室架构、治理、传承、慈善、政策发展及香港家办生态；在资料可得时，内容会列明来源和更新日期。" },
      { question: "FOIHK 如何看待家族慈善？", answer: "FOIHK 通过教育、对话和社群项目，推动知情、负责任及重视影响力的慈善实践，并不主张单一架构适合所有家族。" },
      { question: "FOIHK 如何核实发布资料？", answer: "FOIHK 优先采用政府、监管机构、法定机构、学术及其他第一手来源。重要陈述应可追溯、有日期，并按公开的编辑政策审核。" },
      { question: "如何提出更正或联系 FOIHK？", answer: "更正、来源查询、合作或一般查询，可电邮 info@foihk.org 或使用网站联系页。请注明相关页面及需要复核的资料。" },
    ],
  },
};

const FAQ = () => {
  const { language } = useLanguage();
  const copy = COPY[language];
  const canonical = `https://www.foihk.org/${language}/faq`;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": copy.items.map((item) => ({
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
        breadcrumbs={[
          { name: copy.home, url: `https://www.foihk.org/${language}` },
          { name: copy.title, url: canonical },
        ]}
      />
      <Navigation />
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <Breadcrumbs items={[{ label: copy.home, to: "/" }, { label: copy.title }]} />
        <header className="mb-10">
          <h1 className="mb-4 text-4xl font-bold text-foreground">{copy.title}</h1>
          <p className="text-lg text-muted-foreground">{copy.intro}</p>
        </header>
        <div className="divide-y divide-border border-y border-border">
          {copy.items.map((item) => (
            <details key={item.question} className="group py-5">
              <summary className="cursor-pointer list-none pr-8 text-lg font-semibold text-foreground marker:content-none">
                {item.question}
              </summary>
              <p className="mt-3 leading-7 text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
