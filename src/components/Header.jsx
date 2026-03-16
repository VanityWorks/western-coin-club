import { useState, useRef, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import './Header.css'

const mainNavItems = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/membership', label: 'Membership' },
]

const moreNavItems = [
  { to: '/news', label: 'News' },
  { to: '/consulting', label: 'Consulting' },
  { to: '/forum', label: 'Forum' },
  { to: '/contact', label: 'Contact' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const closeAll = () => {
    setMenuOpen(false)
    setMoreOpen(false)
  }

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <span className="logo-icon">◎</span>
          <span className="logo-text">Western Coin Club</span>
        </Link>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={menuOpen ? 'open' : ''}></span>
          <span className={menuOpen ? 'open' : ''}></span>
          <span className={menuOpen ? 'open' : ''}></span>
        </button>

        <nav className={`nav ${menuOpen ? 'open' : ''}`}>
          {mainNavItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeAll}
            >
              {label}
            </NavLink>
          ))}
          <div className="nav-dropdown" ref={moreRef}>
            <button
              className={`nav-link nav-dropdown-trigger ${moreOpen ? 'open' : ''}`}
              onClick={(e) => { e.stopPropagation(); setMoreOpen(!moreOpen) }}
            >
              More
              <span className="dropdown-chevron">▾</span>
            </button>
            {moreOpen && (
              <div className="nav-dropdown-menu">
                {moreNavItems.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) => `nav-dropdown-link ${isActive ? 'active' : ''}`}
                    onClick={closeAll}
                  >
                    {label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
          <Link to="/membership" className="nav-cta" onClick={closeAll}>
            Join Now
          </Link>
        </nav>
      </div>
    </header>
  )
}
