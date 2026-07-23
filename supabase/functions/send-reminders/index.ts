// Deno Edge Function: process due reminder_jobs (email via owner Gmail, calendar via user tokens)
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_FROM,
// GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CRON_SECRET (optional)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

type Job = {
  id: string
  user_id: string
  channel: 'email' | 'calendar'
  fire_at: string
  payload: Record<string, unknown>
  status: string
}

async function googleAccessToken(refreshToken: string, clientId: string, clientSecret: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Google token refresh failed: ${await res.text()}`)
  const json = await res.json()
  return json.access_token as string
}

function toBase64Url(raw: string) {
  const bytes = new TextEncoder().encode(raw)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sendGmail(accessToken: string, from: string, to: string, subject: string, body: string) {
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ].join('\r\n')

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: toBase64Url(message) }),
  })
  if (!res.ok) throw new Error(`Gmail send failed: ${await res.text()}`)
}

async function createCalendarEvent(
  accessToken: string,
  title: string,
  startIso: string,
  leadMinutes: number,
) {
  const start = new Date(startIso)
  const end = new Date(start.getTime() + 30 * 60 * 1000)
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: `Promptr: ${title}`,
      description: 'Reminder from Promptr',
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: Math.max(0, leadMinutes || 10) }],
      },
    }),
  })
  if (!res.ok) throw new Error(`Calendar create failed: ${await res.text()}`)
  const json = await res.json()
  return json.id as string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const cronSecret = Deno.env.get('CRON_SECRET')
  if (cronSecret && req.headers.get('x-cron-secret') !== cronSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const now = new Date().toISOString()
  const { data: jobs, error } = await supabase
    .from('reminder_jobs')
    .select('*')
    .eq('status', 'pending')
    .lte('fire_at', now)
    .order('fire_at', { ascending: true })
    .limit(40)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const gmailClientId = Deno.env.get('GMAIL_CLIENT_ID') || Deno.env.get('GOOGLE_CLIENT_ID')!
  const gmailClientSecret = Deno.env.get('GMAIL_CLIENT_SECRET') || Deno.env.get('GOOGLE_CLIENT_SECRET')!
  const gmailRefresh = Deno.env.get('GMAIL_REFRESH_TOKEN')!
  const gmailFrom = Deno.env.get('GMAIL_FROM')!
  const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID') || gmailClientId
  const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') || gmailClientSecret

  let sent = 0
  let failed = 0

  for (const job of (jobs || []) as Job[]) {
    try {
      if (job.channel === 'email') {
        const { data: userData } = await supabase.auth.admin.getUserById(job.user_id)
        const to =
          (job.payload.to as string | undefined) ||
          userData.user?.email
        if (!to) throw new Error('No recipient email')

        const access = await googleAccessToken(gmailRefresh, gmailClientId, gmailClientSecret)
        const title = String(job.payload.title || 'Promptr reminder')
        const body =
          String(job.payload.body || '') ||
          `Reminder: ${title}\nScheduled: ${job.payload.scheduled_time || ''} on ${job.payload.plan_date || ''}\n\n— Promptr`

        await sendGmail(access, gmailFrom, to, `Promptr: ${title}`, body)
        await supabase.from('reminder_jobs').update({ status: 'sent', error: null }).eq('id', job.id)
        sent += 1
      } else if (job.channel === 'calendar') {
        const { data: tokenRow } = await supabase
          .from('google_tokens')
          .select('*')
          .eq('user_id', job.user_id)
          .maybeSingle()
        if (!tokenRow?.refresh_token) throw new Error('Google Calendar not connected')

        const access = await googleAccessToken(tokenRow.refresh_token, googleClientId, googleClientSecret)
        const eventId = await createCalendarEvent(
          access,
          String(job.payload.title || 'Checklist'),
          job.fire_at,
          Number(job.payload.lead_minutes || 10),
        )
        await supabase
          .from('reminder_jobs')
          .update({ status: 'sent', calendar_event_id: eventId, error: null })
          .eq('id', job.id)
        sent += 1
      }
    } catch (e) {
      failed += 1
      await supabase
        .from('reminder_jobs')
        .update({ status: 'failed', error: e instanceof Error ? e.message : String(e) })
        .eq('id', job.id)
    }
  }

  return new Response(JSON.stringify({ processed: (jobs || []).length, sent, failed }), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
})
