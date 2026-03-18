import { Link } from 'react-router-dom'
import './Page.css'
import './Membership.css'

const membershipFee = { price: 'R120', desc: 'Full access to all club benefits' }

const welcomePack = [
  'Official Membership Certificate issued in your name',
  'South African Coin Collectors Club Membership Card',
  'Welcome Letter from the club',
  'SANGS Pedigree Coin — graded, registered, and attributed to your name',
  'Access to the Hern\'s Pocket Guide - available on the App Store and Google Play',
  'SANGS Grading Voucher',
  'Bassani\'s No Seller\'s Commission Voucher',
  'Investment Coin & Bullion Voucher',
  'Bucks & Gems Voucher',
  'A Special Numismatic Welcome Gift',
]

const benefits = [
  'Access to collector community',
  'Educational articles and news',
  'Member networking opportunities',
  'Coin market insights',
  'Events and special activities',
  'Member recognition',
]

export default function Membership() {
  return (
    <main className="page membership-page">
      <section className="page-hero">
        <h1>Become a Member</h1>
        <p>Join South Africa's welcoming coin community</p>
      </section>
      <section className="page-content">
        <div className="container">
          <div className="membership-intro">
            <p>
              When you join the South African Coin Collectors Club, you receive a welcome pack and access to benefits designed to support and grow your coin collecting journey.
            </p>
          </div>

          <div className="membership-pricing-block">
            <div className="membership-pricing-card">
              <div className="membership-price">{membershipFee.price}<span>/year</span></div>
              <p>{membershipFee.desc}</p>
              <Link to="/join" className="btn btn-primary btn-lg">Join The Club</Link>
            </div>
          </div>

          <div className="membership-welcome-pack">
            <h2>Your Membership Welcome Pack Includes</h2>
            <ul>
              {welcomePack.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="membership-benefits">
            <h2>Member Benefits</h2>
            <ul>
              {benefits.map((b, i) => (
                <li key={i}><span className="benefit-icon">◎</span>{b}</li>
              ))}
            </ul>
          </div>

          <div className="membership-cta">
            <Link to="/join" className="btn btn-primary btn-lg">Join The Club</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
