import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LocalizedLink as Link } from "@/components/LocalizedLink";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { ExternalLink, Linkedin, Mail, MapPin, ShieldCheck } from "lucide-react";
import purposeBg from "@/assets/purpose-bg.webp";
import visionBg from "@/assets/vision-bg.webp";
import missionBg from "@/assets/mission-bg.webp";
import foundingChairman from "@/assets/founding-chairman.webp";
import foundingSecretary from "@/assets/founding-secretary.webp";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import {
  ORGANIZATION_ADDRESS,
  ORGANIZATION_ALTERNATE_NAMES,
  ORGANIZATION_CONTACT_POINT,
  ORGANIZATION_EMAIL,
  ORGANIZATION_ENGLISH_NAME,
  ORGANIZATION_FOUNDING_DATE,
  ORGANIZATION_LEGAL_NAME,
  ORGANIZATION_LINKEDIN_URL,
  ORGANIZATION_MEDIA_MENTION_URL,
  ORGANIZATION_SAME_AS,
  ORGANIZATION_SUPPORTER_MENTION_URL,
  ORGANIZATION_URL,
} from "@/lib/schema";

const LEO_LINKEDIN_URL = "https://hk.linkedin.com/in/leo-lai-6b45168";
const UPDATED_ISO = "2026-08-03";

const TRUST_COPY: Record<Language, {
  definition: string;
  leadershipIntro: string;
  chairmanBio: string;
  secretaryBio: string;
  detailsTitle: string;
  detailsIntro: string;
  legalName: string;
  established: string;
  email: string;
  address: string;
  website: string;
  linkedin: string;
  evidenceTitle: string;
  evidenceIntro: string;
  evidenceItems: Array<{ title: string; statement: string; linkLabel: string; href: string }>;
  clientDisclosureTitle: string;
  clientDisclosureBody: string;
  accountabilityTitle: string;
  accountabilityBody: string;
  editorialPolicy: string;
}> = {
  en: {
    definition: "Family Office Institute Hong Kong (FOIHK) is a Hong Kong family office industry institution and professional community for education, research, events, philanthropy, and cross-sector exchange. It is not a family office, financial institution, regulator, or government agency.",
    leadershipIntro: "FOIHK's founding office holders help shape the institute's education, research, events, philanthropy, and cross-sector exchange agenda.",
    chairmanBio: "Lai King Man, Leo serves as FOIHK's Founding Chairman. His work with the institute centres on convening family-office practitioners, supporting public education, and encouraging dialogue across wealth stewardship, legacy planning, philanthropy, culture, and professional services.",
    secretaryBio: "Chan Man Ching serves as FOIHK's Founding Secretary. Her work supports the institute's governance, member communication, programme coordination, and day-to-day institutional development.",
    detailsTitle: "Verified organization details",
    detailsIntro: "Use these details to verify FOIHK and distinguish it from similarly named organizations.",
    legalName: "Legal name",
    established: "Established",
    email: "Email",
    address: "Hong Kong address",
    website: "Official website",
    linkedin: "Official LinkedIn",
    evidenceTitle: "Independent evidence and public mentions",
    evidenceIntro: "These sources verify specific facts about FOIHK or its publicly identified leadership. A mention is evidence only for the statement described; it is not treated as a customer endorsement, accreditation, or regulatory approval.",
    evidenceItems: [
      { title: "Independent media interview", statement: "Economic Digest named founding chairman Lai King Man, Leo in its March 2026 coverage of art allocation, diversification, philanthropy, and intergenerational legacy in family offices.", linkLabel: "Read the Economic Digest article", href: ORGANIZATION_MEDIA_MENTION_URL },
      { title: "Public supporter acknowledgement", statement: "A Hong Kong Chinese Orchestra publication lists Family Office Institute Hong Kong in its public supporter acknowledgements.", linkLabel: "View the HKCO publication", href: ORGANIZATION_SUPPORTER_MENTION_URL },
    ],
    clientDisclosureTitle: "Customer and case-study disclosure",
    clientDisclosureBody: "FOIHK does not currently publish a named customer list or quantified customer success stories on this website. Event attendance, membership, speaking, partnership, donor acknowledgement, and media coverage do not by themselves prove a customer relationship or outcome. A future named case study will require the participant's permission, a defined period and baseline, a reviewable method, and evidence for every reported number.",
    accountabilityTitle: "Editorial accountability",
    accountabilityBody: "Unless a named individual author or reviewer is confirmed on an article, FOIHK content is attributed to the FOIHK Editorial Team as an institutional author. Articles show publication and update dates, and material claims should link to reviewable sources.",
    editorialPolicy: "Read the editorial policy",
  },
  "zh-hk": {
    definition: "香港家族辦公室學會（FOIHK）是香港家族辦公室行業機構與專業社群，涵蓋教育、研究、活動、慈善及跨界交流。FOIHK 並非家族辦公室、金融機構、監管機構或政府部門。",
    leadershipIntro: "FOIHK 的創會職務負責人參與推動學會的教育、研究、活動、慈善及跨界交流工作。",
    chairmanBio: "賴敬文擔任 FOIHK 創會主席，主要參與凝聚家族辦公室專業人士、推動公共教育，並促進財富傳承、慈善、文化及專業服務之間的交流。",
    secretaryBio: "陳文清擔任 FOIHK 創會秘書長，主要支援學會治理、會員溝通、項目協調及日常機構發展。",
    detailsTitle: "已核實機構資料",
    detailsIntro: "請使用以下資料核實 FOIHK，並與名稱相近的機構作出區分。",
    legalName: "法定名稱",
    established: "成立日期",
    email: "電郵",
    address: "香港地址",
    website: "官方網站",
    linkedin: "官方 LinkedIn",
    evidenceTitle: "獨立證據與公開提及",
    evidenceIntro: "以下來源只核實所描述的 FOIHK 事實或其公開確認領導角色。公開提及不等同客戶推薦、認證或監管認可。",
    evidenceItems: [
      { title: "獨立媒體訪問", statement: "《經濟一週》在 2026 年 3 月有關家族辦公室藝術配置、分散風險、慈善及跨代傳承的報道中，具名訪問創會主席賴敬文。", linkLabel: "閱讀《經濟一週》報道", href: ORGANIZATION_MEDIA_MENTION_URL },
      { title: "公開支持者鳴謝", statement: "香港中樂團的公開刊物在支持者鳴謝名單中列出香港家族辦公室學會。", linkLabel: "查看香港中樂團刊物", href: ORGANIZATION_SUPPORTER_MENTION_URL },
    ],
    clientDisclosureTitle: "客戶與案例披露",
    clientDisclosureBody: "FOIHK 目前沒有在本網站發布具名客戶名單或包含量化成果的客戶成功案例。活動出席、會員身份、講者、合作、捐助鳴謝及媒體報道，本身不能證明客戶關係或成果。未來發布具名案例前，必須取得參與者同意，列明時段與基準、可覆核方法，並為每項數字提供證據。",
    accountabilityTitle: "編輯問責",
    accountabilityBody: "除非文章已確認具名個人作者或審閱者，FOIHK 內容均由 FOIHK 編輯團隊以機構作者身份署名。文章顯示發布與更新日期，重要陳述亦應連結至可供覆核的來源。",
    editorialPolicy: "閱讀編輯政策",
  },
  "zh-cn": {
    definition: "香港家族办公室学会（FOIHK）是香港家族办公室行业机构与专业社群，涵盖教育、研究、活动、慈善及跨界交流。FOIHK 并非家族办公室、金融机构、监管机构或政府部门。",
    leadershipIntro: "FOIHK 的创会职务负责人参与推动学会的教育、研究、活动、慈善及跨界交流工作。",
    chairmanBio: "赖敬文担任 FOIHK 创会主席，主要参与凝聚家族办公室专业人士、推动公共教育，并促进财富传承、慈善、文化及专业服务之间的交流。",
    secretaryBio: "陈文清担任 FOIHK 创会秘书长，主要支持学会治理、会员沟通、项目协调及日常机构发展。",
    detailsTitle: "已核实机构资料",
    detailsIntro: "请使用以下资料核实 FOIHK，并与名称相近的机构作出区分。",
    legalName: "法定名称",
    established: "成立日期",
    email: "电邮",
    address: "香港地址",
    website: "官方网站",
    linkedin: "官方 LinkedIn",
    evidenceTitle: "独立证据与公开提及",
    evidenceIntro: "以下来源仅核实所描述的 FOIHK 事实或其公开确认领导角色。公开提及不等同客户推荐、认证或监管认可。",
    evidenceItems: [
      { title: "独立媒体访问", statement: "《经济一周》在 2026 年 3 月有关家族办公室艺术配置、分散风险、慈善及跨代传承的报道中，具名访问创会主席赖敬文。", linkLabel: "阅读《经济一周》报道", href: ORGANIZATION_MEDIA_MENTION_URL },
      { title: "公开支持者鸣谢", statement: "香港中乐团的公开刊物在支持者鸣谢名单中列出香港家族办公室学会。", linkLabel: "查看香港中乐团刊物", href: ORGANIZATION_SUPPORTER_MENTION_URL },
    ],
    clientDisclosureTitle: "客户与案例披露",
    clientDisclosureBody: "FOIHK 目前没有在本网站发布具名客户名单或包含量化成果的客户成功案例。活动出席、会员身份、讲者、合作、捐助鸣谢及媒体报道，本身不能证明客户关系或成果。未来发布具名案例前，必须取得参与者同意，列明时段与基准、可复核方法，并为每项数字提供证据。",
    accountabilityTitle: "编辑问责",
    accountabilityBody: "除非文章已确认具名个人作者或审阅者，FOIHK 内容均由 FOIHK 编辑团队以机构作者身份署名。文章显示发布与更新日期，重要陈述也应链接至可供复核的来源。",
    editorialPolicy: "阅读编辑政策",
  },
};

const About = () => {
  const { t, language } = useLanguage();
  const homeLabel = language === "en" ? "Home" : language === "zh-hk" ? "首頁" : "首页";
  const meta = language === "en"
    ? { title: "About FOIHK", description: "Learn about FOIHK's purpose, mission, leadership, and role as a Hong Kong family office industry institution and professional community." }
    : language === "zh-hk"
      ? { title: "關於香港家族辦公室學會", description: "了解 FOIHK 的宗旨、使命、領導團隊，以及作為香港家族辦公室行業機構與專業社群的角色。" }
      : { title: "关于香港家族办公室学会", description: "了解 FOIHK 的宗旨、使命、领导团队，以及作为香港家族办公室行业机构与专业社群的角色。" };
  const trust = TRUST_COPY[language];
  
  // Scroll animations for each section
  const titleAnim = useScrollAnimation(0.3);
  const purposeAnim = useScrollAnimation(0.3);
  const visionAnim = useScrollAnimation(0.3);
  const missionAnim = useScrollAnimation(0.3);
  const leadershipHeaderAnim = useScrollAnimation(0.3);
  const leadershipCard1Anim = useScrollAnimation(0.3);
  const leadershipCard2Anim = useScrollAnimation(0.3);
  return <div className="min-h-screen bg-background">
      <SEO
        title={meta.title}
        description={meta.description}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": t("about.title"),
          "description": meta.description,
          "dateModified": UPDATED_ISO,
          "citation": [ORGANIZATION_MEDIA_MENTION_URL, ORGANIZATION_SUPPORTER_MENTION_URL],
          "url": `${ORGANIZATION_URL}/${language}/about`,
          "inLanguage": language === "en" ? "en" : language === "zh-hk" ? "zh-Hant" : "zh-Hans",
          "about": {
            "@type": "Organization",
            "name": ORGANIZATION_ENGLISH_NAME,
            "alternateName": ORGANIZATION_ALTERNATE_NAMES,
            "legalName": ORGANIZATION_LEGAL_NAME,
            "url": ORGANIZATION_URL,
            "description": meta.description,
            "foundingDate": ORGANIZATION_FOUNDING_DATE,
            "address": ORGANIZATION_ADDRESS,
            "email": ORGANIZATION_EMAIL,
            "contactPoint": ORGANIZATION_CONTACT_POINT,
            "sameAs": ORGANIZATION_SAME_AS,
            "member": [
              {
                "@type": "Person",
                "@id": `${ORGANIZATION_URL}/#leo-lai`,
                "name": "Lai King Man, Leo",
                "alternateName": "賴敬文",
                "jobTitle": "Founding Chairman",
                "image": `${ORGANIZATION_URL}${foundingChairman}`,
                "sameAs": [LEO_LINKEDIN_URL],
                "subjectOf": { "@type": "NewsArticle", "url": ORGANIZATION_MEDIA_MENTION_URL },
              },
              {
                "@type": "Person",
                "@id": `${ORGANIZATION_URL}/#chan-man-ching`,
                "name": "Chan Man Ching",
                "alternateName": "陳文清",
                "jobTitle": "Founding Secretary",
                "image": `${ORGANIZATION_URL}${foundingSecretary}`,
              },
            ],
            "areaServed": {
              "@type": "Place",
              "name": "Hong Kong"
            }
          }
        }}
      />
      <Navigation />
      <main>
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs items={[{ label: homeLabel, to: "/" }, { label: t("about.title") }]} />
          <h1 
            ref={titleAnim.elementRef}
            className={`text-4xl font-bold text-foreground mb-8 font-arial ${
              titleAnim.isVisible 
                ? 'animate-in slide-in-from-top-8 fade-in duration-300' 
                : ''
            }`}
          >
            {t("about.title")}
          </h1>
          <p className="mb-12 max-w-3xl text-lg leading-8 text-muted-foreground">
            {trust.definition}
          </p>
          <Card 
            ref={purposeAnim.elementRef}
            className={`mb-8 shadow-elegant overflow-hidden ${
              purposeAnim.isVisible 
                ? 'animate-in slide-in-from-left-8 fade-in duration-300' 
                : ''
            }`}
          >
            <div className="relative h-48 w-full overflow-hidden">
              <img src={purposeBg} alt="FOIHK Purpose - Family Office Institute Hong Kong" width="1200" height="400" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            </div>
            <CardHeader>
              <h2 className="text-2xl font-semibold leading-none font-arial">{t("about.purpose")}</h2>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p className="font-arial">{t("about.purposeText")}</p>
            </CardContent>
          </Card>

          <Card 
            ref={visionAnim.elementRef}
            className={`mb-8 shadow-elegant overflow-hidden ${
              visionAnim.isVisible 
                ? 'animate-in slide-in-from-right-8 fade-in duration-300' 
                : ''
            }`}
          >
            <div className="relative h-48 w-full overflow-hidden">
              <img src={visionBg} alt="FOIHK Vision - Family Office Institute Hong Kong" width="1200" height="400" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            </div>
            <CardHeader>
              <h2 className="text-2xl font-semibold leading-none font-arial">{t("about.vision")}</h2>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <ul className="space-y-2">
                <li className="font-arial">{t("about.visionText")}</li>
              </ul>
            </CardContent>
          </Card>

          <Card 
            ref={missionAnim.elementRef}
            className={`shadow-elegant overflow-hidden ${
              missionAnim.isVisible 
                ? 'animate-in zoom-in-95 fade-in duration-300' 
                : ''
            }`}
          >
            <div className="relative h-48 w-full overflow-hidden">
              <img src={missionBg} alt="FOIHK Mission - Family Office Institute Hong Kong" width="1200" height="400" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            </div>
            <CardHeader>
              <h2 className="text-2xl font-semibold leading-none font-arial">{t("about.mission")}</h2>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <ul className="list-disc pl-6 space-y-3">
                {t("about.missionText").split('•').filter(item => item.trim()).map((item, index) => (
                  <li key={index} className="font-arial">{item.trim()}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Leadership Team Section */}
      <section id="leadership" className="scroll-mt-24 bg-secondary/30 py-20">
        <div className="container mx-auto px-4">
          <div 
            ref={leadershipHeaderAnim.elementRef}
            className={`text-center mb-12 ${
              leadershipHeaderAnim.isVisible 
                ? 'animate-in slide-in-from-bottom-8 fade-in duration-300' 
                : ''
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-arial">
              {t("home.leadershipTitle")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-arial">
              {trust.leadershipIntro}
            </p>
          </div>
          
          {/* First Row - 2 members */}
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-8">
            <Card 
              ref={leadershipCard1Anim.elementRef}
              className={`border-border/50 shadow-elegant hover:shadow-glow transition-all duration-300 hover:-translate-y-1 ${
                leadershipCard1Anim.isVisible 
                  ? 'animate-in fade-in zoom-in-95 duration-300' 
                  : ''
              }`}
            >
              <CardContent className="pt-6 text-center">
                <div className="w-64 h-80 mx-auto mb-4 rounded-lg overflow-hidden">
                  <img src={foundingChairman} alt="Lai King Man, Leo" width="256" height="320" loading="lazy" decoding="async" className="w-full h-full object-cover object-top" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-1 font-arial">{t("home.chairmanName")}</h3>
                <p className="mt-1 text-sm font-medium text-foreground font-arial">{t("home.foundingChairman")}</p>
                <p className="mt-4 text-left text-sm leading-6 text-muted-foreground">{trust.chairmanBio}</p>
              </CardContent>
            </Card>

            <Card 
              ref={leadershipCard2Anim.elementRef}
              className={`border-border/50 shadow-elegant hover:shadow-glow transition-all duration-300 hover:-translate-y-1 ${
                leadershipCard2Anim.isVisible 
                  ? 'animate-in fade-in zoom-in-95 duration-300 delay-100' 
                  : ''
              }`}
            >
              <CardContent className="pt-6 text-center">
                <div className="w-64 h-80 mx-auto mb-4 rounded-lg overflow-hidden">
                  <img src={foundingSecretary} alt="Chan Man Ching" width="256" height="320" loading="lazy" decoding="async" className="w-full h-full object-cover object-top" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-1 font-arial">{t("home.secretaryName")}</h3>
                <p className="mt-1 text-sm font-medium text-foreground font-arial">{t("home.foundingSecretary")}</p>
                <p className="mt-4 text-left text-sm leading-6 text-muted-foreground">{trust.secretaryBio}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section hidden aria-hidden="true" id="verified-organization-details" className="border-y border-border py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="text-3xl font-bold text-foreground">{trust.detailsTitle}</h2>
          <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{trust.detailsIntro}</p>
          <dl className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            <div><dt className="text-sm font-medium text-muted-foreground">{trust.legalName}</dt><dd className="mt-1 font-semibold text-foreground">{ORGANIZATION_LEGAL_NAME}</dd></div>
            <div><dt className="text-sm font-medium text-muted-foreground">{trust.established}</dt><dd className="mt-1 font-semibold text-foreground"><time dateTime={ORGANIZATION_FOUNDING_DATE}>20 August 2025</time></dd></div>
            <div><dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Mail className="h-4 w-4" />{trust.email}</dt><dd className="mt-1"><a href={`mailto:${ORGANIZATION_EMAIL}`} className="font-semibold text-primary underline-offset-4 hover:underline">{ORGANIZATION_EMAIL}</a></dd></div>
            <div className="sm:col-span-2"><dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><MapPin className="h-4 w-4" />{trust.address}</dt><dd className="mt-1 font-semibold not-italic text-foreground"><address className="not-italic">{t("contact.addressText")}</address></dd></div>
            <div><dt className="text-sm font-medium text-muted-foreground">{trust.website}</dt><dd className="mt-1"><a href={`${ORGANIZATION_URL}/${language}`} className="font-semibold text-primary underline-offset-4 hover:underline">foihk.org</a></dd></div>
            <div><dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Linkedin className="h-4 w-4" />{trust.linkedin}</dt><dd className="mt-1"><a href={ORGANIZATION_LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline-offset-4 hover:underline">linkedin.com/company/family-office-institute-hong-kong</a></dd></div>
          </dl>
        </div>
      </section>

      <section hidden aria-hidden="true" id="authority-evidence" aria-labelledby="authority-evidence-title" className="border-b border-border bg-secondary/20 py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 id="authority-evidence-title" className="text-3xl font-bold text-foreground">{trust.evidenceTitle}</h2>
          <p className="mt-4 max-w-3xl leading-8 text-muted-foreground">{trust.evidenceIntro}</p>
          <div className="mt-9 grid gap-x-10 gap-y-8 lg:grid-cols-3">
            {trust.evidenceItems.map((item) => (
              <article key={item.title} data-authority-evidence className="border-t border-border pt-5">
                <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">{item.statement}</p>
                <a href={item.href} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-start gap-2 font-semibold text-primary underline-offset-4 hover:underline">
                  {item.linkLabel}<ExternalLink className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
          <aside data-client-proof-status className="mt-10 border-l-4 border-primary bg-background px-6 py-5">
            <h3 className="text-xl font-semibold text-foreground">{trust.clientDisclosureTitle}</h3>
            <p className="mt-3 leading-7 text-muted-foreground">{trust.clientDisclosureBody}</p>
          </aside>
        </div>
      </section>

      <section hidden aria-hidden="true" id="editorial-accountability" className="scroll-mt-24 py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="flex items-start gap-4">
            <ShieldCheck className="mt-1 h-7 w-7 shrink-0 text-primary" />
            <div>
              <h2 className="text-3xl font-bold text-foreground">{trust.accountabilityTitle}</h2>
              <p className="mt-4 leading-8 text-muted-foreground">{trust.accountabilityBody}</p>
            </div>
          </div>
        </div>
      </section>
      </main>

      <Footer />
    </div>;
};
export default About;
