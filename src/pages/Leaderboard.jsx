import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import './Page.css'
import './Leaderboard.css'

const MEDALS = ['🥇', '🥈', '🥉']

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return parts[0].slice(0, 2).toUpperCase()
}

export default function Leaderboard() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)

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
                <Link to={`/profile/${m.id}`} key={m.id} className="lb-row">
                  <div className="lb-rank">
                    {i < 3 ? <span className="lb-medal">{MEDALS[i]}</span> : <span className="lb-rank-num">{i + 1}</span>}
                  </div>
                  <div className="lb-avatar">
                    {m.avatar_url
                      ? <img src={m.avatar_url} alt="" />
                      : <span>{getInitials(m.display_name)}</span>
                    }
                  </div>
                  <div className="lb-info">
                    <strong className="lb-name">{m.display_name}</strong>
                    {m.membership_number && <span className="lb-num">#{m.membership_number}</span>}
                  </div>
                  <div className="lb-points">
                    <span className="lb-points-val">{m.referral_points}</span>
                    <span className="lb-points-label">{m.referral_points === 1 ? 'referral' : 'referrals'}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </section>
    </main>
  )
}
