import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Home.css'

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
  'Zuid-Afrikaansche Republiek (ZAR)',
  'Union',
  'Republic of South Africa',
  'Modern Bullion',
  'World Coins',
  'Banknotes',
  'Medals & Tokens',
]

const testimonials = [
  { quote: 'The best decision I made for my collection. The community is knowledgeable and welcoming.', author: 'J. van der Berg', role: 'Collector since 2018' },
  { quote: 'Finally a club that understands both the hobby and investment sides of the coin world.', author: 'M. Ndlovu', role: 'Gold coin enthusiast' },
]

const membershipFee = { price: 'R120', desc: 'Full access to all club benefits' }

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Home() {
  const [news, setNews] = useState([])

  useEffect(() => {
    supabase
      .from('articles')
      .select('id, title, summary, cover_image, published_at, created_at')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(3)
      .then(({ data }) => { if (data?.length) setNews(data) })
  }, [])

  return (
    <main className="home">
      <div className="home-bg" aria-hidden="true"></div>
      <div className="home-overlay" aria-hidden="true"></div>
      <section className="hero">
        <div className="hero-content">
          <h1>South African Coin Collectors Club</h1>
          <p className="hero-sub">South Africa’s Home of Numismatics</p>
          <div className="hero-actions">
            <Link to="/join" className="btn btn-primary">Join The Club</Link>
            <Link to="/magazine?ref=home" className="btn btn-outline">Read Our Magazine</Link>
          </div>
          <p className="hero-intro-brief">Bringing collectors together.
Learn, discover, and share knowledge.
Stay informed with news and insights.
Join a community built for collectors.</p>
          <p className="hero-tagline">For Collectors. By Collectors.</p>
        </div>
      </section>

      {news.length > 0 && (
        <section className="section latest-news">
          <div className="container">
            <h2>Latest News</h2>
            <div className="news-grid">
              {news.map((article) => (
                <article key={article.id} className="news-card">
                  {article.cover_image && (
                    <div className="news-card-image">
                      <img src={article.cover_image} alt="" loading="lazy" />
                    </div>
                  )}
                  <div className="news-card-content">
                    <span className="news-date">{formatDate(article.published_at || article.created_at)}</span>
                    <h3>{article.title}</h3>
                    {article.summary && <p>{article.summary}</p>}
                    <Link to={`/news/${article.id}`} className="news-link">Read More →</Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section newsletter-banner">
        <div className="container">
          <div className="nl-banner">
            <div className="nl-banner-left">
              <span className="nl-banner-tag">New Issue Out Now</span>
              <h2 className="nl-banner-title">The Collector's Pulse</h2>
              <p className="nl-banner-desc">Market trends, featured coins, collector stories - everything happening in South African numismatics this month.</p>
              <Link to="/newsletter" className="nl-banner-btn">
                Read the March 2026 Edition <i className="fa-solid fa-arrow-right" />
              </Link>
            </div>
            <div className="nl-banner-right">
              <div className="nl-banner-preview">
                <div className="nl-preview-mockup">
                  <div className="nl-preview-header" />
                  <div className="nl-preview-line w80" />
                  <div className="nl-preview-line w60" />
                  <div className="nl-preview-block" />
                  <div className="nl-preview-line w90" />
                  <div className="nl-preview-line w40" />
                </div>
                <span className="nl-preview-label">March 2026</span>
              </div>
            </div>
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
              <p className="pricing-cta-text">Connect with collectors and grow your knowledge.
              Become an official member of South Africa’s coin collecting community.</p>
              <Link to="/join" className="btn btn-primary btn-lg">Join The Club</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
