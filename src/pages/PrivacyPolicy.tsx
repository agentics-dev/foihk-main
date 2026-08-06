import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import {
  ORGANIZATION_ENGLISH_NAME,
  ORGANIZATION_LEGAL_NAME,
  ORGANIZATION_URL,
} from "@/lib/schema";

interface PrivacyCopy {
  title: string;
  description: string;
  home: string;
  updatedLabel: string;
  updated: string;
  intro: string;
  sections: Array<{ heading: string; body: string }>;
}

const UPDATED_ISO = "2026-08-03";

const COPY: Record<Language, PrivacyCopy> = {
  en: {
    title: "Privacy Policy",
    description: "FOIHK privacy policy for website enquiries, technical logs, local preferences, analytics status, service providers, retention, and correction contacts.",
    home: "Home",
    updatedLabel: "Last updated",
    updated: "3 August 2026",
    intro: "This privacy policy explains how Family Office Institute Hong Kong Limited handles information received through the FOIHK public website.",
    sections: [
      { heading: "Who we are", body: "Family Office Institute Hong Kong Limited operates foihk.org as the public website for FOIHK, a Hong Kong family office industry institution and professional community." },
      { heading: "Information we may receive", body: "We may receive information that you choose to provide, such as your name, organization, role, email address, phone number, enquiry details, event or partnership interests, and correction requests. The website may also generate technical logs such as browser type, requested page, time, and security events." },
      { heading: "How we use information", body: "Information is used to respond to enquiries, manage event or collaboration discussions, maintain website security, improve public content, correct published information, and meet applicable operational or legal requirements." },
      { heading: "Cookies, local preferences, and analytics", body: "The public website may store a language preference in the visitor's browser. Google Analytics 4 remains inactive unless a valid measurement ID and privacy approval are configured. When enabled, it may process page views, approximate location, device and browser information, referral domains, and whether a visit came from a named AI assistant. FOIHK disables Google signals and advertising personalisation in the site configuration and does not send enquiry text, names, email addresses, or phone numbers as analytics event parameters." },
      { heading: "Service providers", body: "Website hosting, authentication, content storage, email, security, and infrastructure providers may process limited information for FOIHK under their service terms. FOIHK does not sell personal information." },
      { heading: "Retention", body: "Information is kept only for as long as reasonably needed for the purpose for which it was received, including enquiry handling, content review, security, record keeping, and legal or operational requirements." },
      { heading: "Your choices", body: "You may contact info@foihk.org to ask about information you provided, request correction, or raise a privacy question. Please identify the relevant enquiry, page, or correspondence so the request can be reviewed." },
      { heading: "Updates", body: "This page may be updated when FOIHK changes website functionality, service providers, analytics settings, or privacy handling practices. The update date on this page records the latest revision." },
    ],
  },
  "zh-hk": {
    title: "私隱政策",
    description: "FOIHK 有關網站查詢、技術紀錄、本地偏好、分析狀態、服務供應商、保留期限及更正聯絡方式的私隱政策。",
    home: "首頁",
    updatedLabel: "最後更新",
    updated: "2026 年 8 月 3 日",
    intro: "本私隱政策說明 Family Office Institute Hong Kong Limited 如何處理透過 FOIHK 公開網站收到的資料。",
    sections: [
      { heading: "我們是誰", body: "Family Office Institute Hong Kong Limited 營運 foihk.org，作為 FOIHK 的公開網站。FOIHK 是立足香港的家族辦公室行業機構與專業社群。" },
      { heading: "我們可能收到的資料", body: "我們可能收到你主動提供的資料，例如姓名、機構、職銜、電郵地址、電話、查詢內容、活動或合作興趣，以及更正要求。網站亦可能產生技術紀錄，例如瀏覽器類型、請求頁面、時間及安全事件。" },
      { heading: "資料用途", body: "資料用於回覆查詢、處理活動或合作討論、維護網站安全、改善公開內容、更正已發布資料，以及符合適用的營運或法律要求。" },
      { heading: "Cookie、本地偏好與分析", body: "公開網站可在訪客瀏覽器儲存語言偏好。除非已設定有效 Measurement ID 並完成私隱確認，Google Analytics 4 會維持停用。啟用後，它可能處理頁面瀏覽、概略位置、裝置與瀏覽器資料、引薦網域，以及訪問是否來自具名 AI 助手。網站設定會停用 Google signals 及廣告個人化，亦不會把查詢內容、姓名、電郵地址或電話作為分析事件參數傳送。" },
      { heading: "服務供應商", body: "網站託管、身份驗證、內容儲存、電郵、安全及基礎設施供應商，可能按其服務條款為 FOIHK 處理有限資料。FOIHK 不會出售個人資料。" },
      { heading: "保留期限", body: "資料只會在合理需要期間保留，包括查詢處理、內容覆核、安全、紀錄保存，以及法律或營運要求。" },
      { heading: "你的選擇", body: "你可電郵 info@foihk.org 查詢所提供資料、要求更正或提出私隱問題。請列明相關查詢、頁面或通訊，以便覆核。" },
      { heading: "政策更新", body: "當 FOIHK 更改網站功能、服務供應商、分析設定或私隱處理方式，本頁可能更新。本頁的更新日期記錄最新修訂。" },
    ],
  },
  "zh-cn": {
    title: "隐私政策",
    description: "FOIHK 有关网站查询、技术记录、本地偏好、分析状态、服务提供商、保留期限及更正联系方式的隐私政策。",
    home: "首页",
    updatedLabel: "最后更新",
    updated: "2026 年 8 月 3 日",
    intro: "本隐私政策说明 Family Office Institute Hong Kong Limited 如何处理通过 FOIHK 公开网站收到的资料。",
    sections: [
      { heading: "我们是谁", body: "Family Office Institute Hong Kong Limited 运营 foihk.org，作为 FOIHK 的公开网站。FOIHK 是立足香港的家族办公室行业机构与专业社群。" },
      { heading: "我们可能收到的资料", body: "我们可能收到你主动提供的资料，例如姓名、机构、职衔、电邮地址、电话、查询内容、活动或合作兴趣，以及更正要求。网站也可能产生技术记录，例如浏览器类型、请求页面、时间及安全事件。" },
      { heading: "资料用途", body: "资料用于回复查询、处理活动或合作讨论、维护网站安全、改善公开内容、更正已发布资料，以及符合适用的运营或法律要求。" },
      { heading: "Cookie、本地偏好与分析", body: "公开网站可在访客浏览器储存语言偏好。除非已设置有效 Measurement ID 并完成隐私确认，Google Analytics 4 会保持停用。启用后，它可能处理页面浏览、概略位置、设备与浏览器资料、引荐域名，以及访问是否来自具名 AI 助手。网站设置会停用 Google signals 及广告个性化，也不会把查询内容、姓名、电邮地址或电话作为分析事件参数发送。" },
      { heading: "服务提供商", body: "网站托管、身份验证、内容储存、电邮、安全及基础设施提供商，可能按其服务条款为 FOIHK 处理有限资料。FOIHK 不会出售个人资料。" },
      { heading: "保留期限", body: "资料只会在合理需要期间保留，包括查询处理、内容复核、安全、记录保存，以及法律或运营要求。" },
      { heading: "你的选择", body: "你可电邮 info@foihk.org 查询所提供资料、要求更正或提出隐私问题。请列明相关查询、页面或通讯，以便复核。" },
      { heading: "政策更新", body: "当 FOIHK 更改网站功能、服务提供商、分析设置或隐私处理方式，本页可能更新。本页的更新日期记录最新修订。" },
    ],
  },
};

const PrivacyPolicy = () => {
  const { language } = useLanguage();
  const copy = COPY[language];
  const canonical = `${ORGANIZATION_URL}/${language}/privacy-policy`;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={copy.title}
        description={copy.description}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "PrivacyPolicy",
          "name": copy.title,
          "description": copy.description,
          "url": canonical,
          "datePublished": UPDATED_ISO,
          "dateModified": UPDATED_ISO,
          "inLanguage": language === "en" ? "en" : language === "zh-hk" ? "zh-Hant" : "zh-Hans",
          "publisher": {
            "@type": "Organization",
            "@id": `${ORGANIZATION_URL}/#organization`,
            "name": ORGANIZATION_ENGLISH_NAME,
            "legalName": ORGANIZATION_LEGAL_NAME,
            "url": ORGANIZATION_URL,
          },
        }}
      />
      <Navigation />
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <Breadcrumbs items={[{ label: copy.home, to: "/" }, { label: copy.title }]} />
        <header className="mb-10 border-b border-border pb-8">
          <h1 className="mb-4 text-4xl font-bold text-foreground">{copy.title}</h1>
          <p className="mb-4 text-lg leading-8 text-muted-foreground">{copy.intro}</p>
          <p className="text-sm text-muted-foreground">
            {copy.updatedLabel}: <time dateTime={UPDATED_ISO}>{copy.updated}</time>
          </p>
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

export default PrivacyPolicy;
