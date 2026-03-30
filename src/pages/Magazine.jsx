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
    screen_width integer,
    ip_address text
  );

  ALTER TABLE magazine_views ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "public_insert" ON magazine_views FOR INSERT WITH CHECK (true);
  CREATE POLICY "public_update" ON magazine_views FOR UPDATE USING (true);
  CREATE POLICY "auth_select"   ON magazine_views FOR SELECT TO authenticated USING (true);
*/

import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import * as pdfjsLib from 'pdfjs-dist'
import { supabase } from '../lib/supabase'
import './Magazine.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js'

const PDF_URL = 'https://qkwbqozshaajvthofocl.supabase.co/storage/v1/object/public/magazine/maga.pdf'

function uid() {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function Magazine() {
  const [searchParams] = useSearchParams()
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState(false)

  const pdfRef = useRef(null)
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const renderTaskRef = useRef(null)
  const viewIdRef = useRef(null)
  const maxPageRef = useRef(1)
  const startRef = useRef(Date.now())
  const touchStartRef = useRef(null)

  const ref = searchParams.get('ref') || 'direct'
  const utm = searchParams.get('utm_source') || null

  // ── Load PDF document ─────────────────────────────────
  useEffect(() => {
    const loadingTask = pdfjsLib.getDocument({
      url: PDF_URL,
      rangeChunkSize: 65536 * 4,
      disableAutoFetch: true,
      disableStream: false,
    })
    loadingTask.promise.then(pdf => {
      pdfRef.current = pdf
      setNumPages(pdf.numPages)
      setLoading(false)
    }).catch(() => setError(true))

    return () => loadingTask.destroy?.()
  }, [])

  // ── Render current page ───────────────────────────────
  const renderPage = useCallback(async (pageNum) => {
    if (!pdfRef.current || !canvasRef.current || !containerRef.current) return
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel()
      renderTaskRef.current = null
    }
    setRendering(true)
    try {
      const page = await pdfRef.current.getPage(pageNum)
      const container = containerRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      // Fit to container width with some padding
      const containerWidth = container.clientWidth - 32
      const containerHeight = container.clientHeight - 32
      const viewport = page.getViewport({ scale: 1 })
      const scaleW = containerWidth / viewport.width
      const scaleH = containerHeight / viewport.height
      const scale = Math.min(scaleW, scaleH)
      const scaled = page.getViewport({ scale })

      const dpr = window.devicePixelRatio || 1
      canvas.width = scaled.width * dpr
      canvas.height = scaled.height * dpr
      canvas.style.width = `${scaled.width}px`
      canvas.style.height = `${scaled.height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const task = page.render({ canvasContext: ctx, viewport: scaled })
      renderTaskRef.current = task
      await task.promise
      renderTaskRef.current = null
    } catch (e) {
      if (e?.name !== 'RenderingCancelled') console.error(e)
    }
    setRendering(false)
  }, [])

  useEffect(() => {
    if (!loading && numPages > 0) renderPage(currentPage)
  }, [currentPage, loading, numPages, renderPage])

  // Re-render on resize
  useEffect(() => {
    function onResize() { if (!loading) renderPage(currentPage) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [currentPage, loading, renderPage])

  // ── Navigation ────────────────────────────────────────
  function goTo(page) {
    const p = Math.max(1, Math.min(page, numPages))
    setCurrentPage(p)
    if (p > maxPageRef.current) maxPageRef.current = p
  }

  // Keyboard navigation
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goTo(currentPage + 1) }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goTo(currentPage - 1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Swipe navigation
  function onTouchStart(e) { touchStartRef.current = e.touches[0].clientX }
  function onTouchEnd(e) {
    if (touchStartRef.current === null) return
    const diff = touchStartRef.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) goTo(currentPage + 1) // swipe left = next
      else goTo(currentPage - 1) // swipe right = prev
    }
    touchStartRef.current = null
  }

  // ── Analytics ─────────────────────────────────────────
  useEffect(() => {
    const sid = sessionStorage.getItem('mag_sid') || uid()
    sessionStorage.setItem('mag_sid', sid)

    fetch('https://api.ipify.org?format=json')
      .then(r => r.json()).then(d => d.ip).catch(() => null)
      .then(ip => {
        supabase.from('magazine_views')
          .insert({ session_id: sid, referrer: ref, utm_source: utm, user_agent: navigator.userAgent, screen_width: window.innerWidth, ip_address: ip })
          .select('id').single()
          .then(({ data }) => { if (data) viewIdRef.current = data.id })
      })

    const tick = setInterval(flush, 15000)

    function flush() {
      if (!viewIdRef.current) return
      supabase.from('magazine_views').update({
        time_on_page: Math.round((Date.now() - startRef.current) / 1000),
        max_page_reached: maxPageRef.current,
        total_pages: numPages || 0,
        completed: numPages > 0 && maxPageRef.current >= numPages,
      }).eq('id', viewIdRef.current).then(() => {})
    }

    function onHide() {
      if (document.visibilityState !== 'hidden' || !viewIdRef.current) return
      const body = JSON.stringify({
        time_on_page: Math.round((Date.now() - startRef.current) / 1000),
        max_page_reached: maxPageRef.current,
        total_pages: numPages || 0,
        completed: numPages > 0 && maxPageRef.current >= numPages,
      })
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
    return () => { clearInterval(tick); flush(); document.removeEventListener('visibilitychange', onHide); window.removeEventListener('pagehide', onHide) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, utm, numPages])

  // ── Render ────────────────────────────────────────────
  if (error) {
    return (
      <div className="mag-shell">
        <div className="mag-error">
          <h2>Unable to load magazine</h2>
          <p>Please try refreshing the page.</p>
          <Link to="/" className="btn btn-primary">Back to site</Link>
        </div>
      </div>
    )
  }

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

      {/* Page area */}
      <div
        className="mag-page-area"
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {loading ? (
          <div className="mag-loading">
            <div className="mag-spinner" />
            <p>Loading magazine...</p>
          </div>
        ) : (
          <>
            <canvas ref={canvasRef} className="mag-canvas" />
            {rendering && <div className="mag-page-loading"><div className="mag-spinner-sm" /></div>}
          </>
        )}
      </div>

      {/* Bottom controls */}
      {!loading && numPages > 0 && (
        <nav className="mag-controls">
          <button
            className="mag-arrow mag-prev"
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous page"
          >
            <i className="fa-solid fa-chevron-left" />
          </button>

          <div className="mag-page-info">
            <span className="mag-page-num">Page {currentPage} of {numPages}</span>
            <input
              type="range"
              className="mag-slider"
              min={1}
              max={numPages}
              value={currentPage}
              onChange={e => goTo(Number(e.target.value))}
              aria-label="Page slider"
            />
          </div>

          <button
            className="mag-arrow mag-next"
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage >= numPages}
            aria-label="Next page"
          >
            <i className="fa-solid fa-chevron-right" />
          </button>
        </nav>
      )}
    </div>
  )
}
