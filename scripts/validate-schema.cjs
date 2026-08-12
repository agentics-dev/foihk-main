const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const EXPECTED_ENGLISH_NAME = "Family Office Institute Hong Kong";
const EXPECTED_TRADITIONAL_NAME = "香港家族辦公室學會";
const EXPECTED_STREET_ADDRESS = "32/F, The Center, 99 Queen's Road Central";
const EXPECTED_EMAIL = "info@foihk.org";

const languages = ["en", "zh-hk", "zh-cn"];
const routeManifest = JSON.parse(readFile("scripts/generated/article-routes.json"));
const filesToCheck = languages.flatMap((language) => [
  `dist/${language}/index.html`,
  `dist/${language}/contact/index.html`,
  `dist/${language}/faq/index.html`,
]);
const articleFiles = languages.map((language) => {
  const article = routeManifest.find((item) => item.languages.includes(language));
  if (!article) throw new Error(`No indexable ${language} article route in manifest`);
  return `dist/${language}/articles/${article.category.replaceAll("_", "-")}/${article.slug}/index.html`;
});
filesToCheck.push(...articleFiles);

function readFile(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing build artifact: ${relativePath}`);
  }

  return fs.readFileSync(absolutePath, "utf8");
}

function extractJsonLd(html) {
  const matches = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  return matches.map((match, index) => {
    try {
      return JSON.parse(match[1]);
    } catch (error) {
      throw new Error(`Failed to parse JSON-LD block ${index + 1}: ${error.message}`);
    }
  });
}

function traverse(value, visitor) {
  visitor(value);

  if (Array.isArray(value)) {
    value.forEach((item) => traverse(item, visitor));
    return;
  }

  if (value && typeof value === "object") {
    Object.values(value).forEach((nested) => traverse(nested, visitor));
  }
}

function hasExpectedNamePairing(objects) {
  let found = false;

  objects.forEach((object) => {
    traverse(object, (value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return;
      }

      const alternateName = Array.isArray(value.alternateName)
        ? value.alternateName
        : typeof value.alternateName === "string"
          ? [value.alternateName]
          : [];

      if (
        value.name === EXPECTED_ENGLISH_NAME &&
        alternateName.includes(EXPECTED_TRADITIONAL_NAME)
      ) {
        found = true;
      }
    });
  });

  return found;
}

function hasExpectedNapFields(objects) {
  let found = false;

  objects.forEach((object) => {
    traverse(object, (value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return;
      }

      const alternateName = Array.isArray(value.alternateName)
        ? value.alternateName
        : typeof value.alternateName === "string"
          ? [value.alternateName]
          : [];

      const contactPoints = Array.isArray(value.contactPoint)
        ? value.contactPoint
        : value.contactPoint
          ? [value.contactPoint]
          : [];

      const hasEmail = contactPoints.some(
        (contactPoint) => contactPoint && contactPoint.email === EXPECTED_EMAIL
      );

      if (
        value.name === EXPECTED_ENGLISH_NAME &&
        alternateName.includes(EXPECTED_TRADITIONAL_NAME) &&
        value.address &&
        value.address.streetAddress === EXPECTED_STREET_ADDRESS &&
        hasEmail
      ) {
        found = true;
      }
    });
  });

  return found;
}

function main() {
  const failures = [];
  const summary = [];

  for (const relativePath of filesToCheck) {
    const html = readFile(relativePath);
    const jsonLdObjects = extractJsonLd(html);

    if (jsonLdObjects.length === 0) {
      failures.push(`${relativePath}: no JSON-LD blocks found`);
      continue;
    }

    const rootTypes = jsonLdObjects.map((object) => object && object["@type"]);
    const hasOrganization = rootTypes.includes("Organization")
      || jsonLdObjects.some((object) => object?.publisher?.["@type"] === "Organization");
    if (hasOrganization && !hasExpectedNamePairing(jsonLdObjects)) {
      failures.push(`${relativePath}: missing expected English/Traditional Chinese institution name pairing`);
    }

    const isArticle = relativePath.includes("/articles/");
    if (isArticle) {
      if (!rootTypes.some((type) => type === "Article" || type === "NewsArticle")) {
        failures.push(`${relativePath}: missing Article or NewsArticle schema`);
      }
      if (!rootTypes.includes("BreadcrumbList")) {
        failures.push(`${relativePath}: missing BreadcrumbList schema`);
      }
      for (const schema of jsonLdObjects.filter((object) => object && object["@type"] === "FAQPage")) {
        for (const item of schema.mainEntity || []) {
          if (!item.name || !html.includes(item.name)) {
            failures.push(`${relativePath}: FAQ Schema question is not visible in the page HTML`);
          }
        }
      }
    }

    if (relativePath.includes("/faq/index.html") && !rootTypes.includes("FAQPage")) {
      failures.push(`${relativePath}: missing FAQPage schema`);
    }

    if (languages.some((language) => relativePath.endsWith(`/${language}/index.html`)) || relativePath.includes("/contact/index.html")) {
      if (!hasExpectedNapFields(jsonLdObjects)) {
        failures.push(`${relativePath}: missing expected NAP-compatible name/address/contact structure`);
      }
    }

    summary.push(`${relativePath}: ${jsonLdObjects.length} JSON-LD block(s) validated`);
  }

  if (failures.length > 0) {
    console.error("Schema validation failed:");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("Schema validation passed.");
  summary.forEach((line) => console.log(`- ${line}`));
  console.log(`- Verified organization pairing: ${EXPECTED_ENGLISH_NAME} <-> ${EXPECTED_TRADITIONAL_NAME}`);
  console.log(`- Verified address: ${EXPECTED_STREET_ADDRESS}`);
  console.log(`- Verified contact email: ${EXPECTED_EMAIL}`);
}

main();
