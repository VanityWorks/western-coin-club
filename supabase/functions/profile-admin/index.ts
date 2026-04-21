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
      const [{ data: profiles }, { data: authUsers }, { data: postRows }, { data: threadRows }, { data: apps }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.auth.admin.listUsers({ perPage: 1000 }),
        supabase.from('forum_posts').select('author_id').not('author_id', 'is', null),
        supabase.from('forum_threads').select('author_id').not('author_id', 'is', null),
        supabase.from('membership_applications').select('member_id, email, mobile, address, city, province, country').eq('status', 'approved').order('submitted_at', { ascending: true }),
      ])

      const emailMap = new Map((authUsers as any)?.users?.map((u: any) => [u.id, u.email]) ?? [])
      const reverseEmailMap = new Map((authUsers as any)?.users?.map((u: any) => [u.email, u.id]) ?? [])
      const bannedMap = new Map((authUsers as any)?.users?.map((u: any) => [u.id, u.banned_until ?? null]) ?? [])
      // Build address map keyed by user id — rows with member_id always take priority
      const addressMap = new Map<string, any>()
      const memberIdMatched = new Set<string>()
      for (const a of (apps || [])) {
        const info = { phone: a.mobile, address: a.address, city: a.city, province: a.province, country: a.country }
        if (a.member_id) {
          addressMap.set(a.member_id, info)
          memberIdMatched.add(a.member_id)
        } else {
          const uid = reverseEmailMap.get(a.email)
          if (uid && !memberIdMatched.has(uid)) addressMap.set(uid, info)
        }
      }

      const postCounts = new Map<string, number>()
      postRows?.forEach((r: any) => postCounts.set(r.author_id, (postCounts.get(r.author_id) || 0) + 1))

      const threadCounts = new Map<string, number>()
      threadRows?.forEach((r: any) => threadCounts.set(r.author_id, (threadCounts.get(r.author_id) || 0) + 1))

      const enriched = (profiles || []).map((p: any) => {
        const addr = addressMap.get(p.id) || {}
        return {
          ...p,
          email: emailMap.get(p.id) || '',
          post_count: postCounts.get(p.id) || 0,
          thread_count: threadCounts.get(p.id) || 0,
          banned_until: bannedMap.get(p.id) || null,
          phone: addr.phone || '',
          address: addr.address || '',
          city: addr.city || '',
          province: addr.province || '',
          country: addr.country || '',
        }
      })

      return json({ data: enriched })
    }

    // ── Get single member ────────────────────────────────────────────────────
    if (action === 'get_member') {
      const { user_id } = body
      const [{ data: profile }, { data: authUser }, postRes, threadRes, { data: app }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user_id).single(),
        supabase.auth.admin.getUserById(user_id),
        supabase.from('forum_posts').select('*', { count: 'exact', head: true }).eq('author_id', user_id),
        supabase.from('forum_threads').select('*', { count: 'exact', head: true }).eq('author_id', user_id),
        supabase.from('membership_applications').select('mobile, address, city, province, country').eq('member_id', user_id).eq('status', 'approved').maybeSingle(),
      ])
      return json({
        data: {
          ...profile,
          email: (authUser as any)?.user?.email || '',
          phone: app?.mobile || '',
          address: app?.address || '',
          city: app?.city || '',
          province: app?.province || '',
          country: app?.country || '',
          post_count: postRes.count || 0,
          thread_count: threadRes.count || 0,
        }
      })
    }

    // ── Update signup/application fields ───────────────────────────────────────
    if (action === 'update_signup') {
      const { signup_id, fields } = body
      const allowed = ['email', 'first_name', 'surname', 'mobile', 'whatsapp', 'city', 'province', 'country', 'address']
      const patch: Record<string, unknown> = {}
      for (const key of allowed) {
        if (fields[key] !== undefined) patch[key] = fields[key]
      }
      if (Object.keys(patch).length === 0) return json({ error: 'No valid fields' }, 400)

      const { error } = await supabase.from('membership_applications').update(patch).eq('id', signup_id)
      if (error) throw error

      // If email changed and there's a linked auth user, update auth email too
      if (patch.email) {
        const { data: app } = await supabase.from('membership_applications').select('member_id').eq('id', signup_id).single()
        if (app?.member_id) {
          await supabase.auth.admin.updateUserById(app.member_id, { email: patch.email as string })
        }
      }

      // If name changed and there's a linked auth user, update profile display_name + auth metadata
      if (patch.first_name || patch.surname) {
        const { data: app } = await supabase.from('membership_applications').select('member_id, first_name, surname').eq('id', signup_id).single()
        if (app?.member_id) {
          const name = `${app.first_name} ${app.surname}`.trim()
          await supabase.from('profiles').update({ display_name: name }).eq('id', app.member_id)
          await supabase.auth.admin.updateUserById(app.member_id, {
            user_metadata: { first_name: app.first_name, surname: app.surname }
          })
        }
      }

      return json({ success: true })
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

    // ── Reset password ──────────────────────────────────────────────────────
    if (action === 'reset_password') {
      const { user_id, password } = body
      const { error } = await supabase.auth.admin.updateUserById(user_id, { password })
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
