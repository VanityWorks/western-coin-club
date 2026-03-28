import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })

function resetEmail(firstName: string, resetUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'DM Sans',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:#0a0a0a;padding:28px 40px;text-align:center">
            <p style="margin:0;color:#FFB81C;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase">South African Coin Collectors Club</p>
          </td>
        </tr>
        <tr><td style="height:4px;background:#FFB81C"></td></tr>
        <tr>
          <td style="padding:40px 40px 32px">
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0a0a0a">Reset Your Password</h1>
            <p style="margin:0 0 28px;color:#525252;font-size:15px;line-height:1.6">
              Hi ${firstName}, we received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px">
              <tr>
                <td style="background:#007749;border-radius:8px">
                  <a href="${resetUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none">Reset Password</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:#a3a3a3;font-size:13px;line-height:1.6">
              If you didn't request this, you can safely ignore this email. Your password won't change.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #e5e5e5;text-align:center">
            <p style="margin:0;font-size:12px;color:#a3a3a3">South African Coin Collectors Club - coinclub.co.za</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const body = await req.json()
    const { action } = body

    // ── Request reset ────────────────────────────────────────
    if (action === 'request') {
      const { email } = body
      if (!email) return json({ error: 'Email required' }, 400)

      // Find user by email
      const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
      const user = listData?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())

      // Always return success (don't reveal if email exists)
      if (!user) return json({ success: true })

      const firstName = user.user_metadata?.first_name || 'Member'

      // Generate a secure token and store it with expiry
      const token = crypto.randomUUID() + '-' + crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

      // Store token in user metadata (simple approach, no extra table needed)
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          reset_token: token,
          reset_expires: expiresAt,
        },
      })

      const siteUrl = Deno.env.get('SITE_URL') || 'https://www.coinclub.co.za'
      const resetUrl = `${siteUrl}/reset-password?token=${token}&uid=${user.id}`

      // Send via SendGrid
      const sendgridKey = Deno.env.get('SENDGRID_API_KEY')
      const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@coinclub.co.za'

      if (!sendgridKey) throw new Error('SENDGRID_API_KEY not configured')

      const emailRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: fromEmail, name: 'SACCC' },
          subject: 'Reset Your SACCC Password',
          content: [{ type: 'text/html', value: resetEmail(firstName, resetUrl) }],
        }),
      })

      if (!emailRes.ok) {
        const errText = await emailRes.text()
        throw new Error(`SendGrid error: ${errText}`)
      }

      return json({ success: true })
    }

    // ── Verify token and reset password ──────────────────────
    if (action === 'reset') {
      const { token, uid, password } = body
      if (!token || !uid || !password) return json({ error: 'Missing fields' }, 400)
      if (password.length < 6) return json({ error: 'Password must be at least 6 characters' }, 400)

      // Get user and verify token
      const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(uid)
      if (userErr || !userData?.user) return json({ error: 'Invalid reset link' }, 400)

      const meta = userData.user.user_metadata || {}
      if (meta.reset_token !== token) return json({ error: 'Invalid or expired reset link' }, 400)

      const expires = new Date(meta.reset_expires || 0)
      if (expires < new Date()) return json({ error: 'Reset link has expired. Please request a new one.' }, 400)

      // Update password and clear token
      const { error: updateErr } = await supabase.auth.admin.updateUserById(uid, {
        password,
        user_metadata: {
          ...meta,
          reset_token: null,
          reset_expires: null,
        },
      })

      if (updateErr) throw updateErr

      return json({ success: true })
    }

    return json({ error: 'Invalid action' }, 400)
  } catch (err: any) {
    return json({ error: err.message || 'Internal server error' }, 500)
  }
})
