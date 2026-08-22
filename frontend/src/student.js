import { api } from './api.js';
import { renderEmpty, renderRadialGauge } from './components.js';

export async function renderStudentAttendance(el) {
  const records = await api('/attendance/mine');
  
  // Group by class
  const byClass = {};
  records.forEach(r => {
    if (!byClass[r.class_name]) byClass[r.class_name] = [];
    byClass[r.class_name].push(r);
  });
  
  const classCards = Object.keys(byClass).map(className => {
    const classRecords = byClass[className].sort((a,b) => new Date(a.date) - new Date(b.date));
    return `
      <div class="card">
        <h2>${className}</h2>
        <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;">Attendance History Heatmap</div>
        <div class="heatmap">
          ${classRecords.map(r => `<div class="heatmap-cell ${r.status}" title="${r.date}: ${r.status}"></div>`).join('')}
        </div>
      </div>
    `;
  }).join('');

  el.innerHTML = `
    <div class="card" style="margin-bottom: 24px;">
      <h2><svg><use href="#icon-chart"></use></svg> My Attendance Records</h2>
      ${records.length ? `
      <table>
        <thead><tr><th>Date</th><th>Class</th><th>Status</th></tr></thead>
        <tbody>${records.sort((a,b) => new Date(b.date) - new Date(a.date)).map(r => `<tr>
          <td style="color: var(--text-muted);">${r.date}</td>
          <td style="font-weight: 500;">${r.class_name}</td>
          <td><span class="badge ${r.status}">${r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span></td>
        </tr>`).join('')}</tbody>
      </table>
      ` : renderEmpty('No Records', 'You do not have any attendance records yet.')}
    </div>
    
    ${records.length ? `
    <h3 style="margin-top: 32px; margin-bottom: 16px;">Attendance Insights</h3>
    <div class="grid-3">
      ${classCards}
    </div>
    ` : ''}
  `;
}

export async function renderStudentGrades(el) {
  const records = await api('/grades/mine');
  
  el.innerHTML = `
    <div class="card">
      <h2><svg><use href="#icon-book"></use></svg> My Grades</h2>
      ${records.length ? `
      <table>
        <thead><tr><th>Class</th><th>Assignment</th><th style="text-align: right;">Score</th></tr></thead>
        <tbody>${records.map(r => `<tr>
          <td style="font-weight: 500;">${r.class_name}</td>
          <td style="color: var(--text-muted);">${r.assignment_name}</td>
          <td style="display: flex; justify-content: flex-end;">
            ${renderRadialGauge(r.score, r.max_score)}
          </td>
        </tr>`).join('')}</tbody>
      </table>
      ` : renderEmpty('No Grades', 'No grades have been posted for you yet.')}
    </div>
  `;
}
