import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const links = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/products', label: 'Products' },
    { to: '/admin/leads', label: 'Leads' },
  ];

  return (
    <>
      <div className={`admin-sidebar-overlay${open ? ' show' : ''}`} onClick={() => setOpen(false)} />
      <button className="admin-toggle" onClick={() => setOpen(!open)}>☰</button>
      <div className={`admin-sidebar${open ? ' open' : ''}`}>
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20 }}>
          <div className="logo-icon" style={{ width: 34, height: 34, fontSize: 16 }}>❄</div>
          Cool Cruze
        </div>
        {links.map(l => (
          <Link key={l.to} to={l.to} className={pathname === l.to ? 'active' : ''} onClick={() => setOpen(false)}>
            {l.label}
          </Link>
        ))}
        <div style={{ marginTop: 'auto', paddingTop: 32 }}>
          <a href="/" target="_blank" className="back-link" style={{ color: '#94a3b8', textDecoration: 'none', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>← View Site</a>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '12px 20px', width: '100%', textAlign: 'left', fontSize: 14 }}>Logout</button>
        </div>
      </div>
    </>
  );
}
