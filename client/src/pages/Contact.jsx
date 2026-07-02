import { useState } from 'react';
import { api } from '../api';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.message) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      await api.submitContact(form);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="form-page">
        <div className="form-card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <h1>Message Sent!</h1>
          <p style={{ color: 'var(--text-light)', marginBottom: 24 }}>Thank you for reaching out. We'll get back to you shortly.</p>
          <a href="/" className="btn btn-primary" style={{ background: 'var(--primary)', color: 'white', textDecoration: 'none' }}>Back to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <div className="form-card">
        <h1>Contact Us</h1>
        <p className="form-subtitle">Have a question? We'd love to hear from you.</p>

        {error && <div className="form-error" style={{ display: 'block' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Your Name *</label>
            <input name="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Email Address *</label>
            <input name="email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input name="phone" type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Message *</label>
            <textarea name="message" rows={5} value={form.message} onChange={e => setForm({...form, message: e.target.value})} required />
          </div>
          <button type="submit" className="btn-submit" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>

        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #e2e8f0' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Other Ways to Reach Us</h3>
          <p style={{ color: 'var(--text-light)' }}>Email: info@coolcruze.in</p>
          <p style={{ color: 'var(--text-light)' }}>WhatsApp: +91 79774 71369</p>
          <p style={{ color: 'var(--text-light)' }}>Location: Mumbai, Maharashtra</p>
        </div>
      </div>
    </div>
  );
}
