import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="logo-icon">◎</span>
          <span>Western Coin Club</span>
        </div>
        <div className="footer-links">
          <Link to="/about">About</Link>
          <Link to="/membership">Membership</Link>
          <Link to="/news">News</Link>
          <Link to="/consulting">Consulting</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <div className="footer-accent">
          <span className="accent-dot green"></span>
          <span className="accent-dot gold"></span>
          <span className="accent-dot red"></span>
          <span className="accent-dot blue"></span>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Western Coin Club. South Africa's home for numismatics.</p>
      </div>
    </footer>
  )
}
