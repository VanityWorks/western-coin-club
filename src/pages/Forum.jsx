import { useState } from 'react'
import './Page.css'
import './Forum.css'

const categories = [
  { id: 'intro', name: 'Introductions', desc: 'Say hello to the community', threads: 24, posts: 312 },
  { id: 'identify', name: 'Coin Identification', desc: 'Get help identifying coins', threads: 156, posts: 892 },
  { id: 'sa', name: 'South African Coins', desc: 'ZAR, Union, RSA discussion', threads: 89, posts: 445 },
  { id: 'world', name: 'World Coins', desc: 'International coins', threads: 67, posts: 234 },
  { id: 'ancient', name: 'Ancient Coins', desc: 'Classical and medieval', threads: 42, posts: 189 },
  { id: 'banknotes', name: 'Banknotes', desc: 'Paper money collecting', threads: 38, posts: 156 },
  { id: 'medals', name: 'Medals and Tokens', desc: 'Exonumia', threads: 31, posts: 98 },
  { id: 'buy', name: 'Buy / Sell / Trade', desc: 'Member marketplace', threads: 112, posts: 678 },
  { id: 'events', name: 'Events', desc: 'Club and external events', threads: 18, posts: 89 },
  { id: 'research', name: 'Research and Articles', desc: 'Coin research', threads: 45, posts: 203 },
]

const threadLists = {
  intro: [
    { id: 1, title: 'New member from Cape Town', author: 'J. van der Berg', replies: 12, lastPost: '2 hours ago', lastBy: 'L. Coleske' },
    { id: 2, title: 'Hello from Durban!', author: 'A. Govender', replies: 8, lastPost: '5 hours ago', lastBy: 'G. Willicott' },
    { id: 3, title: 'Joining from Johannesburg', author: 'M. Ndlovu', replies: 15, lastPost: '1 day ago', lastBy: 'D. Bassani' },
    { id: 4, title: 'Greetings from Bloemfontein', author: 'J. Terblanche', replies: 6, lastPost: '2 days ago', lastBy: 'T. van der Spuy' },
  ],
  identify: [
    { id: 1, title: 'Unknown ZAR coin - need help', author: 'Collector42', replies: 24, lastPost: '30 min ago', lastBy: 'W. Lamprecht' },
    { id: 2, title: 'What is this Krugerrand variant?', author: 'GoldBug', replies: 18, lastPost: '1 hour ago', lastBy: 'M. Bassani' },
    { id: 3, title: 'Identification: Union era penny', author: 'HistoryBuff', replies: 9, lastPost: '3 hours ago', lastBy: 'J. Kleynhans' },
  ],
  sa: [
    { id: 1, title: 'Veld Pond authenticity check', author: 'ZARCollector', replies: 31, lastPost: '45 min ago', lastBy: 'W. Lamprecht' },
    { id: 2, title: 'Union proof sets - rarity discussion', author: 'JanK', replies: 22, lastPost: '4 hours ago', lastBy: 'J. Kleynhans' },
    { id: 3, title: 'R2 coin design evolution', author: 'DecimalFan', replies: 14, lastPost: '1 day ago', lastBy: 'S. Taylor' },
  ],
  world: [
    { id: 1, title: 'British sovereigns - grading tips', author: 'BritCoins', replies: 19, lastPost: '2 hours ago', lastBy: 'A. Terblanche' },
    { id: 2, title: 'US Morgan dollars - where to start?', author: 'NewToWorld', replies: 11, lastPost: '6 hours ago', lastBy: 'A. Terblanche' },
  ],
  ancient: [
    { id: 1, title: 'Roman denarius identification', author: 'AncientFan', replies: 8, lastPost: '1 day ago', lastBy: 'J. Potgieter' },
  ],
  banknotes: [
    { id: 1, title: 'SARB note grading', author: 'NoteCollector', replies: 15, lastPost: '5 hours ago', lastBy: 'Dr H. Wurz' },
  ],
  medals: [
    { id: 1, title: 'Token identification help', author: 'TokenFan', replies: 6, lastPost: '2 days ago', lastBy: 'A. Govender' },
  ],
  buy: [
    { id: 1, title: 'WTS: ZAR Pond 1892', author: 'SeriousSeller', replies: 42, lastPost: '20 min ago', lastBy: 'Buyer123' },
    { id: 2, title: 'WTB: Krugerrand 1967', author: 'FirstRand', replies: 7, lastPost: '3 hours ago', lastBy: 'DealerX' },
  ],
  events: [
    { id: 1, title: 'Spring Coin Fair - who\'s going?', author: 'EventGoer', replies: 28, lastPost: '1 hour ago', lastBy: 'D. Bassani' },
  ],
  research: [
    { id: 1, title: 'ZAR mint marks - new findings', author: 'Researcher1', replies: 12, lastPost: '3 hours ago', lastBy: 'Prof F. Malan' },
  ],
}

const posts = {
  1: [
    { author: 'J. van der Berg', date: 'Mar 14, 2026', content: 'Hi everyone! Just joined the club and excited to connect with fellow collectors. I\'ve been collecting ZAR coins for about 5 years now. Looking forward to learning from you all!' },
    { author: 'G. Willicott', date: 'Mar 14, 2026', content: 'Welcome! Great to have another Cape Town collector. We have a regional meetup coming up - you should come along.' },
    { author: 'L. Coleske', date: 'Mar 16, 2026', content: 'Welcome to the club! The WhatsApp community is very active if you want to jump into discussions there too.' },
  ],
}

export default function Forum() {
  const [view, setView] = useState('categories') // 'categories' | 'threads' | 'thread'
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedThread, setSelectedThread] = useState(null)

  const threads = selectedCategory ? (threadLists[selectedCategory.id] || []) : []
  const threadPosts = selectedThread ? (posts[selectedThread.id] || []) : []

  return (
    <main className="page forum-page">
      <section className="page-hero">
        <h1>Community Forum</h1>
        <p>Connect, discuss, and learn with fellow collectors</p>
      </section>
      <section className="page-content">
        <div className="container">
          {view === 'categories' && (
            <>
              <div className="forum-breadcrumb">
                <button className="breadcrumb-link" onClick={() => setView('categories')}>Forums</button>
              </div>
              <div className="forum-table forum-categories-table">
                <div className="forum-table-header">
                  <div className="forum-col-main">Forum</div>
                  <div className="forum-col-stat">Threads</div>
                  <div className="forum-col-stat">Posts</div>
                  <div className="forum-col-last">Last Post</div>
                </div>
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="forum-table-row forum-category-row"
                    onClick={() => {
                      setSelectedCategory(cat)
                      setView('threads')
                    }}
                  >
                    <div className="forum-col-main">
                      <h3 className="forum-cat-name">{cat.name}</h3>
                      <p className="forum-cat-desc">{cat.desc}</p>
                    </div>
                    <div className="forum-col-stat">{cat.threads}</div>
                    <div className="forum-col-stat">{cat.posts}</div>
                    <div className="forum-col-last">
                      <span className="forum-last-meta">—</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {view === 'threads' && selectedCategory && (
            <>
              <div className="forum-breadcrumb">
                <button className="breadcrumb-link" onClick={() => { setView('categories'); setSelectedCategory(null) }}>Forums</button>
                <span className="breadcrumb-sep">›</span>
                <span className="breadcrumb-current">{selectedCategory.name}</span>
              </div>
              <div className="forum-actions">
                <button className="btn btn-primary btn-sm">New Thread</button>
              </div>
              <div className="forum-table forum-threads-table">
                <div className="forum-table-header">
                  <div className="forum-col-main">Thread</div>
                  <div className="forum-col-author">Author</div>
                  <div className="forum-col-stat">Replies</div>
                  <div className="forum-col-last">Last Post</div>
                </div>
                {threads.map((thread) => (
                  <div
                    key={thread.id}
                    className="forum-table-row forum-thread-row"
                    onClick={() => {
                      setSelectedThread(thread)
                      setView('thread')
                    }}
                  >
                    <div className="forum-col-main">
                      <h3 className="forum-thread-title">{thread.title}</h3>
                    </div>
                    <div className="forum-col-author">{thread.author}</div>
                    <div className="forum-col-stat">{thread.replies}</div>
                    <div className="forum-col-last">
                      <span className="forum-last-meta">{thread.lastPost}</span>
                      <span className="forum-last-by">by {thread.lastBy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {view === 'thread' && selectedThread && selectedCategory && (
            <>
              <div className="forum-breadcrumb">
                <button className="breadcrumb-link" onClick={() => { setView('categories'); setSelectedCategory(null); setSelectedThread(null) }}>Forums</button>
                <span className="breadcrumb-sep">›</span>
                <button className="breadcrumb-link" onClick={() => { setView('threads'); setSelectedThread(null) }}>{selectedCategory.name}</button>
                <span className="breadcrumb-sep">›</span>
                <span className="breadcrumb-current">{selectedThread.title}</span>
              </div>
              <div className="forum-actions">
                <button className="btn btn-primary btn-sm">Reply</button>
              </div>
              <div className="forum-thread-posts">
                <h2 className="forum-thread-heading">{selectedThread.title}</h2>
                {(threadPosts.length ? threadPosts : [{ author: selectedThread.author, date: 'Recently', content: 'Thread content would appear here. This is a demo placeholder.' }]).map((post, i) => (
                  <article key={i} className="forum-post">
                    <div className="forum-post-sidebar">
                      <div className="forum-post-avatar">◎</div>
                      <div className="forum-post-author">{post.author}</div>
                      <div className="forum-post-meta">Member</div>
                    </div>
                    <div className="forum-post-body">
                      <div className="forum-post-meta-line">
                        <span className="forum-post-date">Posted {post.date}</span>
                      </div>
                      <div className="forum-post-content">
                        {post.content}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
