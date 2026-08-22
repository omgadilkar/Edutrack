import { api } from './api.js';
import { renderAvatar, renderEmpty, renderRadialGauge, showToast } from './components.js';
import { renderTab } from './main.js';

let selectedClassId = null;

export function setTeacherSelectedClass(id) {
  selectedClassId = id;
}

export async function renderTeacherClasses(el) {
  const classes = await api('/classes');
  if (classes.length && !selectedClassId) selectedClassId = classes[0].id;
  
  el.innerHTML = `
    <div class="card">
      <h2><svg><use href="#icon-book"></use></svg> My Assigned Classes</h2>
      ${classes.length ? `
      <table>
        <thead><tr><th>Class Name</th><th>Subject</th><th>Schedule</th></tr></thead>
        <tbody>${classes.map(c => `<tr>
          <td style="font-weight: 500;">${c.name}</td>
          <td>${c.subject || '-'}</td>
          <td style="color: var(--text-muted);">${c.schedule || '-'}</td>
        </tr>`).join('')}</tbody>
      </table>
      ` : renderEmpty('No Classes', 'You have not been assigned any classes yet.')}
    </div>
  `;
}

function classSelector(classes) {
  return `<select onchange="setTeacherSelectedClass(this.value); renderTab()" style="margin-bottom: 24px; max-width: 300px;">
    ${classes.map(c => `<option value="${c.id}" ${c.id == selectedClassId ? 'selected' : ''}>${c.name}</option>`).join('')}
  </select>`;
}

export async function renderTeacherAttendance(el) {
  const classes = await api('/classes');
  if (!classes.length) { el.innerHTML = `<div class="card">${renderEmpty('No Classes', 'You have no classes to take attendance for.')}</div>`; return; }
  if (!selectedClassId) selectedClassId = classes[0].id;
  const students = await api(`/classes/${selectedClassId}/students`);
  const today = new Date().toISOString().slice(0, 10);
  const records = await api(`/attendance?class_id=${selectedClassId}&date=${today}`);
  const statusFor = (sid) => (records.find(r => r.student_id === sid) || {}).status || '';

  el.innerHTML = `
    <div class="card">
      <h2><svg><use href="#icon-users"></use></svg> Take Attendance — ${new Date().toLocaleDateString(undefined, {weekday:'long', month:'short', day:'numeric'})}</h2>
      ${classSelector(classes)}
      
      ${students.length ? `
      <table>
        <thead><tr><th>Student</th><th>Status</th></tr></thead>
        <tbody>
          ${students.map(s => `
            <tr>
              <td>
                <div style="display: flex; align-items: center; gap: 12px;">
                  ${renderAvatar(s.name)}
                  <div style="font-weight: 500;">${s.name}</div>
                </div>
              </td>
              <td>
                <select onchange="markAttendance(${s.id}, '${today}', this.value)" style="max-width: 150px;">
                  <option value="">-- Select --</option>
                  ${['present','absent','late','excused'].map(st => `<option value="${st}" ${statusFor(s.id) === st ? 'selected' : ''}>${st.charAt(0).toUpperCase() + st.slice(1)}</option>`).join('')}
                </select>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : renderEmpty('No Students', 'There are no students enrolled in this class.')}
    </div>
  `;
}

export async function markAttendance(student_id, date, status) {
  if (!status) return;
  await api('/attendance', { method: 'POST', body: { class_id: selectedClassId, student_id, date, status } });
  showToast('Attendance recorded');
}

export async function renderTeacherGrades(el) {
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
