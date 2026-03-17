import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateReference(): string {
  const year = new Date().getFullYear()
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return `SACCC-${year}-${code}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const body = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const referenceNumber = generateReference()

    const { error } = await supabase.from('membership_applications').insert({
      reference_number: referenceNumber,
      first_name:       body.firstName,
      surname:          body.surname,
      email:            body.email,
      mobile:           body.mobile,
      whatsapp:         body.whatsapp,
      address:          body.address,
      city:             body.city,
      province:         body.province,
      country:          body.country || 'ZA',
      interests:        body.interests || [],
      referral:         body.referral === 'yes',
      referral_name:    body.referralName || null,
      referral_number:  body.referralNumber || null,
      optionals:        body.optionals || [],
    })

    if (error) throw error

    return new Response(
      JSON.stringify({ referenceNumber }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  }
})
