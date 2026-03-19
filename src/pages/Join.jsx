import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Page.css'
import './Membership.css'
import './Join.css'

// ── Update these with your real banking details ───────────
const EFT = {
  bankName:      'First National Bank',
  accountName:   'Numismatic Holdings (PTY) LTD',
  accountNumber: '63201968625',
  branchCode:    '210554',
  accountType:   'Platinum Business Account',
  swiftCode:     'FIRNZAJJ',
  amount:        'R120.00',
  paymentRef:    'Use your reference number below',
}
// ──────────────────────────────────────────────────────────

const provinces = [
  'Eastern Cape','Free State','Gauteng','KwaZulu-Natal',
  'Limpopo','Mpumalanga','Northern Cape','North West',
  'Western Cape','Outside of South Africa',
]

const interests = [
  'Ancient Coins','Medieval Coins','Zuid-Afrikaansche Republiek (ZAR)',
  'Union of South Africa','Republic of South Africa','Modern Bullion Coins',
  'Gold Coins','Silver Coins','World Coins','Error Coins',
  'Pattern Coins','Medals & Tokens','Banknotes','Other',
]

function EFTSuccess({ referenceNumber }) {
  return (
    <main className="page membership-page join-page">
      <section className="page-hero">
        <h1>Application Received</h1>
        <p>Complete your EFT payment to finalise membership</p>
      </section>
      <section className="page-content">
        <div className="container narrow">
          <div className="eft-success-wrap">
            <div className="eft-ref-card">
              <p className="eft-ref-label">Your unique reference number</p>
              <p className="eft-ref-number">{referenceNumber}</p>
              <p className="eft-ref-note">Use this as your payment reference. Save it — you'll need it.</p>
            </div>

            <div className="eft-details-card">
              <h2>EFT Payment Details</h2>
              <p className="eft-instructions">
                Please make an EFT payment to the account below. Your application will be reviewed
                once payment is confirmed. You will receive an email with your login credentials upon approval.
              </p>
              <div className="eft-table">
                <div className="eft-row"><span>Bank</span><strong>{EFT.bankName}</strong></div>
                <div className="eft-row"><span>Account Name</span><strong>{EFT.accountName}</strong></div>
                <div className="eft-row"><span>Account Number</span><strong>{EFT.accountNumber}</strong></div>
                <div className="eft-row"><span>Branch Code</span><strong>{EFT.branchCode}</strong></div>
                <div className="eft-row"><span>Account Type</span><strong>{EFT.accountType}</strong></div>
                <div className="eft-row"><span>Swift Code</span><strong>{EFT.swiftCode}</strong></div>
                <div className="eft-row"><span>Amount</span><strong className="eft-amount">{EFT.amount} / year</strong></div>
                <div className="eft-row eft-row-ref">
                  <span>Reference</span>
                  <strong className="eft-ref-inline">{referenceNumber}</strong>
                </div>
              </div>
            </div>

            <div className="eft-early-banner">
              <p className="eft-early-title">Wow - you're one of the early member signups.</p>
              <p>Secure your spot now and be part of something special from the very beginning. We truly value your early support.</p>
              <p>Please note: full mobile app access and the shipping of your welcome pack will only commence after the official launch on <strong>29 March at the Johannesburg Coin Show</strong>.</p>
              <p className="eft-early-congrats">Congratulations - you're early and part of the inner circle.</p>
            </div>

            <div className="eft-next-steps">
              <h3>What happens next?</h3>
              <ol>
                <li>Make the EFT payment using <strong>{referenceNumber}</strong> as your reference.</li>
                <li>Our team will verify your payment (usually within 1–2 business days).</li>
                <li>Once approved, you'll receive an email with your membership login details.</li>
                <li>Use those credentials to access the Members Forum and all club benefits.</li>
              </ol>
            </div>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <a href="/" className="btn btn-primary">Back to Home</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default function Join() {
  const [searchParams] = useSearchParams()
  const [referral, setReferral] = useState('no')
  const [referralNumber, setReferralNumber] = useState('')
  const [referralName, setReferralName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [referenceNumber, setReferenceNumber] = useState(() => localStorage.getItem('wccc_join_ref') || null)

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (!ref) return
    setReferral('yes')

    // Look up the referrer's name and membership number from their user ID or membership number
    async function resolveReferrer() {
      const isUuid = /^[0-9a-f-]{36}$/i.test(ref)

      // Always resolve to a profile row
      let profileData = null
      if (isUuid) {
        const { data } = await supabase
          .from('profiles')
          .select('display_name, membership_number')
          .eq('id', ref)
          .maybeSingle()
        profileData = data
      } else {
        // ref is a membership number
        const { data } = await supabase
          .from('profiles')
          .select('display_name, membership_number')
          .eq('membership_number', ref)
          .maybeSingle()
        profileData = data
      }

      if (profileData?.display_name) setReferralName(profileData.display_name)
      if (profileData?.membership_number) setReferralNumber(profileData.membership_number)
    }

    resolveReferrer()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const fd = new FormData(e.target)

    // Generate reference number client-side
    const surname = (fd.get('surname') || '').trim()
    const digits = Math.floor(1000 + Math.random() * 9000)
    const refNumber = `${surname}${digits}`

    const { error: dbError } = await supabase.from('membership_applications').insert({
      reference_number: refNumber,
      first_name:       fd.get('firstName') || '',
      surname:          fd.get('surname') || '',
      email:            fd.get('email') || '',
      mobile:           fd.get('mobile') || '',
      whatsapp:         fd.get('whatsapp') || '',
      address:          fd.get('address') || '',
      city:             fd.get('city') || '',
      province:         fd.get('province') || '',
      country:          fd.get('country') || 'ZA',
      interests:        fd.getAll('interests'),
      referral:         fd.get('referral') === 'yes',
      referral_name:    fd.get('referralName') || null,
      referral_number:  fd.get('referralNumber') || null,
      optionals: [
        fd.get('optEvents')     ? 'Events'              : null,
        fd.get('optBuying')     ? 'Buying coins'        : null,
        fd.get('optSelling')    ? 'Selling coins'       : null,
        fd.get('optLearning')   ? 'Learning / research' : null,
        fd.get('optNetworking') ? 'Networking'          : null,
      ].filter(Boolean),
    })

    if (dbError) {
      setError('Something went wrong submitting your application. Please try again.')
      setLoading(false)
      return
    }

    localStorage.setItem('wccc_join_ref', refNumber)
    setReferenceNumber(refNumber)
    setLoading(false)
  }

  if (referenceNumber) {
    return <EFTSuccess referenceNumber={referenceNumber} />
  }

  return (
    <main className="page membership-page join-page">
      <section className="page-hero">
        <h1>Join The Club</h1>
        <p>Complete your membership application</p>
      </section>
      <section className="page-content">
        <div className="container narrow">
          <div className="join-price-banner">
            <span className="join-price-amount">R120</span>
            <span className="join-price-label">/ year membership</span>
          </div>

          <form className="membership-form" onSubmit={handleSubmit}>
            <fieldset>
              <legend>Personal Details</legend>
              <div className="form-grid">
                <label>
                  <span>First Name <span className="required">*</span></span>
                  <input type="text" name="firstName" required placeholder="e.g. John" />
                </label>
                <label>
                  <span>Surname <span className="required">*</span></span>
                  <input type="text" name="surname" required placeholder="e.g. Smith" />
                </label>
                <label>
                  <span>Email <span className="required">*</span></span>
                  <input type="email" name="email" required placeholder="john@example.com" />
                </label>
                <label>
                  <span>Mobile <span className="required">*</span></span>
                  <input type="tel" name="mobile" required placeholder="+27 XX XXX XXXX" />
                </label>
                <label>
                  <span>WhatsApp Number <span className="required">*</span></span>
                  <input type="tel" name="whatsapp" required placeholder="+27 XX XXX XXXX" />
                </label>
                <label className="full">
                  <span>Physical Address <span className="required">*</span></span>
                  <input type="text" name="address" required placeholder="Street address" />
                </label>
                <label>
                  <span>Town / City <span className="required">*</span></span>
                  <input type="text" name="city" required placeholder="e.g. Cape Town" />
                </label>
                <label>
                  <span>Region / Province <span className="required">*</span></span>
                  <select name="province" required defaultValue="">
                    <option value="" disabled>Select province</option>
                    {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
                <label>
                  <span>Country <span className="required">*</span></span>
                  <select name="country" defaultValue="ZA">
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
                    <input type="checkbox" name="interests" value={i} />
                    <span>{i}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>Member Referral</legend>
              <label className="radio-group">
                <input type="radio" name="referral" value="yes" checked={referral === 'yes'} onChange={() => setReferral('yes')} />
                <span>Yes</span>
              </label>
              <label className="radio-group">
                <input type="radio" name="referral" value="no" checked={referral === 'no'} onChange={() => setReferral('no')} />
                <span>No</span>
              </label>
              {referral === 'yes' && (
                <div className="referral-fields">
                  <label>
                    <span>Referring Member Name <span className="required">*</span></span>
                    <input type="text" name="referralName" required value={referralName} onChange={e => setReferralName(e.target.value)} />
                  </label>
                  <label>
                    <span>Referring Membership Number <span className="required">*</span></span>
                    <input type="text" name="referralNumber" required value={referralNumber} onChange={e => setReferralNumber(e.target.value)} />
                  </label>
                </div>
              )}
            </fieldset>

            <fieldset>
              <legend>Optional</legend>
              <div className="checkbox-grid">
                <label className="checkbox-label"><input type="checkbox" name="optEvents"     value="1" /><span>Interested in events</span></label>
                <label className="checkbox-label"><input type="checkbox" name="optBuying"     value="1" /><span>Interested in buying coins</span></label>
                <label className="checkbox-label"><input type="checkbox" name="optSelling"    value="1" /><span>Interested in selling coins</span></label>
                <label className="checkbox-label"><input type="checkbox" name="optLearning"   value="1" /><span>Interested in learning / research</span></label>
                <label className="checkbox-label"><input type="checkbox" name="optNetworking" value="1" /><span>Interested in networking</span></label>
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

            {error && <p className="form-error">{error}</p>}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? 'Submitting…' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
