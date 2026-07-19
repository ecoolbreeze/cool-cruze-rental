import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';

export default function ProductDetail({ onRent }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImg, setMainImg] = useState('');

  useEffect(() => {
    api.getProduct(id).then(p => {
      setProduct(p);
      setLoading(false);
      const images = p.detail_images || [];
      setMainImg(images[0] || p.card_image || '');
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="section" style={{ textAlign: 'center', padding: '80px 24px' }}>Loading...</div>;
  if (!product) return <div className="section" style={{ textAlign: 'center', padding: '80px 24px' }}>Product not found.</div>;

  const images = (product.detail_images || []).filter(Boolean);
  const specs = [
    { icon: '❄️', label: 'Type', value: product.type },
    { icon: '📏', label: 'Capacity', value: product.capacity },
    { icon: '🏷️', label: 'Brand', value: product.brand || 'Premium' },
  ];
  const features = product.features || ['Energy Efficient', 'Low Noise', 'Quick Cooling', 'Eco-Friendly Gas'];
  const benefits = [
    { icon: '✅', text: 'Free installation & demo on-site' },
    { icon: '🔧', text: 'Free maintenance & repairs throughout rental' },
    { icon: '🔄', text: 'Free replacement if unit malfunctions' },
    { icon: '🚚', text: 'Free pickup at end of rental' },
  ];

  const handleImageClick = (img) => setMainImg(img);
  const whatsappMsg = encodeURIComponent(`Hi! I'm interested in renting ${product.name} (${product.type} - ${product.capacity}). Please share more details.`);

  return (
    <div className="detail-page">
      <Link to="/products" className="back-link">← Back to Products</Link>
      <div className="detail-layout">
        <div className="detail-gallery">
          <div className="detail-main-img" style={{ backgroundImage: mainImg ? `url(${mainImg})` : 'none', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundColor: '#f1f5f9' }} role="img" aria-label={product.name}>
            {!mainImg && <span style={{ fontSize: 64, color: 'var(--text-light)' }}>❄</span>}
          </div>
          {images.length > 0 && (
            <div className="detail-thumbs">
              {images.map((img, i) => (
                <div key={i} className={`detail-thumb${img === mainImg ? ' active' : ''}`} style={{ backgroundImage: `url(${img})` }} onClick={() => handleImageClick(img)} role="button" tabIndex={0} aria-label={`View image ${i + 1}`} onKeyDown={e => e.key === 'Enter' && handleImageClick(img)} />
              ))}
            </div>
          )}
        </div>
        <div className="detail-info">
          <div className="detail-brand">{product.brand || 'Premium AC'}</div>
          <h1 className="detail-title">{product.name}</h1>
          <div className="detail-price">₹{product.price_per_day} <span>/day</span></div>
          {product.price_per_week && <div className="detail-price-sub">Also available: Weekly ₹{product.price_per_week}/day | Monthly ₹{Math.round(product.price_per_day * 0.75)}/day</div>}

          <div className="detail-specs">
            {specs.map((s, i) => (
              <div key={i} className="detail-spec-item">
                <span className="detail-spec-icon">{s.icon}</span>
                <div>
                  <div className="detail-spec-label">{s.label}</div>
                  <div className="detail-spec-value">{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="detail-actions">
            <button className="btn-rent detail-rent-btn" onClick={() => onRent(product)}>Rent Now</button>
            <a href={`https://wa.me/917977471369?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" className="btn-wa">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
          </div>

          <div className="detail-description">
            <h3>Description</h3>
            <p>{product.description || `High-quality ${product.type} (${product.capacity}) perfect for commercial and industrial cooling needs.`}</p>
          </div>

          {features.length > 0 && (
            <div className="detail-features">
              <h3>Key Features</h3>
              <div className="detail-features-grid">
                {features.map((f, i) => <div key={i} className="detail-feature-item">✓ {f}</div>)}
              </div>
            </div>
          )}

          {product.specifications && (
            <div className="detail-specs">
              <h3>Specifications</h3>
              <table className="specs-table">
                <tbody>
                  {product.specifications.split('\n').map((line, i) => {
                    const parts = line.split('=');
                    if (parts.length === 2) return (
                      <tr key={i}>
                        <td className="spec-label">{parts[0].trim()}</td>
                        <td className="spec-value">{parts[1].trim()}</td>
                      </tr>
                    );
                    return null;
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="detail-benefits">
            <h3>What's Included</h3>
            <div className="benefits-list">
              {benefits.map((b, i) => (
                <div key={i} className="benefit-row">
                  <span>{b.icon}</span>
                  <span>{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
