import { api } from './api.js';

export async function renderStudentDashboard(el) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Fetch their attendance to calculate overall percentage
  let overallPercentage = 100;
  try {
    const attendance = await api(`/attendance/student/${user.id}`);
    if (attendance && attendance.length > 0) {
      const present = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
      overallPercentage = Math.round((present / attendance.length) * 100);
    } else {
      overallPercentage = 'N/A';
    }
  } catch (err) {
    console.error(err);
  }

  el.innerHTML = `
    <div style="margin-bottom: 24px;">
      <h1 style="font-size: 28px; margin-bottom: 4px;">Welcome back, ${user.name}</h1>
      <p style="color: var(--text-muted); margin:0;">Here's your academic overview for today.</p>
    </div>
    
    <div class="grid-3" style="margin-bottom: 24px;">
      <div class="card" style="display: flex; flex-direction: column; justify-content: center;">
        <div style="color: var(--text-muted); font-size: 13px; margin-bottom: 8px;">Overall Attendance</div>
        <div style="font-size: 32px; font-weight: 700; color: ${overallPercentage >= 75 ? 'var(--success)' : 'var(--danger)'}">${overallPercentage}${overallPercentage !== 'N/A' ? '%' : ''}</div>
        <div style="color: var(--text-muted); font-size: 12px; margin-top: 4px;">Current Semester</div>
      </div>
      <div class="card" style="display: flex; flex-direction: column; justify-content: center;">
        <div style="color: var(--text-muted); font-size: 13px; margin-bottom: 8px;">Upcoming Exams</div>
        <div style="font-size: 32px; font-weight: 700;">2</div>
        <div style="color: var(--warning); font-size: 12px; margin-top: 4px;">Next: Physics Practical</div>
      </div>
      <div class="card" style="display: flex; flex-direction: column; justify-content: center;">
        <div style="color: var(--text-muted); font-size: 13px; margin-bottom: 8px;">Pending Fees</div>
        <div style="font-size: 32px; font-weight: 700;">$0</div>
        <div style="color: var(--success); font-size: 12px; margin-top: 4px;">All cleared</div>
      </div>
    </div>
    
    <div class="grid-2">
      <div class="card">
        <h2><svg><use href="#icon-bell"></use></svg> Notices & Announcements</h2>
        <div class="activity-list">
          <div class="activity-item">
            <div class="dot" style="background: var(--primary);"></div>
            <div class="content">
              <p><strong>Holiday Notice:</strong> College will be closed on Friday for state holiday.</p>
              <time>Today</time>
            </div>
          </div>
          <div class="activity-item">
            <div class="dot" style="background: var(--success);"></div>
            <div class="content">
              <p><strong>Exam Schedule:</strong> Final timetables have been released in the portal.</p>
              <time>2 days ago</time>
            </div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <h2><svg><use href="#icon-calendar"></use></svg> Quick Access</h2>
        <div style="display:flex; flex-direction:column; gap:12px;">
          <button class="secondary" onclick="switchTab('attendance')" style="justify-content: flex-start; padding: 12px;">
            <svg><use href="#icon-check"></use></svg> View Detailed Attendance
          </button>
          <button class="secondary" style="justify-content: flex-start; padding: 12px; opacity: 0.6; cursor: not-allowed;" disabled>
            <svg><use href="#icon-chart"></use></svg> View Results (Not Available)
          </button>
        </div>
      </div>
    </div>
  `;
}

export async function renderStudentAttendance(el) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  let records = [];
  try {
    records = await api(`/attendance/student/${user.id}`);
  } catch(err) {
    el.innerHTML = `<div class="card"><div class="error-msg">${err.message}</div></div>`;
    return;
  }
  
  if (records.length === 0) {
    el.innerHTML = `
      <div class="card" style="text-align:center; padding: 48px;">
        <svg style="width:48px; height:48px; fill:var(--text-muted); margin-bottom:16px;"><use href="#icon-check"></use></svg>
        <h3>No Attendance Records Found</h3>
        <p style="color:var(--text-muted);">Your teachers have not marked any attendance yet.</p>
      </div>
    `;
    return;
  }

  // Calculate subject-wise
  const subjects = {};
  for (const r of records) {
    if (!subjects[r.subject]) {
      subjects[r.subject] = { total: 0, present: 0 };
    }
    subjects[r.subject].total++;
    if (r.status === 'present' || r.status === 'late') subjects[r.subject].present++;
  }
  
  const presentTotal = records.filter(a => a.status === 'present' || a.status === 'late').length;
  const overallPercentage = Math.round((presentTotal / records.length) * 100);
  
  const subjectCards = Object.keys(subjects).map(sub => {
    const data = subjects[sub];
    const pct = Math.round((data.present / data.total) * 100);
    const color = pct >= 75 ? 'var(--success)' : 'var(--danger)';
    return `
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">
          <div>
            <h3 style="margin:0 0 4px 0;">${sub || 'General'}</h3>
            <p style="margin:0; font-size:12px; color:var(--text-muted);">${data.present} / ${data.total} Classes</p>
          </div>
          <div style="font-size:24px; font-weight:bold; color:${color}">${pct}%</div>
        </div>
        <div style="width:100%; height:8px; background:var(--border-color); border-radius:4px; overflow:hidden;">
          <div style="width:${pct}%; height:100%; background:${color}; border-radius:4px;"></div>
        </div>
      </div>
    `;
  }).join('');

  const historyRows = records.map(r => `
    <tr>
      <td>${new Date(r.date).toLocaleDateString()}</td>
      <td>${r.subject || 'General'}</td>
      <td>${r.class_name}</td>
      <td>
        <span class="status-badge ${r.status}">${r.status}</span>
      </td>
      <td>${r.teacher_name}</td>
    </tr>
  `).join('');

  el.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">
      <h1 style="font-size: 24px; margin:0;">My Attendance</h1>
      <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:12px; padding: 12px 24px;">
        <div style="font-size:12px; color:var(--text-muted);">Overall Percentage</div>
        <div style="font-size:24px; font-weight:bold; color:${overallPercentage >= 75 ? 'var(--success)' : 'var(--danger)'}">${overallPercentage}%</div>
      </div>
    </div>
    
    <div class="grid-3" style="margin-bottom: 24px;">
      ${subjectCards}
    </div>
    
    <div class="card">
      <h3 style="margin-top:0;">Recent History</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Subject</th>
            <th>Class</th>
            <th>Status</th>
            <th>Teacher</th>
          </tr>
        </thead>
        <tbody>
          ${historyRows}
        </tbody>
      </table>
    </div>
  `;
}
