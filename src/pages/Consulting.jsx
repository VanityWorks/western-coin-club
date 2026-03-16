import './Page.css'
import './Consulting.css'

const services = [
  { title: 'Coin Identification', desc: 'Get expert help identifying unknown coins in your collection.' },
  { title: 'Collection Advice', desc: 'Guidance on building, organising, and preserving your collection.' },
  { title: 'Valuation Guidance', desc: 'Understand the market value of your coins and banknotes.' },
  { title: 'Auction & Selling Advice', desc: 'Tips for selling through auctions or private sales.' },
  { title: 'Grading Advice', desc: 'Learn about condition and professional grading standards.' },
  { title: 'Authentication', desc: 'Help verifying authenticity of coins and banknotes.' },
]

export default function Consulting() {
  return (
    <main className="page consulting-page">
      <section className="page-hero">
        <h1>Consulting Services</h1>
        <p>Expert guidance for collectors</p>
      </section>
      <section className="page-content">
        <div className="container">
          <div className="consulting-intro">
            <p>
              Our experienced members volunteer their time to help fellow collectors. Consulting fees 
              are considered a sponsorship contribution to the club, supporting our mission to promote 
              the world of coins in South Africa.
            </p>
          </div>
          <div className="services-grid">
            {services.map((s, i) => (
              <div key={i} className="service-card">
                <span className="service-icon">◎</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
          <hr className="consulting-separator" />
          <div className="consulting-form-wrap">
            <h2>Request a Consultation</h2>
            <form className="consulting-form" onSubmit={(e) => e.preventDefault()}>
              <div className="form-row">
                <label>
                  Name <span className="required">*</span>
                  <input type="text" required />
                </label>
                <label>
                  Email <span className="required">*</span>
                  <input type="email" required />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Phone <span className="required">*</span>
                  <input type="tel" required />
                </label>
                <label>
                  Type of consulting
                  <select>
                    <option>Coin Identification</option>
                    <option>Collection Advice</option>
                    <option>Valuation</option>
                    <option>Auction / Selling</option>
                    <option>Grading</option>
                    <option>Authentication</option>
                  </select>
                </label>
              </div>
              <label>
                Preferred contact method
                <select>
                  <option>Email</option>
                  <option>Phone</option>
                  <option>WhatsApp</option>
                </select>
              </label>
              <label>
                Message (optional)
                <textarea rows={4} placeholder="Describe your enquiry..."></textarea>
              </label>
              <button type="submit" className="btn btn-primary">Submit Request</button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
