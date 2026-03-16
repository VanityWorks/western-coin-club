import './Page.css'
import './Forum.css'

const categories = [
  { name: 'Introductions', desc: 'Say hello to the community', threads: 24 },
  { name: 'Coin Identification', desc: 'Get help identifying coins', threads: 156 },
  { name: 'South African Coins', desc: 'ZAR, Union, RSA discussion', threads: 89 },
  { name: 'World Coins', desc: 'International numismatics', threads: 67 },
  { name: 'Ancient Coins', desc: 'Classical and medieval', threads: 42 },
  { name: 'Banknotes', desc: 'Paper money collecting', threads: 38 },
  { name: 'Medals and Tokens', desc: 'Exonumia', threads: 31 },
  { name: 'Buy / Sell / Trade', desc: 'Member marketplace', threads: 112 },
  { name: 'Events', desc: 'Club and external events', threads: 18 },
  { name: 'Research and Articles', desc: 'Numismatic research', threads: 45 },
]

export default function Forum() {
  return (
    <main className="page forum-page">
      <section className="page-hero">
        <h1>Community Forum</h1>
        <p>Connect, discuss, and learn with fellow collectors</p>
      </section>
      <section className="page-content">
        <div className="container">
          <div className="forum-notice">
            <p>
              <strong>Demo:</strong> The forum is a visual placeholder. A full forum would require 
              user registration, moderation, and backend integration.
            </p>
          </div>
          <div className="forum-categories">
            {categories.map((c, i) => (
              <div key={i} className="forum-category">
                <div className="forum-cat-icon">◎</div>
                <div className="forum-cat-info">
                  <h3>{c.name}</h3>
                  <p>{c.desc}</p>
                </div>
                <div className="forum-cat-meta">
                  <span>{c.threads} threads</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
