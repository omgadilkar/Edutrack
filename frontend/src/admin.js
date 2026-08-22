import { api } from './api.js';
import { renderAvatar, renderEmpty, showToast } from './components.js';
import { renderTab } from './main.js';

export async function renderAdminOverview(el) {
  const [users, classes] = await Promise.all([api('/users'), api('/classes')]);
  const counts = { admin: 0, teacher: 0, student: 0 };
  users.forEach(u => counts[u.role]++);
  
  el.innerHTML = `
    <div class="grid-3">
      <div class="card">
        <h2><svg><use href="#icon-users"></use></svg> Users Overview</h2>
        <div style="font-size: 32px; font-weight: 700; margin-bottom: 8px;">${users.length}</div>
        <div style="color: var(--text-muted); font-size: 14px;">
          ${counts.admin} Admins &bull; ${counts.teacher} Teachers &bull; ${counts.student} Students
        </div>
      </div>
      <div class="card">
        <h2><svg><use href="#icon-book"></use></svg> Classes</h2>
        <div style="font-size: 32px; font-weight: 700; margin-bottom: 8px;">${classes.length}</div>
        <div style="color: var(--text-muted); font-size: 14px;">Active classes on campus</div>
      </div>
    </div>
  `;
}

export async function renderAdminUsers(el) {
  const users = await api('/users');
  el.innerHTML = `
    <div class="grid-2">
      <div class="card" style="align-self: start;">
        <h2><svg><use href="#icon-plus"></use></svg> Add New User</h2>
        <div class="form-row full">
          <input id="nu-name" placeholder="Full name" />
        </div>
        <div class="form-row full">
          <input id="nu-email" placeholder="Email" type="email" />
        </div>
        <div class="form-row full">
          <input id="nu-password" placeholder="Password" type="password" />
        </div>
        <div class="form-row full">
          <select id="nu-role">
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button onclick="createUser()" style="width: 100%;">Create User</button>
        <div class="error-msg" id="nu-error"></div>
      </div>
      <div class="card" style="overflow-x: auto;">
        <h2><svg><use href="#icon-users"></use></svg> User Directory</h2>
        <table>
          <thead><tr><th>User</th><th>Role</th><th>Actions</th></tr></thead>
          <tbody>
            ${users.map(u => `<tr>
              <td>
                <div style="display: flex; align-items: center; gap: 12px;">
                  ${renderAvatar(u.name)}
                  <div>
                    <div style="font-weight: 500;">${u.name}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">${u.email}</div>
                  </div>
                </div>
              </td>
              <td><span style="text-transform: capitalize; font-size: 13px; color: var(--text-muted);">${u.role}</span></td>
              <td>
                <button class="secondary icon-only danger" title="Delete" onclick="deleteUser(${u.id})">
                  <svg><use href="#icon-trash"></use></svg>
                </button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export async function createUser() {
  const name = document.getElementById('nu-name').value;
  const email = document.getElementById('nu-email').value;
  const password = document.getElementById('nu-password').value;
  const role = document.getElementById('nu-role').value;
  const errEl = document.getElementById('nu-error');
  try {
    await api('/users', { method: 'POST', body: { name, email, password, role } });
    showToast('User created');
    renderTab();
  } catch (err) {
    errEl.textContent = err.message;
  }
}

export async function deleteUser(id) {
  if (!confirm('Are you sure you want to delete this user?')) return;
  await api('/users/' + id, { method: 'DELETE' });
  showToast('User deleted');
  renderTab();
}

export async function renderAdminClasses(el) {
  const [classes, teachers, students] = await Promise.all([
    api('/classes'), 
    api('/users?role=teacher'),
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
          <div class="form-row full">
            <select id="nc-teacher">
              <option value="">-- Assign Teacher --</option>
              ${teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-row full">
            <input id="nc-schedule" placeholder="Schedule (e.g. Mon/Wed 10AM)" />
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
          <thead><tr><th>Class</th><th>Teacher</th><th>Schedule</th></tr></thead>
          <tbody>
            ${classes.map(c => `<tr>
              <td>
                <div style="font-weight: 500;">${c.name}</div>
                <div style="font-size: 12px; color: var(--text-muted);">${c.subject || '-'}</div>
              </td>
              <td>${c.teacher_name || '-'}</td>
              <td><span style="font-size: 13px; color: var(--text-muted);">${c.schedule || '-'}</span></td>
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
  const teacher_id = document.getElementById('nc-teacher').value || null;
  const schedule = document.getElementById('nc-schedule').value;
  const errEl = document.getElementById('nc-error');
  try {
    await api('/classes', { method: 'POST', body: { name, subject, teacher_id, schedule } });
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
