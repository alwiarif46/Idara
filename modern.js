// ═══════════════════════════════════════════════
// MODERN EDUCATION MODULE
// ═══════════════════════════════════════════════

function normalizeModernTeacherRow(row) {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    n: row.n || row.name || '',
    role: row.role || 'teacher',
    email: row.email || '',
    pin: row.pin || '1234',
    _src: 'modern'
  };
}

function normalizeModernSectionRow(row) {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    name: row.name || '',
    display_name: row.display_name || row.name || '',
    classes_included: Array.isArray(row.classes_included) ? row.classes_included : [],
    is_active: row.is_active !== false
  };
}

function normalizeModernSubjectRow(row) {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    n: row.n || row.name || '',
    modern_class: row.modern_class || '',
    s: row.s != null ? row.s : (row.start_page || 0),
    e: row.e != null ? row.e : (row.end_page || 0),
    _src: 'modern'
  };
}

function normalizeModernAssignmentRow(row) {
  if (!row) return null;
  return {
    t: row.t || row.teacher_id || '',
    sub: row.sub || row.subject_id || '',
    sec: row.sec || row.section_id || '',
    p: row.p != null ? row.p : (row.period_id || 0),
    _src: 'modern'
  };
}

function normalizeModernStudentRow(row) {
  if (!row || !row.id) return null;
  return {
    id: row.id,
    n: row.n || row.name || '',
    parent: row.parent || '',
    phone: row.phone || '',
    residence: row.residence || '',
    modern_class: row.modern_class || '',
    section_id: row.section_id || '',
    status: row.status || 'active'
  };
}

async function fetchModernDataFromSupabase(url, key) {
  var hdr = { apikey: key, Authorization: 'Bearer ' + key };
  var base = url + '/rest/v1/';

  var [tRows, secRows, subRows, perRows, asgRows, stuRows] = await Promise.all([
    fetch(base + 'modern_teachers?select=*&order=id', { headers: hdr }).then(function(r) { if (!r.ok) throw new Error('modern_teachers ' + r.status); return r.json(); }),
    fetch(base + 'modern_sections?select=*&is_active=eq.true&order=id', { headers: hdr }).then(function(r) { if (!r.ok) throw new Error('modern_sections ' + r.status); return r.json(); }),
    fetch(base + 'modern_subjects?select=*&order=modern_class,id', { headers: hdr }).then(function(r) { if (!r.ok) throw new Error('modern_subjects ' + r.status); return r.json(); }),
    fetch(base + 'modern_periods?select=*&order=id', { headers: hdr }).then(function(r) { if (!r.ok) throw new Error('modern_periods ' + r.status); return r.json(); }),
    fetch(base + 'modern_assignments?select=*&order=period_id', { headers: hdr }).then(function(r) { if (!r.ok) throw new Error('modern_assignments ' + r.status); return r.json(); }),
    fetch(base + 'modern_students?select=*&order=name', { headers: hdr }).then(function(r) { if (!r.ok) throw new Error('modern_students ' + r.status); return r.json(); }),
  ]);

  return {
    modernTeachers: Array.isArray(tRows) ? tRows.map(normalizeModernTeacherRow).filter(Boolean) : [],
    modernSections: Array.isArray(secRows) ? secRows.map(normalizeModernSectionRow).filter(Boolean) : [],
    modernSubjects: Array.isArray(subRows) ? subRows.map(normalizeModernSubjectRow).filter(Boolean) : [],
    modernPeriods: Array.isArray(perRows) ? perRows.map(normalizePeriodRow).filter(Boolean) : [],
    modernAssignments: Array.isArray(asgRows) ? asgRows.map(normalizeModernAssignmentRow).filter(Boolean) : [],
    modernStudents: Array.isArray(stuRows) ? stuRows.map(normalizeModernStudentRow).filter(Boolean) : [],
  };
}

/**
 * Build a unified teacher list for the login dropdown.
 * Teachers who exist in both religious and modern tables appear once,
 * with a `_scopes` array indicating which systems they belong to.
 * Modern-only teachers get `_scopes: ['modern']`.
 * Religious-only teachers get `_scopes: ['religious']`.
 * Teachers in both get `_scopes: ['religious', 'modern']`.
 */
function buildUnifiedTeacherList(religiousTeachers, modernTeachers) {
  var byId = {};

  (religiousTeachers || []).forEach(function(t) {
    byId[t.id] = {
      id: t.id,
      n: t.n,
      role: t.role,
      exam: t.exam,
      email: t.email,
      pin: t.pin || '1234',
      _scopes: ['religious']
    };
  });

  (modernTeachers || []).forEach(function(mt) {
    if (byId[mt.id]) {
      // Exists in both — add modern scope
      byId[mt.id]._scopes.push('modern');
      // Use modern PIN if religious PIN is default and modern is not
      if (byId[mt.id].pin === '1234' && mt.pin && mt.pin !== '1234') {
        byId[mt.id].pin = mt.pin;
      }
    } else {
      // Modern-only teacher
      byId[mt.id] = {
        id: mt.id,
        n: mt.n,
        role: mt.role || 'teacher',
        exam: false,
        email: mt.email || '',
        pin: mt.pin || '1234',
        _scopes: ['modern']
      };
    }
  });

  return Object.values(byId);
}
