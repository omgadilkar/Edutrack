export const API = '/api';

export let state = {
  token: localStorage.getItem('edutrack_token') || null,
  user: null
};

export function authHeaders() {
  return {
    'Authorization': 'Bearer ' + state.token,
    'Content-Type': 'application/json'
  };
}

export async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    ...opts,
    headers: { ...authHeaders(), ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export function setToken(token) {
  state.token = token;
  if (token) {
    localStorage.setItem('edutrack_token', token);
  } else {
    localStorage.removeItem('edutrack_token');
  }
}
