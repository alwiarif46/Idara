// ═══════════════════════════════════════════════════════════
// IRI Apps Script Backend v6.1 — Auto-Migration + Filters
// Deploy: Web App → Execute as Me → Anyone has access
// ═══════════════════════════════════════════════════════════
// RUN migrateAll() ONCE from Script Editor ▶ to:
//   - Fix misaligned data in DB_Daily_Reports (dedup 229→~9)
//   - Fix headers & remap data in all DB/ADMIN tabs
//   - Add Subject_ID/Name to DB_Student_Attendance
//   - Create missing tabs, format all headers
//   - Add auto-filters + search to daily-used sheets
//   - Reorder tabs logically
// ═══════════════════════════════════════════════════════════

var ADMIN_ID = '1TNSOKEWrO7lzRMeVenMG1zitECQVpwO5_QhEKlnOcCc';

// ═══════════════════════════════════════════════════════════
// TAB DEFINITIONS — order = tab order (left to right)
// filter:true → auto-filter added on header row
// ═══════════════════════════════════════════════════════════

var TAB_DEFS = [

  // ── 1. Attendance (most used) ──

  { name:'DB_Daily_Attendance', color:'#4285f4', filter:true,
    headers:['تاریخ / Date','نشست / Slot','Marked_By_ID','نشان لگانے والا / Marked_By','Student_ID','حاضری / Status','وقت IST / Time_IST'],
    oldColMap:{0:0, 1:1, 2:4, 4:5, 5:2, 6:6} },

  { name:'DB_Student_Attendance', color:'#4285f4', filter:true,
    headers:['تاریخ / Date','Teacher_ID','استاذ / Teacher_Name','Subject_ID','مضمون / Subject_Name','درجہ / Class_ID','Student_ID','حاضری / Status','وقت IST / Time_IST'],
    // Old: Date(0),Teacher_ID(1),Class_ID(2),Student_ID(3),Status(4),Submitted_At(5)
    // New: Date(0),Teacher_ID(1),Teacher_Name(2),Subject_ID(3),Subject_Name(4),Class_ID(5),Student_ID(6),Status(7),Time_IST(8)
    oldColMap:{0:0, 1:1, 2:5, 3:6, 4:7, 5:8} },

  { name:'DB_Teacher_Attendance', color:'#4285f4', filter:true,
    headers:['تاریخ / Date','T1','T2','T3','T4','T5','T6','T7','T8','T9','وقت IST / Time_IST'],
    oldColMap:{0:0,1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,10:10} },

  // ── 2. Daily reports ──

  { name:'DB_Daily_Reports', color:'#4285f4', filter:true,
    headers:['تاریخ / Date','Teacher_ID','استاذ / Teacher_Name','Subject_ID','مضمون / Subject_Name','درجہ / Class','Period_#','ہدف / Target_Page','اصل / Actual_Page','مکمل / Complete','وجہ / Reason','وقت IST / Time_IST'],
    oldColMap:{0:0, 1:1, 2:3, 3:5, 4:7, 5:8, 6:9, 7:10, 8:11},
    dedup:true },

  { name:'DB_Thursday_Tests', color:'#4285f4', filter:true,
    headers:['تاریخ / Date','ہفتہ / Week','Examiner_ID','ممتحن / Examiner_Name','Subject_ID','مضمون / Subject_Name','درجہ / Class','Period_#','Subject_Teacher_ID','مدرس مضمون / Subject_Teacher','حصہ / Portion','اعلیٰ / Excellent','اچھا / Good','کمزور / Weak','ناکام / Fail','غائب / Absent','اوسط / Average','ملاحظات / Notes','تجاویز / Suggestions','وقت IST / Time_IST'],
    oldColMap:{} },

  { name:'DB_Hifz_Progress', color:'#4285f4', filter:true,
    headers:['تاریخ / Date','Student_ID','طالب علم / Student_Name','پارے / Paras','سورة / Soorah','آیت / Aayat','دور پارہ / Daur_Para','Qari_ID','ملاحظات / Notes','وقت IST / Time_IST'],
    oldColMap:{0:0, 1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 7:8, 8:9} },

  // ── 3. Dashboard ──

  { name:'DASHBOARD', color:'#f4b400', filter:true, headers:null },

  // ── 4. Admin config ──

  { name:'ADMIN_Students', color:'#ea4335', filter:true,
    headers:['Student_ID','نام / Name','والد / Parent','فون / Phone','رہائش / Residence','درجہ / Class','قاری / Qari','حیثیت / Status','پارے / Hifz_Paras','سورة / Hifz_Soorah','آیت / Hifz_Aayat','دور / Hifz_Daur','وقت IST / Updated_IST'],
    oldColMap:{0:0,1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,10:10,11:11,12:12} },

  { name:'ADMIN_Teachers', color:'#ea4335', headers:null },
  { name:'ADMIN_Subjects', color:'#ea4335', headers:null, filter:true },
  { name:'ADMIN_Periods', color:'#ea4335', headers:null },
  { name:'ADMIN_Assignments', color:'#ea4335', headers:null, filter:true },
  { name:'ADMIN_Thursday_Schedule', color:'#ea4335', headers:null },
  { name:'ADMIN_Calendar', color:'#ea4335', headers:null }
];

// ═══════════════════════════════════════════════════════════
// MIGRATION
// ═══════════════════════════════════════════════════════════

function migrateAll() {
  var ss = SpreadsheetApp.openById(ADMIN_ID);
  var log = [];

  for (var t = 0; t < TAB_DEFS.length; t++) {
    var def = TAB_DEFS[t];

    // Tabs we don't manage headers for
    if (!def.headers) {
      var sh = ss.getSheetByName(def.name);
      if (sh) {
        sh.setTabColor(def.color);
        if (def.filter) _ensureFilter(sh);
        log.push(def.name + ': color' + (def.filter ? ' + filter' : ''));
      } else { log.push(def.name + ': not found (skip)'); }
      continue;
    }

    var sheet = ss.getSheetByName(def.name);

    // Create new
    if (!sheet) {
      sheet = ss.insertSheet(def.name);
      sheet.setTabColor(def.color);
      sheet.getRange(1,1,1,def.headers.length).setValues([def.headers]);
      _fmtHdr(sheet, def.headers.length);
      if (def.filter) _ensureFilter(sheet);
      log.push(def.name + ': CREATED');
      continue;
    }

    var lastCol = sheet.getLastColumn();
    var lastRow = sheet.getLastRow();

    // Empty
    if (lastRow === 0 || lastCol === 0) {
      sheet.getRange(1,1,1,def.headers.length).setValues([def.headers]);
      sheet.setTabColor(def.color);
      _fmtHdr(sheet, def.headers.length);
      if (def.filter) _ensureFilter(sheet);
      log.push(def.name + ': headers written (empty)');
      continue;
    }

    // Check match
    var curHdr = sheet.getRange(1,1,1,Math.max(lastCol,1)).getValues()[0];
    var match = (curHdr.length >= def.headers.length) &&
      def.headers.every(function(h,i){ return curHdr[i]===h; });

    if (match && !def.dedup) {
      sheet.setTabColor(def.color);
      _fmtHdr(sheet, def.headers.length);
      if (def.filter) _ensureFilter(sheet);
      log.push(def.name + ': OK, reformatted');
      continue;
    }

    // ── MIGRATE ──
    var allData = lastRow > 1 ? sheet.getRange(2,1,lastRow-1,lastCol).getValues() : [];
    log.push(def.name + ': MIGRATING ' + allData.length + ' rows (' + lastCol + '→' + def.headers.length + ' cols)');

    var colMap = def.oldColMap || {};
    if (Object.keys(colMap).length === 0) {
      // Try header text match
      for (var oi=0; oi<curHdr.length; oi++) {
        for (var ni=0; ni<def.headers.length; ni++) {
          if (curHdr[oi] && def.headers[ni] && curHdr[oi]===def.headers[ni]) { colMap[oi]=ni; break; }
        }
      }
    }
    if (Object.keys(colMap).length === 0) {
      for (var pi=0; pi<Math.min(curHdr.length,def.headers.length); pi++) colMap[pi]=pi;
    }

    // Remap
    var newData = allData.map(function(oldRow) {
      var nr = new Array(def.headers.length);
      for (var c=0; c<nr.length; c++) nr[c]='';
      var mks = Object.keys(colMap);
      for (var m=0; m<mks.length; m++) {
        var from = parseInt(mks[m]);
        if (from < oldRow.length && oldRow[from] !== null && oldRow[from] !== undefined)
          nr[colMap[from]] = oldRow[from];
      }
      return nr;
    });

    // Dedup
    if (def.dedup && newData.length > 0) {
      var before = newData.length;
      var seen = {};
      var deduped = [];
      for (var di = newData.length-1; di >= 0; di--) {
        var dk = String(newData[di][0])+'|'+String(newData[di][1])+'|'+String(newData[di][3]);
        if (!seen[dk]) { seen[dk]=true; deduped.unshift(newData[di]); }
      }
      newData = deduped;
      log.push('  DEDUP: ' + before + ' → ' + newData.length + ' (removed ' + (before-newData.length) + ')');
    }

    // Rewrite
    sheet.clear();
    sheet.getRange(1,1,1,def.headers.length).setValues([def.headers]);
    if (newData.length > 0)
      sheet.getRange(2,1,newData.length,def.headers.length).setValues(newData);
    sheet.setTabColor(def.color);
    _fmtHdr(sheet, def.headers.length);
    if (sheet.getMaxColumns() > def.headers.length)
      sheet.deleteColumns(def.headers.length+1, sheet.getMaxColumns()-def.headers.length);
    if (def.filter) _ensureFilter(sheet);
    log.push(def.name + ': done (' + newData.length + ' rows)');
  }

  // Reorder tabs
  for (var ti=0; ti<TAB_DEFS.length; ti++) {
    var ts = ss.getSheetByName(TAB_DEFS[ti].name);
    if (ts) { ss.setActiveSheet(ts); ss.moveActiveSheet(ti+1); }
  }
  log.push('Tabs reordered');

  var s1 = ss.getSheetByName('Sheet1');
  if (s1 && ss.getSheets().length > 1) { ss.deleteSheet(s1); log.push('Deleted Sheet1'); }

  Logger.log(log.join('\n'));
  return { success:true, log:log };
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function _ist() {
  var d = new Date(); d.setMinutes(d.getMinutes()+330);
  return Utilities.formatDate(d,'GMT','yyyy-MM-dd hh:mm:ss a');
}

function _fmtHdr(sheet, n) {
  sheet.getRange(1,1,1,n).setBackground('#1a2780').setFontColor('#ffffff')
    .setFontWeight('bold').setFontSize(10).setHorizontalAlignment('center').setWrap(true);
  sheet.setFrozenRows(1);
  for (var i=1; i<=Math.min(n,20); i++) sheet.autoResizeColumn(i);
}

// ── Add auto-filter on header row (dropdown arrows for search/filter) ──
function _ensureFilter(sheet) {
  // Remove existing filter first
  var existingFilter = sheet.getFilter();
  if (existingFilter) existingFilter.remove();

  var lastCol = sheet.getLastColumn();
  var lastRow = Math.max(sheet.getLastRow(), 2); // at least 2 rows for filter to work
  if (lastCol > 0) {
    sheet.getRange(1, 1, lastRow, lastCol).createFilter();
  }
}

function _getTab(ss, name) {
  for (var i=0; i<TAB_DEFS.length; i++) {
    if (TAB_DEFS[i].name===name && TAB_DEFS[i].headers) {
      var sh = ss.getSheetByName(name);
      if (!sh) {
        sh = ss.insertSheet(name);
        sh.setTabColor(TAB_DEFS[i].color);
        sh.getRange(1,1,1,TAB_DEFS[i].headers.length).setValues([TAB_DEFS[i].headers]);
        _fmtHdr(sh, TAB_DEFS[i].headers.length);
        _ensureFilter(sh);
      } else if (sh.getLastRow()===0) {
        sh.getRange(1,1,1,TAB_DEFS[i].headers.length).setValues([TAB_DEFS[i].headers]);
        _fmtHdr(sh, TAB_DEFS[i].headers.length);
        _ensureFilter(sh);
      }
      return sh;
    }
  }
  return ss.getSheetByName(name);
}

function _upsert(sheet, newRows, keyIndices) {
  if (!newRows.length) return 0;
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var existing = sheet.getRange(2,1,lastRow-1,sheet.getLastColumn()).getValues();
    var nk = {};
    newRows.forEach(function(row){ nk[keyIndices.map(function(i){return String(row[i]||'')}).join('|')]=true; });
    var del = [];
    for (var i=0; i<existing.length; i++) {
      var ek = keyIndices.map(function(ci){return String(existing[i][ci]||'')}).join('|');
      if (nk[ek]) del.push(i+2);
    }
    del.sort(function(a,b){return b-a});
    del.forEach(function(rn){sheet.deleteRow(rn)});
  }
  sheet.getRange(sheet.getLastRow()+1, 1, newRows.length, newRows[0].length).setValues(newRows);

  // Refresh filter to include new rows
  var filter = sheet.getFilter();
  if (filter) {
    filter.remove();
    sheet.getRange(1,1,sheet.getLastRow(),sheet.getLastColumn()).createFilter();
  }

  return newRows.length;
}

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ═══════════════════════════════════════════════════════════
// ENTRY POINTS
// ═══════════════════════════════════════════════════════════

function doPost(e) {
  try { return _process(JSON.parse(e.postData.contents)); }
  catch(err) { return _json({success:false,error:err.message}); }
}

function doGet(e) {
  try {
    var a=e.parameter.action||'';
    if (a==='ping') return _json({success:true,timestamp:_ist(),version:'v6.1'});
    if (a==='config') return _json(_getConfig(e.parameter.teacher_id||''));
    if (e.parameter.data) return _process(JSON.parse(decodeURIComponent(e.parameter.data)));
    return _json({success:false,error:'NO_ACTION'});
  } catch(err) { return _json({success:false,error:err.message}); }
}

function _process(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  var result;
  try {
    switch(payload.type) {
      case 'ping':               result={success:true,timestamp:_ist(),version:'v6.1'}; break;
      case 'migrate':            result=migrateAll(); break;
      case 'daily_report':       result=_handleDailyReport(payload); break;
      case 'thursday_test':      result=_handleThursdayTest(payload); break;
      case 'hifz_progress':      result=_handleHifzProgress(payload); break;
      case 'student_attendance': result=_handleStudentAttendance(payload); break;
      case 'daily_attendance':   result=_handleDailyAttendance(payload); break;
      case 'teacher_attendance': result=_handleTeacherAttendance(payload); break;
      case 'student_upsert':     result=_handleStudentUpsert(payload); break;
      case 'save_config':        result=_handleSaveConfig(payload); break;
      default: result={success:false,error:'UNKNOWN_TYPE: '+payload.type};
    }
  } finally { lock.releaseLock(); }
  return _json(result);
}

// ═══════════════════════════════════════════════════════════
// HANDLERS
// ═══════════════════════════════════════════════════════════

function _handleDailyReport(pl) {
  if (!pl.teacher_id||!pl.date||!pl.entries||!pl.entries.length) return {success:false,error:'MISSING_FIELDS'};
  var ss=SpreadsheetApp.openById(ADMIN_ID), sheet=_getTab(ss,'DB_Daily_Reports'), ist=_ist();
  var rows=pl.entries.map(function(e){return[
    pl.date, pl.teacher_id, pl.teacher_name||'',
    e.subject_id||'', e.subject_name||'', e.class_id||'',
    e.period||'', e.target_page||'', e.actual_page||'',
    e.complete||'', e.reason_code||'', ist
  ];});
  return {success:true, rows_written:_upsert(sheet,rows,[0,1,3])};
}

function _handleThursdayTest(pl) {
  if (!pl.teacher_id||!pl.blocks||!pl.blocks.length) return {success:false,error:'MISSING_FIELDS'};
  var ss=SpreadsheetApp.openById(ADMIN_ID), sheet=_getTab(ss,'DB_Thursday_Tests'), ist=_ist();
  var rows=pl.blocks.map(function(b){return[
    pl.date||'', pl.week||'', pl.teacher_id, pl.examiner_name||'',
    b.subject_id||'', b.subject_name||'', b.class_id||'',
    b.period||'', b.subject_teacher_id||'', b.subject_teacher_name||'',
    b.portion||'',
    b.excellent||0, b.good||0, b.weak||0, b.fail||0, b.absent||0,
    b.average||0, b.notes||'', b.suggestions||'', ist
  ];});
  return {success:true, blocks_written:_upsert(sheet,rows,[0,2,4])};
}

function _handleHifzProgress(pl) {
  if (!pl.student_id) return {success:false,error:'MISSING_STUDENT'};
  var ss=SpreadsheetApp.openById(ADMIN_ID), sheet=_getTab(ss,'DB_Hifz_Progress');
  var date=pl.date||new Date().toISOString().split('T')[0];
  _upsert(sheet,[[date,pl.student_id,pl.student_name||'',pl.paras||0,pl.soorah||'',pl.aayat||0,pl.daur_para||'',pl.qari_id||'',pl.notes||'',_ist()]],[0,1]);
  return {success:true};
}

// Subject-wise attendance: Date + Teacher + Subject + Student
function _handleStudentAttendance(pl) {
  if (!pl.date||!pl.attendance) return {success:false,error:'MISSING_DATA'};
  var ss=SpreadsheetApp.openById(ADMIN_ID), sheet=_getTab(ss,'DB_Student_Attendance'), ist=_ist(), att=pl.attendance;
  var rows=Object.keys(att).map(function(sid){return[
    pl.date, pl.teacher_id||'', pl.teacher_name||'',
    pl.subject_id||'', pl.subject_name||'', pl.class_id||'',
    sid, att[sid], ist
  ];});
  return {success:true, rows_written:_upsert(sheet,rows,[0,1,3,6])};
}

function _handleDailyAttendance(pl) {
  if (!pl.date||!pl.attendance) return {success:false,error:'MISSING_DATA'};
  var ss=SpreadsheetApp.openById(ADMIN_ID), sheet=_getTab(ss,'DB_Daily_Attendance'), ist=_ist(), att=pl.attendance;
  var rows=Object.keys(att).map(function(sid){return[pl.date,pl.slot||'',pl.marked_by||'',pl.marked_by_name||'',sid,att[sid],ist];});
  return {success:true, rows_written:_upsert(sheet,rows,[0,1,4])};
}

function _handleTeacherAttendance(pl) {
  if (!pl.date||!pl.attendance) return {success:false,error:'MISSING_DATA'};
  var ss=SpreadsheetApp.openById(ADMIN_ID), sheet=_getTab(ss,'DB_Teacher_Attendance'), att=pl.attendance;
  _upsert(sheet,[[pl.date,att['T1']||'',att['T2']||'',att['T3']||'',att['T4']||'',att['T5']||'',att['T6']||'',att['T7']||'',att['T8']||'',att['T9']||'',_ist()]],[0]);
  return {success:true};
}

function _handleStudentUpsert(pl) {
  var ss=SpreadsheetApp.openById(ADMIN_ID), sheet=_getTab(ss,'ADMIN_Students');
  var s=pl.student||pl, h=s.hifz||{};
  var row=[s.id||s.student_id||'',s.n||s.name||'',s.parent||'',s.phone||'',s.residence||'',
    s.c||s.class_id||'',s.qari||'',s.status||'active',
    h.paras||0,h.soorah||'',h.aayat||0,h.daur_para||'',_ist()];
  _upsert(sheet,[row],[0]);
  return {success:true,id:row[0]};
}

function _handleSaveConfig(pl) {
  var ss=SpreadsheetApp.openById(ADMIN_ID);
  if (pl.subjects&&pl.subjects.length) {
    var sh=_getTab(ss,'ADMIN_Subjects');
    if (!sh) return {success:false,error:'ADMIN_Subjects not found'};
    if (sh.getLastRow()>1) sh.deleteRows(2,sh.getLastRow()-1);
    var rows=pl.subjects.map(function(s){var t=(s.e||0)-(s.s||0);return[s.id,s.n||'',s.c||'',s.s||0,s.e||0,t,t>0?(t/42).toFixed(1):0];});
    if (rows.length) sh.getRange(2,1,rows.length,rows[0].length).setValues(rows);
  }
  if (pl.assignments&&pl.assignments.length) {
    var sh2=_getTab(ss,'ADMIN_Assignments');
    if (!sh2) return {success:false,error:'ADMIN_Assignments not found'};
    if (sh2.getLastRow()>1) sh2.deleteRows(2,sh2.getLastRow()-1);
    var rows2=pl.assignments.map(function(a){return[a.t||'',a.sub||'',a.p||''];});
    if (rows2.length) sh2.getRange(2,1,rows2.length,rows2[0].length).setValues(rows2);
  }
  if (pl.periods&&pl.periods.length) {
    var sh3=_getTab(ss,'ADMIN_Periods');
    if (!sh3) return {success:false,error:'ADMIN_Periods not found'};
    if (sh3.getLastRow()>1) sh3.deleteRows(2,sh3.getLastRow()-1);
    var rows3=pl.periods.map(function(p){return[p.id||'',p.s||'',p.e||'',p.type||'',''];});
    if (rows3.length) sh3.getRange(2,1,rows3.length,rows3[0].length).setValues(rows3);
  }
  return {success:true};
}

function _getConfig(tid) {
  if (!tid) return {success:false,error:'MISSING_TEACHER_ID'};
  var ss=SpreadsheetApp.openById(ADMIN_ID), sh=ss.getSheetByName('ADMIN_Assignments'), a=[];
  if (sh&&sh.getLastRow()>1) {
    var d=sh.getRange(2,1,sh.getLastRow()-1,3).getValues();
    for (var i=0;i<d.length;i++) if (d[i][0]===tid) a.push({teacher_id:d[i][0],subject_id:d[i][1],period:d[i][2]});
  }
  return {success:true,teacher_id:tid,assignments:a};
}
