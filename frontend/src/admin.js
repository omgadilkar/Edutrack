import { api } from './api.js';
import { renderAvatar, renderEmpty } from './components.js';
import Chart from 'chart.js/auto';
import { renderTab, switchTab, activeTab } from './main.js';
import { showToast } from './components.js';

let allStudents = [];
let searchQuery = '';
let currentFilters = { dept: '', course: '', status: '' };
let currentPage = 1;
const ITEMS_PER_PAGE = 10;
let sortCol = 'name';
let sortDesc = false;
let viewingProfileId = null;

export async function handleGlobalSearch() {
  const el = document.getElementById('global-search-input');
  if (!el) return;
  searchQuery = el.value.toLowerCase();
  currentPage = 1;
  
  if (activeTab !== 'students') {
    switchTab('students');
  } else {
    const container = document.getElementById('main-container');
    if (container) renderAdminStudents(container, true);
  }
}

export function setPage(p) { currentPage = p; renderAdminStudents(document.getElementById('main-container'), true); }
export function setSort(col) {
  if (sortCol === col) sortDesc = !sortDesc;
  else { sortCol = col; sortDesc = false; }
  renderAdminStudents(document.getElementById('main-container'), true);
}
export function updateFilters() {
  currentFilters.dept = document.getElementById('filter-dept')?.value || '';
  currentFilters.course = document.getElementById('filter-course')?.value || '';
  currentFilters.status = document.getElementById('filter-status')?.value || '';
  currentPage = 1;
  renderAdminStudents(document.getElementById('main-container'), true);
}
export function openModal(id) { document.getElementById(id).classList.add('open'); }
export function closeModal(id) { document.getElementById(id).classList.remove('open'); }
export function viewProfile(id) {
  viewingProfileId = id;
  renderAdminStudents(document.getElementById('main-container'), true);
}
export function closeProfile() {
  viewingProfileId = null;
  renderAdminStudents(document.getElementById('main-container'), true);
}

export async function renderAdminDashboard(el) {
  // Fetch real data for accurate counts
  const users = await api('/users');
  const studentsCount = users.filter(u => u.role === 'student').length;
  const teachersCount = users.filter(u => u.role === 'teacher').length;

  el.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 24px;">
      <div>
        <h2 style="font-size: 28px; margin-bottom: 4px;">Overview</h2>
        <p style="color: var(--text-muted); margin:0;">Monitor your institution's key metrics</p>
      </div>
      <div style="display:flex; gap:12px;">
        <button class="secondary" onclick="openModal('add-notice-modal')"><svg><use href="#icon-plus"></use></svg> Add Notice</button>
        <button onclick="downloadCSVReport()"><svg><use href="#icon-chart"></use></svg> Generate Report</button>
      </div>
    </div>

    <div class="grid-2" style="margin-bottom: 24px;">
      <div class="card stat-card">
        <div class="info">
          <h3>Total Users (Students/Teachers)</h3>
          <p>${users.filter(u => u.role !== 'admin').length}</p>
        </div>
        <div class="icon"><svg><use href="#icon-users"></use></svg></div>
      </div>
      <div class="card stat-card">
        <div class="info">
          <h3>Active Teachers</h3>
          <p>${teachersCount}</p>
        </div>
        <div class="icon"><svg><use href="#icon-book"></use></svg></div>
      </div>
    </div>

    <div class="grid-2" style="margin-bottom: 24px;">
      <div class="card">
        <h2><svg><use href="#icon-chart"></use></svg> User Demographics</h2>
        <div style="position: relative; height: 300px; width: 100%; display: flex; justify-content: center; align-items: center;">
          <canvas id="admin-users-chart"></canvas>
        </div>
      </div>
      <div class="card">
        <h2><svg><use href="#icon-book"></use></svg> Important Notices</h2>
        <div class="activity-list" id="admin-notices-list">
          <div class="skeleton" style="height:40px;"></div>
        </div>
      </div>
    </div>

    <div id="add-notice-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Create Notice</h2>
          <button class="icon-only" onclick="closeModal('add-notice-modal')"><svg><use href="#icon-close"></use></svg></button>
        </div>
        <div class="form-row full">
          <label>Title</label>
          <input id="nn-title" placeholder="e.g. Campus closed tomorrow" />
        </div>
        <div class="form-row full">
          <label>Content</label>
          <textarea id="nn-content" placeholder="Full notice details..." style="width:100%; min-height:80px; padding:12px; border-radius:6px; border:1px solid var(--border-color); background:var(--input-bg); color:var(--text-color); resize:vertical;"></textarea>
        </div>
        <div class="form-row full">
          <label>Priority Color</label>
          <select id="nn-type">
            <option value="primary">Normal (Blue)</option>
            <option value="success">Good News (Green)</option>
            <option value="warning">Warning (Orange)</option>
            <option value="danger">Urgent (Red)</option>
          </select>
        </div>
        <div class="error-msg hidden" id="nn-error"></div>
        <div class="modal-footer">
          <button class="secondary" onclick="closeModal('add-notice-modal')">Cancel</button>
          <button onclick="createNotice()">Publish Notice</button>
        </div>
      </div>
    </div>
  `;
  
  // Render Chart
  setTimeout(() => {
    const ctx = document.getElementById('admin-users-chart');
    if (ctx) {
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Students', 'Teachers'],
          datasets: [{
            data: [studentsCount, teachersCount],
            backgroundColor: ['#6366f1', '#10b981'],
            borderWidth: 0,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: { 
              position: 'bottom',
              labels: {
                color: document.body.classList.contains('theme-dark') ? '#e2e8f0' : '#475569',
                font: { family: 'Inter', size: 14 }
              }
            }
          }
        }
      });
    }
  }, 0);

  // Fetch and render notices asynchronously
  api('/notices').then(notices => {
    const listEl = document.getElementById('admin-notices-list');
    if (!listEl) return;
    if (notices.length === 0) {
      listEl.innerHTML = '<div class="activity-item"><div class="content"><p>No recent notices.</p></div></div>';
      return;
    }
    listEl.innerHTML = notices.map(n => `
      <div class="activity-item" style="position:relative;">
        <div class="dot" style="background: var(--${n.type || 'primary'});"></div>
        <div class="content" style="padding-right:32px;">
          <p><strong>${n.title}:</strong> ${n.content}</p>
          <time>${new Date(n.created_at).toLocaleDateString()} • ${n.author_name}</time>
        </div>
        <button class="icon-only danger" onclick="deleteNotice(${n.id})" style="position:absolute; right:0; top:0; background:transparent; border:none; opacity:0.5; padding:4px;"><svg width="14" height="14"><use href="#icon-close"></use></svg></button>
      </div>
    `).join('');
  }).catch(() => {
    document.getElementById('admin-notices-list').innerHTML = '<div class="error-msg">Failed to load notices</div>';
  });
}

export async function createNotice() {
  const title = document.getElementById('nn-title').value;
  const content = document.getElementById('nn-content').value;
  const type = document.getElementById('nn-type').value;
  const errEl = document.getElementById('nn-error');
  errEl.classList.add('hidden');
  
  if (!title || !content) {
    errEl.textContent = "Title and content are required.";
    errEl.classList.remove('hidden');
    return;
  }
  
  try {
    await api('/notices', { method: 'POST', body: { title, content, type } });
    showToast('Notice published successfully');
    closeModal('add-notice-modal');
    renderTab();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  }
}

window.createNotice = createNotice;

export async function deleteNotice(id) {
  if (!confirm('Are you sure you want to delete this notice?')) return;
  try {
    await api('/notices/' + id, { method: 'DELETE' });
    showToast('Notice deleted');
    renderTab();
  } catch (err) {
    alert(err.message);
  }
}

window.deleteNotice = deleteNotice;

export async function downloadCSVReport() {
  try {
    const users = await api('/users');
    const students = users.filter(u => u.role === 'student');
    
    if (students.length === 0) {
      showToast('No students available to generate report');
      return;
    }

    // Generate CSV Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Name,Email,Roll Number,Phone\n";

    // Generate CSV Rows
    students.forEach(s => {
      csvContent += `${s.id},"${s.name}","${s.email}","${s.student_number || 'N/A'}","${s.phone || 'N/A'}"\n`;
    });

    // Trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `student_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
    showToast('Report downloaded successfully!');
  } catch (err) {
    showToast('Failed to generate report');
  }
}
window.downloadCSVReport = downloadCSVReport;

export async function renderAdminStudents(el, skipFetch = false) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  if (!skipFetch) {
    const users = await api('/users');
    allStudents = users.filter(u => u.role !== 'admin');
  }

  if (viewingProfileId) {
    const student = allStudents.find(s => s.id === viewingProfileId);
    if (!student) return closeProfile();
    
    el.innerHTML = `
      <div style="margin-bottom: 24px;">
        <button class="secondary" onclick="closeProfile()"><svg><use href="#icon-menu"></use></svg> Back to Directory</button>
      </div>
      <div class="profile-header">
        ${renderAvatar(student.name)}
        <div class="profile-info">
          <h1>${student.name}</h1>
          <div class="meta">
            <div><svg><use href="#icon-users"></use></svg> ${student.student_number || 'No Roll #'}</div>
            <div><svg><use href="#icon-bell"></use></svg> ${student.email}</div>
            <div><svg><use href="#icon-check"></use></svg> ${student.phone || 'No Phone'}</div>
            <div class="status-badge active">Active</div>
          </div>
          ${isAdmin ? `<button class="secondary" onclick="openEditProfileModal(${student.id})"><svg><use href="#icon-menu"></use></svg> Edit Profile</button>` : ''}
        </div>
      </div>
      <div class="grid-2">
        <div class="card">
          <h2>Academic Details (Demo)</h2>
          <div style="font-size: 14px; display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
            <div><div style="color:var(--text-muted); font-size:12px;">Department</div><div style="font-weight:600;">Computer Science</div></div>
            <div><div style="color:var(--text-muted); font-size:12px;">Course</div><div style="font-weight:600;">B.Tech CSE</div></div>
            <div><div style="color:var(--text-muted); font-size:12px;">Year & Semester</div><div style="font-weight:600;">Year 3, Sem 5</div></div>
            <div><div style="color:var(--text-muted); font-size:12px;">Division</div><div style="font-weight:600;">A</div></div>
          </div>
        </div>
        <div class="card">
          <h2>Attendance Summary (Demo)</h2>
          <div class="css-bar-chart" style="height:100px;">
            <div class="css-bar-col"><div class="css-bar" style="height: 85%;" data-val="85%"></div><span class="css-bar-label">Overall</span></div>
            <div class="css-bar-col"><div class="css-bar" style="height: 90%; background:var(--success);" data-val="90%"></div><span class="css-bar-label">Physics</span></div>
            <div class="css-bar-col"><div class="css-bar" style="height: 75%; background:var(--warning);" data-val="75%"></div><span class="css-bar-label">Math</span></div>
          </div>
        </div>
      </div>
    `;
    return;
  }
  
  let filtered = allStudents.filter(u => 
    u.name.toLowerCase().includes(searchQuery) || 
    u.email.toLowerCase().includes(searchQuery) ||
    (u.student_number && u.student_number.toLowerCase().includes(searchQuery))
  );

  // Sorting
  filtered.sort((a, b) => {
    let valA = a[sortCol] || '';
    let valB = b[sortCol] || '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return sortDesc ? 1 : -1;
    if (valA > valB) return sortDesc ? -1 : 1;
    return 0;
  });

  // Pagination
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  let tableContent = '';
  if (paginated.length === 0) {
    tableContent = `<tr><td colspan="4">${renderEmpty('No students found', 'Try adjusting your search or filters.')}</td></tr>`;
  } else {
    tableContent = paginated.map(u => `
      <tr style="cursor: pointer;" onclick="viewProfile(${u.id})">
        <td>
          <div style="display: flex; align-items: center; gap: 12px;">
            ${renderAvatar(u.name)}
            <div>
              <div style="font-weight: 500;">${u.name}</div>
              <div style="font-size: 12px; color: var(--text-muted);">${u.email}</div>
            </div>
          </div>
        </td>
        <td><div style="font-size: 13px;">${u.student_number || 'N/A'}</div></td>
        <td><div class="status-badge active">${u.role.toUpperCase()}</div></td>
        <td onclick="event.stopPropagation()">
          ${isAdmin ? `
            <button class="secondary icon-only danger" title="Delete" onclick="deleteStudent(${u.id})">
              <svg><use href="#icon-close"></use></svg>
            </button>
          ` : '<span style="font-size:12px;color:var(--text-muted);">View Only</span>'}
        </td>
      </tr>
    `).join('');
  }

  el.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 24px;">
      <div>
        <h2 style="font-size: 28px; margin-bottom: 4px;">User Directory</h2>
        <p style="color: var(--text-muted); margin:0;">Manage students and teachers</p>
      </div>
      ${isAdmin ? `<button onclick="openModal('add-user-modal')"><svg><use href="#icon-plus"></use></svg> Add User</button>` : ''}
    </div>
    
    <div class="card" style="margin-bottom: 24px; padding: 16px 24px;">
      <div class="filter-bar">
        <select id="filter-dept" onchange="updateFilters()" style="padding: 8px; border-radius: 6px;">
          <option value="">All Departments (Demo)</option>
          <option value="cs">Computer Science</option>
          <option value="it">Info Tech</option>
        </select>
        <select id="filter-course" onchange="updateFilters()" style="padding: 8px; border-radius: 6px;">
          <option value="">All Courses (Demo)</option>
          <option value="btech">B.Tech</option>
          <option value="mtech">M.Tech</option>
        </select>
        <select id="filter-status" onchange="updateFilters()" style="padding: 8px; border-radius: 6px;">
          <option value="">All Statuses (Demo)</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>

    <div class="card" style="overflow-x: auto; padding: 0;">
      <table style="margin: 0;">
        <thead>
          <tr>
            <th onclick="setSort('name')" style="cursor:pointer;">User Info ${sortCol === 'name' ? (sortDesc ? '↓' : '↑') : ''}</th>
            <th onclick="setSort('student_number')" style="cursor:pointer;">Roll No / ID ${sortCol === 'student_number' ? (sortDesc ? '↓' : '↑') : ''}</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${tableContent}
        </tbody>
      </table>
      <div style="padding: 0 24px;">
        <div class="pagination">
          <div>Showing ${startIdx + 1} to ${Math.min(startIdx + ITEMS_PER_PAGE, totalItems)} of ${totalItems} students</div>
          <div class="pagination-controls">
            <button class="secondary" onclick="setPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Prev</button>
            <button class="secondary" onclick="setPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
          </div>
        </div>
      </div>
    </div>

    ${isAdmin ? `
    <div id="add-user-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Add New User</h2>
          <button class="icon-only" onclick="closeModal('add-user-modal')"><svg><use href="#icon-close"></use></svg></button>
        </div>
        <div class="form-row full">
          <select id="nu-role">
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>
        <div class="form-row full">
          <input id="nu-name" placeholder="Full name" />
        </div>
        <div class="form-row full">
          <input id="nu-email" placeholder="Email" type="email" />
        </div>
        <div class="form-row full">
          <input id="nu-student-number" placeholder="Roll Number / ID" />
        </div>
        <div class="form-row">
          <input id="nu-phone" placeholder="Student Phone" />
          <input id="nu-parent-phone" placeholder="Parent Phone" />
        </div>
        <div class="error-msg hidden" id="nu-error"></div>
        <div class="modal-footer">
          <button class="secondary" onclick="closeModal('add-user-modal')">Cancel</button>
          <button onclick="createStudent()">Create User</button>
        </div>
      </div>
    </div>
    ` : ''}

    ${isAdmin && viewingProfileId ? `
    <div id="edit-student-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Edit Student Profile</h2>
          <button class="icon-only" onclick="closeModal('edit-student-modal')"><svg><use href="#icon-close"></use></svg></button>
        </div>
        <div class="form-row full">
          <label>Full Name</label>
          <input id="eu-name" placeholder="Full name" />
        </div>
        <div class="form-row full">
          <label>Email</label>
          <input id="eu-email" placeholder="Email" type="email" />
        </div>
        <div class="form-row full">
          <label>Roll Number / ID</label>
          <input id="eu-student-number" placeholder="Roll Number / ID" />
        </div>
        <div class="form-row">
          <div>
            <label>Student Phone</label>
            <input id="eu-phone" placeholder="Student Phone" />
          </div>
          <div>
            <label>Parent Phone</label>
            <input id="eu-parent-phone" placeholder="Parent Phone" />
          </div>
        </div>
        <div class="error-msg hidden" id="eu-error"></div>
        <div class="modal-footer">
          <button class="secondary" onclick="closeModal('edit-student-modal')">Cancel</button>
          <button onclick="updateStudent(${viewingProfileId})">Save Changes</button>
        </div>
      </div>
    </div>
    ` : ''}
  `;
}

export async function createStudent() {
  const name = document.getElementById('nu-name').value;
  const email = document.getElementById('nu-email').value;
  const student_number = document.getElementById('nu-student-number').value;
  const phone = document.getElementById('nu-phone').value;
  const parent_phone = document.getElementById('nu-parent-phone').value;
  const role = document.getElementById('nu-role') ? document.getElementById('nu-role').value : 'student';
  const errEl = document.getElementById('nu-error');
  errEl.classList.add('hidden');
  
  if (!name || !email) {
    errEl.textContent = "Name and email are required.";
    errEl.classList.remove('hidden');
    return;
  }
  
  try {
    await api('/users', { method: 'POST', body: { name, email, role, student_number, phone, parent_phone } });
    showToast('User created successfully');
    closeModal('add-user-modal');
    renderTab();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  }
}

export function openEditProfileModal(id) {
  const student = allStudents.find(s => s.id === id);
  if (!student) return;
  document.getElementById('eu-name').value = student.name || '';
  document.getElementById('eu-email').value = student.email || '';
  document.getElementById('eu-student-number').value = student.student_number || '';
  document.getElementById('eu-phone').value = student.phone || '';
  document.getElementById('eu-parent-phone').value = student.parent_phone || '';
  
  const errEl = document.getElementById('eu-error');
  if (errEl) errEl.classList.add('hidden');
  
  openModal('edit-student-modal');
}

export async function updateStudent(id) {
  const name = document.getElementById('eu-name').value;
  const email = document.getElementById('eu-email').value;
  const student_number = document.getElementById('eu-student-number').value;
  const phone = document.getElementById('eu-phone').value;
  const parent_phone = document.getElementById('eu-parent-phone').value;
  const errEl = document.getElementById('eu-error');
  errEl.classList.add('hidden');
  
  if (!name || !email) {
    errEl.textContent = "Name and email are required.";
    errEl.classList.remove('hidden');
    return;
  }
  
  try {
    await api('/users/' + id, { method: 'PUT', body: { name, email, student_number, phone, parent_phone } });
    showToast('Student updated successfully');
    closeModal('edit-student-modal');
    renderTab(); // re-fetch data and re-render
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  }
}

export async function deleteStudent(id) {
  if (!confirm('Are you sure you want to delete this student?')) return;
  await api('/users/' + id, { method: 'DELETE' });
  showToast('Student deleted');
  renderTab();
}

window.createStudent = createStudent;
window.deleteStudent = deleteStudent;
window.setPage = setPage;
window.setSort = setSort;
window.updateFilters = updateFilters;
window.openModal = openModal;
window.closeModal = closeModal;
window.viewProfile = viewProfile;
window.closeProfile = closeProfile;
window.openEditProfileModal = openEditProfileModal;
window.updateStudent = updateStudent;
window.createNotice = createNotice;
window.deleteNotice = deleteNotice;

let adminAttFilters = { department: '', course: '', semester: '', division: '', subject: '' };

export function updateAdminAttFilters() {
  adminAttFilters.department = document.getElementById('att-filter-dept')?.value || '';
  adminAttFilters.course = document.getElementById('att-filter-course')?.value || '';
  adminAttFilters.semester = document.getElementById('att-filter-sem')?.value || '';
  adminAttFilters.division = document.getElementById('att-filter-div')?.value || '';
  adminAttFilters.subject = document.getElementById('att-filter-sub')?.value || '';
  renderTab();
}
window.updateAdminAttFilters = updateAdminAttFilters;

export async function renderAdminAttendance(el) {
  const query = new URLSearchParams();
  if (adminAttFilters.department) query.append('department', adminAttFilters.department);
  if (adminAttFilters.course) query.append('course', adminAttFilters.course);
  if (adminAttFilters.semester) query.append('semester', adminAttFilters.semester);
  if (adminAttFilters.division) query.append('division', adminAttFilters.division);
  if (adminAttFilters.subject) query.append('subject', adminAttFilters.subject);
  
  const report = await api('/attendance/report?' + query.toString());
  
  const totalClasses = report.reduce((sum, r) => sum + r.total_classes, 0);
  const presentClasses = report.reduce((sum, r) => sum + r.present_classes, 0);
  const collegeAvg = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
  
  el.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 24px;">
      <div>
        <h2 style="font-size: 28px; margin-bottom: 4px;">Attendance Reports</h2>
        <p style="color: var(--text-muted); margin:0;">College-wide attendance tracking and metrics</p>
      </div>
      <div style="text-align:right;">
        <div style="font-size:12px; color:var(--text-muted);">Filtered Average</div>
        <div style="font-size:24px; font-weight:bold; color:${collegeAvg >= 75 ? 'var(--success)' : 'var(--danger)'}">${collegeAvg}%</div>
      </div>
    </div>
    
    <div class="card" style="margin-bottom: 24px; padding: 16px 24px;">
      <div class="filter-bar" style="display:flex; flex-wrap:wrap; gap:12px;">
        <input id="att-filter-dept" placeholder="Department (e.g. Science)" value="${adminAttFilters.department}" style="flex:1; min-width:120px;" />
        <input id="att-filter-course" placeholder="Course (e.g. B.Tech)" value="${adminAttFilters.course}" style="flex:1; min-width:120px;" />
        <input id="att-filter-sem" placeholder="Semester (e.g. Sem 1)" value="${adminAttFilters.semester}" style="flex:1; min-width:120px;" />
        <input id="att-filter-div" placeholder="Division (e.g. A)" value="${adminAttFilters.division}" style="flex:1; min-width:80px;" />
        <input id="att-filter-sub" placeholder="Subject (e.g. Physics)" value="${adminAttFilters.subject}" style="flex:1; min-width:120px;" />
        <button class="secondary" onclick="updateAdminAttFilters()"><svg><use href="#icon-search"></use></svg> Filter</button>
      </div>
    </div>
    
    <div class="card" style="overflow-x: auto; padding: 0;">
      <table style="margin: 0;">
        <thead>
          <tr>
            <th>Student</th>
            <th>Roll No</th>
            <th style="text-align:right;">Total Classes</th>
            <th style="text-align:right;">Present</th>
            <th style="text-align:right;">Percentage</th>
          </tr>
        </thead>
        <tbody>
          ${report.length ? report.map(r => {
            const pct = r.total_classes > 0 ? Math.round((r.present_classes / r.total_classes) * 100) : 0;
            return `
            <tr>
              <td>
                <div style="font-weight: 500;">${r.student_name}</div>
              </td>
              <td>${r.student_number || '-'}</td>
              <td style="text-align:right;">${r.total_classes}</td>
              <td style="text-align:right;">${r.present_classes}</td>
              <td style="text-align:right;">
                <span class="status-badge ${pct >= 75 ? 'active' : 'inactive'}">${pct}%</span>
              </td>
            </tr>
            `;
          }).join('') : `<tr><td colspan="5">${renderEmpty('No records', 'Adjust filters to see results.')}</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}
