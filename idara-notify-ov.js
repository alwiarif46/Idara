/**
 * Overview scorecard modals, notifications realtime hook, push helpers.
 * Depends on globals: SB_URL, SB_KEY, DATA, TODAY, render, loadAll, toast, t, classLabel, escHtml, escAttr
 * Depends on: sb, sbPatch, sbPost, sbDelete, invokeEdge (set on window from dashboard.html)
 */
(function () {
  "use strict";

  function $(id) {
    return document.getElementById(id);
  }

  function ensureModalRoot() {
    let root = $("idara-ov-modal-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "idara-ov-modal-root";
      document.body.appendChild(root);
    }
    return root;
  }

  function closeOvModal() {
    const el = $("idara-ov-overlay");
    if (el) el.remove();
    document.body.style.overflow = "";
  }

  function openOverlay(title, innerHtml) {
    closeOvModal();
    const root = ensureModalRoot();
    const sub = typeof todayIST === "function" ? todayIST() : TODAY;
    root.innerHTML =
      '<div id="idara-ov-overlay" class="idara-ov-overlay" role="dialog" aria-modal="true">' +
      '<div class="idara-ov-panel">' +
      '<div class="idara-ov-head">' +
      '<div><div class="idara-ov-title">' +
      escHtml(title) +
      "</div>" +
      '<div class="idara-ov-sub">' +
      escHtml(sub) +
      "</div></div>" +
      '<button type="button" class="idara-ov-x" id="idara-ov-close" aria-label="Close">\u00d7</button></div>' +
      '<div class="idara-ov-body">' +
      innerHtml +
      "</div></div></div>";
    document.body.style.overflow = "hidden";
    $("idara-ov-close").onclick = closeOvModal;
    $("idara-ov-overlay").onclick = function (e) {
      if (e.target.id === "idara-ov-overlay") closeOvModal();
    };
    document.addEventListener("keydown", onEsc);
    function onEsc(ev) {
      if (ev.key === "Escape") {
        document.removeEventListener("keydown", onEsc);
        closeOvModal();
      }
    }
  }

  function spinRow(on) {
    return on ? '<span class="idara-spin"></span> ' : "";
  }

  window.closeOvModal = closeOvModal;

  window.openOvScorecard = function (kind) {
    const teachers = DATA.teachers || [];
    const students = DATA.students || [];
    const subjects = DATA.subjects || [];
    const periods = DATA.periods || [];
    const assignments = DATA.assignments || [];
    const tAttToday = DATA.tAttToday || [];
    const dAttToday = DATA.dAttToday || [];
    const reportsToday = DATA.reportsToday || [];
    const sAttToday = DATA.sAttToday || [];

    if (kind === "tpresent") {
      const rows = tAttToday.filter((r) => r && r.status === "present");
      let html =
        '<p class="idara-ov-hint">' +
        escHtml(typeof t === "function" ? t("ov.modal.tpresentHint") : "Edit inline; Approve all marks pending as approved.") +
        "</p>";
      html +=
        '<div style="margin-bottom:10px"><button type="button" class="btn btn-gd btn-sm" id="ov-approve-all">' +
        escHtml(typeof t === "function" ? t("ov.modal.approveAll") : "Approve all pending") +
        "</button></div>";
      html += '<div class="idara-ov-tablewrap"><table class="tbl idara-ov-tbl"><thead><tr><th>Name</th><th>Status</th><th>Check-in</th><th></th></tr></thead><tbody>';
      rows.forEach(function (r) {
        const tid = r.teacher_id;
        const tm = teachers.find((x) => String(x.id) === String(tid));
        const chk = (r.check_in_time || (r.created_at ? String(r.created_at).slice(11, 16) : "")) || "";
        html +=
          "<tr data-tid=\"" +
          escAttr(tid) +
          "\"><td>" +
          escHtml(tm ? tm.name : tid) +
          '</td><td><select class="acc-select-chevron ov-t-status">' +
          '<option value="present"' +
          (r.status === "present" ? " selected" : "") +
          ">Present</option>" +
          '<option value="absent"' +
          (r.status === "absent" ? " selected" : "") +
          ">Absent</option>" +
          '<option value="leave"' +
          (r.status === "leave" ? " selected" : "") +
          ">Leave</option>" +
          '<option value="late"' +
          (r.status === "late" ? " selected" : "") +
          ">Late</option>" +
          "</select></td>" +
          '<td><input type="time" class="acc-field-box ov-t-time" value="' +
          escAttr(chk.length <= 5 ? chk : "") +
          '"/></td>' +
          '<td><button type="button" class="btn btn-sm btn-bl ov-t-save">Save</button></td></tr>';
      });
      html += "</tbody></table></div>";
      openOverlay(typeof t === "function" ? t("ov.teachersPresent") : "Teachers present", html);
      $("ov-approve-all").onclick = async function () {
        this.disabled = true;
        const ok = await window.sbPatch("teacher_attendance", "date=eq." + TODAY + "&approved=eq.false", {
          approved: true,
          approved_by: "admin",
          approved_at: new Date().toISOString(),
        });
        toast(ok ? (typeof t === "function" ? t("toast.allApproved") : "OK") : (typeof t === "function" ? t("toast.failed") : "Fail"));
        await loadAll();
        render();
        closeOvModal();
      };
      wireTeacherRowSaves();
      return;
    }

    if (kind === "tabsent") {
      const rows = tAttToday.filter((r) => r && (r.status === "absent" || r.status === "leave"));
      let html = '<table class="tbl idara-ov-tbl"><thead><tr><th>Name</th><th>Status</th><th>Notes</th><th>Covered by</th><th></th></tr></thead><tbody>';
      const teachOpts =
        "<option value=\"\">\u2014</option>" + teachers.map((x) => "<option value=\"" + escAttr(x.id) + "\">" + escHtml(x.name) + "</option>").join("");
      rows.forEach(function (r) {
        const tid = r.teacher_id;
        const tm = teachers.find((x) => String(x.id) === String(tid));
        html +=
          "<tr data-tid=\"" +
          escAttr(tid) +
          "\"><td>" +
          escHtml(tm ? tm.name : tid) +
          "</td><td><select class=\"acc-select-chevron ov-a-flip\">" +
          "<option value=\"absent\"" +
          (r.status === "absent" ? " selected" : "") +
          ">Absent</option>" +
          "<option value=\"leave\"" +
          (r.status === "leave" ? " selected" : "") +
          ">Leave</option></select></td>" +
          '<td><input type="text" class="acc-field-box ov-a-notes" value="' +
          escAttr(r.notes || "") +
          '"/></td>' +
          '<td><select class="acc-select-chevron ov-a-cov">' +
          teachOpts +
          "</select></td>" +
          '<td><button type="button" class="btn btn-sm btn-bl ov-a-save">Save</button></td></tr>';
        // set selected coverage after parse - inject via data attribute simpler: skip selected in string, patch in wire
      });
      html += "</tbody></table>";
      openOverlay(typeof t === "function" ? t("ov.teachersAbsent") : "Teachers absent / leave", html);
      Array.prototype.forEach.call(document.querySelectorAll(".ov-a-cov"), function (sel, i) {
        const cov = rows[i].coverage_teacher_id || "";
        sel.value = cov;
      });
      Array.prototype.forEach.call(document.querySelectorAll(".ov-a-save"), function (btn) {
        btn.onclick = async function () {
          const tr = btn.closest("tr");
          const tid = tr.getAttribute("data-tid");
          btn.disabled = true;
          btn.innerHTML = spinRow(true) + "Save";
          const ok = await window.sbPatch("teacher_attendance", "date=eq." + TODAY + "&teacher_id=eq." + tid, {
            status: tr.querySelector(".ov-a-flip").value,
            notes: tr.querySelector(".ov-a-notes").value,
            coverage_teacher_id: tr.querySelector(".ov-a-cov").value || null,
          });
          toast(ok ? (typeof t === "function" ? t("toast.done") : "Saved") : (typeof t === "function" ? t("toast.failed") : "Failed"));
          btn.disabled = false;
          btn.textContent = "Save";
          await loadAll();
          render();
        };
      });
      return;
    }

    if (kind === "spresent" || kind === "sabsent") {
      const want = kind === "spresent" ? "P" : "A";
      const rows = dAttToday.filter((r) => r && r.status === want);
      const byClass = {};
      rows.forEach(function (r) {
        const st = students.find((s) => String(s.id) === String(r.student_id));
        const c = (st && st.class) || r.class || "_";
        if (!byClass[c]) byClass[c] = [];
        byClass[c].push({ r: r, st: st });
      });
      const extraTh = want === "A" ? "<th>Parent / reason</th>" : "";
      let html = "";
      Object.keys(byClass)
        .sort()
        .forEach(function (c) {
          html +=
            "<h4 class=\"idara-ov-classh\">" +
            escHtml(classLabel(c) || c) +
            "</h4><table class=\"tbl idara-ov-tbl\"><thead><tr><th>Student</th><th>Status</th>" +
            extraTh +
            "<th></th></tr></thead><tbody>";
          byClass[c].forEach(function (o) {
            const sid = o.r.student_id;
            html +=
              "<tr data-sid=\"" +
              escAttr(sid) +
              "\"><td>" +
              escHtml(o.st ? o.st.name : sid) +
              "</td><td><select class=\"acc-select-chevron ov-d-status\">" +
              "<option value=\"P\"" +
              (o.r.status === "P" ? " selected" : "") +
              ">P</option>" +
              "<option value=\"A\"" +
              (o.r.status === "A" ? " selected" : "") +
              ">A</option>" +
              "<option value=\"L\"" +
              (o.r.status === "L" ? " selected" : "") +
              ">L</option></select></td>";
            if (want === "A") {
              html +=
                '<td><label><input type="checkbox" class="ov-d-par"' +
                (o.r.parent_notified ? " checked" : "") +
                "/> " +
                escHtml(typeof t === "function" ? t("ov.modal.parentNotified") : "Parent notified") +
                "</label><br/><input type=\"text\" class=\"acc-field-box ov-d-reason\" placeholder=\"Reason\" value=\"" +
                escAttr(o.r.absence_reason || "") +
                '"/></td>';
            }
            html += '<td><button type=\"button\" class=\"btn btn-sm btn-bl ov-d-save\">Save</button></td></tr>';
          });
          html += "</tbody></table>";
        });
      openOverlay(
        want === "P"
          ? typeof t === "function"
            ? t("ov.modal.studentsPresentTitle")
            : "Students present"
          : typeof t === "function"
            ? t("ov.modal.studentsAbsentTitle")
            : "Students absent",
        html || "<p>" + (typeof t === "function" ? t("ov.modal.noRows") : "No rows") + "</p>",
      );
      Array.prototype.forEach.call(document.querySelectorAll(".ov-d-save"), function (btn) {
        btn.onclick = async function () {
          const tr = btn.closest("tr");
          const sid = tr.getAttribute("data-sid");
          btn.disabled = true;
          const patch = { status: tr.querySelector(".ov-d-status").value };
          if (tr.querySelector(".ov-d-reason")) {
            patch.absence_reason = tr.querySelector(".ov-d-reason").value;
            patch.parent_notified = tr.querySelector(".ov-d-par").checked;
          }
          const ok = await window.sbPatch("daily_attendance", "date=eq." + TODAY + "&student_id=eq." + sid, patch);
          toast(ok ? (typeof t === "function" ? t("toast.done") : "Saved") : (typeof t === "function" ? t("toast.failed") : "Failed"));
          btn.disabled = false;
          await loadAll();
          render();
        };
      });
      return;
    }

    if (kind === "rcomplete") {
      const rows = reportsToday.filter((r) => r && r.complete === "\u06C1\u0627\u06BA");
      let html = "<ul class=\"idara-ov-list\">";
      rows.forEach(function (r) {
        html +=
          "<li><button type=\"button\" class=\"idara-ov-linkbtn ov-rep-view\" data-json=\"" +
          escAttr(JSON.stringify(r)) +
          "\">" +
          escHtml(r.teacher_name || r.teacher_id) +
          " \u2014 " +
          escHtml(r.subject_name || "") +
          "</button></li>";
      });
      html += "</ul>";
      openOverlay(typeof t === "function" ? t("ov.reportsFull") : "Complete reports", html || "<p>None</p>");
      Array.prototype.forEach.call(document.querySelectorAll(".ov-rep-view"), function (b) {
        b.onclick = function () {
          try {
            alert(JSON.stringify(JSON.parse(b.getAttribute("data-json")), null, 2));
          } catch (e) {
            alert(b.getAttribute("data-json"));
          }
        };
      });
      return;
    }

    if (kind === "rpartial") {
      const miss = window.computePartialReportGaps
        ? window.computePartialReportGaps(assignments, reportsToday, teachers, subjects, periods)
        : [];
      let html = "<table class=\"tbl idara-ov-tbl\"><thead><tr><th>Teacher</th><th>Subject</th><th>Period</th><th></th></tr></thead><tbody>";
      miss.forEach(function (m) {
        html +=
          "<tr data-tid=\"" +
          escAttr(m.teacherId) +
          "\" data-pid=\"" +
          escAttr(m.periodId) +
          "\" data-sid=\"" +
          escAttr(m.subjectId) +
          "\"><td>" +
          escHtml(m.teacherName) +
          "</td><td>" +
          escHtml(m.subjectName) +
          "</td><td>" +
          escHtml(m.periodLabel) +
          "</td><td><button type=\"button\" class=\"btn btn-sm btn-bl ov-rem\">" +
          escHtml(typeof t === "function" ? t("ov.modal.sendReminder") : "Send reminder") +
          "</button></td></tr>";
      });
      html += "</tbody></table>";
      openOverlay(typeof t === "function" ? t("ov.reportsPartial") : "Partial reports", html || "<p>None</p>");
      Array.prototype.forEach.call(document.querySelectorAll(".ov-rem"), function (btn) {
        btn.onclick = function () {
          window.sendPartialReminder(btn);
        };
      });
      return;
    }

    if (kind === "roster") {
      let q = "";
      let html =
        '<p><input type="search" id="ov-stud-search" class="acc-field-box" placeholder="' +
        escAttr(typeof t === "function" ? t("common.search") : "Search") +
        '" style="max-width:100%;margin-bottom:10px"/></p>';
      function buildTable(filter) {
        const f = (filter || "").toLowerCase();
        const byClass = {};
        students.forEach(function (st) {
          if (f && String(st.name + st.id + (st.parent || "")).toLowerCase().indexOf(f) < 0) return;
          const c = st.class || "_";
          if (!byClass[c]) byClass[c] = [];
          byClass[c].push(st);
        });
        let t = "";
        Object.keys(byClass)
          .sort()
          .forEach(function (c) {
            t += "<h4>" + escHtml(classLabel(c) || c) + "</h4><table class=\"tbl\"><thead><tr><th>ID</th><th>Name</th><th>Class</th><th>Parent</th><th>Status</th><th></th></tr></thead><tbody>";
            byClass[c].forEach(function (st) {
              t +=
                "<tr data-id=\"" +
                escAttr(st.id) +
                "\"><td>" +
                escHtml(st.id) +
                "</td><td><input class=\"acc-field-box ov-st-name\" value=\"" +
                escAttr(st.name || "") +
                "\"/></td>" +
                "<td><input class=\"acc-field-box ov-st-class\" value=\"" +
                escAttr(st.class || "") +
                "\"/></td>" +
                "<td><input class=\"acc-field-box ov-st-parent\" value=\"" +
                escAttr(st.parent || "") +
                "\"/></td>" +
                "<td><select class=\"acc-select-chevron ov-st-status\">" +
                "<option value=\"active\"" +
                ((st.status || "active") === "active" ? " selected" : "") +
                ">active</option>" +
                "<option value=\"left\"" +
                (st.status === "left" ? " selected" : "") +
                ">left</option></select></td>" +
                '<td><button type="button" class="btn btn-sm btn-bl ov-st-save">Save</button> ' +
                "<button type=\"button\" class=\"btn btn-sm ov-st-del\" title=\"Use Students tab\">\u2296</button></td></tr>";
            });
            t += "</tbody></table>";
          });
        return t || "<p>No matches</p>";
      }
      html += '<div id="ov-stud-wrap">' + buildTable("") + "</div>";
      openOverlay(typeof t === "function" ? t("ov.totalStudents") : "Students", html);
      $("ov-stud-search").oninput = function () {
        $("ov-stud-wrap").innerHTML = buildTable(this.value);
        wireStudentSaves();
      };
      wireStudentSaves();
      Array.prototype.forEach.call(document.querySelectorAll(".ov-st-del"), function (b) {
        b.onclick = function () {
          alert(typeof t === "function" ? t("ov.modal.useStudentsTab") : "Use Students tab for full delete.");
        };
      });
      return;
    }

    if (kind === "subjects") {
      openOverlay(
        typeof t === "function" ? t("ov.totalSubjects") : "Subjects",
        "<p>" +
          escHtml(typeof t === "function" ? t("ov.modal.subjectsView") : "View-only. Open Export tab to export subjects.") +
          '</p><button type="button" class="btn btn-gd" onclick="window.switchTab(\'export\');window.closeOvModal&&window.closeOvModal();">' +
          escHtml(typeof t === "function" ? t("tab.export") : "Export") +
          "</button>",
      );
      return;
    }

    function wireTeacherRowSaves() {
      Array.prototype.forEach.call(document.querySelectorAll(".ov-t-save"), function (btn) {
        btn.onclick = async function () {
          const tr = btn.closest("tr");
          const tid = tr.getAttribute("data-tid");
          const timeVal = tr.querySelector(".ov-t-time").value;
          btn.disabled = true;
          const ok = await window.sbPatch("teacher_attendance", "date=eq." + TODAY + "&teacher_id=eq." + tid, {
            status: tr.querySelector(".ov-t-status").value,
            check_in_time: timeVal || null,
          });
          toast(ok ? (typeof t === "function" ? t("toast.done") : "Saved") : (typeof t === "function" ? t("toast.failed") : "Failed"));
          btn.disabled = false;
          await loadAll();
          render();
        };
      });
    }

    function wireStudentSaves() {
      Array.prototype.forEach.call(document.querySelectorAll(".ov-st-save"), function (btn) {
        btn.onclick = async function () {
          const tr = btn.closest("tr");
          const id = tr.getAttribute("data-id");
          if (!confirm(typeof t === "function" ? t("ov.modal.confirmSaveStudent") : "Save changes to this student?")) return;
          btn.disabled = true;
          const ok = await window.sbPatch("students", "id=eq." + encodeURIComponent(id), {
            name: tr.querySelector(".ov-st-name").value,
            class: tr.querySelector(".ov-st-class").value,
            parent: tr.querySelector(".ov-st-parent").value,
            status: tr.querySelector(".ov-st-status").value,
          });
          toast(ok ? (typeof t === "function" ? t("toast.done") : "Saved") : (typeof t === "function" ? t("toast.failed") : "Failed"));
          btn.disabled = false;
          await loadAll();
          render();
        };
      });
    }
  };

  window.sendPartialReminder = async function (btn) {
    const tr = btn.closest("tr");
    const teacherId = tr.getAttribute("data-tid");
    const periodId = tr.getAttribute("data-pid");
    const subjectId = tr.getAttribute("data-sid");
    const teacherName = tr.cells[0].textContent;
    const periodLabel = tr.cells[2].textContent;
    if (btn._cooldown) return;
    btn._cooldown = true;
    btn.disabled = true;
    try {
      var adminPinUsed = false;
      try {
        adminPinUsed = localStorage.getItem("idara_push_is_admin") === "1";
      } catch (eAdm) {}
      const meta = {
        teacherId: teacherId,
        periodId: periodId,
        subjectId: subjectId,
        admin_pin_used: adminPinUsed,
      };
      const msg =
        typeof t === "function"
          ? t("ov.modal.reminderMsg", { name: teacherName, period: periodLabel })
          : "You sent a reminder to " + teacherName + " for " + periodLabel;
      const ins = await window.sbPost("notifications", {
        type: "manual_reminder",
        severity: "info",
        title: typeof t === "function" ? t("ov.modal.reminderTitle") : "Reminder sent",
        message: msg,
        teacher_id: teacherId,
        period_id: periodId,
        date: TODAY,
        metadata: meta,
      });
      if (!ins || !ins.ok) throw new Error(ins ? await ins.text() : "no response");
      const r2 = await window.invokeEdge("push_notify_admins", {
        title: "Idara reminder",
        body: "Reminder: " + teacherName + " / " + periodLabel,
      });
      if (!r2.ok) console.warn("push_notify_admins", await r2.text());
      toast(typeof t === "function" ? t("ov.modal.reminderLogged") : "Reminder logged");
    } catch (e) {
      toast((typeof t === "function" ? t("toast.failed") : "Error") + ": " + e.message);
    }
    setTimeout(function () {
      btn._cooldown = false;
      btn.disabled = false;
    }, 30000);
  };

  window.computePartialReportGaps = function (assignments, reportsToday, teachers, subjects, periods) {
    const partialUr = "\u062C\u0632\u0648\u06CC";
    const byKey = {};
    (reportsToday || []).forEach(function (r) {
      if (!r.teacher_id || !r.subject_id || r.period_id == null) return;
      const k = String(r.teacher_id) + "|" + String(r.subject_id) + "|" + String(r.period_id);
      byKey[k] = r;
    });
    const out = [];
    const seen = new Set();
    (assignments || []).forEach(function (a) {
      if (!a.teacher_id || !a.subject_id || a.period_id == null) return;
      const k = String(a.teacher_id) + "|" + String(a.subject_id) + "|" + String(a.period_id);
      if (seen.has(k)) return;
      seen.add(k);
      const r = byKey[k];
      if (r && r.complete === "\u06C1\u0627\u06BA") return;
      if (r && r.complete !== partialUr && r.complete) return;
      const tm = teachers.find(function (x) {
        return String(x.id) === String(a.teacher_id);
      });
      const su = subjects.find(function (x) {
        return String(x.id) === String(a.subject_id);
      });
      const per = periods.find(function (p) {
        return String(p.id) === String(a.period_id);
      });
      out.push({
        teacherId: a.teacher_id,
        subjectId: a.subject_id,
        periodId: a.period_id,
        teacherName: tm ? tm.name : a.teacher_id,
        subjectName: su ? su.name : a.subject_id,
        periodLabel: per ? per.start_time + "\u2013" + per.end_time : "P" + a.period_id,
        mode: r ? "partial" : "missing",
      });
    });
    return out;
  };

  var _rt;
  var _rtChannel;
  window.initNotifRealtimeOnce = function () {
    if (_rt || typeof supabase === "undefined" || !supabase.createClient) return;
    try {
      _rt = supabase.createClient(SB_URL, SB_KEY);
      _rtChannel = _rt
        .channel("idara-notifications")
        .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, function () {
          if (typeof window.reloadNotificationsOnly === "function") window.reloadNotificationsOnly();
        });
      _rtChannel.subscribe(function (status, err) {
        if (status === "SUBSCRIBED") {
          console.log("[Idara notifications] Realtime subscribed");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          console.warn("[Idara notifications] Realtime:", status, err || "");
        }
      });
    } catch (e) {
      console.warn("realtime", e);
    }
  };
})();
