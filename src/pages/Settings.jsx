import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import './Settings.css'

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return parts[0].slice(0, 2).toUpperCase()
}

export default function Settings() {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [bio,          setBio]          = useState('')
  const [location,     setLocation]     = useState('')
  const [showLocation, setShowLocation] = useState(true)
  const [showPosts,    setShowPosts]    = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved,  setProfileSaved]  = useState(false)

  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarPreview,   setAvatarPreview]   = useState(null)
  const fileRef = useRef(null)

  const [currentPw,  setCurrentPw]  = useState('')
  const [newPw,      setNewPw]      = useState('')
  const [confirmPw,  setConfirmPw]  = useState('')
  const [pwLoading,  setPwLoading]  = useState(false)
  const [pwMsg,      setPwMsg]      = useState(null)

  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [authLoading, user, navigate])

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '')
      setLocation(profile.location || '')
      setShowLocation(profile.show_location !== false)
      setShowPosts(profile.show_posts !== false)
      setAvatarPreview(profile.avatar_url || null)
    }
  }, [profile])

  async function handleSaveProfile(e) {
    e.preventDefault()
    setProfileSaving(true)
    await supabase.from('profiles').update({
      bio, location, show_location: showLocation, show_posts: showPosts,
    }).eq('id', user.id)
    await refreshProfile()
    setProfileSaving(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2500)
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!ALLOWED.includes(file.type)) { alert('Please upload a JPEG, PNG, WebP, or GIF image.'); return }
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5 MB.'); return }
    setAvatarUploading(true)
    const ext  = file.name.split('.').pop().toLowerCase()
    const path = `${user.id}/avatar.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (upErr) { alert('Upload failed: ' + upErr.message); setAvatarUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
    await refreshProfile()
    setAvatarPreview(publicUrl)
    setAvatarUploading(false)
  }

  async function handleRemoveAvatar() {
    await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id)
    await refreshProfile()
    setAvatarPreview(null)
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    if (newPw !== confirmPw) { setPwMsg({ ok: false, text: 'Passwords do not match.' }); return }
    if (newPw.length < 8) { setPwMsg({ ok: false, text: 'Password must be at least 8 characters.' }); return }
    setPwLoading(true)
    // Re-authenticate first
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email, password: currentPw,
    })
    if (signInErr) { setPwMsg({ ok: false, text: 'Current password is incorrect.' }); setPwLoading(false); return }
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) { setPwMsg({ ok: false, text: error.message }); }
    else {
      setPwMsg({ ok: true, text: 'Password changed successfully.' })
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    }
    setPwLoading(false)
  }

  if (authLoading || !profile) return (
    <main className="page settings-page">
      <div className="settings-loading"><i className="fa-solid fa-circle-notch fa-spin" /> Loading…</div>
    </main>
  )

  return (
    <main className="page settings-page">
      <section className="page-hero">
        <div className="container">
          <h1>Account Settings</h1>
          <p>Manage your profile and preferences</p>
        </div>
      </section>

      <div className="settings-content container">

        {/* ── Profile info ──────────────────────────────── */}
        <div className="settings-card">
          <h2>Profile</h2>
          <form onSubmit={handleSaveProfile}>
            <div className="settings-field">
              <label>Display Name</label>
              <input type="text" value={profile.display_name} disabled className="settings-input settings-input-disabled" />
              <p className="settings-hint">Your name cannot be changed. Contact an admin if needed.</p>
            </div>
            <div className="settings-field">
              <label>Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="settings-textarea"
                rows={3}
                placeholder="Tell the community about yourself…"
                maxLength={300}
              />
              <p className="settings-hint">{bio.length}/300</p>
            </div>
            <div className="settings-field">
              <label>Location</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="settings-input"
                placeholder="e.g. Cape Town, South Africa"
                maxLength={80}
              />
            </div>
            <div className="settings-toggles">
              <label className="settings-toggle">
                <input type="checkbox" checked={showLocation} onChange={e => setShowLocation(e.target.checked)} />
                <span>Show location on my public profile</span>
              </label>
              <label className="settings-toggle">
                <input type="checkbox" checked={showPosts} onChange={e => setShowPosts(e.target.checked)} />
                <span>Show my threads and posts on my public profile</span>
              </label>
            </div>
            <div className="settings-actions">
              <button type="submit" className="btn btn-primary" disabled={profileSaving}>
                {profileSaving ? 'Saving…' : profileSaved ? <><i className="fa-solid fa-check" /> Saved</> : 'Save Changes'}
              </button>
              <Link to={`/profile/${user.id}`} className="settings-view-link">
                View public profile →
              </Link>
            </div>
          </form>
        </div>

        {/* ── Avatar ────────────────────────────────────── */}
        <div className="settings-card">
          <h2>Profile Picture</h2>
          <div className="settings-avatar-row">
            <div className="settings-avatar-preview">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="settings-avatar-img" />
              ) : (
                <div className="settings-avatar-initials">
                  {getInitials(profile.display_name)}
                </div>
              )}
            </div>
            <div className="settings-avatar-actions">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => fileRef.current?.click()}
                disabled={avatarUploading}
              >
                {avatarUploading ? <><i className="fa-solid fa-circle-notch fa-spin" /> Uploading…</> : 'Upload Photo'}
              </button>
              {avatarPreview && (
                <button type="button" className="settings-remove-btn" onClick={handleRemoveAvatar}>
                  Remove
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
            </div>
          </div>
          <p className="settings-hint">JPG, PNG or GIF. Max 5 MB.</p>
        </div>

        {/* ── Change password ───────────────────────────── */}
        <div className="settings-card">
          <h2>Change Password</h2>
          <form onSubmit={handleChangePassword}>
            <div className="settings-field">
              <label>Current Password</label>
              <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} className="settings-input" required placeholder="••••••••" />
            </div>
            <div className="settings-field">
              <label>New Password</label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className="settings-input" required placeholder="Min. 8 characters" minLength={8} />
            </div>
            <div className="settings-field">
              <label>Confirm New Password</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className="settings-input" required placeholder="••••••••" />
            </div>
            {pwMsg && (
              <p className={`settings-msg ${pwMsg.ok ? 'settings-msg-ok' : 'settings-msg-err'}`}>
                <i className={`fa-solid ${pwMsg.ok ? 'fa-check' : 'fa-circle-exclamation'}`} /> {pwMsg.text}
              </p>
            )}
            <button type="submit" className="btn btn-primary" disabled={pwLoading}>
              {pwLoading ? 'Updating…' : 'Change Password'}
            </button>
          </form>
        </div>

      </div>
    </main>
  )
}
