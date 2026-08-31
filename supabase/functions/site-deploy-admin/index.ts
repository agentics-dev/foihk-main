import { createClient } from "npm:@supabase/supabase-js@2.75.0";

const ALLOWED_ORIGINS = new Set([
  "https://www.foihk.org",
  "https://foihk.org",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:8080",
]);
const BASE_URL = "https://www.foihk.org";

const getPublishableKey = () => {
  const rawKeys = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (rawKeys) {
    try {
      const keys = JSON.parse(rawKeys) as Record<string, string>;
      if (keys.default) return keys.default;
    } catch {
      return null;
    }
  }
  return Deno.env.get("SUPABASE_ANON_KEY");
};

const corsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : BASE_URL,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
  "Vary": "Origin",
});

const json = (body: unknown, status: number, origin: string | null) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
});

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin");
  if (request.method === "OPTIONS") return json({ ok: true }, 200, origin);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: "Origin not allowed" }, 403, origin);
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);

  const authorization = request.headers.get("Authorization");
  const accessToken = authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!accessToken) return json({ error: "Authentication required" }, 401, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = getPublishableKey();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    return json({ error: "Deploy status service is not configured" }, 503, origin);
  }

  const callerClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userError } = await callerClient.auth.getUser(accessToken);
  if (userError || !userData.user) return json({ error: "Invalid session" }, 401, origin);
  const { data: adminRole, error: roleError } = await callerClient
    .from("user_roles")
    .select("id")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (roleError) return json({ error: "Unable to verify administrator role" }, 500, origin);
  if (!adminRole) return json({ error: "Administrator role required" }, 403, origin);

  let payload: Record<string, unknown>;
  try {
    const rawBody = await request.text();
    if (rawBody.length > 200) return json({ error: "Request too large" }, 413, origin);
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid JSON body" }, 400, origin);
  }
  if (Object.keys(payload).length !== 1 || !["status", "retry", "rebuild"].includes(String(payload.action))) {
    return json({ error: "Invalid deploy action" }, 400, origin);
  }
  const action = String(payload.action);
  if (action !== "status" && (!origin || !ALLOWED_ORIGINS.has(origin))) {
    return json({ error: "Origin required" }, 403, origin);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  if (action !== "status") {
    const { error } = await adminClient.rpc("site_deploy_admin_request", {
      _action: action,
    });
    if (error) return json({ error: "Unable to queue site deployment" }, 500, origin);
  }
  const { data, error } = await adminClient.rpc("site_deploy_admin_status");
  if (error) return json({ error: "Unable to load deploy status" }, 500, origin);
  return json({ ok: true, deploy: data }, 200, origin);
});
