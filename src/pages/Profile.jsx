import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import './Profile.css'

const BADGE_COLORS = {
  'Admin':           { bg: '#E63946', text: '#fff' },
  'Moderator':       { bg: '#007749', text: '#fff' },
  'Top Contributor': { bg: '#FFB81C', text: '#111' },
  'Bassanis':        { bg: '#7b2d8b', text: '#fff' },
  'Veteran Member':  { bg: '#0077b6', text: '#fff' },
  'Gold Member':     { bg: '#b8860b', text: '#fff' },
  'Silver Member':   { bg: '#888',    text: '#fff' },
  'Newcomer':        { bg: '#525252', text: '#fff' },
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return parts[0].slice(0, 2).toUpperCase()
}

function Avatar({ url, name, size = 80 }) {
  if (url) return <img src={url} alt={name} className="profile-avatar-img" style={{ width: size, height: size }} />
  return (
    <div className="profile-avatar-initials" style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {getInitials(name)}
    </div>
  )
}

function Badge({ label }) {
  const style = BADGE_COLORS[label] || { bg: '#525252', text: '#fff' }
  return (
    <span className="profile-badge" style={{ background: style.bg, color: style.text }}>
      {label}
    </span>
  )
}

function timeAgo(iso) {
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (secs < 60)     return 'Just now'
  if (secs < 3600)   return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400)  return `${Math.floor(secs / 3600)}h ago`
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`
  return new Date(iso).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Profile() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile]       = useState(null)
  const [threads, setThreads]       = useState([])
  const [postCount, setPostCount]   = useState(0)
  const [loading, setLoading]       = useState(true)
  const [notFound, setNotFound]     = useState(false)

  const isOwn = user?.id === id

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: prof, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !prof) { setNotFound(true); setLoading(false); return }
      setProfile(prof)

      if (user && prof.show_posts !== false) {
        const [threadRes, postCountRes] = await Promise.all([
          supabase
            .from('forum_threads')
            .select('id, title, category_id, views, created_at, forum_posts(count)')
            .eq('author_id', id)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('forum_posts')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', id),
        ])
        setThreads(threadRes.data || [])
        setPostCount(postCountRes.count || 0)
      }

      setLoading(false)
    }
    load()
  }, [id, user])

  if (loading) return (
    <main className="page profile-page">
      <div className="profile-loading"><i className="fa-solid fa-circle-notch fa-spin" /> Loading profile…</div>
    </main>
  )

  if (notFound) return (
    <main className="page profile-page">
      <div className="profile-not-found">
        <h2>Profile not found</h2>
        <p>This member doesn't exist or their profile is private.</p>
        <Link to="/forum" className="btn btn-primary">Back to Forum</Link>
      </div>
    </main>
  )

  const joinedDate = new Date(profile.created_at).toLocaleDateString('en-ZA', {
    month: 'long', year: 'numeric'
  })

  const allBadges = [...(profile.roles || []), ...(profile.awards || [])]

  return (
    <main className="page profile-page">
      <section className="page-hero profile-hero">
        <div className="profile-hero-inner container">
          <div className="profile-hero-avatar">
            <Avatar url={profile.avatar_url} name={profile.display_name} size={96} />
          </div>
          <div className="profile-hero-info">
            <h1 className="profile-name">{profile.display_name}</h1>
            {allBadges.length > 0 && (
              <div className="profile-badges">
                {allBadges.map(b => <Badge key={b} label={b} />)}
              </div>
            )}
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            <div className="profile-meta">
              {profile.show_location && profile.location && (
                <span><i className="fa-solid fa-location-dot" /> {profile.location}</span>
              )}
              <span><i className="fa-solid fa-calendar" /> Member since {joinedDate}</span>
            </div>
          </div>
          {isOwn && (
            <Link to="/settings" className="profile-edit-btn">
              <i className="fa-solid fa-pen" /> Edit Profile
            </Link>
          )}
        </div>
      </section>

      <section className="profile-stats-bar">
        <div className="container profile-stats-inner">
          <div className="profile-stat">
            <strong>{threads.length > 0 ? threads.length : (user ? threads.length : '—')}</strong>
            <span>Threads</span>
          </div>
          <div className="profile-stat">
            <strong>{user ? postCount : '—'}</strong>
            <span>Posts</span>
          </div>
        </div>
      </section>

      <section className="profile-content container">
        {!user ? (
          <div className="profile-guest-notice">
            <i className="fa-solid fa-lock" />
            <p><Link to="/login">Sign in</Link> to see this member's posts and threads.</p>
          </div>
        ) : profile.show_posts === false && !isOwn ? (
          <div className="profile-guest-notice">
            <i className="fa-solid fa-eye-slash" />
            <p>This member's post history is private.</p>
          </div>
        ) : threads.length === 0 ? (
          <p className="profile-empty">No threads yet.</p>
        ) : (
          <>
            <h2 className="profile-section-title">Recent Threads</h2>
            <div className="profile-thread-list">
              {threads.map(t => (
                <Link key={t.id} to={`/forum?thread=${t.id}`} className="profile-thread-card">
                  <div className="profile-thread-title">{t.title}</div>
                  <div className="profile-thread-meta">
                    <span><i className="fa-regular fa-comment" /> {t.forum_posts?.[0]?.count ?? 0} replies</span>
                    <span><i className="fa-regular fa-eye" /> {t.views || 0} views</span>
                    <span>{timeAgo(t.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  )
}
