import { api, setToken, state } from './api.js';
import { showToast } from './components.js';
import { showApp } from './main.js';

let authMode = 'login';
let resetToken = '';

export function toggleAuthMode(mode) {
  authMode = mode;
  document.getElementById('auth-error').textContent = '';
  document.getElementById('simulated-email').classList.add('hidden');
  
  const isLogin = mode === 'login';
  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';
  const isReset = mode === 'reset';

  document.getElementById('auth-tabs').classList.toggle('hidden', isForgot || isReset);
  document.getElementById('tab-login').classList.toggle('active', isLogin);
  document.getElementById('tab-register').classList.toggle('active', isRegister);
  
  document.getElementById('register-fields').classList.toggle('hidden', !isRegister);
  document.getElementById('login-hint').classList.toggle('hidden', !isLogin);
  document.getElementById('forgot-pw-link-container').classList.toggle('hidden', !isLogin);
  
  document.getElementById('email-field').classList.toggle('hidden', isReset);
  document.getElementById('password-field').classList.toggle('hidden', isForgot);

  if (isLogin) {
    document.getElementById('auth-title').textContent = 'Welcome back';
    document.getElementById('auth-btn').textContent = 'Log In';
  } else if (isRegister) {
    document.getElementById('auth-title').textContent = 'Create an account';
    document.getElementById('auth-btn').textContent = 'Sign Up';
  } else if (isForgot) {
    document.getElementById('auth-title').textContent = 'Reset Password';
    document.getElementById('auth-btn').textContent = 'Send Reset Link';
  } else if (isReset) {
    document.getElementById('auth-title').textContent = 'Set New Password';
    document.getElementById('auth-btn').textContent = 'Save Password';
  }
}

export async function submitAuth() {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const errEl = document.getElementById('auth-error');
  errEl.textContent = '';
  
  try {
    if (authMode === 'login') {
      const data = await api('/auth/login', { method: 'POST', body: { email, password } });
      setToken(data.token);
      state.user = data.user;
      showApp();
    } else if (authMode === 'register') {
      const name = document.getElementById('auth-name').value;
      const role = document.getElementById('auth-role').value;
      const data = await api('/auth/register', { method: 'POST', body: { name, email, password, role } });
      setToken(data.token);
      state.user = data.user;
      showApp();
    } else if (authMode === 'forgot') {
      const data = await api('/auth/forgot-password', { method: 'POST', body: { email } });
      resetToken = data.token;
      document.getElementById('simulated-email').classList.remove('hidden');
    } else if (authMode === 'reset') {
      await api('/auth/reset-password', { method: 'POST', body: { token: resetToken, new_password: password } });
      showToast('Password reset successful! Please log in.');
      toggleAuthMode('login');
      document.getElementById('auth-password').value = '';
    }
  } catch (err) {
    errEl.textContent = err.message;
  }
}

export function logout() {
  setToken(null);
  state.user = null;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
}

// Bind to window for HTML inline event handlers
window.toggleAuthMode = toggleAuthMode;
window.submitAuth = submitAuth;
window.logout = logout;
