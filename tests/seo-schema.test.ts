import assert from "node:assert/strict";
import test from "node:test";

import { computeSeoScore } from "../src/lib/seoScore.ts";
import {
  buildEventSchema,
  buildFaqPageSchema,
  formatEventDateTime,
  getLocalizedSchemaValue,
} from "../src/lib/schemaBuilders.ts";

test("localized Schema fields use only the selected language and never fall back", () => {
  const article = {
    title: "English title",
    title_zhtw: "繁體標題",
    title_zhcn: "",
  };

  assert.equal(getLocalizedSchemaValue(article, "title", "en"), "English title");
  assert.equal(getLocalizedSchemaValue(article, "title", "zh-hk"), "繁體標題");
  assert.equal(getLocalizedSchemaValue(article, "title", "zh-cn"), "");
});

test("SEO health score reaches 100 only when every rule passes", () => {
  const result = computeSeoScore({
    seoTitle: "Hong Kong family office tax guide",
    metaDescription: "A practical Hong Kong family office tax guide covering structures, reporting duties, governance, and planning considerations.",
    keywords: ["family office", "Hong Kong", "tax"],
    faqCount: 3,
    authorName: "Jane Chan",
    authorTitle: "Tax Partner",
    allImagesHaveAlt: true,
    h1Texts: ["Hong Kong family office tax guide"],
    internalLinkCount: 3,
  });

  assert.equal(result.score, 100);
  assert.equal(result.items.every((item) => item.passed), true);
});

test("SEO health score evaluates title, language FAQ, author, H1 and links independently", () => {
  const result = computeSeoScore({
    seoTitle: "A title without the selected term",
    metaDescription: "Too short",
    keywords: ["family office", "Hong Kong"],
    faqCount: 2,
    authorName: "Jane Chan",
    authorTitle: "",
    allImagesHaveAlt: false,
    h1Texts: ["Article title", "Body H1"],
    internalLinkCount: 2,
  });

  assert.equal(result.score, 0);
  assert.deepEqual(result.items.filter((item) => item.passed), []);
});

test("FAQPage schema contains only enabled and complete FAQs from the supplied article", () => {
  const firstArticle = buildFaqPageSchema({
    url: "https://www.foihk.org/en/articles/research/first",
    language: "en",
    enabled: true,
    items: [
      { enabled: true, question: "What is a family office?", answer: "A dedicated structure for managing family affairs." },
      { enabled: false, question: "Disabled question", answer: "Disabled answer" },
      { enabled: true, question: "Incomplete question", answer: "" },
    ],
  });
  const secondArticle = buildFaqPageSchema({
    url: "https://www.foihk.org/en/articles/research/second",
    language: "en",
    enabled: true,
    items: [{ enabled: true, question: "Second article question", answer: "Second article answer" }],
  });

  assert.equal(firstArticle?.mainEntity.length, 1);
  assert.equal(firstArticle?.mainEntity[0].name, "What is a family office?");
  assert.equal(secondArticle?.mainEntity.length, 1);
  assert.equal(secondArticle?.mainEntity[0].name, "Second article question");
  assert.equal(JSON.stringify(secondArticle).includes("What is a family office?"), false);
  assert.equal(buildFaqPageSchema({ url: "https://example.com", language: "en", enabled: false, items: [] }), null);
});

test("FAQPage handles zero, one, three, disabled, untranslated, and reordered items", () => {
  const url = "https://www.foihk.org/zh-hk/articles/research/faq-cases";
  assert.equal(buildFaqPageSchema({ url, language: "zh-hk", enabled: true, items: [] }), null);

  const one = buildFaqPageSchema({
    url,
    language: "zh-hk",
    enabled: true,
    items: [{ enabled: true, question: "問題一", answer: "答案一" }],
  });
  assert.deepEqual(one?.mainEntity.map((item) => item.name), ["問題一"]);

  const items = [
    { enabled: true, question: "問題三", answer: "答案三" },
    { enabled: false, question: "停用問題", answer: "停用答案" },
    { enabled: true, question: "問題一", answer: "答案一" },
    { enabled: true, question: "缺少答案", answer: "" },
    { enabled: true, question: "問題二", answer: "答案二" },
  ];
  const three = buildFaqPageSchema({ url, language: "zh-hk", enabled: true, items });
  assert.equal(three?.inLanguage, "zh-Hant");
  assert.deepEqual(three?.mainEntity.map((item) => item.name), ["問題三", "問題一", "問題二"]);

  const reordered = buildFaqPageSchema({ url, language: "zh-hk", enabled: true, items: [items[4], items[2], items[0]] });
  assert.deepEqual(reordered?.mainEntity.map((item) => item.name), ["問題二", "問題一", "問題三"]);
});

test("two article FAQ fixtures remain isolated when one is edited or deleted", () => {
  const articleA = [{ enabled: true, question: "Article A", answer: "Only A" }];
  const articleB = [{ enabled: true, question: "Article B", answer: "Only B" }];
  articleA[0] = { ...articleA[0], answer: "Updated A" };
  articleA.splice(0, 1);

  const schemaB = buildFaqPageSchema({
    url: "https://www.foihk.org/en/articles/research/b",
    language: "en",
    enabled: true,
    items: articleB,
  });
  assert.deepEqual(schemaB?.mainEntity.map((item) => item.name), ["Article B"]);
  assert.equal(JSON.stringify(schemaB).includes("Updated A"), false);
});

test("Hong Kong event date-time is emitted with the correct ISO offset", () => {
  assert.equal(formatEventDateTime("2026-09-12", "14:30", "Asia/Hong_Kong"), "2026-09-12T14:30:00+08:00");
  assert.equal(formatEventDateTime("2026-09-12", null, "Asia/Hong_Kong"), "2026-09-12");
});

test("physical Event schema requires a real venue and detailed address", () => {
  const input = {
    enabled: true,
    category: "news_events",
    language: "en" as const,
    url: "https://www.foihk.org/en/articles/news-and-events/summit",
    name: "Hong Kong Family Office Summit",
    description: "An industry summit for family office professionals.",
    image: "https://www.foihk.org/event.jpg",
    attendanceMode: "offline" as const,
    startDate: "2026-09-12",
    startTime: "14:30",
    endDate: "2026-09-12",
    endTime: "17:00",
    timezone: "Asia/Hong_Kong",
    venueName: "The Center",
    address: "99 Queen's Road Central, Central, Hong Kong",
    onlineUrl: null,
    organizerName: "FOIHK",
    organizerUrl: "https://www.foihk.org",
    status: "scheduled" as const,
    previousStartDate: null,
    previousStartTime: null,
  };
  const valid = buildEventSchema(input);

  assert.deepEqual(valid.missingCore, []);
  assert.equal(valid.schema?.location?.["@type"], "Place");
  assert.equal(valid.schema?.location?.address?.streetAddress, "99 Queen's Road Central, Central, Hong Kong");
  assert.equal(valid.schema?.startDate, "2026-09-12T14:30:00+08:00");

  const missing = buildEventSchema({
    ...input,
    address: "无",
  });
  assert.equal(missing.schema, null);
  assert.deepEqual(missing.missingCore, ["address"]);
});

test("online and mixed Event schemas use VirtualLocation without inventing missing values", () => {
  const input = {
    enabled: true,
    category: "news_events",
    language: "zh-cn" as const,
    url: "https://www.foihk.org/zh-cn/articles/news-and-events/online-event",
    name: "线上家族办公室研讨会",
    description: "",
    image: null,
    attendanceMode: "online" as const,
    startDate: "2026-10-01",
    startTime: null,
    endDate: null,
    endTime: null,
    timezone: "Asia/Hong_Kong",
    venueName: "无",
    address: "无",
    onlineUrl: "https://events.foihk.org/session",
    organizerName: "无",
    organizerUrl: null,
    status: "scheduled" as const,
    previousStartDate: null,
    previousStartTime: null,
  };
  const online = buildEventSchema(input);

  assert.deepEqual(online.missingCore, []);
  assert.equal(online.schema?.location?.["@type"], "VirtualLocation");
  assert.equal("organizer" in (online.schema || {}), false);
  assert.equal(online.warnings.length, 1);

  const mixed = buildEventSchema({ ...input, attendanceMode: "mixed" });
  assert.equal(mixed.schema, null);
  assert.deepEqual(mixed.missingCore, ["venueName", "address"]);
});

test("rescheduled Event schema includes previousStartDate only when supplied", () => {
  const result = buildEventSchema({
    enabled: true,
    category: "news_events",
    language: "en",
    url: "https://www.foihk.org/en/articles/news-and-events/rescheduled",
    name: "Rescheduled FOIHK Forum",
    description: "Forum details.",
    image: null,
    attendanceMode: "offline",
    startDate: "2026-11-10",
    startTime: "09:00",
    endDate: null,
    endTime: null,
    timezone: "Asia/Hong_Kong",
    venueName: "Convention Centre",
    address: "1 Expo Drive, Wan Chai, Hong Kong",
    onlineUrl: null,
    organizerName: "FOIHK",
    organizerUrl: null,
    status: "rescheduled",
    previousStartDate: "2026-10-10",
    previousStartTime: "09:00",
  });

  assert.equal(result.schema?.eventStatus, "https://schema.org/EventRescheduled");
  assert.equal(result.schema?.previousStartDate, "2026-10-10T09:00:00+08:00");
});

test("Event status mappings cover cancelled and postponed without a previous date", () => {
  const base = {
    enabled: true,
    category: "news_events",
    language: "en" as const,
    url: "https://www.foihk.org/en/articles/news-and-events/status",
    name: "FOIHK Forum",
    description: null,
    image: null,
    attendanceMode: "offline" as const,
    startDate: "2026-12-01",
    startTime: null,
    endDate: null,
    endTime: null,
    timezone: "Asia/Hong_Kong",
    venueName: "Forum Hall",
    address: "Central, Hong Kong",
    onlineUrl: null,
    organizerName: null,
    organizerUrl: null,
    previousStartDate: null,
    previousStartTime: null,
  };
  const cancelled = buildEventSchema({ ...base, status: "cancelled" as const });
  const postponed = buildEventSchema({ ...base, status: "postponed" as const });

  assert.equal(cancelled.schema?.eventStatus, "https://schema.org/EventCancelled");
  assert.equal(postponed.schema?.eventStatus, "https://schema.org/EventPostponed");
  assert.equal("previousStartDate" in (cancelled.schema || {}), false);
  assert.equal("previousStartDate" in (postponed.schema || {}), false);
});

test("Event Schema is omitted outside news_events or when the current-language title is absent", () => {
  const base = {
    enabled: true,
    category: "news_events",
    language: "zh-cn" as const,
    url: "https://www.foihk.org/zh-cn/articles/news-and-events/no-title",
    name: "",
    description: null,
    image: null,
    attendanceMode: "online" as const,
    startDate: "2026-12-01",
    startTime: null,
    endDate: null,
    endTime: null,
    timezone: "Asia/Hong_Kong",
    venueName: null,
    address: null,
    onlineUrl: "https://events.foihk.org/forum",
    organizerName: null,
    organizerUrl: null,
    status: "scheduled" as const,
    previousStartDate: null,
    previousStartTime: null,
  };
  const missingTitle = buildEventSchema(base);
  const wrongCategory = buildEventSchema({ ...base, category: "education_research", name: "Research briefing" });

  assert.equal(missingTitle.schema, null);
  assert.deepEqual(missingTitle.missingCore, ["name"]);
  assert.equal(wrongCategory.schema, null);
  assert.deepEqual(wrongCategory.missingCore, []);
});
