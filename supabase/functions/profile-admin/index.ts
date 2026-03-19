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
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    const body = await req.json()
    const { action } = body

    // ── List all members ─────────────────────────────────────────────────────
    if (action === 'list_members') {
      const [{ data: profiles }, { data: authUsers }, { data: postRows }, { data: threadRows }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.auth.admin.listUsers({ perPage: 1000 }),
        supabase.from('forum_posts').select('author_id').not('author_id', 'is', null),
        supabase.from('forum_threads').select('author_id').not('author_id', 'is', null),
      ])

      const emailMap = new Map((authUsers as any)?.users?.map((u: any) => [u.id, u.email]) ?? [])
      const bannedMap = new Map((authUsers as any)?.users?.map((u: any) => [u.id, u.banned_until ?? null]) ?? [])

      const postCounts = new Map<string, number>()
      postRows?.forEach((r: any) => postCounts.set(r.author_id, (postCounts.get(r.author_id) || 0) + 1))

      const threadCounts = new Map<string, number>()
      threadRows?.forEach((r: any) => threadCounts.set(r.author_id, (threadCounts.get(r.author_id) || 0) + 1))

      const enriched = (profiles || []).map((p: any) => ({
        ...p,
        email: emailMap.get(p.id) || '',
        post_count: postCounts.get(p.id) || 0,
        thread_count: threadCounts.get(p.id) || 0,
        banned_until: bannedMap.get(p.id) || null,
      }))

      return json({ data: enriched })
    }

    // ── Get single member ────────────────────────────────────────────────────
    if (action === 'get_member') {
      const { user_id } = body
      const [{ data: profile }, { data: authUser }, postRes, threadRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user_id).single(),
        supabase.auth.admin.getUserById(user_id),
        supabase.from('forum_posts').select('*', { count: 'exact', head: true }).eq('author_id', user_id),
        supabase.from('forum_threads').select('*', { count: 'exact', head: true }).eq('author_id', user_id),
      ])
      return json({
        data: {
          ...profile,
          email: (authUser as any)?.user?.email || '',
          post_count: postRes.count || 0,
          thread_count: threadRes.count || 0,
        }
      })
    }

    // ── Update member awards/roles/referral_points ────────────────────────────
    if (action === 'update_member') {
      const { user_id, awards, roles, referral_points } = body
      const patch: Record<string, unknown> = {}
      if (awards !== undefined) patch.awards = awards
      if (roles !== undefined) patch.roles = roles
      if (referral_points !== undefined) patch.referral_points = referral_points
      const { error } = await supabase.from('profiles').update(patch).eq('id', user_id)
      if (error) throw error
      return json({ success: true })
    }

    // ── Ban member ───────────────────────────────────────────────────────────
    if (action === 'ban_member') {
      const { user_id } = body
      const { error } = await supabase.auth.admin.updateUserById(user_id, { ban_duration: '876000h' })
      if (error) throw error
      return json({ success: true })
    }

    // ── Unban member ─────────────────────────────────────────────────────────
    if (action === 'unban_member') {
      const { user_id } = body
      const { error } = await supabase.auth.admin.updateUserById(user_id, { ban_duration: 'none' })
      if (error) throw error
      return json({ success: true })
    }

    // ── Update membership number ──────────────────────────────────────────────
    if (action === 'update_membership_number') {
      const { user_id, membership_number } = body
      await supabase
        .from('membership_applications')
        .update({ reference_number: membership_number })
        .eq('member_id', user_id)
        .eq('status', 'approved')
      const { error } = await supabase
        .from('profiles')
        .update({ membership_number })
        .eq('id', user_id)
      if (error) throw error
      return json({ success: true })
    }

    // ── Delete member ────────────────────────────────────────────────────────
    if (action === 'delete_member') {
      const { user_id } = body
      const { error } = await supabase.auth.admin.deleteUser(user_id)
      if (error) throw error
      return json({ success: true })
    }

    return json({ error: 'Invalid action' }, 400)
  } catch (err: any) {
    return json({ error: err.message }, 500)
  }
})
