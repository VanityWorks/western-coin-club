import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
}

function generatePassword(firstName: string, surname: string): string {
  const base = firstName.toLowerCase().replace(/[^a-z]/g, '') +
               surname.toLowerCase().replace(/[^a-z]/g, '') +
               'saccc'
  const letters  = 'abcdefghjkmnpqrstuvwxyz'
  const digits   = '0123456789'
  const specials = '!@#$%'

  let suffix = ''
  suffix += digits[Math.floor(Math.random() * digits.length)]
  suffix += digits[Math.floor(Math.random() * digits.length)]
  for (let i = 0; i < 3; i++) suffix += letters[Math.floor(Math.random() * letters.length)]
  suffix += specials[Math.floor(Math.random() * specials.length)]
  suffix += digits[Math.floor(Math.random() * digits.length)]
  for (let i = 0; i < 3; i++) suffix += letters[Math.floor(Math.random() * letters.length)]

  return base + suffix
}

function credentialsEmail(app: Record<string, string>, password: string, siteUrl: string): string {
  const loginUrl = `${siteUrl}/login`
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'DM Sans',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <!-- Header -->
        <tr>
          <td style="background:#0a0a0a;padding:28px 40px;text-align:center">
            <p style="margin:0;color:#FFB81C;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase">South African Coin Collectors Club</p>
          </td>
        </tr>

        <!-- Gold bar -->
        <tr><td style="height:4px;background:#FFB81C"></td></tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px">
            <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#0a0a0a">Welcome to SACCC, ${app.first_name}!</h1>
            <p style="margin:0 0 28px;color:#525252;font-size:15px;line-height:1.6">
              Your membership application has been approved. Below are your login credentials to access the Members Forum and all club benefits.
            </p>

            <!-- Credentials box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;border-radius:10px;margin-bottom:28px">
              <tr>
                <td style="padding:20px 24px">
                  <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#a3a3a3">Your Login Details</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;border-bottom:1px solid #e5e5e5;font-size:13px;color:#525252;width:80px">Email</td>
                      <td style="padding:6px 0;border-bottom:1px solid #e5e5e5;font-size:14px;color:#0a0a0a;font-weight:600">${app.email}</td>
                    </tr>
                    <tr>
                      <td style="padding:10px 0 6px;font-size:13px;color:#525252">Password</td>
                      <td style="padding:10px 0 6px">
                        <code style="font-family:monospace;font-size:15px;font-weight:700;color:#007749;background:#e8f5ef;padding:4px 0;border-radius:5px;letter-spacing:0.04em">${password}</code>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 24px;color:#525252;font-size:14px;line-height:1.6">
              We recommend changing your password after your first login. Keep these details safe.
            </p>

            <!-- CTA button -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:32px">
              <tr>
                <td style="background:#007749;border-radius:8px">
                  <a href="${loginUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none">Sign In to the Forum →</a>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#a3a3a3;font-size:13px;line-height:1.6">
              Your membership number: <strong style="color:#525252">${app.reference_number}</strong><br>
              Login at: <a href="${loginUrl}" style="color:#007749">${loginUrl}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #e5e5e5;text-align:center">
            <p style="margin:0;font-size:12px;color:#a3a3a3">South African Coin Collectors Club · coinclub.co.za</p>
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

  const secret = req.headers.get('x-admin-secret')
  if (!secret || secret !== Deno.env.get('ADMIN_SECRET')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { id, action, rejectionReason } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    if (action === 'approve') {
      // Fetch the application
      const { data: app, error: fetchErr } = await supabase
        .from('membership_applications')
        .select('*')
        .eq('id', id)
        .single()
      if (fetchErr) throw fetchErr

      // Guard: if already approved, do nothing
      if (app.status === 'approved') {
        return new Response(
          JSON.stringify({ success: true, already: true }),
          { headers: { ...cors, 'Content-Type': 'application/json' } }
        )
      }

      // Generate membership number: find the highest existing number and increment
      const { data: maxRows } = await supabase
        .from('membership_applications')
        .select('reference_number')
        .eq('status', 'approved')
        .order('reference_number', { ascending: false })
      const usedNums = (maxRows || [])
        .map((r: any) => parseInt(r.reference_number, 10))
        .filter((n: number) => !isNaN(n))
      const highestNum = usedNums.length > 0 ? Math.max(...usedNums) : 99
      const memberRef = String(Math.max(highestNum + 1, 100))

      // Generate password: firstnamesurnamesaccc + random suffix
      const password = generatePassword(app.first_name, app.surname)

      // Create auth user with that password (no invite email)
      // If user already exists (e.g. from a previous invite), update their password instead
      let userId: string
      const { data: userData, error: createErr } = await supabase.auth.admin.createUser({
        email:         app.email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name:     app.first_name,
          surname:        app.surname,
          membership_ref: memberRef,
        },
      })
      if (createErr) {
        // User may already exist — look them up by email and update password
        const { data: listData, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 })
        if (listErr) throw listErr
        const existing = listData.users.find((u: { email: string }) => u.email === app.email)
        if (!existing) throw createErr
        const { error: updateErr } = await supabase.auth.admin.updateUserById(existing.id, { password })
        if (updateErr) throw updateErr
        userId = existing.id
      } else {
        userId = userData.user.id
      }

      // Update application status and set final membership reference FIRST
      const { error: statusErr } = await supabase
        .from('membership_applications')
        .update({
          status:           'approved',
          reviewed_at:      new Date().toISOString(),
          member_id:        userId,
          reference_number: memberRef,
        })
        .eq('id', id)
      if (statusErr) throw new Error(`Status update failed: ${statusErr.message}`)

      // Store membership number directly on the profile for easy lookup
      await supabase
        .from('profiles')
        .update({ membership_number: memberRef })
        .eq('id', userId)

      // Send credentials email via SendGrid
      const sendgridKey = Deno.env.get('SENDGRID_API_KEY')
      const fromEmail   = Deno.env.get('FROM_EMAIL') || 'noreply@coinclub.co.za'
      const siteUrl     = Deno.env.get('SITE_URL') || 'https://www.coinclub.co.za'

      if (sendgridKey) {
        const emailRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sendgridKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: app.email }] }],
            from:    { email: fromEmail, name: 'SACCC' },
            subject: `Welcome to SACCC, ${app.first_name}! - Your Login Details`,
            content: [{ type: 'text/html', value: credentialsEmail({ ...app, reference_number: memberRef }, password, siteUrl) }],
          }),
        })
        if (!emailRes.ok) {
          const errText = await emailRes.text()
          throw new Error(`SendGrid error ${emailRes.status}: ${errText}`)
        }
      } else {
        throw new Error('SENDGRID_API_KEY not configured')
      }

      // Award referral point to the referring member (if any)
      if (app.referral && app.referral_number) {
        const ref = app.referral_number.trim()
        // Try matching by membership number first, then by member_id (UUID fallback)
        const { data: refApp } = await supabase
          .from('membership_applications')
          .select('member_id')
          .eq('reference_number', ref)
          .eq('status', 'approved')
          .maybeSingle()
        const referrerId = refApp?.member_id ||
          (/^[0-9a-f-]{36}$/i.test(ref) ? ref : null)
        if (referrerId) {
          await supabase.rpc('increment_referral_points', { uid: referrerId })
        }
      }

      return new Response(
        JSON.stringify({ success: true, password }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'resend') {
      // Re-send credentials email for an already-approved member
      const { data: app, error: fetchErr } = await supabase
        .from('membership_applications')
        .select('*')
        .eq('id', id)
        .single()
      if (fetchErr) throw fetchErr
      if (app.status !== 'approved') throw new Error('Can only resend for approved applications')
      if (!app.member_id) throw new Error('No member account linked to this application')

      // Generate a new password and update the auth user
      const password = generatePassword(app.first_name, app.surname)
      const { error: updateErr } = await supabase.auth.admin.updateUserById(app.member_id, { password })
      if (updateErr) throw updateErr

      // Send credentials email via SendGrid
      const sendgridKey = Deno.env.get('SENDGRID_API_KEY')
      const fromEmail   = Deno.env.get('FROM_EMAIL') || 'noreply@coinclub.co.za'
      const siteUrl     = Deno.env.get('SITE_URL') || 'https://www.coinclub.co.za'

      if (!sendgridKey) throw new Error('SENDGRID_API_KEY not configured')

      const emailRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: app.email }] }],
          from:    { email: fromEmail, name: 'SACCC' },
          subject: `Welcome to SACCC, ${app.first_name}! - Your Login Details`,
          content: [{ type: 'text/html', value: credentialsEmail({ ...app, reference_number: app.reference_number }, password, siteUrl) }],
        }),
      })
      if (!emailRes.ok) {
        const errText = await emailRes.text()
        throw new Error(`SendGrid error ${emailRes.status}: ${errText}`)
      }

      return new Response(
        JSON.stringify({ success: true, password }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'remind') {
      const { data: app, error: fetchErr } = await supabase
        .from('membership_applications')
        .select('*')
        .eq('id', id)
        .single()
      if (fetchErr) throw fetchErr
      if (app.status !== 'pending') throw new Error('Can only send reminders for pending applications')

      const sendgridKey = Deno.env.get('SENDGRID_API_KEY')
      const fromEmail   = Deno.env.get('FROM_EMAIL') || 'noreply@coinclub.co.za'
      const siteUrl     = Deno.env.get('SITE_URL') || 'https://www.coinclub.co.za'

      if (!sendgridKey) throw new Error('SENDGRID_API_KEY not configured')

      const reminderHtml = `
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
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0a0a0a">Hi ${app.first_name}, we noticed you haven't completed your membership yet!</h1>
            <p style="margin:0 0 24px;color:#525252;font-size:15px;line-height:1.6">
              Your application to join the South African Coin Collectors Club is still pending. To complete your membership, please make your payment of <strong>R120/year</strong> using the reference below.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;border-radius:10px;margin-bottom:24px">
              <tr>
                <td style="padding:20px 24px">
                  <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#a3a3a3">Payment Details</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;border-bottom:1px solid #e5e5e5;font-size:13px;color:#525252;width:120px">Bank</td>
                      <td style="padding:6px 0;border-bottom:1px solid #e5e5e5;font-size:14px;color:#0a0a0a;font-weight:600">First National Bank</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;border-bottom:1px solid #e5e5e5;font-size:13px;color:#525252">Account Name</td>
                      <td style="padding:6px 0;border-bottom:1px solid #e5e5e5;font-size:14px;color:#0a0a0a;font-weight:600">Numismatic Holdings (PTY) LTD</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;border-bottom:1px solid #e5e5e5;font-size:13px;color:#525252">Account Number</td>
                      <td style="padding:6px 0;border-bottom:1px solid #e5e5e5;font-size:14px;color:#0a0a0a;font-weight:600">63201968625</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#525252">Your Reference</td>
                      <td style="padding:6px 0"><span style="font-family:monospace;font-size:15px;font-weight:700;color:#007749;background:#e8f5ef;padding:4px 10px;border-radius:5px">${app.reference_number}</span></td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#0a0a0a">Here's what you'll receive as a member:</p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:24px">
              <tr><td style="padding:4px 0;font-size:14px;color:#525252">&#8226; Official Membership Certificate in your name</td></tr>
              <tr><td style="padding:4px 0;font-size:14px;color:#525252">&#8226; SACCC Membership Card</td></tr>
              <tr><td style="padding:4px 0;font-size:14px;color:#525252">&#8226; SANGS Pedigree Coin - graded and registered to you</td></tr>
              <tr><td style="padding:4px 0;font-size:14px;color:#525252">&#8226; Hern's Pocket Guide access (App Store & Google Play)</td></tr>
              <tr><td style="padding:4px 0;font-size:14px;color:#525252">&#8226; SANGS Grading Voucher</td></tr>
              <tr><td style="padding:4px 0;font-size:14px;color:#525252">&#8226; Bassani's No Seller's Commission Voucher</td></tr>
              <tr><td style="padding:4px 0;font-size:14px;color:#525252">&#8226; Investment Coin & Bullion Voucher</td></tr>
              <tr><td style="padding:4px 0;font-size:14px;color:#525252">&#8226; Bucks & Gems Voucher</td></tr>
              <tr><td style="padding:4px 0;font-size:14px;color:#525252">&#8226; Coin Conservation Kit</td></tr>
              <tr><td style="padding:4px 0;font-size:14px;color:#525252">&#8226; Access to the Members Forum and community events</td></tr>
            </table>

            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px">
              <tr>
                <td style="background:#007749;border-radius:8px">
                  <a href="${siteUrl}/join" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none">Complete Your Membership</a>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#a3a3a3;font-size:13px;line-height:1.6">
              If you've already made payment, please disregard this email - your membership will be processed shortly.
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

      const emailRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: app.email }] }],
          from:    { email: fromEmail, name: 'SACCC' },
          subject: `${app.first_name}, your SACCC membership is waiting for you!`,
          content: [{ type: 'text/html', value: reminderHtml }],
        }),
      })
      if (!emailRes.ok) {
        const errText = await emailRes.text()
        throw new Error(`SendGrid error ${emailRes.status}: ${errText}`)
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'reject') {
      const { error } = await supabase
        .from('membership_applications')
        .update({
          status:           'rejected',
          rejection_reason: rejectionReason || '',
          reviewed_at:      new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'delete') {
      // Delete the application record (and optionally the auth user)
      const { data: app } = await supabase
        .from('membership_applications')
        .select('member_id')
        .eq('id', id)
        .single()
      if (app?.member_id) {
        await supabase.auth.admin.deleteUser(app.member_id)
      }
      const { error } = await supabase
        .from('membership_applications')
        .delete()
        .eq('id', id)
      if (error) throw error
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  }
})
