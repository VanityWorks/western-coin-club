/*
  SQL for Supabase (run once):
  ─────────────────────────────
  CREATE TABLE magazine_views (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    session_id text NOT NULL,
    referrer text DEFAULT 'direct',
    utm_source text,
    time_on_page integer DEFAULT 0,
    max_page_reached integer DEFAULT 0,
    total_pages integer DEFAULT 0,
    completed boolean DEFAULT false,
    user_agent text,
    screen_width integer
  );

  ALTER TABLE magazine_views ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "public_insert" ON magazine_views FOR INSERT WITH CHECK (true);
  CREATE POLICY "public_update" ON magazine_views FOR UPDATE USING (true);
  CREATE POLICY "auth_select"   ON magazine_views FOR SELECT TO authenticated USING (true);
*/

import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Magazine.css'

function uid() {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// Estimate engagement from time on page (48-page magazine)
function engagementLevel(secs) {
  if (secs >= 900) return 'completed'  // 15+ min - very likely read it all
  if (secs >= 300) return 'engaged'    // 5-15 min - read a good portion
  if (secs >= 60)  return 'browsed'    // 1-5 min - skimmed
  return 'bounced'
}

export default function Magazine() {
  const [searchParams] = useSearchParams()
  const [loaded, setLoaded] = useState(false)
  const [isMobileFallback, setIsMobileFallback] = useState(false)

  const viewIdRef = useRef(null)
  const startRef = useRef(Date.now())

  const ref = searchParams.get('ref') || 'direct'
  const utm = searchParams.get('utm_source') || null

  // Detect mobile devices that can't show inline PDFs well
  useEffect(() => {
    const ua = navigator.userAgent
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua) && window.innerWidth < 768
    setIsMobileFallback(isMobile)
  }, [])

  // ── Analytics ─────────────────────────────────────────
  useEffect(() => {
    const sid = sessionStorage.getItem('mag_sid') || uid()
    sessionStorage.setItem('mag_sid', sid)

    supabase.from('magazine_views')
      .insert({ session_id: sid, referrer: ref, utm_source: utm, user_agent: navigator.userAgent, screen_width: window.innerWidth })
      .select('id').single()
      .then(({ data }) => { if (data) viewIdRef.current = data.id })

    const tick = setInterval(flush, 15000)

    function flush() {
      if (!viewIdRef.current) return
      const elapsed = Math.round((Date.now() - startRef.current) / 1000)
      supabase.from('magazine_views').update({
        time_on_page: elapsed,
        completed: elapsed >= 900,
      }).eq('id', viewIdRef.current).then(() => {})
    }

    function onHide() {
      if (document.visibilityState !== 'hidden' || !viewIdRef.current) return
      const elapsed = Math.round((Date.now() - startRef.current) / 1000)
      const body = JSON.stringify({ time_on_page: elapsed, completed: elapsed >= 900 })
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/magazine_views?id=eq.${viewIdRef.current}`
      const headers = {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        Prefer: 'return=minimal',
      }
      fetch(url, { method: 'PATCH', headers, body, keepalive: true }).catch(() => {})
    }

    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onHide)

    return () => {
      clearInterval(tick)
      flush()
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onHide)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, utm])

  return (
    <div className="mag-shell">
      {/* Top bar */}
      <header className="mag-bar">
        <Link to="/" className="mag-back">
          <i className="fa-solid fa-arrow-left" /> <span>Back</span>
        </Link>
        <div className="mag-center">
          <img src="/logo.png" alt="" className="mag-logo" />
          <span className="mag-title">SA Coin Collectors Club Magazine</span>
        </div>
        <div className="mag-bar-spacer" />
      </header>

      {/* Viewer */}
      <main className="mag-viewer">
        {!loaded && !isMobileFallback && (
          <div className="mag-loading-overlay">
            <div className="mag-spinner" />
            <p>Loading magazine...</p>
          </div>
        )}

        {isMobileFallback ? (
          <div className="mag-mobile">
            <div className="mag-mobile-icon">
              <i className="fa-solid fa-book-open" />
            </div>
            <h2>Read Our Magazine</h2>
            <p>Tap the button below to open the full magazine in your PDF viewer.</p>
            <a href="/maga.pdf" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg mag-open-btn">
              Open Magazine
            </a>
            <p className="mag-mobile-hint">48 pages - best viewed in landscape</p>
          </div>
        ) : (
          <iframe
            src="/maga.pdf"
            className="mag-iframe"
            title="SA Coin Collectors Club Magazine"
            onLoad={() => setLoaded(true)}
          />
        )}
      </main>
    </div>
  )
}
