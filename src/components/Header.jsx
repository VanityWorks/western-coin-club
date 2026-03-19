import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import './Header.css'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/membership', label: 'Membership' },
  { to: '/news', label: 'News' },
  { to: '/consulting', label: 'Consulting' },
  { to: '/forum', label: 'Forum' },
  { to: '/contact', label: 'Contact' },
]

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return parts[0].slice(0, 2).toUpperCase()
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const dropRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setDropOpen(false)
    navigate('/')
  }

  function handleCopyReferral() {
    const ref = user.id
    const link = `${window.location.origin}/join?ref=${ref}`
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo" aria-label="South African Coin Collectors Club - Home">
          <img src="/logo.png" alt="" className="logo-img" />
        </Link>

        <nav className={`header-nav ${menuOpen ? 'open' : ''}`}>
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {user ? (
          <div className="header-user" ref={dropRef}>
            <button
              className="header-avatar-btn"
              onClick={() => setDropOpen(v => !v)}
              aria-label="Account menu"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="header-avatar-img" />
              ) : (
                <span className="header-avatar-initials">{getInitials(profile?.display_name)}</span>
              )}
            </button>
            {dropOpen && (
              <div className="header-dropdown">
                <div className="header-dropdown-top">
                  <span className="header-dropdown-name">{profile?.display_name || user.email}</span>
                </div>
                <Link to={`/profile/${user.id}`} className="header-dropdown-item" onClick={() => setDropOpen(false)}>
                  <i className="fa-solid fa-user" /> My Profile
                </Link>
                <Link to="/settings" className="header-dropdown-item" onClick={() => setDropOpen(false)}>
                  <i className="fa-solid fa-gear" /> Settings
                </Link>
                <button className="header-dropdown-item" onClick={handleCopyReferral}>
                  <i className="fa-solid fa-link" /> {copied ? 'Copied!' : 'Copy Referral Link'}
                </button>
                <button className="header-dropdown-item header-dropdown-signout" onClick={handleSignOut}>
                  <i className="fa-solid fa-arrow-right-from-bracket" /> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/join" className="header-cta" onClick={() => setMenuOpen(false)}>
            Join The Club
          </Link>
        )}

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={menuOpen ? 'open' : ''}></span>
          <span className={menuOpen ? 'open' : ''}></span>
          <span className={menuOpen ? 'open' : ''}></span>
        </button>
      </div>
    </header>
  )
}
