import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const secret = req.headers.get('x-admin-secret')
  if (!secret || secret !== Deno.env.get('ADMIN_SECRET')) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const body = await req.json()
    const { action } = body

    // ── List all threads ────────────────────────────────────────────────────────
    if (action === 'list_threads') {
      const { data, error } = await supabase
        .from('forum_threads')
        .select(`
          id, title, category_id, author_name, is_pinned, is_locked, views, created_at,
          forum_categories(name, group_name),
          forum_posts(count)
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return json({ data })
    }

    // ── Get posts in a thread ───────────────────────────────────────────────────
    if (action === 'get_posts') {
      const { thread_id } = body
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('thread_id', thread_id)
        .order('created_at', { ascending: true })
      if (error) throw error
      return json({ data })
    }

    // ── Create a thread (with first post) ───────────────────────────────────────
    if (action === 'create_thread') {
      const { category_id, title, content } = body
      const { data: thread, error: tErr } = await supabase
        .from('forum_threads')
        .insert({ category_id, title, author_name: 'Admin', author_id: null })
        .select()
        .single()
      if (tErr) throw tErr
      const { error: pErr } = await supabase
        .from('forum_posts')
        .insert({ thread_id: thread.id, content, author_name: 'Admin', author_id: null })
      if (pErr) throw pErr
      return json({ data: thread })
    }

    // ── Update a thread ─────────────────────────────────────────────────────────
    if (action === 'update_thread') {
      const { thread_id, ...rest } = body
      const allowed = ['title', 'is_pinned', 'is_locked']
      const patch: Record<string, unknown> = {}
      for (const k of allowed) if (k in rest) patch[k] = rest[k]
      const { error } = await supabase.from('forum_threads').update(patch).eq('id', thread_id)
      if (error) throw error
      return json({ success: true })
    }

    // ── Delete a thread (cascades to posts) ─────────────────────────────────────
    if (action === 'delete_thread') {
      const { thread_id } = body
      const { error } = await supabase.from('forum_threads').delete().eq('id', thread_id)
      if (error) throw error
      return json({ success: true })
    }

    // ── Update a post ───────────────────────────────────────────────────────────
    if (action === 'update_post') {
      const { post_id, content } = body
      const { error } = await supabase
        .from('forum_posts')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', post_id)
      if (error) throw error
      return json({ success: true })
    }

    // ── Delete a post ───────────────────────────────────────────────────────────
    if (action === 'delete_post') {
      const { post_id } = body
      const { error } = await supabase.from('forum_posts').delete().eq('id', post_id)
      if (error) throw error
      return json({ success: true })
    }

    // ── List categories (with thread counts) ────────────────────────────────────
    if (action === 'list_categories') {
      const { data, error } = await supabase
        .from('forum_categories')
        .select('*, forum_threads(count)')
        .order('sort_order')
      if (error) throw error
      return json({ data })
    }

    // ── Create category ─────────────────────────────────────────────────────────
    if (action === 'create_category') {
      const { id, group_id, group_name, name, description, color, icon_url, sort_order } = body
      const { error } = await supabase
        .from('forum_categories')
        .insert({ id, group_id, group_name, name, description: description || '', color: color || '#007749', icon_url: icon_url || null, sort_order: sort_order || 999 })
      if (error) throw error
      return json({ success: true })
    }

    // ── Update category ─────────────────────────────────────────────────────────
    if (action === 'update_category') {
      const { category_id, ...rest } = body
      const allowed = ['name', 'description', 'color', 'icon_url', 'group_id', 'group_name', 'sort_order']
      const patch: Record<string, unknown> = {}
      for (const k of allowed) if (k in rest) patch[k] = rest[k]
      const { error } = await supabase.from('forum_categories').update(patch).eq('id', category_id)
      if (error) throw error
      return json({ success: true })
    }

    // ── Delete category ─────────────────────────────────────────────────────────
    if (action === 'delete_category') {
      const { category_id } = body
      const { count } = await supabase
        .from('forum_threads')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category_id)
      if ((count ?? 0) > 0) {
        return json({ error: `Cannot delete: ${count} thread(s) exist in this category. Delete the threads first.` }, 400)
      }
      const { error } = await supabase.from('forum_categories').delete().eq('id', category_id)
      if (error) throw error
      return json({ success: true })
    }

    return json({ error: 'Invalid action' }, 400)
  } catch (err) {
    return json({ error: err.message }, 500)
  }
})
