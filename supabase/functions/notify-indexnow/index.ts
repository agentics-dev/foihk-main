import { createClient } from "npm:@supabase/supabase-js@2.75.0";

const ALLOWED_ORIGINS = new Set([
  "https://www.foihk.org",
  "http://localhost:8080",
  "http://localhost:5173",
]);
const CATEGORIES = new Set(["education_research", "news_events", "philanthropy"]);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const KEY_PATTERN = /^[A-Za-z0-9-]{8,128}$/;
const BASE_URL = "https://www.foihk.org";
const LANGUAGES = ["en", "zh-hk", "zh-cn"];

const json = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : BASE_URL,
      "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin",
    },
  });

const getPublishableKey = () => {
  const rawKeys = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (rawKeys) {
    const keys = JSON.parse(rawKeys) as Record<string, string>;
    if (keys.default) return keys.default;
  }
  return Deno.env.get("SUPABASE_ANON_KEY");
};

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin");
  if (request.method === "OPTIONS") return json({ ok: true }, 200, origin);
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);

  const authorization = request.headers.get("Authorization");
  const accessToken = authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!accessToken) return json({ error: "Authentication required" }, 401, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = getPublishableKey();
  if (!supabaseUrl || !publishableKey) {
    return json({ error: "Server authentication is not configured" }, 500, origin);
  }

  const supabase = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) return json({ error: "Invalid session" }, 401, origin);

  const { data: adminRole, error: roleError } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (roleError) return json({ error: "Unable to verify administrator role" }, 500, origin);
  if (!adminRole) return json({ error: "Administrator role required" }, 403, origin);

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400, origin);
  }

  const keys = Object.keys(payload).sort();
  if (keys.length !== 2 || keys[0] !== "category" || keys[1] !== "slug") {
    return json({ error: "Only category and slug are accepted" }, 400, origin);
  }
  const category = typeof payload.category === "string" ? payload.category : "";
  const slug = typeof payload.slug === "string" ? payload.slug : "";
  if (!CATEGORIES.has(category) || !SLUG_PATTERN.test(slug) || slug.length > 160) {
    return json({ error: "Invalid category or slug" }, 400, origin);
  }

  const indexNowKey = Deno.env.get("INDEXNOW_KEY");
  if (!indexNowKey || !KEY_PATTERN.test(indexNowKey)) {
    return json({ error: "IndexNow is not configured" }, 503, origin);
  }

  const urlList = LANGUAGES.map(
    (language) => `${BASE_URL}/${language}/articles/${category}/${slug}`
  );
  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: "www.foihk.org",
      key: indexNowKey,
      keyLocation: `${BASE_URL}/${indexNowKey}.txt`,
      urlList,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    return json({ error: "IndexNow submission failed", retryable: true }, 502, origin);
  }

  return json({ ok: true, submitted: urlList.length }, 200, origin);
});
