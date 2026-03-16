import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <Link to="/" className="footer-brand" aria-label="South African Coin Collectors Club - Home">
          <img src="/logo-footer.png" alt="" className="footer-logo" />
        </Link>
        <div className="footer-links">
          <Link to="/about">About</Link>
          <Link to="/membership">Membership</Link>
          <Link to="/news">News</Link>
          <Link to="/consulting">Consulting</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} South African Coin Collectors Club. South Africa's home for the world of coins.</p>
      </div>
    </footer>
  )
}
