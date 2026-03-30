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

import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { supabase } from '../lib/supabase'
import './Magazine.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`

function uid() {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function Magazine() {
  const [searchParams] = useSearchParams()
  const [numPages, setNumPages] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [width, setWidth] = useState(null)
  const [error, setError] = useState(false)

  const containerRef = useRef(null)
  const viewIdRef = useRef(null)
  const maxPageRef = useRef(1)
  const numPagesRef = useRef(0)
  const startRef = useRef(Date.now())
  const observerRef = useRef(null)

  const ref = searchParams.get('ref') || 'direct'
  const utm = searchParams.get('utm_source') || null

  // ── Responsive width ──────────────────────────────────
  useEffect(() => {
    function measure() {
      if (containerRef.current) setWidth(containerRef.current.clientWidth)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // ── Analytics: insert + periodic update + unload ──────
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
      supabase.from('magazine_views').update({
        time_on_page: Math.round((Date.now() - startRef.current) / 1000),
        max_page_reached: maxPageRef.current,
        total_pages: numPagesRef.current,
        completed: numPagesRef.current > 0 && maxPageRef.current >= numPagesRef.current,
      }).eq('id', viewIdRef.current).then(() => {})
    }

    function onHide() {
      if (document.visibilityState !== 'hidden' || !viewIdRef.current) return
      const body = JSON.stringify({
        time_on_page: Math.round((Date.now() - startRef.current) / 1000),
        max_page_reached: maxPageRef.current,
        total_pages: numPagesRef.current,
        completed: numPagesRef.current > 0 && maxPageRef.current >= numPagesRef.current,
      })
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/magazine_views?id=eq.${viewIdRef.current}`
      const headers = {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        Prefer: 'return=minimal',
      }
      // keepalive fetch survives page close better than supabase client
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

  // ── Page intersection observer ────────────────────────
  const observePage = useCallback((node) => {
    if (!node) return
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver((entries) => {
        let best = null
        entries.forEach(e => {
          if (e.isIntersecting && (!best || e.intersectionRatio > best.intersectionRatio)) best = e
        })
        if (best) {
          const p = parseInt(best.target.dataset.page)
          setCurrentPage(p)
          if (p > maxPageRef.current) maxPageRef.current = p
        }
      }, { threshold: [0, 0.25, 0.5, 0.75] })
    }
    observerRef.current.observe(node)
  }, [])

  function onLoadSuccess({ numPages: n }) {
    setNumPages(n)
    numPagesRef.current = n
  }

  const pageWidth = width ? Math.min(width - 16, 960) : 800

  return (
    <div className="mag-shell">
      {/* Top bar */}
      <header className="mag-bar">
        <Link to="/" className="mag-back"><i className="fa-solid fa-arrow-left" /> Back to site</Link>
        <span className="mag-title">WCCC Magazine</span>
        <span className="mag-indicator">
          {numPages ? `${currentPage} / ${numPages}` : ''}
        </span>
      </header>

      {/* PDF viewer */}
      <main className="mag-viewer" ref={containerRef}>
        {error ? (
          <div className="mag-error">
            <h2>Unable to load magazine</h2>
            <p>Please try refreshing the page.</p>
          </div>
        ) : (
          <Document
            file="/maga.pdf"
            onLoadSuccess={onLoadSuccess}
            onLoadError={() => setError(true)}
            loading={<div className="mag-loading"><div className="mag-spinner" /><p>Loading magazine...</p></div>}
          >
            {numPages && Array.from({ length: numPages }, (_, i) => (
              <div key={i + 1} className="mag-page" data-page={i + 1} ref={observePage}>
                <Page
                  pageNumber={i + 1}
                  width={pageWidth}
                  loading={<div className="mag-skeleton" style={{ width: pageWidth, height: pageWidth * 1.414 }} />}
                  renderTextLayer
                  renderAnnotationLayer
                />
                <span className="mag-page-num">Page {i + 1}</span>
              </div>
            ))}
          </Document>
        )}
      </main>
    </div>
  )
}
