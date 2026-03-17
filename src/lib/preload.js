// Module-level promise cache — fetches start immediately on first call and are reused.
// Subsequent calls before resolution share the same in-flight promise.
import { supabase } from './supabase'

const _cache = {}

function cached(key, fn) {
  if (!_cache[key]) _cache[key] = fn().catch(() => { delete _cache[key]; return [] })
  return _cache[key]
}

export function invalidate(key) { delete _cache[key] }
export function invalidateThreads(categoryId) { invalidate(`threads_${categoryId}`) }
export function invalidateForumHome() { invalidate('categories'); invalidate('thread_stats') }

export function getCategories() {
  return cached('categories', async () => {
    const { data } = await supabase.from('forum_categories').select('*').order('sort_order')
    return data || []
  })
}

export function getThreadStats() {
  return cached('thread_stats', async () => {
    const { data } = await supabase
      .from('forum_threads')
      .select('category_id, title, author_name, created_at')
      .order('created_at', { ascending: false })
    return data || []
  })
}

export function getCategoryThreads(categoryId) {
  return cached(`threads_${categoryId}`, async () => {
    const { data } = await supabase
      .from('forum_threads')
      .select('*, forum_posts(count)')
      .eq('category_id', categoryId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    return data || []
  })
}

// Call on app startup to warm the cache before the user navigates to /forum
export function prefetchForum() {
  getCategories()
  getThreadStats()
}
