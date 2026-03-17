import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import RichTextEditor from '../components/RichTextEditor'
import './Page.css'
import './Forum.css'

// Categories are loaded from Supabase — managed via Admin → Forum → Categories

// ── Helpers ────────────────────────────────────────────────────────────────────

const avatarColors = ['#007749', '#002395', '#E63946', '#FFB81C', '#525252', '#a35c00']

function avatarColor(name) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return avatarColors[Math.abs(h) % avatarColors.length]
}

function initials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('')
}

function timeAgo(iso) {
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (secs < 60)     return 'Just now'
  if (secs < 3600)   return `${Math.floor(secs / 60)} min ago`
  if (secs < 86400)  return `${Math.floor(secs / 3600)} hr ago`
  if (secs < 172800) return '1 day ago'
  return new Date(iso).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fullDate(iso) {
  return new Date(iso).toLocaleString('en-ZA', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// Derive a 2-letter abbreviation from a category name
function computeAbbr(name) {
  const skip = new Set(['and', 'the', 'of', 'a', 'an', '&', '/'])
  const words = name.split(/[\s&/]+/).filter(w => w.length > 1 && !skip.has(w.toLowerCase()))
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.replace(/\s+/g, '').slice(0, 2).toUpperCase()
}

// Group a flat category list into { id, name, categories[] } groups
function groupCategories(cats) {
  const groups = []
  const map = {}
  for (const cat of cats) {
    if (!map[cat.group_id]) {
      map[cat.group_id] = { id: cat.group_id, name: cat.group_name, categories: [] }
      groups.push(map[cat.group_id])
    }
    map[cat.group_id].categories.push({ ...cat, abbr: computeAbbr(cat.name), desc: cat.description })
  }
  return groups
}

function memberName(user) {
  if (user.user_metadata?.first_name) {
    return `${user.user_metadata.first_name} ${user.user_metadata.surname || ''}`.trim()
  }
  return user.email
}

// ── Shared components ──────────────────────────────────────────────────────────

function Breadcrumbs({ items }) {
  return (
    <nav className="forum-breadcrumbs" aria-label="breadcrumb">
      {items.map((item, i) => (
        <span key={i} className="forum-bc-item">
          {i < items.length - 1 ? (
            <>
              {item.onClick
                ? <button className="forum-bc-link" onClick={item.onClick}>{item.label}</button>
                : <Link className="forum-bc-link" to={item.to}>{item.label}</Link>
              }
              <span className="forum-bc-sep">›</span>
            </>
          ) : (
            <span className="forum-bc-current">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

function Avatar({ name, size = 40, url }) {
  if (url) return (
    <img src={url} alt={name} className="forum-avatar" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  )
  return (
    <div
      className="forum-avatar"
      style={{ width: size, height: size, background: avatarColor(name), fontSize: size * 0.37 }}
      aria-label={name}
    >
      {initials(name)}
    </div>
  )
}

// ── Members-only gate ──────────────────────────────────────────────────────────

function MembersOnlyGate() {
  return (
    <main className="page forum-page">
      <section className="page-hero">
        <h1>Community Forum</h1>
        <p>Connect, discuss, and learn with fellow collectors</p>
      </section>
      <section className="page-content">
        <div className="container">
          <div className="forum-gate">
            <div className="forum-gate-lock">
              <i className="fa-solid fa-lock" />
            </div>
            <h2>Members Only</h2>
            <p>
              The SACCC Forum is an exclusive space for club members. Sign in with your
              membership credentials, or apply to join the club.
            </p>
            <div className="forum-gate-actions">
              <Link to="/login" className="btn btn-primary btn-lg">Sign In</Link>
              <Link to="/join" className="btn forum-gate-join-btn">Apply to Join</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

// ── New thread modal ───────────────────────────────────────────────────────────

function NewThreadModal({ category, onSubmit, onClose }) {
  const [title, setTitle]   = useState('')
  const [body, setBody]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !body || body === '<p></p>') return
    setLoading(true)
    await onSubmit({ title: title.trim(), body })
    setLoading(false)
  }

  return (
    <div className="forum-modal-overlay" onClick={onClose}>
      <div className="forum-modal" onClick={e => e.stopPropagation()}>
        <div className="forum-modal-header">
          <h2>New Thread — {category.name}</h2>
          <button className="forum-modal-close" onClick={onClose} type="button"><i className="fa-solid fa-xmark" /></button>
        </div>
        <form onSubmit={handleSubmit} className="forum-modal-form">
          <label className="forum-compose-label">
            <span>Thread Title</span>
            <input
              type="text"
              className="forum-compose-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter a descriptive title…"
              required
              autoFocus
            />
          </label>
          <div className="forum-compose-label">
            <span>Post</span>
            <RichTextEditor onUpdate={setBody} placeholder="Write your post…" minHeight={200} />
          </div>
          <div className="forum-modal-actions">
            <button type="button" className="forum-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Posting…' : 'Post Thread'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Forum home ─────────────────────────────────────────────────────────────────

function ForumHome({ user, onSelectCategory }) {
  const [categoryGroups, setCategoryGroups] = useState([])
  const [stats, setStats]                   = useState({})
  const [loading, setLoading]               = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: cats }, { data: threads }] = await Promise.all([
        supabase.from('forum_categories').select('*').order('sort_order'),
        supabase.from('forum_threads').select('category_id, title, author_name, created_at').order('created_at', { ascending: false }),
      ])

      if (cats) setCategoryGroups(groupCategories(cats))

      if (threads) {
        const map = {}
        for (const t of threads) {
          if (!map[t.category_id]) {
            map[t.category_id] = { count: 0, latestTitle: t.title, latestBy: t.author_name, latestTime: t.created_at }
          }
          map[t.category_id].count++
        }
        setStats(map)
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <main className="page forum-page">
      <section className="page-hero">
        <h1>Community Forum</h1>
        <p>Connect, discuss, and learn with fellow collectors</p>
      </section>
      <section className="page-content">
        <div className="container">

          {loading ? (
            <p className="forum-loading"><i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: '0.5rem' }} />Loading forums…</p>
          ) : categoryGroups.length === 0 ? (
            <p className="forum-loading">No forums configured yet.</p>
          ) : null}

          {categoryGroups.map(group => (
            <div key={group.id} className="forum-group">
              <div className="forum-group-header">
                <h2>{group.name}</h2>
              </div>
              <div className="forum-cat-table">
                <div className="forum-cat-thead">
                  <div className="fct-col-main">Forum</div>
                  <div className="fct-col-stat">Threads</div>
                  <div className="fct-col-last">Last Thread</div>
                </div>
                {group.categories.map(cat => {
                  const s = stats[cat.id]
                  return (
                    <div
                      key={cat.id}
                      className="forum-cat-row"
                      onClick={() => onSelectCategory(cat)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && onSelectCategory(cat)}
                    >
                      <div className="fct-col-main">
                        {cat.icon_url
                          ? <img src={cat.icon_url} alt="" className="forum-cat-icon forum-cat-icon-img" />
                          : <div className="forum-cat-icon" style={{ background: cat.color }}>{cat.abbr}</div>
                        }
                        <div className="forum-cat-info">
                          <span className="forum-cat-name">{cat.name}</span>
                          <span className="forum-cat-desc">{cat.desc}</span>
                        </div>
                      </div>
                      <div className="fct-col-stat">
                        {loading ? '—' : (s?.count || 0).toLocaleString()}
                      </div>
                      <div className="fct-col-last">
                        {s ? (
                          <>
                            <span className="forum-last-thread">{s.latestTitle}</span>
                            <span className="forum-last-meta">by {s.latestBy} · {timeAgo(s.latestTime)}</span>
                          </>
                        ) : (
                          <span className="forum-last-meta">No threads yet</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

// ── Thread list ────────────────────────────────────────────────────────────────

function ThreadList({ category, onSelectThread, onBack, onNewThread }) {
  const [threads, setThreads]   = useState([])
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('forum_threads')
        .select('*, forum_posts(count)')
        .eq('category_id', category.id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
      setThreads(data || [])
      const ids = [...new Set((data || []).map(t => t.author_id).filter(Boolean))]
      if (ids.length) {
        const { data: profs } = await supabase.from('profiles').select('id, avatar_url').in('id', ids)
        const map = {}; profs?.forEach(p => { map[p.id] = p }); setProfiles(map)
      }
      setLoading(false)
    }
    load()
  }, [category.id])

  return (
    <main className="page forum-page">
      <section className="page-hero">
        <h1>{category.name}</h1>
        <p>{category.desc}</p>
      </section>
      <div className="forum-bc-bar">
        <div className="container">
          <Breadcrumbs items={[
            { label: 'Forums', onClick: onBack },
            { label: category.name },
          ]} />
        </div>
      </div>
      <section className="page-content">
        <div className="container">
          <div className="forum-threads-bar">
            <div className="forum-thread-stats">
              <span>{threads.length} {threads.length === 1 ? 'thread' : 'threads'}</span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={onNewThread}>+ New Thread</button>
          </div>

          {loading ? (
            <p className="forum-loading"><i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: '0.5rem' }} />Loading threads…</p>
          ) : threads.length === 0 ? (
            <p className="forum-loading">No threads yet. Be the first to post!</p>
          ) : (
            <div className="forum-thread-table">
              <div className="forum-thread-thead">
                <div className="ftt-col-main">Thread</div>
                <div className="ftt-col-author">Author</div>
                <div className="ftt-col-stat">Replies</div>
                <div className="ftt-col-stat">Views</div>
                <div className="ftt-col-last">Posted</div>
              </div>
              {threads.map(thread => {
                const totalPosts = thread.forum_posts?.[0]?.count ?? 1
                const replyCount = Math.max(0, totalPosts - 1)
                const isHot = replyCount > 10
                return (
                  <div
                    key={thread.id}
                    className={`forum-thread-row${thread.is_pinned ? ' is-pinned' : ''}${isHot ? ' is-hot' : ''}`}
                    onClick={() => onSelectThread(thread)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && onSelectThread(thread)}
                  >
                    <div className="ftt-col-main">
                      <div className="forum-thread-title-row">
                        {thread.is_pinned && <span className="forum-thread-tag tag-pinned">Pinned</span>}
                        {thread.is_locked && <span className="forum-thread-tag tag-locked">Locked</span>}
                        {isHot && <span className="forum-thread-tag tag-hot">Hot</span>}
                        <span className="forum-thread-title">{thread.title}</span>
                      </div>
                      <div className="forum-thread-sub">Started by {thread.author_name} · {timeAgo(thread.created_at)}</div>
                    </div>
                    <div className="ftt-col-author">
                      <div className="forum-thread-author-cell">
                        <Avatar name={thread.author_name} size={28} url={profiles[thread.author_id]?.avatar_url} />
                        {thread.author_id
                          ? <Link to={`/profile/${thread.author_id}`} onClick={e => e.stopPropagation()} className="forum-author-link">{thread.author_name}</Link>
                          : <span>{thread.author_name}</span>
                        }
                      </div>
                    </div>
                    <div className="ftt-col-stat">{replyCount}</div>
                    <div className="ftt-col-stat">{(thread.views || 0).toLocaleString()}</div>
                    <div className="ftt-col-last">
                      <span className="forum-last-time">{timeAgo(thread.created_at)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

// ── Post card ──────────────────────────────────────────────────────────────────

function PostCard({ post, isQueued, onToggleQuote, avatarUrl }) {
  const [liked, setLiked] = useState(false)

  return (
    <article className="forum-post">
      <div className="forum-post-sidebar">
        {post.author_id
          ? <Link to={`/profile/${post.author_id}`}><Avatar name={post.author_name} size={48} url={avatarUrl} /></Link>
          : <Avatar name={post.author_name} size={48} url={avatarUrl} />
        }
        {post.author_id
          ? <Link to={`/profile/${post.author_id}`} className="forum-post-author forum-author-link">{post.author_name}</Link>
          : <span className="forum-post-author">{post.author_name}</span>
        }
      </div>
      <div className="forum-post-main">
        <div className="forum-post-meta-bar">
          <span className="forum-post-date">{fullDate(post.created_at)}</span>
          {post.updated_at && <span className="forum-post-edited">edited</span>}
        </div>
        <div className="forum-prose" dangerouslySetInnerHTML={{ __html: post.content }} />
        <div className="forum-post-actions">
          <button
            className={`forum-action-btn${liked ? ' liked' : ''}`}
            onClick={() => setLiked(l => !l)}
          >
            <i className={liked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
          </button>
          <button
            className={`forum-action-btn${isQueued ? ' quoted' : ''}`}
            onClick={() => onToggleQuote(post)}
            title={isQueued ? 'Remove from quotes' : 'Add to quotes'}
          >
            <i className="fa-solid fa-quote-left" style={{ marginRight: '0.35rem' }} />
            {isQueued ? 'Quoted' : 'Quote'}
          </button>
        </div>
      </div>
    </article>
  )
}

// ── Thread view ────────────────────────────────────────────────────────────────

function ThreadView({ thread, category, user, onBack }) {
  const [posts, setPosts]           = useState([])
  const [profiles, setProfiles]     = useState({})
  const [loading, setLoading]       = useState(true)
  const [replyOpen, setReplyOpen]   = useState(false)
  const [replyBody, setReplyBody]   = useState('')
  const [replyKey, setReplyKey]     = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [quotedIds, setQuotedIds]   = useState([]) // IDs of posts queued for multi-quote
  const replyRef = useRef(null)

  const displayName = memberName(user)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('thread_id', thread.id)
        .order('created_at', { ascending: true })
      setPosts(data || [])
      const ids = [...new Set((data || []).map(p => p.author_id).filter(Boolean))]
      if (ids.length) {
        const { data: profs } = await supabase.from('profiles').select('id, avatar_url').in('id', ids)
        const map = {}; profs?.forEach(p => { map[p.id] = p }); setProfiles(map)
      }
      setLoading(false)
      await supabase.from('forum_threads').update({ views: (thread.views || 0) + 1 }).eq('id', thread.id)
    }
    load()
  }, [thread.id, thread.views])

  // Toggle a post in/out of the quote queue
  function handleToggleQuote(post) {
    setQuotedIds(prev =>
      prev.includes(post.id)
        ? prev.filter(id => id !== post.id)
        : [...prev, post.id]
    )
  }

  // Build combined quote HTML from all queued posts, in order
  function buildQuoteContent(extraPost = null) {
    const queue = extraPost
      ? [extraPost]
      : posts.filter(p => quotedIds.includes(p.id))
    return queue
      .map(p => {
        const plain = p.content.replace(/<[^>]+>/g, '').trim()
        return `<blockquote><p><strong>${p.author_name} wrote:</strong></p><p>${plain}</p></blockquote>`
      })
      .join('') + '<p></p>'
  }

  // Open reply editor with all queued posts as blockquotes
  function openWithQuotes() {
    setReplyBody(buildQuoteContent())
    setReplyKey(k => k + 1)
    setReplyOpen(true)
    setTimeout(() => replyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
  }

  // Plain reply (no quotes pre-filled)
  function openReply() {
    setReplyBody('')
    setReplyKey(k => k + 1)
    setReplyOpen(true)
    setTimeout(() => replyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
  }

  function closeReply() {
    setReplyOpen(false)
    setReplyBody('')
    setReplyKey(k => k + 1)
    setQuotedIds([])
  }

  async function handleReply(e) {
    e.preventDefault()
    if (!replyBody || replyBody === '<p></p>') return
    setSubmitting(true)
    const { data: newPost, error } = await supabase
      .from('forum_posts')
      .insert({ thread_id: thread.id, content: replyBody, author_id: user.id, author_name: displayName })
      .select()
      .single()
    if (!error && newPost) setPosts(prev => [...prev, newPost])
    setReplyBody('')
    setReplyKey(k => k + 1)
    setReplyOpen(false)
    setQuotedIds([])
    setSubmitting(false)
  }

  const quotedCount = quotedIds.length

  return (
    <main className="page forum-page">
      <section className="page-hero">
        <h1 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)' }}>{thread.title}</h1>
      </section>
      <div className="forum-bc-bar">
        <div className="container">
          <Breadcrumbs items={[
            { label: 'Forums', onClick: () => onBack('home') },
            { label: category.name, onClick: () => onBack('threads') },
            { label: thread.title },
          ]} />
        </div>
      </div>
      <section className="page-content">
        <div className="container">
          <div className="forum-thread-toolbar">
            <span className="forum-thread-info">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </span>
            <button
              className="btn btn-primary btn-sm"
              disabled={thread.is_locked}
              onClick={openReply}
            >
              {thread.is_locked ? 'Thread Locked' : 'Reply'}
            </button>
          </div>

          {loading ? (
            <p className="forum-loading"><i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: '0.5rem' }} />Loading posts…</p>
          ) : (
            <div className="forum-posts-list">
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  isQueued={quotedIds.includes(post.id)}
                  onToggleQuote={handleToggleQuote}
                  avatarUrl={profiles[post.author_id]?.avatar_url}
                />
              ))}
            </div>
          )}

          {/* Multi-quote bar — appears when posts are queued */}
          {!thread.is_locked && quotedCount > 0 && !replyOpen && (
            <div className="forum-multiquote-bar">
              <span className="forum-multiquote-info">
                <i className="fa-solid fa-quote-left" />
                {quotedCount} post{quotedCount > 1 ? 's' : ''} selected
              </span>
              <button className="forum-multiquote-clear" onClick={() => setQuotedIds([])}>
                Clear
              </button>
              <button className="btn btn-primary btn-sm" onClick={openWithQuotes}>
                Reply with {quotedCount} Quote{quotedCount > 1 ? 's' : ''}
              </button>
            </div>
          )}

          {!thread.is_locked && (
            <div ref={replyRef} className="forum-reply-wrap">
              {!replyOpen ? (
                <button className="forum-reply-toggle" onClick={openReply}>
                  + Write a Reply
                </button>
              ) : (
                <div className="forum-reply-editor">
                  <div className="forum-reply-header">
                    <Avatar name={displayName} size={36} />
                    <span><strong>Reply as</strong> {displayName}</span>
                    {quotedCount > 0 && (
                      <span className="forum-reply-quote-count">
                        <i className="fa-solid fa-quote-left" /> {quotedCount} quoted
                      </span>
                    )}
                    <button type="button" className="forum-modal-close" onClick={closeReply}>
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                  <form onSubmit={handleReply}>
                    <RichTextEditor
                      key={replyKey}
                      content={replyBody}
                      onUpdate={setReplyBody}
                      placeholder="Write your reply…"
                      minHeight={140}
                    />
                    <div className="forum-reply-actions">
                      <button type="button" className="forum-btn-cancel" onClick={closeReply}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Posting…' : 'Post Reply'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

// ── Root ───────────────────────────────────────────────────────────────────────

export default function Forum() {
  const [member, setMember] = useState(null) // null=loading | false=guest | object=authed

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setMember(session?.user || false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setMember(session?.user || false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const [view, setView]                   = useState('home')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedThread, setSelectedThread]     = useState(null)
  const [showNewThread, setShowNewThread]       = useState(false)

  function selectCategory(cat) { setSelectedCategory(cat); setView('threads'); window.scrollTo(0, 0) }
  function selectThread(thread) { setSelectedThread(thread); setView('thread'); window.scrollTo(0, 0) }

  function handleBack(to) {
    if (to === 'home')    { setView('home'); setSelectedCategory(null); setSelectedThread(null) }
    if (to === 'threads') { setView('threads'); setSelectedThread(null) }
    window.scrollTo(0, 0)
  }

  async function handleNewThread({ title, body }) {
    if (!member || !selectedCategory) return
    const name = memberName(member)
    const { data: thread, error: tErr } = await supabase
      .from('forum_threads')
      .insert({ category_id: selectedCategory.id, title, author_id: member.id, author_name: name })
      .select()
      .single()
    if (tErr) return
    await supabase.from('forum_posts').insert({
      thread_id: thread.id, content: body, author_id: member.id, author_name: name,
    })
    setShowNewThread(false)
    selectThread(thread)
  }

  // Loading
  if (member === null) {
    return (
      <main className="page forum-page">
        <section className="page-hero"><h1>Community Forum</h1></section>
        <section className="page-content"><div className="container"><p className="forum-loading">Loading…</p></div></section>
      </main>
    )
  }

  if (member === false) return <MembersOnlyGate />

  const modal = showNewThread && selectedCategory && (
    <NewThreadModal
      category={selectedCategory}
      onSubmit={handleNewThread}
      onClose={() => setShowNewThread(false)}
    />
  )

  if (view === 'thread' && selectedThread && selectedCategory) {
    return (
      <>
        {modal}
        <ThreadView
          thread={selectedThread}
          category={selectedCategory}
          user={member}
          onBack={handleBack}
        />
      </>
    )
  }

  if (view === 'threads' && selectedCategory) {
    return (
      <>
        {modal}
        <ThreadList
          category={selectedCategory}
          onSelectThread={selectThread}
          onBack={() => handleBack('home')}
          onNewThread={() => setShowNewThread(true)}
        />
      </>
    )
  }

  return (
    <>
      {modal}
      <ForumHome user={member} onSelectCategory={selectCategory} />
    </>
  )
}
