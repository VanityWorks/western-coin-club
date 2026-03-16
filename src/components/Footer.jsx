import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="logo-icon">◎</span>
          <span>South African Coin Collectors Club</span>
        </div>
        <div className="footer-links">
          <Link to="/about">About</Link>
          <Link to="/membership">Membership</Link>
          <Link to="/news">News</Link>
          <Link to="/consulting">Consulting</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} South African Coin Collectors Club. South Africa's home for numismatics.</p>
      </div>
    </footer>
  )
}
