import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { supabase } from '../lib/supabase'
import RichTextEditor from '../components/RichTextEditor'
import AdminNews from './AdminNews'
import './Admin.css'

// The admin password is verified server-side via the ADMIN_SECRET env variable
// set in your Supabase project: Dashboard → Edge Functions → Secrets → ADMIN_SECRET

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-ZA', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function timeAgo(iso) {
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (secs < 60)     return 'Just now'
  if (secs < 3600)   return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400)  return `${Math.floor(secs / 3600)}h ago`
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`
  return new Date(iso).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' })
}

// ── Login ─────────────────────────────────────────────

function AdminLogin({ onSuccess }) {
  const [pw, setPw]         = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(false)

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'x-admin-secret': pw,
      },
      body: JSON.stringify({ status: 'pending' }),
    })
    const fnErr = res.status !== 200

    if (fnErr) {
      setError(true)
      setPw('')
    } else {
      sessionStorage.setItem('wccc_admin_auth', pw)
      onSuccess(pw)
    }
    setLoading(false)
  }

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        <Link to="/"><img src="/logo.png" alt="SACCC" className="admin-login-logo" /></Link>
        <h1 className="admin-login-title">Admin Portal</h1>
        <p className="admin-login-sub">South African Coin Collectors Club</p>
        <form onSubmit={handleSubmit} className="admin-login-form">
          <label className="admin-field">
            <span>Password</span>
            <input
              type="password"
              value={pw}
              onChange={e => { setPw(e.target.value); setError(false) }}
              autoFocus
              placeholder="••••••••"
            />
          </label>
          {error && <p className="admin-login-error">Incorrect password. Please try again.</p>}
          <button type="submit" className="btn btn-primary btn-lg admin-login-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <Link to="/" className="admin-back-link">← Back to site</Link>
      </div>
    </div>
  )
}

// ── Reject modal ──────────────────────────────────────

function RejectModal({ onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('')
  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal">
        <h2>Reject Application</h2>
        <p>Optionally provide a reason. This is for your records only.</p>
        <textarea
          className="admin-modal-textarea"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Reason for rejection (optional)…"
          rows={3}
        />
        <div className="admin-modal-actions">
          <button className="admin-detail-back" onClick={onCancel}>Cancel</button>
          <button className="admin-reject-confirm-btn" onClick={() => onConfirm(reason)} disabled={loading}>
            {loading ? 'Rejecting…' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Signup detail ─────────────────────────────────────

function SignupDetail({ entry, onBack, onApprove, onReject, actionLoading, onUpdateMemberNumber }) {
  const isPending = entry.status === 'pending'
  const isApproved = entry.status === 'approved'
  const [editingNum, setEditingNum] = useState(false)
  const [memberNum, setMemberNum]   = useState(entry.reference_number || '')
  return (
    <div className="admin-detail">
      <div className="admin-detail-header">
        <button className="admin-detail-back" onClick={onBack}>← Back to list</button>
        {isPending && (
          <div className="admin-detail-actions">
            <button className="admin-approve-btn" onClick={() => onApprove(entry.id)} disabled={actionLoading}>
              {actionLoading ? 'Processing…' : <><i className="fa-solid fa-check" style={{ marginRight: '0.4rem' }} />Approve</>}
            </button>
            <button className="admin-reject-btn" onClick={() => onReject(entry)} disabled={actionLoading}>
              <i className="fa-solid fa-xmark" style={{ marginRight: '0.4rem' }} />Reject
            </button>
          </div>
        )}
      </div>
      <div className="admin-detail-card">
        <div className="admin-detail-title-row">
          <div>
            <h2>{entry.first_name} {entry.surname}</h2>
            <span className={`admin-status-badge status-${entry.status}`}>{entry.status}</span>
          </div>
          <span className="admin-detail-date">{formatDate(entry.submitted_at)}</span>
        </div>
        <div className="admin-detail-grid">
          <div className="admin-detail-field"><span>Email</span><strong>{entry.email || '—'}</strong></div>
          <div className="admin-detail-field"><span>Mobile</span><strong>{entry.mobile || '—'}</strong></div>
          <div className="admin-detail-field"><span>WhatsApp</span><strong>{entry.whatsapp || '—'}</strong></div>
          <div className="admin-detail-field"><span>City</span><strong>{entry.city || '—'}</strong></div>
          <div className="admin-detail-field"><span>Province</span><strong>{entry.province || '—'}</strong></div>
          <div className="admin-detail-field"><span>Country</span><strong>{entry.country || '—'}</strong></div>
          <div className="admin-detail-field full"><span>Address</span><strong>{entry.address || '—'}</strong></div>
          {entry.interests?.length > 0 && (
            <div className="admin-detail-field full">
              <span>Collecting Interests</span>
              <div className="admin-tag-list">
                {entry.interests.map(i => <span key={i} className="admin-tag">{i}</span>)}
              </div>
            </div>
          )}
          {entry.optionals?.length > 0 && (
            <div className="admin-detail-field full">
              <span>Optional Interests</span>
              <div className="admin-tag-list">
                {entry.optionals.map(o => <span key={o} className="admin-tag admin-tag-alt">{o}</span>)}
              </div>
            </div>
          )}
          {isApproved && (
            <div className="admin-detail-field full">
              <span>Membership Number</span>
              {editingNum ? (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                  <input
                    className="an-input"
                    value={memberNum}
                    onChange={e => setMemberNum(e.target.value)}
                    style={{ width: '120px' }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => { onUpdateMemberNumber(entry.id, memberNum); setEditingNum(false) }}>Save</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setMemberNum(entry.reference_number || ''); setEditingNum(false) }}>Cancel</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <strong>{memberNum || '—'}</strong>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingNum(true)}>Edit</button>
                </div>
              )}
            </div>
          )}
          {entry.referral && (
            <>
              <div className="admin-detail-field"><span>Referral Name</span><strong>{entry.referral_name || '—'}</strong></div>
              <div className="admin-detail-field"><span>Referral Number</span><strong>{entry.referral_number || '—'}</strong></div>
            </>
          )}
          {entry.rejection_reason && (
            <div className="admin-detail-field full">
              <span>Rejection Reason</span>
              <p className="admin-detail-message">{entry.rejection_reason}</p>
            </div>
          )}
          {entry.reviewed_at && (
            <div className="admin-detail-field">
              <span>Reviewed</span>
              <strong>{formatDate(entry.reviewed_at)}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ConsultingDetail({ entry, onBack, onDelete, actionLoading }) {
  return (
    <div className="admin-detail">
      <div className="admin-detail-header">
        <button className="admin-detail-back" onClick={onBack}>← Back to list</button>
      </div>
      <div className="admin-detail-card">
        <div className="admin-detail-title-row">
          <h2>{entry.name}</h2>
          <span className="admin-detail-date">{formatDate(entry.submittedAt)}</span>
        </div>
        <div className="admin-detail-grid">
          <div className="admin-detail-field"><span>Email</span><strong>{entry.email || '—'}</strong></div>
          <div className="admin-detail-field"><span>Phone</span><strong>{entry.phone || '—'}</strong></div>
          <div className="admin-detail-field"><span>Consultant</span><strong>{entry.consultant || '—'}</strong></div>
          <div className="admin-detail-field"><span>Type</span><strong>{entry.type || '—'}</strong></div>
          <div className="admin-detail-field"><span>Preferred Contact</span><strong>{entry.contactMethod || '—'}</strong></div>
          {entry.message && (
            <div className="admin-detail-field full">
              <span>Message</span>
              <p className="admin-detail-message">{entry.message}</p>
            </div>
          )}
        </div>
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
          <button className="admin-reject-btn" onClick={onDelete} disabled={actionLoading}>Delete Entry</button>
        </div>
      </div>
    </div>
  )
}

// ── Tables ────────────────────────────────────────────

function SignupsTable({ entries, onSelect, onApprove, onReject }) {
  if (entries.length === 0) return <p className="admin-empty">No applications in this category.</p>
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Province</th>
            <th>Membership No.</th>
            <th>Submitted</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => (
            <tr key={entry.id} className="admin-row" onClick={() => onSelect(entry)}>
              <td className="admin-row-name"><strong>{entry.first_name} {entry.surname}</strong></td>
              <td>{entry.email}</td>
              <td>{entry.province || '—'}</td>
              <td><code className="admin-ref">{entry.reference_number}</code></td>
              <td className="admin-row-date">{formatDate(entry.submitted_at)}</td>
              <td className="admin-row-actions" onClick={e => e.stopPropagation()}>
                {entry.status === 'pending' && (
                  <>
                    <button className="admin-approve-sm" onClick={() => onApprove(entry.id)} title="Approve"><i className="fa-solid fa-check" /></button>
                    <button className="admin-reject-sm"  onClick={() => onReject(entry)}     title="Reject"><i className="fa-solid fa-xmark" /></button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ConsultingTable({ entries, onSelect, onDelete }) {
  if (entries.length === 0) return <p className="admin-empty">No consulting requests yet.</p>
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Consultant</th>
            <th>Type</th>
            <th>Submitted</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => (
            <tr key={entry.id} className="admin-row" onClick={() => onSelect(entry)}>
              <td className="admin-row-name"><strong>{entry.name}</strong></td>
              <td>{entry.email}</td>
              <td>{entry.consultant || '—'}</td>
              <td>{entry.type || '—'}</td>
              <td className="admin-row-date">{formatDate(entry.submittedAt)}</td>
              <td className="admin-row-actions" onClick={e => e.stopPropagation()}>
                <button className="admin-delete-btn" onClick={() => onDelete(entry.id)} title="Delete"><i className="fa-solid fa-trash" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Members management ────────────────────────────────

const PRESET_BADGES = ['Admin', 'Moderator', 'Top Contributor', 'Bassanis', 'Veteran Member', 'Gold Member', 'Silver Member', 'Newcomer']
const BADGE_COLORS  = {
  'Admin':           { bg: '#E63946', text: '#fff' },
  'Moderator':       { bg: '#007749', text: '#fff' },
  'Top Contributor': { bg: '#FFB81C', text: '#111' },
  'Bassanis':        { bg: '#7b2d8b', text: '#fff' },
  'Veteran Member':  { bg: '#0077b6', text: '#fff' },
  'Gold Member':     { bg: '#b8860b', text: '#fff' },
  'Silver Member':   { bg: '#888',    text: '#fff' },
  'Newcomer':        { bg: '#525252', text: '#fff' },
}

function MemberBadge({ label }) {
  const style = BADGE_COLORS[label] || { bg: '#525252', text: '#fff' }
  return (
    <span className="admin-member-badge" style={{ background: style.bg, color: style.text }}>
      {label}
    </span>
  )
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return parts[0].slice(0, 2).toUpperCase()
}

function MembersSection({ adminPassword, showToast }) {
  const [members, setMembers]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)
  const [saving, setSaving]       = useState(false)
  const [badges, setBadges]       = useState([])
  const [search, setSearch]       = useState('')

  const adminFetch = useCallback(async (action, extra = {}) => {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/profile-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'x-admin-secret': adminPassword,
      },
      body: JSON.stringify({ action, ...extra }),
    })
    const data = await res.json()
    return { data, error: res.ok ? null : new Error(data?.error || 'Request failed') }
  }, [adminPassword])

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await adminFetch('list_members')
    if (data?.data) setMembers(data.data)
    setLoading(false)
  }

  function openMember(m) {
    setSelected(m)
    setBadges([...(m.roles || []), ...(m.awards || [])])
  }

  function toggleBadge(badge) {
    setBadges(prev =>
      prev.includes(badge) ? prev.filter(b => b !== badge) : [...prev, badge]
    )
  }

  async function saveBadges() {
    setSaving(true)
    const roles  = badges.filter(b => ['Admin', 'Moderator', 'Muted'].includes(b))
    const awards = badges.filter(b => !['Admin', 'Moderator', 'Muted'].includes(b))
    const { error } = await adminFetch('update_member', { user_id: selected.id, roles, awards })
    if (error) showToast('Error saving badges.')
    else {
      showToast('Member updated.')
      setMembers(prev => prev.map(m => m.id === selected.id ? { ...m, roles, awards } : m))
      setSelected(prev => ({ ...prev, roles, awards }))
    }
    setSaving(false)
  }

  async function handleBan(member) {
    const isBanned = member.banned_until && new Date(member.banned_until) > new Date()
    const action = isBanned ? 'unban_member' : 'ban_member'
    setSaving(true)
    const { error } = await adminFetch(action, { user_id: member.id })
    if (error) showToast('Error updating ban status.')
    else {
      const newBanned = isBanned ? null : '9999-01-01T00:00:00Z'
      showToast(isBanned ? 'Member unbanned.' : 'Member banned.')
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, banned_until: newBanned } : m))
      setSelected(prev => prev ? { ...prev, banned_until: newBanned } : prev)
    }
    setSaving(false)
  }

  async function handleMute(member) {
    const isMuted = (member.roles || []).includes('Muted')
    const newRoles = isMuted
      ? (member.roles || []).filter(r => r !== 'Muted')
      : [...(member.roles || []), 'Muted']
    setSaving(true)
    const { error } = await adminFetch('update_member', { user_id: member.id, roles: newRoles, awards: member.awards || [] })
    if (error) showToast('Error updating mute status.')
    else {
      showToast(isMuted ? 'Member unmuted.' : 'Member muted.')
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, roles: newRoles } : m))
      setSelected(prev => prev ? { ...prev, roles: newRoles } : prev)
    }
    setSaving(false)
  }

  async function handleDelete(member) {
    if (!window.confirm(`Permanently delete ${member.display_name}? This cannot be undone.`)) return
    setSaving(true)
    const { error } = await adminFetch('delete_member', { user_id: member.id })
    if (error) showToast('Error deleting member.')
    else {
      showToast('Member deleted.')
      setMembers(prev => prev.filter(m => m.id !== member.id))
      setSelected(null)
    }
    setSaving(false)
  }

  const filtered = search.trim()
    ? members.filter(m =>
        m.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        m.email?.toLowerCase().includes(search.toLowerCase())
      )
    : members

  if (selected) {
    const allBadges = [...(selected.roles || []), ...(selected.awards || [])]
    const joinedDate = new Date(selected.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
    return (
      <div className="admin-forum-wrap">
        <div className="admin-forum-bar">
          <button className="admin-detail-back" onClick={() => setSelected(null)}>← All Members</button>
        </div>
        <div className="admin-detail-card">
          <div className="admin-member-profile-header">
            <div className="admin-member-avatar">
              {selected.avatar_url
                ? <img src={selected.avatar_url} alt="" className="admin-member-avatar-img" />
                : <div className="admin-member-avatar-initials">{getInitials(selected.display_name)}</div>
              }
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{selected.display_name}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>{selected.email}</p>
              {allBadges.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                  {allBadges.map(b => <MemberBadge key={b} label={b} />)}
                </div>
              )}
            </div>
          </div>

          <div className="admin-detail-grid" style={{ marginTop: '1.5rem' }}>
            {selected.membership_number && <div className="admin-detail-field"><span>Membership No.</span><strong>{selected.membership_number}</strong></div>}
            <div className="admin-detail-field"><span>Member Since</span><strong>{joinedDate}</strong></div>
            <div className="admin-detail-field"><span>Posts</span><strong>{selected.post_count || 0}</strong></div>
            <div className="admin-detail-field"><span>Threads</span><strong>{selected.thread_count || 0}</strong></div>
            {selected.location && <div className="admin-detail-field"><span>Location</span><strong>{selected.location}</strong></div>}
            {selected.bio && <div className="admin-detail-field full"><span>Bio</span><p className="admin-detail-message">{selected.bio}</p></div>}
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Awards & Roles</h3>
            <div className="admin-badge-grid">
              {PRESET_BADGES.map(badge => {
                const active = badges.includes(badge)
                const style = BADGE_COLORS[badge] || { bg: '#525252', text: '#fff' }
                return (
                  <button
                    key={badge}
                    className={`admin-badge-toggle${active ? ' active' : ''}`}
                    style={active ? { background: style.bg, color: style.text, borderColor: style.bg } : {}}
                    onClick={() => toggleBadge(badge)}
                  >
                    {active && <i className="fa-solid fa-check" style={{ marginRight: '0.3rem', fontSize: '0.75rem' }} />}
                    {badge}
                  </button>
                )
              })}
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={saveBadges} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button className="admin-detail-back" onClick={() => setSelected(null)}>Cancel</button>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Member Actions</h3>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {(() => {
                const isBanned = selected.banned_until && new Date(selected.banned_until) > new Date()
                const isMuted  = (selected.roles || []).includes('Muted')
                return (
                  <>
                    <button
                      className={`btn btn-sm ${isMuted ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleMute(selected)}
                      disabled={saving}
                    >
                      {isMuted ? 'Unmute Member' : 'Mute Member'}
                    </button>
                    <button
                      className={`btn btn-sm ${isBanned ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleBan(selected)}
                      disabled={saving}
                      style={!isBanned ? { color: '#E63946', borderColor: '#E63946' } : {}}
                    >
                      {isBanned ? 'Unban Member' : 'Ban Member'}
                    </button>
                    <button
                      className="btn btn-sm admin-reject-btn"
                      onClick={() => handleDelete(selected)}
                      disabled={saving}
                    >
                      Delete Member
                    </button>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-forum-wrap">
      <div className="admin-forum-bar">
        <input
          className="admin-forum-filter"
          style={{ flex: 1, maxWidth: 320 }}
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className="admin-forum-count">{filtered.length} member{filtered.length !== 1 ? 's' : ''}</span>
      </div>
      {loading ? (
        <p className="admin-empty">Loading members…</p>
      ) : filtered.length === 0 ? (
        <p className="admin-empty">No members found.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th>Membership No.</th>
                <th style={{ textAlign: 'center' }}>Posts</th>
                <th style={{ textAlign: 'center' }}>Threads</th>
                <th>Badges</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} className="admin-row" onClick={() => openMember(m)}>
                  <td className="admin-row-name">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div className="admin-member-avatar-sm">
                        {m.avatar_url
                          ? <img src={m.avatar_url} alt="" />
                          : <span>{getInitials(m.display_name)}</span>
                        }
                      </div>
                      <div>
                        <strong>{m.display_name}</strong>
                        {(m.banned_until && new Date(m.banned_until) > new Date()) && <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', background: '#E63946', color: '#fff', borderRadius: '4px', padding: '1px 5px' }}>Banned</span>}
                        {(m.roles || []).includes('Muted') && <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', background: '#525252', color: '#fff', borderRadius: '4px', padding: '1px 5px' }}>Muted</span>}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{m.email}</td>
                  <td style={{ fontSize: '0.875rem' }}><code className="admin-ref">{m.membership_number || '—'}</code></td>
                  <td style={{ textAlign: 'center', fontSize: '0.875rem' }}>{m.post_count || 0}</td>
                  <td style={{ textAlign: 'center', fontSize: '0.875rem' }}>{m.thread_count || 0}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {[...(m.roles || []), ...(m.awards || [])].map(b => <MemberBadge key={b} label={b} />)}
                    </div>
                  </td>
                  <td className="admin-row-date">{new Date(m.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Forum management ──────────────────────────────────

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}

const PRESET_COLORS = ['#007749', '#FFB81C', '#002395', '#E63946', '#525252', '#a35c00', '#0077b6', '#7b2d8b']

function ForumSection({ adminPassword, showToast }) {
  const [mainTab, setMainTab]     = useState('threads') // 'threads' | 'categories'
  const [forumView, setForumView] = useState('threads') // 'threads' | 'thread' | 'create'
  const [threads, setThreads]     = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]     = useState(true)
  const [catsLoading, setCatsLoading] = useState(true)
  const [selected, setSelected]   = useState(null)
  const [posts, setPosts]         = useState([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [filterCat, setFilterCat] = useState('all')

  // Thread edit states
  const [editThreadId, setEditThreadId]   = useState(null)
  const [editThreadTitle, setEditThreadTitle] = useState('')
  const [editPostId, setEditPostId]       = useState(null)
  const [editPostContent, setEditPostContent] = useState('')
  const [editPostKey, setEditPostKey]     = useState(0)

  // Create thread form
  const [newCat,   setNewCat]   = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newBody,  setNewBody]  = useState('')

  // Category edit/add states
  const [editCatId, setEditCatId]     = useState(null)
  const [editCatData, setEditCatData] = useState({})
  const [showAddCat, setShowAddCat]   = useState(false)
  const [addCatName,        setAddCatName]        = useState('')
  const [addCatGroup,       setAddCatGroup]       = useState('')
  const [addCatGroupCustom, setAddCatGroupCustom] = useState('')
  const [addCatDesc,        setAddCatDesc]        = useState('')
  const [addCatColor,       setAddCatColor]       = useState(PRESET_COLORS[0])
  const [addCatIconUrl,     setAddCatIconUrl]     = useState('')

  const invoke = useCallback(async (action, extra = {}) => {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/forum-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'x-admin-secret': adminPassword,
      },
      body: JSON.stringify({ action, ...extra }),
    })
    const data = await res.json()
    return { data, error: res.ok ? null : new Error(data?.error || 'Request failed') }
  }, [adminPassword])

  function catName(id) {
    return categories.find(c => c.id === id)?.name || id
  }

  async function loadCategories() {
    setCatsLoading(true)
    const { data, error } = await invoke('list_categories')
    if (!error && data?.data) setCategories(data.data)
    setCatsLoading(false)
  }

  async function loadThreads() {
    setLoading(true)
    const { data, error } = await invoke('list_threads')
    if (!error && data?.data) setThreads(data.data)
    setLoading(false)
  }

  useEffect(() => {
    loadCategories()
    loadThreads()
  }, [])

  async function openThread(thread) {
    setSelected(thread)
    setForumView('thread')
    setPostsLoading(true)
    const { data, error } = await invoke('get_posts', { thread_id: thread.id })
    if (!error && data?.data) setPosts(data.data)
    setPostsLoading(false)
  }

  async function handleDeleteThread(threadId) {
    if (!window.confirm('Delete this thread and all its posts?')) return
    setActionLoading(true)
    const { error } = await invoke('delete_thread', { thread_id: threadId })
    if (error) showToast('Error deleting thread.')
    else {
      showToast('Thread deleted.')
      if (forumView === 'thread') { setForumView('threads'); setSelected(null) }
      loadThreads()
    }
    setActionLoading(false)
  }

  async function handleSaveThreadTitle(threadId) {
    if (!editThreadTitle.trim()) return
    setActionLoading(true)
    const { error } = await invoke('update_thread', { thread_id: threadId, title: editThreadTitle.trim() })
    if (error) showToast('Error updating thread.')
    else {
      showToast('Thread title updated.')
      setThreads(prev => prev.map(t => t.id === threadId ? { ...t, title: editThreadTitle.trim() } : t))
      if (selected?.id === threadId) setSelected(prev => ({ ...prev, title: editThreadTitle.trim() }))
    }
    setEditThreadId(null)
    setActionLoading(false)
  }

  async function handleTogglePin(thread) {
    setActionLoading(true)
    const { error } = await invoke('update_thread', { thread_id: thread.id, is_pinned: !thread.is_pinned })
    if (!error) {
      const updated = { ...thread, is_pinned: !thread.is_pinned }
      setThreads(prev => prev.map(t => t.id === thread.id ? updated : t))
      if (selected?.id === thread.id) setSelected(updated)
    }
    setActionLoading(false)
  }

  async function handleToggleLock(thread) {
    setActionLoading(true)
    const { error } = await invoke('update_thread', { thread_id: thread.id, is_locked: !thread.is_locked })
    if (!error) {
      const updated = { ...thread, is_locked: !thread.is_locked }
      setThreads(prev => prev.map(t => t.id === thread.id ? updated : t))
      if (selected?.id === thread.id) setSelected(updated)
    }
    setActionLoading(false)
  }

  async function handleDeletePost(postId) {
    if (!window.confirm('Delete this post?')) return
    setActionLoading(true)
    const { error } = await invoke('delete_post', { post_id: postId })
    if (error) showToast('Error deleting post.')
    else {
      showToast('Post deleted.')
      setPosts(prev => prev.filter(p => p.id !== postId))
    }
    setActionLoading(false)
  }

  async function handleSavePostEdit(postId) {
    if (!editPostContent || editPostContent === '<p></p>') return
    setActionLoading(true)
    const { error } = await invoke('update_post', { post_id: postId, content: editPostContent })
    if (error) showToast('Error saving post.')
    else {
      showToast('Post updated.')
      setPosts(prev => prev.map(p => p.id === postId
        ? { ...p, content: editPostContent, updated_at: new Date().toISOString() }
        : p
      ))
    }
    setEditPostId(null)
    setActionLoading(false)
  }

  async function handleCreateThread(e) {
    e.preventDefault()
    if (!newCat || !newTitle.trim() || !newBody || newBody === '<p></p>') return
    setActionLoading(true)
    const { error } = await invoke('create_thread', {
      category_id: newCat,
      title: newTitle.trim(),
      content: newBody,
    })
    if (error) showToast('Error creating thread.')
    else {
      showToast('Thread created successfully.')
      setNewCat(''); setNewTitle(''); setNewBody('')
      setForumView('threads')
      loadThreads()
    }
    setActionLoading(false)
  }

  // ── Category handlers ─────────────────────────────────

  async function handleDeleteCategory(cat) {
    const threadCount = cat.forum_threads?.[0]?.count ?? 0
    if (threadCount > 0) {
      showToast(`Cannot delete: ${threadCount} thread(s) exist in this category.`)
      return
    }
    if (!window.confirm(`Delete category "${cat.name}"?`)) return
    setActionLoading(true)
    const { data, error } = await invoke('delete_category', { category_id: cat.id })
    if (error || data?.error) showToast(data?.error || 'Error deleting category.')
    else {
      showToast('Category deleted.')
      setCategories(prev => prev.filter(c => c.id !== cat.id))
    }
    setActionLoading(false)
  }

  async function handleSaveCatEdit(catId) {
    setActionLoading(true)
    const { error } = await invoke('update_category', { category_id: catId, ...editCatData })
    if (error) showToast('Error updating category.')
    else {
      showToast('Category updated.')
      setCategories(prev => prev.map(c => c.id === catId ? { ...c, ...editCatData } : c))
      setEditCatId(null)
    }
    setActionLoading(false)
  }

  async function handleAddCategory(e) {
    e.preventDefault()
    if (!addCatName.trim()) return
    const groupName = addCatGroup === '__new__' ? addCatGroupCustom.trim() : addCatGroup
    if (!groupName) return
    const id = slugify(addCatName)
    const groupId = slugify(groupName)
    setActionLoading(true)
    const { data, error } = await invoke('create_category', {
      id, group_id: groupId, group_name: groupName,
      name: addCatName.trim(), description: addCatDesc.trim(), color: addCatColor,
      icon_url: addCatIconUrl.trim() || null,
    })
    if (error || data?.error) showToast(data?.error || 'Error creating category.')
    else {
      showToast('Category created.')
      setShowAddCat(false)
      setAddCatName(''); setAddCatGroup(''); setAddCatGroupCustom('')
      setAddCatDesc(''); setAddCatColor(PRESET_COLORS[0]); setAddCatIconUrl('')
      loadCategories()
    }
    setActionLoading(false)
  }

  const groups = [...new Map(categories.map(c => [c.group_id, c.group_name])).entries()]
    .map(([id, name]) => ({ id, name }))

  const displayed = filterCat === 'all'
    ? threads
    : threads.filter(t => t.category_id === filterCat)

  // ── Tab bar ───────────────────────────────────────────

  const tabBar = (
    <div className="admin-forum-tabs">
      <button className={`admin-forum-tab${mainTab === 'threads' ? ' active' : ''}`} onClick={() => setMainTab('threads')}>
        <i className="fa-solid fa-comments" style={{ marginRight: '0.4rem' }} />Threads
      </button>
      <button className={`admin-forum-tab${mainTab === 'categories' ? ' active' : ''}`} onClick={() => setMainTab('categories')}>
        <i className="fa-solid fa-folder-open" style={{ marginRight: '0.4rem' }} />Categories
      </button>
    </div>
  )

  // ── Categories tab ────────────────────────────────────

  if (mainTab === 'categories') {
    return (
      <div className="admin-forum-wrap">
        {tabBar}
        {catsLoading ? (
          <p className="admin-empty">Loading categories…</p>
        ) : (
          <>
            <div className="admin-forum-bar" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddCat(v => !v)}>
                {showAddCat ? 'Cancel' : '+ Add Category'}
              </button>
            </div>

            {showAddCat && (
              <div className="admin-detail-card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>New Category</h3>
                <form onSubmit={handleAddCategory} className="admin-forum-create-form">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <label className="admin-field">
                      <span>Name</span>
                      <input value={addCatName} onChange={e => setAddCatName(e.target.value)} placeholder="e.g. South African Coins" required />
                    </label>
                    <label className="admin-field">
                      <span>Group</span>
                      <select value={addCatGroup} onChange={e => setAddCatGroup(e.target.value)} required>
                        <option value="" disabled>Select group…</option>
                        {groups.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                        <option value="__new__">+ New Group…</option>
                      </select>
                    </label>
                    {addCatGroup === '__new__' && (
                      <label className="admin-field" style={{ gridColumn: '1/-1' }}>
                        <span>New Group Name</span>
                        <input value={addCatGroupCustom} onChange={e => setAddCatGroupCustom(e.target.value)} placeholder="e.g. World Coins" required />
                      </label>
                    )}
                    <label className="admin-field" style={{ gridColumn: '1/-1' }}>
                      <span>Description</span>
                      <input value={addCatDesc} onChange={e => setAddCatDesc(e.target.value)} placeholder="Short description…" />
                    </label>
                    <label className="admin-field" style={{ gridColumn: '1/-1' }}>
                      <span>Icon Image URL <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional — overrides color)</span></span>
                      <input value={addCatIconUrl} onChange={e => setAddCatIconUrl(e.target.value)} placeholder="https://…" type="url" />
                    </label>
                    <div className="admin-field" style={{ gridColumn: '1/-1' }}>
                      <span>Icon Color <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(used when no image set)</span></span>
                      <div className="admin-color-row">
                        {PRESET_COLORS.map(c => (
                          <button
                            key={c} type="button"
                            className={`admin-color-swatch${addCatColor === c ? ' selected' : ''}`}
                            style={{ background: c }}
                            onClick={() => setAddCatColor(c)}
                          />
                        ))}
                        <input type="color" value={addCatColor} onChange={e => setAddCatColor(e.target.value)} className="admin-color-custom" />
                      </div>
                    </div>
                  </div>
                  <div className="admin-modal-actions" style={{ marginTop: '0.75rem' }}>
                    <button type="button" className="admin-detail-back" onClick={() => setShowAddCat(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                      {actionLoading ? 'Creating…' : 'Create Category'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>Color</th>
                    <th>Name</th>
                    <th>Group</th>
                    <th>Description</th>
                    <th style={{ textAlign: 'center' }}>Threads</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => {
                    const threadCount = cat.forum_threads?.[0]?.count ?? 0
                    const isEditing = editCatId === cat.id
                    return (
                      <tr key={cat.id} className="admin-row">
                        <td>
                          {isEditing ? (
                            <div className="admin-color-row">
                              {PRESET_COLORS.map(c => (
                                <button
                                  key={c} type="button"
                                  className={`admin-color-swatch${editCatData.color === c ? ' selected' : ''}`}
                                  style={{ background: c }}
                                  onClick={() => setEditCatData(d => ({ ...d, color: c }))}
                                />
                              ))}
                              <input type="color" value={editCatData.color || cat.color} onChange={e => setEditCatData(d => ({ ...d, color: e.target.value }))} className="admin-color-custom" />
                            </div>
                          ) : cat.icon_url ? (
                            <img src={cat.icon_url} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />
                          ) : (
                            <span className="admin-cat-swatch" style={{ background: cat.color || '#007749' }} />
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input className="admin-inline-input" value={editCatData.name ?? cat.name} onChange={e => setEditCatData(d => ({ ...d, name: e.target.value }))} />
                          ) : <strong style={{ fontSize: '0.9rem' }}>{cat.name}</strong>}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {isEditing ? (
                            <input className="admin-inline-input" value={editCatData.group_name ?? cat.group_name} onChange={e => setEditCatData(d => ({ ...d, group_name: e.target.value }))} placeholder="Group name" />
                          ) : cat.group_name}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 220 }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              <input className="admin-inline-input" value={editCatData.description ?? cat.description} onChange={e => setEditCatData(d => ({ ...d, description: e.target.value }))} placeholder="Description" />
                              <input className="admin-inline-input" value={editCatData.icon_url ?? ''} onChange={e => setEditCatData(d => ({ ...d, icon_url: e.target.value }))} placeholder="Icon image URL (optional)" type="url" />
                            </div>
                          ) : cat.description}
                        </td>
                        <td style={{ textAlign: 'center', fontSize: '0.85rem' }}>{threadCount}</td>
                        <td className="admin-row-actions">
                          {isEditing ? (
                            <div className="admin-forum-actions">
                              <button className="admin-approve-sm" onClick={() => handleSaveCatEdit(cat.id)} disabled={actionLoading} title="Save"><i className="fa-solid fa-check" /></button>
                              <button className="admin-reject-sm" onClick={() => setEditCatId(null)} title="Cancel"><i className="fa-solid fa-xmark" /></button>
                            </div>
                          ) : (
                            <div className="admin-forum-actions">
                              <button
                                className="admin-forum-act-btn"
                                title="Edit"
                                onClick={() => { setEditCatId(cat.id); setEditCatData({ name: cat.name, group_name: cat.group_name, description: cat.description, color: cat.color, icon_url: cat.icon_url || '' }) }}
                              >
                                <i className="fa-solid fa-pen" />
                              </button>
                              <button
                                className="admin-delete-btn"
                                title={threadCount > 0 ? `${threadCount} thread(s) — cannot delete` : 'Delete'}
                                onClick={() => handleDeleteCategory(cat)}
                                disabled={actionLoading}
                              >
                                <i className="fa-solid fa-trash" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    )
  }

  // ── Thread list view ──────────────────────────────────

  if (forumView === 'threads') {
    return (
      <div className="admin-forum-wrap">
        {tabBar}
        <div className="admin-forum-bar">
          <select
            className="admin-forum-filter"
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <span className="admin-forum-count">{displayed.length} thread{displayed.length !== 1 ? 's' : ''}</span>
          <button className="btn btn-primary btn-sm" onClick={() => setForumView('create')}>
            + New Thread
          </button>
        </div>

        {loading ? (
          <p className="admin-empty">Loading threads…</p>
        ) : displayed.length === 0 ? (
          <p className="admin-empty">No threads yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Thread</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Posts</th>
                  <th>Views</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(thread => {
                  const postCount = thread.forum_posts?.[0]?.count ?? 0
                  const isEditing = editThreadId === thread.id
                  return (
                    <tr key={thread.id} className="admin-row" onClick={() => !isEditing && openThread(thread)}>
                      <td className="admin-row-name" style={{ maxWidth: 260 }}>
                        {isEditing ? (
                          <div className="admin-inline-edit" onClick={e => e.stopPropagation()}>
                            <input
                              className="admin-inline-input"
                              value={editThreadTitle}
                              onChange={e => setEditThreadTitle(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveThreadTitle(thread.id)
                                if (e.key === 'Escape') setEditThreadId(null)
                              }}
                              autoFocus
                            />
                            <button className="admin-approve-sm" onClick={() => handleSaveThreadTitle(thread.id)} title="Save"><i className="fa-solid fa-check" /></button>
                            <button className="admin-reject-sm"  onClick={() => setEditThreadId(null)} title="Cancel"><i className="fa-solid fa-xmark" /></button>
                          </div>
                        ) : (
                          <div>
                            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.15rem' }}>
                              {thread.is_pinned && <span className="admin-forum-tag tag-pin">Pinned</span>}
                              {thread.is_locked && <span className="admin-forum-tag tag-lock">Locked</span>}
                            </div>
                            <strong style={{ fontSize: '0.9rem' }}>{thread.title}</strong>
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {thread.forum_categories?.name || catName(thread.category_id)}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{thread.author_name}</td>
                      <td className="ftt-col-stat" style={{ textAlign: 'center' }}>{postCount}</td>
                      <td className="ftt-col-stat" style={{ textAlign: 'center' }}>{thread.views || 0}</td>
                      <td className="admin-row-date">{timeAgo(thread.created_at)}</td>
                      <td className="admin-row-actions" onClick={e => e.stopPropagation()}>
                        <div className="admin-forum-actions">
                          <button
                            className="admin-forum-act-btn"
                            title={thread.is_pinned ? 'Unpin' : 'Pin'}
                            onClick={() => handleTogglePin(thread)}
                            disabled={actionLoading}
                          >
                            <i className={thread.is_pinned ? 'fa-solid fa-thumbtack' : 'fa-regular fa-thumbtack'} />
                          </button>
                          <button
                            className="admin-forum-act-btn"
                            title={thread.is_locked ? 'Unlock' : 'Lock'}
                            onClick={() => handleToggleLock(thread)}
                            disabled={actionLoading}
                          >
                            <i className={thread.is_locked ? 'fa-solid fa-lock-open' : 'fa-solid fa-lock'} />
                          </button>
                          <button
                            className="admin-forum-act-btn"
                            title="Edit title"
                            onClick={() => { setEditThreadId(thread.id); setEditThreadTitle(thread.title) }}
                          >
                            <i className="fa-solid fa-pen" />
                          </button>
                          <button
                            className="admin-delete-btn"
                            title="Delete thread"
                            onClick={() => handleDeleteThread(thread.id)}
                            disabled={actionLoading}
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  // ── Thread detail view ────────────────────────────────

  if (forumView === 'thread' && selected) {
    return (
      <div className="admin-forum-wrap">
        {tabBar}
        <div className="admin-forum-thread-header">
          <button className="admin-detail-back" onClick={() => { setForumView('threads'); setSelected(null); setEditPostId(null) }}>
            ← All Threads
          </button>
          <div className="admin-forum-thread-meta">
            <span className="admin-forum-cat-label">{catName(selected.category_id)}</span>
            {selected.is_pinned && <span className="admin-forum-tag tag-pin">Pinned</span>}
            {selected.is_locked && <span className="admin-forum-tag tag-lock">Locked</span>}
          </div>
          <div className="admin-detail-actions">
            <button
              className={selected.is_pinned ? 'admin-status-tab active' : 'admin-status-tab'}
              onClick={() => handleTogglePin(selected)}
              disabled={actionLoading}
            >
              {selected.is_pinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              className={selected.is_locked ? 'admin-status-tab active' : 'admin-status-tab'}
              onClick={() => handleToggleLock(selected)}
              disabled={actionLoading}
            >
              {selected.is_locked ? 'Unlock' : 'Lock'}
            </button>
            <button
              className="admin-reject-btn"
              onClick={() => handleDeleteThread(selected.id)}
              disabled={actionLoading}
            >
              <i className="fa-solid fa-trash" style={{ marginRight: '0.4rem' }} />Delete Thread
            </button>
          </div>
        </div>

        <div className="admin-detail-card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{selected.title}</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            by {selected.author_name} · {formatDate(selected.created_at)} · {posts.length} post{posts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {postsLoading ? (
          <p className="admin-empty">Loading posts…</p>
        ) : posts.length === 0 ? (
          <p className="admin-empty">No posts in this thread.</p>
        ) : (
          <div className="admin-forum-posts">
            {posts.map((post, idx) => (
              <div key={post.id} className="admin-forum-post">
                <div className="admin-forum-post-header">
                  <div className="admin-forum-post-meta">
                    <span className="admin-forum-post-num">#{idx + 1}</span>
                    <strong>{post.author_name}</strong>
                    <span className="admin-row-date">{formatDate(post.created_at)}</span>
                    {post.updated_at && <span className="admin-row-date">(edited)</span>}
                  </div>
                  <div className="admin-forum-actions">
                    <button
                      className="admin-forum-act-btn"
                      title="Edit post"
                      onClick={() => {
                        setEditPostId(post.id)
                        setEditPostContent(post.content)
                        setEditPostKey(k => k + 1)
                      }}
                    >
                      <i className="fa-solid fa-pen" style={{ marginRight: '0.3rem' }} />Edit
                    </button>
                    <button
                      className="admin-delete-btn"
                      title="Delete post"
                      onClick={() => handleDeletePost(post.id)}
                      disabled={actionLoading}
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </div>

                {editPostId === post.id ? (
                  <div className="admin-forum-post-edit">
                    <RichTextEditor
                      key={editPostKey}
                      content={editPostContent}
                      onUpdate={setEditPostContent}
                      minHeight={120}
                    />
                    <div className="admin-forum-edit-actions">
                      <button className="admin-detail-back" onClick={() => setEditPostId(null)}>Cancel</button>
                      <button
                        className="admin-approve-btn"
                        onClick={() => handleSavePostEdit(post.id)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="admin-forum-post-body forum-prose"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content, { ADD_ATTR: ['target'] }) }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Create thread form ────────────────────────────────

  if (forumView === 'create') {
    return (
      <div className="admin-forum-wrap">
        {tabBar}
        <div className="admin-forum-bar">
          <button className="admin-detail-back" onClick={() => setForumView('threads')}>← Back to Threads</button>
        </div>
        <div className="admin-detail-card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Create New Thread</h2>
          <form onSubmit={handleCreateThread} className="admin-forum-create-form">
            <label className="admin-field">
              <span>Category</span>
              <select value={newCat} onChange={e => setNewCat(e.target.value)} required>
                <option value="" disabled>Select a category…</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.group_name} — {c.name}</option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>Thread Title</span>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Enter thread title…"
                required
              />
            </label>
            <div className="admin-field">
              <span>First Post</span>
              <RichTextEditor
                onUpdate={setNewBody}
                placeholder="Write the opening post…"
                minHeight={200}
              />
            </div>
            <div className="admin-modal-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="admin-detail-back" onClick={() => setForumView('threads')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                {actionLoading ? 'Creating…' : 'Create Thread'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return null
}

// ── Dashboard ─────────────────────────────────────────

function AdminDashboard({ adminPassword, onLogout }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [mainView, setMainView] = useState(() => {
    const v = searchParams.get('view')
    return ['signups','consulting','members','news','forum'].includes(v) ? v : 'signups'
  })
  const [statusTab, setStatusTab] = useState('pending')
  const [applications, setApplications] = useState([])
  const [consulting, setConsulting] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wccc_consulting') || '[]') } catch { return [] }
  })
  const [loading, setLoading]     = useState(false)
  const [selected, setSelected]   = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const loadApplications = useCallback(async (status) => {
    setLoading(true)
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'x-admin-secret': adminPassword,
      },
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (res.ok && data?.data) setApplications(data.data)
    setLoading(false)
  }, [adminPassword])

  useEffect(() => {
    if (mainView === 'signups') loadApplications(statusTab)
  }, [mainView, statusTab, loadApplications])

  async function handleApprove(id) {
    setActionLoading(true)
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'x-admin-secret': adminPassword,
      },
      body: JSON.stringify({ id, action: 'approve' }),
    })
    if (!res.ok) showToast(`Approval error`)
    else {
      showToast('Application approved. Login credentials sent to member.')
      setSelected(null)
      loadApplications(statusTab)
    }
    setActionLoading(false)
  }

  async function handleRejectConfirm(reason) {
    setActionLoading(true)
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'x-admin-secret': adminPassword,
      },
      body: JSON.stringify({ id: rejectTarget.id, action: 'reject', rejectionReason: reason }),
    })
    if (!res.ok) showToast('Error rejecting application.')
    else {
      showToast('Application rejected.')
      setSelected(null)
      setRejectTarget(null)
      loadApplications(statusTab)
    }
    setActionLoading(false)
  }

  function deleteConsulting(id) {
    const updated = consulting.filter(e => e.id !== id)
    setConsulting(updated)
    localStorage.setItem('wccc_consulting', JSON.stringify(updated))
    setSelected(null)
  }

  async function handleUpdateMemberNumber(id, newNumber) {
    await supabase.from('membership_applications').update({ reference_number: newNumber }).eq('id', id)
    setSelected(s => s ? { ...s, reference_number: newNumber } : s)
    await loadApplications(statusTab)
    showToast('Membership number updated.')
  }

  function switchMain(v) { setMainView(v); setSelected(null); setSearchParams({ view: v }, { replace: true }) }
  function switchStatus(s) { setStatusTab(s); setSelected(null) }

  const topbarTitle =
    mainView === 'signups'     ? 'Sign-ups'
    : mainView === 'consulting'  ? 'Consulting Requests'
    : mainView === 'members'     ? 'Members'
    : mainView === 'news'        ? 'News & Articles'
    : 'Forum Management'

  return (
    <div className="admin-wrap">
      {rejectTarget && (
        <RejectModal
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
          loading={actionLoading}
        />
      )}
      {toast && <div className="admin-toast">{toast}</div>}

      {/* ── Sidebar ─── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <Link to="/" className="admin-sidebar-logo">
            <img src="/logo-footer.png" alt="SACCC" />
          </Link>
          <span className="admin-sidebar-label">Admin</span>
        </div>

        <nav className="admin-nav">
          <p className="admin-nav-section">Members</p>
          <button
            className={`admin-nav-item ${mainView === 'signups' ? 'active' : ''}`}
            onClick={() => switchMain('signups')}
          >
            <span>Sign-ups</span>
          </button>
          <button
            className={`admin-nav-item ${mainView === 'members' ? 'active' : ''}`}
            onClick={() => switchMain('members')}
          >
            <span>All Members</span>
          </button>
          <button
            className={`admin-nav-item ${mainView === 'consulting' ? 'active' : ''}`}
            onClick={() => switchMain('consulting')}
          >
            <span>Consulting Requests</span>
            {consulting.length > 0 && <span className="admin-badge">{consulting.length}</span>}
          </button>

          <p className="admin-nav-section">Content</p>
          <button
            className={`admin-nav-item ${mainView === 'news' ? 'active' : ''}`}
            onClick={() => switchMain('news')}
          >
            <span>News & Articles</span>
          </button>
          <button
            className={`admin-nav-item ${mainView === 'forum' ? 'active' : ''}`}
            onClick={() => switchMain('forum')}
          >
            <span>Forum</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-view-site">← View site</Link>
          <button className="admin-logout-btn" onClick={onLogout}>Log out</button>
        </div>
      </aside>

      {/* ── Main ─── */}
      <div className="admin-main">
        <div className="admin-topbar">
          <div className="admin-topbar-info">
            <h1>{topbarTitle}</h1>
          </div>
          {mainView === 'signups' && !selected && (
            <div className="admin-status-tabs">
              {['pending', 'approved', 'rejected'].map(s => (
                <button
                  key={s}
                  className={`admin-status-tab ${statusTab === s ? 'active' : ''}`}
                  onClick={() => switchStatus(s)}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="admin-content">
          {mainView === 'news' ? (
            <AdminNews showToast={showToast} />
          ) : mainView === 'forum' ? (
            <ForumSection adminPassword={adminPassword} showToast={showToast} />
          ) : mainView === 'members' ? (
            <MembersSection adminPassword={adminPassword} showToast={showToast} />
          ) : loading ? (
            <p className="admin-empty">Loading…</p>
          ) : selected ? (
            mainView === 'signups' ? (
              <SignupDetail
                entry={selected}
                onBack={() => setSelected(null)}
                onApprove={handleApprove}
                onReject={entry => setRejectTarget(entry)}
                actionLoading={actionLoading}
                onUpdateMemberNumber={handleUpdateMemberNumber}
              />
            ) : (
              <ConsultingDetail
                entry={selected}
                onBack={() => setSelected(null)}
                onDelete={() => deleteConsulting(selected.id)}
                actionLoading={actionLoading}
              />
            )
          ) : mainView === 'signups' ? (
            <SignupsTable
              entries={applications}
              onSelect={setSelected}
              onApprove={handleApprove}
              onReject={entry => setRejectTarget(entry)}
            />
          ) : (
            <ConsultingTable
              entries={consulting}
              onSelect={setSelected}
              onDelete={deleteConsulting}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Root export ───────────────────────────────────────

export default function Admin() {
  const [authed, setAuthed]           = useState(() => !!sessionStorage.getItem('wccc_admin_auth'))
  const [adminPassword, setAdminPassword] = useState(() => sessionStorage.getItem('wccc_admin_auth') || '')

  function handleLogout() {
    sessionStorage.removeItem('wccc_admin_auth')
    setAuthed(false)
    setAdminPassword('')
  }

  if (!authed) {
    return <AdminLogin onSuccess={pw => { setAdminPassword(pw); setAuthed(true) }} />
  }

  return <AdminDashboard adminPassword={adminPassword} onLogout={handleLogout} />
}
