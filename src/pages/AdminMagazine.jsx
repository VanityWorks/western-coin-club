import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import './AdminMagazine.css'

function fmtDate(iso) {
  return new Date(iso).toLocaleString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmtTime(secs) {
  if (!secs || secs < 1) return '-'
  if (secs < 60)   return `${secs}s`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`
}

function deviceLabel(w) {
  if (!w) return 'Unknown'
  if (w < 480)  return 'Phone'
  if (w < 1024) return 'Tablet'
  return 'Desktop'
}

export default function AdminMagazine() {
  const [views, setViews] = useState([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('all')

  useEffect(() => {
    supabase.from('magazine_views')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000)
      .then(({ data }) => { setViews(data || []); setLoading(false) })
  }, [])

  // ── Filter by date range ──────────────────────────────
  const filtered = useMemo(() => {
    if (range === 'all') return views
    const now = Date.now()
    const ms = range === '24h' ? 86400e3 : range === '7d' ? 604800e3 : 2592000e3
    return views.filter(v => now - new Date(v.created_at).getTime() < ms)
  }, [views, range])

  // ── Stats ─────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = filtered.length
    if (!total) return { total: 0, unique: 0, avgTime: 0, completion: 0, avgPages: 0 }
    const unique = new Set(filtered.map(v => v.session_id)).size
    const withTime = filtered.filter(v => v.time_on_page > 0)
    const avgTime = withTime.length ? Math.round(withTime.reduce((s, v) => s + v.time_on_page, 0) / withTime.length) : 0
    const withPages = filtered.filter(v => v.total_pages > 0)
    const completed = withPages.filter(v => v.completed).length
    const completion = withPages.length ? Math.round((completed / withPages.length) * 100) : 0
    const avgPages = withPages.length ? Math.round(withPages.reduce((s, v) => s + v.max_page_reached, 0) / withPages.length) : 0
    return { total, unique, avgTime, completion, avgPages }
  }, [filtered])

  // ── Referrer breakdown ────────────────────────────────
  const referrerData = useMemo(() => {
    const map = {}
    filtered.forEach(v => {
      const key = v.utm_source || v.referrer || 'direct'
      map[key] = (map[key] || 0) + 1
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [filtered])

  // ── Device breakdown ──────────────────────────────────
  const deviceData = useMemo(() => {
    const map = {}
    filtered.forEach(v => {
      const key = deviceLabel(v.screen_width)
      map[key] = (map[key] || 0) + 1
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [filtered])

  // ── Daily views (last 30 days) ────────────────────────
  const dailyData = useMemo(() => {
    const days = {}
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      days[d.toISOString().slice(0, 10)] = 0
    }
    filtered.forEach(v => {
      const d = v.created_at?.slice(0, 10)
      if (d && days[d] !== undefined) days[d]++
    })
    return Object.entries(days)
  }, [filtered])

  const maxDaily = Math.max(...dailyData.map(d => d[1]), 1)

  if (loading) return <p className="am-empty">Loading analytics...</p>

  return (
    <div className="am-wrap">
      {/* Range selector */}
      <div className="am-range-bar">
        {[['24h', '24 Hours'], ['7d', '7 Days'], ['30d', '30 Days'], ['all', 'All Time']].map(([k, label]) => (
          <button key={k} className={`am-range-btn ${range === k ? 'active' : ''}`} onClick={() => setRange(k)}>
            {label}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="am-stats">
        <div className="am-card">
          <span className="am-card-value">{stats.total}</span>
          <span className="am-card-label">Total Views</span>
        </div>
        <div className="am-card">
          <span className="am-card-value">{stats.unique}</span>
          <span className="am-card-label">Unique Visitors</span>
        </div>
        <div className="am-card">
          <span className="am-card-value">{fmtTime(stats.avgTime)}</span>
          <span className="am-card-label">Avg. Time on Page</span>
        </div>
        <div className="am-card">
          <span className="am-card-value">{stats.completion}%</span>
          <span className="am-card-label">Read All Pages</span>
        </div>
        <div className="am-card">
          <span className="am-card-value">{stats.avgPages}</span>
          <span className="am-card-label">Avg. Pages Reached</span>
        </div>
      </div>

      {/* Charts row */}
      <div className="am-charts-row">
        {/* Daily views chart */}
        <div className="am-chart-card">
          <h3>Daily Views (Last 30 Days)</h3>
          <div className="am-chart">
            {dailyData.map(([day, count]) => (
              <div key={day} className="am-bar-col" title={`${day}: ${count} views`}>
                <div className="am-bar" style={{ height: `${(count / maxDaily) * 100}%` }} />
                <span className="am-bar-label">{day.slice(8)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Breakdown cards */}
        <div className="am-breakdown-col">
          <div className="am-chart-card">
            <h3>Traffic Source</h3>
            {referrerData.length === 0 ? (
              <p className="am-empty-small">No data yet</p>
            ) : referrerData.map(([source, count]) => (
              <div key={source} className="am-breakdown-row">
                <span className="am-breakdown-label">{source}</span>
                <div className="am-breakdown-track">
                  <div className="am-breakdown-fill" style={{ width: `${(count / (filtered.length || 1)) * 100}%` }} />
                </div>
                <span className="am-breakdown-count">{count}</span>
              </div>
            ))}
          </div>
          <div className="am-chart-card">
            <h3>Device Type</h3>
            {deviceData.length === 0 ? (
              <p className="am-empty-small">No data yet</p>
            ) : deviceData.map(([device, count]) => (
              <div key={device} className="am-breakdown-row">
                <span className="am-breakdown-label">{device}</span>
                <div className="am-breakdown-track">
                  <div className="am-breakdown-fill device" style={{ width: `${(count / (filtered.length || 1)) * 100}%` }} />
                </div>
                <span className="am-breakdown-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent views table */}
      <div className="am-table-card">
        <h3>Recent Views</h3>
        <div className="am-table-scroll">
          <table className="am-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Source</th>
                <th>Device</th>
                <th>Time</th>
                <th>Pages</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map(v => (
                <tr key={v.id}>
                  <td>{fmtDate(v.created_at)}</td>
                  <td><span className="am-source-tag">{v.utm_source || v.referrer || 'direct'}</span></td>
                  <td>{deviceLabel(v.screen_width)}</td>
                  <td>{fmtTime(v.time_on_page)}</td>
                  <td>{v.max_page_reached}{v.total_pages ? ` / ${v.total_pages}` : ''}</td>
                  <td>{v.completed ? <span className="am-yes">Yes</span> : <span className="am-no">No</span>}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="am-empty-cell">No views recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shareable link helper */}
      <div className="am-link-card">
        <h3>Shareable Links</h3>
        <p className="am-link-hint">Use these tracked links so you can see where traffic comes from:</p>
        <div className="am-link-examples">
          <div className="am-link-row">
            <span className="am-link-label">Home page button</span>
            <code>/magazine?ref=home</code>
          </div>
          <div className="am-link-row">
            <span className="am-link-label">Newsletter</span>
            <code>/magazine?ref=newsletter</code>
          </div>
          <div className="am-link-row">
            <span className="am-link-label">Advertiser (custom)</span>
            <code>/magazine?utm_source=advertiser_name</code>
          </div>
        </div>
      </div>
    </div>
  )
}
