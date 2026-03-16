import { Link } from 'react-router-dom'
import './Home.css'

const latestNews = [
  { id: 1, title: '2026 Krugerrand Design Unveiled', summary: 'The annual release brings fresh excitement for bullion collectors.', date: 'Mar 12, 2026', image: '/news-krugerrand.png' },
  { id: 2, title: 'ZAR Coins: A Collector\'s Guide', summary: 'Deep dive into South African Republic numismatics.', date: 'Mar 5, 2026', image: '/news-zar.png' },
  { id: 3, title: 'Club Event: Spring Numismatic Fair', summary: 'Join us for our quarterly gathering of collectors.', date: 'Feb 28, 2026', image: '/news-spring-fair.png' },
]

const benefits = [
  'Access to collector community',
  'Educational articles and news',
  'Member networking opportunities',
  'Coin market insights',
  'Events and special activities',
  'Member recognition',
]

const audience = [
  'Beginner collectors',
  'Experienced collectors',
  'Coin dealers',
  'Researchers',
  'Investors',
  'Students of numismatics',
]

const categories = [
  'Ancient Coins',
  'South African Republic (ZAR)',
  'Union & Republic of SA',
  'Modern Bullion',
  'World Coins',
  'Banknotes',
  'Medals & Tokens',
]

const testimonials = [
  { quote: 'The best decision I made for my collection. The community is knowledgeable and welcoming.', author: 'J. van der Berg', role: 'Collector since 2018' },
  { quote: 'Finally a club that understands both the hobby and investment sides of numismatics.', author: 'M. Ndlovu', role: 'Gold coin enthusiast' },
]

const membershipFee = { price: 'R100', desc: 'Full access to all club benefits' }

export default function Home() {
  return (
    <main className="home">
      <div className="home-bg" aria-hidden="true"></div>
      <div className="home-overlay" aria-hidden="true"></div>
      <section className="hero">
        <div className="hero-content">
          <h1>South African Coin Collectors Club</h1>
          <p className="hero-sub">A welcoming home for coin collectors and enthusiasts around South Africa.</p>
          <div className="hero-actions">
            <Link to="/membership" className="btn btn-primary">Join Now</Link>
            <Link to="/news" className="btn btn-outline">Read Latest News</Link>
          </div>
        </div>
      </section>

      <section className="section latest-news">
        <div className="container">
          <h2>Latest News</h2>
          <div className="news-grid">
            {latestNews.map((article) => (
              <article key={article.id} className="news-card">
                <div className="news-card-image">
                  <img src={article.image} alt="" />
                </div>
                <div className="news-card-content">
                  <span className="news-date">{article.date}</span>
                  <h3>{article.title}</h3>
                  <p>{article.summary}</p>
                  <Link to="/news" className="news-link">Read More →</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section benefits">
        <div className="container">
          <h2>What You Get as a Member</h2>
          <ul className="benefits-list">
            {benefits.map((b, i) => (
              <li key={i}>
                <span className="benefit-icon">◎</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section audience">
        <div className="container">
          <h2>Who the Club Is For</h2>
          <div className="audience-content">
            <p>
              The South African Coin Collectors Club welcomes anyone with an interest in numismatics. Our members 
              come from all walks of life and levels of experience.
            </p>
            <ul>
              {audience.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section categories">
        <div className="container">
          <h2>Areas of Collecting</h2>
          <div className="categories-content">
            <p>
              The club welcomes collectors across the full spectrum of numismatics. Whether your interest 
              lies in historical South African issues or international pieces, there's a place for you.
            </p>
            <ul>
              {categories.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section testimonials">
        <div className="container">
          <h2>Member Testimonials</h2>
          <div className="testimonial-cards">
            {testimonials.map((t, i) => (
              <blockquote key={i} className="testimonial">
                <p>"{t.quote}"</p>
                <footer>
                  <strong>{t.author}</strong>
                  <span>{t.role}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="section pricing">
        <div className="container">
          <h2>2026 Membership</h2>
          <div className="pricing-block">
            <div className="pricing-card">
              <div className="price">{membershipFee.price}<span>/year</span></div>
              <p>{membershipFee.desc}</p>
              <p className="pricing-cta-text">Become part of South Africa's premier numismatic community.</p>
              <Link to="/membership" className="btn btn-primary btn-lg">Join Now</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
