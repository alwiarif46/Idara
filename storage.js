// ═══════════════════════════════════════════════════════════
// PERSISTENT STORAGE LAYER
// ═══════════════════════════════════════════════════════════
async function loadConfig() {
  try {
    const r = await _stLoad("iri-config-v7");
    return r ? JSON.parse(r.value) : null;
  } catch (e) {
    return null;
  }
}
// [removed duplicate definitions]
async function saveConfig(cfg) {
  try {
    await _stSave("iri-config-v7", JSON.stringify(cfg));
  } catch (e) {
    console.error('Save failed', e);
  }
}
async function loadStudents() {
  try {
    const r = await _stLoad("iri-students-v7");
    return r ? JSON.parse(r.value) : null;
  } catch (e) { return null; }
}
async function saveStudents(data) {
  try { await _stSave("iri-students-v7", JSON.stringify(data)); } catch (e) {}
}
async function loadHifzLogs() {
  try {
    const r = await _stLoad("iri-hifz-v7");
    return r ? JSON.parse(r.value) : null;
  } catch (e) { return null; }
}
async function saveHifzLogs(data) {
  try { await _stSave("iri-hifz-v7", JSON.stringify(data)); } catch (e) {}
}
async function loadReports() {
  try {
    const r = await _stLoad("iri-reports");
    return r ? JSON.parse(r.value) : {};
  } catch (e) {
    return {};
  }
}
async function saveReports(reps) {
  try {
    await _stSave("iri-reports", JSON.stringify(reps));
  } catch (e) {}
}
async function loadSyncQ() {
  try {
    const r = await _stLoad("iri-syncq");
    return r ? JSON.parse(r.value) : [];
  } catch (e) {
    return [];
  }
}
async function saveSyncQ(q) {
  try {
    await _stSave("iri-syncq", JSON.stringify(q));
  } catch (e) {}
}
async function loadSAttend() {
  try { const r = await _stLoad("iri-sattend"); return r ? JSON.parse(r.value) : {}; } catch (e) { return {}; }
}
async function saveSAttend(d) { try { await _stSave("iri-sattend", JSON.stringify(d)); } catch (e) {} }
async function loadTAttend() {
  try { const r = await _stLoad("iri-tattend"); return r ? JSON.parse(r.value) : {}; } catch (e) { return {}; }
}
async function saveTAttend(d) { try { await _stSave("iri-tattend", JSON.stringify(d)); } catch (e) {} }
async function loadDAttend() {
  try { const r = await _stLoad("iri-dattend"); return r ? JSON.parse(r.value) : {}; } catch (e) { return {}; }
}
async function saveDAttend(d) { try { await _stSave("iri-dattend", JSON.stringify(d)); } catch (e) {} }

async function fetchFullConfigFromSupabase(url, key) {
  const hdr = { apikey: key, Authorization: 'Bearer ' + key };
  const base = url + '/rest/v1/';

  const [teacherRows, subjectRows, assignmentRows, periodRows, studentRows, configRows] = await Promise.all([
    fetch(base + 'teachers?select=*&order=id', { headers: hdr }).then(r => { if (!r.ok) throw new Error('teachers ' + r.status); return r.json(); }),
    fetch(base + 'subjects?select=*&order=id', { headers: hdr }).then(r => { if (!r.ok) throw new Error('subjects ' + r.status); return r.json(); }),
    fetch(base + 'assignments?select=*&order=period_id', { headers: hdr }).then(r => { if (!r.ok) throw new Error('assignments ' + r.status); return r.json(); }),
    fetch(base + 'periods?select=*&order=id', { headers: hdr }).then(r => { if (!r.ok) throw new Error('periods ' + r.status); return r.json(); }),
    fetch(base + 'students?select=*&order=name', { headers: hdr }).then(r => { if (!r.ok) throw new Error('students ' + r.status); return r.json(); }),
    fetch(base + 'app_config?select=*', { headers: hdr }).then(r => { if (!r.ok) throw new Error('app_config ' + r.status); return r.json(); }),
  ]);

  var cfgMap = {};
  if (Array.isArray(configRows)) configRows.forEach(function(r) { cfgMap[r.key] = r.value; });

  var pins = {};
  if (Array.isArray(teacherRows)) teacherRows.forEach(function(t) { pins[t.id] = t.pin || '1234'; });
  if (cfgMap.admin_creds && cfgMap.admin_creds.password) {
    pins.ADMIN = cfgMap.admin_creds.password;
  }

  return {
    teachers: Array.isArray(teacherRows) ? teacherRows.map(normalizeTeacherRow).filter(Boolean) : [],
    subjects: Array.isArray(subjectRows) ? subjectRows.map(normalizeSubjectRow).filter(Boolean) : [],
    assignments: Array.isArray(assignmentRows) ? assignmentRows.map(normalizeAssignmentRow).filter(Boolean) : [],
    periods: Array.isArray(periodRows) ? periodRows.map(normalizePeriodRow).filter(Boolean) : [],
    students: Array.isArray(studentRows) ? studentRows.map(normalizeStudentRow).filter(Boolean) : [],
    classes: Array.isArray(cfgMap.classes) ? cfgMap.classes : [],
    institution: cfgMap.institution || { name_ur: '', name_en: '', term_start: '2026-04-01', term_end: '2026-05-30', teaching_days: 42, off_day: 5, revision_day: 4 },
    scoring: cfgMap.scoring || { excellent: 80, good: 60, weak: 40 },
    dashboard: cfgMap.dashboard || { yellow: -5 },
    admin_creds: cfgMap.admin_creds || { username: 'admin', password: 'idara2026' },
    holidays: Array.isArray(cfgMap.holidays) ? cfgMap.holidays : [],
    pins: pins
  };
}

