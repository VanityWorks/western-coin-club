import { useState } from 'react'
import './Page.css'
import './Membership.css'

const provinces = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
  'Outside of South Africa',
]

const interests = [
  'Ancient Coins',
  'Medieval Coins',
  'South African Republic (ZAR)',
  'Union of South Africa',
  'Republic of South Africa',
  'Modern Bullion Coins',
  'Gold Coins',
  'Silver Coins',
  'World Coins',
  'Error Coins',
  'Pattern Coins',
  'Medals & Tokens',
  'Banknotes',
  'Other',
]

export default function Join() {
  const [referral, setReferral] = useState('no')

  return (
    <main className="page membership-page join-page">
      <section className="page-hero">
        <h1>Join The Club</h1>
        <p>Complete your membership application</p>
      </section>
      <section className="page-content">
        <div className="container narrow">
          <form className="membership-form" onSubmit={(e) => e.preventDefault()}>
            <fieldset>
              <legend>Personal Details</legend>
              <div className="form-grid">
                <label>
                  <span>First Name <span className="required">*</span></span>
                  <input type="text" required placeholder="e.g. John" />
                </label>
                <label>
                  <span>Surname <span className="required">*</span></span>
                  <input type="text" required placeholder="e.g. Smith" />
                </label>
                <label>
                  <span>Email <span className="required">*</span></span>
                  <input type="email" required placeholder="john@example.com" />
                </label>
                <label>
                  <span>Mobile <span className="required">*</span></span>
                  <input type="tel" required placeholder="+27 XX XXX XXXX" />
                </label>
                <label>
                  <span>WhatsApp Number <span className="required">*</span></span>
                  <input type="tel" required placeholder="+27 XX XXX XXXX" />
                </label>
                <label className="full">
                  <span>Physical Address <span className="required">*</span></span>
                  <input type="text" required placeholder="Street address" />
                </label>
                <label>
                  <span>Town / City <span className="required">*</span></span>
                  <input type="text" required placeholder="e.g. Cape Town" />
                </label>
                <label>
                  <span>Region / Province <span className="required">*</span></span>
                  <select required defaultValue="">
                    <option value="" disabled>Select province</option>
                    {provinces.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Country <span className="required">*</span></span>
                  <select required defaultValue="ZA">
                    <option value="ZA">South Africa</option>
                    <option value="other">Other</option>
                  </select>
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Collecting Interests</legend>
              <p className="field-hint">Select all that apply</p>
              <div className="checkbox-grid">
                {interests.map((i) => (
                  <label key={i} className="checkbox-label">
                    <input type="checkbox" />
                    <span>{i}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>Member Referral</legend>
              <label className="radio-group">
                <input
                  type="radio"
                  name="referral"
                  value="yes"
                  checked={referral === 'yes'}
                  onChange={() => setReferral('yes')}
                />
                <span>Yes</span>
              </label>
              <label className="radio-group">
                <input
                  type="radio"
                  name="referral"
                  value="no"
                  checked={referral === 'no'}
                  onChange={() => setReferral('no')}
                />
                <span>No</span>
              </label>
              {referral === 'yes' && (
                <div className="referral-fields">
                  <label>
                    <span>Referring Member Name <span className="required">*</span></span>
                    <input type="text" required />
                  </label>
                  <label>
                    <span>Referring Membership Number <span className="required">*</span></span>
                    <input type="text" required />
                  </label>
                </div>
              )}
            </fieldset>

            <fieldset>
              <legend>Optional</legend>
              <div className="checkbox-grid">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Interested in events</span>
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Interested in buying coins</span>
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Interested in selling coins</span>
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Interested in learning / research</span>
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Interested in networking</span>
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Consent</legend>
              <label className="checkbox-label">
                <input type="checkbox" required />
                <span>I agree to receive club communications <span className="required">*</span></span>
              </label>
              <label className="checkbox-label">
                <input type="checkbox" required />
                <span>I accept the privacy policy <span className="required">*</span></span>
              </label>
            </fieldset>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary btn-lg">
                Submit Application
              </button>
              <p className="form-note">Demo only - form does not submit</p>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
