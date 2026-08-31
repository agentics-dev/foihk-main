export const ORGANIZATION_ENGLISH_NAME = "Family Office Institute Hong Kong";
export const ORGANIZATION_LEGAL_NAME = "Family Office Institute Hong Kong Limited";
export const ORGANIZATION_TRADITIONAL_CHINESE_NAME = "香港家族辦公室學會";
export const ORGANIZATION_SHORT_NAME = "FOIHK";
export const ORGANIZATION_ALTERNATE_NAMES = [
  ORGANIZATION_SHORT_NAME,
  ORGANIZATION_TRADITIONAL_CHINESE_NAME,
];
export const ORGANIZATION_URL = "https://www.foihk.org";
export const ORGANIZATION_LOGO = `${ORGANIZATION_URL}/favicon.png`;
export const ORGANIZATION_FOUNDING_DATE = "2025-08-20";
export const ORGANIZATION_BUSINESS_REGISTRATION_NUMBER = "78655051";
export const SITE_CONTENT_REVIEWED_DATE = "2026-08-03";
export const ORGANIZATION_EMAIL = "info@foihk.org";
export const ORGANIZATION_LINKEDIN_URL = "https://www.linkedin.com/company/family-office-institute-hong-kong/";
const configuredWikidataEntityId = String(import.meta.env.VITE_WIKIDATA_ENTITY_ID || "").trim();
export const ORGANIZATION_WIKIDATA_ENTITY_ID = /^Q[1-9]\d*$/.test(configuredWikidataEntityId)
  ? configuredWikidataEntityId
  : null;
export const ORGANIZATION_WIKIDATA_URL = ORGANIZATION_WIKIDATA_ENTITY_ID
  ? `https://www.wikidata.org/wiki/${ORGANIZATION_WIKIDATA_ENTITY_ID}`
  : null;
export const ORGANIZATION_WIKIDATA_SEARCH_URL = "https://www.wikidata.org/w/index.php?search=Family%20Office%20Institute%20Hong%20Kong&title=Special%3ASearch&ns0=1";
export const ORGANIZATION_SAME_AS = [
  ORGANIZATION_LINKEDIN_URL,
  ...(ORGANIZATION_WIKIDATA_URL ? [ORGANIZATION_WIKIDATA_URL] : []),
];
export const ORGANIZATION_REGISTRY_URL = "https://www.cr.gov.hk/docs/wrpt/wk_new%26changednamecoys_20250818.pdf";
export const ORGANIZATION_MEDIA_MENTION_URL = "https://www.edigest.hk/%E6%8A%95%E8%B3%87/%E5%B0%81%E9%9D%A2%E6%95%85%E4%BA%8B-%E8%97%9D%E8%A1%93-%E5%AE%B6%E6%97%8F%E8%BE%A6%E5%85%AC%E5%AE%A4-%E6%8A%95%E8%B3%87%E8%97%9D%E8%A1%93%E5%93%81-3%E6%9C%88%E8%97%9D%E8%A1%93%E6%9C%88-1997853/";
export const ORGANIZATION_SUPPORTER_MENTION_URL = "https://www.hkco.org/uploads/docs/6a408ec2095b91.pdf";

export const ORGANIZATION_ADDRESS = {
  "@type": "PostalAddress",
  "streetAddress": "32/F, The Center, 99 Queen's Road Central",
  "addressLocality": "Central",
  "addressRegion": "Hong Kong",
  "addressCountry": "HK",
} as const;

export const ORGANIZATION_CONTACT_POINT = {
  "@type": "ContactPoint",
  "email": ORGANIZATION_EMAIL,
  "contactType": "General Inquiry",
  "url": `${ORGANIZATION_URL}/en/contact`,
  "availableLanguage": ["en", "zh-Hant", "zh-Hans"],
} as const;

export const ORGANIZATION_NAP = {
  englishName: ORGANIZATION_ENGLISH_NAME,
  traditionalChineseName: ORGANIZATION_TRADITIONAL_CHINESE_NAME,
  address: ORGANIZATION_ADDRESS,
  contactPoint: ORGANIZATION_CONTACT_POINT,
} as const;
