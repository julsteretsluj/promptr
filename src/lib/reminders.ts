import type { DailyPlanItem, ReminderSettings } from './database.types'
import { supabase } from './supabase'

export async function fetchReminderSettings(userId: string): Promise<ReminderSettings> {
  const { data, error } = await supabase
    .from('reminder_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (data) return data as ReminderSettings

  const { data: created, error: insertError } = await supabase
    .from('reminder_settings')
    .insert({ user_id: userId })
    .select()
    .single()

  if (insertError) throw insertError
  return created as ReminderSettings
}

export async function updateReminderSettings(
  userId: string,
  patch: Partial<Pick<ReminderSettings, 'email_enabled' | 'calendar_enabled' | 'lead_minutes'>>,
): Promise<ReminderSettings> {
  const { data, error } = await supabase
    .from('reminder_settings')
    .update(patch)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data as ReminderSettings
}

/** Build a Date for plan_date + scheduled_time in the user's timezone. */
export function fireAtFromPlan(
  planDate: string,
  scheduledTime: string,
  timezone: string,
  leadMinutes: number,
): Date {
  const [year, month, day] = planDate.split('-').map(Number)
  const [hh, mm] = scheduledTime.split(':').map(Number)

  const utcGuess = new Date(Date.UTC(year, month - 1, day, hh, mm, 0))
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(utcGuess)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value || 0)
  const asLocal = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour') % 24,
    get('minute'),
    get('second'),
  )
  const offsetMs = asLocal - utcGuess.getTime()
  const actualUtc = new Date(utcGuess.getTime() - offsetMs)
  actualUtc.setMinutes(actualUtc.getMinutes() - leadMinutes)
  return actualUtc
}

export async function scheduleRemindersForItem(input: {
  userId: string
  planItem: DailyPlanItem
  planDate: string
  timezone: string
  emailEnabled: boolean
  calendarEnabled: boolean
  leadMinutes: number
}): Promise<void> {
  if (!input.planItem.scheduled_time) return

  const fireAt = fireAtFromPlan(
    input.planDate,
    input.planItem.scheduled_time,
    input.timezone,
    input.leadMinutes,
  ).toISOString()

  const payload = {
    title: input.planItem.title,
    plan_date: input.planDate,
    scheduled_time: input.planItem.scheduled_time,
    lead_minutes: input.leadMinutes,
  }

  const rows: Record<string, unknown>[] = []
  if (input.emailEnabled) {
    rows.push({
      user_id: input.userId,
      plan_item_id: input.planItem.id,
      channel: 'email',
      fire_at: fireAt,
      payload,
      status: 'pending',
    })
  }
  if (input.calendarEnabled) {
    const eventAt = fireAtFromPlan(
      input.planDate,
      input.planItem.scheduled_time,
      input.timezone,
      0,
    ).toISOString()
    rows.push({
      user_id: input.userId,
      plan_item_id: input.planItem.id,
      channel: 'calendar',
      fire_at: eventAt,
      payload: { ...payload, lead_minutes: 0 },
      status: 'pending',
    })
  }

  if (rows.length === 0) return
  const { error } = await supabase.from('reminder_jobs').insert(rows)
  if (error) throw error
}

export async function queueTestEmail(userId: string, email: string): Promise<void> {
  const { error } = await supabase.from('reminder_jobs').insert({
    user_id: userId,
    channel: 'email',
    fire_at: new Date().toISOString(),
    payload: {
      title: 'Promptr test reminder',
      test: true,
      to: email,
      body: 'This is a test reminder from Promptr. Your email reminders are working.',
    },
    status: 'pending',
  })
  if (error) throw error
}

export async function hasGoogleCalendarConnected(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('google_tokens')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return Boolean(data)
}

export async function saveGoogleRefreshToken(input: {
  userId: string
  refreshToken: string
  accessToken?: string
  expiresAt?: string
  scope?: string
}): Promise<void> {
  const { error } = await supabase.from('google_tokens').upsert({
    user_id: input.userId,
    refresh_token: input.refreshToken,
    access_token: input.accessToken ?? null,
    expires_at: input.expiresAt ?? null,
    scope: input.scope ?? null,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}
