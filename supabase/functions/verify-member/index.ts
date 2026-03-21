import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  // Server-to-server API key auth
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey || apiKey !== Deno.env.get('MOBILE_API_KEY')) {
    return json({ error: 'Unauthorized' }, 401)
  }

  try {
    const { membership_number, password } = await req.json()

    if (!membership_number || !password) {
      return json({ valid: false, error: 'Missing membership number or password' })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Look up the member's email by membership number
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, email, display_name, membership_number')
      .eq('membership_number', String(membership_number).trim())
      .maybeSingle()

    if (profileErr) throw profileErr

    if (!profile) {
      return json({ valid: false, error: 'Invalid membership number or password' })
    }

    // Try signing in with the member's email and provided password
    // Use a fresh anon client for auth so we don't leak service role privileges
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    )

    const { error: authErr } = await anonClient.auth.signInWithPassword({
      email: profile.email,
      password,
    })

    if (authErr) {
      return json({ valid: false, error: 'Invalid membership number or password' })
    }

    return json({
      valid: true,
      member: {
        id: profile.id,
        display_name: profile.display_name,
        membership_number: profile.membership_number,
      },
    })
  } catch (err) {
    return json({ valid: false, error: 'Internal server error' }, 500)
  }
})
