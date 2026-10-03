import { api } from './api.js';
import { renderAvatar } from './components.js';
import { showApp } from './main.js';

export function initAuth() {
  const token = localStorage.getItem('token');
  if (token) {
    showApp();
  } else {
    showLogin();
  }
}

export function showLogin() {
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
}

export async function submitAuth() {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const errEl = document.getElementById('auth-error');
  const btn = document.getElementById('auth-btn');
  const btnText = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.spinner');

  errEl.classList.add('hidden');
  
  // Loading state
  if(btn) btn.disabled = true;
  if(btnText) btnText.classList.add('hidden');
  if(spinner) spinner.classList.remove('hidden');

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    document.getElementById('login-screen').classList.add('hidden');
    showApp();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  } finally {
    if(btn) btn.disabled = false;
    if(btnText) btnText.classList.remove('hidden');
    if(spinner) spinner.classList.add('hidden');
  }
}

export function togglePasswordVisibility() {
  const input = document.getElementById('auth-password');
  const showIcon = document.getElementById('icon-eye-show');
  const hideIcon = document.getElementById('icon-eye-hide');
  
  if (input.type === 'password') {
    input.type = 'text';
    showIcon.classList.add('hidden');
    hideIcon.classList.remove('hidden');
  } else {
    input.type = 'password';
    showIcon.classList.remove('hidden');
    hideIcon.classList.add('hidden');
  }
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  location.reload();
}

window.submitAuth = submitAuth;
window.logout = logout;
window.togglePasswordVisibility = togglePasswordVisibility;
