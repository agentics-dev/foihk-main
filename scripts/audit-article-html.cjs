const fs = require("node:fs");
const path = require("node:path");

const snapshotPath = path.join(process.cwd(), "public", "published-articles.json");
const contentFields = [
  ["content", "en"],
  ["content_zhtw", "zh-hk"],
  ["content_zhcn", "zh-cn"],
];

if (!fs.existsSync(snapshotPath)) {
  console.error(`Missing snapshot: ${snapshotPath}`);
  process.exit(1);
}

const articles = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
const rows = [];
const totals = {
  articles: articles.length,
  fieldsWithContent: 0,
  fieldsWithSemanticLists: 0,
  fieldsWithManualNumbering: 0,
  fieldsWithSpacer: 0,
  fieldsWithStyle: 0,
  fieldsWithTables: 0,
  fieldsWithImages: 0,
  fieldsWithBlockquotes: 0,
};

const hasManualNumbering = (html) =>
  /(?:^|>|\n)\s*(?:<p[^>]*>\s*)?(?:\d+|[一二三四五六七八九十]+)[.)、．]\s+\S/u.test(html);

for (const article of articles) {
  for (const [field, locale] of contentFields) {
    const html = String(article[field] || "");
    if (!html.trim()) continue;

    const flags = {
      semanticList: /<(ol|ul)\b/i.test(html) && /<li\b/i.test(html),
      manualNumbering: hasManualNumbering(html),
      spacer: /foihk-spacer-(?:1|2|section)/i.test(html),
      style: /\sstyle\s*=/i.test(html),
      table: /<table\b/i.test(html),
      image: /<img\b/i.test(html),
      blockquote: /<blockquote\b/i.test(html),
    };

    totals.fieldsWithContent += 1;
    if (flags.semanticList) totals.fieldsWithSemanticLists += 1;
    if (flags.manualNumbering) totals.fieldsWithManualNumbering += 1;
    if (flags.spacer) totals.fieldsWithSpacer += 1;
    if (flags.style) totals.fieldsWithStyle += 1;
    if (flags.table) totals.fieldsWithTables += 1;
    if (flags.image) totals.fieldsWithImages += 1;
    if (flags.blockquote) totals.fieldsWithBlockquotes += 1;

    if (Object.values(flags).some(Boolean)) {
      rows.push({
        slug: article.slug,
        locale,
        field,
        ...flags,
      });
    }
  }
}

console.log("FOIHK article HTML audit");
console.log(JSON.stringify(totals, null, 2));
console.table(rows);
