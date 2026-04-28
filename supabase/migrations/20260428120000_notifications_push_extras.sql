-- Idara: notifications, push subscriptions, optional columns for overview modals
-- PIN-based app: permissive RLS (same pattern as other open tables if needed)

-- Optional columns (safe if already present)
ALTER TABLE teacher_attendance ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE teacher_attendance ADD COLUMN IF NOT EXISTS coverage_teacher_id TEXT;
ALTER TABLE teacher_attendance ADD COLUMN IF NOT EXISTS check_in_time TEXT;

ALTER TABLE daily_attendance ADD COLUMN IF NOT EXISTS absence_reason TEXT;
ALTER TABLE daily_attendance ADD COLUMN IF NOT EXISTS parent_notified BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  severity TEXT DEFAULT 'warning',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  teacher_id TEXT,
  period_id TEXT,
  date DATE NOT NULL DEFAULT (CURRENT_DATE AT TIME ZONE 'Asia/Kolkata')::DATE,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_date ON notifications(date DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedupe
  ON notifications(type, teacher_id, period_id, date)
  WHERE type IN ('missing_attendance','missing_report');

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_notifications" ON notifications;
CREATE POLICY "open_notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  device_label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_push_subs" ON push_subscriptions;
CREATE POLICY "open_push_subs" ON push_subscriptions FOR ALL USING (true) WITH CHECK (true);

-- Seed admin_pins + VAPID public placeholder (set real values in Supabase; do not commit secrets)
INSERT INTO app_config (key, value)
SELECT 'admin_pins', '["1234","5678"]'
WHERE NOT EXISTS (SELECT 1 FROM app_config WHERE key = 'admin_pins');

INSERT INTO app_config (key, value)
SELECT 'vapid_public_key', ''
WHERE NOT EXISTS (SELECT 1 FROM app_config WHERE key = 'vapid_public_key');
