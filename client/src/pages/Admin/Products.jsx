import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import AdminSidebar from './AdminSidebar';

const TYPES = ['Tower AC', 'Portable AC', 'Ductable AC', 'Cassette AC'];
const CAPACITIES = ['1.5 Ton', '3.5 Ton', '5.5 Ton', '8.5 Ton'];
const EMPTY = { name: '', type: 'Tower AC', capacity: '1.5 Ton', brand: '', price_per_day: '', short_desc: '', description: '', features: '' };

export default function AdminProducts() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [cardFile, setCardFile] = useState(null);
  const [detailFiles, setDetailFiles] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.admin.getProducts().then(setProducts).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { if (user) load(); }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/admin/login" replace />;

  const openEdit = (p) => {
    setEditing(p.id);
    setForm({
      name: p.name, type: p.type, capacity: p.capacity,
      brand: p.brand || '', price_per_day: p.price_per_day,
      short_desc: p.short_desc || '', description: p.description || '',
      features: (p.features || []).join(', ')
    });
    setCardFile(null);
    setDetailFiles(null);
  };

  const openNew = () => {
    setEditing('new');
    setForm(EMPTY);
    setCardFile(null);
    setDetailFiles(null);
  };

  const cancelEdit = () => { setEditing(null); setForm(EMPTY); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (cardFile) fd.append('card_image', cardFile);
    if (detailFiles) {
      for (const f of detailFiles) fd.append('detail_images', f);
    }
    try {
      if (editing === 'new') await api.admin.addProduct(fd);
      else await api.admin.editProduct(editing, fd);
      cancelEdit();
      load();
    } catch (err) {
      alert(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.admin.deleteProduct(id);
      load();
    } catch (err) {
      alert(err.message || 'Failed to delete');
    }
  };

  const isEditing = editing !== null;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <h1>Products</h1>

        {isEditing && (
          <div className="admin-form">
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>{editing === 'new' ? 'Add Product' : 'Edit Product'}</h2>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Product Name *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Capacity</label>
                  <select value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})}>
                    {CAPACITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Brand</label>
                  <input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Price per Day (₹) *</label>
                  <input type="number" min="0" step="1" value={form.price_per_day} onChange={e => setForm({...form, price_per_day: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label>Card Image</label>
                <input type="file" accept="image/*" onChange={e => setCardFile(e.target.files[0])} />
              </div>
              <div className="form-group">
                <label>Detail Gallery Images (multiple)</label>
                <input type="file" accept="image/*" multiple onChange={e => setDetailFiles(e.target.files)} />
              </div>
              <div className="form-group">
                <label>Short Description</label>
                <textarea rows={2} value={form.short_desc} onChange={e => setForm({...form, short_desc: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Full Description</label>
                <textarea rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Features (comma-separated)</label>
                <input value={form.features} onChange={e => setForm({...form, features: e.target.value})} placeholder="e.g. Energy Efficient, Low Noise, Quick Cooling" />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn-submit" style={{ width: 'auto', padding: '12px 32px' }} disabled={saving}>
                  {saving ? 'Saving...' : (editing === 'new' ? 'Add Product' : 'Save Changes')}
                </button>
                <button type="button" onClick={cancelEdit} style={{ padding: '12px 24px', border: '1px solid #e2e8f0', borderRadius: 50, background: 'white', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <button className="btn-rent" style={{ marginBottom: 20, display: 'inline-flex', width: 'auto' }} onClick={openNew}>+ Add Product</button>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Price/Day</th>
                <th>Image</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>No products yet.</td></tr>
              ) : products.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>{p.type}</td>
                  <td>{p.capacity}</td>
                  <td>₹{p.price_per_day}</td>
                  <td>{p.card_image ? <span style={{ color: 'var(--primary)' }}>✓</span> : '—'}</td>
                  <td>
                    <div className="admin-actions">
                      <button className="btn-sm btn-edit" onClick={() => openEdit(p)}>Edit</button>
                      <button className="btn-sm btn-delete" onClick={() => handleDelete(p.id, p.name)}>Delete</button>
                    </div>
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
