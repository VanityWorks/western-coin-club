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
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

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

  async function handleReset(e) {
    e.preventDefault()
    if (!email) { setError('Please enter your email address.'); return }
    setResetLoading(true)
    setError('')
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://www.coinclub.co.za/settings',
    })
    if (resetErr) {
      if (resetErr.status === 429) {
        setError('Too many requests. Please wait a few minutes and try again.')
      } else {
        setError('No account found with that email address. Please check and try again.')
      }
    } else {
      setResetSent(true)
    }
    setResetLoading(false)
  }

  return (
    <div className="member-login-wrap">
      <div className="member-login-card">
        <Link to="/">
          <img src="/logo.png" alt="SACCC" className="member-login-logo" />
        </Link>
        <h1 className="member-login-title">{resetMode ? 'Reset Password' : 'Member Login'}</h1>
        <p className="member-login-sub">{resetMode ? 'Enter your email to receive a reset link' : 'Access the Members Forum'}</p>

        {resetMode ? (
          resetSent ? (
            <div className="member-login-form">
              <p style={{ color: 'var(--sa-green)', fontWeight: 600, textAlign: 'center', margin: '1.5rem 0' }}>
                Password reset link sent! Check your inbox.
              </p>
              <button className="btn btn-primary btn-lg member-login-btn" onClick={() => { setResetMode(false); setResetSent(false) }}>
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="member-login-form">
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
              {error && <p className="member-login-error">{error}</p>}
              <button type="submit" className="btn btn-primary btn-lg member-login-btn" disabled={resetLoading}>
                {resetLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button type="button" className="member-reset-link" onClick={() => { setResetMode(false); setError('') }}>
                Back to Login
              </button>
            </form>
          )
        ) : (
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
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <button type="button" className="member-reset-link" onClick={() => { setResetMode(true); setError('') }}>
              Forgot your password?
            </button>
          </form>
        )}

        <p className="member-login-footer">
          Not a member yet?{' '}
          <Link to="/join">Apply to join →</Link>
        </p>
        <Link to="/" className="member-back-link">← Back to site</Link>
      </div>
    </div>
  )
}
