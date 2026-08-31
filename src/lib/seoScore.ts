/** Pure, per-language SEO health score for the article editor. */

export interface SeoScoreInput {
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
  faqCount: number;
  authorName: string;
  authorTitle: string;
  allImagesHaveAlt: boolean;
  h1Texts: string[];
  internalLinkCount: number;
}

export interface SeoScoreItem {
  key: string;
  label: string;
  points: number;
  max: number;
  passed: boolean;
  suggestion: string;
}

export interface SeoScoreResult {
  score: number;
  items: SeoScoreItem[];
}

const includesKeyword = (text: string, keywords: string[]) => {
  const haystack = text.toLocaleLowerCase();
  return keywords.some((keyword) => {
    const needle = keyword.trim().toLocaleLowerCase();
    return needle !== "" && haystack.includes(needle);
  });
};

export const computeSeoScore = (input: SeoScoreInput): SeoScoreResult => {
  const items: SeoScoreItem[] = [
    {
      key: "seoTitle",
      label: "SEO title",
      max: 15,
      points: 0,
      passed: false,
      suggestion: "Fill in the SEO title, keep it within 60 characters, and include at least one keyword.",
    },
    {
      key: "metaDescription",
      label: "Meta description",
      max: 15,
      points: 0,
      passed: false,
      suggestion: "Write a meta description between 50 and 160 characters.",
    },
    {
      key: "keywords",
      label: "Keywords",
      max: 10,
      points: 0,
      passed: false,
      suggestion: "Add 3-6 keywords.",
    },
    {
      key: "faq",
      label: "FAQ",
      max: 15,
      points: 0,
      passed: false,
      suggestion: "Add at least 3 enabled FAQ pairs translated for this language.",
    },
    {
      key: "author",
      label: "Author information",
      max: 10,
      points: 0,
      passed: false,
      suggestion: "Fill in both the author name and job title.",
    },
    {
      key: "imageAlt",
      label: "Image alt text",
      max: 10,
      points: 0,
      passed: false,
      suggestion: "Every image should have alt text for this language.",
    },
    {
      key: "h1",
      label: "H1 keyword",
      max: 15,
      points: 0,
      passed: false,
      suggestion: "Keep the article title as the only H1, include the first keyword in it, and remove H1 tags from the body.",
    },
    {
      key: "internalLinks",
      label: "Internal links",
      max: 10,
      points: 0,
      passed: false,
      suggestion: "Add at least 3 internal links in the content.",
    },
  ];

  const pass = (key: string, condition: boolean) => {
    if (!condition) return;
    const item = items.find((candidate) => candidate.key === key);
    if (!item) return;
    item.passed = true;
    item.points = item.max;
  };

  const title = input.seoTitle.trim();
  pass("seoTitle", title.length > 0 && title.length <= 60 && includesKeyword(title, input.keywords));
  const descriptionLength = input.metaDescription.trim().length;
  pass("metaDescription", descriptionLength >= 50 && descriptionLength <= 160);
  pass("keywords", input.keywords.length >= 3 && input.keywords.length <= 6);
  pass("faq", input.faqCount >= 3);
  pass("author", input.authorName.trim() !== "" && input.authorTitle.trim() !== "");
  pass("imageAlt", input.allImagesHaveAlt);

  const firstKeyword = input.keywords[0]?.trim() || "";
  pass("h1", input.h1Texts.length === 1 && firstKeyword !== "" && includesKeyword(input.h1Texts[0], [firstKeyword]));
  pass("internalLinks", input.internalLinkCount >= 3);

  return { score: items.reduce((total, item) => total + item.points, 0), items };
};
