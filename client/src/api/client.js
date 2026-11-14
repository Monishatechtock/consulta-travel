const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('consulta_admin_token');
}

export function setAuthSession({ token, admin }) {
  localStorage.setItem('consulta_admin_token', token);
  localStorage.setItem('consulta_admin_profile', JSON.stringify(admin));
}

export function clearAuthSession() {
  localStorage.removeItem('consulta_admin_token');
  localStorage.removeItem('consulta_admin_profile');
}

export function getStoredAdmin() {
  try {
    return JSON.parse(localStorage.getItem('consulta_admin_profile') || 'null');
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getToken());
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && !path.startsWith('/auth/login')) {
    clearAuthSession();
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/csv')) {
    if (!res.ok) throw new Error('Export failed');
    return res.blob();
  }

  const data = contentType.includes('application/json')
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const message =
      (data && data.message) ||
      (typeof data === 'string' ? data : 'Request failed');
    throw new Error(message);
  }
  return data;
}

export const api = {
  health: () => request('/health'),
  login: (payload) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/auth/me'),
  submitParticipant: (payload) =>
    request('/participants', { method: 'POST', body: JSON.stringify(payload) }),
  getStats: () => request('/admin/stats'),
  getParticipants: ({ q = '', status = 'all' } = {}) => {
    const params = new URLSearchParams({ q, status });
    return request(`/admin/participants?${params}`);
  },
  getParticipant: (id) => request(`/admin/participants/${id}`),
  updateParticipant: (id, payload) =>
    request(`/admin/participants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteParticipant: (id) =>
    request(`/admin/participants/${id}`, { method: 'DELETE' }),
  exportCsv: ({ q = '', status = 'all' } = {}) => {
    const params = new URLSearchParams({ q, status });
    return request(`/admin/export?${params}`);
  },
};
