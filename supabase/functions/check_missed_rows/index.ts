/**
 * Part 6: Cron-friendly missed attendance / report detector (Asia/Karachi).
 * Schema: assignments (teacher_id, subject_id, period_id); student_attendance has NO period_id
 * (match by teacher_id + subject_id + date); daily_reports includes period_id.
 *
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 */
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const TZ = "Asia/Karachi";

function todayYmdKarachi(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Wall-clock end instant for `dateYmd` + `endHHMM` in Pakistan (UTC+5, no DST). */
function periodEndMs(dateYmd: string, endHHMM: string): number {
  const t = (endHHMM || "00:00").trim().padStart(5, "0");
  return Date.parse(`${dateYmd}T${t}:00+05:00`);
}

function isUniqueViolation(err: unknown): boolean {
  const o = err as { code?: string; message?: string };
  if (o?.code === "23505") return true;
  const m = String(o?.message || "");
  return /duplicate key|unique constraint/i.test(m);
}

type PeriodRow = { id: string | number; start_time: string; end_time: string; type: string };
type AsgRow = { teacher_id: string; subject_id: string; period_id: string | number };
type PeriodGapRow = {
  period_id: string;
  start_time: string;
  end_time: string;
  gaps_attendance: number;
  gaps_report: number;
  new_notifications_attendance: number;
  new_notifications_report: number;
};

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

  const t0 = Date.now();
  const logs: string[] = []; // survives catch for JSON body

  const log = (m: string) => {
    console.log(`[check_missed_rows] ${m}`);
    logs.push(m);
  };

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPub = Deno.env.get("VAPID_PUBLIC_KEY") || "";
    const vapidPriv = Deno.env.get("VAPID_PRIVATE_KEY") || "";
    const vapidSub = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@localhost";

    const supa = createClient(url, key);
    const today = todayYmdKarachi();
    const now = Date.now();
    const grace = Number(Deno.env.get("CHECK_GRACE_MS") || 120_000);
    const cutoff = now - grace;

    log(`start now_ms=${now} today=${today} (tz=${TZ}) cutoff_ms=${cutoff} grace_ms=${grace}`);

    if (vapidPub && vapidPriv) {
      webpush.setVapidDetails(vapidSub, vapidPub, vapidPriv);
    } else {
      log("WARN VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY missing — notifications will insert but no push");
    }

    const { data: teachersRows } = await supa.from("teachers").select("id,name");
    const { data: subjectsRows } = await supa.from("subjects").select("id,name");
    const teacherName = new Map<string, string>();
    const subjectName = new Map<string, string>();
    for (const r of teachersRows || []) {
      teacherName.set(String((r as { id: string }).id), String((r as { name: string }).name || ""));
    }
    for (const r of subjectsRows || []) {
      subjectName.set(String((r as { id: string }).id), String((r as { name: string }).name || ""));
    }

    const { data: periodsRaw, error: pe } = await supa.from("periods").select("id,start_time,end_time,type").eq("type", "class");
    if (pe) {
      log("ERROR periods " + pe.message);
      return new Response(JSON.stringify({ ok: false, logs }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    const periods = (periodsRaw || []).filter((p: PeriodRow) => String(p.type || "").toLowerCase() !== "archived");
    const inWindow = periods.filter((p: PeriodRow) => {
      const endMs = periodEndMs(today, p.end_time);
      return endMs <= cutoff;
    });

    log(`periods_class=${periods.length} completed_today=${inWindow.length}`);

    let totalInserted = 0;
    let totalPushesSent = 0;
    let totalPushFail = 0;
    let expiredRemoved = 0;
    let totalGapsAtt = 0;
    let totalGapsRep = 0;
    const byPeriod: PeriodGapRow[] = [];

    async function pushForNewNotification(notif: { id: number; title: string; message: string }) {
      if (!vapidPub || !vapidPriv) return;
      const { data: subs, error: se } = await supa.from("push_subscriptions").select("id,endpoint,p256dh,auth").eq(
        "is_admin",
        true,
      );
      if (se) {
        log(`push subs error ${se.message}`);
        return;
      }
      const list = subs || [];
      log(`push batch notif_id=${notif.id} subscriptions_targeted=${list.length}`);
      const payload = JSON.stringify({
        title: notif.title,
        body: notif.message,
        tag: `notif-${notif.id}`,
        url: "dashboard.html#notifications",
        notif_id: notif.id,
      });

      const settled = await Promise.allSettled(
        list.map(async (s: { id: number; endpoint: string; p256dh: string; auth: string }) => {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          );
          await supa.from("push_subscriptions").update({ last_seen: new Date().toISOString() }).eq("id", s.id);
        }),
      );

      for (let i = 0; i < settled.length; i++) {
        const r = settled[i];
        const s = list[i];
        if (r.status === "fulfilled") {
          totalPushesSent++;
        } else {
          totalPushFail++;
          const reason = r.reason as { statusCode?: number; message?: string } | undefined;
          const st = reason?.statusCode;
          const msg = String(reason?.message || r.reason || "");
          log(`push_fail sub_id=${s.id} status=${st} ${msg}`);
          if (st === 410 || st === 404) {
            const { error: de } = await supa.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
            if (!de) {
              expiredRemoved++;
              log(`expired_removed endpoint=${s.endpoint.slice(0, 40)}…`);
            }
          }
        }
      }
    }

    for (const p of inWindow) {
      const pid = String(p.id);
      const pStart = p.start_time || "";
      const pEnd = p.end_time || "";

      const { data: asgs, error: ae } = await supa
        .from("assignments")
        .select("teacher_id,subject_id,period_id")
        .eq("period_id", pid);

      if (ae) {
        log(`period ${pid} assignments error ${ae.message}`);
        continue;
      }

      const rows = (asgs || []) as AsgRow[];
      log(`period ${pid} assignments_checked=${rows.length}`);

      let missAtt = 0;
      let missRep = 0;
      let gapAtt = 0;
      let gapRep = 0;

      for (const a of rows) {
        const tid = String(a.teacher_id);
        const sid = String(a.subject_id);
        const tname = teacherName.get(tid) || tid;
        const sname = subjectName.get(sid) || sid;

        const { data: attRow, error: attE } = await supa
          .from("student_attendance")
          .select("id")
          .eq("date", today)
          .eq("teacher_id", tid)
          .eq("subject_id", sid)
          .limit(1)
          .maybeSingle();
        if (attE) log(`att lookup err ${tid}/${sid} ${attE.message}`);

        if (!attRow) {
          gapAtt++;
          const msg = `${tname} did not mark attendance for ${sname} (Period ${pid}, ${pStart}–${pEnd})`;
          const { data: ins, error: ie } = await supa
            .from("notifications")
            .insert({
              type: "missing_attendance",
              severity: "warning",
              title: "Attendance not marked",
              message: msg,
              teacher_id: tid,
              period_id: pid,
              date: today,
              metadata: { subject_id: sid, subject_name: sname, auto: true },
            })
            .select("id,title,message")
            .maybeSingle();

          if (ie) {
            if (isUniqueViolation(ie)) log(`dedupe missing_attendance ${tid}/${pid}`);
            else log(`insert missing_attendance err ${ie.message}`);
          } else if (ins?.id) {
            missAtt++;
            totalInserted++;
            await pushForNewNotification({ id: Number(ins.id), title: String(ins.title), message: String(ins.message) });
          }
        }

        const { data: repRow, error: repE } = await supa
          .from("daily_reports")
          .select("id")
          .eq("date", today)
          .eq("teacher_id", tid)
          .eq("subject_id", sid)
          .eq("period_id", pid)
          .limit(1)
          .maybeSingle();
        if (repE) log(`rep lookup err ${tid}/${sid}/${pid} ${repE.message}`);

        if (!repRow) {
          gapRep++;
          const msg = `${tname} did not submit daily report for ${sname} (Period ${pid}, ${pStart}–${pEnd})`;
          const { data: ins2, error: ie2 } = await supa
            .from("notifications")
            .insert({
              type: "missing_report",
              severity: "warning",
              title: "Report not submitted",
              message: msg,
              teacher_id: tid,
              period_id: pid,
              date: today,
              metadata: { subject_id: sid, subject_name: sname, auto: true },
            })
            .select("id,title,message")
            .maybeSingle();

          if (ie2) {
            if (isUniqueViolation(ie2)) log(`dedupe missing_report ${tid}/${pid}`);
            else log(`insert missing_report err ${ie2.message}`);
          } else if (ins2?.id) {
            missRep++;
            totalInserted++;
            await pushForNewNotification({ id: Number(ins2.id), title: String(ins2.title), message: String(ins2.message) });
          }
        }
      }

      totalGapsAtt += gapAtt;
      totalGapsRep += gapRep;
      byPeriod.push({
        period_id: pid,
        start_time: pStart,
        end_time: pEnd,
        gaps_attendance: gapAtt,
        gaps_report: gapRep,
        new_notifications_attendance: missAtt,
        new_notifications_report: missRep,
      });
      log(`period ${pid} gaps_attendance=${gapAtt} gaps_report=${gapRep} new_notifs_att=${missAtt} new_notifs_rep=${missRep}`);
    }

    const dur = Date.now() - t0;
    log(
      `end gaps_attendance=${totalGapsAtt} gaps_report=${totalGapsRep} total_notifications_inserted=${totalInserted} total_pushes_sent=${totalPushesSent} pushes_failed=${totalPushFail} expired_removed=${expiredRemoved} duration_ms=${dur}`,
    );

    return new Response(
      JSON.stringify({
        ok: true,
        today,
        timezone: TZ,
        periods_completed: inWindow.length,
        total_gaps_attendance: totalGapsAtt,
        total_gaps_report: totalGapsRep,
        by_period: byPeriod,
        total_notifications_inserted: totalInserted,
        total_pushes_sent: totalPushesSent,
        pushes_failed: totalPushFail,
        expired_removed: expiredRemoved,
        duration_ms: dur,
        logs,
      }),
      { headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
    );
  } catch (e) {
    const msg = String((e as Error)?.message || e);
    console.error("[check_missed_rows] fatal", e);
    return new Response(JSON.stringify({ ok: false, error: msg, logs }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
});
