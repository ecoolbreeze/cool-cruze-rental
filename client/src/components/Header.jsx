import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Header({ onRentNow }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const links = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Our Products' },
    { to: '/about', label: 'About Us' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="logo">
          <div className="logo-icon">❄</div>
          Cool Cruze
        </Link>
        <button className="mobile-toggle" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? '✕' : '☰'}
        </button>
        <div className={`nav-links${open ? ' open' : ''}`}>
          {links.map(l => (
            <Link key={l.to} to={l.to} className={pathname === l.to ? 'active' : ''} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link to="/products" className="nav-cta" onClick={() => setOpen(false)}>Rent Now</Link>
        </div>
      </div>
    </nav>
  );
}
