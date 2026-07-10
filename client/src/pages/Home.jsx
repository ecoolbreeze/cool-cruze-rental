import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Carousel from 'react-bootstrap/Carousel';
import { api } from '../api';

const HERO_IMAGES = ['/uploads/hero.png', '/uploads/hero-1.png', '/uploads/hero-2.png', '/uploads/hero-3.png'];
const HERO_FULL_BLEED_INDEX = 3;

const BENEFITS = [
  { icon: '✅', title: 'High-Quality Units', desc: 'Premium branded ACs for reliable, powerful cooling in any space.' },
  { icon: '💸', title: 'Transparent Pricing', desc: 'No hidden charges. Daily, weekly, monthly, or quarterly rentals.' },
  { icon: '🚚', title: 'Free Delivery & Setup', desc: 'Free delivery, installation & pickup in Mumbai.' },
  { icon: '🛡️', title: 'Hassle-Free Service', desc: 'Free maintenance, repairs & replacement.' },
];

const STEPS = [
  { icon: '📞', title: 'Contact Us', desc: 'Call or WhatsApp us with your cooling needs' },
  { icon: '🔍', title: 'Choose Equipment', desc: 'Select from Tower, Portable, Ductable & Cassette ACs' },
  { icon: '🚚', title: 'Free Installation', desc: 'We deliver, install & demonstrate on-site' },
  { icon: '❄️', title: 'Enjoy Cooling', desc: 'Reliable cooling with free maintenance & support' },
];

const TESTIMONIALS = [
  { name: 'Rahul Sharma', title: 'Event Organizer', text: 'Cool Cruze provided 10 ACs for our 3-day corporate event. Professional setup and flawless cooling throughout.', initials: 'RS' },
  { name: 'Priya Patel', title: 'Office Manager', text: 'We rent 5 Tower ACs monthly for our office. Their maintenance team is always prompt and professional.', initials: 'PP' },
  { name: 'Amit Verma', title: 'Warehouse Owner', text: 'Required 8.5 Ton ductable ACs for our warehouse. Cool Cruze delivered and installed within 24 hours. Excellent service!', initials: 'AV' },
];

const FAQS = [
  { q: 'What types of ACs do you offer for rent?', a: 'We offer Tower AC, Portable AC, Ductable AC, and Cassette AC in capacities from 1.5 Ton to 8.5 Ton.' },
  { q: 'How quickly can you deliver and install?', a: 'We typically deliver and install within 24-48 hours across Mumbai.' },
  { q: 'Is maintenance included in the rental?', a: 'Yes, all rentals include free maintenance, repairs, and replacement if needed.' },
  { q: 'What is the minimum rental period?', a: 'We offer flexible rentals starting from 1 day.' },
  { q: 'Do you provide ACs for events?', a: 'Yes, we specialize in temporary cooling solutions for events, exhibitions, and weddings.' },
];

export default function Home({ onRent }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [products, setProducts] = useState([]);
  const [faqOpen, setFaqOpen] = useState(null);
  const carouselRef = useRef(null);

  useEffect(() => {
    api.getProducts().then(setProducts).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex(i => (i + 1) % HERO_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const isFullBleed = slideIndex === HERO_FULL_BLEED_INDEX;

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-slideshow">
          {HERO_IMAGES.map((src, i) => (
            <img key={i} src={src} alt={`AC Rental Mumbai - Hero ${i + 1}`} className={`hero-slide${i === slideIndex ? ' active' : ''}${i !== 0 ? '' : ''}`} style={i === 0 ? { position: 'relative' } : {}} loading={i === 0 ? 'eager' : 'lazy'} />
          ))}
        </div>
        {!isFullBleed && (
          <div className="hero-overlay" />
        )}
        {!isFullBleed && (
          <div className="hero-content">
            <h1>Premium {products[0]?.type || 'Tower'} AC Rental in Mumbai</h1>
            <p>Flexible AC rentals for events, offices, warehouses &amp; commercial spaces. Free delivery, installation &amp; maintenance.</p>
            <div className="hero-buttons">
              <Link to="/products" className="btn btn-primary">Browse ACs</Link>
              <a href="https://wa.me/917977471369" target="_blank" rel="noopener noreferrer" className="btn btn-outline">Chat on WhatsApp</a>
            </div>
          </div>
        )}
      </section>

      {/* CAROUSEL */}
      <div className="carousel-section" ref={carouselRef}>
        <div className="carousel-container">
          <Carousel interval={null} indicators={true} prevLabel="‹" nextLabel="›" prevIcon={<span style={{fontSize:26,lineHeight:1}}>‹</span>} nextIcon={<span style={{fontSize:26,lineHeight:1}}>›</span>}>
            {Array.from({ length: Math.ceil(products.length / 3) }).map((_, slideIdx) => (
              <Carousel.Item key={slideIdx}>
                <div className="carousel-track" style={{ display: 'flex' }}>
                  {products.slice(slideIdx * 3, slideIdx * 3 + 3).map(p => (
                    <div key={p.id} className="carousel-item" style={{ flex: '0 0 33.333%', padding: '8px', boxSizing: 'border-box' }}>
                      <div className="carousel-card">
                        <div className="carousel-img" style={{ backgroundImage: p.card_image ? `url(${p.card_image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                          {!p.card_image && '❄'}
                        </div>
                        <div className="carousel-body">
                          <div className="carousel-brand">{p.brand || 'Premium AC'}</div>
                          <div className="carousel-name">{p.name}</div>
                          <div className="carousel-tags">
                            <span>{p.type}</span>
                            <span>{p.capacity}</span>
                          </div>
                          <div className="carousel-price">₹{p.price_per_day} <span>/day</span></div>
                          <div className="carousel-actions">
                            <button className="carousel-rent-btn" onClick={() => onRent(p)}>Rent Now</button>
                            <Link to={`/product/${p.id}`} className="carousel-details-btn">Details</Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
        </div>
      </div>

      {/* BENEFITS */}
      <section className="section">
        <div className="section-title">
          <h2>Why Mumbai Chooses Cool Cruze</h2>
          <p>Reliable cooling solutions with unmatched service and support</p>
          <div className="accent-line" />
        </div>
        <div className="benefits-grid">
          {BENEFITS.map((b, i) => (
            <div key={i} className="benefit-card">
              <div className="benefit-icon">{b.icon}</div>
              <h3>{b.title}</h3>
              <p>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCTS */}
      {products.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="section-title">
            <h2>Our Standing AC Rental &amp; Cooling Solutions</h2>
            <p>Premium brands, flexible plans, free installation</p>
            <div className="accent-line" />
          </div>
          <div className="products-grid">
            {products.slice(0, 4).map(p => (
              <div key={p.id} className="product-card">
                <div className="product-img" style={{ backgroundImage: p.card_image ? `url(${p.card_image})` : 'none' }}>
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
                  <p className="product-desc">{p.short_desc || `${p.type} - ${p.capacity} for reliable cooling`}</p>
                  <div className="product-actions">
                    <button className="btn-rent" onClick={() => onRent(p)}>Rent Now</button>
                    <Link to={`/product/${p.id}`} className="btn-details">Details</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* STEPS */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-title">
          <h2>Reliable HVAC Support for Events, Offices &amp; Industries</h2>
          <p>Get started in 4 simple steps</p>
          <div className="accent-line" />
        </div>
        <div className="steps-row">
          {STEPS.map((s, i) => (
            <>
              {i > 0 && <span className="step-connector">›</span>}
              <div key={i} className="step-card-square">
                <span className="step-number">0{i + 1}</span>
                <div className="step-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-title">
          <h2>What Our Customers Say</h2>
          <div className="accent-line" />
        </div>
        <div className="testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="testimonial-card">
              <div className="testimonial-stars">{'★'.repeat(5)}</div>
              <p className="testimonial-text">"{t.text}"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{t.initials}</div>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-title">{t.title}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-title">
          <h2>Frequently Asked Questions</h2>
          <div className="accent-line" />
        </div>
        <div className="faq-list">
          {FAQS.map((f, i) => (
            <div key={i} className={`faq-item${faqOpen === i ? ' open' : ''}`}>
              <button className="faq-question" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                {f.q}
                <span className="faq-arrow">▼</span>
              </button>
              <div className="faq-answer">
                <p>{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="about-hero">
        <h2 style={{ fontSize: 'clamp(24px,3vw,36px)', marginBottom: 12 }}>Ready to Stay Cool?</h2>
        <p style={{ color: '#d4d4d8', marginBottom: 24, fontSize: 16 }}>Get your AC rental started today. Free delivery across Mumbai.</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/products" className="btn btn-primary" style={{ background: 'white', color: 'var(--primary)' }}>Browse ACs</Link>
          <a href="https://wa.me/917977471369" target="_blank" rel="noopener noreferrer" className="btn btn-outline">Chat on WhatsApp</a>
        </div>
      </section>
    </>
  );
}
