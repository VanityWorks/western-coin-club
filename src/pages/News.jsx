import { useState } from 'react'
import './Page.css'
import './News.css'

const articles = [
  { id: 1, title: '2026 Krugerrand Design Unveiled', summary: 'The annual release brings fresh excitement for bullion collectors. This year\'s design continues the tradition of excellence.', date: 'Mar 12, 2026', category: 'Bullion', image: '/news-krugerrand.png' },
  { id: 2, title: 'ZAR Coins: A Collector\'s Guide', summary: 'Deep dive into South African Republic numismatics. From the Veld Pond to the Burgers Pond.', date: 'Mar 5, 2026', category: 'History', image: '/news-zar.png' },
  { id: 3, title: 'Club Event: Spring Numismatic Fair', summary: 'Join us for our quarterly gathering of collectors. Vendors, exhibits, and networking.', date: 'Feb 28, 2026', category: 'Events', image: '/news-spring-fair.png' },
  { id: 4, title: 'Grading 101: Understanding Condition', summary: 'Learn how professional grading affects the value of your coins.', date: 'Feb 20, 2026', category: 'Education' },
  { id: 5, title: 'The Story of the R2 Coin', summary: 'A look at the design evolution of South Africa\'s bimetallic circulation coin.', date: 'Feb 15, 2026', category: 'History' },
  { id: 6, title: 'Market Update: Gold and Silver', summary: 'Quarterly insights into precious metal trends for collectors and investors.', date: 'Feb 10, 2026', category: 'Market' },
]

const categories = ['All', 'Bullion', 'History', 'Events', 'Education', 'Market']

export default function News() {
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('All')

  const filtered = articles.filter((a) => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.summary.toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCat === 'All' || a.category === activeCat
    return matchSearch && matchCat
  })

  return (
    <main className="page news-page">
      <section className="page-hero">
        <h1>News & Articles</h1>
        <p>Stay informed with the latest from the numismatic world</p>
      </section>
      <section className="page-content">
        <div className="container">
          <div className="news-toolbar">
            <input
              type="search"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="news-search"
            />
            <div className="news-categories">
              {categories.map((c) => (
                <button
                  key={c}
                  className={`cat-btn ${activeCat === c ? 'active' : ''}`}
                  onClick={() => setActiveCat(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="articles-grid">
            {filtered.map((article) => (
              <article key={article.id} className="article-card">
                <div className="article-image">
                  {article.image ? <img src={article.image} alt="" /> : <span className="article-placeholder">◎</span>}
                </div>
                <div className="article-content">
                  <div className="article-meta">
                    <span className="article-category">{article.category}</span>
                    <span className="article-date">{article.date}</span>
                  </div>
                  <h3>{article.title}</h3>
                  <p>{article.summary}</p>
                  <button className="article-link">Read More →</button>
                </div>
              </article>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="no-results">No articles match your search.</p>
          )}
        </div>
      </section>
    </main>
  )
}
