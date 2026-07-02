import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const TYPES = ['All', 'Tower AC', 'Portable AC', 'Ductable AC', 'Cassette AC'];
const CAPACITIES = ['All', '1.5 Ton', '3.5 Ton', '5.5 Ton', '8.5 Ton'];

export default function Products({ onRent }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('All');
  const [capacity, setCapacity] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');

  useEffect(() => {
    api.getProducts().then(data => {
      setProducts(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  let filtered = products;
  if (type !== 'All') filtered = filtered.filter(p => p.type === type);
  if (capacity !== 'All') filtered = filtered.filter(p => p.capacity === capacity);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q));
  }
  if (sort === 'price-asc') filtered.sort((a, b) => a.price_per_day - b.price_per_day);
  else if (sort === 'price-desc') filtered.sort((a, b) => b.price_per_day - a.price_per_day);
  else if (sort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));

  if (loading) return <div className="section" style={{ textAlign: 'center', padding: '80px 24px' }}>Loading products...</div>;

  return (
    <section className="section">
      <div className="section-title">
        <h1 style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800 }}>Our AC Rental Products</h1>
        <p>Choose from a wide range of ACs for your cooling needs</p>
        <div className="accent-line" />
      </div>

      <div className="filters">
        <select value={type} onChange={e => setType(e.target.value)} aria-label="Filter by type">
          {TYPES.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
        </select>
        <select value={capacity} onChange={e => setCapacity(e.target.value)} aria-label="Filter by capacity">
          {CAPACITIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Capacities' : c}</option>)}
        </select>
        <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Search products" />
        <select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort by">
          <option value="">Default</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name">Name</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: 40 }}>No products found matching your criteria.</p>
      ) : (
        <div className="products-grid">
          {filtered.map(p => (
            <div key={p.id} className="product-card">
              <div className="product-img" style={{ backgroundImage: p.card_image ? `url(${p.card_image})` : 'none' }} role="img" aria-label={p.name}>
                {!p.card_image && '❄'}
              </div>
              <div className="product-body">
                <div className="product-brand">{p.brand || 'Premium AC'}</div>
                <div className="product-name">{p.name}</div>
                <div className="product-specs">
                  <span className="product-spec">{p.type}</span>
                  <span className="product-spec">{p.capacity}</span>
                </div>
                <div className="product-price">₹{p.price_per_day} <span>/day</span></div>
                <p className="product-desc">{p.short_desc || `${p.type} - ${p.capacity}`}</p>
                <div className="product-actions">
                  <button className="btn-rent" onClick={() => onRent(p)}>Rent Now</button>
                  <Link to={`/product/${p.id}`} className="btn-details">Details</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
