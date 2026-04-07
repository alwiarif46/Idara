// ═══════════════════════════════════════════════════════════
// IRI Apps Script Backend — paste this into script.google.com
// ═══════════════════════════════════════════════════════════

const ADMIN_SHEET_ID = '1TNSOKEWrO7lzRMeVenMG1zitECQVpwO5_QhEKlnOcCc';

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);

    var result;
    switch (payload.type) {
      case 'daily_report':
        result = handleDailyReport(payload);
        break;
      case 'thursday_test':
        result = handleThursdayTest(payload);
        break;
      default:
        result = { success: false, error: 'UNKNOWN_TYPE' };
    }

    lock.releaseLock();
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false, error: err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var action = e.parameter.action || 'config';
    var teacherId = e.parameter.teacher_id || '';

    var result;
    switch (action) {
      case 'config':
        result = getTeacherConfig(teacherId);
        break;
      case 'ping':
        result = { success: true, timestamp: new Date().toISOString() };
        break;
      default:
        result = { success: false, error: 'UNKNOWN_ACTION' };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false, error: err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleDailyReport(payload) {
  if (!payload.teacher_id) return { success: false, error: 'MISSING_TEACHER' };
  if (!payload.date) return { success: false, error: 'MISSING_DATE' };
  if (!payload.entries || !Array.isArray(payload.entries)) return { success: false, error: 'MISSING_ENTRIES' };

  var ss = SpreadsheetApp.openById(ADMIN_SHEET_ID);
  var sheet = ss.getSheetByName('DB_Daily_Reports');
  if (!sheet) return { success: false, error: 'SHEET_NOT_FOUND' };

  var rows = [];
  for (var i = 0; i < payload.entries.length; i++) {
    var e = payload.entries[i];
    rows.push([
      payload.date, payload.teacher_id, e.subject_id || '',
      e.class_id || '', e.target_page || '', e.actual_page || '',
      e.complete || '', e.reason_code || '', e.reason_text || '',
      '', '', '', '', payload.submitted_at || ''
    ]);
  }

  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  }

  return { success: true, rows_written: rows.length };
}

function handleThursdayTest(payload) {
  if (!payload.examiner_id) return { success: false, error: 'MISSING_EXAMINER' };
  if (!payload.week) return { success: false, error: 'MISSING_WEEK' };
  if (!payload.blocks || payload.blocks.length === 0) return { success: false, error: 'NO_TEST_BLOCKS' };

  var ss = SpreadsheetApp.openById(ADMIN_SHEET_ID);
  var sheet = ss.getSheetByName('DB_Thursday_Tests');
  if (!sheet) return { success: false, error: 'SHEET_NOT_FOUND' };

  var rows = [];
  for (var i = 0; i < payload.blocks.length; i++) {
    var b = payload.blocks[i];
    rows.push([
      payload.date || '', payload.week, payload.examiner_id,
      b.class_id || '', b.subject_id || '', b.subject_teacher || '',
      b.test_portion || '', b.excellent || 0, b.good || 0,
      b.weak || 0, b.fail || 0, b.absent || 0,
      b.average || 0, b.notes || '', b.suggestions || '',
      payload.submitted_at || ''
    ]);
  }

  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  }

  return { success: true, blocks_written: rows.length };
}

function getTeacherConfig(teacherId) {
  if (!teacherId) return { success: false, error: 'MISSING_TEACHER_ID' };
  var ss = SpreadsheetApp.openById(ADMIN_SHEET_ID);

  // Read assignments
  var asgSheet = ss.getSheetByName('ADMIN_Assignments');
  var assignments = [];
  if (asgSheet && asgSheet.getLastRow() > 1) {
    var data = asgSheet.getRange(2, 1, asgSheet.getLastRow() - 1, 4).getValues();
    for (var i = 0; i < data.length; i++) {
      if (data[i][0] === teacherId) {
        assignments.push({ teacher_id: data[i][0], class_id: data[i][1], subject_id: data[i][2], period_id: data[i][3] });
      }
    }
  }

  return { success: true, teacher_id: teacherId, assignments: assignments };
}