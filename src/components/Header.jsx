import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
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

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

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

        <Link to="/membership" className="header-cta" onClick={() => setMenuOpen(false)}>
          Join Now
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
      </div>
    </header>
  )
}
