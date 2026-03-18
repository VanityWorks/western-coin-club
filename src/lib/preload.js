// Module-level promise cache — fetches start immediately on first call and are reused.
// _resolved holds the already-settled value so components can read synchronously
// (zero-delay render from cache, no loading spinner on revisit).
import { supabase } from './supabase'

const _cache   = {}  // key → Promise
const _resolved = {} // key → resolved value (sync readable via peekSync)

function cached(key, fn) {
  if (!_cache[key]) {
    _cache[key] = fn()
      .then(result => { _resolved[key] = result; return result })
      .catch(() => { delete _cache[key]; return null })
  }
  return _cache[key]
}

// Read already-resolved cache synchronously — undefined if not yet resolved.
export function peekSync(key) { return _resolved[key] }

function invalidate(key) { delete _cache[key]; delete _resolved[key] }
export function invalidateThreads(categoryId) { invalidate(`threads_${categoryId}`) }
export function invalidatePosts(threadId)     { invalidate(`posts_${threadId}`) }
export function invalidateForumHome()         { invalidate('categories'); invalidate('thread_stats') }

// ── Categories ──────────────────────────────────────────────────────────────

export function getCategories() {
  return cached('categories', async () => {
    const { data } = await supabase.from('forum_categories').select('*').order('sort_order')
    return data || []
  })
}

// ── Thread stats (used on forum home for "last thread" info) ────────────────

export function getThreadStats() {
  return cached('thread_stats', async () => {
    const { data } = await supabase
      .from('forum_threads')
      .select('category_id, title, author_name, created_at')
      .order('created_at', { ascending: false })
    return data || []
  })
}

// ── Threads for a category (includes thread-author avatars) ─────────────────

export function getCategoryThreads(categoryId) {
  return cached(`threads_${categoryId}`, async () => {
    const { data } = await supabase
      .from('forum_threads')
      .select('*, forum_posts(count)')
      .eq('category_id', categoryId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    const threads = data || []

    // Batch-fetch author avatars in the same tick
    const ids = [...new Set(threads.map(t => t.author_id).filter(Boolean))]
    const avatarMap = {}
    if (ids.length) {
      const { data: profs } = await supabase.from('profiles').select('id, avatar_url').in('id', ids)
      profs?.forEach(p => { avatarMap[p.id] = p.avatar_url })
    }
    return { threads, avatarMap }
  })
}

// ── Posts for a thread (includes poster avatars, fully cached) ───────────────

export function getThreadPosts(threadId) {
  return cached(`posts_${threadId}`, async () => {
    const { data: posts } = await supabase
      .from('forum_posts')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
    const items = posts || []

    // Batch-fetch all poster avatars
    const ids = [...new Set(items.map(p => p.author_id).filter(Boolean))]
    const avatarMap = {}
    if (ids.length) {
      const { data: profs } = await supabase.from('profiles').select('id, avatar_url').in('id', ids)
      profs?.forEach(p => { avatarMap[p.id] = p.avatar_url })
    }
    return { posts: items, avatarMap }
  })
}

// Fire-and-forget hover prefetch — call on mouseenter of a thread row
export function prefetchThread(threadId) { getThreadPosts(threadId) }

// Call on app startup to warm the entire forum cache.
// Fetches categories + stats, then immediately fires thread fetches for every
// category in parallel — so navigating into any forum is instant.
export function prefetchForum() {
  Promise.all([getCategories(), getThreadStats()]).then(([cats]) => {
    if (cats) cats.forEach(cat => getCategoryThreads(cat.id))
  })
}
