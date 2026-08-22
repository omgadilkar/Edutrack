import { api, state } from './api.js';
import { renderAvatar, showToast, renderEmpty, renderRadialGauge } from './components.js';
import './auth.js';

import { renderAdminOverview, renderAdminUsers, renderAdminClasses, createUser, deleteUser, createClass, enrollStudent } from './admin.js';
import { renderTeacherClasses, renderTeacherAttendance, renderTeacherGrades, markAttendance, addGrade, setTeacherSelectedClass } from './teacher.js';
import { renderStudentAttendance, renderStudentGrades } from './student.js';

// Bind to window for HTML inline event handlers
window.createUser = createUser;
window.deleteUser = deleteUser;
window.createClass = createClass;
window.enrollStudent = enrollStudent;
window.markAttendance = markAttendance;
window.addGrade = addGrade;
window.setTeacherSelectedClass = setTeacherSelectedClass;
window.switchTab = switchTab;
window.renderTab = renderTab;

export let activeTab = null;

function getGreeting() {
  const hr = new Date().getHours();
  if (hr < 12) return "Good morning,";
  if (hr < 18) return "Good afternoon,";
  return "Good evening,";
}

export function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('user-greeting').textContent = getGreeting();
  document.getElementById('user-name').textContent = state.user.name;
  document.getElementById('user-avatar-container').innerHTML = renderAvatar(state.user.name);
  render();
}

export function render() {
  const role = state.user.role;
  const tabs = role === 'admin'
    ? [['overview', 'Overview'], ['users', 'Manage Users'], ['classes', 'Classes']]
    : role === 'teacher'
    ? [['classes', 'My Classes'], ['attendance', 'Attendance'], ['grades', 'Grades']]
    : [['attendance', 'My Attendance'], ['grades', 'My Grades']];

  if (!activeTab || !tabs.find(t => t[0] === activeTab)) activeTab = tabs[0][0];

  const container = document.getElementById('main-container');
  container.innerHTML = `
    <div class="tabs">
      ${tabs.map(([key, label]) => `<button class="${activeTab === key ? 'active' : ''}" onclick="switchTab('${key}')">${label}</button>`).join('')}
    </div>
    <div id="tab-content"></div>
  `;
  renderTab();
}

export function switchTab(key) {
  activeTab = key;
  render();
}

export async function renderTab() {
  const role = state.user.role;
  const el = document.getElementById('tab-content');
  el.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);">Loading...</div>';
  try {
    if (role === 'admin') {
      if (activeTab === 'overview') return renderAdminOverview(el);
      if (activeTab === 'users') return renderAdminUsers(el);
      if (activeTab === 'classes') return renderAdminClasses(el);
    } else if (role === 'teacher') {
      if (activeTab === 'classes') return renderTeacherClasses(el);
      if (activeTab === 'attendance') return renderTeacherAttendance(el);
      if (activeTab === 'grades') return renderTeacherGrades(el);
    } else {
      if (activeTab === 'attendance') return renderStudentAttendance(el);
      if (activeTab === 'grades') return renderStudentGrades(el);
    }
  } catch (err) {
    el.innerHTML = `<div class="card"><div class="error-msg">${err.message}</div></div>`;
  }
}

// Boot
(async function init() {
  if (state.token) {
    try {
      const data = await api('/auth/me');
      state.user = data.user;
      showApp();
    } catch {
      window.logout();
    }
  }
})();
