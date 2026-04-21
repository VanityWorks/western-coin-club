import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { supabase } from '../lib/supabase'
import RichTextEditor from '../components/RichTextEditor'
import AdminNews from './AdminNews'
import AdminMagazine from './AdminMagazine'
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

function SignupDetail({ entry, onBack, onApprove, onReject, onResend, onRemind, onDeleteApproved, adminPassword, showToast, actionLoading }) {
  const isPending = entry.status === 'pending'
  const isApproved = entry.status === 'approved'

  // Member management state (only used for approved entries)
  const [member, setMember] = useState(null)
  const [memberLoading, setMemberLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [memberNumEdit, setMemberNumEdit] = useState(null)
  const [badges, setBadges] = useState([])

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

  // Load member profile for approved entries
  useEffect(() => {
    if (!isApproved || !entry.member_id) return
    setMemberLoading(true)
    adminFetch('get_member', { user_id: entry.member_id }).then(({ data }) => {
      if (data?.data) {
        setMember(data.data)
        setBadges([...(data.data.roles || []), ...(data.data.awards || [])])
      }
      setMemberLoading(false)
    })
  }, [isApproved, entry.member_id])

  async function handleSaveBadges() {
    setSaving(true)
    const roles = badges.filter(b => ['Admin', 'Moderator', 'Muted'].includes(b))
    const awards = badges.filter(b => !['Admin', 'Moderator', 'Muted'].includes(b))
    const { error } = await adminFetch('update_member', { user_id: entry.member_id, roles, awards })
    if (error) showToast('Error saving badges.')
    else {
      showToast('Badges updated.')
      setMember(prev => ({ ...prev, roles, awards }))
    }
    setSaving(false)
  }

  async function handleUpdateMemberNumber(newNumber) {
    setSaving(true)
    const { error } = await adminFetch('update_membership_number', { user_id: entry.member_id, membership_number: newNumber })
    if (error) showToast('Error updating membership number.')
    else {
      showToast('Membership number updated.')
      setMember(prev => ({ ...prev, membership_number: newNumber }))
    }
    setSaving(false)
  }

  async function handleMute() {
    const isMuted = (member?.roles || []).includes('Muted')
    const newRoles = isMuted
      ? (member.roles || []).filter(r => r !== 'Muted')
      : [...(member.roles || []), 'Muted']
    setSaving(true)
    const { error } = await adminFetch('update_member', { user_id: entry.member_id, roles: newRoles, awards: member.awards || [] })
    if (!error) {
      showToast(isMuted ? 'Member unmuted.' : 'Member muted.')
      setMember(prev => ({ ...prev, roles: newRoles }))
      setBadges([...newRoles, ...(member.awards || [])])
    }
    setSaving(false)
  }

  async function handleBan() {
    const isBanned = member?.banned_until && new Date(member.banned_until) > new Date()
    const action = isBanned ? 'unban_member' : 'ban_member'
    setSaving(true)
    const { error } = await adminFetch(action, { user_id: entry.member_id })
    if (!error) {
      const newBanned = isBanned ? null : '9999-01-01T00:00:00Z'
      showToast(isBanned ? 'Member unbanned.' : 'Member banned.')
      setMember(prev => ({ ...prev, banned_until: newBanned }))
    }
    setSaving(false)
  }

  // ── Inline field editing ──────────────────────────────
  const [editField, setEditField] = useState(null) // { key, value }
  const [editSaving, setEditSaving] = useState(false)
  const [localEntry, setLocalEntry] = useState(entry)

  async function saveField(key, value) {
    setEditSaving(true)
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/profile-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'x-admin-secret': adminPassword,
      },
      body: JSON.stringify({ action: 'update_signup', signup_id: localEntry.id, fields: { [key]: value } }),
    })
    const data = await res.json()
    if (res.ok && data.success) {
      setLocalEntry(prev => ({ ...prev, [key]: value }))
      showToast(`${key.replace('_', ' ')} updated.`)
      setEditField(null)
    } else {
      showToast('Failed to update. Try again.')
    }
    setEditSaving(false)
  }

  const isBanned = member?.banned_until && new Date(member.banned_until) > new Date()
  const isMuted = (member?.roles || []).includes('Muted')

  function EditableField({ label, fieldKey, value }) {
    const isEditing = editField?.key === fieldKey
    return (
      <div className="admin-detail-field">
        <span>{label}</span>
        {isEditing ? (
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.2rem' }}>
            <input
              className="an-input"
              style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.875rem' }}
              value={editField.value}
              onChange={e => setEditField({ key: fieldKey, value: e.target.value })}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') saveField(fieldKey, editField.value); if (e.key === 'Escape') setEditField(null) }}
            />
            <button className="btn btn-primary btn-sm" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }} disabled={editSaving} onClick={() => saveField(fieldKey, editField.value)}>
              {editSaving ? '...' : 'Save'}
            </button>
            <button className="btn btn-secondary btn-sm" style={{ padding: '0.3rem 0.5rem', fontSize: '0.78rem' }} onClick={() => setEditField(null)}>Cancel</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <strong>{value || '-'}</strong>
            <button
              className="admin-edit-inline-btn"
              onClick={() => setEditField({ key: fieldKey, value: value || '' })}
            >
              <i className="fa-solid fa-pen" /> Edit
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="admin-detail">
      <div className="admin-detail-header">
        <button className="admin-detail-back" onClick={onBack}>← Back to list</button>
        <div className="admin-detail-actions">
          {isPending && (
            <>
              <button className="admin-approve-btn" onClick={() => onApprove(entry.id)} disabled={actionLoading}>
                {actionLoading ? 'Processing…' : <><i className="fa-solid fa-check" style={{ marginRight: '0.4rem' }} />Approve</>}
              </button>
              <button className="admin-reject-btn" onClick={() => onReject(entry)} disabled={actionLoading}>
                <i className="fa-solid fa-xmark" style={{ marginRight: '0.4rem' }} />Reject
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => onRemind(entry.id)} disabled={actionLoading}>
                <i className="fa-solid fa-bell" style={{ marginRight: '0.4rem' }} />Send Reminder
              </button>
            </>
          )}
          {isApproved && (
            <>
              <button className="admin-approve-btn" onClick={() => onResend(entry.id)} disabled={actionLoading}>
                {actionLoading ? 'Sending…' : <><i className="fa-solid fa-envelope" style={{ marginRight: '0.4rem' }} />Resend Email</>}
              </button>
              <button className="admin-reject-btn" onClick={() => onDeleteApproved(entry)} disabled={actionLoading}>
                <i className="fa-solid fa-trash" style={{ marginRight: '0.4rem' }} />Delete Account
              </button>
            </>
          )}
        </div>
      </div>

      {/* Application info */}
      <div className="admin-detail-card">
        <div className="admin-detail-title-row">
          <div>
            <h2>{localEntry.first_name} {localEntry.surname}</h2>
            <span className={`admin-status-badge status-${localEntry.status}`}>{localEntry.status}</span>
            {isBanned && <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', background: '#E63946', color: '#fff', borderRadius: '4px', padding: '2px 7px', fontWeight: 700 }}>Banned</span>}
            {isMuted && <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', background: '#525252', color: '#fff', borderRadius: '4px', padding: '2px 7px', fontWeight: 700 }}>Muted</span>}
          </div>
          <span className="admin-detail-date">{formatDate(localEntry.submitted_at)}</span>
        </div>
        <div className="admin-detail-grid">
          <EditableField label="First Name" fieldKey="first_name" value={localEntry.first_name} />
          <EditableField label="Surname" fieldKey="surname" value={localEntry.surname} />
          <EditableField label="Email" fieldKey="email" value={localEntry.email} />
          <EditableField label="Mobile" fieldKey="mobile" value={localEntry.mobile} />
          <EditableField label="WhatsApp" fieldKey="whatsapp" value={localEntry.whatsapp} />
          <EditableField label="City" fieldKey="city" value={localEntry.city} />
          <EditableField label="Province" fieldKey="province" value={localEntry.province} />
          <EditableField label="Country" fieldKey="country" value={localEntry.country} />
          <EditableField label="Address" fieldKey="address" value={localEntry.address} />
          {localEntry.interests?.length > 0 && (
            <div className="admin-detail-field full">
              <span>Collecting Interests</span>
              <div className="admin-tag-list">
                {localEntry.interests.map(i => <span key={i} className="admin-tag">{i}</span>)}
              </div>
            </div>
          )}
          {localEntry.optionals?.length > 0 && (
            <div className="admin-detail-field full">
              <span>Optional Interests</span>
              <div className="admin-tag-list">
                {localEntry.optionals.map(o => <span key={o} className="admin-tag admin-tag-alt">{o}</span>)}
              </div>
            </div>
          )}
          {localEntry.referral && (
            <>
              <div className="admin-detail-field"><span>Referral Name</span><strong>{localEntry.referral_name || '-'}</strong></div>
              <div className="admin-detail-field"><span>Referral Number</span><strong>{localEntry.referral_number || '-'}</strong></div>
            </>
          )}
          {localEntry.rejection_reason && (
            <div className="admin-detail-field full">
              <span>Rejection Reason</span>
              <p className="admin-detail-message">{localEntry.rejection_reason}</p>
            </div>
          )}
          {localEntry.reviewed_at && (
            <div className="admin-detail-field">
              <span>Reviewed</span>
              <strong>{formatDate(localEntry.reviewed_at)}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Inline member management for approved entries */}
      {isApproved && entry.member_id && (
        <div className="admin-detail-card" style={{ marginTop: '1rem' }}>
          {memberLoading ? (
            <p className="admin-empty">Loading member profile...</p>
          ) : !member ? (
            <p className="admin-empty">Member profile not found.</p>
          ) : (
            <>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Member Management</h3>
              <div className="admin-detail-grid">
                {/* Membership number - editable */}
                <div className="admin-detail-field">
                  <span>Membership No.</span>
                  {memberNumEdit !== null ? (
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.25rem' }}>
                      <input className="an-input" value={memberNumEdit} onChange={e => setMemberNumEdit(e.target.value)}
                        style={{ width: '100px', padding: '0.3rem 0.5rem', fontSize: '0.9rem' }} />
                      <button className="btn btn-primary btn-sm" disabled={saving} onClick={async () => {
                        await handleUpdateMemberNumber(memberNumEdit)
                        setMemberNumEdit(null)
                      }}>Save</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setMemberNumEdit(null)}>✕</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <strong>{member.membership_number || '—'}</strong>
                      <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                        onClick={() => setMemberNumEdit(member.membership_number || '')}>Edit</button>
                    </div>
                  )}
                </div>
                <div className="admin-detail-field">
                  <span>Referral Points</span>
                  <ReferralPointsEditor
                    value={member.referral_points || 0}
                    onSave={async (val) => {
                      const { error } = await adminFetch('update_member', { user_id: entry.member_id, referral_points: val })
                      if (error) showToast('Error updating referral points.')
                      else {
                        setMember(prev => ({ ...prev, referral_points: val }))
                        showToast('Referral points updated.')
                      }
                    }}
                  />
                </div>
                <div className="admin-detail-field"><span>Posts</span><strong>{member.post_count || 0}</strong></div>
                <div className="admin-detail-field"><span>Threads</span><strong>{member.thread_count || 0}</strong></div>
              </div>

              {/* Badges */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Awards & Roles</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  {badges.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>None assigned</span>}
                  {badges.map(b => {
                    const s = BADGE_COLORS[b] || { bg: '#525252', text: '#fff' }
                    return (
                      <span key={b} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: s.bg, color: s.text, borderRadius: '999px', padding: '0.2rem 0.65rem', fontSize: '0.78rem', fontWeight: 700 }}>
                        {b}
                        <button onClick={() => setBadges(prev => prev.filter(x => x !== b))} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, lineHeight: 1, opacity: 0.75, fontSize: '0.85rem' }}>✕</button>
                      </span>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select className="an-select" style={{ maxWidth: '200px' }} defaultValue=""
                    onChange={e => { if (e.target.value) { setBadges(prev => prev.includes(e.target.value) ? prev : [...prev, e.target.value]); e.target.value = '' } }}>
                    <option value="" disabled>+ Add badge...</option>
                    {PRESET_BADGES.filter(b => !badges.includes(b)).map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <button className="btn btn-primary btn-sm" onClick={handleSaveBadges} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Badges'}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Actions</h3>
                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => {
                    const link = `https://www.coinclub.co.za/join?ref=${entry.member_id}`
                    navigator.clipboard.writeText(link)
                    showToast('Referral link copied!')
                  }}>
                    <i className="fa-solid fa-link" style={{ marginRight: '0.3rem' }} />Copy Referral Link
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={async () => {
                    setSaving(true)
                    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/password-reset`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
                      body: JSON.stringify({ action: 'request', email: entry.email }),
                    })
                    if (!res.ok) showToast('Error sending reset email.')
                    else showToast('Password reset email sent!')
                    setSaving(false)
                  }} disabled={saving}>
                    <i className="fa-solid fa-key" style={{ marginRight: '0.3rem' }} />Send Password Reset
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={handleMute} disabled={saving}>
                    {isMuted ? 'Unmute' : 'Mute'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={handleBan} disabled={saving}
                    style={{ color: isBanned ? 'var(--sa-green)' : '#E63946', borderColor: isBanned ? 'var(--sa-green)' : '#E63946' }}>
                    {isBanned ? 'Unban' : 'Ban'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
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

function SignupsTable({ entries, onSelect, onApprove, onReject, onResend, onRemind, onDeleteApproved }) {
  if (entries.length === 0) return <p className="admin-empty">No applications in this category.</p>
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th className="col-hide-mobile">Email</th>
            <th className="col-hide-mobile">Province</th>
            <th className="col-hide-mobile">Payment Ref</th>
            <th className="col-hide-mobile">Submitted</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => (
            <tr key={entry.id} className="admin-row" onClick={() => onSelect(entry)}>
              <td className="admin-row-name"><strong>{entry.first_name} {entry.surname}</strong></td>
              <td className="col-hide-mobile">{entry.email}</td>
              <td className="col-hide-mobile">{entry.province || '—'}</td>
              <td className="col-hide-mobile"><code className="admin-ref">{entry.reference_number}</code></td>
              <td className="col-hide-mobile admin-row-date">{formatDate(entry.submitted_at)}</td>
              <td className="admin-row-actions" onClick={e => e.stopPropagation()}>
                {entry.status === 'pending' && (
                  <>
                    <button className="admin-approve-sm" onClick={() => onApprove(entry.id)} title="Approve"><i className="fa-solid fa-check" /></button>
                    <button className="admin-reject-sm"  onClick={() => onReject(entry)}     title="Reject"><i className="fa-solid fa-xmark" /></button>
                    <button className="admin-approve-sm" onClick={() => onRemind(entry.id)} title="Send payment reminder"><i className="fa-solid fa-bell" /></button>
                  </>
                )}
                {entry.status === 'approved' && (
                  <>
                    <button className="admin-approve-sm" onClick={() => onResend(entry.id)} title="Resend email"><i className="fa-solid fa-envelope" /></button>
                    <button className="admin-reject-sm" onClick={() => onDeleteApproved(entry)} title="Delete account"><i className="fa-solid fa-trash" /></button>
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

function ReferralPointsEditor({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)
  if (editing) return (
    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.25rem' }}>
      <input type="number" min="0" className="an-input" value={val} onChange={e => setVal(Number(e.target.value))}
        style={{ width: '80px', padding: '0.3rem 0.5rem', fontSize: '0.9rem' }} />
      <button className="btn btn-primary btn-sm" onClick={async () => { await onSave(val); setEditing(false) }}>Save</button>
      <button className="btn btn-secondary btn-sm" onClick={() => { setVal(value); setEditing(false) }}>✕</button>
    </div>
  )
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <strong>{value}</strong>
      <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }} onClick={() => { setVal(value); setEditing(true) }}>Edit</button>
    </div>
  )
}

function MembersSection({ adminPassword, showToast }) {
  const [members, setMembers]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState(null)
  const [saving, setSaving]           = useState(false)
  const [badges, setBadges]           = useState([])
  const [search, setSearch]           = useState('')
  const [memberNumEdit, setMemberNumEdit] = useState(null)

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

  async function handleUpdateMemberNumber(userId, newNumber) {
    const res = await adminFetch('update_membership_number', { user_id: userId, membership_number: newNumber })
    if (res?.error) { showToast('Error: ' + res.error); return }
    setSelected(s => s ? { ...s, membership_number: newNumber } : s)
    setMembers(prev => prev.map(m => m.id === userId ? { ...m, membership_number: newNumber } : m))
    showToast('Membership number updated.')
  }

  const filtered = search.trim()
    ? members.filter(m =>
        m.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        m.email?.toLowerCase().includes(search.toLowerCase())
      )
    : members

  if (selected) {
    const joinedDate = new Date(selected.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
    const isBanned = selected.banned_until && new Date(selected.banned_until) > new Date()
    const isMuted  = (selected.roles || []).includes('Muted')
    const [editingMemberNum, setEditingMemberNum] = [memberNumEdit, setMemberNumEdit]

    return (
      <div className="admin-forum-wrap">
        <div className="admin-forum-bar">
          <button className="admin-detail-back" onClick={() => { setSelected(null); setMemberNumEdit('') }}>← All Members</button>
        </div>

        <div className="admin-detail-card">
          {/* Header */}
          <div className="admin-member-profile-header">
            <div className="admin-member-avatar">
              {selected.avatar_url
                ? <img src={selected.avatar_url} alt="" className="admin-member-avatar-img" />
                : <div className="admin-member-avatar-initials">{getInitials(selected.display_name)}</div>
              }
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{selected.display_name}</h2>
                {isBanned && <span style={{ fontSize: '0.72rem', background: '#E63946', color: '#fff', borderRadius: '4px', padding: '2px 7px', fontWeight: 700 }}>Banned</span>}
                {isMuted  && <span style={{ fontSize: '0.72rem', background: '#525252', color: '#fff', borderRadius: '4px', padding: '2px 7px', fontWeight: 700 }}>Muted</span>}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.2rem 0 0' }}>{selected.email}</p>
            </div>
          </div>

          {/* Info grid */}
          <div className="admin-detail-grid" style={{ marginTop: '1.25rem' }}>
            {/* Membership number — editable */}
            <div className="admin-detail-field">
              <span>Membership No.</span>
              {editingMemberNum !== null ? (
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.25rem' }}>
                  <input
                    className="an-input"
                    value={editingMemberNum}
                    onChange={e => setMemberNumEdit(e.target.value)}
                    style={{ width: '100px', padding: '0.3rem 0.5rem', fontSize: '0.9rem' }}
                  />
                  <button className="btn btn-primary btn-sm" disabled={saving} onClick={async () => {
                    await handleUpdateMemberNumber(selected.id, editingMemberNum)
                    setMemberNumEdit(null)
                  }}>Save</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setMemberNumEdit(null)}>✕</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <strong>{selected.membership_number || '—'}</strong>
                  <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }} onClick={() => setMemberNumEdit(selected.membership_number || '')}>Edit</button>
                </div>
              )}
            </div>
            <div className="admin-detail-field"><span>Member Since</span><strong>{joinedDate}</strong></div>
            <div className="admin-detail-field"><span>Posts</span><strong>{selected.post_count || 0}</strong></div>
            <div className="admin-detail-field"><span>Threads</span><strong>{selected.thread_count || 0}</strong></div>
            <div className="admin-detail-field">
              <span>Referral Points</span>
              <ReferralPointsEditor
                value={selected.referral_points || 0}
                onSave={async (val) => {
                  const res = await adminFetch('update_member', { user_id: selected.id, referral_points: val })
                  if (res?.error) { showToast('Error: ' + res.error); return }
                  setSelected(s => s ? { ...s, referral_points: val } : s)
                  setMembers(prev => prev.map(m => m.id === selected.id ? { ...m, referral_points: val } : m))
                  showToast('Referral points updated.')
                }}
              />
            </div>
            {selected.phone && <div className="admin-detail-field"><span>Phone</span><strong>{selected.phone}</strong></div>}
            {(selected.address || selected.city || selected.province || selected.country) && <div className="admin-detail-field full"><span>Address</span><strong>{[selected.address, selected.city, selected.province, selected.country].filter(Boolean).join(', ')}</strong></div>}
            {selected.location && <div className="admin-detail-field"><span>Location</span><strong>{selected.location}</strong></div>}
            {selected.bio && <div className="admin-detail-field full"><span>Bio</span><p className="admin-detail-message">{selected.bio}</p></div>}
          </div>

          {/* Awards & Roles — dropdown multi-select */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Awards & Roles</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
              {badges.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>None assigned</span>}
              {badges.map(b => {
                const s = BADGE_COLORS[b] || { bg: '#525252', text: '#fff' }
                return (
                  <span key={b} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: s.bg, color: s.text, borderRadius: '999px', padding: '0.2rem 0.65rem', fontSize: '0.78rem', fontWeight: 700 }}>
                    {b}
                    <button onClick={() => toggleBadge(b)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0', lineHeight: 1, opacity: 0.75, fontSize: '0.85rem' }}>✕</button>
                  </span>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                className="an-select"
                style={{ maxWidth: '200px' }}
                defaultValue=""
                onChange={e => { if (e.target.value) { toggleBadge(e.target.value); e.target.value = '' } }}
              >
                <option value="" disabled>+ Add badge…</option>
                {PRESET_BADGES.filter(b => !badges.includes(b)).map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <button className="btn btn-primary btn-sm" onClick={saveBadges} disabled={saving}>
                {saving ? 'Saving…' : 'Save Badges'}
              </button>
            </div>
          </div>

          {/* Member actions */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Actions</h3>
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => {
                const link = `https://www.coinclub.co.za/join?ref=${selected.id}`
                navigator.clipboard.writeText(link)
                showToast('Referral link copied!')
              }}>
                <i className="fa-solid fa-link" style={{ marginRight: '0.3rem' }} />Copy Referral Link
              </button>
              <button className="btn btn-secondary btn-sm" onClick={async () => {
                setSaving(true)
                const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/password-reset`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
                  body: JSON.stringify({ action: 'request', email: selected.email }),
                })
                if (!res.ok) showToast('Error sending reset email.')
                else showToast('Password reset email sent!')
                setSaving(false)
              }} disabled={saving}>
                <i className="fa-solid fa-key" style={{ marginRight: '0.3rem' }} />Send Password Reset
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleMute(selected)} disabled={saving}>
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleBan(selected)}
                disabled={saving}
                style={{ color: isBanned ? 'var(--sa-green)' : '#E63946', borderColor: isBanned ? 'var(--sa-green)' : '#E63946' }}
              >
                {isBanned ? 'Unban' : 'Ban'}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(selected)} disabled={saving} style={{ color: '#E63946', borderColor: '#E63946' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function exportMembersPDF() {
    const sorted = [...members]
      .filter(m => m.membership_number)
      .sort((a, b) => (parseInt(a.membership_number) || 0) - (parseInt(b.membership_number) || 0))

    const rows = sorted.map(m => {
      const parts = (m.display_name || '').split(' ')
      const first = parts.slice(0, -1).join(' ') || parts[0] || ''
      const surname = parts.length > 1 ? parts[parts.length - 1] : ''
      const addr = [m.address, m.city, m.province, m.country].filter(Boolean).join(', ')
      return { first, surname, num: m.membership_number || '', email: m.email || '', phone: m.phone || '', addr }
    })

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>SACCC Members</title>
<style>
  body { font-family: Arial, sans-serif; margin: 1.5cm; font-size: 10px; }
  h1 { font-size: 16px; margin: 0 0 4px; }
  .sub { font-size: 10px; color: #666; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 5px 6px; border-bottom: 2px solid #333; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; }
  td { padding: 4px 6px; border-bottom: 1px solid #ddd; }
  tr:nth-child(even) { background: #f9f9f9; }
  @media print { body { margin: 1cm; } @page { size: landscape; } }
</style></head><body>
<h1>South African Coin Collectors Club - Members</h1>
<p class="sub">Generated ${new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })} - ${rows.length} members</p>
<table><thead><tr><th>Name</th><th>Surname</th><th>No.</th><th>Email</th><th>Phone</th><th>Address</th></tr></thead><tbody>
${rows.map(r => `<tr><td>${r.first}</td><td>${r.surname}</td><td>${r.num}</td><td>${r.email}</td><td>${r.phone}</td><td>${r.addr}</td></tr>`).join('\n')}
</tbody></table></body></html>`

    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
    w.onload = () => { w.print() }
  }

  return (
    <div className="admin-forum-wrap">
      <div className="admin-forum-bar">
        <input
          className="admin-forum-filter"
          style={{ flex: 1, maxWidth: 320 }}
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="btn btn-secondary btn-sm" onClick={exportMembersPDF} style={{ whiteSpace: 'nowrap' }}>
          <i className="fa-solid fa-file-pdf" style={{ marginRight: '0.35rem' }} />Export PDF
        </button>
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
                <th className="col-hide-mobile">Email</th>
                <th>Membership No.</th>
                <th className="col-hide-mobile" style={{ textAlign: 'center' }}>Posts</th>
                <th className="col-hide-mobile" style={{ textAlign: 'center' }}>Threads</th>
                <th className="col-hide-mobile">Badges</th>
                <th className="col-hide-mobile">Joined</th>
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
                  <td className="col-hide-mobile" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{m.email}</td>
                  <td style={{ fontSize: '0.875rem' }}><code className="admin-ref">{m.membership_number || '—'}</code></td>
                  <td className="col-hide-mobile" style={{ textAlign: 'center', fontSize: '0.875rem' }}>{m.post_count || 0}</td>
                  <td className="col-hide-mobile" style={{ textAlign: 'center', fontSize: '0.875rem' }}>{m.thread_count || 0}</td>
                  <td className="col-hide-mobile">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {[...(m.roles || []), ...(m.awards || [])].map(b => <MemberBadge key={b} label={b} />)}
                    </div>
                  </td>
                  <td className="col-hide-mobile admin-row-date">{new Date(m.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
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

// ── Messages ─────────────────────────────────────────

function MessagesSection() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    supabase.from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => { setMessages(data || []); setLoading(false) })
  }, [])

  if (selected) {
    return (
      <div className="admin-forum-wrap">
        <div className="admin-forum-bar">
          <button className="admin-detail-back" onClick={() => setSelected(null)}>← All Messages</button>
        </div>
        <div className="admin-detail-card">
          <div className="admin-detail-title-row">
            <div>
              <h2>{selected.name}</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selected.email}</span>
            </div>
            <span className="admin-detail-date">{formatDate(selected.created_at)}</span>
          </div>
          <div className="admin-detail-grid" style={{ marginTop: '1rem' }}>
            <div className="admin-detail-field"><span>Subject</span><strong>{selected.subject || 'General enquiry'}</strong></div>
            <div className="admin-detail-field"><span>Email</span><strong>{selected.email}</strong></div>
          </div>
          <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Message</span>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap', margin: 0 }}>{selected.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-forum-wrap">
      <div className="admin-forum-bar">
        <span className="admin-forum-count">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
      </div>
      {loading ? (
        <p className="admin-empty">Loading messages...</p>
      ) : messages.length === 0 ? (
        <p className="admin-empty">No messages yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Subject</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {messages.map(m => (
                <tr key={m.id} className="admin-row" onClick={() => setSelected(m)}>
                  <td><strong>{m.name}</strong></td>
                  <td>{m.email}</td>
                  <td>{m.subject || 'General enquiry'}</td>
                  <td>{timeAgo(m.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────

function AdminDashboard({ adminPassword, onLogout }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [mainView, setMainView] = useState(() => {
    const v = searchParams.get('view')
    return ['signups','consulting','members','news','magazine','forum','messages'].includes(v) ? v : 'signups'
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [signupSearch, setSignupSearch] = useState('')

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
    if (actionLoading) return
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
    if (!res.ok) showToast('Approval error')
    else {
      const data = await res.json()
      if (data.already) showToast('Already approved. Use Resend Email to send credentials again.')
      else showToast('Application approved. Login credentials sent to member.')
      setSelected(null)
      loadApplications(statusTab)
    }
    setActionLoading(false)
  }

  async function handleDeleteApproved(entry) {
    if (!window.confirm(`Delete ${entry.first_name} ${entry.surname}'s account and application? This cannot be undone.`)) return
    setActionLoading(true)
    // Delete the auth user/profile if they have a member_id
    if (entry.member_id) {
      await adminFetch('delete_member', { user_id: entry.member_id })
    }
    // Delete the application record
    const { error } = await supabase
      .from('membership_applications')
      .delete()
      .eq('id', entry.id)
    if (error) {
      // If RLS blocks it, try via edge function
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'x-admin-secret': adminPassword,
        },
        body: JSON.stringify({ id: entry.id, action: 'delete' }),
      })
    }
    showToast('Account and application deleted.')
    setSelected(null)
    loadApplications(statusTab)
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

  async function handleRemind(id) {
    setActionLoading(true)
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'x-admin-secret': adminPassword,
      },
      body: JSON.stringify({ id, action: 'remind' }),
    })
    if (!res.ok) showToast('Error sending reminder.')
    else showToast('Payment reminder sent!')
    setActionLoading(false)
  }

  async function handleResendEmail(id) {
    if (!window.confirm('This will generate a new password and resend the welcome email. Continue?')) return
    setActionLoading(true)
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'x-admin-secret': adminPassword,
      },
      body: JSON.stringify({ id, action: 'resend' }),
    })
    if (!res.ok) showToast('Error resending email.')
    else showToast('Credentials email resent successfully.')
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

  function switchMain(v) { setMainView(v); setSelected(null); setSearchParams({ view: v }, { replace: true }); setSidebarOpen(false) }
  function switchStatus(s) { setStatusTab(s); setSelected(null); setSignupSearch('') }

  const topbarTitle =
    mainView === 'signups'     ? 'Sign-ups'
    : mainView === 'consulting'  ? 'Consulting Requests'
    : mainView === 'members'     ? 'Members'
    : mainView === 'news'        ? 'News & Articles'
    : mainView === 'magazine'    ? 'Magazine Analytics'
    : mainView === 'messages'    ? 'Messages'
    : 'Forum Management'

  return (
    <div className="admin-wrap">
      {sidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      {rejectTarget && (
        <RejectModal
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
          loading={actionLoading}
        />
      )}
      {toast && <div className="admin-toast">{toast}</div>}

      {/* ── Sidebar ─── */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
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

          <button
            className={`admin-nav-item ${mainView === 'messages' ? 'active' : ''}`}
            onClick={() => switchMain('messages')}
          >
            <span>Messages</span>
          </button>

          <p className="admin-nav-section">Content</p>
          <button
            className={`admin-nav-item ${mainView === 'news' ? 'active' : ''}`}
            onClick={() => switchMain('news')}
          >
            <span>News & Articles</span>
          </button>
          <button
            className={`admin-nav-item ${mainView === 'magazine' ? 'active' : ''}`}
            onClick={() => switchMain('magazine')}
          >
            <span>Magazine</span>
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
            <button className="admin-hamburger" onClick={() => setSidebarOpen(v => !v)} aria-label="Menu">
              <span /><span /><span />
            </button>
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
          {mainView === 'messages' ? (
            <MessagesSection />
          ) : mainView === 'news' ? (
            <AdminNews showToast={showToast} />
          ) : mainView === 'magazine' ? (
            <AdminMagazine />
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
                onResend={handleResendEmail}
                onRemind={handleRemind}
                onDeleteApproved={handleDeleteApproved}
                adminPassword={adminPassword}
                showToast={showToast}
                actionLoading={actionLoading}
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
            <>
              <div className="admin-forum-bar" style={{ marginBottom: '1rem' }}>
                <input
                  className="admin-forum-filter"
                  style={{ flex: 1, maxWidth: 320 }}
                  placeholder="Search by name, email, or payment ref..."
                  value={signupSearch}
                  onChange={e => setSignupSearch(e.target.value)}
                />
                <span className="admin-forum-count">
                  {(signupSearch.trim()
                    ? applications.filter(a => {
                        const q = signupSearch.toLowerCase()
                        return (a.first_name + ' ' + a.surname).toLowerCase().includes(q)
                          || (a.email || '').toLowerCase().includes(q)
                          || (a.reference_number || '').toLowerCase().includes(q)
                      })
                    : applications
                  ).length} result{applications.length !== 1 ? 's' : ''}
                </span>
              </div>
              <SignupsTable
                entries={signupSearch.trim()
                  ? applications.filter(a => {
                      const q = signupSearch.toLowerCase()
                      return (a.first_name + ' ' + a.surname).toLowerCase().includes(q)
                        || (a.email || '').toLowerCase().includes(q)
                        || (a.reference_number || '').toLowerCase().includes(q)
                    })
                  : applications
                }
                onSelect={setSelected}
                onApprove={handleApprove}
                onReject={entry => setRejectTarget(entry)}
                onResend={handleResendEmail}
                onRemind={handleRemind}
                onDeleteApproved={handleDeleteApproved}
              />
            </>
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
