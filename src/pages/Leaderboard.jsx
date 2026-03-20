import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import './Page.css'
import './Leaderboard.css'

const MEDALS = [
  { icon: 'fa-solid fa-trophy', color: '#F5A623' },
  { icon: 'fa-solid fa-trophy', color: '#9B9B9B' },
  { icon: 'fa-solid fa-trophy', color: '#CD7F32' },
]

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return parts[0].slice(0, 2).toUpperCase()
}

function Avatar({ url, name, size = 44 }) {
  return (
    <div className="lb-avatar" style={{ width: size, height: size }}>
      {url ? <img src={url} alt="" /> : <span>{getInitials(name)}</span>}
    </div>
  )
}

function ReferredList({ member }) {
  const [refs, setRefs] = useState(null)

  useEffect(() => {
    supabase
      .rpc('get_referred_members', {
        referrer_membership_number: member.membership_number || '',
        referrer_uuid: member.id,
      })
      .then(({ data }) => setRefs(data || []))
  }, [member.id])

  if (refs === null) return <p className="lb-refs-loading">Loading...</p>
  if (refs.length === 0) return <p className="lb-refs-empty">No referred members found.</p>

  return (
    <div className="lb-refs-list">
      {refs.map(r => (
        <Link to={`/profile/${r.id}`} key={r.id} className="lb-ref-row">
          <Avatar url={r.avatar_url} name={r.display_name} size={32} />
          <span className="lb-ref-name">{r.display_name}</span>
          {r.membership_number && <span className="lb-ref-num">#{r.membership_number}</span>}
        </Link>
      ))}
    </div>
  )
}

export default function Leaderboard() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading])

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, membership_number, referral_points')
        .gt('referral_points', 0)
        .order('referral_points', { ascending: false })
        .limit(50)
      setLeaders(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  if (authLoading || !user) return null

  return (
    <main className="page leaderboard-page">
      <section className="page-hero">
        <h1>Referral Leaderboard</h1>
        <p>Members earning points by growing the club</p>
      </section>

      <section className="page-content">
        <div className="container narrow">

          <div className="lb-how">
            <i className="fa-solid fa-link" />
            <span>Share your referral link from the profile menu. Every member you bring in earns you a point.</span>
          </div>

          {loading ? (
            <p className="lb-empty">Loading...</p>
          ) : leaders.length === 0 ? (
            <div className="lb-empty">
              <p>No referrals yet - be the first!</p>
            </div>
          ) : (
            <div className="lb-list">
              {leaders.map((m, i) => (
                <div key={m.id} className="lb-card">
                  <div
                    className="lb-row"
                    onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                  >
                    <div className="lb-rank">
                      {i < 3
                        ? <i className={`${MEDALS[i].icon} lb-medal`} style={{ color: MEDALS[i].color }} />
                        : <span className="lb-rank-num">{i + 1}</span>
                      }
                    </div>
                    <Avatar url={m.avatar_url} name={m.display_name} />
                    <div className="lb-info">
                      <strong className="lb-name">{m.display_name}</strong>
                      {m.membership_number && <span className="lb-num">#{m.membership_number}</span>}
                    </div>
                    <div className="lb-points">
                      <span className="lb-points-val">{m.referral_points}</span>
                      <span className="lb-points-label">{m.referral_points === 1 ? 'referral' : 'referrals'}</span>
                    </div>
                    <i className={`fa-solid fa-chevron-${expanded === m.id ? 'up' : 'down'} lb-chevron`} />
                  </div>

                  {expanded === m.id && (
                    <div className="lb-expand">
                      <div className="lb-expand-header">
                        <i className="fa-solid fa-users" />
                        <span>Members referred by {m.display_name.split(' ')[0]}</span>
                        <Link to={`/profile/${m.id}`} className="lb-profile-link">View profile</Link>
                      </div>
                      <ReferredList member={m} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </section>
    </main>
  )
}
