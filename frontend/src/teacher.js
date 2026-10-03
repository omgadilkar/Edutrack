import { api } from './api.js';
import { renderAvatar, renderEmpty, renderRadialGauge, showToast } from './components.js';
import { renderTab } from './main.js';

let selectedClassId = null;

export function setSelectedClass(id) {
  selectedClassId = id;
  if (window.attendanceState) window.attendanceState.records = {};
}

window.setSelectedClass = setSelectedClass;

window.attendanceState = {
  selectedDate: new Date().toISOString().slice(0, 10),
  records: {}
};

function classSelector(classes) {
  return `<select onchange="setSelectedClass(this.value); renderTab()" style="margin-bottom: 24px; max-width: 300px;">
    ${classes.map(c => `<option value="${c.id}" ${c.id == selectedClassId ? 'selected' : ''}>${c.name}</option>`).join('')}
  </select>`;
}

// DASHBOARD
export async function renderTeacherDashboard(el) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [classes, students] = await Promise.all([
    api('/classes'), 
    api('/users?role=student')
  ]);
  
  // Calculate unique subjects
  const subjects = new Set(classes.map(c => c.subject).filter(Boolean));
  
  el.innerHTML = `
    <div style="margin-bottom: 24px;">
      <h1 style="font-size: 28px; margin-bottom: 4px;">Faculty Dashboard</h1>
      <p style="color: var(--text-muted); margin:0;">Manage your classes, attendance, and academics.</p>
    </div>
    
    <div class="grid-3" style="margin-bottom: 24px;">
      <div class="card" style="display: flex; flex-direction: column; justify-content: center;">
        <div style="color: var(--text-muted); font-size: 13px; margin-bottom: 8px;">Assigned Classes</div>
        <div style="font-size: 32px; font-weight: 700;">${classes.length}</div>
        <div style="color: var(--success); font-size: 12px; margin-top: 4px;">Active Semester</div>
      </div>
      <div class="card" style="display: flex; flex-direction: column; justify-content: center;">
        <div style="color: var(--text-muted); font-size: 13px; margin-bottom: 8px;">Unique Subjects</div>
        <div style="font-size: 32px; font-weight: 700;">${subjects.size}</div>
        <div style="color: var(--text-muted); font-size: 12px; margin-top: 4px;">Across all divisions</div>
      </div>
      <div class="card" style="display: flex; flex-direction: column; justify-content: center;">
        <div style="color: var(--text-muted); font-size: 13px; margin-bottom: 8px;">Total Students</div>
        <div style="font-size: 32px; font-weight: 700;">${students.length}</div>
        <div style="color: var(--primary); font-size: 12px; margin-top: 4px; cursor: pointer;" onclick="switchTab('students')">View Directory &rarr;</div>
      </div>
    </div>
    
    <div class="grid-2">
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h2 style="margin: 0;"><svg><use href="#icon-calendar"></use></svg> Today's Timetable</h2>
          </div>
          <div class="task-item">
            <div>
              <div class="title">Grade 10 - Physics (A)</div>
              <div class="meta">10:00 AM - 11:00 AM • Room 302</div>
            </div>
            <button class="secondary" onclick="switchTab('attendance')" style="padding: 4px 12px; font-size: 12px;">Attendance</button>
          </div>
          <div class="task-item">
            <div>
              <div class="title">Grade 11 - Advanced Math</div>
              <div class="meta">11:30 AM - 12:30 PM • Room 405</div>
            </div>
            <button class="secondary" onclick="switchTab('attendance')" style="padding: 4px 12px; font-size: 12px;">Attendance</button>
          </div>
          <div class="task-item" style="border-left: 3px solid var(--warning);">
            <div>
              <div class="title">Faculty Meeting (Demo)</div>
              <div class="meta">2:00 PM - 3:00 PM • Staff Room</div>
            </div>
          </div>
        </div>
        
        <div class="card">
          <h2><svg><use href="#icon-chart"></use></svg> Pending Marks Entry (Demo)</h2>
          <div class="activity-list">
            <div class="activity-item">
              <div class="dot" style="background: var(--danger);"></div>
              <div class="content">
                <p><strong>Grade 10 Midterms</strong> pending for 15 students.</p>
                <button class="secondary" onclick="switchTab('grades')" style="padding: 4px 8px; font-size: 11px; margin-top: 4px;">Enter Marks</button>
              </div>
            </div>
            <div class="activity-item">
              <div class="dot" style="background: var(--warning);"></div>
              <div class="content">
                <p><strong>Weekly Quiz</strong> needs grading for Grade 9.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <div class="card">
          <h2><svg><use href="#icon-bell"></use></svg> Notice Board (Demo)</h2>
          <div class="activity-list">
            <div class="activity-item">
              <div class="dot" style="background: var(--primary);"></div>
              <div class="content">
                <p><strong>Exam Schedule Released:</strong> Final exams begin next month.</p>
                <time>2 hours ago</time>
              </div>
            </div>
            <div class="activity-item">
              <div class="dot" style="background: var(--success);"></div>
              <div class="content">
                <p><strong>System Maintenance:</strong> ERP will be down at midnight.</p>
                <time>Yesterday</time>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card">
          <h2><svg><use href="#icon-check"></use></svg> Upcoming Examinations (Demo)</h2>
          <div class="task-item">
            <div>
              <div class="title">Physics Practical</div>
              <div class="meta">Grade 12 • Oct 15th</div>
            </div>
            <span class="status-badge pending">Upcoming</span>
          </div>
          <div class="task-item">
            <div>
              <div class="title">Math Final</div>
              <div class="meta">Grade 10 • Oct 18th</div>
            </div>
            <span class="status-badge pending">Upcoming</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// CLASSES
export async function renderClasses(el) {
  const [classes, students] = await Promise.all([
    api('/classes'), 
    api('/users?role=student')
  ]);
  el.innerHTML = `
    <div class="grid-2">
      <div style="display: flex; flex-direction: column; gap: 24px; align-self: start;">
        <div class="card">
          <h2><svg><use href="#icon-plus"></use></svg> Create Class</h2>
          <div class="form-row full">
            <input id="nc-name" placeholder="Class name (e.g. Grade 9 - A)" />
          </div>
          <div class="form-row full">
            <input id="nc-subject" placeholder="Subject" />
          </div>
          <div class="form-row">
            <select id="nc-schedule-day" style="flex: 2;">
              <option value="Mon/Wed">Mon/Wed</option>
              <option value="Tue/Thu">Tue/Thu</option>
              <option value="Mon/Wed/Fri">Mon/Wed/Fri</option>
              <option value="Everyday">Everyday</option>
            </select>
            <input id="nc-schedule-time" type="time" style="flex: 1;" value="10:00" />
          </div>
          <button onclick="createClass()" style="width:100%;">Create Class</button>
          <div class="error-msg" id="nc-error"></div>
        </div>

        <div class="card">
          <h2><svg><use href="#icon-users"></use></svg> Enroll Student</h2>
          <div class="form-row full">
            <select id="es-student">
              <option value="">-- Select Student --</option>
              ${students.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-row full">
            <select id="es-class">
              <option value="">-- Select Class --</option>
              ${classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>
          <button onclick="enrollStudent()" style="width:100%;">Enroll Student</button>
          <div class="error-msg" id="es-error"></div>
        </div>
      </div>
      
      <div class="card" style="overflow-x: auto;">
        <h2><svg><use href="#icon-book"></use></svg> Class Directory</h2>
        ${classes.length ? `
        <table>
          <thead><tr><th>Class</th><th>Schedule</th><th>Enrolled</th></tr></thead>
          <tbody>
            ${classes.map(c => `<tr>
              <td>
                <div style="font-weight: 500;">${c.name}</div>
                <div style="font-size: 12px; color: var(--text-muted);">${c.subject || '-'}</div>
              </td>
              <td><span style="font-size: 13px; color: var(--text-muted);">${c.schedule || '-'}</span></td>
              <td><span style="font-weight: 600;">${c.enrolled_count || 0}</span> <span style="color: var(--text-muted); font-size: 13px;">students</span></td>
            </tr>`).join('')}
          </tbody>
        </table>
        ` : renderEmpty('No Classes', 'Create a class to get started.')}
      </div>
    </div>
  `;
}

export async function createClass() {
  const name = document.getElementById('nc-name').value;
  const subject = document.getElementById('nc-subject').value;
  
  const rawTime = document.getElementById('nc-schedule-time').value;
  let formattedTime = '';
  if (rawTime) {
    const [h, m] = rawTime.split(':');
    const hr = parseInt(h, 10);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const hour12 = hr % 12 || 12;
    formattedTime = `${hour12}:${m} ${ampm}`;
  }
  const schedule = document.getElementById('nc-schedule-day').value + ' ' + formattedTime;
  
  const errEl = document.getElementById('nc-error');
  try {
    await api('/classes', { method: 'POST', body: { name, subject, schedule } });
    showToast('Class created');
    renderTab();
  } catch (err) {
    errEl.textContent = err.message;
  }
}

export async function enrollStudent() {
  const student_id = document.getElementById('es-student').value;
  const class_id = document.getElementById('es-class').value;
  const errEl = document.getElementById('es-error');
  if (!student_id || !class_id) {
    errEl.textContent = 'Please select a student and a class.';
    return;
  }
  try {
    await api(`/classes/${class_id}/enroll`, { method: 'POST', body: { student_id } });
    showToast('Student enrolled');
    renderTab();
  } catch (err) {
    errEl.textContent = err.message;
  }
}

// ATTENDANCE
export function setAttendanceDate(date) {
  window.attendanceState.selectedDate = date;
  window.attendanceState.records = {};
  renderTab();
}
window.setAttendanceDate = setAttendanceDate;

export function toggleAttendance(studentId, status) {
  window.attendanceState.records[studentId] = status;
  renderTab();
}
window.toggleAttendance = toggleAttendance;

export async function submitBulkAttendance() {
  const records = Object.keys(window.attendanceState.records).map(id => ({
    student_id: parseInt(id, 10),
    status: window.attendanceState.records[id]
  }));
  
  if (!records.length) return;
  
  try {
    await api('/attendance/bulk', {
      method: 'POST',
      body: {
        class_id: selectedClassId,
        date: window.attendanceState.selectedDate,
        records
      }
    });
    showToast('Attendance submitted successfully');
  } catch(err) {
    alert(err.message);
  }
}
window.submitBulkAttendance = submitBulkAttendance;

export async function renderAttendance(el) {
  const classes = await api('/classes');
  if (!classes.length) { el.innerHTML = `<div class="card">${renderEmpty('No Classes', 'You have no classes to take attendance for.')}</div>`; return; }
  if (!selectedClassId) selectedClassId = classes[0].id;
  
  const students = await api(`/classes/${selectedClassId}/students`);
  const date = window.attendanceState.selectedDate;
  const existingRecords = await api(`/attendance?class_id=${selectedClassId}&date=${date}`);
  
  const getStatus = (sid) => {
    if (window.attendanceState.records[sid]) return window.attendanceState.records[sid];
    const ex = existingRecords.find(r => r.student_id === sid);
    return ex ? ex.status : 'present';
  };
  
  const counts = { present: 0, absent: 0, late: 0, excused: 0 };
  
  students.forEach(s => {
    const status = getStatus(s.id);
    if (!window.attendanceState.records[s.id]) window.attendanceState.records[s.id] = status;
    counts[status] = (counts[status] || 0) + 1;
  });

  el.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 24px;">
      <div>
        <h2 style="font-size: 28px; margin-bottom: 4px;">Class Attendance</h2>
        <p style="color: var(--text-muted); margin:0;">Mark daily attendance for your students</p>
      </div>
      <div style="display:flex; gap:24px; background:var(--card-bg); padding:12px 24px; border-radius:12px; border:1px solid var(--border-color);">
        <div style="text-align:center;">
          <div style="font-size:24px; font-weight:bold; color:var(--primary);">${counts.present}</div>
          <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Present</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:24px; font-weight:bold; color:var(--danger);">${counts.absent}</div>
          <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Absent</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:24px; font-weight:bold; color:var(--warning);">${counts.late}</div>
          <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Late</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:24px; font-weight:bold; color:var(--primary-light);">${counts.excused}</div>
          <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Excused</div>
        </div>
      </div>
    </div>
    
    <div class="card" style="margin-bottom: 24px; padding: 16px 24px;">
      <div class="filter-bar" style="display:flex; gap:16px; align-items:center; flex-wrap:wrap;">
        <div>
          <label style="display:block; font-size:12px; color:var(--text-muted); margin-bottom:4px;">Select Class</label>
          <select onchange="setSelectedClass(this.value); renderTab()" style="padding: 8px; border-radius: 6px;">
            ${classes.map(c => `<option value="${c.id}" ${c.id == selectedClassId ? 'selected' : ''}>${c.name} (${c.subject || 'No Subject'})</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="display:block; font-size:12px; color:var(--text-muted); margin-bottom:4px;">Date</label>
          <input type="date" value="${date}" onchange="setAttendanceDate(this.value)" style="padding: 8px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-color);" />
        </div>
        <div style="margin-left:auto;">
          <button onclick="submitBulkAttendance()"><svg><use href="#icon-check"></use></svg> Submit Attendance</button>
        </div>
      </div>
    </div>
    
    <div class="card" style="padding:0; overflow-x:auto;">
      ${students.length ? `
      <table style="margin:0;">
        <thead><tr><th>Student</th><th>Status Options</th></tr></thead>
        <tbody>
          ${students.map(s => {
            const st = getStatus(s.id);
            return `
            <tr>
              <td>
                <div style="display: flex; align-items: center; gap: 12px;">
                  ${renderAvatar(s.name)}
                  <div>
                    <div style="font-weight: 500;">${s.name}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">${s.email}</div>
                  </div>
                </div>
              </td>
              <td>
                <div style="display:flex; gap:8px;">
                  <button class="${st === 'present' ? 'primary' : 'secondary'}" style="padding: 4px 12px; font-size:13px;" onclick="toggleAttendance(${s.id}, 'present')">Present</button>
                  <button class="${st === 'absent' ? 'primary' : 'secondary'}" style="padding: 4px 12px; font-size:13px; background:${st === 'absent' ? 'var(--danger)' : ''};" onclick="toggleAttendance(${s.id}, 'absent')">Absent</button>
                  <button class="${st === 'late' ? 'primary' : 'secondary'}" style="padding: 4px 12px; font-size:13px; background:${st === 'late' ? 'var(--warning)' : ''};" onclick="toggleAttendance(${s.id}, 'late')">Late</button>
                  <button class="${st === 'excused' ? 'primary' : 'secondary'}" style="padding: 4px 12px; font-size:13px; background:${st === 'excused' ? 'var(--primary-light)' : ''}; border-color:${st === 'excused' ? 'var(--primary)' : ''};" onclick="toggleAttendance(${s.id}, 'excused')">Excused</button>
                </div>
              </td>
            </tr>
          `}).join('')}
        </tbody>
      </table>
      ` : renderEmpty('No Students', 'There are no students enrolled in this class.')}
    </div>
  `;
}

// GRADES
export async function renderGrades(el) {
  const classes = await api('/classes');
  if (!classes.length) { el.innerHTML = `<div class="card">${renderEmpty('No Classes', 'You have no classes to grade.')}</div>`; return; }
  if (!selectedClassId) selectedClassId = classes[0].id;
  const [students, grades] = await Promise.all([
    api(`/classes/${selectedClassId}/students`),
    api(`/grades?class_id=${selectedClassId}`),
  ]);

  el.innerHTML = `
    <div class="grid-2">
      <div class="card" style="align-self: start;">
        <h2><svg><use href="#icon-plus"></use></svg> Add Grade</h2>
        ${classSelector(classes)}
        <div class="form-row full">
          <select id="ng-student">
            ${students.length ? students.map(s => `<option value="${s.id}">${s.name}</option>`).join('') : '<option value="">-- No students --</option>'}
          </select>
        </div>
        <div class="form-row full">
          <input id="ng-assignment" placeholder="Assignment Name (e.g. Midterm)" />
        </div>
        <div class="form-row">
          <input id="ng-score" type="number" placeholder="Score Obtained" />
          <input id="ng-max" type="number" placeholder="Maximum Score" value="100" />
        </div>
        <button onclick="addGrade()" style="width: 100%;" ${!students.length ? 'disabled' : ''}>Save Grade</button>
        <div class="error-msg" id="ng-error"></div>
      </div>
      
      <div class="card" style="overflow-x: auto;">
        <h2><svg><use href="#icon-chart"></use></svg> Recent Grades</h2>
        ${grades.length ? `
        <table>
          <thead><tr><th>Student</th><th>Assignment</th><th style="text-align: right;">Score</th></tr></thead>
          <tbody>${grades.map(g => `<tr>
            <td>
              <div style="font-weight: 500;">${g.student_name}</div>
            </td>
            <td style="color: var(--text-muted);">${g.assignment_name}</td>
            <td style="display: flex; justify-content: flex-end;">${renderRadialGauge(g.score, g.max_score)}</td>
          </tr>`).join('')}</tbody>
        </table>
        ` : renderEmpty('No Grades', 'No grades have been added yet.')}
      </div>
    </div>
  `;
}

export async function addGrade() {
  const student_id = document.getElementById('ng-student').value;
  const assignment_name = document.getElementById('ng-assignment').value;
  const score = parseFloat(document.getElementById('ng-score').value);
  const max_score = parseFloat(document.getElementById('ng-max').value) || 100;
  const errEl = document.getElementById('ng-error');
  if (!student_id || !assignment_name || isNaN(score)) {
    errEl.textContent = 'Please fill out all fields.';
    return;
  }
  try {
    await api('/grades', { method: 'POST', body: { class_id: selectedClassId, student_id, assignment_name, score, max_score } });
    showToast('Grade added');
    renderTab();
  } catch (err) {
    errEl.textContent = err.message;
  }
}

window.createClass = createClass;
window.enrollStudent = enrollStudent;
window.addGrade = addGrade;
