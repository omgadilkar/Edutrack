import { renderAvatar, renderEmpty } from './components.js';
import { initAuth, logout } from './auth.js';
import { renderAdminStudents, renderAdminDashboard, handleGlobalSearch, renderAdminAttendance } from './admin.js';
import { renderClasses, renderAttendance, renderGrades, renderTeacherDashboard } from './teacher.js';
import { renderStudentDashboard, renderStudentAttendance } from './student.js';

export let activeTab = null;

function getGreeting() {
  const hr = new Date().getHours();
  if (hr < 12) return "Good morning,";
  if (hr < 18) return "Good afternoon,";
  return "Good evening,";
}

export function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    document.body.classList.toggle('theme-dark', saved === 'dark');
    document.body.classList.toggle('theme-light', saved === 'light');
    const icon = document.getElementById('theme-icon');
    if (icon) {
      icon.innerHTML = saved === 'dark' ? '<use href="#icon-sun"></use>' : '<use href="#icon-moon"></use>';
    }
  }
}

export function toggleTheme() {
  const isDark = document.body.classList.contains('theme-dark') || 
    (!document.body.classList.contains('theme-light') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  if (isDark) {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
    localStorage.setItem('theme', 'light');
    document.getElementById('theme-icon').innerHTML = '<use href="#icon-moon"></use>';
  } else {
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');
    localStorage.setItem('theme', 'dark');
    document.getElementById('theme-icon').innerHTML = '<use href="#icon-sun"></use>';
  }
}

export function toggleSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

export function showApp() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.id) return logout();

  const loginScreen = document.getElementById('login-screen');
  if (loginScreen) loginScreen.classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('user-greeting').textContent = getGreeting();
  document.getElementById('user-name').textContent = user.name || "User";
  document.getElementById('user-avatar-container').innerHTML = renderAvatar(user.name || "User");
  
  initTheme();
  render();
}

export function render() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  let tabs = [];
  
  if (user.role === 'admin') {
    tabs = [
      ['dashboard', 'Dashboard', 'icon-chart'],
      ['attendance', 'Attendance', 'icon-check'],
      ['students', 'User Directory', 'icon-users']
    ];
  } else if (user.role === 'teacher') {
    tabs = [
      ['dashboard', 'Dashboard', 'icon-chart'],
      ['classes', 'Classes', 'icon-book'], 
      ['attendance', 'Attendance', 'icon-check'], 
      ['grades', 'Grades', 'icon-edit'],
      ['students', 'User Directory', 'icon-users']
    ];
  } else if (user.role === 'student') {
    tabs = [
      ['dashboard', 'Dashboard', 'icon-chart'],
      ['attendance', 'My Attendance', 'icon-check']
    ];
  }

  if (!activeTab || !tabs.find(t => t[0] === activeTab)) {
    activeTab = tabs[0] ? tabs[0][0] : null;
  }

  const sidebarNav = document.getElementById('sidebar-nav');
  if (sidebarNav) {
    sidebarNav.innerHTML = tabs.map(([key, label, icon]) => `
      <button class="${activeTab === key ? 'active' : ''}" onclick="switchTab('${key}')">
        <svg><use href="#${icon}"></use></svg>
        <span>${label}</span>
      </button>
    `).join('');
  }

  if (activeTab) renderTab();
}

export function switchTab(key) {
  activeTab = key;
  render();
  const sidebar = document.getElementById('app-sidebar');
  if (sidebar && window.innerWidth <= 1024) {
    sidebar.classList.remove('open');
  }
}

export async function renderTab() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const el = document.getElementById('main-container');
  if (!el) return;
  
  el.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:24px;">
      <div class="grid-3">
        <div class="skeleton" style="height:100px;"></div>
        <div class="skeleton" style="height:100px;"></div>
        <div class="skeleton" style="height:100px;"></div>
      </div>
      <div class="skeleton" style="height:300px;"></div>
    </div>
  `;

  try {
    if (user.role === 'admin') {
      if (activeTab === 'dashboard') return await renderAdminDashboard(el);
      if (activeTab === 'attendance') return await renderAdminAttendance(el);
      if (activeTab === 'students') return await renderAdminStudents(el);
    } else if (user.role === 'teacher') {
      if (activeTab === 'dashboard') return await renderTeacherDashboard(el);
      if (activeTab === 'classes') return await renderClasses(el);
      if (activeTab === 'attendance') return await renderAttendance(el);
      if (activeTab === 'grades') return await renderGrades(el);
      if (activeTab === 'students') return await renderAdminStudents(el);
    } else if (user.role === 'student') {
      if (activeTab === 'dashboard') return await renderStudentDashboard(el);
      if (activeTab === 'attendance') return await renderStudentAttendance(el);
    }
  } catch (err) {
    el.innerHTML = `<div class="card"><div class="error-msg">${err.message}</div></div>`;
  }
}

window.switchTab = switchTab;
window.renderTab = renderTab;
window.logout = logout;
window.toggleTheme = toggleTheme;
window.toggleSidebar = toggleSidebar;
window.handleGlobalSearch = handleGlobalSearch;

// Boot
(function init() {
  initAuth();
})();
