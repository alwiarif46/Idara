/**
 * Cron: every minute. Finds periods whose end time (Asia/Kolkata) fell 2–3 minutes ago,
 * then checks student_attendance + daily_reports; inserts notifications + pushes to admin subs.
 * Secrets: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import webpush from "npm:web-push@3.6.6";

const TZ = "Asia/Kolkata";

function istYmd(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function periodEndMs(ymd: string, endTime: string): number {
  const t = (endTime || "00:00").trim().padStart(5, "0");
  const iso = `${ymd}T${t}:00+05:30`;
  return Date.parse(iso);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type" } });
  }
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const vapidPub = Deno.env.get("VAPID_PUBLIC_KEY") || "";
  const vapidPriv = Deno.env.get("VAPID_PRIVATE_KEY") || "";
  const vapidSub = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@localhost";
  const supa = createClient(url, key);
  const now = Date.now();
  const winStart = now - 180_000;
  const winEnd = now - 120_000;
  const today = istYmd();

  const log: string[] = [`check_missed_rows start ${new Date().toISOString()} today=${today} windowMs=${winStart}-${winEnd}`];

  const { data: periods, error: pe } = await supa.from("periods").select("id,start_time,end_time,type").neq("type", "break");
  if (pe) {
    log.push("periods error " + pe.message);
    return new Response(JSON.stringify({ ok: false, log }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  const hit = (periods || []).filter((p: { end_time: string }) => {
    const endMs = periodEndMs(today, p.end_time);
    return endMs >= winStart && endMs <= winEnd;
  });
  log.push(`periods_checked=${(periods || []).length} in_window=${hit.length}`);

  let misses = 0;
  let pushes = 0;
  let pushFail = 0;

  if (vapidPub && vapidPriv) {
    webpush.setVapidDetails(vapidSub, vapidPub, vapidPriv);
  }

  async function pushToAdmins(title: string, body: string) {
    if (!vapidPub || !vapidPriv) return;
    const { data: subs } = await supa.from("push_subscriptions").select("id,endpoint,p256dh,auth").eq("is_admin", true);
    for (const s of subs || []) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ title, body, url: "/dashboard.html#notifications" }),
        );
        pushes++;
        await supa.from("push_subscriptions").update({ last_seen: new Date().toISOString() }).eq("id", s.id);
      } catch (e: unknown) {
        pushFail++;
        const st = (e as { statusCode?: number }).statusCode;
        if (st === 410 || st === 404) {
          await supa.from("push_subscriptions").delete().eq("id", s.id);
        }
        log.push(`push_fail ${s.id} ${String((e as Error).message || e)}`);
      }
    }
  }

  for (const p of hit) {
    const pid = String(p.id);
    const { count: attCount, error: ae } = await supa.from("student_attendance").select("id", { count: "exact", head: true }).eq("date", today).eq("period_id", pid);
    if (ae) log.push(`att_count_err ${pid} ${ae.message}`);
    const ac = attCount ?? 0;
    if (ac === 0) {
      const { data: ins, error: ie } = await supa.from("notifications").insert({
        type: "missing_attendance",
        severity: "warning",
        title: "Missing student attendance",
        message: `No student_attendance rows for period P${pid} (${p.start_time}–${p.end_time}) on ${today}.`,
        teacher_id: "",
        period_id: pid,
        date: today,
        metadata: { period_label: `${p.start_time}–${p.end_time}` },
      }).select("id").maybeSingle();
      if (!ie && ins) {
        misses++;
        await pushToAdmins("Idara: missing attendance", `Period P${pid} (${p.start_time}–${p.end_time}) has no attendance.`);
      } else if (ie && !String(ie.message || "").includes("duplicate")) log.push(`ins_att ${ie.message}`);
    }

    const { data: asgs } = await supa.from("assignments").select("teacher_id,subject_id").eq("period_id", pid);
    const seen = new Set<string>();
    for (const a of asgs || []) {
      const tid = String(a.teacher_id);
      const sid = String(a.subject_id);
      const key = `${tid}|${sid}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const { count: repCount, error: re } = await supa.from("daily_reports").select("id", { count: "exact", head: true })
        .eq("date", today).eq("teacher_id", tid).eq("subject_id", sid).eq("period_id", pid);
      if (re) log.push(`rep_count_err ${re.message}`);
      if ((repCount ?? 0) === 0) {
        const { data: trow } = await supa.from("teachers").select("name").eq("id", tid).maybeSingle();
        const { data: srow } = await supa.from("subjects").select("name").eq("id", sid).maybeSingle();
        const tname = trow?.name || tid;
        const sname = srow?.name || sid;
        const { error: ie2 } = await supa.from("notifications").insert({
          type: "missing_report",
          severity: "warning",
          title: "Missing daily report",
          message: `${tname} — ${sname} — period P${pid} (${p.start_time}–${p.end_time}) has no daily_reports row for ${today}.`,
          teacher_id: tid,
          period_id: pid,
          date: today,
          metadata: { subject_id: sid, subject_name: sname },
        }).select("id").maybeSingle();
        if (!ie2) {
          misses++;
          await pushToAdmins("Idara: missing report", `${tname} / ${sname} / P${pid}`);
        } else if (!String(ie2.message || "").includes("duplicate")) log.push(`ins_rep ${ie2.message}`);
      }
    }
  }

  log.push(`misses_insert_attempts=${misses} pushes=${pushes} push_fail=${pushFail}`);
  return new Response(JSON.stringify({ ok: true, log }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
});
