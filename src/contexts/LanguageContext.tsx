import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export type Language = "en" | "zh-hk" | "zh-cn";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

const LANGUAGE_STORAGE_KEY = "foihk-language";

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getLangFromUrl = (): Language | null => {
    const pathParts = location.pathname.split("/");
    const firstPart = pathParts[1];
    if (firstPart === "en" || firstPart === "zh-hk" || firstPart === "zh-cn") {
      return firstPart as Language;
    }
    return null;
  };

  const urlLang = getLangFromUrl();

  const getInitialLang = (): Language => {
    if (urlLang) return urlLang;
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored === "en" || stored === "zh-hk" || stored === "zh-cn") return stored as Language;
    } catch {
      // Browser storage may be unavailable in privacy-restricted contexts.
    }
    return "en";
  };

  const [language, setLanguageState] = useState<Language>(getInitialLang);

  useEffect(() => {
    if (urlLang && urlLang !== language) {
      setLanguageState(urlLang);
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, urlLang);
      } catch {
        // Keep URL language active even when storage is unavailable.
      }
    }
  }, [urlLang, language]);

  const setLanguage = (lang: Language) => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Navigation remains functional without persistent browser storage.
    }
    
    const pathParts = location.pathname.split("/");
    if (pathParts[1] === "en" || pathParts[1] === "zh-hk" || pathParts[1] === "zh-cn") {
      pathParts[1] = lang;
      navigate(pathParts.join("/") + location.search + location.hash);
    } else {
      setLanguageState(lang);
    }
  };

  const t = (key: string): string => {
    const keys = key.split(".");
    let value: TranslationNode | undefined = translations[language];
    
    for (const k of keys) {
      value = value && typeof value === "object" ? value[k] : undefined;
    }
    
    return typeof value === "string" ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

type TranslationNode = string | { [key: string]: TranslationNode };

const translations: Record<Language, TranslationNode> = {
  en: {
    nav: {
      home: "Home",
      educationResearch: "Education & Research",
      newsEvents: "News & Events",
      philanthropy: "Philanthropy",
      about: "About Us",
      faq: "FAQ",
      contact: "Contact Us",
      admin: "Admin",
      viewAll: "View All Articles",
      viewAllNews: "View All News & Events",
      recentArticles: "Recent Articles",
      browseEducation: "Browse all education & research resources",
      browseNews: "Browse all news and upcoming events",
      browsePhilanthropy: "Browse all philanthropy initiatives and updates",
      viewAllPhilanthropy: "View All Philanthropy"
    },
    home: {
      heroTitle: "Family Office Institute Hong Kong",
      heroSubtitle: "FOIHK",
      heroDescription: "Family Office Institute Hong Kong (FOIHK) is a Hong Kong family office industry institution and professional community.",
      exploreResources: "Explore Resources",
      whatWeOffer: "What We Offer",
      whatWeOfferDesc: "Comprehensive resources and networking opportunities for family office professionals",
      educationTitle: "Education & Research",
      educationDesc: "Access expert articles, case studies, and educational programs",
      learnMore: "Explore Education & Research",
      newsTitle: "News & Events",
      newsDesc: "Stay updated with industry news and upcoming networking events",
      viewUpdates: "View Updates",
      communityTitle: "Community",
      communityDesc: "Connect with family office professionals across Hong Kong",
      leadershipTitle: "Leadership Team",
      leadershipDesc: "Meet the experts guiding Hong Kong's family office sector",
      foundingChairman: "Founding Chairman",
      foundingSecretary: "Founding Secretary General",
      chairmanName: "Lai King Man, Leo",
      secretaryName: "Chan Man Ching",
      directorEducation: "Director of Education",
      headResearch: "Head of Research",
      operationsDirector: "Operations Director",
      ctaTitle: "Ready to Get Involved?",
      ctaDesc: "Join our growing community of family office professionals",
      contactToday: "Contact Us Today"
    },
    about: {
      title: "About Us",
      purpose: "PURPOSE",
      purposeText: "Family Office Institute Hong Kong aims to provide professional training to individuals within the family office and related industries. Our goal is to enhance the expertise and capabilities of industry practitioners, thereby contributing to the overall development and advancement of the sector.",
      vision: "VISION",
      visionText: "Our vision is to foster continuous progress among professionals in the family office and associated fields, and to drive the sector towards higher standards of excellence. By doing so, we strive to elevate the global standing of the family office sector.",
      mission: "MISSION",
      missionText: "• Connecting Experts and Professionals: We aim to link international and local experts, scholars, and industry elites, creating a platform for cross-border exchanges. This will enable the sharing of diverse perspectives and best practices.\n• Knowledge Sharing Initiatives: Regularly organizing seminars, workshops, and lectures to facilitate in-depth sharing of professional knowledge. These events will cover a wide range of topics relevant to the family office sector, ensuring our members stay updated with the latest trends and developments.\n• Promoting Experience Exchange: Encouraging the mutual learning of cutting-edge practical experiences. By sharing real-world case studies and successful strategies, we aim to inject wisdom and vitality into the development of the industry.\n• Industry Standardization: Establishing norms for family office practitioners across multiple dimensions, including service processes, professional qualifications, and risk management. This will help maintain high standards of professionalism and integrity within the industry.\n• Enhancing Industry Credibility: Working towards improving the overall credibility and competitiveness of the family office sector. By setting and adhering to high standards, we aim to build trust among clients, partners, and the wider community.\n• Building Bridges and Collaboration: Actively establishing communication channels and fostering collaboration among family office practitioners, financial institutions, legal experts, accountants, and other relevant stakeholders. This will create a more cohesive and collaborative industry ecosystem.\n• Mutual Assistance and Research: Establishing an industry mutual assistance mechanism, enabling joint research on key issues and collaborative efforts to address common challenges faced by the industry.\n• Professional Development: Assisting industry professionals in comprehensively enhancing their professional and comprehensive capabilities, equipping them with the skills and knowledge needed to navigate complex market environments and contribute to the development of the industry and the region."
    },
    philanthropy: {
      title: "Philanthropy",
      subtitle: "Making a Lasting Impact Through Strategic Giving",
      description: "At the Family Office Institute Hong Kong, we believe that wealth carries with it a profound responsibility to contribute positively to society. Our Philanthropy division is dedicated to guiding family offices in developing meaningful charitable strategies that create lasting social impact.",
      ourMission: "Our Philanthropic Mission",
      missionText: "We empower family offices to integrate philanthropy into their core values and operations. Through strategic guidance, educational programs, and collaborative initiatives, we help families transform their charitable vision into effective, measurable action that benefits communities across Hong Kong and beyond.",
      whatWeDo: "What We Do",
      advisoryTitle: "Philanthropic Advisory",
      advisoryDesc: "Expert guidance on structuring charitable foundations, developing giving strategies, and measuring social impact.",
      educationTitle: "Philanthropy Education",
      educationDesc: "Workshops, seminars, and resources on effective giving, impact investing, and social entrepreneurship.",
      networkTitle: "Philanthropy Network",
      networkDesc: "Connect with like-minded families, foundations, and non-profit organizations to amplify collective impact.",
      initiativeTitle: "Community Initiatives",
      initiativeDesc: "Direct involvement in community projects addressing education, healthcare, environmental sustainability, and social welfare.",
      approachTitle: "Our Approach",
      approachText: "We take a holistic approach to philanthropy, recognizing that meaningful charitable work requires more than financial contributions. It demands strategic planning, deep understanding of social issues, and long-term commitment. Our team works closely with each family office to identify causes aligned with their values, develop sustainable giving strategies, and measure the real-world impact of their contributions.",
      getInvolved: "Get Involved",
      getInvolvedText: "Whether you are establishing a new charitable foundation or seeking to enhance your existing philanthropic efforts, FOIHK provides the expertise, network, and resources to maximize your social impact.",
      contactCta: "Contact us to learn more about our philanthropy programs",
      articlesTitle: "Philanthropy Articles & Updates",
      articlesDesc: "Explore our latest philanthropic initiatives, impact stories, and community programs"
    },
    contact: {
      title: "Contact Us",
      getInTouch: "Get in Touch",
      getInTouchDesc: "We'd love to hear from you. Send us a message and we'll respond as soon as possible.",
      name: "Name",
      namePlaceholder: "Your name",
      email: "Email",
      emailPlaceholder: "your@email.com",
      subject: "Subject",
      subjectPlaceholder: "What is this about?",
      message: "Message",
      messagePlaceholder: "Your message",
      sendMessage: "Send Message",
      contactInfo: "Contact Information",
      address: "Address",
      addressText: "32/F, The Center, 99 Queen's Road Central, Central, Hong Kong",
      officeHours: "Office Hours",
      mondayFriday: "Monday - Friday",
      saturdaySunday: "Saturday - Sunday",
      closed: "Closed"
    },
    articles: {
      educationTitle: "Education & Research",
      educationDesc: "Expert insights and educational resources for family office professionals",
      newsTitle: "News & Events",
      newsDesc: "Latest news, updates, and upcoming events",
      philanthropyTitle: "Philanthropy",
      philanthropyDesc: "Philanthropic initiatives, impact stories, and community programs",
      educationPageDesc: "Browse FOIHK education and research resources covering family office strategy, policy updates, training, and industry insights for Hong Kong professionals.",
      philanthropyPageDesc: "Browse FOIHK philanthropy stories, charitable initiatives, impact events, and community projects shaping social responsibility for family offices in Hong Kong.",
      newsPageDesc: "Browse FOIHK news and events for the latest family office updates, partner forums, industry conferences, and networking activities in Hong Kong and beyond.",
      loading: "Loading articles...",
      noArticles: "No published articles available yet. Check back soon!",
      invalidCategory: "Invalid category",
      searchPlaceholder: "Search articles...",
      noMatch: "No articles match your search",
      backToList: "Back to List",
      readMore: "Read More"
    },
    notFound: {
      title: "404 Page Not Found",
      description: "The page you requested is unavailable on the FOIHK website. Continue to FOIHK education, research, philanthropy, media coverage, and family office resources.",
      heading: "Page Not Found",
      message: "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.",
      returnHome: "Return Home",
      browseResources: "Browse Resources"
    },
    press: {
      title: "Media Coverage",
      description: "Browse FOIHK media coverage, official introduction posts, and event updates shared through interviews, LinkedIn, and WeChat.",
      introTitle: "FOIHK Media Coverage",
      introText: "This page curates media coverage, official introduction posts, and event updates related to Family Office Institute Hong Kong across interviews, LinkedIn, and WeChat channels.",
      metaDescription: "Explore FOIHK media coverage, official LinkedIn posts, and WeChat articles covering institutional introductions, events, cultural exchange, and family office insights.",
      sourceLabel: "Source",
      dateLabel: "Date",
      readMore: "Read Original Article",
      items: {
        edigest: {
          title: "Cover Story: Art, Family Office, Art Investment (March Art Month)",
          description: "An exclusive interview with FOIHK Founding Chairman Leo Lai and Board Member Andy Yeung, discussing the defensive attributes and legacy value of art in family office asset allocation, uncovering the 'aesthetics of investment' behind billions in assets."
        },
        linkedinIntro: {
          title: "FOIHK in Hong Kong SAR ; Family Office Institute Hong Kong (FOIHK)",
          description: "Official LinkedIn introduction post presenting Family Office Institute Hong Kong (FOIHK) and its positioning in Hong Kong SAR."
        },
        taichi: {
          title: "FOIHK: World Record Largest Cross-Continental Tai Chi Gathering Co-hosted with Lions Clubs International",
          description: "LinkedIn activity post highlighting FOIHK's participation in the world record largest cross-continental Tai Chi gathering co-hosted with Lions Clubs International."
        },
        wechat: {
          title: "FOIHK Tai Chi World Record Coverage on WeChat",
          description: "WeChat article covering FOIHK's world record cross-continental Tai Chi gathering activities and related cultural exchange highlights."
        }
      }
    },
    footer: {
      copyright: "© 2025 Family Office Institute Hong Kong. All rights reserved."
    }
  },
  "zh-hk": {
    nav: {
      home: "首頁",
      educationResearch: "教育與研究",
      newsEvents: "新聞與活動",
      philanthropy: "慈善事業",
      about: "關於我們",
      faq: "常見問題",
      contact: "聯絡我們",
      admin: "管理",
      viewAll: "查看所有文章",
      viewAllNews: "查看所有新聞與活動",
      recentArticles: "最新文章",
      browseEducation: "瀏覽所有教育與研究資源",
      browseNews: "瀏覽所有新聞和即將舉行的活動",
      browsePhilanthropy: "瀏覽所有慈善計劃和最新動態",
      viewAllPhilanthropy: "查看所有慈善文章"
    },
    home: {
      heroTitle: "香港家族辦公室學會",
      heroSubtitle: "FOIHK",
      heroDescription: "香港家族辦公室學會（FOIHK）是立足香港的家族辦公室行業機構與專業社群。",
      exploreResources: "探索資源",
      whatWeOffer: "我們提供什麼",
      whatWeOfferDesc: "為家族辦公室專業人士提供全面的資源和交流機會",
      educationTitle: "教育與研究",
      educationDesc: "獲取專家文章、案例研究和教育課程",
      learnMore: "探索教育與研究",
      newsTitle: "新聞與活動",
      newsDesc: "獲取行業新聞和即將舉行的交流活動",
      viewUpdates: "查看更新",
      communityTitle: "社區",
      communityDesc: "與香港各地的家族辦公室專業人士建立聯繫",
      leadershipTitle: "領導團隊",
      leadershipDesc: "認識引領香港家族辦公室行業的專家",
      foundingChairman: "創會主席",
      foundingSecretary: "創會祕書長",
      chairmanName: "賴敬文",
      secretaryName: "陳文清",
      directorEducation: "教育總監",
      headResearch: "研究主管",
      operationsDirector: "營運總監",
      ctaTitle: "準備好參與了嗎？",
      ctaDesc: "加入我們不斷成長的家族辦公室專業人士社群",
      contactToday: "立即聯絡我們"
    },
    about: {
      title: "關於我們",
      purpose: "宗旨",
      purposeText: "香港家族辦公室學會（Family Office Institute Hong Kong）旨在為家族辦公室及相關行業從業者提供專業培訓，提升行業人士的專業知識與能力，進而推動整個行業的整體發展與進步。",
      vision: "願景",
      visionText: "我們致力於促進家族辦公室及相關領域專業人士的持續成長，推動行業向更高卓越標準邁進，力求提升家族辦公室行業的全球地位。",
      mission: "使命",
      missionText: "• 連接專家與各界專業人士：搭建國際與本地專家、學者及行業精英的溝通橋梁，打造交流平台，促進多元觀點與最佳實踐的分享。\n• 開展知識共享項目：定期組織研討會、工作坊及講座，深度分享專業知識。活動內容覆蓋與家族辦公室行業相關領域，確保會員及時掌握行業最新趨勢與動態。\n• 推動經驗交流：鼓勵前沿實踐經驗的互相學習，通過分享真實案例與成功策略，為行業發展注入智慧與活力。\n• 促進行業標準化：從服務流程、專業資質、風險管理等多維度，為家族辦公室從業者建立行業規範，維護行業內高水平的專業素養與職業誠信。\n• 提升行業公信力：致力於提高家族辦公室行業的整體公信力與競爭力，通過制定並遵循高標準，在客戶、合作夥伴及更廣泛社群中建立信任。\n• 搭建合作橋梁：積極構建溝通渠道，促進家族辦公室從業者、金融機構、法律專家、會計師及其他相關利益方的合作，打造更具凝聚力的行業協作生態。\n• 助力互助與研究：建立行業互助機制，針對行業關鍵問題開展聯合研究，共同應對行業面臨的共性挑戰。\n• 支持專業發展：協助行業專業人士全面提升專業能力與綜合素養，使其具備應對複雜市場環境的技能與知識，為行業及區域發展貢獻力量。"
    },
    philanthropy: {
      title: "慈善事業",
      subtitle: "通過策略性捐贈創造持久影響力",
      description: "香港家族辦公室學會深信，財富伴隨著回饋社會的深遠責任。我們的慈善事業部門致力於引導家族辦公室制定有意義的慈善策略，創造持久的社會影響。",
      ourMission: "我們的慈善使命",
      missionText: "我們協助家族辦公室將慈善融入其核心價值與運營中。通過策略指導、教育項目和協作計劃，我們幫助家族將其慈善願景轉化為有效、可衡量的行動，惠及香港及更廣泛地區的社區。",
      whatWeDo: "我們的服務",
      advisoryTitle: "慈善諮詢",
      advisoryDesc: "為設立慈善基金會、制定捐贈策略及衡量社會影響力提供專業指導。",
      educationTitle: "慈善教育",
      educationDesc: "舉辦工作坊、研討會及提供有關有效捐贈、影響力投資和社會創業的資源。",
      networkTitle: "慈善網絡",
      networkDesc: "連結志同道合的家族、基金會和非牟利組織，擴大集體影響力。",
      initiativeTitle: "社區計劃",
      initiativeDesc: "直接參與教育、醫療、環境可持續發展和社會福利等社區項目。",
      approachTitle: "我們的方式",
      approachText: "我們採取全面的慈善方式，明白有意義的慈善工作不僅需要資金支持，更需要策略規劃、對社會問題的深入理解以及長期承諾。我們的團隊與每個家族辦公室緊密合作，識別與其價值觀相符的公益領域，制定可持續的捐贈策略，並衡量其實際貢獻所帶來的影響。",
      getInvolved: "參與其中",
      getInvolvedText: "無論您正在設立新的慈善基金會，還是希望提升現有慈善工作的成效，FOIHK 都能提供專業知識、人脈網絡和資源，助您最大化社會影響力。",
      contactCta: "聯絡我們了解更多慈善計劃",
      articlesTitle: "慈善文章與最新動態",
      articlesDesc: "探索我們最新的慈善計劃、影響故事和社區項目"
    },
    contact: {
      title: "聯絡我們",
      getInTouch: "保持聯繫",
      getInTouchDesc: "我們很樂意聽取您的意見。請向我們發送訊息，我們將盡快回覆。",
      name: "姓名",
      namePlaceholder: "您的姓名",
      email: "電子郵件",
      emailPlaceholder: "your@email.com",
      subject: "主旨",
      subjectPlaceholder: "這是關於什麼的？",
      message: "訊息",
      messagePlaceholder: "您的訊息",
      sendMessage: "發送訊息",
      contactInfo: "聯絡資訊",
      address: "地址",
      addressText: "香港中環皇后大道中99號中環中心32樓",
      officeHours: "辦公時間",
      mondayFriday: "星期一至五",
      saturdaySunday: "星期六至日",
      closed: "休息"
    },
    articles: {
      educationTitle: "教育與研究",
      educationDesc: "為家族辦公室專業人士提供專家見解和教育資源",
      newsTitle: "新聞與活動",
      newsDesc: "最新新聞、更新和即將舉行的活動",
      philanthropyTitle: "慈善事業",
      philanthropyDesc: "慈善計劃、影響故事和社區項目",
      educationPageDesc: "瀏覽 FOIHK 的教育和研究資源，涵蓋家族辦公室策略、政策更新、專業培訓及香港專業人士的行業見解。",
      philanthropyPageDesc: "瀏覽 FOIHK 的慈善故事、慈善倡議、影響力活動及社區項目，了解香港家族辦公室如何塑造社會責任。",
      newsPageDesc: "瀏覽 FOIHK 的新聞與活動，獲取最新的家族辦公室動態、合作夥伴論壇、行業會議以及在香港及其他地區的交流活動。",
      loading: "載入文章中...",
      noArticles: "目前沒有已發布的文章。請稍後再查看！",
      invalidCategory: "無效的類別",
      searchPlaceholder: "搜尋文章...",
      noMatch: "沒有符合搜尋條件的文章",
      backToList: "返回列表",
      readMore: "閱讀更多"
    },
    notFound: {
      title: "404 找不到頁面",
      description: "您請求的頁面在 FOIHK 網站上無法使用。請繼續瀏覽 FOIHK 的教育、研究、慈善、媒體報導及家族辦公室資源。",
      heading: "找不到頁面",
      message: "您正在尋找的頁面可能已被移除、名稱已更改或暫時無法使用。",
      returnHome: "返回首頁",
      browseResources: "瀏覽資源"
    },
    press: {
      title: "媒體報導",
      description: "香港家族辦公室學會專家接受媒體專訪，並透過 LinkedIn 及微信公眾號分享官方介紹、活動紀錄與家族辦公室相關觀點。",
      introTitle: "香港家族辦公室學會 媒體報導",
      introText: "本頁集中整理香港家族辦公室學會相關媒體報導、官方介紹與活動貼文，展示學會在家族辦公室資產管理、文化交流、公益活動與業界分享上的公開內容。",
      metaDescription: "瀏覽香港家族辦公室學會媒體報導、LinkedIn 官方貼文及微信文章，了解 FOIHK 的官方介紹、活動紀錄與專業觀點。",
      sourceLabel: "來源",
      dateLabel: "日期",
      readMore: "查看原文",
      items: {
        edigest: {
          title: "封面故事：藝術、家族辦公室、投資藝術品（3月藝術月）",
          description: "專訪香港家族辦公室學會創會主席賴敬文（Leo）及理事楊世衡（Andy），探討藝術品在家族辦公室資產配置中的防禦屬性與傳承價值，揭開千億資產背後的「美學投資學」。"
        },
        linkedinIntro: {
          title: "FOIHK 官方介紹：香港家族辦公室學會",
          description: "LinkedIn 官方介紹貼文，展示香港家族辦公室學會 (FOIHK) 在香港特別行政區的定位與願景。"
        },
        taichi: {
          title: "FOIHK：與國際獅子會合辦最大規模跨洲太極聚會，創下世界紀錄",
          description: "LinkedIn 活動貼文，記錄 FOIHK 參與並與國際獅子會合辦的最大規模跨洲太極聚會，成功創下世界紀錄。"
        },
        wechat: {
          title: "FOIHK 太極世界紀錄微信報導",
          description: "微信公眾號文章，報導 FOIHK 創下跨洲太極聚會世界紀錄的活動及相關文化交流亮點。"
        }
      }
    },
    footer: {
      copyright: "© 2025 香港家族辦公室學會。保留所有權利。"
    }
  },
  "zh-cn": {
    nav: {
      home: "首页",
      educationResearch: "教育与研究",
      newsEvents: "新闻与活动",
      philanthropy: "慈善事业",
      about: "关于我们",
      faq: "常见问题",
      contact: "联系我们",
      admin: "管理",
      viewAll: "查看所有文章",
      viewAllNews: "查看所有新闻与活动",
      recentArticles: "最新文章",
      browseEducation: "浏览所有教育与研究资源",
      browseNews: "浏览所有新闻和即将举行的活动",
      browsePhilanthropy: "浏览所有慈善计划和最新动态",
      viewAllPhilanthropy: "查看所有慈善文章"
    },
    home: {
      heroTitle: "香港家族办公室学会",
      heroSubtitle: "FOIHK",
      heroDescription: "香港家族办公室学会（FOIHK）是立足香港的家族办公室行业机构与专业社群。",
      exploreResources: "探索资源",
      whatWeOffer: "我们提供什么",
      whatWeOfferDesc: "为家族办公室专业人士提供全面的资源和交流机会",
      educationTitle: "教育与研究",
      educationDesc: "获取专家文章、案例研究和教育课程",
      learnMore: "探索教育与研究",
      newsTitle: "新闻与活动",
      newsDesc: "获取行业新闻和即将举行的交流活动",
      viewUpdates: "查看更新",
      communityTitle: "社区",
      communityDesc: "与香港各地的家族办公室专业人士建立联系",
      leadershipTitle: "领导团队",
      leadershipDesc: "认识引领香港家族办公室行业的专家",
      foundingChairman: "创会主席",
      foundingSecretary: "创会秘书长",
      chairmanName: "赖敬文",
      secretaryName: "陈文清",
      directorEducation: "教育总监",
      headResearch: "研究主管",
      operationsDirector: "运营总监",
      ctaTitle: "准备好参与了吗？",
      ctaDesc: "加入我们不断成长的家族办公室专业人士社群",
      contactToday: "立即联系我们"
    },
    about: {
      title: "关于我们",
      purpose: "宗旨",
      purposeText: "香港家族办公室学会（Family Office Institute Hong Kong）旨在为家族办公室及相关行业从业者提供专业培训，提升行业人士的专业知识与能力，进而推动整个行业的整体发展与进步。",
      vision: "愿景",
      visionText: "我们致力于促进家族办公室及相关领域专业人士的持续成长，推动行业向更高卓越标准迈进，力求提升家族办公室行业的全球地位。",
      mission: "使命",
      missionText: "• 连接专家与各界专业人士：搭建国际与本地专家、学者及行业精英的沟通桥梁，打造交流平台，促进多元观点与最佳实践的分享。\n• 开展知识共享项目：定期组织研讨会、工作坊及讲座，深度分享专业知识。活动内容覆盖与家族办公室行业相关领域，确保会员及时掌握行业最新趋势与动态。\n• 推动经验交流：鼓励前沿实践经验的互相学习，通过分享真实案例与成功策略，为行业发展注入智慧与活力。\n• 促进行业标准化：从服务流程、专业资质、风险管理等多维度，为家族办公室从业者建立行业规范，维护行业内高水平的专业素养与职业诚信。\n• 提升行业公信力：致力于提高家族办公室行业的整体公信力与竞争力，通过制定并遵循高标准，在客户、合作伙伴及更广泛社群中建立信任。\n• 搭建合作桥梁：积极构建沟通渠道，促进家族办公室从业者、金融机构、法律专家、会计师及其他相关利益方的合作，打造更具凝聚力的行业协作生态。\n• 助力互助与研究：建立行业互助机制，针对行业关键问题开展联合研究，共同应对行业面临的共性挑战。\n• 支持专业发展：协助行业专业人士全面提升专业能力与综合素养，使其具备应对复杂市场环境的技能与知识，为行业及区域发展贡献力量。"
    },
    philanthropy: {
      title: "慈善事业",
      subtitle: "通过策略性捐赠创造持久影响力",
      description: "香港家族办公室学会深信，财富伴随着回馈社会的深远责任。我们的慈善事业部门致力于引导家族办公室制定有意义的慈善策略，创造持久的社会影响。",
      ourMission: "我们的慈善使命",
      missionText: "我们协助家族办公室将慈善融入其核心价值与运营中。通过策略指导、教育项目和协作计划，我们帮助家族将其慈善愿景转化为有效、可衡量的行动，惠及香港及更广泛地区的社区。",
      whatWeDo: "我们的服务",
      advisoryTitle: "慈善咨询",
      advisoryDesc: "为设立慈善基金会、制定捐赠策略及衡量社会影响力提供专业指导。",
      educationTitle: "慈善教育",
      educationDesc: "举办工作坊、研讨会及提供有关有效捐赠、影响力投资和社会创业的资源。",
      networkTitle: "慈善网络",
      networkDesc: "连结志同道合的家族、基金会和非营利组织，扩大集体影响力。",
      initiativeTitle: "社区计划",
      initiativeDesc: "直接参与教育、医疗、环境可持续发展和社会福利等社区项目。",
      approachTitle: "我们的方式",
      approachText: "我们采取全面的慈善方式，明白有意义的慈善工作不仅需要资金支持，更需要策略规划、对社会问题的深入理解以及长期承诺。我们的团队与每个家族办公室紧密合作，识别与其价值观相符的公益领域，制定可持续的捐赠策略，并衡量其实际贡献所带来的影响。",
      getInvolved: "参与其中",
      getInvolvedText: "无论您正在设立新的慈善基金会，还是希望提升现有慈善工作的成效，FOIHK 都能提供专业知识、人脉网络和资源，助您最大化社会影响力。",
      contactCta: "联系我们了解更多慈善计划",
      articlesTitle: "慈善文章与最新动态",
      articlesDesc: "探索我们最新的慈善计划、影响故事和社区项目"
    },
    contact: {
      title: "联系我们",
      getInTouch: "保持联系",
      getInTouchDesc: "我们很乐意听取您的意见。请向我们发送消息，我们将尽快回复。",
      name: "姓名",
      namePlaceholder: "您的姓名",
      email: "电子邮件",
      emailPlaceholder: "your@email.com",
      subject: "主旨",
      subjectPlaceholder: "这是关于什么的？",
      message: "消息",
      messagePlaceholder: "您的消息",
      sendMessage: "发送消息",
      contactInfo: "联系信息",
      address: "地址",
      addressText: "香港中环皇后大道中99号中环中心32楼",
      officeHours: "办公时间",
      mondayFriday: "星期一至五",
      saturdaySunday: "星期六至日",
      closed: "休息"
    },
    articles: {
      educationTitle: "教育与研究",
      educationDesc: "为家族办公室专业人士提供专家见解和教育资源",
      newsTitle: "新闻与活动",
      newsDesc: "最新新闻、更新和即将举行的活动",
      philanthropyTitle: "慈善事业",
      philanthropyDesc: "慈善计划、影响故事和社区项目",
      educationPageDesc: "浏览 FOIHK 的教育和研究资源，涵盖家族办公室策略、政策更新、专业培训及香港专业人士的行业见解。",
      philanthropyPageDesc: "浏览 FOIHK 的慈善故事、慈善倡议、影响力活动及社区项目，了解香港家族办公室如何塑造社会责任。",
      newsPageDesc: "浏览 FOIHK 的新闻与活动，获取最新的家族办公室动态、合作伙伴论坛、行业会议以及在香港及其他地区的交流活动。",
      loading: "加载文章中...",
      noArticles: "目前没有已发布的文章。请稍后再查看！",
      invalidCategory: "无效的类别",
      searchPlaceholder: "搜索文章...",
      noMatch: "没有符合搜索条件的文章",
      backToList: "返回列表",
      readMore: "阅读更多"
    },
    notFound: {
      title: "404 找不到页面",
      description: "您请求的页面在 FOIHK 网站上无法使用。请继续浏览 FOIHK 的教育、研究、慈善、媒体报道及家族办公室资源。",
      heading: "找不到页面",
      message: "您正在寻找的页面可能已被移除、名称已更改或暂时无法使用。",
      returnHome: "返回首页",
      browseResources: "浏览资源"
    },
    press: {
      title: "媒体报道",
      description: "香港家族办公室学会专家接受媒体专访，并通过 LinkedIn 及微信公众号分享官方介绍、活动记录与家族办公室相关观点。",
      introTitle: "香港家族办公室学会 媒体报道",
      introText: "本页集中整理香港家族办公室学会相关媒体报道、官方介绍与活动贴文，展示学会在家族办公室资产管理、文化交流、公益活动与业界分享上的公开内容。",
      metaDescription: "浏览香港家族办公室学会媒体报道、LinkedIn 官方贴文及微信文章，了解 FOIHK 的官方介绍、活动记录与专业观点。",
      sourceLabel: "来源",
      dateLabel: "日期",
      readMore: "查看原文",
      items: {
        edigest: {
          title: "封面故事：艺术、家族办公室、投资艺术品（3月艺术月）",
          description: "专访香港家族办公室学会创会主席赖敬文（Leo）及理事杨世衡（Andy），探讨艺术品在家族办公室资产配置中的防御属性与传承价值，揭开千亿资产背后的“美学投资学”。"
        },
        linkedinIntro: {
          title: "FOIHK 官方介绍：香港家族办公室学会",
          description: "LinkedIn 官方介绍贴文，展示香港家族办公室学会 (FOIHK) 在香港特别行政区的定位与愿景。"
        },
        taichi: {
          title: "FOIHK：与国际狮子会合办最大规模跨洲太极聚会，创下世界纪录",
          description: "LinkedIn 活动贴文，记录 FOIHK 参与并与国际狮子会合办的最大规模跨洲太极聚会，成功创下世界纪录。"
        },
        wechat: {
          title: "FOIHK 太极世界纪录微信报道",
          description: "微信公众号文章，报道 FOIHK 创下跨洲太极聚会世界纪录的活动及相关文化交流亮点。"
        }
      }
    },
    footer: {
      copyright: "© 2025 香港家族办公室学会。保留所有权利。"
    }
  }
};
