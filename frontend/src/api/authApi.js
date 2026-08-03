const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const authApi = {
  async register(payload) {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async login(payload) {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async logout(token) {
    if (!token) return;
    return fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  async logAudit(token, action, details) {
    return fetch(`${API_BASE_URL}/api/auth/audit-log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action, details })
    });
  },

  async getUsers(token) {
    const res = await fetch(`${API_BASE_URL}/api/auth/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  async addEmployee(token, payload) {
    const res = await fetch(`${API_BASE_URL}/api/auth/add-employee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async updateUser(token, username, payload) {
    const res = await fetch(`${API_BASE_URL}/api/auth/users/${encodeURIComponent(username)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async deleteUser(token, username) {
    const res = await fetch(`${API_BASE_URL}/api/auth/users/${encodeURIComponent(username)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  }
};
