import { useState } from 'react'
import { supabase } from '../lib/supabase'
import './Page.css'
import './Contact.css'

/*
  SQL (run once):
  CREATE TABLE contact_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    name text NOT NULL,
    email text NOT NULL,
    subject text,
    message text NOT NULL
  );
  ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "anyone_insert" ON contact_messages FOR INSERT WITH CHECK (true);
  CREATE POLICY "auth_select" ON contact_messages FOR SELECT TO authenticated USING (true);
*/

export default function Contact() {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSending(true)
    setError('')

    const fd = new FormData(e.target)
    const { error: dbErr } = await supabase.from('contact_messages').insert({
      name: fd.get('name'),
      email: fd.get('email'),
      subject: fd.get('subject'),
      message: fd.get('message'),
    })

    if (dbErr) {
      setError('Something went wrong. Please try emailing us directly.')
    } else {
      setSent(true)
    }
    setSending(false)
  }

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
            {sent ? (
              <div className="contact-success">
                <i className="fa-solid fa-circle-check" />
                <h3>Message Sent</h3>
                <p>Thank you for reaching out. We'll get back to you as soon as possible.</p>
                <button className="btn btn-secondary" onClick={() => setSent(false)}>Send Another Message</button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <label>
                  <span>Name <span className="required">*</span></span>
                  <input type="text" name="name" required />
                </label>
                <label>
                  <span>Email <span className="required">*</span></span>
                  <input type="email" name="email" required />
                </label>
                <label>
                  Subject
                  <select name="subject">
                    <option>General enquiry</option>
                    <option>Membership</option>
                    <option>Consulting</option>
                    <option>Events</option>
                    <option>Other</option>
                  </select>
                </label>
                <label>
                  <span>Message <span className="required">*</span></span>
                  <textarea name="message" rows={5} required placeholder="Your message..."></textarea>
                </label>
                {error && <p className="contact-error">{error}</p>}
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
