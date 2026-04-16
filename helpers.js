// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
const gC = (CL, id) => (CL || []).find(c => c.id === id) || {
  id: '?',
  n: '?',
  c: '#ccc',
  a: '#666'
};
function calcTD(cfg) {
  const st = new Date(cfg.term_start + 'T00:00:00'),
    now = new Date();
  let c = 0;
  for (let d = new Date(st); d <= now; d.setDate(d.getDate() + 1)) {
    const w = d.getDay();
    if (w !== cfg.off_day && w !== cfg.revision_day && !(cfg.holidays || []).includes(d.toISOString().split('T')[0])) c++;
  }
  return Math.min(Math.max(c, 1), cfg.teaching_days);
}
/** Institution teaching days counted only when teacher was not absent/leave (all subjects pause). */
function calcTDTeacher(cfg, attendanceByDate) {
  const st = new Date(cfg.term_start + 'T00:00:00'),
    now = new Date();
  let c = 0;
  for (let d = new Date(st); d <= now; d.setDate(d.getDate() + 1)) {
    const w = d.getDay();
    const ds = d.toISOString().split('T')[0];
    if (w === cfg.off_day || w === cfg.revision_day || (cfg.holidays || []).includes(ds)) continue;
    const status = attendanceByDate && attendanceByDate[ds];
    if (status === 'absent' || status === 'leave') continue;
    c++;
  }
  return Math.min(Math.max(c, 1), cfg.teaching_days);
}
function genThursdays(cfg) {
  const st = new Date(cfg.term_start + 'T00:00:00'),
    en = new Date(cfg.term_end + 'T00:00:00');
  const dates = [];
  for (let d = new Date(st); d <= en; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === cfg.revision_day) dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}
function _thuShuffle(arr, seed) {
  const a = [...arr]; let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]];
  } return a;
}
function _thuDerange(teachers, origTeachers, seed) {
  for (let att = 0; att < 200; att++) {
    const perm = _thuShuffle(teachers, seed + att);
    if (perm.every((t, i) => t !== origTeachers[i])) return perm;
  }
  const perm = _thuShuffle(teachers, seed);
  for (let i = 0; i < perm.length; i++) {
    if (perm[i] === origTeachers[i]) {
      for (let j = 0; j < perm.length; j++) {
        if (i !== j && perm[j] !== origTeachers[i] && perm[i] !== origTeachers[j]) {
          [perm[i], perm[j]] = [perm[j], perm[i]]; break;
        }
      }
    }
  } return perm;
}
function genThuMap(regularAsg, eligibleIds, thuDates) {
  const byPeriod = {};
  for (const a of regularAsg) { if (!byPeriod[a.p]) byPeriod[a.p] = []; byPeriod[a.p].push(a); }
  const result = [];
  for (let wi = 0; wi < thuDates.length; wi++) {
    const weekAsg = [];
    for (const [period, slots] of Object.entries(byPeriod)) {
      const origT = slots.map(s => s.t);
      const pool = _thuShuffle(eligibleIds, wi * 100 + parseInt(period));
      const subset = pool.slice(0, origT.length);
      const assigned = _thuDerange(subset, origT, wi * 1000 + parseInt(period));
      for (let si = 0; si < slots.length; si++) {
        weekAsg.push({ t: assigned[si], sub: slots[si].sub, p: parseInt(period), origT: slots[si].t });
      }
    }
    result.push({ wk: wi + 1, dt: thuDates[wi], assignments: weekAsg });
  }
  return result;
}
function genThuSch(dates, examiners) {
  return dates.map((dt, i) => ({
    wk: i + 1, dt, ex: examiners.length ? examiners[i % examiners.length] : null
  }));
}
function cSR(sc, ab, scoring) {
  if (ab) return {
    t: null,
    p: null,
    c: 'absent'
  };
  const f = sc.filter(s => s != null && s !== '');
  if (!f.length) return {
    t: null,
    p: null,
    c: null
  };
  const n = f.map(Number);
  if (n.some(x => isNaN(x) || x < 0 || x > 10)) return {
    t: null,
    p: null,
    c: 'invalid'
  };
  const t = n.reduce((a, b) => a + b, 0),
    p = Math.round(t / (f.length * 10) * 100);
  return {
    t,
    p,
    c: p >= scoring.excellent ? 'excellent' : p >= scoring.good ? 'good' : p >= scoring.weak ? 'weak' : 'fail'
  };
}


/** Class id for roster filters — app uses `c`, Supabase often uses `class` / `class_id`. */
function studentClassId(s) {
  if (!s) return '';
  return String(s.c || s.class_id || s.class || '').trim();
}
/** Show in subject/period attendance lists (exclude only withdrawn). */
function isStudentOnRoll(s) {
  return s && s.status !== 'left';
}
/** Unify local + Supabase student row shapes into app shape. */
function normalizeStudentRow(row) {
  if (!row || !row.id) return null;
  const hIn = row.hifz && typeof row.hifz === 'object' ? row.hifz : {};
  const cid = String(row.c || row.class_id || row.class || '').trim();
  return {
    id: row.id,
    n: row.n || row.name || '',
    parent: row.parent || '',
    phone: row.phone || '',
    residence: row.residence || '',
    c: cid,
    qari: row.qari || row.qari_id || '',
    status: row.status || 'active',
    hifz: {
      paras: hIn.paras != null ? hIn.paras : (Number(row.hifz_paras) || 0),
      soorah: hIn.soorah != null ? hIn.soorah : (row.hifz_soorah || ''),
      aayat: hIn.aayat != null ? hIn.aayat : (Number(row.hifz_aayat) || 0),
      daur_para: hIn.daur_para != null ? hIn.daur_para : (row.hifz_daur || '')
    }
  };
}

function normalizeTeacherRow(row) {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    n: row.n || row.name || '',
    role: row.role || 'teacher',
    exam: row.exam != null ? row.exam : (row.is_examiner || false),
    email: row.email || '',
    pin: row.pin || '1234'
  };
}

function normalizeSubjectRow(row) {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    n: row.n || row.name || '',
    c: row.c || row['class'] || '',
    s: row.s != null ? row.s : (row.start_page || 0),
    e: row.e != null ? row.e : (row.end_page || 0)
  };
}

function normalizeAssignmentRow(row) {
  if (!row) return null;
  return {
    t: row.t || row.teacher_id || '',
    sub: row.sub || row.subject_id || '',
    p: row.p != null ? row.p : (row.period_id || 0)
  };
}

function normalizePeriodRow(row) {
  if (!row || row.id == null) return null;
  return {
    id: row.id,
    s: row.s || row.start_time || '',
    e: row.e || row.end_time || '',
    type: row.type || 'class',
    brk: row.brk != null ? row.brk : (row.type === 'break')
  };
}

