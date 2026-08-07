import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const errors = [];

const read = (path) => readFileSync(join(ROOT, path), "utf8");
const requireIncludes = (path, needle, message) => {
  if (!read(path).includes(needle)) errors.push(message);
};
const requireNotIncludes = (path, needle, message) => {
  if (read(path).includes(needle)) errors.push(message);
};

const packageJson = JSON.parse(read("package.json"));
if (packageJson.dependencies?.["react-quill"]) errors.push("package.json: react-quill must not be a production dependency");
if (packageJson.dependencies?.quill) errors.push("package.json: quill must not be a production dependency");

try {
  execFileSync("npm", ["audit", "--omit=dev", "--json"], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
  });
} catch (error) {
  const stdout = error.stdout?.toString() || "";
  if (!stdout) {
    errors.push("npm audit --omit=dev did not return JSON output");
  } else {
    const audit = JSON.parse(stdout);
    const critical = audit.metadata?.vulnerabilities?.critical || 0;
    const high = audit.metadata?.vulnerabilities?.high || 0;
    if (critical || high) errors.push(`npm audit --omit=dev: ${critical} critical and ${high} high vulnerabilities remain`);
  }
}

requireNotIncludes("src/pages/Auth.tsx", "signUp", "Auth.tsx: public signup flow must not be present");
requireNotIncludes("src/pages/Auth.tsx", "Sign Up", "Auth.tsx: Sign Up tab must not be present");
requireIncludes("supabase/config.toml", "[functions.notify-indexnow]\nverify_jwt = true", "supabase/config.toml: notify-indexnow must require Supabase JWT verification");

requireNotIncludes("src/pages/Contact.tsx", ".from(\"contact_submissions\")", "Contact.tsx: browser must not insert contact_submissions directly");
requireIncludes("src/pages/Contact.tsx", ".invoke(\"submit-contact\"", "Contact.tsx: contact form must use the submit-contact Edge Function");
requireIncludes("supabase/functions/submit-contact/index.ts", "SUPABASE_SERVICE_ROLE_KEY", "submit-contact: server-side insert must use a server-only service role secret");
requireIncludes("supabase/functions/submit-contact/index.ts", "request_fingerprint", "submit-contact: request fingerprint rate limit must be present");
requireIncludes("supabase/functions/submit-contact/index.ts", "Unexpected contact form fields", "submit-contact: request body must reject unexpected fields");
requireIncludes("supabase/migrations/20260804123000_harden_contact_submissions_constraints.sql", "contact_submissions_message_length", "contact_submissions migration: message length constraint missing");
requireIncludes("supabase/migrations/20260804123000_harden_contact_submissions_constraints.sql", "revoke update, delete", "contact_submissions migration: update/delete revocation missing");

requireNotIncludes("scripts/generate-sitemap.js", "STATIC_CONTENT_SOURCES", "generate-sitemap.js: static draft sources must not be merged into public articles");
requireNotIncludes("scripts/generate-sitemap.js", "include_in_static_build", "generate-sitemap.js: static draft flags must not control public article generation");
requireNotIncludes("scripts/generate-sitemap.js", "static_content: true", "generate-sitemap.js: static articles must not be emitted into the public snapshot");

for (const path of ["public/_headers", "vercel.json"]) {
  for (const header of ["Content-Security-Policy", "Permissions-Policy", "Referrer-Policy", "X-Content-Type-Options", "X-Frame-Options"]) {
    requireIncludes(path, header, `${path}: missing ${header}`);
  }
}

requireIncludes("src/lib/articleHtml.ts", "isAllowedUrl", "articleHtml.ts: article links and images need URL protocol allowlist");
requireIncludes("src/lib/articleHtml.ts", "ALLOWED_FORMAT_CLASSES", "articleHtml.ts: rich text class allowlist missing");
for (const className of ["foihk-font-sans", "foihk-font-serif", "foihk-font-mono", "foihk-text-xl", "foihk-align-center"]) {
  requireIncludes("src/lib/articleHtml.ts", className, `articleHtml.ts: rich text class allowlist missing ${className}`);
}
requireIncludes("src/components/ui/chart.tsx", "CSS_COLOR_PATTERN", "chart.tsx: chart CSS injection allowlist missing");

if (errors.length) {
  console.error(`Security audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Security audit passed");
