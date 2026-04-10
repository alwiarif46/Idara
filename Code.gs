/**
 * IRI — My Idara Apps Script Backend
 * Idara Tehqiqat-e-Islami (Imam Azam College)
 * 
 * Handles: ping, daily_report (+ student attendance), thursday_test,
 *          hifz_progress, teacher_attendance, student_upsert, save_config
 * 
 * Admin Sheet: 1TNSOKEWrO7lzRMeVenMG1zitECQVpwO5_QhEKlnOcCc
 * Deploy: Anyone, Execute as Me
 */

const ADMIN_ID = '1TNSOKEWrO7lzRMeVenMG1zitECQVpwO5_QhEKlnOcCc';

// ═══════════════════════════════════════════════════════════
// ENTRY POINTS
// ═══════════════════════════════════════════════════════════

function doPost(e) {
  try {
    var data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      return _json({ success: false, error: 'NO_DATA' });
    }
    return _route(data);
  } catch (err) {
    return _json({ success: false, error: err.message });
  }
}

function doGet(e) {
  try {
    // Ping check
    if (e.parameter.action === 'ping') {
      return _json({ success: true, ts: new Date().toISOString() });
    }
    // GET fallback for POST data (Apps Script redirect workaround)
    if (e.parameter.data) {
      var data = JSON.parse(e.parameter.data);
      return _route(data);
    }
    return _json({ success: true, message: 'IRI Backend Active', ts: new Date().toISOString() });
  } catch (err) {
    return _json({ success: false, error: err.message });
  }
}

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _route(data) {
  var type = data.type;
  if (!type) return _json({ success: false, error: 'NO_TYPE' });

  switch (type) {
    case 'ping':
      return _json({ success: true, ts: new Date().toISOString() });
    case 'daily_report':
      return _handleDailyReport(data);
    case 'thursday_test':
      return _handleThursdayTest(data);
    case 'hifz_progress':
      return _handleHifzProgress(data);
    case 'teacher_attendance':
      return _handleTeacherAttendance(data);
    case 'student_attendance':
      return _handleStudentAttendance(data);
    case 'student_upsert':
      return _handleStudentUpsert(data);
    case 'save_config':
      return _handleSaveConfig(data);
    default:
      return _json({ success: false, error: 'UNKNOWN_TYPE: ' + type });
  }
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function _getOrCreateTab(ss, name, headers, color) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#1a2650')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    if (color) {
      try { sheet.setTabColor(color); } catch(e) {}
    }
  }
  return sheet;
}

function _appendRow(sheet, row) {
  sheet.appendRow(row);
}

function _ts() {
  return new Date().toISOString();
}

// ═══════════════════════════════════════════════════════════
// HANDLER: daily_report (+ student attendance)
// ═══════════════════════════════════════════════════════════

function _handleDailyReport(data) {
  var ss = SpreadsheetApp.openById(ADMIN_ID);

  // --- Write subject entries to DB_Daily_Reports ---
  var headers = [
    'Date', 'Teacher_ID', 'Subject_ID', 'Class_ID',
    'Target_Page', 'Actual_Page', 'Complete', 'Reason_Code', 'Submitted_At'
  ];
  var sheet = _getOrCreateTab(ss, 'DB_Daily_Reports', headers, '#4285f4');

  var entries = data.entries || [];
  var date = data.date || '';
  var teacherId = data.teacher_id || '';
  var submittedAt = data.submitted_at || _ts();

  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    _appendRow(sheet, [
      date, teacherId, e.subject_id || '', e.class_id || '',
      e.target_page || '', e.actual_page || '', e.complete || '',
      e.reason_code || '', submittedAt
    ]);
  }

  // --- Write student attendance to DB_Student_Attendance ---
  if (data.attendance && typeof data.attendance === 'object') {
    var attHeaders = [
      'Date', 'Teacher_ID', 'Class_ID', 'Subject_ID', 'Student_ID', 'Status', 'Submitted_At'
    ];
    var attSheet = _getOrCreateTab(ss, 'DB_Student_Attendance', attHeaders, '#4285f4');

    var classes = Object.keys(data.attendance);
    for (var c = 0; c < classes.length; c++) {
      var classId = classes[c];
      var students = data.attendance[classId];
      var studentIds = Object.keys(students);
      for (var s = 0; s < studentIds.length; s++) {
        var sid = studentIds[s];
        _appendRow(attSheet, [
          date, teacherId, classId, '', sid, students[sid], submittedAt
        ]);
      }
    }
  }

  return _json({ success: true, rows: entries.length });
}

// ═══════════════════════════════════════════════════════════
// HANDLER: thursday_test
// ═══════════════════════════════════════════════════════════

function _handleThursdayTest(data) {
  var ss = SpreadsheetApp.openById(ADMIN_ID);
  var headers = [
    'Date', 'Week', 'Examiner_ID', 'Period', 'Subject_ID', 'Class_ID',
    'Subject_Teacher_ID', 'Portion', 'Excellent', 'Good', 'Weak', 'Fail',
    'Absent', 'Average', 'Notes', 'Suggestions', 'Submitted_At'
  ];
  var sheet = _getOrCreateTab(ss, 'DB_Thursday_Tests', headers, '#4285f4');

  var blocks = data.blocks || [];
  var date = data.date || '';
  var week = data.week || '';
  var teacherId = data.teacher_id || '';
  var submittedAt = data.submitted_at || _ts();

  for (var i = 0; i < blocks.length; i++) {
    var b = blocks[i];
    _appendRow(sheet, [
      date, week, teacherId, b.period || '', b.subject_id || '', b.class_id || '',
      b.subject_teacher_id || '', b.portion || '',
      b.excellent || 0, b.good || 0, b.weak || 0, b.fail || 0,
      b.absent || 0, b.average || 0,
      b.notes || '', b.suggestions || '', submittedAt
    ]);
  }

  return _json({ success: true, rows: blocks.length });
}

// ═══════════════════════════════════════════════════════════
// HANDLER: hifz_progress
// ═══════════════════════════════════════════════════════════

function _handleHifzProgress(data) {
  var ss = SpreadsheetApp.openById(ADMIN_ID);
  var headers = [
    'Date', 'Student_ID', 'Student_Name', 'Paras', 'Soorah',
    'Aayat', 'Daur_Para', 'Notes', 'Submitted_At'
  ];
  var sheet = _getOrCreateTab(ss, 'DB_Hifz_Progress', headers, '#4285f4');

  var submittedAt = data.submitted_at || _ts();
  _appendRow(sheet, [
    data.date || '', data.student_id || '', data.student_name || '',
    data.paras || 0, data.soorah || '', data.aayat || 0,
    data.daur_para || '', data.notes || '', submittedAt
  ]);

  return _json({ success: true });
}

// ═══════════════════════════════════════════════════════════
// HANDLER: teacher_attendance
// ═══════════════════════════════════════════════════════════

function _handleTeacherAttendance(data) {
  var ss = SpreadsheetApp.openById(ADMIN_ID);
  var headers = [
    'Date', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'Submitted_At'
  ];
  var sheet = _getOrCreateTab(ss, 'DB_Teacher_Attendance', headers, '#4285f4');

  var date = data.date || '';
  var att = data.attendance || {};
  var submittedAt = data.submitted_at || _ts();

  _appendRow(sheet, [
    date,
    att['T1'] || '', att['T2'] || '', att['T3'] || '',
    att['T4'] || '', att['T5'] || '', att['T6'] || '',
    att['T7'] || '', att['T8'] || '', att['T9'] || '',
    submittedAt
  ]);

  return _json({ success: true });
}

// ═══════════════════════════════════════════════════════════
// HANDLER: student_attendance (upsert — per class per day)
// ═══════════════════════════════════════════════════════════

function _handleStudentAttendance(data) {
  var ss = SpreadsheetApp.openById(ADMIN_ID);
  var headers = [
    'Date', 'Teacher_ID', 'Class_ID', 'Subject_ID', 'Student_ID', 'Status', 'Submitted_At'
  ];
  var sheet = _getOrCreateTab(ss, 'DB_Student_Attendance', headers, '#4285f4');

  var date = data.date || '';
  var classId = data.class_id || '';
  var subjectId = data.subject_id || '';
  var teacherId = data.teacher_id || '';
  var att = data.attendance || {};
  var submittedAt = data.submitted_at || _ts();

  // Upsert: delete existing rows for this class+date, then insert new
  if (sheet.getLastRow() > 1) {
    var allData = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
    // Delete from bottom up to avoid index shifting
    for (var i = allData.length - 1; i >= 0; i--) {
      if (allData[i][0] === date && allData[i][2] === classId) {
        sheet.deleteRow(i + 2);
      }
    }
  }

  // Insert new rows
  var studentIds = Object.keys(att);
  for (var j = 0; j < studentIds.length; j++) {
    var sid = studentIds[j];
    _appendRow(sheet, [date, teacherId, classId, subjectId, sid, att[sid], submittedAt]);
  }

  return _json({ success: true, rows: studentIds.length });
}

// ═══════════════════════════════════════════════════════════
// HANDLER: student_upsert
// ═══════════════════════════════════════════════════════════

function _handleStudentUpsert(data) {
  var ss = SpreadsheetApp.openById(ADMIN_ID);
  var headers = [
    'Student_ID', 'Name', 'Parent', 'Phone', 'Residence',
    'Class', 'Qari', 'Status', 'Hifz_Paras', 'Hifz_Soorah',
    'Hifz_Aayat', 'Hifz_Daur', 'Updated_At'
  ];
  var sheet = _getOrCreateTab(ss, 'ADMIN_Students', headers, '#ea4335');

  var student = data.student || data;
  var sid = student.id || student.student_id || '';
  var updatedAt = data.submitted_at || _ts();

  // Check if student already exists — update in place
  if (sid && sheet.getLastRow() > 1) {
    var ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (ids[i][0] === sid) {
        var rowNum = i + 2;
        var hifz = student.hifz || {};
        sheet.getRange(rowNum, 1, 1, 13).setValues([[
          sid, student.n || student.name || '',
          student.parent || '', student.phone || '', student.residence || '',
          student.c || student.class_id || '', student.qari || '',
          student.status || 'active',
          hifz.paras || 0, hifz.soorah || '', hifz.aayat || 0,
          hifz.daur_para || '', updatedAt
        ]]);
        return _json({ success: true, action: 'updated', id: sid });
      }
    }
  }

  // New student — append
  var hifz = student.hifz || {};
  _appendRow(sheet, [
    sid, student.n || student.name || '',
    student.parent || '', student.phone || '', student.residence || '',
    student.c || student.class_id || '', student.qari || '',
    student.status || 'active',
    hifz.paras || 0, hifz.soorah || '', hifz.aayat || 0,
    hifz.daur_para || '', updatedAt
  ]);

  return _json({ success: true, action: 'inserted', id: sid });
}

// ═══════════════════════════════════════════════════════════
// HANDLER: save_config
// ═══════════════════════════════════════════════════════════

function _handleSaveConfig(data) {
  var ss = SpreadsheetApp.openById(ADMIN_ID);

  // Save subjects if provided
  if (data.subjects && data.subjects.length) {
    _rebuildSubjects(ss, data.subjects);
  }

  // Save assignments if provided
  if (data.assignments && data.assignments.length) {
    _rebuildAssignments(ss, data.assignments);
  }

  // Save periods if provided
  if (data.periods && data.periods.length) {
    _rebuildPeriods(ss, data.periods);
  }

  return _json({ success: true });
}

// ═══════════════════════════════════════════════════════════
// REBUILD FUNCTIONS — called by save_config and setup
// ═══════════════════════════════════════════════════════════

function _rebuildSubjects(ss, subjects) {
  var sheet = _getOrCreateTab(ss, 'ADMIN_Subjects', null, '#ea4335');
  sheet.clear();
  var headers = ['ID', 'Name', 'Class', 'Start_Page', 'End_Page', 'Total', 'Daily_Rate'];
  var rows = [headers];
  for (var i = 0; i < subjects.length; i++) {
    var s = subjects[i];
    var total = (s.e || 0) - (s.s || 0);
    rows.push([s.id, s.n || s.name || '', s.c || s.class_id || '', s.s || 0, s.e || 0, total, Math.round(total / 42 * 10) / 10]);
  }
  sheet.getRange(1, 1, rows.length, 7).setValues(rows);
  sheet.getRange(1, 1, 1, 7).setBackground('#1a2650').setFontColor('#fff').setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function _rebuildAssignments(ss, assignments) {
  var sheet = _getOrCreateTab(ss, 'ADMIN_Assignments', null, '#ea4335');
  sheet.clear();
  var headers = ['Teacher_ID', 'Subject_ID', 'Period'];
  var rows = [headers];
  for (var i = 0; i < assignments.length; i++) {
    var a = assignments[i];
    rows.push([a.t || '', a.sub || '', a.p || '']);
  }
  sheet.getRange(1, 1, rows.length, 3).setValues(rows);
  sheet.getRange(1, 1, 1, 3).setBackground('#1a2650').setFontColor('#fff').setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function _rebuildPeriods(ss, periods) {
  var sheet = _getOrCreateTab(ss, 'ADMIN_Periods', null, '#ea4335');
  sheet.clear();
  var headers = ['Period_ID', 'Start', 'End', 'Type'];
  var rows = [headers];
  for (var i = 0; i < periods.length; i++) {
    var p = periods[i];
    rows.push([p.id || '', p.s || '', p.e || '', p.type || 'class']);
  }
  sheet.getRange(1, 1, rows.length, 4).setValues(rows);
  sheet.getRange(1, 1, 1, 4).setBackground('#1a2650').setFontColor('#fff').setFontWeight('bold');
  sheet.setFrozenRows(1);
}

// ═══════════════════════════════════════════════════════════
// SETUP: Run once to rebuild all tabs with correct data
// ═══════════════════════════════════════════════════════════

function setupAllTabs() {
  var ss = SpreadsheetApp.openById(ADMIN_ID);

  // ── ADMIN_Teachers ──
  var tSheet = _getOrCreateTab(ss, 'ADMIN_Teachers', null, '#ea4335');
  tSheet.clear();
  var tHeaders = ['ID', 'Name', 'Role', 'Examiner', 'Email'];
  var tRows = [tHeaders,
    ['T1', 'م۔ ارشاد حیدری', 'teacher', 'No', ''],
    ['T2', 'م۔ اعجاز مخدومی', 'teacher', 'Yes', ''],
    ['T3', 'م۔ شاکر امجدی', 'teacher', 'Yes', ''],
    ['T4', 'م۔ طارق نعیمی', 'teacher', 'Yes', ''],
    ['T5', 'م۔ ضیاء علیمی', 'teacher', 'Yes', ''],
    ['T6', 'م۔ زاہد حیدری', 'teacher', 'Yes', ''],
    ['T7', 'م۔ منتظر نوری', 'teacher', 'No', ''],
    ['T8', 'ق۔ عارف رضا حسینی', 'qari', 'No', ''],
    ['T9', 'ق۔ زبیر سلطانی', 'qari', 'No', '']
  ];
  tSheet.getRange(1, 1, tRows.length, 5).setValues(tRows);
  tSheet.getRange(1, 1, 1, 5).setBackground('#1a2650').setFontColor('#fff').setFontWeight('bold');
  tSheet.setFrozenRows(1);

  // ── ADMIN_Subjects (44 subjects, corrected page ranges from Syllabus_Tracker.xlsx) ──
  var subjects = [
    ['S01','منہاج العربیة','oola',9,62],['S02','تمرین الصرف','oola',5,74],
    ['S03','آسان النحو','oola',3,38],['S04','فارسی قواعد','oola',11,72],
    ['S05','احادیث','oola',1,40],['S06','قرآت','oola',1,30],
    ['S07','میزان الصرف','sania',3,54],['S08','نور الایضاح','sania',2,97],
    ['S09','معلم الانشاء','sania',1,52],['S10','قصص النبیین','sania',3,60],
    ['S11','کنز الایمان','sania',2,110],['S12','گلستان سعدی','sania',220,257],
    ['S13','نحو میر','sania',9,88],['S14','فیض الادب','sania',1,23],
    ['S15','درس قرآن ثالثہ','salisa',123,162],['S16','النحو الواضح','salisa',3,79],
    ['S17','دروس البلاغة','salisa',15,97],['S18','ہدایة النحو','salisa',2,47],
    ['S19','مختصر القدوری','salisa',19,132],['S20','ریاض الصالحین','salisa',7,110],
    ['S21','علم الصیغة','salisa',7,62],['S22','کافیة','rabia',2,63],
    ['S23','مشکوٰة','rabia',391,430],['S24','تفسیر الجلالین','rabia',194,228],
    ['S25','اصول حدیث','rabia',24,83],['S26','اصول الشاشی','rabia',5,40],
    ['S27','نفحة العرب','rabia',9,52],['S28','معلم الانشاء ۴','rabia',2,40],
    ['S29','شرح الوقایة','rabia',146,217],['S30','مدارک التنزیل','khamisa',2,67],
    ['S31','شمائل ترمذی','khamisa',2,78],['S32','ہدایة الاولین','khamisa',3,76],
    ['S33','السراجی','khamisa',2,84],['S34','نور الانوار','khamisa',14,90],
    ['S35','قصیدة البردة','khamisa',40,299],['S36','تفسیر بیضاوی','fazilat',32,81],
    ['S37','صحیح بخاری','fazilat',1,43],['S38','صحیح مسلم','fazilat',448,482],
    ['S39','سنن نسائی','fazilat',153,196],['S40','سنن ترمذی','fazilat',21,66],
    ['S41','ہدایة آخرین','fazilat',18,104],['S42','المختارات','fazilat',22,65],
    ['S43','تجوید','oola',1,30],['S44','ادب و املاء','hifz',1,50]
  ];
  var sSheet = _getOrCreateTab(ss, 'ADMIN_Subjects', null, '#ea4335');
  sSheet.clear();
  var sHeaders = ['ID', 'Name', 'Class', 'Start_Page', 'End_Page', 'Total', 'Daily_Rate'];
  var sRows = [sHeaders];
  for (var i = 0; i < subjects.length; i++) {
    var s = subjects[i];
    var total = s[4] - s[3];
    sRows.push([s[0], s[1], s[2], s[3], s[4], total, Math.round(total / 42 * 10) / 10]);
  }
  sSheet.getRange(1, 1, sRows.length, 7).setValues(sRows);
  sSheet.getRange(1, 1, 1, 7).setBackground('#1a2650').setFontColor('#fff').setFontWeight('bold');
  sSheet.setFrozenRows(1);

  // ── ADMIN_Periods (9 slots, current timetable) ──
  var pSheet = _getOrCreateTab(ss, 'ADMIN_Periods', null, '#ea4335');
  pSheet.clear();
  var pRows = [
    ['Period_ID', 'Start', 'End', 'Type'],
    [1, '10:00', '10:35', 'class'],
    [2, '10:35', '11:10', 'class'],
    [3, '11:10', '11:45', 'class'],
    [4, '11:45', '12:20', 'class'],
    [5, '12:20', '12:55', 'class'],
    [6, '12:55', '02:00', 'break'],
    [7, '02:00', '02:35', 'class'],
    [8, '02:35', '03:10', 'class'],
    [9, '03:10', '03:45', 'class']
  ];
  pSheet.getRange(1, 1, pRows.length, 4).setValues(pRows);
  pSheet.getRange(1, 1, 1, 4).setBackground('#1a2650').setFontColor('#fff').setFontWeight('bold');
  pSheet.setFrozenRows(1);

  // ── ADMIN_Assignments (41 from Timetable_Final.xlsx) ──
  var aSheet = _getOrCreateTab(ss, 'ADMIN_Assignments', null, '#ea4335');
  aSheet.clear();
  var aRows = [
    ['Teacher_ID', 'Subject_ID', 'Period'],
    ['T1','S37',2],['T1','S01',4],['T1','S38',7],
    ['T2','S15',1],['T2','S31',2],['T2','S13',3],['T2','S08',4],['T2','S23',7],['T2','S12',8],
    ['T3','S24',1],['T3','S07',2],['T3','S41',3],['T3','S19',4],['T3','S32',5],['T3','S16',7],['T3','S25',8],['T3','S26',9],
    ['T4','S36',1],['T4','S03',2],['T4','S33',3],['T4','S40',4],['T4','S29',5],['T4','S35',7],['T4','S21',8],['T4','S02',9],
    ['T5','S30',1],['T5','S22',2],['T5','S18',3],['T5','S34',4],['T5','S17',5],['T5','S14',7],['T5','S28',8],['T5','S39',9],
    ['T6','S20',2],['T6','S04',3],['T6','S27',4],['T6','S10',5],['T6','S05',7],['T6','S42',8],
    ['T8','S44',7],['T9','S43',5]
  ];
  aSheet.getRange(1, 1, aRows.length, 3).setValues(aRows);
  aSheet.getRange(1, 1, 1, 3).setBackground('#1a2650').setFontColor('#fff').setFontWeight('bold');
  aSheet.setFrozenRows(1);

  // ── ADMIN_Calendar (60 dates, Apr 1 – May 30, 2026) ──
  _rebuildCalendar(ss, subjects);

  // ── ADMIN_Thursday_Schedule (auto-rotation, informational) ──
  var thSheet = _getOrCreateTab(ss, 'ADMIN_Thursday_Schedule', null, '#ea4335');
  thSheet.clear();
  var thuDates = ['2026-04-02','2026-04-09','2026-04-16','2026-04-23','2026-04-30',
                  '2026-05-07','2026-05-14','2026-05-21','2026-05-28'];
  var thRows = [['Week', 'Date', 'Note']];
  for (var w = 0; w < thuDates.length; w++) {
    thRows.push([w + 1, thuDates[w], 'Auto-rotation: all T1-T6 examine (no teacher on own subject)']);
  }
  thSheet.getRange(1, 1, thRows.length, 3).setValues(thRows);
  thSheet.getRange(1, 1, 1, 3).setBackground('#1a2650').setFontColor('#fff').setFontWeight('bold');
  thSheet.setFrozenRows(1);

  // ── DB tabs (create with headers if missing) ──
  _getOrCreateTab(ss, 'DB_Daily_Reports',
    ['Date', 'Teacher_ID', 'Subject_ID', 'Class_ID', 'Target_Page', 'Actual_Page', 'Complete', 'Reason_Code', 'Submitted_At'],
    '#4285f4');

  _getOrCreateTab(ss, 'DB_Thursday_Tests',
    ['Date', 'Week', 'Examiner_ID', 'Period', 'Subject_ID', 'Class_ID', 'Subject_Teacher_ID', 'Portion', 'Excellent', 'Good', 'Weak', 'Fail', 'Absent', 'Average', 'Notes', 'Suggestions', 'Submitted_At'],
    '#4285f4');

  _getOrCreateTab(ss, 'DB_Hifz_Progress',
    ['Date', 'Student_ID', 'Student_Name', 'Paras', 'Soorah', 'Aayat', 'Daur_Para', 'Notes', 'Submitted_At'],
    '#4285f4');

  _getOrCreateTab(ss, 'DB_Teacher_Attendance',
    ['Date', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'Submitted_At'],
    '#4285f4');

  _getOrCreateTab(ss, 'DB_Student_Attendance',
    ['Date', 'Teacher_ID', 'Class_ID', 'Subject_ID', 'Student_ID', 'Status', 'Submitted_At'],
    '#4285f4');

  _getOrCreateTab(ss, 'ADMIN_Students',
    ['Student_ID', 'Name', 'Parent', 'Phone', 'Residence', 'Class', 'Qari', 'Status', 'Hifz_Paras', 'Hifz_Soorah', 'Hifz_Aayat', 'Hifz_Daur', 'Updated_At'],
    '#ea4335');

  // ── DASHBOARD ──
  _rebuildDashboard(ss, subjects);

  Logger.log('✅ All tabs rebuilt successfully');
}

// ═══════════════════════════════════════════════════════════
// REBUILD CALENDAR (60 dates × 44 subject targets)
// ═══════════════════════════════════════════════════════════

function _rebuildCalendar(ss, subjects) {
  var sheet = _getOrCreateTab(ss, 'ADMIN_Calendar', null, '#ea4335');
  sheet.clear();

  // Headers
  var headers = ['Date', 'Day', 'Type', 'Day#'];
  for (var i = 0; i < subjects.length; i++) {
    headers.push(subjects[i][0] + ' ' + subjects[i][1]);
  }

  var rows = [headers];
  var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var teachingDay = 0;
  var start = new Date('2026-04-01T00:00:00');
  var end = new Date('2026-05-30T00:00:00');

  for (var d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    var dow = d.getDay();
    var dateStr = d.toISOString().split('T')[0];
    var dayName = dayNames[dow];
    var type, dayNum;

    if (dow === 5) { // Friday
      type = 'FRIDAY_OFF';
      dayNum = '';
    } else if (dow === 4) { // Thursday
      type = 'REVISION';
      dayNum = '';
    } else {
      teachingDay++;
      type = 'TEACHING';
      dayNum = teachingDay;
    }

    var row = [dateStr, dayName, type, dayNum];

    // Calculate targets for each subject
    for (var si = 0; si < subjects.length; si++) {
      var s = subjects[si];
      var sStart = s[3];
      var total = s[4] - s[3];
      if (type === 'TEACHING' && dayNum) {
        row.push(sStart + Math.round(total / 42 * dayNum));
      } else {
        row.push('');
      }
    }
    rows.push(row);
  }

  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sheet.getRange(1, 1, 1, rows[0].length).setBackground('#1a2650').setFontColor('#fff').setFontWeight('bold');
  sheet.setFrozenRows(1);
}

// ═══════════════════════════════════════════════════════════
// REBUILD DASHBOARD (44 subjects × variance columns)
// ═══════════════════════════════════════════════════════════

function _rebuildDashboard(ss, subjects) {
  var sheet = _getOrCreateTab(ss, 'DASHBOARD', null, '#f4b400');
  sheet.clear();

  var headers = ['Subject_ID', 'Name', 'Class', 'Start', 'End', 'Total',
                 'Target_Today', 'Actual_Today', 'Variance', 'Status', 'Teacher', 'Last_Updated'];
  var rows = [headers];

  for (var i = 0; i < subjects.length; i++) {
    var s = subjects[i];
    var total = s[4] - s[3];
    rows.push([s[0], s[1], s[2], s[3], s[4], total, '', '', '', '', '', '']);
  }

  sheet.getRange(1, 1, rows.length, 12).setValues(rows);
  sheet.getRange(1, 1, 1, 12).setBackground('#1a2650').setFontColor('#fff').setFontWeight('bold');
  sheet.setFrozenRows(1);
}

// ═══════════════════════════════════════════════════════════
// SEED HIFZ STUDENTS (31 from Hifz_Class_Tracker.xlsx)
// Run once after setupAllTabs
// ═══════════════════════════════════════════════════════════

function seedHifzStudents() {
  var ss = SpreadsheetApp.openById(ADMIN_ID);
  var sheet = _getOrCreateTab(ss, 'ADMIN_Students',
    ['Student_ID', 'Name', 'Parent', 'Phone', 'Residence', 'Class', 'Qari', 'Status', 'Hifz_Paras', 'Hifz_Soorah', 'Hifz_Aayat', 'Hifz_Daur', 'Updated_At'],
    '#ea4335');

  var ts = _ts();
  var students = [
    ['HA01','اظہر فیاض','','','','hifz','T8','completed',30,'','',6],
    ['HA02','فیضان فیاض','','','','hifz','T8','active',16,'','',10],
    ['HA03','مہران فاروق','','','','hifz','T8','active',14,'','',10],
    ['HA04','ثاقب احمد وانی','','','','hifz','T8','active',17,'','',13],
    ['HA05','جبران فیاض','','','','hifz','T8','active',0,'البقرة',46,''],
    ['HA06','یونس شافع','','','','hifz','T8','active',26,'','',''],
    ['HA07','فرید احمد کھتانہ','','','','hifz','T8','active',10,'','',4],
    ['HA08','ارسلان جہانگیر','','','','hifz','T8','active',4,'النساء',180,''],
    ['HA09','حازم سمیر ہانجی','','','','hifz','T8','active',9,'الأعراف',159,''],
    ['HA10','یاسر الطاف','','','','hifz','T8','active',3,'آل عمران',45,''],
    ['HA11','امتیاز احمد بٹانہ','','','','hifz','T8','active',8,'الأعراف',11,''],
    ['HA12','فاضل احمد پدر','','','','hifz','T8','active',1,'البقرة',76,''],
    ['HA13','محمد اذان','','','','hifz','T8','active',1,'البقرة',76,''],
    ['HA14','آفاق نبی','','','','hifz','T8','active',0,'البقرة',46,''],
    ['HA15','عمران نثار','','','','hifz','T8','active',5,'النساء',58,''],
    ['HA16','میلاد جاوید','','','','hifz','T8','active',2,'البقرة',166,''],
    ['HA17','راقب گلزار','','','','hifz','T8','active',0,'','',10],
    ['HA18','طارق احمد برگت','','','','hifz','T8','active',4,'آل عمران',115,''],
    ['HZ01','محسن احمد گنائی','','','','hifz','T9','completed',30,'','',15],
    ['HZ02','حاذق اعجاز','','','','hifz','T9','completed',30,'','',22],
    ['HZ03','میزان پرویز','','','','hifz','T9','active',30,'الطارق','',''],
    ['HZ04','شیزان طارق','','','','hifz','T9','active',5,'آل عمران',54,3],
    ['HZ05','یاور فیاض','','','','hifz','T9','active',16,'البقرة',83,1],
    ['HZ06','ابرق امتیاز','','','','hifz','T9','active',30,'البقرة',15,1],
    ['HZ07','ایان فیاض','','','','hifz','T9','active',30,'الطارق','',''],
    ['HZ08','اویس چوپان','','','','hifz','T9','active',8,'الأنعام','',''],
    ['HZ09','فیضان منظور','','','','hifz','T9','active',30,'الجن','',29],
    ['HZ10','راحل نثار','','','','hifz','T9','active',30,'البقرة',69,1],
    ['HZ11','عفید مدثر','','','','hifz','T9','active',30,'الأعلى','',''],
    ['HZ12','مصدق ریاض','','','','hifz','T9','active',30,'الطارق','',''],
    ['HZ13','برہان شیخ','','','','hifz','T9','active',30,'الفجر','','']
  ];

  for (var i = 0; i < students.length; i++) {
    var s = students[i];
    s.push(ts); // Updated_At
    _appendRow(sheet, s);
  }

  Logger.log('✅ 31 Hifz students seeded');
}
