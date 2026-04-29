-- Part 6: pg_cron → pg_net → Edge Function `check_missed_rows` (every minute)
--
-- Prerequisites:
--   - Extensions: pg_cron, pg_net (Database → Extensions in Supabase Dashboard).
--   - Vault secret `edge_function_service_key` = service_role JWT (Settings → API).
--   - Replace host below if your project ref is not mhhifytmrlyksfrjacvi.
--
-- Wrapped so `supabase db push` does not hard-fail when cron/vault are not configured yet.

DO $body$
BEGIN
  PERFORM cron.schedule(
    'check-missed-rows',
    '* * * * *',
    $cron$
    SELECT net.http_post(
      url := 'https://mhhifytmrlyksfrjacvi.supabase.co/functions/v1/check_missed_rows',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret
          FROM vault.decrypted_secrets
          WHERE name = 'edge_function_service_key'
          LIMIT 1
        )
      ),
      body := '{}'::jsonb
    );
    $cron$
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'check_missed_rows: cron.schedule skipped (%). Enable pg_cron, pg_net, and Vault secret edge_function_service_key, then run the SQL in supabase/functions/check_missed_rows/README.md.', SQLERRM;
END
$body$;
