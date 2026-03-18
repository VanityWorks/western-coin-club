/**
 * Admin News Management
 *
 * Requires Supabase setup:
 * ─────────────────────────────────────────────────────
 * -- Table
 * create table articles (
 *   id uuid default gen_random_uuid() primary key,
 *   title text not null default '',
 *   summary text default '',
 *   body text default '',
 *   category text default 'General',
 *   cover_image text,
 *   author text default 'WCCC Admin',
 *   published boolean default false,
 *   published_at timestamptz,
 *   created_at timestamptz default now()
 * );
 * alter table articles enable row level security;
 * create policy "public_read_published" on articles for select using (published = true);
 * create policy "admin_all" on articles for all using (true) with check (true);
 *
 * -- Storage bucket (create via Supabase Dashboard → Storage)
 * Bucket name: article-images   (public bucket)
 * ─────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import NewsRichEditor from '../components/NewsRichEditor'
import './AdminNews.css'

const CATEGORIES = ['General', 'Bullion', 'History', 'Events', 'Education', 'Market', 'Club News']

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-ZA', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const BLANK = {
  title: '',
  summary: '',
  body: '',
  category: 'General',
  cover_image: '',
  author: 'WCCC Admin',
  published: false,
}

// ── Cover image upload ────────────────────────────────

function CoverImageField({ value, onChange }) {
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    fileRef.current.value = ''
    setUploading(true)
    const ext = file.name.split('.').pop().toLowerCase()
    const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('article-images').upload(path, file, { upsert: false })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('article-images').getPublicUrl(path)
      onChange(publicUrl)
    } else {
      alert('Cover upload failed. Ensure the "article-images" bucket exists in Supabase storage.')
    }
    setUploading(false)
  }

  return (
    <div className="an-cover-field">
      {value && (
        <div className="an-cover-preview">
          <img src={value} alt="Cover" />
          <button type="button" className="an-cover-remove" onClick={() => onChange('')}>✕</button>
        </div>
      )}
      <div className="an-cover-actions">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading…' : value ? 'Replace image' : 'Upload cover image'}
        </button>
        <span className="an-cover-or">or</span>
        <input
          type="url"
          className="an-cover-url"
          placeholder="Paste image URL…"
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}

// ── Article list ──────────────────────────────────────

function ArticleList({ articles, loading, onSelect, onCreate }) {
  return (
    <div className="an-list-wrap">
      <div className="an-list-header">
        <h2>Articles</h2>
        <button className="btn btn-primary btn-sm" onClick={onCreate}>+ New Article</button>
      </div>

      {loading ? (
        <p className="an-empty">Loading…</p>
      ) : articles.length === 0 ? (
        <div className="an-empty-state">
          <span className="an-empty-icon">◎</span>
          <p>No articles yet. Create your first one!</p>
          <button className="btn btn-primary" onClick={onCreate}>+ New Article</button>
        </div>
      ) : (
        <div className="an-list">
          {articles.map(a => (
            <button key={a.id} className="an-list-item" onClick={() => onSelect(a)}>
              {a.cover_image && (
                <img src={a.cover_image} alt="" className="an-list-thumb" />
              )}
              <div className="an-list-info">
                <div className="an-list-title">{a.title || <em>Untitled</em>}</div>
                <div className="an-list-meta">
                  <span className="an-list-cat">{a.category}</span>
                  <span>{formatDate(a.created_at)}</span>
                </div>
              </div>
              <span className={`an-status-dot ${a.published ? 'published' : 'draft'}`} title={a.published ? 'Published' : 'Draft'} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Article editor form ───────────────────────────────

function ArticleEditor({ initial, onSave, onDelete, onBack, saving }) {
  const [form, setForm] = useState(initial)
  const isNew = !initial.id

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function handleSubmit(e, publish) {
    e.preventDefault()
    onSave({ ...form, published: publish ?? form.published })
  }

  return (
    <div className="an-editor-wrap">
      <div className="an-editor-header">
        <button type="button" className="an-back-btn" onClick={onBack}>← Articles</button>
        <div className="an-editor-actions">
          {!isNew && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onDelete(form.id)}
              disabled={saving}
            >
              Delete
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={e => handleSubmit(e, false)}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={e => handleSubmit(e, true)}
            disabled={saving}
          >
            {saving ? 'Publishing…' : form.published ? 'Update & Publish' : 'Publish'}
          </button>
        </div>
      </div>

      <form className="an-form" onSubmit={e => handleSubmit(e)}>
        {/* Title */}
        <input
          className="an-title-input"
          type="text"
          placeholder="Article title…"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          required
        />

        {/* Summary */}
        <textarea
          className="an-summary-input"
          placeholder="Short summary / excerpt shown on the news listing page…"
          value={form.summary}
          onChange={e => set('summary', e.target.value)}
          rows={2}
        />

        {/* Row: category + author */}
        <div className="an-meta-row">
          <label className="an-label">
            Category
            <select
              className="an-select"
              value={form.category}
              onChange={e => set('category', e.target.value)}
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="an-label">
            Author
            <input
              className="an-input"
              type="text"
              value={form.author}
              onChange={e => set('author', e.target.value)}
            />
          </label>
        </div>

        {/* Cover image */}
        <label className="an-label">
          Cover Image
          <CoverImageField value={form.cover_image || ''} onChange={v => set('cover_image', v)} />
        </label>

        {/* Body */}
        <div className="an-body-label">
          <span>Article Body</span>
          <span className="an-body-hint">Use the toolbar to format text, insert images, add headings, and more</span>
        </div>
        <NewsRichEditor
          key={form.id || 'new'}
          content={form.body}
          onUpdate={html => set('body', html)}
          placeholder="Start writing your article…"
          minHeight={500}
        />

        {/* Status indicator */}
        <div className="an-status-bar">
          <span className={`an-status-pill ${form.published ? 'published' : 'draft'}`}>
            {form.published ? '● Published' : '○ Draft'}
          </span>
          {!isNew && form.published && form.published_at && (
            <span className="an-status-date">Published {formatDate(form.published_at)}</span>
          )}
        </div>
      </form>
    </div>
  )
}

// ── Main export ───────────────────────────────────────

export default function AdminNews({ showToast }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list')   // 'list' | 'new' | article object
  const [saving, setSaving] = useState(false)

  async function loadArticles() {
    setLoading(true)
    const { data } = await supabase
      .from('articles')
      .select('id, title, summary, category, cover_image, published, published_at, created_at, author')
      .order('created_at', { ascending: false })
    setArticles(data || [])
    setLoading(false)
  }

  useEffect(() => { loadArticles() }, [])

  async function handleSave(form) {
    setSaving(true)
    const now = new Date().toISOString()
    const payload = { ...form }

    // Set published_at when first publishing
    if (payload.published && !payload.published_at) {
      payload.published_at = now
    }
    // Clear published_at when un-publishing
    if (!payload.published) {
      payload.published_at = null
    }

    let error
    if (form.id) {
      // Update
      const { error: e } = await supabase.from('articles').update(payload).eq('id', form.id)
      error = e
    } else {
      // Insert
      delete payload.id
      const { error: e } = await supabase.from('articles').insert(payload)
      error = e
    }

    if (error) {
      showToast('Error saving article. Check Supabase table/RLS setup.')
    } else {
      showToast(form.published ? 'Article published!' : 'Saved as draft.')
      setView('list')
      loadArticles()
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this article? This cannot be undone.')) return
    const { error } = await supabase.from('articles').delete().eq('id', id)
    if (error) { showToast('Error deleting article.'); return }
    showToast('Article deleted.')
    setView('list')
    loadArticles()
  }

  if (view === 'list') {
    return (
      <ArticleList
        articles={articles}
        loading={loading}
        onSelect={a => setView(a)}
        onCreate={() => setView('new')}
      />
    )
  }

  if (view === 'new') {
    return (
      <ArticleEditor
        initial={BLANK}
        onSave={handleSave}
        onDelete={handleDelete}
        onBack={() => setView('list')}
        saving={saving}
      />
    )
  }

  // Editing existing
  return (
    <ArticleEditor
      initial={view}
      onSave={handleSave}
      onDelete={handleDelete}
      onBack={() => setView('list')}
      saving={saving}
    />
  )
}
