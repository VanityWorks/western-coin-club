import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import './MemberLogin.css'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const uid = searchParams.get('uid')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: 'reset', token, uid, password }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else setDone(true)
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  if (!token || !uid) {
    return (
      <div className="member-login-wrap">
        <div className="member-login-card">
          <Link to="/"><img src="/logo.png" alt="SACCC" className="member-login-logo" /></Link>
          <h1 className="member-login-title">Invalid Link</h1>
          <p className="member-login-sub">This password reset link is invalid or has expired.</p>
          <Link to="/login" className="btn btn-primary btn-lg member-login-btn">Back to Login</Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="member-login-wrap">
        <div className="member-login-card">
          <Link to="/"><img src="/logo.png" alt="SACCC" className="member-login-logo" /></Link>
          <h1 className="member-login-title">Password Updated</h1>
          <p className="member-login-sub">Your password has been reset successfully.</p>
          <button className="btn btn-primary btn-lg member-login-btn" onClick={() => navigate('/login')}>
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="member-login-wrap">
      <div className="member-login-card">
        <Link to="/"><img src="/logo.png" alt="SACCC" className="member-login-logo" /></Link>
        <h1 className="member-login-title">Set New Password</h1>
        <p className="member-login-sub">Choose a new password for your account</p>

        <form onSubmit={handleSubmit} className="member-login-form">
          <label className="member-field">
            <span>New Password</span>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              required
              autoFocus
              placeholder="Min 6 characters"
            />
          </label>
          <label className="member-field">
            <span>Confirm Password</span>
            <input
              type="password"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setError('') }}
              required
              placeholder="Repeat password"
            />
          </label>
          {error && <p className="member-login-error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-lg member-login-btn" disabled={loading}>
            {loading ? 'Updating...' : 'Reset Password'}
          </button>
        </form>

        <Link to="/login" className="member-back-link">Back to Login</Link>
      </div>
    </div>
  )
}
