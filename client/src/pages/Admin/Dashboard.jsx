import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import AdminSidebar from './AdminSidebar';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.admin.getDashboard().then(d => {
      setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/admin/login" replace />;

  const cards = [
    { number: data?.totalProducts ?? '—', label: 'Total Products' },
    { number: data?.totalLeads ?? '—', label: 'Total Leads' },
    { number: data?.newLeads ?? '—', label: 'New Leads' },
    { number: data?.contactedLeads ?? '—', label: 'Contacted' },
  ];

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <h1>Dashboard</h1>
        <div className="admin-cards">
          {cards.map((c, i) => (
            <div key={i} className="admin-card">
              <div className="number">{c.number}</div>
              <div className="label">{c.label}</div>
            </div>
          ))}
        </div>

        {data?.recentLeads?.length > 0 && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Recent Leads</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Product</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentLeads.slice(0, 5).map(lead => (
                    <tr key={lead.id}>
                      <td>{lead.name}</td>
                      <td>{lead.phone}</td>
                      <td>{lead.product_name || '—'}</td>
                      <td><span className={`badge badge-${lead.status || 'new'}`}>{lead.status || 'new'}</span></td>
                      <td>{lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'}</td>
                      <td><Link to="/admin/leads" className="btn-sm btn-view">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
