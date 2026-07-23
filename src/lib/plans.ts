import type { DailyPlan, DailyPlanItem, PlanItemStatus } from './database.types'
import { supabase } from './supabase'
import { scheduleRemindersForItem } from './reminders'

export type PlanWithItems = DailyPlan & { items: DailyPlanItem[] }

function todayISODate(timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || undefined,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

export { todayISODate }

export async function getOrCreatePlan(userId: string, planDate: string): Promise<DailyPlan> {
  const existing = await supabase
    .from('daily_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('plan_date', planDate)
    .maybeSingle()

  if (existing.error) throw existing.error
  if (existing.data) return existing.data as DailyPlan

  const { data, error } = await supabase
    .from('daily_plans')
    .insert({ user_id: userId, plan_date: planDate })
    .select()
    .single()

  if (error) throw error
  return data as DailyPlan
}

export async function fetchPlanWithItems(userId: string, planDate: string): Promise<PlanWithItems> {
  const plan = await getOrCreatePlan(userId, planDate)
  const { data, error } = await supabase
    .from('daily_plan_items')
    .select('*')
    .eq('plan_id', plan.id)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return { ...plan, items: (data || []) as DailyPlanItem[] }
}

export async function addPlanItem(input: {
  userId: string
  planId: string
  planDate: string
  timezone: string
  title: string
  checklistId?: string | null
  presetId?: string | null
  scheduledTime?: string | null
  sortOrder: number
  emailEnabled: boolean
  calendarEnabled: boolean
  leadMinutes: number
}): Promise<DailyPlanItem> {
  const { data, error } = await supabase
    .from('daily_plan_items')
    .insert({
      plan_id: input.planId,
      user_id: input.userId,
      title: input.title,
      checklist_id: input.checklistId ?? null,
      preset_id: input.presetId ?? null,
      scheduled_time: input.scheduledTime ?? null,
      sort_order: input.sortOrder,
    })
    .select()
    .single()

  if (error) throw error
  const item = data as DailyPlanItem

  if (item.scheduled_time) {
    await scheduleRemindersForItem({
      userId: input.userId,
      planItem: item,
      planDate: input.planDate,
      timezone: input.timezone,
      emailEnabled: input.emailEnabled,
      calendarEnabled: input.calendarEnabled,
      leadMinutes: input.leadMinutes,
    })
  }

  return item
}

export async function updatePlanItemStatus(id: string, status: PlanItemStatus): Promise<void> {
  const { error } = await supabase.from('daily_plan_items').update({ status }).eq('id', id)
  if (error) throw error
}

export async function updatePlanItemTime(input: {
  item: DailyPlanItem
  scheduledTime: string | null
  planDate: string
  timezone: string
  emailEnabled: boolean
  calendarEnabled: boolean
  leadMinutes: number
}): Promise<DailyPlanItem> {
  const { data, error } = await supabase
    .from('daily_plan_items')
    .update({ scheduled_time: input.scheduledTime })
    .eq('id', input.item.id)
    .select()
    .single()

  if (error) throw error
  const item = data as DailyPlanItem

  await supabase
    .from('reminder_jobs')
    .update({ status: 'cancelled' })
    .eq('plan_item_id', input.item.id)
    .eq('status', 'pending')

  if (item.scheduled_time) {
    await scheduleRemindersForItem({
      userId: item.user_id,
      planItem: item,
      planDate: input.planDate,
      timezone: input.timezone,
      emailEnabled: input.emailEnabled,
      calendarEnabled: input.calendarEnabled,
      leadMinutes: input.leadMinutes,
    })
  }

  return item
}

export async function removePlanItem(id: string): Promise<void> {
  await supabase
    .from('reminder_jobs')
    .update({ status: 'cancelled' })
    .eq('plan_item_id', id)
    .eq('status', 'pending')

  const { error } = await supabase.from('daily_plan_items').delete().eq('id', id)
  if (error) throw error
}

export async function updatePlanNotes(planId: string, notes: string): Promise<void> {
  const { error } = await supabase.from('daily_plans').update({ notes }).eq('id', planId)
  if (error) throw error
}
