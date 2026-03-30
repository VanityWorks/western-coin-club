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

import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Worker, Viewer } from '@react-pdf-viewer/core'
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout'
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'
import { supabase } from '../lib/supabase'
import './Magazine.css'

function uid() {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function Magazine() {
  const [searchParams] = useSearchParams()
  const viewIdRef = useRef(null)
  const maxPageRef = useRef(1)
  const numPagesRef = useRef(0)
  const startRef = useRef(Date.now())

  const ref = searchParams.get('ref') || 'direct'
  const utm = searchParams.get('utm_source') || null

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: () => [],
  })

  // ── Analytics ─────────────────────────────────────────
  useEffect(() => {
    const sid = sessionStorage.getItem('mag_sid') || uid()
    sessionStorage.setItem('mag_sid', sid)

    // Fetch IP then insert view
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

  function handleDocumentLoad(e) {
    numPagesRef.current = e.doc.numPages
  }

  function handlePageChange(e) {
    const page = e.currentPage + 1
    if (page > maxPageRef.current) maxPageRef.current = page
  }

  return (
    <div className="mag-shell">
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

      <main className="mag-viewer">
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <Viewer
            fileUrl="https://qkwbqozshaajvthofocl.supabase.co/storage/v1/object/public/magazine/maga.pdf"
            defaultScale={1}
            plugins={[defaultLayoutPluginInstance]}
            onDocumentLoad={handleDocumentLoad}
            onPageChange={handlePageChange}
            enableSmoothScroll
            renderLoader={(percentages) => (
              <div className="mag-loading">
                <div className="mag-spinner" />
                <p>Loading magazine{percentages > 0 ? ` - ${Math.round(percentages)}%` : '...'}</p>
              </div>
            )}
          />
        </Worker>
      </main>
    </div>
  )
}
