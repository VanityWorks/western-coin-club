import { Link } from 'react-router-dom'
import './Newsletter.css'

export default function Newsletter() {
  return (
    <div className="nl-shell">
      <header className="nl-bar">
        <Link to="/" className="nl-back">
          <i className="fa-solid fa-arrow-left" /> <span>Back</span>
        </Link>
        <div className="nl-center">
          <img src="/logo.png" alt="" className="nl-logo" />
          <span className="nl-title">The Collector's Pulse</span>
        </div>
        <div className="nl-spacer" />
      </header>

      <main className="nl-viewer">
        <iframe
          src="/newsletter-march-2026.html"
          className="nl-iframe"
          title="The Collector's Pulse - March 2026"
        />
      </main>
    </div>
  )
}
