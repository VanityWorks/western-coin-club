import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { supabase } from '../lib/supabase'
import './NewsArticle.css'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function NewsArticle() {
  const { id } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .eq('published', true)
        .single()

      if (error || !data) {
        setNotFound(true)
      } else {
        setArticle(data)
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <main className="na-page">
        <div className="na-container">
          <div className="na-loading">
            <span className="na-spinner" />
            <p>Loading article…</p>
          </div>
        </div>
      </main>
    )
  }

  if (notFound || !article) {
    return (
      <main className="na-page">
        <div className="na-container">
          <div className="na-notfound">
            <span className="na-notfound-icon">◎</span>
            <h1>Article not found</h1>
            <p>This article may have been removed or is not yet published.</p>
            <Link to="/news" className="btn btn-primary">← Back to News</Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="na-page">
      {/* Hero */}
      {article.cover_image && (
        <div className="na-hero">
          <img src={article.cover_image} alt={article.title} />
          <div className="na-hero-overlay" />
        </div>
      )}

      <div className="na-container">
        <Link to="/news" className="na-back">← Back to News</Link>

        <article className="na-article">
          {/* Meta */}
          <div className="na-meta">
            {article.category && (
              <span className="na-category">{article.category}</span>
            )}
            <span className="na-date">
              {formatDate(article.published_at || article.created_at)}
            </span>
            {article.author && (
              <span className="na-author">by {article.author}</span>
            )}
          </div>

          {/* Title */}
          <h1 className="na-title">{article.title}</h1>

          {/* Summary */}
          {article.summary && (
            <p className="na-summary">{article.summary}</p>
          )}

          {/* Divider */}
          <div className="na-rule" />

          {/* Body */}
          {article.body ? (
            <div
              className="na-body"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.body, { ADD_ATTR: ['target'] }) }}
            />
          ) : (
            <p className="na-empty-body">No content yet.</p>
          )}
        </article>

        <div className="na-footer">
          <Link to="/news" className="btn btn-secondary">← Back to News</Link>
        </div>
      </div>
    </main>
  )
}
