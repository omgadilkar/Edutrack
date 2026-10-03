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
    <div class="page-header">
      <div>
        <h1>Welcome back, ${user.name}</h1>
        <p>Here's your academic overview for today.</p>
      </div>
    </div>
    
    <div class="grid-3" style="margin-bottom: 24px;">
      <div class="card kpi-card">
        <div class="kpi-title">Overall Attendance</div>
        <div class="kpi-value" style="color: ${overallPercentage >= 75 ? 'var(--success)' : 'var(--danger)'}">${overallPercentage}${overallPercentage !== 'N/A' ? '%' : ''}</div>
        <div class="kpi-meta neutral">Current Semester</div>
      </div>
      <div class="card kpi-card">
        <div class="kpi-title">Upcoming Exams</div>
        <div class="kpi-value">2</div>
        <div class="kpi-meta warning">Next: Physics Practical</div>
      </div>
      <div class="card kpi-card">
        <div class="kpi-title">Pending Fees</div>
        <div class="kpi-value">$0</div>
        <div class="kpi-meta success">All cleared</div>
      </div>
    </div>
    
    <div class="grid-2">
      <div class="card">
        <h2><svg><use href="#icon-bell"></use></svg> Notices & Announcements</h2>
        <div class="activity-list" style="margin-top: 16px;">
          <div class="activity-item">
            <div class="dot" style="background: var(--info);"></div>
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
        <div style="display:flex; flex-direction:column; gap:12px; margin-top: 16px;">
          <button class="secondary" onclick="switchTab('attendance')" style="justify-content: flex-start; height: 48px;">
            <svg><use href="#icon-check"></use></svg> View Detailed Attendance
          </button>
          <button class="secondary" style="justify-content: flex-start; height: 48px;" disabled>
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
      <div class="card empty-state">
        <svg><use href="#icon-check"></use></svg>
        <h3>No Attendance Records Found</h3>
        <p>Your teachers have not marked any attendance yet.</p>
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
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 14px; margin-bottom: 4px;">${sub || 'General'}</h3>
            <p style="margin:0; font-size:12px; color:var(--text-muted);">${data.present} / ${data.total} Classes</p>
          </div>
          <div style="font-size:20px; font-weight:600; color:${color}">${pct}%</div>
        </div>
        <div style="width:100%; height:6px; background:var(--border); border-radius:3px; overflow:hidden;">
          <div style="width:${pct}%; height:100%; background:${color}; border-radius:3px;"></div>
        </div>
      </div>
    `;
  }).join('');

  const historyRows = records.map(r => `
    <tr>
      <td>${new Date(r.date).toLocaleDateString()}</td>
      <td><div style="font-weight: 500;">${r.subject || 'General'}</div></td>
      <td style="color: var(--text-muted);">${r.class_name}</td>
      <td>
        <span class="badge ${r.status === 'present' ? 'success' : (r.status === 'absent' ? 'danger' : 'warning')}">${r.status}</span>
      </td>
      <td style="color: var(--text-muted);">${r.teacher_name}</td>
    </tr>
  `).join('');

  el.innerHTML = `
    <div class="page-header">
      <div>
        <h1>My Attendance</h1>
        <p>View your class attendance records</p>
      </div>
      <div style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-md); padding: 12px 24px; box-shadow: var(--shadow-sm); text-align: right;">
        <div style="font-size:11px; color:var(--text-muted); font-weight: 500;">Overall Percentage</div>
        <div style="font-size:24px; font-weight:600; color:${overallPercentage >= 75 ? 'var(--success)' : 'var(--danger)'}; line-height: 1.2;">${overallPercentage}%</div>
      </div>
    </div>
    
    <div class="grid-4" style="margin-bottom: 24px;">
      ${subjectCards}
    </div>
    
    <div class="card" style="padding: 0; overflow: hidden;">
      <h3 style="padding: 24px; margin: 0; border-bottom: 1px solid var(--border);">Recent History</h3>
      <div class="table-container">
        <table>
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
    </div>
  `;
}
