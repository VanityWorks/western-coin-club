import './Page.css'
import './Contact.css'

export default function Contact() {
  return (
    <main className="page contact-page">
      <section className="page-hero">
        <h1>Contact Us</h1>
        <p>Get in touch with the South African Coin Collectors Club</p>
      </section>
      <section className="page-content">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <h2>Reach Out</h2>
              <p>Have a question about membership, consulting, or the club? We'd love to hear from you.</p>
              <div className="contact-details">
                <p><strong>Email:</strong> hello@coinclub.co.za</p>
                <p><strong>WhatsApp:</strong> +27 82 577 6062</p>
              </div>
            </div>
            <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
              <label>
                <span>Name <span className="required">*</span></span>
                <input type="text" required />
              </label>
              <label>
                <span>Email <span className="required">*</span></span>
                <input type="email" required />
              </label>
              <label>
                Subject
                <select>
                  <option>General enquiry</option>
                  <option>Membership</option>
                  <option>Consulting</option>
                  <option>Events</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                <span>Message <span className="required">*</span></span>
                <textarea rows={5} required placeholder="Your message..."></textarea>
              </label>
              <button type="submit" className="btn btn-primary">Send Message</button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
