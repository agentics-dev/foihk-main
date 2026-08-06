import { createClient } from "npm:@supabase/supabase-js@2.75.0";

const ALLOWED_ORIGINS = new Set([
  "https://www.foihk.org",
  "https://foihk.org",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:8080",
]);
const BASE_URL = "https://www.foihk.org";
const LIMITS = {
  name: 120,
  email: 254,
  subject: 160,
  messageMin: 10,
  messageMax: 4000,
  userAgent: 300,
  pageUrl: 300,
  cooldownMs: 60_000,
};
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const corsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : BASE_URL,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});

const json = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const sha256 = async (value: string) => {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin");
  if (request.method === "OPTIONS") return json({ ok: true }, 200, origin);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: "Origin not allowed" }, 403, origin);
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400, origin);
  }

  const keys = Object.keys(payload).sort();
  const allowedKeys = ["email", "message", "name", "pageUrl", "subject", "website"];
  if (keys.length !== allowedKeys.length || keys.some((key, index) => key !== allowedKeys[index])) {
    return json({ error: "Unexpected contact form fields" }, 400, origin);
  }

  if (text(payload.website)) return json({ ok: true }, 200, origin);

  const name = text(payload.name);
  const email = text(payload.email).toLowerCase();
  const subject = text(payload.subject);
  const message = text(payload.message);
  const pageUrl = text(payload.pageUrl).slice(0, LIMITS.pageUrl);
  const userAgent = text(request.headers.get("User-Agent")).slice(0, LIMITS.userAgent);

  if (!name || name.length > LIMITS.name) return json({ error: "Invalid name" }, 400, origin);
  if (!email || email.length > LIMITS.email || !EMAIL_PATTERN.test(email)) {
    return json({ error: "Invalid email" }, 400, origin);
  }
  if (!subject || subject.length > LIMITS.subject) return json({ error: "Invalid subject" }, 400, origin);
  if (message.length < LIMITS.messageMin || message.length > LIMITS.messageMax) {
    return json({ error: "Invalid message" }, 400, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Contact service is not configured" }, 503, origin);
  }

  const forwardedFor = request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() || "";
  const clientIp = request.headers.get("CF-Connecting-IP") || forwardedFor || "unknown";
  const requestFingerprint = await sha256(`${clientIp}|${email}`);
  const since = new Date(Date.now() - LIMITS.cooldownMs).toISOString();
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: recentEmail, error: emailError } = await supabase
    .from("contact_submissions")
    .select("id")
    .eq("email", email)
    .gte("created_at", since)
    .limit(1);
  if (emailError) return json({ error: "Unable to validate submission rate" }, 500, origin);
  if (recentEmail?.length) return json({ error: "Please wait before sending another message" }, 429, origin);

  const { data: recentFingerprint, error: fingerprintError } = await supabase
    .from("contact_submissions")
    .select("id")
    .eq("request_fingerprint", requestFingerprint)
    .gte("created_at", since)
    .limit(1);
  if (fingerprintError) return json({ error: "Unable to validate submission rate" }, 500, origin);
  if (recentFingerprint?.length) return json({ error: "Please wait before sending another message" }, 429, origin);

  const { error: insertError } = await supabase
    .from("contact_submissions")
    .insert({
      name,
      email,
      subject,
      message,
      request_fingerprint: requestFingerprint,
      user_agent: userAgent,
      page_url: pageUrl,
    });
  if (insertError) return json({ error: "Unable to submit contact request" }, 500, origin);

  return json({ ok: true }, 200, origin);
});
