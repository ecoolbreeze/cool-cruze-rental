import { useState, useCallback } from 'react';
import { api } from '../api';

const MONTHS = 12;
const PRICING = {
  'Tower AC': { '1.5 Ton': 149, '3.5 Ton': 199, '5.5 Ton': 299, '8.5 Ton': 399 },
  'Portable AC': { '1.5 Ton': 179, '3.5 Ton': 229, '5.5 Ton': 329, '8.5 Ton': 429 },
  'Ductable AC': { '1.5 Ton': 199, '3.5 Ton': 249, '5.5 Ton': 349, '8.5 Ton': 449 },
  'Cassette AC': { '1.5 Ton': 189, '3.5 Ton': 239, '5.5 Ton': 339, '8.5 Ton': 439 },
};

function getTiers(product) {
  const base = PRICING[product.type]?.[product.capacity] || product.price_per_day;
  return [
    { months: 1, label: '1 Day', pricePerDay: base, price: base },
    { months: 7, label: 'Weekly (7 Days)', pricePerDay: Math.round(base * 0.9), price: Math.round(base * 0.9 * 7) },
    { months: 30, label: 'Monthly (30 Days)', pricePerDay: Math.round(base * 0.75), price: Math.round(base * 0.75 * 30) },
    { months: 90, label: 'Quarterly (90 Days)', pricePerDay: Math.round(base * 0.6), price: Math.round(base * 0.6 * 90) },
  ];
}

export default function RentModal({ product, onClose }) {
  const tiers = product ? getTiers(product) : [];
  const maxIndex = tiers.length - 1;
  const [months, setMonths] = useState(0);
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const tier = tiers[months] || tiers[0];
  const { pricePerDay, price: totalPrice, label } = tier;

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.phone) { setError('Name and phone are required'); return; }
    setSubmitting(true);
    try {
      await api.submitRent(product.id, {
        ...form,
        months: tier.months,
        pricePerDay,
        totalPrice
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [form, product, tier, pricePerDay, totalPrice]);

  const whatsappMsg = encodeURIComponent(
    `Hi! I'm interested in renting ${product.name} (${product.type} - ${product.capacity}) for ${label}. Price: ₹${totalPrice}. Please share more details.`
  );

  if (!product) return null;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        {success ? (
          <div className="modal-success">
            <div className="check">✅</div>
            <h3>Request Sent!</h3>
            <p>We'll contact you shortly at {form.phone}.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <a href={`https://wa.me/917977471369?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" className="btn-wa" style={{ padding: '12px 24px' }}>
                Chat on WhatsApp
              </a>
              <button className="btn btn-primary" style={{ background: 'var(--primary)', color: 'white' }} onClick={onClose}>Done</button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="modal-title">{product.name}</h2>
            <p className="modal-subtitle">{product.type} - {product.capacity}</p>

            <div className="rent-calculator">
              <div className="calc-header">
                <span className="calc-header-icon">📅</span>
                <div>
                  <div className="calc-title">Rent Calculator</div>
                  <div className="calc-subtitle">Slide to select duration</div>
                </div>
              </div>
              <div className="calc-slider-wrap">
                <div className="calc-slider-header">
                  <span>₹{totalPrice}</span>
                  <span> ({label})</span>
                </div>
                <input type="range" className="calc-slider" min={0} max={maxIndex} step={1} value={months} onChange={e => setMonths(Number(e.target.value))} />
                <div className="calc-slider-labels">
                  {tiers.map((t, i) => <span key={i}>{t.label.split(' ')[0]}</span>)}
                </div>
              </div>
              <div className="calc-results">
                <div className="calc-result-row">
                  <span className="calc-result-label">Duration</span>
                  <span className="calc-result-value">{label}</span>
                </div>
                <div className="calc-result-row">
                  <span className="calc-result-label">Rate</span>
                  <span className="calc-result-value">₹{pricePerDay}/day</span>
                </div>
                <div className="calc-result-row calc-total-row">
                  <span className="calc-result-label">Total</span>
                  <span className="calc-result-value">₹{totalPrice}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <a href={`https://wa.me/917977471369?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" className="btn-wa" style={{ flex: 1 }}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            </div>

            <div style={{ marginTop: 16, textAlign: 'center', color: 'var(--text-light)', fontSize: 14 }}>
              <span>or fill the form below</span>
            </div>

            <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
              {error && <div className="form-error" style={{ display: 'block' }}>{error}</div>}
              <div className="form-group">
                <input name="name" placeholder="Your Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <input name="phone" placeholder="Phone Number *" type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
              </div>
              <div className="form-group">
                <input name="email" placeholder="Email (optional)" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="form-group">
                <textarea name="message" placeholder="Message (optional)" rows={3} value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
              </div>
              <button type="submit" className="btn-submit" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Request'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
