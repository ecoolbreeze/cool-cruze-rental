import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import AdminSidebar from './AdminSidebar';

const STATUSES = ['new', 'contacted', 'closed'];

export default function AdminLeads() {
  const { user, loading: authLoading } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.admin.getLeads()
      .then(data => {
        if (Array.isArray(data)) setLeads(data);
        else if (data.leads) setLeads(data.leads);
        else setLeads([]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (user) load(); }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/admin/login" replace />;

  const updateStatus = async (id, status) => {
    try {
      await api.admin.updateLeadStatus(id, status);
      load();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return;
    try {
      await api.admin.deleteLead(id);
      load();
    } catch (err) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handleExport = async () => {
    try {
      const data = await api.admin.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cool-cruze-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm('Import will replace all data. Are you sure?')) return;
    const fd = new FormData();
    fd.append('backup', file);
    try {
      const result = await api.admin.importData(fd);
      alert(result.message || 'Import successful');
      load();
    } catch (err) {
      alert(err.message || 'Import failed');
    }
    e.target.value = '';
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <h1>Leads</h1>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <button className="btn-sm btn-view" style={{ fontSize: 14, padding: '8px 20px' }} onClick={handleExport}>Export Backup</button>
          <label className="btn-sm btn-edit" style={{ fontSize: 14, padding: '8px 20px', cursor: 'pointer' }}>
            Import Backup
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Product</th>
                <th>Duration</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24 }}>Loading...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24 }}>No leads yet.</td></tr>
              ) : leads.map(lead => (
                <tr key={lead.id}>
                  <td>{lead.name}</td>
                  <td>{lead.phone}</td>
                  <td>{lead.email || '—'}</td>
                  <td>{lead.product_name || '—'}</td>
                  <td>{lead.months ? `${lead.months} days` : '—'}</td>
                  <td>{lead.total_price ? `₹${lead.total_price}` : '—'}</td>
                  <td>
                    <select value={lead.status || 'new'} onChange={e => updateStatus(lead.id, e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13 }}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'}</td>
                  <td>
                    <button className="btn-sm btn-delete" onClick={() => handleDelete(lead.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
