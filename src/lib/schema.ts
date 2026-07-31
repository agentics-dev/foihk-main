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

export const ORGANIZATION_ADDRESS = {
  "@type": "PostalAddress",
  "streetAddress": "32/F, The Center, 99 Queen's Road Central",
  "addressLocality": "Central",
  "addressRegion": "Hong Kong",
  "addressCountry": "HK",
} as const;

export const ORGANIZATION_CONTACT_POINT = {
  "@type": "ContactPoint",
  "email": "info@foihk.org",
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
