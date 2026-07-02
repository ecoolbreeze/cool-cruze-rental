export default function About() {
  return (
    <>
      <section className="about-hero">
        <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', marginBottom: 12 }}>About Cool Cruze</h1>
        <p style={{ color: '#d4d4d8', fontSize: 16 }}>Mumbai's trusted AC rental service since 2024</p>
      </section>

      <section className="about-content">
        <h2>Your Cooling Partner in Mumbai</h2>
        <p>
          Cool Cruze is a Mumbai-based AC rental company specializing in high-quality cooling solutions for events, offices, warehouses, and commercial spaces. We provide a wide range of air conditioners including Tower ACs, Portable ACs, Ductable ACs, and Cassette ACs with capacities ranging from 1.5 Ton to 8.5 Ton.
        </p>
        <p>
          Our mission is to make premium cooling accessible and affordable for every business and event in Mumbai. With transparent pricing, free delivery and installation, and round-the-clock maintenance support, we ensure your space stays comfortable without any hassle.
        </p>

        <div className="stats-grid">
          {[
            { number: '50+', label: 'Happy Clients' },
            { number: '100+', label: 'ACs Delivered' },
            { number: '24/7', label: 'Support' },
            { number: '4.9★', label: 'Avg Rating' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-number">{s.number}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <h2>Why Choose Cool Cruze?</h2>
        <p>
          We understand that every space has unique cooling requirements. That's why we offer flexible rental plans — daily, weekly, monthly, and quarterly — with no long-term commitments. Our team handles everything from delivery and installation to maintenance and pickup, so you can focus on what matters.
        </p>
        <p>
          All our ACs are sourced from top brands and undergo regular servicing to ensure optimal performance. Whether you need temporary cooling for a weekend event or a long-term solution for your office or warehouse, Cool Cruze delivers.
        </p>
        <p>
          <strong>Located in Mumbai, serving all areas. Contact us today for a free consultation.</strong>
        </p>
      </section>
    </>
  );
}
