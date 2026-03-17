import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './MemberLogin.css'

export default function MemberLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Invalid email or password. Please check your credentials.')
      setLoading(false)
      return
    }

    navigate('/forum')
  }

  return (
    <div className="member-login-wrap">
      <div className="member-login-card">
        <Link to="/">
          <img src="/logo.png" alt="SACCC" className="member-login-logo" />
        </Link>
        <h1 className="member-login-title">Member Login</h1>
        <p className="member-login-sub">Access the Members Forum</p>

        <form onSubmit={handleSubmit} className="member-login-form">
          <label className="member-field">
            <span>Email Address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              required
              autoFocus
              placeholder="your@email.com"
            />
          </label>
          <label className="member-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              required
              placeholder="••••••••"
            />
          </label>
          {error && <p className="member-login-error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-lg member-login-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="member-login-footer">
          Not a member yet?{' '}
          <Link to="/join">Apply to join →</Link>
        </p>
        <Link to="/" className="member-back-link">← Back to site</Link>
      </div>
    </div>
  )
}
