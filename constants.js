// ═══════════════════════════════════════════════════════════
// DEFAULTS — seed data for first launch, all overridable
// ═══════════════════════════════════════════════════════════
const LOGO = 'data:image/webp;base64,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';
const DEFAULTS = {
  _version: 11,
  supabase_url: 'https://mhhifytmrlyksfrjacvi.supabase.co',
  supabase_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaGlmeXRtcmx5a3NmcmphY3ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxOTExNTAsImV4cCI6MjA4OTc2NzE1MH0.RIkSQq1Q7qLO_tVqklGV_KZabcKYfqqBFd7SLKpBE_Y'
};
const ST = {
  f: "'Noto Nastaliq Urdu','Noto Sans Arabic',serif",
  dk: '#0c2e2e',
  gd: '#d4af37',
  gn: '#1a4a35',
  sg: '#8fbc8f',
  mt: '#6b7c6b'
};
const stC = {
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444',
  unknown: '#9ca3af'
};
const catC = {
  excellent: '#10b981',
  good: '#3b82f6',
  weak: '#f59e0b',
  fail: '#ef4444',
  absent: '#6b7280'
};

/** Delay before permanent Supabase delete so admin can واپس. */
const STUDENT_DELETE_UNDO_MS = 8000;

