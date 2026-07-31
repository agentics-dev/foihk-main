const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const EXPECTED_ENGLISH_NAME = "Family Office Institute Hong Kong";
const EXPECTED_TRADITIONAL_NAME = "香港家族辦公室學會";
const LEGACY_SIMPLIFIED_NAME = "香港家族办公室学会";
const EXPECTED_STREET_ADDRESS = "32/F, The Center, 99 Queen's Road Central";
const EXPECTED_EMAIL = "info@foihk.org";

const filesToCheck = [
  "dist/en/index.html",
  "dist/en/about/index.html",
  "dist/en/contact/index.html",
  "dist/en/philanthropy/index.html",
  "dist/en/press/index.html",
  "dist/zh-hk/index.html",
  "dist/zh-hk/about/index.html",
  "dist/zh-hk/contact/index.html",
  "dist/zh-hk/philanthropy/index.html",
  "dist/zh-hk/press/index.html",
];

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

    if (html.includes(LEGACY_SIMPLIFIED_NAME)) {
      failures.push(`${relativePath}: legacy simplified institution name still present in schema output`);
    }

    if (!hasExpectedNamePairing(jsonLdObjects)) {
      failures.push(`${relativePath}: missing expected English/Traditional Chinese institution name pairing`);
    }

    if (relativePath.includes("/index.html") && (relativePath.endsWith("/en/index.html") || relativePath.endsWith("/zh-hk/index.html") || relativePath.includes("/contact/index.html"))) {
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
