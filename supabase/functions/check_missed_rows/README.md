# `check_missed_rows` (Supabase Edge)

Detects periods that **ended 120–180 seconds ago** (Asia/Karachi “today”), then for each **assignment** in that period checks:

1. **student_attendance** — any row for `date = today`, same `teacher_id` + `subject_id` (no `period_id` on that table).
2. **daily_reports** — any row for `date = today`, same `teacher_id` + `subject_id` + `period_id`.

Inserts `notifications` (`missing_attendance` / `missing_report`); duplicates are suppressed by the partial unique index. **New rows only** trigger Web Push to `push_subscriptions` where `is_admin = true`.

## Secrets (Project → Edge Functions → Secrets)

| Name | Purpose |
|------|---------|
| `SUPABASE_URL` | Usually auto-injected |
| `SUPABASE_SERVICE_ROLE_KEY` | Usually auto-injected |
| `VAPID_PUBLIC_KEY` | Web Push |
| `VAPID_PRIVATE_KEY` | Web Push |
| `VAPID_SUBJECT` | e.g. `mailto:admin@example.com` |

## Manual invoke (testing)

Replace `PROJECT_REF` and use the **service_role** key (same as Edge env, or anon if you enabled JWT — this project sets `verify_jwt = false` so anon can call for tests):

```bash
curl -i -X POST \
  "https://PROJECT_REF.supabase.co/functions/v1/check_missed_rows" \
  -H "Authorization: Bearer SERVICE_ROLE_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d "{}"
```

Safe outside the catch window: returns `periods_in_window: 0` and logs `in_window=0`.

## Cron

See migration `20260429143000_pg_cron_check_missed_rows.sql`. Requires **Vault** secret `edge_function_service_key` and extensions **pg_cron** + **pg_net**.

## Timezone

Runtime uses **Asia/Karachi** (PKT, UTC+5) for “today” and period end timestamps. Confirm with your school before production deploy.
