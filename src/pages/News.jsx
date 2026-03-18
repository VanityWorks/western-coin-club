import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { supabase } from '../lib/supabase'
import './Page.css'
import './News.css'

const FALLBACK = [
  {
    id: 'fb-1',
    title: '2026 Krugerrand Design Unveiled',
    summary: 'The annual release brings fresh excitement for bullion collectors. This year\'s design continues the tradition of excellence.',
    date: 'Mar 12, 2026',
    category: 'Bullion',
    image: '/news-krugerrand.png',
    body: `<h2>A New Chapter for South Africa's Most Iconic Coin</h2>
<p>The South African Mint has officially unveiled the 2026 Krugerrand design, continuing a legacy that stretches back to 1967. This year's release features a subtly refined reverse, honouring the springbok with new engraving detail that collectors and investors alike are praising.</p>
<h3>What's New in 2026</h3>
<p>The 2026 one-ounce gold Krugerrand retains its classic 22-carat gold alloy composition, giving the coin its distinctive warm reddish hue. The obverse carries the familiar Paul Kruger portrait, while the reverse springbok now features a more textured, sculptural finish.</p>
<blockquote>The Krugerrand remains the world's best-selling gold bullion coin, with over 60 million ounces sold since its inception.</blockquote>
<h3>Collector & Investor Appeal</h3>
<p>Fractional sizes — ½ oz, ¼ oz, and 1/10 oz — are also available, making the 2026 series accessible to a wider range of collectors. Proof versions with a mirror finish are expected later in the year.</p>
<p>Members interested in acquiring the 2026 Krugerrand at competitive premiums are encouraged to connect with WCCC-affiliated dealers through our Buy • Sell • Trade WhatsApp channel.</p>`,
  },
  {
    id: 'fb-2',
    title: 'ZAR Coins: A Collector\'s Guide',
    summary: 'Deep dive into Zuid-Afrikaansche Republiek coins. From the Veld Pond to the Burgers Pond.',
    date: 'Mar 5, 2026',
    category: 'History',
    image: '/news-zar.png',
    body: `<h2>The Coins of the Zuid-Afrikaansche Republiek</h2>
<p>The coins struck under the Zuid-Afrikaansche Republiek (ZAR) represent a fascinating and historically rich corner of South African numismatics. From the earliest experimental issues to the well-known Kruger Pond, these coins tell the story of a fledgling republic forging its own monetary identity.</p>
<h3>The Burgers Pond (1874)</h3>
<p>South Africa's first domestic gold coin, the Burgers Pond, was struck in London bearing President Thomas François Burgers' portrait — a highly controversial choice at the time. Two varieties exist: the <em>fine beard</em> and the <em>coarse beard</em>, the latter being significantly rarer. High-grade examples fetch substantial premiums at auction.</p>
<blockquote>Only 837 Burgers Ponds were struck, making it one of the most sought-after South African rarities.</blockquote>
<h3>The Veld Pond (1902)</h3>
<p>Struck during the Anglo-Boer War using crude field equipment, the Veld Pond is a symbol of Boer resilience. Its rough finish and simple design stand in stark contrast to the polished Kruger coins, yet it commands enormous respect — and price — among collectors.</p>
<h3>Grading ZAR Coins</h3>
<p>Condition is everything with ZAR coinage. Most circulated examples grade from Fine to Very Fine. Uncirculated ZAR coins are extremely rare and typically only appear in major auction houses. Members are advised to seek independent grading from SANGS or NGC before significant purchases.</p>`,
  },
  {
    id: 'fb-3',
    title: 'Club Event: Spring Coin Fair',
    summary: 'Join us for our quarterly gathering of collectors. Vendors, exhibits, and networking.',
    date: 'Feb 28, 2026',
    category: 'Events',
    image: '/news-spring-fair.png',
    body: `<h2>WCCC Spring Coin Fair 2026</h2>
<p>The Western Cape Coin Collectors Club is pleased to announce our Spring Coin Fair, taking place in late March 2026. This quarterly event brings together collectors, dealers, and enthusiasts from across the Western Cape and beyond.</p>
<h3>What to Expect</h3>
<ul>
<li>Over 20 dealer tables covering South African, world, and ancient coins</li>
<li>A dedicated display of ZAR and Union-era rarities</li>
<li>Numismatic library — browse, borrow, and donate</li>
<li>Free valuations by experienced club members</li>
<li>A beginners' table for new collectors</li>
</ul>
<h3>Venue & Time</h3>
<p>Details will be shared via the WCCC WhatsApp Community closer to the date. Members are encouraged to RSVP early as space is limited.</p>
<blockquote>Bring your duplicates to trade, your questions to ask, and your passion for coins to share.</blockquote>
<p>The Spring Coin Fair is free to attend for all WCCC members. Non-members are welcome at a small door charge of R20, which goes directly toward club events.</p>`,
  },
  {
    id: 'fb-4',
    title: 'Grading 101: Understanding Condition',
    summary: 'Learn how professional grading affects the value of your coins.',
    date: 'Feb 20, 2026',
    category: 'Education',
    body: `<h2>Why Coin Grading Matters</h2>
<p>The grade of a coin — its state of preservation — is one of the most significant factors in determining its value. A coin graded MS-65 can be worth many times more than the same date in VF-30, sometimes by a factor of 50x or more for key dates.</p>
<h3>The Sheldon Scale</h3>
<p>Developed by Dr. William Sheldon in 1949, the 70-point scale is now the universal standard. The main categories are:</p>
<ul>
<li><strong>Poor (P-1)</strong> — Barely identifiable</li>
<li><strong>Good (G-4 to G-6)</strong> — Major design visible, heavy wear</li>
<li><strong>Fine (F-12 to F-15)</strong> — Moderate even wear, all major features clear</li>
<li><strong>Very Fine (VF-20 to VF-35)</strong> — Light to moderate wear on high points</li>
<li><strong>Extremely Fine (EF-40 to EF-45)</strong> — Light wear on highest points only</li>
<li><strong>About Uncirculated (AU-50 to AU-58)</strong> — Trace wear, nearly full lustre</li>
<li><strong>Mint State (MS-60 to MS-70)</strong> — No wear; subdivided by marks and eye appeal</li>
</ul>
<h3>Third-Party Grading</h3>
<p>For South African coins, SANGS (South African Numismatic Grading Service) and international services like NGC and PCGS provide encapsulated, independently graded coins. Slabbed coins offer buyer confidence and are increasingly important for high-value transactions.</p>
<blockquote>Never buy a raw coin at slab prices. Always verify grade independently before committing to significant purchases.</blockquote>`,
  },
  {
    id: 'fb-5',
    title: 'The Story of the R2 Coin',
    summary: 'A look at the design evolution of South Africa\'s bimetallic circulation coin.',
    date: 'Feb 15, 2026',
    category: 'History',
    body: `<h2>South Africa's R2: A Bimetallic Icon</h2>
<p>Introduced in 1989, the South African R2 coin has become one of the most recognisable pieces of everyday currency on the continent. Its distinctive bimetallic construction — a bronze-coloured aluminium-bronze ring surrounding a stainless-steel centre — makes it immediately recognisable in any pocket.</p>
<h3>Design Changes Over the Years</h3>
<p>The R2's reverse has featured the greater kudu since its introduction, though the coin went through significant changes after 1994. Post-apartheid versions replaced the old coat of arms with the new national arms and carried the country's name in various official languages on a rotating basis.</p>
<h3>Errors and Varieties</h3>
<p>Several R2 errors are known and actively collected:</p>
<ul>
<li><strong>Double-struck errors</strong> — The design appears twice, offset</li>
<li><strong>Brockage errors</strong> — A mirror image of one face appears on the other</li>
<li><strong>Wrong planchet errors</strong> — R2 design struck on a smaller coin blank</li>
</ul>
<blockquote>Error coins are legal tender but are worth far more to collectors than face value — sometimes hundreds of times more.</blockquote>
<h3>Collecting Circulation R2s</h3>
<p>A complete date set of circulation R2 coins is an achievable and rewarding goal for new collectors. The 1989 first-year issue and certain low-mintage dates from the 1990s are the key coins to watch for.</p>`,
  },
  {
    id: 'fb-6',
    title: 'Market Update: Gold and Silver',
    summary: 'Quarterly insights into precious metal trends for collectors and investors.',
    date: 'Feb 10, 2026',
    category: 'Market',
    body: `<h2>Precious Metals Market — Q1 2026</h2>
<p>Gold opened 2026 at elevated levels relative to 2025 averages, driven by continued central bank buying, geopolitical uncertainty, and strong demand from South and East Asian markets. For South African collectors and investors, the weaker rand has amplified rand-denominated gold prices significantly.</p>
<h3>Gold</h3>
<p>The spot price of gold in USD has remained resilient above key support levels. In ZAR terms, one troy ounce of gold is currently priced significantly higher than historical averages, making bullion coins an attractive store of value for local collectors.</p>
<blockquote>South African investors have a natural advantage in Krugerrand ownership — rand-denominated gains on gold have historically outpaced both inflation and many equity benchmarks over long holding periods.</blockquote>
<h3>Silver</h3>
<p>Silver has shown more volatility, with the gold-to-silver ratio remaining elevated. This creates an opportunity for collectors to acquire silver bullion and numismatic pieces at relatively favourable prices versus gold.</p>
<h3>What This Means for Collectors</h3>
<ul>
<li>High spot prices make graded, numismatic premiums relatively smaller — a good time to buy quality coins</li>
<li>Consider fractional gold (½ oz, ¼ oz Krugerrands) for more liquid, lower entry-point exposure</li>
<li>Silver numismatic coins remain excellent value relative to gold equivalents</li>
</ul>
<p>As always, WCCC does not provide financial advice. Members are encouraged to do their own research and consult a qualified advisor before making investment decisions.</p>`,
  },
]

const CATEGORIES = ['All', 'Bullion', 'History', 'Events', 'Education', 'Market', 'General', 'Club News']

function formatDate(iso) {
  if (!iso) return ''
  if (!iso.includes('T') && iso.length < 15) return iso
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Inline article reader (used for fallback articles) ─

function ArticleView({ article, onBack }) {
  const img = article.cover_image || article.image
  return (
    <div className="news-reader">
      <button className="nr-back" onClick={onBack}>← Back to News</button>

      <div className="nr-meta">
        {article.category && <span className="nr-category">{article.category}</span>}
        <span className="nr-date">{formatDate(article.published_at || article.created_at || article.date)}</span>
      </div>

      <h1 className="nr-title">{article.title}</h1>
      {article.summary && <p className="nr-summary">{article.summary}</p>}

      {img && <img src={img} alt={article.title} className="nr-hero" />}

      {article.body
        ? <div className="nr-body" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.body, { ADD_ATTR: ['target'] }) }} />
        : <p className="nr-body-empty">Full article coming soon.</p>
      }

      <button className="nr-back nr-back-bottom" onClick={onBack}>← Back to News</button>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────

export default function News() {
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('All')
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [usingSupabase, setUsingSupabase] = useState(false)
  const [reading, setReading] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('articles')
        .select('id, title, summary, category, cover_image, published_at, created_at, body, author')
        .eq('published', true)
        .order('published_at', { ascending: false, nullsFirst: false })

      if (data && data.length > 0) {
        setArticles(data)
        setUsingSupabase(true)
      } else {
        setArticles(FALLBACK)
        setUsingSupabase(false)
      }
      setLoading(false)
    }
    load()
  }, [])

  const availableCats = ['All', ...new Set([
    ...CATEGORIES.slice(1),
    ...articles.map(a => a.category).filter(Boolean),
  ])]

  const filtered = articles.filter(a => {
    const matchSearch = !search
      || a.title.toLowerCase().includes(search.toLowerCase())
      || (a.summary || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCat === 'All' || a.category === activeCat
    return matchSearch && matchCat
  })

  // Show inline reader for fallback articles
  if (reading && !usingSupabase) {
    return (
      <main className="page news-page">
        <section className="page-content">
          <div className="container">
            <ArticleView article={reading} onBack={() => setReading(null)} />
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="page news-page">
      <section className="page-hero">
        <h1>News & Articles</h1>
        <p>Stay informed with the latest from the coin world</p>
      </section>
      <section className="page-content">
        <div className="container">
          <div className="news-toolbar">
            <input
              type="search"
              placeholder="Search articles…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="news-search"
            />
            <div className="news-categories">
              {availableCats.map(c => (
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

          {loading ? (
            <div className="news-loading">
              <span className="news-spinner" />
            </div>
          ) : (
            <>
              <div className="articles-grid">
                {filtered.map(article => {
                  const img = article.cover_image || article.image
                  const date = formatDate(article.published_at || article.created_at || article.date)

                  const inner = (
                    <article className="article-card article-card-link">
                      <div className="article-image">
                        {img
                          ? <img src={img} alt="" />
                          : <span className="article-placeholder">◎</span>
                        }
                      </div>
                      <div className="article-content">
                        <div className="article-meta">
                          <span className="article-category">{article.category}</span>
                          <span className="article-date">{date}</span>
                        </div>
                        <h3>{article.title}</h3>
                        <p>{article.summary}</p>
                        <span className="article-link">Read More →</span>
                      </div>
                    </article>
                  )

                  return usingSupabase
                    ? <Link key={article.id} to={`/news/${article.id}`} className="article-card-wrapper">{inner}</Link>
                    : <button key={article.id} className="article-card-wrapper article-card-btn" onClick={() => setReading(article)}>{inner}</button>
                })}
              </div>

              {filtered.length === 0 && (
                <p className="no-results">No articles match your search.</p>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  )
}
