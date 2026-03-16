import { Link } from 'react-router-dom'
import './Home.css'

const latestNews = [
  { id: 1, title: '2026 Krugerrand Design Unveiled', summary: 'The annual release brings fresh excitement for bullion collectors.', date: 'Mar 12, 2026', image: '/news-krugerrand.png' },
  { id: 2, title: 'ZAR Coins: A Collector\'s Guide', summary: 'Deep dive into South African Republic coins.', date: 'Mar 5, 2026', image: '/news-zar.png' },
  { id: 3, title: 'Club Event: Spring Coin Fair', summary: 'Join us for our quarterly gathering of collectors.', date: 'Feb 28, 2026', image: '/news-spring-fair.png' },
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
  'Students of coin collecting',
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
  { quote: 'Finally a club that understands both the hobby and investment sides of the coin world.', author: 'M. Ndlovu', role: 'Gold coin enthusiast' },
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
          <p className="hero-intro-brief">We bring together collectors of Krugerrands, ZAR coins, and world coins from across South Africa and beyond. Join us for events, educational content, market insights, and a welcoming community of enthusiasts.</p>
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

      <section className="section about-club">
        <div className="container">
          <h2>About the Club</h2>
          <div className="about-club-grid">
            <div className="about-club-card">
              <h3>What You Get</h3>
              <ul className="benefits-list-compact">
                {benefits.map((b, i) => (
                  <li key={i}><span className="benefit-icon">◎</span>{b}</li>
                ))}
              </ul>
            </div>
            <div className="about-club-card">
              <h3>Who It's For</h3>
              <ul>
                {audience.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
            <div className="about-club-card">
              <h3>Areas of Collecting</h3>
              <ul>
                {categories.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
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
              <p className="pricing-cta-text">Become part of South Africa's welcoming coin community.</p>
              <Link to="/membership" className="btn btn-primary btn-lg">Join Now</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
