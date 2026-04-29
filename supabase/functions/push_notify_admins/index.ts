/**
 * POST { "title": "...", "body": "..." } — sends Web Push to all is_admin subscriptions.
 * Secrets: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL, VAPID_* 
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import webpush from "npm:web-push@3.6.6";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Max-Age": "86400",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  let title = "Idara";
  let body = "";
  try {
    const j = await req.json();
    title = String(j.title || title);
    body = String(j.body || "");
  } catch { /* empty */ }

  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const vapidPub = Deno.env.get("VAPID_PUBLIC_KEY") || "";
  const vapidPriv = Deno.env.get("VAPID_PRIVATE_KEY") || "";
  const vapidSub = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@localhost";
  if (!vapidPub || !vapidPriv) {
    return new Response(JSON.stringify({ ok: false, error: "VAPID keys not configured" }), { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }
  webpush.setVapidDetails(vapidSub, vapidPub, vapidPriv);
  const supa = createClient(url, key);
  const { data: subs, error } = await supa.from("push_subscriptions").select("id,endpoint,p256dh,auth").eq("is_admin", true);
  if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });

  let sent = 0;
  let failed = 0;
  for (const s of subs || []) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ title, body, url: "dashboard.html#notifications" }),
      );
      sent++;
      await supa.from("push_subscriptions").update({ last_seen: new Date().toISOString() }).eq("id", s.id);
    } catch (e: unknown) {
      failed++;
      const st = (e as { statusCode?: number }).statusCode;
      if (st === 410 || st === 404) await supa.from("push_subscriptions").delete().eq("id", s.id);
    }
  }
  return new Response(JSON.stringify({ ok: true, sent, failed }), { headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
});
