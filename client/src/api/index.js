const BASE = '/api';

async function request(url, opts = {}) {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts
  });
  if (opts.raw) return res;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  getProducts: () => request('/products'),
  getProduct: (id) => request('/products/' + id),
  submitRent: (productId, body) =>
    request('/rent/' + productId, {
      method: 'POST',
      body: JSON.stringify(body)
    }),
  submitContact: (body) =>
    request('/contact', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
  admin: {
    login: (username, password) =>
      request('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      }),
    getDashboard: () => request('/admin/dashboard'),
    getProducts: () => request('/admin/products'),
    addProduct: (formData) =>
      fetch(BASE + '/admin/products', {
        method: 'POST',
        body: formData
      }).then(r => r.json()),
    editProduct: (id, formData) =>
      fetch(BASE + '/admin/products/' + id, {
        method: 'PUT',
        body: formData
      }).then(r => r.json()),
    deleteProduct: (id) =>
      request('/admin/products/' + id, { method: 'DELETE' }),
    getLeads: () => request('/admin/leads'),
    updateLeadStatus: (id, status) =>
      request('/admin/leads/' + id + '/status', {
        method: 'PUT',
        body: JSON.stringify({ status })
      }),
    deleteLead: (id) =>
      request('/admin/leads/' + id, { method: 'DELETE' }),
    exportData: () =>
      fetch(BASE + '/admin/export').then(r => r.json()),
    importData: (formData) =>
      fetch(BASE + '/admin/import', {
        method: 'POST',
        body: formData
      }).then(r => r.json()),
    checkAuth: () => request('/admin/check'),
    logout: () => request('/admin/logout')
  }
};